import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600", "700"], subsets: ["latin"] });
const { fontFamily: montserrat } = loadMontserrat("normal", { weights: ["800", "900"], subsets: ["latin"] });

const TRANSITION = 15;
const timing = springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION });

// ── Animated Background ──
const AnimatedBG = () => {
  const frame = useCurrentFrame();
  const shift = frame * 0.3;
  return (
    <AbsoluteFill>
      <div style={{
        width: "100%", height: "100%",
        background: `
          radial-gradient(ellipse at ${50 + Math.sin(shift * 0.02) * 20}% ${30 + Math.cos(shift * 0.015) * 15}%, rgba(59,130,246,0.3) 0%, transparent 60%),
          radial-gradient(ellipse at ${70 + Math.cos(shift * 0.018) * 15}% ${70 + Math.sin(shift * 0.022) * 10}%, rgba(139,92,246,0.2) 0%, transparent 50%),
          linear-gradient(135deg, #0a0e1a 0%, #0f172a 40%, #1a1040 100%)
        `,
      }} />
      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const speed = 0.3 + (i % 4) * 0.15;
        const x = 100 + (i * 83) % 880;
        const y = ((i * 157 + frame * speed) % 2100) - 100;
        const size = 2 + (i % 3) * 2;
        const opacity = 0.15 + (i % 5) * 0.05;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: size, height: size, borderRadius: "50%",
            background: i % 2 === 0 ? "#3b82f6" : "#8b5cf6",
            opacity,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

// ── Scene 1: Logo Intro (0-150 frames = 5s) ──
const SceneIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const ringScale = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 60 } });
  const titleOp = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 30, fps, config: { damping: 15 } }), [0, 1], [50, 0]);
  const subOp = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [45, 85], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseGlow = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Glow ring */}
      <div style={{
        position: "absolute",
        width: 260, height: 260, borderRadius: "50%",
        border: "2px solid rgba(59,130,246,0.3)",
        transform: `scale(${interpolate(ringScale, [0, 1], [0.5, 1])})`,
        opacity: pulseGlow,
        boxShadow: "0 0 80px rgba(59,130,246,0.2)",
      }} />

      {/* Logo */}
      <div style={{
        width: 200, height: 200, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${logoScale})`,
        boxShadow: "0 0 80px rgba(59,130,246,0.5), 0 20px 60px rgba(0,0,0,0.5)",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 180, height: 180, objectFit: "contain" }} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: montserrat, fontSize: 64, fontWeight: 900, color: "#fff",
        marginTop: 30, opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center", lineHeight: 1.1, letterSpacing: -1,
      }}>
        9Nine
        <br />
        <span style={{ fontSize: 42, fontWeight: 800, color: "#3b82f6" }}>Business Control</span>
      </div>

      {/* Line */}
      <div style={{
        width: lineW, height: 3, borderRadius: 2, marginTop: 20,
        background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
      }} />

      {/* Subtitle */}
      <div style={{
        fontFamily: poppins, fontSize: 20, fontWeight: 300, color: "rgba(255,255,255,0.7)",
        opacity: subOp, marginTop: 16, letterSpacing: 4, textTransform: "uppercase",
        textAlign: "center",
      }}>
        Gestão Financeira Empresarial
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily: poppins, fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.5)",
        opacity: tagOp, marginTop: 40, textAlign: "center", maxWidth: 600, lineHeight: 1.6,
      }}>
        Controle total das suas finanças em um só lugar
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 2: Features Grid (150-330 frames = 6s) ──
const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: "💰", label: "Contas a Pagar" },
    { icon: "📥", label: "Contas a Receber" },
    { icon: "🏦", label: "Conciliação Bancária" },
    { icon: "📊", label: "Fluxo de Caixa" },
    { icon: "📈", label: "DRE Gerencial" },
    { icon: "🎯", label: "Planejamento" },
    { icon: "🔒", label: "Fechamento de Mês" },
    { icon: "📋", label: "Relatórios PDF" },
  ];

  const titleS = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{
        fontFamily: montserrat, fontSize: 42, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 50,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
      }}>
        Tudo que você<br />precisa
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%", maxWidth: 800,
      }}>
        {features.map((f, i) => {
          const s = spring({ frame: frame - 15 - i * 5, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "18px 20px",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s, [0, 1], [0.8, 1])}) translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
            }}>
              <div style={{ fontSize: 30 }}>{f.icon}</div>
              <div style={{ fontFamily: poppins, fontSize: 16, fontWeight: 600, color: "#fff" }}>{f.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: Dashboard Preview (330-510 = 6s) ──
const SceneDashboard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowS = spring({ frame: frame - 5, fps, config: { damping: 18 } });
  const badgeOp = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const kpis = [
    { label: "Receitas", value: "R$ 125.400", color: "#22c55e", trend: "+12%" },
    { label: "Despesas", value: "R$ 87.200", color: "#ef4444", trend: "-5%" },
    { label: "Lucro", value: "R$ 38.200", color: "#3b82f6", trend: "+18%" },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        fontFamily: poppins, fontSize: 14, fontWeight: 600, color: "#3b82f6",
        letterSpacing: 4, textTransform: "uppercase", marginBottom: 12,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        📊 DASHBOARD
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 38, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 30,
        opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Visão completa em tempo real
      </div>

      {/* Mock dashboard */}
      <div style={{
        width: 900, background: "rgba(15,20,45,0.9)", borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
        transform: `scale(${interpolate(windowS, [0, 1], [0.85, 1])})`,
        opacity: interpolate(windowS, [0, 1], [0, 1]),
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Title bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
          background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: 10 }}>
            9Nine Business Control
          </div>
        </div>

        {/* KPIs */}
        <div style={{ padding: 24, display: "flex", gap: 16 }}>
          {kpis.map((kpi, i) => {
            const s = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 14,
                padding: "20px 18px", border: "1px solid rgba(255,255,255,0.06)",
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
              }}>
                <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontFamily: inter, fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontFamily: poppins, fontSize: 11, color: kpi.color, marginTop: 4 }}>{kpi.trend}</div>
              </div>
            );
          })}
        </div>

        {/* Chart bars */}
        <div style={{ padding: "0 24px 24px", display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 30 + Math.sin(i * 0.8) * 40 + Math.cos(i * 1.2) * 20 + 40;
            const barS = spring({ frame: frame - 30 - i * 3, fps, config: { damping: 15 } });
            const barH = interpolate(barS, [0, 1], [0, h]);
            return (
              <div key={i} style={{
                flex: 1, height: barH, borderRadius: 6,
                background: i % 3 === 0
                  ? "linear-gradient(to top, #3b82f6, #60a5fa)"
                  : i % 3 === 1
                  ? "linear-gradient(to top, #8b5cf6, #a78bfa)"
                  : "linear-gradient(to top, #22c55e, #4ade80)",
                opacity: interpolate(barS, [0, 1], [0, 0.8]),
              }} />
            );
          })}
        </div>
      </div>

      {/* Badge */}
      <div style={{
        marginTop: 24, opacity: badgeOp,
        fontFamily: poppins, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)",
        letterSpacing: 2,
      }}>
        Dados atualizados em tempo real
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Security & Multi-user (510-660 = 5s) ──
const SceneSecurity = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { icon: "🔐", title: "Segurança Total", desc: "Criptografia e autenticação avançada" },
    { icon: "👥", title: "Multiusuário", desc: "Controle de acesso por perfil" },
    { icon: "📱", title: "100% Online", desc: "Acesse de qualquer lugar" },
    { icon: "⚡", title: "Inteligência", desc: "Relatórios e insights automáticos" },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{
        fontFamily: montserrat, fontSize: 40, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 50,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Por que escolher<br />
        <span style={{ color: "#3b82f6" }}>9Nine?</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 800 }}>
        {items.map((item, i) => {
          const s = spring({ frame: frame - 15 - i * 8, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20,
              background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "22px 28px",
              border: "1px solid rgba(255,255,255,0.08)",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(s, [0, 1], [i % 2 === 0 ? -60 : 60, 0])}px)`,
            }}>
              <div style={{ fontSize: 36 }}>{item.icon}</div>
              <div>
                <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 700, color: "#fff" }}>{item.title}</div>
                <div style={{ fontFamily: poppins, fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: CTA Outro (660-900 = 8s) ──
const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 80 } });
  const titleOp = interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [25, 50], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaS = spring({ frame: frame - 60, fps, config: { damping: 12 } });
  const pulseScale = 1 + Math.sin(frame * 0.06) * 0.03;
  const glowOp = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Big glow */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 65%)",
        opacity: glowOp,
      }} />

      {/* Logo */}
      <div style={{
        width: 160, height: 160, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${interpolate(logoS, [0, 1], [0, 1])})`,
        boxShadow: "0 0 100px rgba(59,130,246,0.5)",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 140, height: 140, objectFit: "contain" }} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: montserrat, fontSize: 48, fontWeight: 900, color: "#fff",
        textAlign: "center", marginTop: 30, opacity: titleOp,
        transform: `translateY(${titleY}px)`, lineHeight: 1.2,
      }}>
        Comece agora!
      </div>

      <div style={{
        fontFamily: poppins, fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.7)",
        textAlign: "center", marginTop: 14, maxWidth: 600,
        opacity: interpolate(frame, [45, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Gerencie suas finanças com inteligência e praticidade
      </div>

      {/* CTA Button */}
      <div style={{
        marginTop: 40,
        opacity: interpolate(ctaS, [0, 1], [0, 1]),
        transform: `scale(${interpolate(ctaS, [0, 1], [0.8, 1]) * pulseScale})`,
      }}>
        <div style={{
          fontFamily: inter, fontSize: 18, fontWeight: 700, color: "#fff",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          padding: "18px 56px", borderRadius: 60,
          boxShadow: "0 12px 40px rgba(59,130,246,0.4)",
        }}>
          Teste Grátis por 7 Dias
        </div>
      </div>

      {/* Website */}
      <div style={{
        position: "absolute", bottom: 80,
        fontFamily: poppins, fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.4)",
        letterSpacing: 2,
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        www.9ninebpo.com.br
      </div>

      {/* Instagram handle */}
      <div style={{
        position: "absolute", bottom: 40,
        fontFamily: poppins, fontSize: 14, fontWeight: 600, color: "#3b82f6",
        opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        @9ninebpo
      </div>
    </AbsoluteFill>
  );
};

// ── Main Composition ──
export const InstagramReels = () => {
  return (
    <AbsoluteFill>
      <AnimatedBG />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={180}>
          <SceneFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={180}>
          <SceneDashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneSecurity />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={240}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
