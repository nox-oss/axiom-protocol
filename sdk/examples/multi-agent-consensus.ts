/**
 * SOLPRISM × SolanaYield Multi-Agent Consensus Example
 * 
 * Shows how multiple agents can commit their individual reasoning
 * BEFORE seeing each other's analysis, then reveal after consensus.
 * Proves independence of thought — like sealed-bid auctions.
 * 
 * @see https://solana-yield.vercel.app
 */

import { SolprismClient, createReasoningTrace } from "../src";
import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ─── Multi-Agent Sealed Reasoning ───────────────────────────────────────

interface AgentOpinion {
  agentName: string;
  wallet: Keypair;
  recommendation: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  dataSources: string[];
}

/**
 * Phase 1: Each agent commits their reasoning independently.
 * No agent sees another's reasoning until all have committed.
 */
async function sealedCommitPhase(
  client: SolprismClient,
  opinions: AgentOpinion[]
) {
  console.log("=== Phase 1: Sealed Commit (independent reasoning) ===\n");

  const commitments = [];

  for (const opinion of opinions) {
    const trace = createReasoningTrace({
      agent: opinion.agentName,
      action: {
        type: "decision",
        description: `${opinion.recommendation.toUpperCase()} recommendation for SOL/USDC`,
      },
      inputs: {
        dataSources: opinion.dataSources.map((ds) => ({
          name: ds,
          type: "api" as const,
          queriedAt: new Date().toISOString(),
        })),
        context: "Multi-agent consensus: independent analysis phase",
      },
      analysis: {
        observations: [opinion.reasoning],
        logic: `Independent analysis recommends ${opinion.recommendation} with ${opinion.confidence}% confidence`,
        alternativesConsidered: [
          {
            action: opinion.recommendation === "buy" ? "sell" : "buy",
            reasonRejected: "Counter-signal not supported by data",
          },
        ],
      },
      decision: {
        actionChosen: opinion.recommendation,
        confidence: opinion.confidence,
        riskAssessment: opinion.confidence > 70 ? "low" : "medium",
        expectedOutcome: `${opinion.recommendation} position based on independent analysis`,
      },
      metadata: {
        custom: {
          consensusPhase: "sealed-commit",
          agentIndex: opinions.indexOf(opinion),
        },
      },
    });

    // Register agent if needed
    const isRegistered = await client.isAgentRegistered(opinion.wallet.publicKey);
    if (!isRegistered) {
      await client.registerAgent(opinion.wallet, opinion.agentName);
    }

    // Commit — hash is onchain, reasoning is sealed
    const result = await client.commitReasoning(opinion.wallet, trace);
    console.log(`  ${opinion.agentName}: committed (${result.commitmentAddress.slice(0, 12)}...)`);

    commitments.push({ opinion, trace, result });
  }

  return commitments;
}

/**
 * Phase 2: After consensus is reached, all agents reveal.
 * Proves each agent's reasoning was independent.
 */
async function revealPhase(
  client: SolprismClient,
  commitments: Array<{
    opinion: AgentOpinion;
    trace: ReturnType<typeof createReasoningTrace>;
    result: { commitmentAddress: string };
  }>
) {
  console.log("\n=== Phase 2: Reveal (verify independence) ===\n");

  for (const { opinion, result } of commitments) {
    const uri = `https://solana-yield.vercel.app/api/consensus/${result.commitmentAddress}`;
    await client.revealReasoning(opinion.wallet, result.commitmentAddress, uri);
    console.log(`  ${opinion.agentName}: revealed — ${opinion.recommendation} (${opinion.confidence}%)`);
  }

  // Tally
  const tally = { buy: 0, sell: 0, hold: 0 };
  let totalConfidence = 0;
  for (const { opinion } of commitments) {
    tally[opinion.recommendation]++;
    totalConfidence += opinion.confidence;
  }

  const consensus = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  const avgConfidence = Math.round(totalConfidence / commitments.length);

  console.log(`\n  Consensus: ${consensus[0].toUpperCase()} (${consensus[1]}/${commitments.length} agents)`);
  console.log(`  Average confidence: ${avgConfidence}%`);
  console.log(`  All reasoning hashes committed BEFORE consensus — independence verified.`);

  return { consensus: consensus[0], votes: consensus[1], avgConfidence };
}

// ─── Example: 5 Agents Debate SOL/USDC ──────────────────────────────────

async function runConsensus() {
  const client = new SolprismClient("https://api.devnet.solana.com");
  const conn = new Connection("https://api.devnet.solana.com");

  // 5 agents with different data sources and opinions
  const opinions: AgentOpinion[] = [
    {
      agentName: "TechnicalAnalyst",
      wallet: Keypair.generate(),
      recommendation: "sell",
      confidence: 78,
      reasoning: "RSI overbought at 74, bearish divergence on 4H chart",
      dataSources: ["TradingView RSI", "Volume profile"],
    },
    {
      agentName: "FundamentalAnalyst",
      wallet: Keypair.generate(),
      recommendation: "buy",
      confidence: 82,
      reasoning: "Network activity at ATH, fee revenue growing 15% MoM",
      dataSources: ["Solana Explorer", "DeFiLlama TVL"],
    },
    {
      agentName: "SentimentAnalyst",
      wallet: Keypair.generate(),
      recommendation: "buy",
      confidence: 65,
      reasoning: "Social volume positive but not euphoric, healthy sentiment",
      dataSources: ["LunarCrush", "Twitter sentiment API"],
    },
    {
      agentName: "RiskManager",
      wallet: Keypair.generate(),
      recommendation: "hold",
      confidence: 88,
      reasoning: "Portfolio already at target allocation, no rebalance needed",
      dataSources: ["Portfolio tracker", "Risk model v3"],
    },
    {
      agentName: "MacroAnalyst",
      wallet: Keypair.generate(),
      recommendation: "buy",
      confidence: 71,
      reasoning: "Fed signaling rate cuts, risk assets historically rally",
      dataSources: ["Fed minutes", "Bond yield data", "Historical correlations"],
    },
  ];

  // Fund wallets (devnet)
  for (const o of opinions) {
    await conn.requestAirdrop(o.wallet.publicKey, LAMPORTS_PER_SOL);
  }
  await new Promise((r) => setTimeout(r, 3000));

  // Execute sealed consensus protocol
  const commitments = await sealedCommitPhase(client, opinions);
  const result = await revealPhase(client, commitments);

  console.log(`\nAll reasoning is onchain and verifiable.`);
  console.log(`Explorer: http://localhost:3000`);
}
