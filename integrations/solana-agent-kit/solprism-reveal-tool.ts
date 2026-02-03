/**
 * SOLPRISM × solana-agent-kit — Reveal Reasoning Tool
 *
 * LangChain-compatible tool that reveals the full reasoning for a
 * previously committed hash. This is step 3 of the
 * Commit → Execute → Reveal → Verify flow.
 *
 * After committing and executing, the agent calls reveal to attach
 * a URI (e.g. IPFS, Arweave, or HTTPS) pointing to the full reasoning
 * trace. This makes it publicly auditable.
 *
 * @example
 * ```ts
 * const tool = new SolprismRevealReasoningTool(connection, wallet);
 * const result = await tool.call(JSON.stringify({
 *   commitmentAddress: "9abc...",
 *   reasoningUri: "ipfs://Qm...",
 * }));
 * ```
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Tool } from "@langchain/core/tools";

// ─── Constants ──────────────────────────────────────────────────────────────

export const SOLPRISM_PROGRAM_ID = new PublicKey(
  "CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu",
);

const DISCRIMINATORS = {
  revealReasoning: Buffer.from([76, 215, 6, 241, 209, 207, 84, 96]),
} as const;

const SEED_AGENT = Buffer.from("agent");

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RevealReasoningInput {
  /** Base-58 address of the commitment account to reveal */
  commitmentAddress: string;
  /**
   * URI where the full reasoning is stored.
   * Common schemes: ipfs://, ar://, https://
   */
  reasoningUri: string;
}

export interface RevealReasoningOutput {
  /** Transaction signature */
  signature: string;
  /** The commitment address that was revealed */
  commitmentAddress: string;
  /** The URI that was attached */
  reasoningUri: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function deriveAgentPDA(
  authority: PublicKey,
  programId: PublicKey = SOLPRISM_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_AGENT, authority.toBuffer()],
    programId,
  );
}

function encodeString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf-8");
  const buf = Buffer.alloc(4 + bytes.length);
  buf.writeUInt32LE(bytes.length, 0);
  bytes.copy(buf, 4);
  return buf;
}

function buildRevealReasoningIx(
  authority: PublicKey,
  commitmentAddress: PublicKey,
  reasoningUri: string,
  programId: PublicKey,
): TransactionInstruction {
  const [agentProfile] = deriveAgentPDA(authority, programId);

  return new TransactionInstruction({
    keys: [
      { pubkey: commitmentAddress, isSigner: false, isWritable: true },
      { pubkey: agentProfile, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    programId,
    data: Buffer.concat([
      DISCRIMINATORS.revealReasoning,
      encodeString(reasoningUri),
    ]),
  });
}

// ─── Tool ───────────────────────────────────────────────────────────────────

/**
 * LangChain tool that reveals the full reasoning for an onchain
 * SOLPRISM commitment by attaching a URI.
 *
 * **Input:** JSON string with `commitmentAddress` (base58) and
 * `reasoningUri` (where the full trace is stored).
 *
 * **Output:** JSON string with the transaction signature and metadata.
 *
 * The reveal transaction can only be sent by the original committer
 * (the wallet whose authority was used in the commit step).
 */
export class SolprismRevealReasoningTool extends Tool {
  name = "solprism_reveal_reasoning";

  description =
    "Reveal the full reasoning for a previously committed SOLPRISM hash. " +
    "Input is a JSON string with: commitmentAddress (base58 string of the " +
    "commitment PDA), reasoningUri (URI where full reasoning is stored, " +
    "e.g. ipfs://..., ar://..., or https://...). " +
    "Returns the transaction signature. Must be called by the original committer.";

  private connection: Connection;
  private wallet: Keypair;
  private programId: PublicKey;

  constructor(
    connection: Connection,
    wallet: Keypair,
    programId: PublicKey = SOLPRISM_PROGRAM_ID,
  ) {
    super();
    this.connection = connection;
    this.wallet = wallet;
    this.programId = programId;
  }

  /** @internal */
  protected async _call(input: string): Promise<string> {
    try {
      const parsed: RevealReasoningInput = JSON.parse(input);

      if (!parsed.commitmentAddress) {
        return JSON.stringify({
          error:
            "Missing required field: commitmentAddress " +
            "(base58 address of the commitment PDA)",
        });
      }

      if (!parsed.reasoningUri) {
        return JSON.stringify({
          error:
            "Missing required field: reasoningUri " +
            "(URI where the full reasoning trace is stored)",
        });
      }

      // Validate the URI has a scheme
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(parsed.reasoningUri)) {
        return JSON.stringify({
          error:
            `Invalid reasoningUri: "${parsed.reasoningUri}". ` +
            "Must include a scheme (e.g. ipfs://, https://, ar://).",
        });
      }

      const commitPubkey = new PublicKey(parsed.commitmentAddress);

      // Verify the commitment account exists before sending
      const accountInfo = await this.connection.getAccountInfo(commitPubkey);
      if (!accountInfo?.data) {
        return JSON.stringify({
          error:
            `Commitment account ${parsed.commitmentAddress} not found onchain. ` +
            "Ensure the address is correct and the commitment was confirmed.",
        });
      }

      // Check if already revealed (revealed flag is at a variable offset,
      // but we can still try the tx — the program will reject with a clear error)

      const ix = buildRevealReasoningIx(
        this.wallet.publicKey,
        commitPubkey,
        parsed.reasoningUri,
        this.programId,
      );

      const tx = new Transaction().add(ix);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        tx,
        [this.wallet],
        { commitment: "confirmed" },
      );

      const result: RevealReasoningOutput = {
        signature,
        commitmentAddress: parsed.commitmentAddress,
        reasoningUri: parsed.reasoningUri,
      };

      return JSON.stringify(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      // Provide helpful context for common errors
      if (message.includes("already been processed")) {
        return JSON.stringify({
          error: "This commitment may have already been revealed.",
        });
      }

      return JSON.stringify({
        error: `Failed to reveal reasoning: ${message}`,
      });
    }
  }
}
