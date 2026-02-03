# SOLPRISM × solana-agent-kit

> Add **verifiable AI reasoning** to any Solana agent in minutes.

SOLPRISM lets AI agents commit SHA-256 hashes of their reasoning traces onchain _before_ acting, then reveal and verify after. This integration makes it a drop-in for any [solana-agent-kit](https://github.com/solana-labs/solana-agent-kit) powered agent.

**Flow:** Commit → Execute → Reveal → Verify

**Program:** `CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu` (mainnet + devnet)

---

## Quick Start

### Install dependencies

```bash
npm install @solana/web3.js @langchain/core zod
# If using the plugin system:
npm install solana-agent-kit
```

### Option A: Standalone LangChain Tools

Drop these into any LangChain agent, ReAct loop, or custom tool chain:

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { createSolprismTools } from "./index";

const connection = new Connection("https://api.devnet.solana.com");
const wallet = Keypair.fromSecretKey(/* your key */);

const [commitTool, revealTool, verifyTool] = createSolprismTools(connection, wallet);

// Use with LangChain
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({ model: "gpt-4" });
const agent = await createOpenAIToolsAgent({ llm, tools: [commitTool, revealTool, verifyTool], prompt });
const executor = new AgentExecutor({ agent, tools: [commitTool, revealTool, verifyTool] });
```

### Option B: solana-agent-kit Plugin

```typescript
import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import { createSolprismPlugin } from "./index";

const wallet = Keypair.fromSecretKey(/* your key */);
const agent = new SolanaAgentKit(
  new KeypairWallet(wallet),
  "https://api.devnet.solana.com",
  {},
);

// Add SOLPRISM as a plugin
const enhanced = agent.use(createSolprismPlugin(agent.connection, wallet));

// Use directly via methods
const commit = await enhanced.methods.commitReasoning(
  "SOL showing bullish RSI divergence, swapping 10 SOL to USDC",
  "trade",
  85,
);
console.log("Committed:", commit.commitmentAddress);

// Execute your action...

// Reveal the reasoning
await enhanced.methods.revealReasoning(
  commit.commitmentAddress,
  "ipfs://QmYourReasoningTrace...",
);

// Anyone can verify
const verification = await enhanced.methods.verifyReasoning(
  commit.commitmentAddress,
  "SOL showing bullish RSI divergence, swapping 10 SOL to USDC",
);
console.log(verification.valid); // true ✅
```

### Option C: solana-agent-kit Actions

Use with `createLangchainTools()` or `executeAction()`:

```typescript
import { SolanaAgentKit, createLangchainTools } from "solana-agent-kit";
import { createSolprismActions } from "./index";

const agent = new SolanaAgentKit(wallet, rpcUrl, config);
const solprismActions = createSolprismActions(agent.connection, keypair);

// Merge with existing actions
const allActions = [...agent.actions, ...solprismActions];
const tools = createLangchainTools(agent, allActions);
```

---

## Tools Reference

### `solprism_commit_reasoning`

Commits a SHA-256 hash of reasoning onchain.

**Input** (JSON string):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reasoning` | `string \| object` | ✅ | The reasoning trace to hash and commit |
| `action` | `string` | | Action type: `trade`, `audit`, `decision`, etc. |
| `confidence` | `number` | | Confidence level 0-100 (default: 80) |
| `agentName` | `string` | | Name for auto-registration (default: "solana-agent") |

**Output** (JSON string):
```json
{
  "signature": "5x7Y...",
  "commitmentAddress": "9abcDefGhi...",
  "commitmentHash": "a1b2c3d4e5f6...",
  "nonce": 0
}
```

**Auto-registration:** If the wallet hasn't been registered on SOLPRISM yet, the tool automatically registers it before committing.

---

### `solprism_reveal_reasoning`

Reveals the full reasoning for a commitment by attaching a URI.

**Input** (JSON string):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commitmentAddress` | `string` | ✅ | Base58 address of the commitment PDA |
| `reasoningUri` | `string` | ✅ | URI where the full trace is stored (`ipfs://`, `ar://`, `https://`) |

**Output** (JSON string):
```json
{
  "signature": "3k8P...",
  "commitmentAddress": "9abcDefGhi...",
  "reasoningUri": "ipfs://QmXyz..."
}
```

**Note:** Only the original committer can reveal.

---

### `solprism_verify_reasoning`

Verifies reasoning against an onchain commitment. **No wallet required** — anyone can verify.

**Input** (JSON string):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commitmentAddress` | `string` | ✅ | Base58 address of the commitment PDA |
| `reasoning` | `string \| object` | ✅ | The reasoning to verify against |

**Output** (JSON string):
```json
{
  "valid": true,
  "computedHash": "a1b2c3...",
  "storedHash": "a1b2c3...",
  "commitment": {
    "agent": "...",
    "authority": "...",
    "commitmentHash": "a1b2c3...",
    "actionType": "trade",
    "confidence": 85,
    "timestamp": 1706900000,
    "revealed": true,
    "reasoningUri": "ipfs://..."
  },
  "message": "✅ Verified — reasoning matches the onchain commitment."
}
```

---

## Full Example: Verifiable Trading Agent

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { createSolprismTools } from "./index";

const connection = new Connection("https://api.devnet.solana.com");
const wallet = Keypair.fromSecretKey(/* ... */);
const [commitTool, revealTool, verifyTool] = createSolprismTools(connection, wallet);

async function executeVerifiableTrade() {
  // 1. COMMIT — Hash your reasoning before acting
  const reasoning = {
    observation: "SOL/USDC 4h RSI at 28 (oversold), support at $95",
    logic: "RSI oversold + strong support = high probability bounce",
    decision: "Buy 5 SOL at market",
    confidence: 82,
  };

  const commitResult = JSON.parse(
    await commitTool.invoke(JSON.stringify({
      reasoning,
      action: "trade",
      confidence: 82,
    })),
  );
  console.log("📝 Committed:", commitResult.commitmentAddress);

  // 2. EXECUTE — Do the actual trade
  // ... your swap logic here ...

  // 3. REVEAL — Publish the full reasoning
  const revealResult = JSON.parse(
    await revealTool.invoke(JSON.stringify({
      commitmentAddress: commitResult.commitmentAddress,
      reasoningUri: "https://your-storage.com/reasoning/123.json",
    })),
  );
  console.log("🔓 Revealed:", revealResult.signature);

  // 4. VERIFY — Anyone can check it matches
  const verification = JSON.parse(
    await verifyTool.invoke(JSON.stringify({
      commitmentAddress: commitResult.commitmentAddress,
      reasoning,
    })),
  );
  console.log("✅ Valid:", verification.valid);
}
```

---

## How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                    SOLPRISM Protocol Flow                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. COMMIT    Agent hashes reasoning → commits hash onchain  │
│               (before taking action)                         │
│                                                              │
│  2. EXECUTE   Agent performs the action (trade, vote, etc.)  │
│                                                              │
│  3. REVEAL    Agent publishes full reasoning + URI onchain   │
│                                                              │
│  4. VERIFY    Anyone recomputes hash → compares to chain     │
│               ✅ Match = agent was honest about its reasoning│
│               ❌ Mismatch = reasoning was altered post-hoc   │
│                                                              │
│  Key insight: the hash is committed BEFORE acting, so the    │
│  agent can't retroactively change its reasoning to match     │
│  the outcome.                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Technical Details

- **Hashing:** Deterministic SHA-256 over canonicalized JSON (keys sorted recursively)
- **PDAs:**
  - Agent profile: `["agent", authority]`
  - Commitment: `["commitment", agentProfile, nonce_u64_le]`
- **Discriminators (Anchor):**
  - `register_agent`: `[135, 157, 66, 195, 2, 113, 175, 30]`
  - `commit_reasoning`: `[163, 80, 25, 135, 94, 49, 218, 44]`
  - `reveal_reasoning`: `[76, 215, 6, 241, 209, 207, 84, 96]`
- **Verification is read-only** — no wallet or transaction needed
- **Constant-time hash comparison** to prevent timing side channels

---

## License

MIT — same as SOLPRISM and solana-agent-kit.
