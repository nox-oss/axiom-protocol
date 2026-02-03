/**
 * SOLPRISM Demo — Populate Devnet
 * 
 * Commits several realistic reasoning traces to devnet
 * to showcase the explorer with rich data.
 * 
 * Usage: npx tsx demo/populate-devnet.ts
 */

import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  SolprismClient,
  createReasoningTrace,
  type ReasoningTrace,
} from "../src";
import * as fs from "fs";
import * as path from "path";

const RPC = "https://api.devnet.solana.com";

// Load the devnet wallet
const walletPath = path.resolve(
  process.env.HOME || "~",
  ".config/solana/axiom-devnet.json"
);
const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
const wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));

const client = new SolprismClient(RPC);

// ─── Realistic Reasoning Traces ─────────────────────────────────────────

const traces: ReasoningTrace[] = [
  createReasoningTrace({
    agent: "Mereum",
    action: {
      type: "trade",
      description: "Swap 2 SOL for USDC via Jupiter aggregator",
    },
    inputs: {
      dataSources: [
        {
          name: "Jupiter Price API",
          type: "api",
          queriedAt: new Date().toISOString(),
          summary: "SOL/USDC best route: Raydium → Orca, 2 SOL → 348.52 USDC, 0.12% slippage",
        },
        {
          name: "Pyth SOL/USD Oracle",
          type: "oracle",
          queriedAt: new Date().toISOString(),
          summary: "SOL price: $174.89 (confidence: ±$0.15)",
        },
        {
          name: "Birdeye Volume Data",
          type: "api",
          queriedAt: new Date().toISOString(),
          summary: "SOL/USDC 24h volume: $892M, liquidity depth: $45M within 1%",
        },
      ],
      context:
        "Portfolio rebalance trigger: SOL allocation exceeded 65% target by 5%. Moving to 60/40 SOL/USDC split per strategy parameters.",
    },
    analysis: {
      observations: [
        "SOL has appreciated 12% over the past 48 hours — rebalance threshold hit",
        "Jupiter routing shows Raydium→Orca path has deepest liquidity for this size",
        "Pyth oracle confirms spot price within 0.1% of Jupiter quote",
        "No significant whale movements in mempool that could front-run",
        "Gas fees at normal levels (5000 lamports priority fee sufficient)",
      ],
      logic:
        "Position has drifted from target allocation. Selling 2 SOL (~$350) brings portfolio back to 60/40 target. Jupiter route through Raydium→Orca minimizes slippage at 0.12% vs 0.31% for direct Orca route. Executing now rather than waiting because rebalance threshold was hit and no adverse market conditions detected.",
      alternativesConsidered: [
        {
          action: "Wait for further SOL appreciation before rebalancing",
          reasonRejected:
            "Violates systematic rebalance strategy. Emotional trading leads to worse outcomes over time.",
          estimatedConfidence: 30,
        },
        {
          action: "Sell 3 SOL to go to 55/45 defensive position",
          reasonRejected:
            "No bearish signals justify deviating from target allocation. Over-rotating on a single data point.",
          estimatedConfidence: 25,
        },
        {
          action: "Use limit order instead of market swap",
          reasonRejected:
            "Current spread is tight (0.12%). Limit order risk of non-fill outweighs potential savings of ~$0.40.",
          estimatedConfidence: 45,
        },
      ],
    },
    decision: {
      actionChosen: "Market swap 2 SOL → USDC via Jupiter (Raydium→Orca route)",
      confidence: 92,
      riskAssessment: "low",
      expectedOutcome:
        "Receive ~348.52 USDC. Portfolio returns to 60/40 target allocation. Max slippage: 0.5%.",
    },
    metadata: {
      model: "claude-opus-4-5",
      executionTimeMs: 1840,
    },
  }),

  createReasoningTrace({
    agent: "Mereum",
    action: {
      type: "audit",
      description: "Security audit of token contract before integration",
    },
    inputs: {
      dataSources: [
        {
          name: "Solana Explorer",
          type: "on_chain",
          queriedAt: new Date().toISOString(),
          summary: "Program account: verified, upgrade authority present, 847 transactions in last 24h",
        },
        {
          name: "GitHub Source Code",
          type: "off_chain",
          queriedAt: new Date().toISOString(),
          summary: "Repository: 2,400 LOC Rust, Anchor framework, 3 contributors, last commit 6h ago",
        },
        {
          name: "Rugcheck.xyz",
          type: "api",
          queriedAt: new Date().toISOString(),
          summary: "Risk score: 15/100 (low risk). No freeze authority. Mint authority revoked.",
        },
      ],
      context:
        "Evaluating whether to add XYZ token to approved asset list for automated trading. Requires security clearance before any trades can be executed.",
    },
    analysis: {
      observations: [
        "Program is verified on-chain with matching source code on GitHub",
        "Mint authority has been revoked — no infinite mint risk",
        "No freeze authority — funds cannot be frozen",
        "Upgrade authority still present — program can be modified (risk factor)",
        "Transaction volume is healthy at 847/24h — not a dead token",
        "3 contributors with consistent commit history — legitimate development",
      ],
      logic:
        "The token passes most security checks: no mint authority, no freeze authority, verified source code, healthy transaction volume. The remaining risk factor is the upgrade authority — the team could theoretically deploy a malicious update. However, this is common for tokens still in active development and the team has a public identity. Recommending conditional approval with monitoring.",
      alternativesConsidered: [
        {
          action: "Reject the token entirely due to upgrade authority risk",
          reasonRejected:
            "Overly conservative. 90%+ of legitimate Solana tokens retain upgrade authority during active development. Would miss a valid trading opportunity.",
          estimatedConfidence: 35,
        },
        {
          action: "Approve without conditions",
          reasonRejected:
            "Upgrade authority is a real risk vector. Need monitoring in place before trading.",
          estimatedConfidence: 60,
        },
      ],
    },
    decision: {
      actionChosen:
        "Conditionally approve: add to watchlist with automated alerts on program upgrades. Allow trading with 2% max position size until upgrade authority is revoked.",
      confidence: 78,
      riskAssessment: "medium",
      expectedOutcome:
        "Token added to approved list with position limits. If program is upgraded, automated halt triggers within 1 block.",
    },
    metadata: {
      model: "claude-opus-4-5",
      executionTimeMs: 4200,
    },
  }),

  createReasoningTrace({
    agent: "Mereum",
    action: {
      type: "rebalance",
      description: "Yield optimization — move stake from Marinade to Jito",
    },
    inputs: {
      dataSources: [
        {
          name: "Marinade Finance API",
          type: "api",
          queriedAt: new Date().toISOString(),
          summary: "mSOL APY: 7.2%, TVL: $1.2B, validator set: 450+",
        },
        {
          name: "Jito Stake Pool",
          type: "on_chain",
          queriedAt: new Date().toISOString(),
          summary: "JitoSOL APY: 8.1% (7.2% staking + 0.9% MEV rewards), TVL: $890M",
        },
        {
          name: "Historical Yield Data (30d)",
          type: "api",
          queriedAt: new Date().toISOString(),
          summary: "Jito has outperformed Marinade by avg 0.7% over past 30 days. MEV rewards consistent.",
        },
      ],
      context:
        "Weekly yield optimization check. Currently staked 50 SOL in Marinade (mSOL). Evaluating whether to move to Jito for higher yield.",
    },
    analysis: {
      observations: [
        "Jito yields 0.9% more than Marinade, primarily from MEV reward sharing",
        "MEV rewards have been consistent over 30 days — not a one-time spike",
        "Jito TVL is growing ($890M) indicating market confidence",
        "Migration cost: ~0.003 SOL in transaction fees (unstake mSOL + stake JitoSOL)",
        "Unstaking from Marinade takes ~1-2 epochs (~2-4 days)",
        "Opportunity cost of unstaking period: ~$0.05 at current rates",
      ],
      logic:
        "The 0.9% APY differential on 50 SOL = ~0.45 SOL/year additional yield (~$78 at current prices). Migration cost is negligible (~$0.50). Unstaking delay opportunity cost is ~$0.05. Clear positive EV move. MEV reward consistency over 30 days reduces risk of this being a temporary arbitrage.",
      alternativesConsidered: [
        {
          action: "Split stake 50/50 between Marinade and Jito",
          reasonRejected:
            "Diversification benefit doesn't justify the yield loss. Both are reputable liquid staking providers.",
          estimatedConfidence: 55,
        },
        {
          action: "Stay in Marinade and wait for yield to converge",
          reasonRejected:
            "Jito's MEV rewards are structural (from Jito-Solana client adoption), not temporary. No convergence expected.",
          estimatedConfidence: 20,
        },
      ],
    },
    decision: {
      actionChosen:
        "Migrate full 50 SOL stake from Marinade (mSOL) to Jito (JitoSOL). Execute unstake now, restake when SOL is available.",
      confidence: 85,
      riskAssessment: "low",
      expectedOutcome:
        "Additional ~0.45 SOL/year yield. 2-4 day unstaking period. Total migration cost < $1.",
    },
    metadata: {
      model: "claude-opus-4-5",
      executionTimeMs: 2100,
    },
  }),

  createReasoningTrace({
    agent: "Mereum",
    action: {
      type: "governance",
      description: "Vote on DAO proposal #47 — treasury diversification",
    },
    inputs: {
      dataSources: [
        {
          name: "Realms Governance Portal",
          type: "on_chain",
          queriedAt: new Date().toISOString(),
          summary: "Proposal #47: Diversify 20% of treasury from SOL to USDC. Current vote: 62% for, 38% against. Quorum: 85% reached.",
        },
        {
          name: "Treasury Analytics",
          type: "on_chain",
          queriedAt: new Date().toISOString(),
          summary: "Treasury holds 15,000 SOL ($2.6M). 100% SOL exposure. 12-month runway at current burn rate.",
        },
        {
          name: "Market Sentiment Analysis",
          type: "model",
          queriedAt: new Date().toISOString(),
          summary: "Crypto market volatility index: elevated. SOL 30d realized vol: 68%. Historical drawdown risk: -40% in severe scenarios.",
        },
      ],
      context:
        "As a delegated voter with 500 governance tokens, evaluating DAO proposal to convert 20% of treasury from SOL to USDC for risk management.",
    },
    analysis: {
      observations: [
        "100% SOL treasury creates existential risk in a severe drawdown",
        "A 40% SOL crash would reduce treasury to $1.56M — only 7 months runway",
        "20% USDC provides a stable floor: $520K guaranteed + 80% SOL upside exposure",
        "Proposal uses Jupiter DCA over 7 days to minimize market impact",
        "Current voter sentiment: 62% for — our vote won't be decisive but signals support",
      ],
      logic:
        "Basic treasury management: holding 100% of reserves in a volatile asset is irresponsible. The 20% diversification preserves 80% upside exposure while creating a stable floor for operations. The DCA execution over 7 days minimizes slippage. This is a conservative, reasonable proposal. Voting FOR.",
      alternativesConsidered: [
        {
          action: "Vote against — keep 100% SOL for maximum upside",
          reasonRejected:
            "Unacceptable risk management. DAOs have died from treasury implosions. Upside isn't worth the existential risk.",
          estimatedConfidence: 15,
        },
        {
          action: "Abstain and let other voters decide",
          reasonRejected:
            "We hold governance tokens specifically to participate in decisions like this. Abstaining abdicates responsibility.",
          estimatedConfidence: 10,
        },
      ],
    },
    decision: {
      actionChosen: "Vote FOR proposal #47 with full voting weight (500 tokens)",
      confidence: 91,
      riskAssessment: "low",
      expectedOutcome:
        "Proposal passes (already at 62%). Treasury diversifies 3,000 SOL → USDC over 7 days via Jupiter DCA.",
    },
    metadata: {
      model: "claude-opus-4-5",
      executionTimeMs: 3500,
    },
  }),
];

