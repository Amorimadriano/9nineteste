import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "600", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });

const KPICard = ({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const scale = interpolate(s, [0, 1], [0.7, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      borderRadius: 16,
      padding: "28px 32px",
      border: "1px solid rgba(255,255,255,0.08)",
      transform: `scale(${scale})`,
      opacity,
      backdropFilter: undefined,
      minWidth: 220,
    }}>
      <div style={{ fontFamily: poppins, fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: inter, fontSize: 36, fontWeight: 700, color }}>{value}</div>
    </div>
  );
};

const BarChart = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bars = [65, 45, 80, 55, 90, 70, 85];
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180 }}>
      {bars.map((h, i) => {
        const s = spring({ frame: frame - delay - i * 4, fps, config: { damping: 12 } });
        const barH = interpolate(s, [0, 1], [0, h * 1.8]);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36,
              height: barH,
              borderRadius: "6px 6px 0 0",
              background: `linear-gradient(180deg, #3b82f6, #1d4ed8)`,
              opacity: interpolate(s, [0, 1], [0, 1]),
            }} />
            <span style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{months[i]}</span>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  const titleX = interpolate(titleS, [0, 1], [-80, 0]);

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      {/* Section badge */}
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#3b82f6",
        letterSpacing: 3, textTransform: "uppercase", marginBottom: 12,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        📊 Painel Principal
      </div>

      {/* Title */}
      <div style={{
        fontFamily: inter, fontSize: 52, fontWeight: 900, color: "#fff",
        transform: `translateX(${titleX}px)`, marginBottom: 50,
      }}>
        Dashboard Inteligente
      </div>

      {/* KPI Row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 50 }}>
        <KPICard label="Receitas" value="R$ 85.420" color="#22c55e" delay={10} />
        <KPICard label="Despesas" value="R$ 42.180" color="#ef4444" delay={16} />
        <KPICard label="Saldo" value="R$ 43.240" color="#3b82f6" delay={22} />
        <KPICard label="A Receber" value="R$ 12.800" color="#f59e0b" delay={28} />
      </div>

      {/* Chart area */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 20,
        padding: "30px 40px",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ fontFamily: poppins, fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
          Saldo Acumulado — Gráfico de Barras
        </div>
        <BarChart delay={30} />
      </div>
    </AbsoluteFill>
  );
};
