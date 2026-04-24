import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "600", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });

const FeatureItem = ({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
  const x = interpolate(s, [0, 1], [60, 0]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div style={{
      display: "flex", gap: 20, alignItems: "flex-start",
      transform: `translateX(${x}px)`, opacity,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, flexShrink: 0,
        border: "1px solid rgba(59,130,246,0.2)",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
        <div style={{ fontFamily: poppins, fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
};

export const ContasScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#22c55e",
        letterSpacing: 3, textTransform: "uppercase", marginBottom: 12,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        💰 Gestão Financeira
      </div>

      <div style={{
        fontFamily: inter, fontSize: 52, fontWeight: 900, color: "#fff",
        transform: `translateX(${interpolate(titleS, [0, 1], [-80, 0])}px)`,
        marginBottom: 50,
      }}>
        Contas a Pagar & Receber
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px 80px" }}>
        <FeatureItem icon="📋" title="Lançamentos Completos" desc="Cadastre receitas e despesas com categorias, fornecedores e clientes" delay={8} />
        <FeatureItem icon="🔄" title="Recorrência Automática" desc="Contas recorrentes são geradas automaticamente mês a mês" delay={16} />
        <FeatureItem icon="📎" title="Anexos e Documentos" desc="Anexe boletos, notas fiscais e comprovantes a cada lançamento" delay={24} />
        <FeatureItem icon="🔔" title="Alertas de Vencimento" desc="Receba notificações sobre contas próximas do vencimento" delay={32} />
        <FeatureItem icon="📊" title="Filtros Avançados" desc="Filtre por status, período, categoria e forma de pagamento" delay={40} />
        <FeatureItem icon="📄" title="Exportação PDF" desc="Gere relatórios em PDF para compartilhar com sua equipe" delay={48} />
      </div>
    </AbsoluteFill>
  );
};
