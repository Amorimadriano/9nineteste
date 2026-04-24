import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "600", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });

const FlowStep = ({ number, title, desc, delay, color }: { number: string; title: string; desc: string; delay: number; color: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const scale = interpolate(s, [0, 1], [0.5, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      transform: `scale(${scale})`, opacity, maxWidth: 200,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: inter, fontSize: 28, fontWeight: 900, color: "#fff",
        marginBottom: 16, boxShadow: `0 0 30px ${color}44`,
      }}>
        {number}
      </div>
      <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6, textAlign: "center" }}>{title}</div>
      <div style={{ fontFamily: poppins, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
};

const Arrow = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ fontFamily: inter, fontSize: 32, color: `rgba(255,255,255,${opacity})`, alignSelf: "center", marginTop: -20 }}>
      →
    </div>
  );
};

export const ConciliacaoScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#8b5cf6",
        letterSpacing: 3, textTransform: "uppercase", marginBottom: 12,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        🏦 Conciliação
      </div>

      <div style={{
        fontFamily: inter, fontSize: 48, fontWeight: 900, color: "#fff",
        transform: `translateX(${interpolate(titleS, [0, 1], [-80, 0])}px)`,
        marginBottom: 20,
      }}>
        Conciliação Bancária & Cartão
      </div>

      <div style={{
        fontFamily: poppins, fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.6)",
        marginBottom: 60, maxWidth: 700,
        opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        Importe extratos OFX e faturas de cartão, compare com seus lançamentos e identifique divergências automaticamente.
      </div>

      {/* Flow steps */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", alignItems: "flex-start" }}>
        <FlowStep number="1" title="Importar OFX" desc="Upload do extrato bancário" delay={20} color="#3b82f6" />
        <Arrow delay={28} />
        <FlowStep number="2" title="Conciliar" desc="Compare com o sistema" delay={30} color="#8b5cf6" />
        <Arrow delay={38} />
        <FlowStep number="3" title="Resolver" desc="Ajuste divergências" delay={40} color="#22c55e" />
        <Arrow delay={48} />
        <FlowStep number="4" title="Pagar Fatura" desc="Baixa automática no caixa" delay={50} color="#f59e0b" />
      </div>

      {/* Bottom cards */}
      <div style={{
        display: "flex", gap: 30, marginTop: 60,
        opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {[
          { title: "Parcelamento", desc: "Suporte a 1x até 24x no cartão", icon: "💳" },
          { title: "Conciliação Manual", desc: "Compare transação por transação", icon: "🔍" },
          { title: "Saldo em Tempo Real", desc: "Acompanhe divergências ao vivo", icon: "⚡" },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 16,
            padding: "20px 24px", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontFamily: inter, fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontFamily: poppins, fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.45)" }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
