import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { inter, poppins } from "./shared";

export const TutorialCompletoIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 25, fps, config: { damping: 15 } }), [0, 1], [60, 0]);
  const subOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [50, 70], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [40, 80], [0, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeOpacity = interpolate(frame, [75, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const modules = [
    "Login", "Empresa", "Dashboard", "Contas a Pagar", "Contas a Receber",
    "Cadastros", "Bancos", "Conciliação", "Fluxo de Caixa", "DRE",
    "Planejamento", "Fechamento", "Auditoria", "Configurações",
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        width: 140, height: 140, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${logoScale})`, boxShadow: "0 0 60px rgba(59,130,246,0.4)",
        marginBottom: 24, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 120, height: 120, objectFit: "contain" }} />
      </div>

      <div style={{ fontFamily: inter, fontSize: 56, fontWeight: 900, color: "#fff", opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: "center" }}>
        Tutorial Completo
      </div>

      <div style={{ width: lineW, height: 3, background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)", marginTop: 14, marginBottom: 14, borderRadius: 2 }} />

      <div style={{ fontFamily: poppins, fontSize: 22, fontWeight: 300, color: "rgba(255,255,255,0.8)", opacity: subOpacity, transform: `translateY(${subY}px)`, letterSpacing: 4, textTransform: "uppercase" }}>
        Guia passo a passo de todo o sistema
      </div>

      <div style={{
        marginTop: 40, opacity: badgeOpacity,
        display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 900,
      }}>
        {modules.map((item, i) => {
          const s = spring({ frame: frame - 78 - i * 2, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              fontFamily: poppins, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)",
              padding: "8px 18px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
            }}>
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
