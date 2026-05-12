import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins } from "../tutorial-scenes/shared";

export const ConciliacaoIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 80 } });
  const subtitleS = spring({ frame: frame - 35, fps, config: { damping: 20 } });
  const badgeS = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const iconScale = 0.95 + Math.sin(frame * 0.06) * 0.05;

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Badge */}
      <div style={{
        fontFamily: poppins, fontSize: 16, fontWeight: 600, color: "#3b82f6",
        letterSpacing: 4, textTransform: "uppercase", marginBottom: 24,
        opacity: interpolate(badgeS, [0, 1], [0, 1]),
      }}>
        📘 Tutorial Completo
      </div>

      {/* Main title */}
      <div style={{
        fontFamily: inter, fontSize: 64, fontWeight: 900, color: "#fff",
        textAlign: "center", lineHeight: 1.1, marginBottom: 16,
        transform: `translateY(${interpolate(titleS, [0, 1], [60, 0])}px)`,
        opacity: interpolate(titleS, [0, 1], [0, 1]),
      }}>
        Conciliação Bancária
        <br />
        <span style={{ color: "#3b82f6" }}>&</span> Conciliação de Cartão
      </div>

      {/* Subtitle */}
      <div style={{
        fontFamily: poppins, fontSize: 22, fontWeight: 300, color: "rgba(255,255,255,0.6)",
        textAlign: "center", maxWidth: 700, lineHeight: 1.5,
        opacity: interpolate(subtitleS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(subtitleS, [0, 1], [30, 0])}px)`,
      }}>
        Aprenda passo a passo como importar extratos, conciliar lançamentos
        e manter seu financeiro sempre atualizado
      </div>

      {/* Animated icons row */}
      <div style={{
        display: "flex", gap: 40, marginTop: 50,
        opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {["🏦", "📄", "✅", "💳"].map((icon, i) => {
          const s = spring({ frame: frame - 55 - i * 8, fps, config: { damping: 10 } });
          return (
            <div key={i} style={{
              width: 80, height: 80, borderRadius: 20,
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, transform: `scale(${interpolate(s, [0, 1], [0, iconScale])})`,
            }}>
              {icon}
            </div>
          );
        })}
      </div>

      {/* 9Nine branding */}
      <div style={{
        position: "absolute", bottom: 40, fontFamily: inter, fontSize: 16, fontWeight: 700,
        color: "rgba(255,255,255,0.3)", letterSpacing: 2,
      }}>
        9Nine Business Control
      </div>
    </AbsoluteFill>
  );
};
