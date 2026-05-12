import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, MockWindow } from "./shared";

const KPI = ({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px",
      border: "1px solid rgba(255,255,255,0.08)", opacity: interpolate(s, [0, 1], [0, 1]),
      transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`, flex: 1,
    }}>
      <div style={{ fontFamily: poppins, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: inter, fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
};

export const DashboardTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pointer animation
  const pointerOpacity = interpolate(frame, [80, 90, 180, 190], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pointerX = interpolate(frame, [90, 130, 140, 170], [600, 400, 400, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pointerY = interpolate(frame, [90, 130, 140, 170], [300, 350, 350, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="📊" label="Passo 2 — Painel Principal" />
      <SectionTitle text="Dashboard — Visão Geral" />

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1.3 }}>
          <MockWindow title="Dashboard — 9Nine Control" delay={15}>
            {/* KPI row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <KPI label="Receitas" value="R$ 85.420" color="#22c55e" delay={25} />
              <KPI label="Despesas" value="R$ 42.180" color="#ef4444" delay={30} />
              <KPI label="Saldo" value="R$ 43.240" color="#3b82f6" delay={35} />
            </div>
            {/* Mini chart */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontFamily: poppins, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>Fluxo de Caixa</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
                {[50, 70, 45, 80, 60, 90, 75].map((h, i) => {
                  const s = spring({ frame: frame - 40 - i * 3, fps, config: { damping: 12 } });
                  return (
                    <div key={i} style={{
                      width: 28, height: interpolate(s, [0, 1], [0, h * 1.2]), borderRadius: "4px 4px 0 0",
                      background: i === 5 ? "linear-gradient(180deg, #22c55e, #16a34a)" : "linear-gradient(180deg, #3b82f6, #1d4ed8)",
                      opacity: interpolate(s, [0, 1], [0, 1]),
                    }} />
                  );
                })}
              </div>
            </div>
          </MockWindow>
        </div>

        <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
          {[
            { icon: "📈", title: "KPIs em Tempo Real", desc: "Receitas, despesas e saldo atualizados automaticamente" },
            { icon: "📊", title: "Gráficos Interativos", desc: "Visualize fluxo de caixa e tendências" },
            { icon: "🔔", title: "Alertas de Vencimento", desc: "Contas próximas do vencimento em destaque" },
          ].map((item, i) => {
            const s = spring({ frame: frame - 50 - i * 12, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontFamily: poppins, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated cursor */}
      <div style={{
        position: "absolute", left: pointerX, top: pointerY, opacity: pointerOpacity,
        width: 24, height: 24, pointerEvents: "none",
      }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
          <path d="M5 3l14 8-6 2-3 7z" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
