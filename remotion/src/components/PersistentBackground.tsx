import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();
  const totalFrames = 1600;
  const hueShift = interpolate(frame, [0, totalFrames], [0, 30], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, totalFrames], [0, -80], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(${135 + hueShift * 0.5}deg, #0a0e27 0%, #121838 35%, #1a1f4e 65%, #0d1130 100%)`,
        }}
      />
      {/* Subtle floating orbs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          top: 100 + y * 0.3,
          right: -100,
          transform: `scale(${1 + Math.sin(frame * 0.02) * 0.1})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
          bottom: 50 + y * 0.2,
          left: -80,
          transform: `scale(${1 + Math.cos(frame * 0.015) * 0.12})`,
        }}
      />
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: `translateY(${y * 0.1}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
