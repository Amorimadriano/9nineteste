import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { inter, poppins } from "./shared";

export const TutorialOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 80 } });
  const titleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 55], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const checkOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowOpacity = 0.3 + Math.sin(frame * 0.08) * 0.15;

  const features = [
    "✅ Dashboard completo",
    "✅ Contas a Pagar e Receber",
    "✅ Conciliação Bancária",
    "✅ Relatórios e DRE",
    "✅ Categorias e Cadastros",
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
        opacity: glowOpacity,
      }} />

      <div style={{
        width: 140, height: 140, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${interpolate(logoS, [0, 1], [0, 1])})`,
        boxShadow: "0 0 80px rgba(59,130,246,0.5)", marginBottom: 24,
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 120, height: 120, objectFit: "contain" }} />
      </div>

      <div style={{ fontFamily: inter, fontSize: 52, fontWeight: 900, color: "#fff", opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: "center" }}>
        Pronto para começar!
      </div>

      <div style={{ fontFamily: poppins, fontSize: 20, fontWeight: 300, color: "rgba(255,255,255,0.7)", opacity: subOpacity, marginTop: 12, textAlign: "center" }}>
        Agora você conhece todas as funcionalidades
      </div>

      {/* Checklist */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 8, opacity: checkOpacity }}>
        {features.map((feat, i) => {
          const s = spring({ frame: frame - 75 - i * 6, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              fontFamily: poppins, fontSize: 16, color: "rgba(255,255,255,0.8)",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              {feat}
            </div>
          );
        })}
      </div>

      {/* URL */}
      <div style={{
        marginTop: 40,
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#fff",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          padding: "14px 44px", borderRadius: 50,
          boxShadow: "0 8px 30px rgba(59,130,246,0.4)",
        }}>
          www.9ninebpo.com.br
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 50,
        fontFamily: poppins, fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.3)", letterSpacing: 2,
        opacity: interpolate(frame, [120, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        9Nine BPO — Fortalecendo Empresas
      </div>
    </AbsoluteFill>
  );
};
