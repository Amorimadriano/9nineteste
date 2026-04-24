import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { inter, poppins, SectionBadge, SectionTitle, MockWindow } from "./shared";

export const CategoriasTutorial = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const categories = [
    { icon: "🏢", name: "Aluguel", tipo: "Despesa", color: "#ef4444" },
    { icon: "💡", name: "Energia", tipo: "Despesa", color: "#ef4444" },
    { icon: "💼", name: "Consultoria", tipo: "Receita", color: "#22c55e" },
    { icon: "🛠️", name: "Manutenção", tipo: "Despesa", color: "#ef4444" },
    { icon: "📦", name: "Vendas", tipo: "Receita", color: "#22c55e" },
    { icon: "🚗", name: "Transporte", tipo: "Despesa", color: "#ef4444" },
  ];

  const modules = [
    { icon: "👥", name: "Clientes", desc: "Cadastro de clientes e contatos" },
    { icon: "🏭", name: "Fornecedores", desc: "Gerencie seus fornecedores" },
    { icon: "🏦", name: "Bancos & Cartões", desc: "Contas bancárias e cartões" },
    { icon: "🏢", name: "Dados da Empresa", desc: "Informações cadastrais" },
  ];

  return (
    <AbsoluteFill style={{ padding: "60px 100px" }}>
      <SectionBadge icon="⚙️" label="Passo 7 — Configurações" />
      <SectionTitle text="Categorias e Cadastros" />

      <div style={{ display: "flex", gap: 40 }}>
        {/* Categories */}
        <div style={{ flex: 1 }}>
          <MockWindow title="Categorias" delay={15}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {categories.map((cat, i) => {
                const s = spring({ frame: frame - 25 - i * 5, fps, config: { damping: 14 } });
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    opacity: interpolate(s, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
                  }}>
                    <div style={{ fontSize: 20 }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontFamily: inter, fontSize: 13, fontWeight: 600, color: "#fff" }}>{cat.name}</div>
                      <div style={{ fontFamily: poppins, fontSize: 10, color: cat.color }}>{cat.tipo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </MockWindow>
        </div>

        {/* Other modules */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: poppins, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8,
            opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            Outros Cadastros
          </div>
          {modules.map((mod, i) => {
            const s = spring({ frame: frame - 40 - i * 10, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "18px 24px",
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
              }}>
                <div style={{ fontSize: 28 }}>{mod.icon}</div>
                <div>
                  <div style={{ fontFamily: inter, fontSize: 17, fontWeight: 700, color: "#fff" }}>{mod.name}</div>
                  <div style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{mod.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