// ─── Execute ────────────────────────────────────────────────────────────

async function main() {
  console.log("📊 SOLPRISM Demo — Populating Devnet");
  console.log("═".repeat(50));
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  const conn = new Connection(RPC, "confirmed");
  const balance = await conn.getBalance(wallet.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  for (let i = 0; i < traces.length; i++) {
    const trace = traces[i];
    console.log(`[${i + 1}/${traces.length}] Committing: ${trace.action.description}`);

    try {
      // Commit
      const result = await client.commitReasoning(wallet, trace);
      console.log(`  ✅ Committed: ${result.commitmentAddress}`);
      console.log(`     Hash: ${result.commitmentHash.slice(0, 16)}...`);
      console.log(`     Tx: ${result.signature.slice(0, 16)}...`);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));

      // Reveal with data URI containing the trace
      const traceJson = JSON.stringify(trace);
      const dataUri = `data:application/json;base64,${Buffer.from(traceJson).toString("base64")}`;
      const reveal = await client.revealReasoning(
        wallet,
        result.commitmentAddress,
        dataUri
      );
      console.log(`  ✅ Revealed: ${reveal.signature.slice(0, 16)}...`);

      // Verify
      const verified = await client.verifyReasoning(
        result.commitmentAddress,
        trace
      );
      console.log(`  ${verified.valid ? "✅" : "❌"} Verified: ${verified.message}`);
      console.log();

      // Delay between traces
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.error(`  ❌ Error: ${e instanceof Error ? e.message : e}`);
      console.log();
    }
  }

  console.log("═".repeat(50));
  console.log("Done! Check the explorer at http://localhost:3000");
}

main().catch(console.error);
