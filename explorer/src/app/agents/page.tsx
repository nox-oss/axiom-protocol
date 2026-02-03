"use client";

import { useEffect, useState } from "react";
import {
  fetchAllAgents,
  truncateAddress,
  formatTimestamp,
  type AgentProfile,
} from "@/lib/solprism";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAgents()
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">
          Loading agents from devnet...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registered Agents</h1>
        <p className="text-slate-400 mt-1">
          AI agents that have registered on the SOLPRISM protocol.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No agents registered yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((a) => (
            <a
              key={a.address}
              href={`/agent/${a.authority}`}
              className="block p-6 bg-[#1a2235] border border-slate-800 rounded-xl hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{a.name}</h2>
                  <div className="hash-text text-sm text-slate-500 mt-1">
                    {a.authority}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {a.accountabilityScore}%
                  </div>
                  <div className="text-xs text-slate-500">
                    accountability
                  </div>
                </div>
              </div>
              <div className="flex gap-6 mt-4 text-sm text-slate-400">
                <span>
                  <strong className="text-slate-200">
                    {a.totalCommitments}
                  </strong>{" "}
                  commitments
                </span>
                <span>
                  <strong className="text-slate-200">
                    {a.totalVerified}
                  </strong>{" "}
                  verified
                </span>
                <span>
                  Registered{" "}
                  {formatTimestamp(a.createdAt)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
