"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  fetchCommitment,
  truncateAddress,
  formatTimestamp,
  explorerUrl,
  type Commitment,
} from "@/lib/solprism";

function Field({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  const content = link ? (
    <a
      href={link}
      target="_blank"
      className="hover:text-blue-400 transition-colors break-all"
    >
      {value}
    </a>
  ) : (
    <span className="break-all">{value}</span>
  );

  return (
    <div className="py-4 border-b border-slate-800 last:border-0">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={mono ? "hash-text text-slate-300" : "text-slate-200"}>
        {content}
      </div>
    </div>
  );
}

export default function CommitmentDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommitment(address)
      .then(setCommitment)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">
          Loading commitment...
        </div>
      </div>
    );
  }

  if (!commitment) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Commitment Not Found</h1>
        <p className="text-slate-400">
          No commitment at address{" "}
          <span className="hash-text">{truncateAddress(address, 8)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`w-4 h-4 rounded-full ${
            commitment.revealed ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        <div>
          <h1 className="text-2xl font-bold">Reasoning Commitment</h1>
          <div className="text-sm text-slate-400">
            {commitment.revealed
              ? "✓ Revealed and verifiable"
              : "Pending reveal"}
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#1a2235] border border-slate-800 rounded-xl p-6">
        <Field
          label="Commitment Address"
          value={address}
          mono
          link={explorerUrl(address)}
        />
        <Field
          label="Commitment Hash (SHA-256)"
          value={commitment.commitmentHash}
          mono
        />
        <Field
          label="Agent Authority"
          value={commitment.authority}
          mono
          link={`/agent/${commitment.authority}`}
        />
        <Field
          label="Agent Profile PDA"
          value={commitment.agent}
          mono
          link={explorerUrl(commitment.agent)}
        />
        <Field label="Action Type" value={commitment.actionType} />
        <Field label="Confidence" value={`${commitment.confidence}%`} />
        <Field label="Timestamp" value={formatTimestamp(commitment.timestamp)} />
        <Field label="Nonce" value={`#${commitment.nonce}`} />

        <div className="py-4 border-b border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Status</div>
          {commitment.revealed ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-green-400 font-medium">
                Revealed
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-yellow-400 font-medium">
                Pending Reveal
              </span>
            </div>
          )}
        </div>

        {commitment.revealed && commitment.reasoningUri && (
          <Field
            label="Reasoning URI"
            value={commitment.reasoningUri}
            mono
            link={
              commitment.reasoningUri.startsWith("http")
                ? commitment.reasoningUri
                : undefined
            }
          />
        )}
      </div>

      {/* Verify Section */}
      <div className="bg-[#1a2235] border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">Verify This Commitment</h2>
        <p className="text-sm text-slate-400 mb-4">
          To verify this commitment, you need the original reasoning trace JSON.
          Paste it on the{" "}
          <a href={`/verify?address=${address}`} className="text-blue-400 hover:text-blue-300">
            Verify page
          </a>{" "}
          to check if it matches the onchain hash.
        </p>
        <a
          href={`/verify?address=${address}`}
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          Verify Reasoning →
        </a>
      </div>

      {/* Explorer Link */}
      <div className="text-center text-sm text-slate-500">
        <a
          href={explorerUrl(address)}
          target="_blank"
          className="hover:text-blue-400 transition-colors"
        >
          View on Solana Explorer ↗
        </a>
      </div>
    </div>
  );
}
