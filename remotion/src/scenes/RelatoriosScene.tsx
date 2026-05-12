import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const { fontFamily: inter } = loadFont("normal", { weights: ["400", "600", "700", "900"], subsets: ["latin"] });
const { fontFamily: poppins } = loadPoppins("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });

const ModuleCard = ({ icon, title, delay }: { icon: string; title: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      borderRadius: 16, padding: "24px 28px",
      border: "1px solid rgba(255,255,255,0.08)",
      transform: `translateY(${y}px)`, opacity,
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 600, color: "#fff" }}>{title}</div>
    </div>
  );
};

export const RelatoriosScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });

  const modules = [
    { icon: "📈", title: "DRE — Demonstrativo de Resultados", delay: 10 },
    { icon: "💹", title: "Fluxo de Caixa", delay: 16 },
    { icon: "🎯", title: "Planejamento Orçamentário", delay: 22 },
    { icon: "📅", title: "Fechamento Mensal", delay: 28 },
    { icon: "👥", title: "Gestão de Clientes e Fornecedores", delay: 34 },
    { icon: "🏷️", title: "Categorias Personalizáveis", delay: 40 },
    { icon: "🏦", title: "Bancos e Cartões", delay: 46 },
    { icon: "👤", title: "Gestão de Usuários", delay: 52 },
  ];

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <div style={{
        fontFamily: poppins, fontSize: 13, fontWeight: 600, color: "#f59e0b",
        letterSpacing: 3, textTransform: "uppercase", marginBottom: 12,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        🧩 Módulos Completos
      </div>

      <div style={{
        fontFamily: inter, fontSize: 52, fontWeight: 900, color: "#fff",
        transform: `translateX(${interpolate(titleS, [0, 1], [-80, 0])}px)`,
        marginBottom: 50,
      }}>
        Tudo que você precisa
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {modules.map((m, i) => (
          <ModuleCard key={i} {...m} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
