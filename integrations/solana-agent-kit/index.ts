/**
 * SOLPRISM × solana-agent-kit
 *
 * Drop-in integration that adds verifiable AI reasoning to any
 * solana-agent-kit powered agent.
 *
 * Provides three LangChain-compatible tools:
 *   1. **solprism_commit_reasoning** — Hash and commit reasoning onchain
 *   2. **solprism_reveal_reasoning** — Reveal the full reasoning via URI
 *   3. **solprism_verify_reasoning** — Verify reasoning against a commitment
 *
 * Plus a solana-agent-kit Plugin and Action definitions for native
 * integration with `SolanaAgentKit.use()` and `createLangchainTools()`.
 *
 * @example
 * ```ts
 * import { Connection, Keypair } from "@solana/web3.js";
 * import { createSolprismTools, createSolprismPlugin } from "@solprism/solana-agent-kit";
 *
 * const connection = new Connection("https://api.devnet.solana.com");
 * const wallet = Keypair.fromSecretKey(...);
 *
 * // Option A: Standalone LangChain tools
 * const tools = createSolprismTools(connection, wallet);
 *
 * // Option B: solana-agent-kit plugin
 * const agent = new SolanaAgentKit(wallet, rpcUrl, config);
 * agent.use(createSolprismPlugin(connection, wallet));
 * ```
 *
 * @packageDocumentation
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { z } from "zod/v3";

// ─── Re-exports ─────────────────────────────────────────────────────────────

export {
  SolprismCommitReasoningTool,
  SOLPRISM_PROGRAM_ID,
  type CommitReasoningInput,
  type CommitReasoningOutput,
} from "./solprism-tool";

export {
  SolprismRevealReasoningTool,
  type RevealReasoningInput,
  type RevealReasoningOutput,
} from "./solprism-reveal-tool";

export {
  SolprismVerifyReasoningTool,
  type VerifyReasoningInput,
  type VerifyReasoningOutput,
  type OnChainCommitmentData,
} from "./solprism-verify-tool";

// ─── Tool imports (for factory) ─────────────────────────────────────────────

import { SolprismCommitReasoningTool } from "./solprism-tool";
import { SolprismRevealReasoningTool } from "./solprism-reveal-tool";
import { SolprismVerifyReasoningTool } from "./solprism-verify-tool";

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create all three SOLPRISM LangChain tools in one call.
 *
 * @param connection - Solana RPC connection
 * @param wallet     - Agent's signing keypair
 * @param programId  - Optional: custom program ID (defaults to mainnet/devnet)
 * @returns Array of [commit, reveal, verify] tools
 */
export function createSolprismTools(
  connection: Connection,
  wallet: Keypair,
  programId?: PublicKey,
): [
  SolprismCommitReasoningTool,
  SolprismRevealReasoningTool,
  SolprismVerifyReasoningTool,
] {
  const pid = programId ?? new PublicKey(
    "CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu",
  );
  return [
    new SolprismCommitReasoningTool(connection, wallet, pid),
    new SolprismRevealReasoningTool(connection, wallet, pid),
    new SolprismVerifyReasoningTool(connection),
  ];
}

// ─── solana-agent-kit Action definitions ────────────────────────────────────

/**
 * SOLPRISM Actions for use with solana-agent-kit's `createLangchainTools()`
 * and `executeAction()` system.
 *
 * These conform to the Action interface from solana-agent-kit v2.x.
 */
