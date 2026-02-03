/**
 * SOLPRISM × AutoVault Integration Example
 * 
 * Shows how AutoVault can wrap every yield rebalancing decision
 * in a verifiable reasoning trace. Drop this into your decision cycle.
 * 
 * @see https://github.com/STCisGOOD/autovault
 */

import { SolprismClient, createReasoningTrace } from "../src";
import { Keypair, Connection } from "@solana/web3.js";

// ─── AutoVault Decision Cycle with SOLPRISM ─────────────────────────────

interface YieldData {
  protocol: string;
  apy: number;
  tvl: number;
  riskScore: number;
}

interface RebalanceDecision {
  from: string;
  to: string;
  amount: number;
  reason: string;
  confidence: number;
}

/**
 * Wrap an AutoVault rebalancing decision in a SOLPRISM commitment.
 * Call this BEFORE executing the swap.
 */
async function commitRebalanceDecision(
  client: SolprismClient,
  wallet: Keypair,
  yields: YieldData[],
  decision: RebalanceDecision
) {
  // 1. Create a structured reasoning trace from AutoVault's decision data
  const trace = createReasoningTrace({
    agent: "AutoVault",
    action: {
      type: "rebalance",
      description: `Move ${decision.amount} SOL from ${decision.from} to ${decision.to}`,
    },
    inputs: {
      dataSources: yields.map((y) => ({
        name: `${y.protocol} Yield API`,
        type: "api" as const,
        queriedAt: new Date().toISOString(),
        summary: `APY: ${y.apy}%, TVL: $${(y.tvl / 1e6).toFixed(1)}M, Risk: ${y.riskScore}/100`,
      })),
      context: `Periodic yield optimization check. Evaluating ${yields.length} protocols.`,
    },
    analysis: {
      observations: yields.map(
        (y) => `${y.protocol}: ${y.apy}% APY, risk score ${y.riskScore}/100`
      ),
      logic: decision.reason,
      alternativesConsidered: yields
        .filter((y) => y.protocol !== decision.to)
        .map((y) => ({
          action: `Move to ${y.protocol} (${y.apy}% APY)`,
          reasonRejected:
            y.riskScore > 70
              ? `Risk score too high (${y.riskScore}/100)`
              : `Lower risk-adjusted yield than ${decision.to}`,
        })),
    },
    decision: {
      actionChosen: `Rebalance: ${decision.from} → ${decision.to}`,
      confidence: decision.confidence,
      riskAssessment: decision.confidence > 80 ? "low" : "medium",
      expectedOutcome: `Higher yield with acceptable risk. APY improvement justifies gas costs.`,
    },
    metadata: {
      model: "autovault-v1",
      custom: {
        fromProtocol: decision.from,
        toProtocol: decision.to,
        amountSOL: decision.amount,
      },
    },
  });

  // 2. Commit the reasoning hash BEFORE executing the swap
  const result = await client.commitReasoning(wallet, trace);
  console.log(`[SOLPRISM] Reasoning committed: ${result.commitmentAddress}`);

  // 3. Return the trace and result so AutoVault can reveal after execution
  return { trace, result };
}

/**
 * After the swap executes, reveal the full reasoning.
 */
async function revealAfterExecution(
  client: SolprismClient,
  wallet: Keypair,
  commitmentAddress: string,
  storageUri: string
) {
  const reveal = await client.revealReasoning(wallet, commitmentAddress, storageUri);
  console.log(`[SOLPRISM] Reasoning revealed: ${reveal.signature}`);
  return reveal;
}

// ─── Example Usage ──────────────────────────────────────────────────────

async function autovaultDecisionCycle() {
  const client = new SolprismClient("https://api.devnet.solana.com");
  const wallet = Keypair.generate(); // Use your AutoVault wallet

  // AutoVault fetches yield data (your existing logic)
  const yields: YieldData[] = [
    { protocol: "Marinade", apy: 7.2, tvl: 1_200_000_000, riskScore: 15 },
    { protocol: "Jito", apy: 8.1, tvl: 890_000_000, riskScore: 20 },
    { protocol: "Drift", apy: 9.5, tvl: 340_000_000, riskScore: 55 },
  ];

  // AutoVault makes a decision (your existing logic)
  const decision: RebalanceDecision = {
    from: "Marinade",
    to: "Jito",
    amount: 50,
    reason:
      "Jito offers 0.9% higher APY with similar risk profile. MEV rewards consistent over 30 days.",
    confidence: 85,
  };

  // SOLPRISM: Commit reasoning BEFORE execution
  const { trace, result } = await commitRebalanceDecision(
    client, wallet, yields, decision
  );

  // === YOUR EXISTING SWAP LOGIC GOES HERE ===
  // await executeSwap(decision);
  // ==========================================

  // SOLPRISM: Reveal reasoning AFTER execution
  // Store the trace wherever you want (IPFS, your API, GitHub, etc.)
  const storageUri = "https://autovault-delta.vercel.app/api/traces/" + result.commitmentAddress;
  await revealAfterExecution(client, wallet, result.commitmentAddress, storageUri);
}
