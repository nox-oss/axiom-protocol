"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchCommitment, explorerUrl, type Commitment } from "@/lib/solprism";

// Browser-native SHA-256 (no extra deps)
async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Canonical JSON serialization (sorted keys)
function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

type VerifyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "valid"; computedHash: string; storedHash: string }
  | { status: "invalid"; computedHash: string; storedHash: string }
  | { status: "error"; message: string };

function VerifyContent() {
  const searchParams = useSearchParams();
  const prefillAddress = searchParams.get("address") || "";

  const [commitmentAddress, setCommitmentAddress] = useState(prefillAddress);
  const [reasoningJson, setReasoningJson] = useState("");
  const [result, setResult] = useState<VerifyState>({ status: "idle" });

  const verify = useCallback(async () => {
    if (!commitmentAddress.trim() || !reasoningJson.trim()) {
      setResult({
        status: "error",
        message: "Please provide both a commitment address and reasoning JSON.",
      });
      return;
    }

    setResult({ status: "loading" });

    try {
      // Parse the reasoning JSON
      let trace: Record<string, unknown>;
      try {
        trace = JSON.parse(reasoningJson);
      } catch {
        setResult({
          status: "error",
          message: "Invalid JSON. Please paste valid reasoning trace JSON.",
        });
        return;
      }

      // Fetch the onchain commitment
      const commitment = await fetchCommitment(commitmentAddress.trim());
      if (!commitment) {
        setResult({
          status: "error",
          message: "Commitment not found at that address. Check the address and try again.",
        });
        return;
      }

      // Compute hash of the provided reasoning
      const canonical = canonicalJson(trace);
      const computedHash = await sha256Hex(canonical);
      const storedHash = commitment.commitmentHash;

      if (computedHash === storedHash) {
        setResult({ status: "valid", computedHash, storedHash });
      } else {
        setResult({ status: "invalid", computedHash, storedHash });
      }
    } catch (e) {
      setResult({
        status: "error",
        message: `Verification failed: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }, [commitmentAddress, reasoningJson]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verify Reasoning</h1>
        <p className="text-slate-400 mt-1">
          Verify that a reasoning trace matches an onchain commitment.
          Paste the commitment address and the original reasoning JSON below.
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Commitment Address
          </label>
          <input
            type="text"
            value={commitmentAddress}
            onChange={(e) => setCommitmentAddress(e.target.value)}
            placeholder="e.g. 8hVkxM4DoB7TA57GhMHb9QRAioFzaNmUbdX42UHXW6Mo"
            className="w-full px-4 py-3 bg-[#1a2235] border border-slate-700 rounded-lg text-sm hash-text text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Reasoning Trace (JSON)
          </label>
          <textarea
            value={reasoningJson}
            onChange={(e) => setReasoningJson(e.target.value)}
            placeholder='{"version":"1.0.0","agent":"Mereum","timestamp":...}'
            rows={12}
            className="w-full px-4 py-3 bg-[#1a2235] border border-slate-700 rounded-lg text-sm hash-text text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-y"
          />
        </div>

        <button
          onClick={verify}
          disabled={result.status === "loading"}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-medium transition-colors"
        >
          {result.status === "loading" ? "Verifying..." : "Verify Onchain →"}
        </button>
      </div>

      {/* Result */}
      {result.status === "valid" && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">✅</span>
            <div>
              <h2 className="text-xl font-bold text-green-400">
                Verified — Reasoning Matches
              </h2>
              <p className="text-sm text-green-300/70">
                The reasoning trace you provided produces the exact hash stored onchain.
                This agent committed this reasoning before acting.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-400">Computed Hash: </span>
              <span className="hash-text text-green-300">{result.computedHash}</span>
            </div>
            <div>
              <span className="text-slate-400">Onchain Hash: </span>
              <span className="hash-text text-green-300">{result.storedHash}</span>
            </div>
          </div>
        </div>
      )}

      {result.status === "invalid" && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">❌</span>
            <div>
              <h2 className="text-xl font-bold text-red-400">
                Mismatch — Reasoning Does Not Match
              </h2>
              <p className="text-sm text-red-300/70">
                The hash of the provided reasoning does not match the onchain
                commitment. The reasoning may have been tampered with or this
                is not the correct trace for this commitment.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-400">Computed Hash: </span>
              <span className="hash-text text-red-300">{result.computedHash}</span>
            </div>
            <div>
              <span className="text-slate-400">Onchain Hash: </span>
              <span className="hash-text text-red-300">{result.storedHash}</span>
            </div>
          </div>
        </div>
      )}

      {result.status === "error" && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-yellow-300">{result.message}</p>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-[#1a2235] border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">
          How Verification Works
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
          <li>
            Agent commits a SHA-256 hash of their reasoning trace onchain{" "}
            <em>before</em> acting
          </li>
          <li>Agent executes the onchain action</li>
          <li>
            Agent reveals the full reasoning trace (publishes to IPFS or
            similar)
          </li>
          <li>
            Anyone can compute the hash of the revealed reasoning and compare
            it to the onchain commitment
          </li>
          <li>
            If the hashes match → the reasoning was committed before the action
            (tamper-proof)
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse">Loading...</div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
