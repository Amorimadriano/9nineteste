import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

export const { fontFamily: inter } = loadFont("normal", { weights: ["400", "600", "700", "900"], subsets: ["latin"] });
export const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });

export const SectionBadge = ({ icon, label, delay = 0 }: { icon: string; label: string; delay?: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      fontFamily: poppins, fontSize: 14, fontWeight: 600, color: "#3b82f6",
      letterSpacing: 3, textTransform: "uppercase", marginBottom: 12, opacity,
    }}>
      {icon} {label}
    </div>
  );
};

export const SectionTitle = ({ text, delay = 5 }: { text: string; delay?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 100 } });
  const x = interpolate(s, [0, 1], [-80, 0]);
  return (
    <div style={{
      fontFamily: inter, fontSize: 48, fontWeight: 900, color: "#fff",
      transform: `translateX(${x}px)`, marginBottom: 40,
    }}>
      {text}
    </div>
  );
};

export const StepItem = ({ number, title, description, delay }: { number: number; title: string; description: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const scale = interpolate(s, [0, 1], [0.8, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 20, opacity, transform: `scale(${scale})`,
      background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "20px 28px",
      border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontFamily: inter, fontSize: 20, fontWeight: 700,
        color: "#fff", flexShrink: 0,
      }}>
        {number}
      </div>
      <div>
        <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
        <div style={{ fontFamily: poppins, fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>{description}</div>
      </div>
    </div>
  );
};

export const MockWindow = ({ children, title, delay = 10 }: { children: React.ReactNode; title: string; delay?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
  const scale = interpolate(s, [0, 1], [0.9, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div style={{
      background: "rgba(15,20,45,0.9)", borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)", transform: `scale(${scale})`, opacity,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
        background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
        <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 12 }}>{title}</div>
      </div>
      <div style={{ padding: "24px 28px" }}>
        {children}
      </div>
    </div>
  );
};

export const HighlightBox = ({ children, color = "#3b82f6", delay = 0, pulse = false }: {
  children: React.ReactNode; color?: string; delay?: number; pulse?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const glow = pulse ? 0.3 + Math.sin((frame - delay) * 0.1) * 0.15 : 0.3;

  return (
    <div style={{
      border: `2px solid ${color}`,
      borderRadius: 12, padding: "16px 24px",
      background: `${color}11`,
      boxShadow: `0 0 20px ${color}${Math.round(glow * 255).toString(16).padStart(2, "0")}`,
      opacity: interpolate(s, [0, 1], [0, 1]),
      transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
    }}>
      {children}
    </div>
  );
};
