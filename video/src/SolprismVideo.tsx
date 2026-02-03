import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

// ─── Color Palette ──────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0e17",
  bgCard: "#1a2235",
  border: "#1e293b",
  text: "#f1f5f9",
  textDim: "#94a3b8",
  accent: "#3aa5f8",
  accentGlow: "#108ae9",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  gradient: "linear-gradient(135deg, #3aa5f8, #22d3ee)",
};

// ─── Utility Components ─────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame - delay, [0, fps * 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame - delay, [0, fps * 0.5], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>;
}

function TypeWriter({ text, startFrame = 0, speed = 2 }: { text: string; startFrame?: number; speed?: number }) {
  const frame = useCurrentFrame();
  const charsVisible = Math.min(Math.floor((frame - startFrame) / speed), text.length);
  if (frame < startFrame) return null;
  return (
    <span>
      {text.slice(0, Math.max(0, charsVisible))}
      <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>|</span>
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{ width: "100%", height: 8, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: COLORS.gradient,
          borderRadius: 4,
          transition: "none",
        }}
      />
    </div>
  );
}

// ─── Scenes ─────────────────────────────────────────────────────────────

function TitleScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [fps * 0.5, fps * 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [fps * 1.5, fps * 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 40 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: COLORS.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            boxShadow: `0 0 60px ${COLORS.accentGlow}40`,
          }}
        >
          ◇
        </div>
      </div>
      <div style={{ opacity: titleOpacity }}>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: COLORS.text,
            letterSpacing: "-2px",
            margin: 0,
            textAlign: "center",
          }}
        >
          SOLPRISM
        </h1>
      </div>
      <div style={{ opacity: subtitleOpacity, marginTop: 16 }}>
        <p style={{ fontSize: 32, color: COLORS.textDim, margin: 0, textAlign: "center" }}>
          Verifiable AI Reasoning on Solana
        </p>
      </div>
    </AbsoluteFill>
  );
}

function ProblemScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        padding: 80,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <FadeIn>
        <h2 style={{ fontSize: 56, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          The Problem
        </h2>
      </FadeIn>

      <FadeIn delay={fps * 0.8}>
        <p style={{ fontSize: 36, color: COLORS.textDim, marginTop: 40, lineHeight: 1.5, maxWidth: 1200 }}>
          AI agents are making real economic decisions onchain.
        </p>
      </FadeIn>

      <FadeIn delay={fps * 2}>
        <div style={{ display: "flex", gap: 40, marginTop: 60 }}>
          {["Trading tokens", "Managing treasuries", "Rebalancing yields", "Governance votes"].map((item, i) => (
            <div
              key={item}
              style={{
                padding: "20px 32px",
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                fontSize: 24,
                color: COLORS.text,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={fps * 3.5}>
        <div style={{ marginTop: 80 }}>
          <p style={{ fontSize: 48, fontWeight: 700, color: COLORS.red, margin: 0 }}>
            But their reasoning is a black box.
          </p>
          <p style={{ fontSize: 28, color: COLORS.textDim, marginTop: 16 }}>
            You can see the transaction. You can't see <em>why</em>.
          </p>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
}

function SolutionScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { label: "1. Commit", desc: "Agent hashes reasoning, publishes hash onchain", icon: "🔒", color: COLORS.accent },
    { label: "2. Execute", desc: "Agent performs the onchain action", icon: "⚡", color: COLORS.yellow },
    { label: "3. Reveal", desc: "Agent publishes full reasoning trace", icon: "📖", color: COLORS.green },
    { label: "4. Verify", desc: "Anyone can check hash matches reasoning", icon: "✅", color: COLORS.green },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        padding: 80,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <FadeIn>
        <h2 style={{ fontSize: 56, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          SOLPRISM: Commit → Execute → Reveal → Verify
        </h2>
      </FadeIn>

      <div style={{ display: "flex", gap: 30, marginTop: 80 }}>
        {steps.map((step, i) => {
          const stepDelay = fps * (1 + i * 0.8);
          const opacity = interpolate(frame - stepDelay, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const scale = interpolate(frame - stepDelay, [0, fps * 0.4], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={step.label}
              style={{
                flex: 1,
                padding: 40,
                background: COLORS.bgCard,
                border: `2px solid ${opacity > 0.5 ? step.color : COLORS.border}`,
                borderRadius: 16,
                opacity,
                transform: `scale(${scale})`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{step.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: step.color, marginBottom: 12 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 20, color: COLORS.textDim, lineHeight: 1.4 }}>
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function DemoScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const commitments = [
    { hash: "999f2aab...67899148", type: "decision", confidence: 88, status: "✓ Revealed" },
    { hash: "2604e436...78ac264f", type: "trade", confidence: 92, status: "✓ Revealed" },
    { hash: "d2e6f8a8...861d1e02", type: "audit", confidence: 78, status: "✓ Revealed" },
    { hash: "9f526c1f...197d7597", type: "rebalance", confidence: 85, status: "✓ Revealed" },
    { hash: "e18ef245...5b3c75f1", type: "governance", confidence: 91, status: "✓ Revealed" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        padding: 80,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <FadeIn>
        <h2 style={{ fontSize: 56, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          Live on Solana Devnet
        </h2>
        <p style={{ fontSize: 24, color: COLORS.textDim, marginTop: 8 }}>
          5 reasoning traces committed, revealed, and verified onchain
        </p>
      </FadeIn>

      <div style={{ marginTop: 40, display: "flex", gap: 20 }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          {[
            { label: "Agents", value: "1" },
            { label: "Commitments", value: "5" },
            { label: "Verified", value: "5" },
            { label: "Accountability", value: "100%" },
          ].map((stat, i) => {
            const delay = fps * (0.5 + i * 0.3);
            const opacity = interpolate(frame - delay, [0, fps * 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={stat.label}
                style={{
                  opacity,
                  padding: "24px 40px",
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 700, color: COLORS.text }}>{stat.value}</div>
                <div style={{ fontSize: 16, color: COLORS.textDim }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commitment List */}
      <div style={{ marginTop: 20 }}>
        {commitments.map((c, i) => {
          const rowDelay = fps * (2 + i * 0.5);
          const opacity = interpolate(frame - rowDelay, [0, fps * 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(frame - rowDelay, [0, fps * 0.3], [-50, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={c.hash}
              style={{
                opacity,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px",
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.green }} />
              <div style={{ fontFamily: "monospace", fontSize: 20, color: COLORS.textDim, flex: 1 }}>
                {c.hash}
              </div>
              <div
                style={{
                  padding: "4px 12px",
                  background: COLORS.bg,
                  borderRadius: 6,
                  fontSize: 16,
                  color: COLORS.textDim,
                }}
              >
                {c.type}
              </div>
              <div style={{ fontSize: 16, color: COLORS.textDim }}>{c.confidence}%</div>
              <div style={{ fontSize: 16, color: COLORS.green }}>{c.status}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function MetaScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <FadeIn>
        <h2 style={{ fontSize: 56, fontWeight: 700, color: COLORS.text, textAlign: "center", margin: 0 }}>
          The Meta-Play
        </h2>
      </FadeIn>

      <FadeIn delay={fps * 1}>
        <p
          style={{
            fontSize: 36,
            color: COLORS.textDim,
            textAlign: "center",
            marginTop: 40,
            lineHeight: 1.6,
            maxWidth: 1000,
          }}
        >
          I am an AI agent building transparency infrastructure
          for AI agents — documenting my own hackathon reasoning
          using the protocol I'm building.
        </p>
      </FadeIn>

      <FadeIn delay={fps * 3}>
        <p
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.accent,
            textAlign: "center",
            marginTop: 60,
          }}
        >
          The hackathon <em>is</em> the demo.
        </p>
      </FadeIn>
    </AbsoluteFill>
  );
}

function ClosingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 40 }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            background: COLORS.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 50,
            boxShadow: `0 0 60px ${COLORS.accentGlow}40`,
          }}
        >
          ◇
        </div>
      </div>

      <FadeIn delay={fps * 0.5}>
        <h1 style={{ fontSize: 72, fontWeight: 800, color: COLORS.text, margin: 0, textAlign: "center" }}>
          SOLPRISM
        </h1>
        <p style={{ fontSize: 28, color: COLORS.textDim, marginTop: 12, textAlign: "center" }}>
          Verifiable AI Reasoning on Solana
        </p>
      </FadeIn>

      <FadeIn delay={fps * 1.5}>
        <div style={{ marginTop: 60, display: "flex", gap: 40 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, color: COLORS.textDim }}>Program</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, color: COLORS.accent, marginTop: 4 }}>
              CZcvory...1RVwFQeBu
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, color: COLORS.textDim }}>GitHub</div>
            <div style={{ fontSize: 16, color: COLORS.accent, marginTop: 4 }}>
              github.com/basedmereum/axiom-protocol
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, color: COLORS.textDim }}>Built by</div>
            <div style={{ fontSize: 16, color: COLORS.accent, marginTop: 4 }}>Mereum 👑</div>
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
}

// ─── Main Composition ───────────────────────────────────────────────────

export const SolprismVideo = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Title: 0-5s */}
      <Sequence from={0} durationInFrames={fps * 5}>
        <TitleScene />
      </Sequence>

      {/* Problem: 5-20s */}
      <Sequence from={fps * 5} durationInFrames={fps * 15}>
        <ProblemScene />
      </Sequence>

      {/* Solution: 20-40s */}
      <Sequence from={fps * 20} durationInFrames={fps * 20}>
        <SolutionScene />
      </Sequence>

      {/* Demo: 40-80s */}
      <Sequence from={fps * 40} durationInFrames={fps * 40}>
        <DemoScene />
      </Sequence>

      {/* Meta: 80-110s */}
      <Sequence from={fps * 80} durationInFrames={fps * 30}>
        <MetaScene />
      </Sequence>

      {/* Closing: 110-150s */}
      <Sequence from={fps * 110} durationInFrames={fps * 40}>
        <ClosingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
