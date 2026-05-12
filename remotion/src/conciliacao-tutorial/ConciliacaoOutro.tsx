import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins } from "../tutorial-scenes/shared";

export const ConciliacaoOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const checkItems = [
    "Cadastrar bancos e cartões",
    "Importar extrato OFX",
    "Conciliar lançamentos bancários",
    "Importar fatura de cartão via CSV",
    "Vincular e conciliar gastos de cartão",
  ];

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        fontFamily: inter, fontSize: 52, fontWeight: 900, color: "#fff",
        textAlign: "center", marginBottom: 30,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
      }}>
        Tutorial Completo! ✅
      </div>

      <div style={{
        fontFamily: poppins, fontSize: 20, fontWeight: 300, color: "rgba(255,255,255,0.6)",
        textAlign: "center", marginBottom: 40,
        opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Agora você sabe como usar a conciliação no 9Nine Business Control
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 550 }}>
        {checkItems.map((item, i) => {
          const s = spring({ frame: frame - 35 - i * 8, fps, config: { damping: 12 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 24px",
              border: "1px solid rgba(34,197,94,0.15)",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#22c55e",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: "#fff", fontWeight: 700, flexShrink: 0,
              }}>
                ✓
              </div>
              <div style={{ fontFamily: inter, fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>

      {/* Branding */}
      <div style={{
        position: "absolute", bottom: 40, fontFamily: inter, fontSize: 16, fontWeight: 700,
        color: "rgba(255,255,255,0.3)", letterSpacing: 2,
        opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        9Nine Business Control — Gestão Financeira Inteligente
      </div>
    </AbsoluteFill>
  );
};
