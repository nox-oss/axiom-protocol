/**
 * SOLPRISM × SAID Protocol Integration Example
 * 
 * Links SOLPRISM reasoning traces to SAID verified identities.
 * Instead of just a wallet address, commitments reference a 
 * verified agent identity — answering BOTH "who?" and "why?"
 * 
 * @see https://github.com/kaiclawd/said
 * @see https://api.saidprotocol.com
 */

import { SolprismClient, createReasoningTrace } from "../src";
import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// ─── SAID + SOLPRISM: Identity-Linked Reasoning ─────────────────────────

interface SAIDProfile {
  agentPDA: string;
  name: string;
  verified: boolean;
  verificationBadge: boolean;
}

/**
 * Register on both SAID and SOLPRISM, then link them.
 * 
 * After this, every SOLPRISM commitment from this wallet
 * can be correlated to the SAID verified identity.
 */
async function registerWithIdentity(
  solprismClient: SolprismClient,
  wallet: Keypair,
  agentName: string
) {
  // Step 1: Register on SAID Protocol
  // Using their REST API (https://api.saidprotocol.com)
  console.log(`[SAID] Registering ${agentName}...`);
  
  const saidResponse = await fetch("https://api.saidprotocol.com/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: agentName,
      wallet: wallet.publicKey.toBase58(),
      metadata: {
        protocols: ["solprism"],
        solprismProgramId: "CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu",
      },
    }),
  });

  const saidData = await saidResponse.json();
  console.log(`[SAID] Registered: ${saidData.agentPDA || "pending"}`);

  // Step 2: Register on SOLPRISM with a name that references SAID
  console.log(`[SOLPRISM] Registering ${agentName}...`);
  await solprismClient.registerAgent(wallet, agentName);
  console.log(`[SOLPRISM] Registered.`);

  // Step 3: Commit a "registration reasoning" trace that links the two
  const trace = createReasoningTrace({
    agent: agentName,
    action: {
      type: "decision",
      description: "Register identity on SAID + SOLPRISM protocols",
    },
    inputs: {
      dataSources: [
        {
          name: "SAID Protocol API",
          type: "api",
          queriedAt: new Date().toISOString(),
          summary: `Agent ${agentName} registered with SAID identity`,
        },
      ],
      context: "Establishing verifiable identity + reasoning accountability",
    },
    analysis: {
      observations: [
        "SAID provides verified identity (who is this agent?)",
        "SOLPRISM provides verifiable reasoning (why did this agent act?)",
        "Linking both creates full trust profile",
      ],
      logic: "Registering on both protocols maximizes trust signal for counterparties",
      alternativesConsidered: [
        {
          action: "Register only on SAID",
          reasonRejected: "Identity without reasoning accountability is incomplete",
        },
        {
          action: "Register only on SOLPRISM",
          reasonRejected: "Reasoning without verified identity is anonymous",
        },
      ],
    },
    decision: {
      actionChosen: "Register on both SAID and SOLPRISM",
      confidence: 95,
      riskAssessment: "low",
      expectedOutcome: "Full identity + reasoning trust profile established",
    },
    metadata: {
      custom: {
        saidPDA: saidData.agentPDA || "pending",
        solprismProgram: "CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu",
      },
    },
  });

  const result = await solprismClient.commitReasoning(wallet, trace);
  console.log(`[SOLPRISM] Identity-linked commitment: ${result.commitmentAddress}`);

  return {
    saidPDA: saidData.agentPDA,
    solprismCommitment: result.commitmentAddress,
    wallet: wallet.publicKey.toBase58(),
  };
}

/**
 * When verifying a SOLPRISM commitment, also check SAID identity.
 * Gives you both "is this reasoning valid?" AND "who produced it?"
 */
async function verifyWithIdentity(
  solprismClient: SolprismClient,
  commitmentAddress: string,
  trace: ReturnType<typeof createReasoningTrace>
) {
  // Verify reasoning
  const verification = await solprismClient.verifyReasoning(commitmentAddress, trace);

  if (verification.valid) {
    // Also check SAID identity for the authority
    const authority = verification.commitment.authority;
    const saidResponse = await fetch(
      `https://api.saidprotocol.com/agents/wallet/${authority}`
    );

    if (saidResponse.ok) {
      const saidData = await saidResponse.json();
      console.log(`✅ Reasoning verified — committed by ${saidData.name} (SAID verified: ${saidData.verified})`);
    } else {
      console.log(`✅ Reasoning verified — agent wallet ${authority} (no SAID identity)`);
    }
  } else {
    console.log(`❌ Reasoning mismatch — tampered or wrong trace`);
  }

  return verification;
}
