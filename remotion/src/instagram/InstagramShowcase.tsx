import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600", "700"], subsets: ["latin"] });
const { fontFamily: montserrat } = loadMontserrat("normal", { weights: ["800", "900"], subsets: ["latin"] });

const TRANSITION = 20;
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
          radial-gradient(ellipse at ${50 + Math.sin(shift * 0.02) * 20}% ${30 + Math.cos(shift * 0.015) * 15}%, rgba(59,130,246,0.35) 0%, transparent 55%),
          radial-gradient(ellipse at ${70 + Math.cos(shift * 0.018) * 15}% ${70 + Math.sin(shift * 0.022) * 10}%, rgba(139,92,246,0.25) 0%, transparent 45%),
          radial-gradient(ellipse at ${30 + Math.sin(shift * 0.025) * 10}% ${50 + Math.cos(shift * 0.02) * 15}%, rgba(34,197,94,0.1) 0%, transparent 50%),
          linear-gradient(160deg, #070b18 0%, #0c1633 35%, #12103a 70%, #0a0e1a 100%)
        `,
      }} />
      {/* Grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`h${i}`} style={{
          position: "absolute", top: `${(i + 1) * 12.5}%`, left: 0, right: 0,
          height: 1, background: "rgba(59,130,246,0.04)",
        }} />
      ))}
      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => {
        const speed = 0.2 + (i % 5) * 0.1;
        const x = 50 + (i * 71) % 980;
        const y = ((i * 137 + frame * speed) % 2100) - 100;
        const size = 2 + (i % 3) * 1.5;
        const opacity = 0.1 + (i % 4) * 0.04;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: size, height: size, borderRadius: "50%",
            background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#8b5cf6" : "#22c55e",
            opacity,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

// ── Scene 1: Logo Intro (0-120 frames = 4s) ──
const SceneIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const ringScale = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 60 } });
  const titleOp = interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 25, fps, config: { damping: 15 } }), [0, 1], [50, 0]);
  const subOp = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [35, 70], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [65, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseGlow = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 280, height: 280, borderRadius: "50%",
        border: "2px solid rgba(59,130,246,0.25)",
        transform: `scale(${interpolate(ringScale, [0, 1], [0.5, 1])})`,
        opacity: pulseGlow,
        boxShadow: "0 0 100px rgba(59,130,246,0.15)",
      }} />

      <div style={{
        width: 180, height: 180, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${logoScale})`,
        boxShadow: "0 0 80px rgba(59,130,246,0.5), 0 20px 60px rgba(0,0,0,0.5)",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 160, height: 160, objectFit: "contain" }} />
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 58, fontWeight: 900, color: "#fff",
        marginTop: 28, opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center", lineHeight: 1.1, letterSpacing: -1,
      }}>
        9Nine
        <br />
        <span style={{ fontSize: 38, fontWeight: 800, color: "#3b82f6" }}>Business Control</span>
      </div>

      <div style={{
        width: lineW, height: 3, borderRadius: 2, marginTop: 18,
        background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
      }} />

      <div style={{
        fontFamily: poppins, fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.7)",
        opacity: subOp, marginTop: 14, letterSpacing: 4, textTransform: "uppercase", textAlign: "center",
      }}>
        Gestão Financeira Inteligente
      </div>

      <div style={{
        fontFamily: poppins, fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.45)",
        opacity: tagOp, marginTop: 35, textAlign: "center", maxWidth: 600, lineHeight: 1.6,
      }}>
        Conheça o sistema que vai transformar sua gestão financeira
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 2: Site Preview (120-270 = 5s) ──
const SceneSite = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleS = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const imgS = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 90 } });
  const scrollY = interpolate(frame, [60, 120], [0, -120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#3b82f6",
        letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, opacity: badgeOp,
      }}>
        🌐 NOSSO SITE
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 36, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 24,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
      }}>
        Presença Online Profissional
      </div>

      <div style={{
        width: 920, borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        transform: `scale(${interpolate(imgS, [0, 1], [0.85, 1])})`,
        opacity: interpolate(imgS, [0, 1], [0, 1]),
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: "rgba(30,35,60,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>
            www.9ninebpo.com.br
          </div>
        </div>
        <div style={{ height: 1100, overflow: "hidden" }}>
          <Img
            src={staticFile("images/site-hero.png")}
            style={{
              width: "100%", objectFit: "cover", objectPosition: "top",
              transform: `translateY(${scrollY}px)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: ERP System Preview (270-430 = ~5.3s) ──
const SceneERP = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleS = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const imgS = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#8b5cf6",
        letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, opacity: badgeOp,
      }}>
        💻 SISTEMA ERP
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 36, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 24,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
      }}>
        Tecnologia Própria
      </div>

      <div style={{
        width: 920, borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.15)",
        transform: `scale(${interpolate(imgS, [0, 1], [0.85, 1])})`,
        opacity: interpolate(imgS, [0, 1], [0, 1]),
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: "rgba(30,35,60,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>
            9Nine Business Control — Sistema ERP
          </div>
        </div>
        <div style={{ height: 1100, overflow: "hidden" }}>
          <Img src={staticFile("images/site-erp.png")} style={{ width: "100%", objectFit: "cover", objectPosition: "top" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Login Preview (430-560 = ~4.3s) ──
const SceneLogin = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleS = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const imgS = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#22c55e",
        letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, opacity: badgeOp,
      }}>
        🔐 ACESSO SEGURO
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 36, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 24,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
      }}>
        Login Simples e Seguro
      </div>

      <div style={{
        width: 800, borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,197,94,0.1)",
        transform: `scale(${interpolate(imgS, [0, 1], [0.85, 1])})`,
        opacity: interpolate(imgS, [0, 1], [0, 1]),
      }}>
        <Img src={staticFile("images/login-screen.png")} style={{ width: "100%", objectFit: "cover" }} />
      </div>

      <div style={{
        marginTop: 24, fontFamily: poppins, fontSize: 14, color: "rgba(255,255,255,0.5)",
        opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        letterSpacing: 2,
      }}>
        🎉 Teste grátis por 5 dias
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: Features Grid (560-720 = ~5.3s) ──
const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: "💰", label: "Contas a Pagar", desc: "Controle total" },
    { icon: "📥", label: "Contas a Receber", desc: "Recebimentos" },
    { icon: "🏦", label: "Conciliação", desc: "Bancária e Cartão" },
    { icon: "📊", label: "Fluxo de Caixa", desc: "Projeção real" },
    { icon: "📈", label: "DRE Gerencial", desc: "Análise completa" },
    { icon: "🎯", label: "Planejamento", desc: "Orçamentário" },
    { icon: "🔒", label: "Fechamento", desc: "Mensal automático" },
    { icon: "📋", label: "Relatórios", desc: "PDF profissional" },
    { icon: "👥", label: "Clientes", desc: "Cadastro completo" },
    { icon: "🏢", label: "Fornecedores", desc: "Gestão integrada" },
  ];

  const titleS = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 50 }}>
      <div style={{
        fontFamily: montserrat, fontSize: 38, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 40,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
      }}>
        Funcionalidades
        <br />
        <span style={{ color: "#3b82f6" }}>Completas</span>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 850,
      }}>
        {features.map((f, i) => {
          const s = spring({ frame: frame - 10 - i * 4, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "14px 16px",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`,
            }}>
              <div style={{ fontSize: 26 }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: inter, fontSize: 15, fontWeight: 700, color: "#fff" }}>{f.label}</div>
                <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 6: Dashboard Mock (720-900 = 6s) ──
const SceneDashboard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowS = spring({ frame: frame - 5, fps, config: { damping: 18 } });

  const kpis = [
    { label: "Receitas", value: "R$ 125.400", color: "#22c55e", trend: "↑ +12%" },
    { label: "Despesas", value: "R$ 87.200", color: "#ef4444", trend: "↓ -5%" },
    { label: "Lucro", value: "R$ 38.200", color: "#3b82f6", trend: "↑ +18%" },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 35 }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#3b82f6",
        letterSpacing: 4, textTransform: "uppercase", marginBottom: 10,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        📊 DASHBOARD EM TEMPO REAL
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 34, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 24,
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Visão completa do seu negócio
      </div>

      <div style={{
        width: 950, background: "rgba(12,18,42,0.95)", borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        transform: `scale(${interpolate(windowS, [0, 1], [0.88, 1])})`,
        opacity: interpolate(windowS, [0, 1], [0, 1]),
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
          background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e" }} />
          <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>
            Dashboard — 9Nine Business Control
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", gap: 14 }}>
          {kpis.map((kpi, i) => {
            const s = spring({ frame: frame - 18 - i * 7, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12,
                padding: "16px 14px", border: "1px solid rgba(255,255,255,0.05)",
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(s, [0, 1], [15, 0])}px)`,
              }}>
                <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontFamily: poppins, fontSize: 10, color: kpi.color, marginTop: 3, fontWeight: 600 }}>{kpi.trend}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "0 20px 20px", display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 25 + Math.sin(i * 0.8) * 35 + Math.cos(i * 1.2) * 18 + 35;
            const barS = spring({ frame: frame - 28 - i * 2.5, fps, config: { damping: 15 } });
            const barH = interpolate(barS, [0, 1], [0, h]);
            return (
              <div key={i} style={{
                flex: 1, height: barH, borderRadius: 5,
                background: i % 3 === 0
                  ? "linear-gradient(to top, #3b82f6, #60a5fa)"
                  : i % 3 === 1
                  ? "linear-gradient(to top, #8b5cf6, #a78bfa)"
                  : "linear-gradient(to top, #22c55e, #4ade80)",
                opacity: interpolate(barS, [0, 1], [0, 0.85]),
              }} />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 7: Benefits (900-1050 = 5s) ──
const SceneBenefits = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { icon: "🔐", title: "Segurança Total", desc: "Criptografia avançada e backup automático" },
    { icon: "👥", title: "Multiusuário", desc: "Controle de acesso por perfil e permissões" },
    { icon: "📱", title: "100% Online", desc: "Acesse de qualquer lugar, a qualquer hora" },
    { icon: "⚡", title: "Automação", desc: "Relatórios e alertas automáticos" },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 50 }}>
      <div style={{
        fontFamily: montserrat, fontSize: 38, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 40,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Por que escolher
        <br />
        <span style={{ color: "#3b82f6" }}>9Nine?</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 850 }}>
        {items.map((item, i) => {
          const s = spring({ frame: frame - 12 - i * 7, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 18,
              background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.07)",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(s, [0, 1], [i % 2 === 0 ? -50 : 50, 0])}px)`,
            }}>
              <div style={{ fontSize: 32 }}>{item.icon}</div>
              <div>
                <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 700, color: "#fff" }}>{item.title}</div>
                <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 8: CTA Outro (1050-1260 = 7s) ──
const SceneCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 80 } });
  const titleOp = interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [25, 45], [35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaS = spring({ frame: frame - 55, fps, config: { damping: 12 } });
  const pulseScale = 1 + Math.sin(frame * 0.06) * 0.025;
  const glowOp = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 60%)",
        opacity: glowOp,
      }} />

      <div style={{
        width: 150, height: 150, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${interpolate(logoS, [0, 1], [0, 1])})`,
        boxShadow: "0 0 100px rgba(59,130,246,0.5)",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 130, height: 130, objectFit: "contain" }} />
      </div>

      <div style={{
        fontFamily: montserrat, fontSize: 44, fontWeight: 900, color: "#fff",
        textAlign: "center", marginTop: 28, opacity: titleOp,
        transform: `translateY(${titleY}px)`, lineHeight: 1.2,
      }}>
        Experimente Grátis!
      </div>

      <div style={{
        fontFamily: poppins, fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.65)",
        textAlign: "center", marginTop: 12, maxWidth: 550,
        opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Gestão financeira inteligente para sua empresa
      </div>

      <div style={{
        marginTop: 35,
        opacity: interpolate(ctaS, [0, 1], [0, 1]),
        transform: `scale(${interpolate(ctaS, [0, 1], [0.8, 1]) * pulseScale})`,
      }}>
        <div style={{
          fontFamily: inter, fontSize: 17, fontWeight: 700, color: "#fff",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          padding: "16px 50px", borderRadius: 60,
          boxShadow: "0 12px 40px rgba(59,130,246,0.35)",
        }}>
          Teste Grátis por 5 Dias
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 90,
        fontFamily: poppins, fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.4)",
        letterSpacing: 2,
        opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        www.9ninebpo.com.br
      </div>

      <div style={{
        position: "absolute", bottom: 50,
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#3b82f6",
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        @9ninebusinesscontrol
      </div>
    </AbsoluteFill>
  );
};

// ── Main Composition (8 scenes ~42s at 30fps = 1260 frames) ──
export const InstagramShowcase = () => {
  // Scene durations (in frames)
  // Intro: 120, Site: 150, ERP: 160, Login: 130, Features: 160, Dashboard: 180, Benefits: 150, CTA: 210
  // 7 transitions of 20 frames = 140 overlap
  // Total: 1260 - 140 = 1120 frames ≈ 37s

  return (
    <AbsoluteFill>
      <AnimatedBG />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneSite />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={160}>
          <SceneERP />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={130}>
          <SceneLogin />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={160}>
          <SceneFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={180}>
          <SceneDashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneBenefits />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={210}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
