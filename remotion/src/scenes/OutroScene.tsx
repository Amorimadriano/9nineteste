import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "600"], subsets: ["latin"] });

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 80 } });
  const titleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 55], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 80, fps, config: { damping: 10 } });
  const glowOpacity = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Large glow behind */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
        opacity: glowOpacity,
      }} />

      {/* Logo image in circle */}
      <div style={{
        width: 160,
        height: 160,
        borderRadius: "50%",
        overflow: "hidden",
        transform: `scale(${interpolate(logoS, [0, 1], [0, 1])})`,
        boxShadow: "0 0 80px rgba(59,130,246,0.5)",
        marginBottom: 30,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Img
          src={staticFile("images/logo-9nine.jpg")}
          style={{
            width: 140,
            height: 140,
            objectFit: "contain",
          }}
        />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: inter, fontSize: 64, fontWeight: 900, color: "#fff",
        opacity: titleOpacity, transform: `translateY(${titleY}px)`,
        textAlign: "center",
      }}>
        9Nine Control
      </div>

      {/* Subtitle */}
      <div style={{
        fontFamily: poppins, fontSize: 22, fontWeight: 300,
        color: "rgba(255,255,255,0.7)", opacity: subOpacity,
        marginTop: 16, textAlign: "center",
      }}>
        Simplifique sua gestão financeira
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 50, opacity: ctaOpacity,
        transform: `scale(${interpolate(ctaScale, [0, 1], [0.8, 1])})`,
      }}>
        <div style={{
          fontFamily: inter, fontSize: 18, fontWeight: 600,
          color: "#fff", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          padding: "16px 48px", borderRadius: 50,
          boxShadow: "0 8px 30px rgba(59,130,246,0.4)",
          letterSpacing: 1,
        }}>
          www.9ninebpo.com.br
        </div>
      </div>

      {/* Bottom text */}
      <div style={{
        position: "absolute", bottom: 50,
        fontFamily: poppins, fontSize: 14, fontWeight: 300,
        color: "rgba(255,255,255,0.3)", letterSpacing: 2,
        opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        9Nine BPO — Fortalecendo Empresas
      </div>
    </AbsoluteFill>
  );
};
