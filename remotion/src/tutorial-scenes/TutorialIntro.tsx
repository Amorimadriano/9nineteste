import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { inter, poppins } from "./shared";

export const TutorialIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 25, fps, config: { damping: 15 } }), [0, 1], [60, 0]);
  const subOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [50, 70], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [40, 80], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeOpacity = interpolate(frame, [75, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeScale = spring({ frame: frame - 75, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        width: 150, height: 150, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${logoScale})`, boxShadow: "0 0 60px rgba(59,130,246,0.4)",
        marginBottom: 30, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 130, height: 130, objectFit: "contain" }} />
      </div>

      <div style={{ fontFamily: inter, fontSize: 64, fontWeight: 900, color: "#fff", opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        Tutorial 9Nine Control
      </div>

      <div style={{ width: lineW, height: 3, background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)", marginTop: 16, marginBottom: 16, borderRadius: 2 }} />

      <div style={{ fontFamily: poppins, fontSize: 24, fontWeight: 300, color: "rgba(255,255,255,0.8)", opacity: subOpacity, transform: `translateY(${subY}px)`, letterSpacing: 4, textTransform: "uppercase" }}>
        Aprenda a usar o sistema completo
      </div>

      <div style={{
        marginTop: 50, opacity: badgeOpacity, transform: `scale(${interpolate(badgeScale, [0, 1], [0.8, 1])})`,
        display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center",
      }}>
        {["Dashboard", "Contas", "Conciliação", "Relatórios", "Categorias"].map((item, i) => (
          <div key={i} style={{
            fontFamily: poppins, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)",
            padding: "10px 22px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
          }}>
            {item}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
