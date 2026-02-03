/**
 * SOLPRISM × solana-agent-kit — Verify Reasoning Tool
 *
 * LangChain-compatible tool that verifies a reasoning trace against an
 * onchain SOLPRISM commitment. Anyone can call this — it's the core
 * trust operation: fetch the commitment from chain, hash the provided
 * reasoning, and check they match.
 *
 * @example
 * ```ts
 * const tool = new SolprismVerifyReasoningTool(connection);
 * const result = await tool.call(JSON.stringify({
 *   commitmentAddress: "9abc...",
 *   reasoning: { ... },
 * }));
 * ```
 */

import { createHash } from "crypto";
import { Connection, PublicKey } from "@solana/web3.js";
import { Tool } from "@langchain/core/tools";

// ─── Constants ──────────────────────────────────────────────────────────────

export const SOLPRISM_PROGRAM_ID = new PublicKey(
  "CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu",
);

/** Account discriminator for ReasoningCommitment */
const COMMITMENT_DISCRIMINATOR = Buffer.from([
  67, 22, 65, 98, 26, 124, 5, 25,
]);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VerifyReasoningInput {
  /** Base-58 address of the onchain commitment account */
  commitmentAddress: string;
  /** The reasoning trace to verify (string or object) */
  reasoning: string | Record<string, unknown>;
}

export interface OnChainCommitmentData {
  agent: string;
  authority: string;
  commitmentHash: string;
  actionType: string;
  confidence: number;
  timestamp: number;
  revealed: boolean;
  reasoningUri: string | null;
}

export interface VerifyReasoningOutput {
  /** Whether the hash matches */
  valid: boolean;
  /** SHA-256 hash computed from the provided reasoning */
  computedHash: string;
  /** Hash stored onchain */
  storedHash: string;
  /** The deserialized onchain commitment */
  commitment: OnChainCommitmentData | null;
  /** Human-readable message */
  message: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sortKeys(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(sortKeys);
  if (typeof val === "object") {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(val as Record<string, unknown>).sort()) {
      sorted[k] = sortKeys((val as Record<string, unknown>)[k]);
    }
    return sorted;
  }
  return val;
}

function hashReasoning(input: string | Record<string, unknown>): string {
  const obj = typeof input === "string" ? JSON.parse(input) : input;
  const canonical = JSON.stringify(sortKeys(obj));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

function readBorshString(
  data: Buffer,
  offset: number,
): [string, number] {
  const len = data.readUInt32LE(offset);
  const str = data.slice(offset + 4, offset + 4 + len).toString("utf-8");
  return [str, offset + 4 + len];
}

/**
 * Deserialize a ReasoningCommitment account from raw bytes.
 */
function deserializeCommitment(data: Buffer): OnChainCommitmentData {
  let offset = 8; // skip discriminator

  // agent: Pubkey (32 bytes)
  const agent = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // authority: Pubkey (32 bytes)
  const authority = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // commitment_hash: [u8; 32]
  const commitmentHash = Buffer.from(data.slice(offset, offset + 32)).toString(
    "hex",
  );
  offset += 32;

  // action_type: String
  const [actionType, atEnd] = readBorshString(data, offset);
  offset = atEnd;

  // confidence: u8
  const confidence = data[offset];
  offset += 1;

  // timestamp: i64
  const timestamp = Number(data.readBigInt64LE(offset));
  offset += 8;

  // revealed: bool
  const revealed = data[offset] === 1;
  offset += 1;

  // reasoning_uri: String
  const [reasoningUri, ruEnd] = readBorshString(data, offset);
  offset = ruEnd;

  return {
    agent,
    authority,
    commitmentHash,
    actionType,
    confidence,
    timestamp,
    revealed,
    reasoningUri: reasoningUri || null,
  };
}

/**
 * Constant-time buffer comparison to prevent timing attacks.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Tool ───────────────────────────────────────────────────────────────────

/**
 * LangChain tool that verifies a reasoning trace against an onchain
 * SOLPRISM commitment.
 *
 * **Input:** JSON string with `commitmentAddress` and `reasoning`.
 *
 * **Output:** JSON string with `valid` boolean, hashes, commitment data,
 * and a human-readable message.
 *
 * No wallet is required — verification is read-only.
 */
export class SolprismVerifyReasoningTool extends Tool {
  name = "solprism_verify_reasoning";

  description =
    "Verify that a reasoning trace matches an onchain SOLPRISM commitment. " +
    "Input is a JSON string with: commitmentAddress (base58 string), " +
    "reasoning (the original reasoning string or object). " +
    "Returns whether the hash matches, the computed and stored hashes, " +
    "and the full onchain commitment data.";

  private connection: Connection;

  constructor(connection: Connection) {
    super();
    this.connection = connection;
  }

  /** @internal */
  protected async _call(input: string): Promise<string> {
    try {
      const parsed: VerifyReasoningInput = JSON.parse(input);

      if (!parsed.commitmentAddress) {
        return JSON.stringify({
          valid: false,
          computedHash: "",
          storedHash: "",
          commitment: null,
          message: "Missing required field: commitmentAddress",
        } satisfies VerifyReasoningOutput);
      }

      if (!parsed.reasoning) {
        return JSON.stringify({
          valid: false,
          computedHash: "",
          storedHash: "",
          commitment: null,
          message: "Missing required field: reasoning",
        } satisfies VerifyReasoningOutput);
      }

      // 1. Fetch the onchain account
      const commitPubkey = new PublicKey(parsed.commitmentAddress);
      const accountInfo = await this.connection.getAccountInfo(commitPubkey);

      if (!accountInfo?.data || accountInfo.data.length < 8) {
        const computedHash = hashReasoning(parsed.reasoning);
        return JSON.stringify({
          valid: false,
          computedHash,
          storedHash: "",
          commitment: null,
          message:
            "Commitment account not found onchain. " +
            "It may not exist or may have been closed.",
        } satisfies VerifyReasoningOutput);
      }

      // 2. Validate discriminator
      if (
        !Buffer.from(accountInfo.data.slice(0, 8)).equals(
          COMMITMENT_DISCRIMINATOR,
        )
      ) {
        return JSON.stringify({
          valid: false,
          computedHash: "",
          storedHash: "",
          commitment: null,
          message:
            "Account exists but is not a SOLPRISM ReasoningCommitment.",
        } satisfies VerifyReasoningOutput);
      }

      // 3. Deserialize
      const commitment = deserializeCommitment(
        Buffer.from(accountInfo.data),
      );

      // 4. Compute hash of provided reasoning
      const computedHash = hashReasoning(parsed.reasoning);

      // 5. Compare (constant-time)
      const valid = constantTimeEqual(computedHash, commitment.commitmentHash);

      const result: VerifyReasoningOutput = {
        valid,
        computedHash,
        storedHash: commitment.commitmentHash,
        commitment,
        message: valid
          ? "✅ Verified — reasoning matches the onchain commitment."
          : "❌ Mismatch — the provided reasoning does not match the onchain commitment hash.",
      };

      return JSON.stringify(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        valid: false,
        computedHash: "",
        storedHash: "",
        commitment: null,
        message: `Verification failed: ${message}`,
      } satisfies VerifyReasoningOutput);
    }
  }
}