export function createSolprismActions(
  connection: Connection,
  wallet: Keypair,
  programId?: PublicKey,
) {
  const [commitTool, revealTool, verifyTool] = createSolprismTools(
    connection,
    wallet,
    programId,
  );

  const commitAction = {
    name: "SOLPRISM_COMMIT_REASONING",
    similes: [
      "commit reasoning",
      "hash reasoning onchain",
      "solprism commit",
      "commit ai reasoning",
      "publish reasoning hash",
    ],
    description:
      "Commit a SHA-256 hash of AI reasoning onchain via the SOLPRISM protocol " +
      "before executing an action. This is step 1 of the verifiable reasoning flow: " +
      "Commit → Execute → Reveal → Verify.",
    examples: [
      [
        {
          input: {
            reasoning: "SOL price showing bullish divergence on 4h chart, swap 10 SOL to USDC",
            action: "trade",
            confidence: 85,
          },
          output: {
            signature: "5x7Y...",
            commitmentAddress: "9abc...",
            commitmentHash: "a1b2c3...",
            nonce: 0,
          },
          explanation:
            "Commits a hash of the trading reasoning onchain before executing the swap.",
        },
      ],
    ],
    schema: z.object({
      reasoning: z
        .union([z.string(), z.record(z.unknown())])
        .describe("The reasoning trace to commit (string or JSON object)"),
      action: z
        .string()
        .optional()
        .describe("Action type (trade, audit, decision, etc.)"),
      confidence: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Confidence level 0-100"),
      agentName: z
        .string()
        .optional()
        .describe("Agent name for auto-registration"),
    }),
    handler: async (_agent: any, input: Record<string, any>) => {
      const result = await commitTool.invoke(JSON.stringify(input) as any);
      return JSON.parse(result as string);
    },
  };

  const revealAction = {
    name: "SOLPRISM_REVEAL_REASONING",
    similes: [
      "reveal reasoning",
      "solprism reveal",
      "publish reasoning",
      "disclose reasoning",
    ],
    description:
      "Reveal the full reasoning for a previously committed SOLPRISM hash " +
      "by attaching a URI pointing to the full trace. Step 3 of: " +
      "Commit → Execute → Reveal → Verify.",
    examples: [
      [
        {
          input: {
            commitmentAddress: "9abc...",
            reasoningUri: "ipfs://QmXyz...",
          },
          output: {
            signature: "3k8P...",
            commitmentAddress: "9abc...",
            reasoningUri: "ipfs://QmXyz...",
          },
          explanation:
            "Reveals the full reasoning by linking it to the onchain commitment.",
        },
      ],
    ],
    schema: z.object({
      commitmentAddress: z
        .string()
        .describe("Base58 address of the commitment PDA"),
      reasoningUri: z
        .string()
        .describe("URI where full reasoning is stored (ipfs://, ar://, https://)"),
    }),
    handler: async (_agent: any, input: Record<string, any>) => {
      const result = await revealTool.invoke(JSON.stringify(input) as any);
      return JSON.parse(result as string);
    },
  };

  const verifyAction = {
    name: "SOLPRISM_VERIFY_REASONING",
    similes: [
      "verify reasoning",
      "solprism verify",
      "check reasoning hash",
      "validate reasoning",
    ],
    description:
      "Verify that a reasoning trace matches an onchain SOLPRISM commitment. " +
      "This is the core trust operation — no wallet needed. Step 4 of: " +
      "Commit → Execute → Reveal → Verify.",
    examples: [
      [
        {
          input: {
            commitmentAddress: "9abc...",
            reasoning: "SOL price showing bullish divergence...",
          },
          output: {
            valid: true,
            computedHash: "a1b2c3...",
            storedHash: "a1b2c3...",
            message: "✅ Verified — reasoning matches the onchain commitment.",
          },
          explanation:
            "Checks that the provided reasoning hashes to the same value stored onchain.",
        },
      ],
    ],
    schema: z.object({
      commitmentAddress: z
        .string()
        .describe("Base58 address of the commitment PDA"),
      reasoning: z
        .union([z.string(), z.record(z.unknown())])
        .describe("The reasoning trace to verify against the commitment"),
    }),
    handler: async (_agent: any, input: Record<string, any>) => {
      const result = await verifyTool.invoke(JSON.stringify(input) as any);
      return JSON.parse(result as string);
    },
  };

  return [commitAction, revealAction, verifyAction];
}

// ─── solana-agent-kit Plugin ────────────────────────────────────────────────

/**
 * Create a SOLPRISM plugin for solana-agent-kit's `.use()` system.
 *
 * @example
 * ```ts
 * import { SolanaAgentKit } from "solana-agent-kit";
 * import { createSolprismPlugin } from "@solprism/solana-agent-kit";
 *
 * const agent = new SolanaAgentKit(wallet, rpcUrl, config);
 * const enhanced = agent.use(createSolprismPlugin(connection, wallet));
 *
 * // Now accessible via enhanced.methods
 * await enhanced.methods.commitReasoning("My reasoning...", "trade", 90);
 * await enhanced.methods.revealReasoning("9abc...", "ipfs://...");
 * const result = await enhanced.methods.verifyReasoning("9abc...", "My reasoning...");
 * ```
 */
export function createSolprismPlugin(
  connection: Connection,
  wallet: Keypair,
  programId?: PublicKey,
) {
  const [commitTool, revealTool, verifyTool] = createSolprismTools(
    connection,
    wallet,
    programId,
  );

  const actions = createSolprismActions(connection, wallet, programId);

  return {
    name: "solprism",
    methods: {
      /**
       * Commit reasoning onchain. Returns commitment address and tx sig.
       */
      commitReasoning: async (
        reasoning: string | Record<string, unknown>,
        action?: string,
        confidence?: number,
        agentName?: string,
      ) => {
        const result = await commitTool.invoke(
          JSON.stringify({ reasoning, action, confidence, agentName }) as any,
        );
        return JSON.parse(result as string);
      },

      /**
       * Reveal reasoning by attaching a URI to a commitment.
       */
      revealReasoning: async (
        commitmentAddress: string,
        reasoningUri: string,
      ) => {
        const result = await revealTool.invoke(
          JSON.stringify({ commitmentAddress, reasoningUri }) as any,
        );
        return JSON.parse(result as string);
      },

      /**
       * Verify reasoning against an onchain commitment.
       */
      verifyReasoning: async (
        commitmentAddress: string,
        reasoning: string | Record<string, unknown>,
      ) => {
        const result = await verifyTool.invoke(
          JSON.stringify({ commitmentAddress, reasoning }) as any,
        );
        return JSON.parse(result as string);
      },
    },
    actions,
    initialize: (_agent: any) => {
      // No additional initialization needed —
      // tools are constructed with their own connection + wallet.
    },
  };
}
