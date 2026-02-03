/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/axiom.json`.
 */
export type Axiom = {
  "address": "CZcvoryaQNrtZ3qb3gC1h9opcYpzEP1D9Mu1RVwFQeBu",
  "metadata": {
    "name": "axiom",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "AXIOM Protocol — Verifiable AI Reasoning on Solana",
    "",
    "Agents commit hashes of their reasoning before executing actions.",
    "Anyone can verify the reasoning matches the on-chain commitment."
  ],
  "instructions": [
    {
      "name": "commitReasoning",
      "docs": [
        "Commit a reasoning hash before executing an action.",
        "",
        "The agent publishes the SHA-256 hash of their full reasoning trace.",
        "This must happen BEFORE the action is executed, creating a",
        "tamper-proof record of the agent's decision-making process."
      ],
      "discriminator": [
        163,
        80,
        25,
        135,
        94,
        49,
        218,
        44
      ],
      "accounts": [
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agentProfile"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "agentProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "agentProfile"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "commitmentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "actionType",
          "type": "string"
        },
        {
          "name": "confidence",
          "type": "u8"
        },
        {
          "name": "nonce",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerAgent",
      "docs": [
        "Register a new agent profile on AXIOM."
      ],
      "discriminator": [
        135,
        157,
        66,
        195,
        2,
        113,
        175,
        30
      ],
      "accounts": [
        {
          "name": "agentProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "revealReasoning",
      "docs": [
        "Reveal the full reasoning by providing its storage URI.",
        "",
        "After the action is executed, the agent publishes the full",
        "reasoning trace (e.g., to IPFS) and records the URI on-chain.",
        "Anyone can then fetch the reasoning and verify it matches",
        "the committed hash."
      ],
      "discriminator": [
        76,
        215,
        6,
        241,
        209,
        207,
        84,
        96
      ],
      "accounts": [
        {
          "name": "commitment",
          "writable": true
        },
        {
          "name": "agentProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "commitment",
            "agentProfile"
          ]
        }
      ],
      "args": [
        {
          "name": "reasoningUri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agentProfile",
      "discriminator": [
        60,
        227,
        42,
        24,
        0,
        87,
        86,
        205
      ]
    },
    {
      "name": "reasoningCommitment",
      "discriminator": [
        67,
        22,
        65,
        98,
        26,
        124,
        5,
        25
      ]
    }
  ],
  "events": [
    {
      "name": "reasoningCommitted",
      "discriminator": [
        52,
        36,
        240,
        71,
        168,
        192,
        74,
        198
      ]
    },
    {
      "name": "reasoningRevealed",
      "discriminator": [
        136,
        27,
        89,
        205,
        193,
        65,
        142,
        210
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Agent name must be 64 characters or less"
    },
    {
      "code": 6001,
      "name": "nameEmpty",
      "msg": "Agent name cannot be empty"
    },
    {
      "code": 6002,
      "name": "actionTypeTooLong",
      "msg": "Action type must be 32 characters or less"
    },
    {
      "code": 6003,
      "name": "invalidConfidence",
      "msg": "Confidence must be between 0 and 100"
    },
    {
      "code": 6004,
      "name": "uriTooLong",
      "msg": "Reasoning URI must be 256 characters or less"
    },
    {
      "code": 6005,
      "name": "uriEmpty",
      "msg": "Reasoning URI cannot be empty"
    },
    {
      "code": 6006,
      "name": "alreadyRevealed",
      "msg": "Reasoning has already been revealed"
    },
    {
      "code": 6007,
      "name": "agentMismatch",
      "msg": "Agent profile does not match commitment"
    },
    {
      "code": 6008,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "agentProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The agent's authority (wallet that controls this profile)"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Display name (max 64 chars)"
            ],
            "type": "string"
          },
          {
            "name": "totalCommitments",
            "docs": [
              "Total reasoning commitments published"
            ],
            "type": "u64"
          },
          {
            "name": "totalVerified",
            "docs": [
              "Total commitments that have been revealed"
            ],
            "type": "u64"
          },
          {
            "name": "accountabilityScore",
            "docs": [
              "Accountability score in basis points (0-10000 = 0%-100%)"
            ],
            "type": "u16"
          },
          {
            "name": "createdAt",
            "docs": [
              "When the agent registered"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reasoningCommitment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agent",
            "docs": [
              "The agent profile this commitment belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "The authority that created this commitment"
            ],
            "type": "pubkey"
          },
          {
            "name": "commitmentHash",
            "docs": [
              "SHA-256 hash of the full reasoning trace"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "actionType",
            "docs": [
              "Type of action (e.g., \"trade\", \"audit\", \"rebalance\")"
            ],
            "type": "string"
          },
          {
            "name": "confidence",
            "docs": [
              "Confidence score (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "timestamp",
            "docs": [
              "Unix timestamp when committed"
            ],
            "type": "i64"
          },
          {
            "name": "revealed",
            "docs": [
              "Whether the full reasoning has been revealed"
            ],
            "type": "bool"
          },
          {
            "name": "reasoningUri",
            "docs": [
              "URI to the full reasoning (IPFS, Arweave, etc.)"
            ],
            "type": "string"
          },
          {
            "name": "nonce",
            "docs": [
              "Nonce for unique PDA derivation (allows multiple commitments)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reasoningCommitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "commitment",
            "type": "pubkey"
          },
          {
            "name": "actionType",
            "type": "string"
          },
          {
            "name": "confidence",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "reasoningRevealed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "commitment",
            "type": "pubkey"
          },
          {
            "name": "reasoningUri",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
