import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "600"], subsets: ["latin"] });

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleY = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 15, stiffness: 80 } }),
    [0, 1], [60, 0]
  );
  const titleOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [50, 70], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [40, 80], [0, 400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Logo image in circle */}
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          overflow: "hidden",
          transform: `scale(${logoScale})`,
          boxShadow: "0 0 60px rgba(59,130,246,0.4)",
          marginBottom: 30,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("images/logo-9nine.jpg")}
          style={{
            width: 160,
            height: 160,
            objectFit: "contain",
          }}
        />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 72,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: -2,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        9Nine Control
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
          marginTop: 16,
          marginBottom: 16,
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          fontFamily: poppins,
          fontSize: 28,
          fontWeight: 300,
          color: "rgba(255,255,255,0.8)",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        Gestão Financeira Empresarial
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: poppins,
          fontSize: 18,
          fontWeight: 300,
          color: "rgba(255,255,255,0.5)",
          opacity: taglineOpacity,
          marginTop: 40,
          letterSpacing: 2,
        }}
      >
        Controle total das suas finanças em um só lugar
      </div>
    </AbsoluteFill>
  );
};
