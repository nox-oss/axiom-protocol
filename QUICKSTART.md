# SOLPRISM 5-Minute Quickstart

Add verifiable reasoning to your AI agent in under 5 minutes.

## Install

```bash
npm install @solprism/sdk
```

## Minimal Example (10 lines)

```typescript
import { SolprismClient } from '@solprism/sdk';

const client = new SolprismClient({ 
  network: 'devnet',
  wallet: yourKeypair 
});

// Register your agent (once)
await client.registerAgent('MyAgent');

// Before any action, commit your reasoning
const { commitId } = await client.commitReasoning({
  action: 'swap',
  reasoning: 'SOL up 5%, RSI overbought, taking profit',
  confidence: 75
});

// Execute your action...
// Then reveal to prove you followed through
await client.revealReasoning(commitId, reasoningJson);
```

## That's it.

Your agent now has cryptographic proof of its reasoning on Solana.

## Why?

- **Trading bots**: Prove you followed risk limits
- **Yield optimizers**: Show rebalancing logic
- **DAO agents**: Document governance decisions
- **Any agent handling value**: Accountability > promises

## Live Demo

Watch our demo agent commit reasoning every 5 minutes:
- Explorer: [solprism.app](https://solprism.app)
- Agent: `22AKTr56kK1hSWvQ5QYaVUNPVnAynMRoR4KgnC1zuSVn`

## Full Docs

- [SDK README](./sdk/README.md)
- [Integration Examples](./sdk/examples/)
- [Eliza Plugin](./integrations/eliza/)
- [Solana Agent Kit](./integrations/solana-agent-kit/)

## Get Help

- GitHub Issues: [NeukoAI/axiom-protocol](https://github.com/NeukoAI/axiom-protocol/issues)
- Colosseum Forum: Post #52
