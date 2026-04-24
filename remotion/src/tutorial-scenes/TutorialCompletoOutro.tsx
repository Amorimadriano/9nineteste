import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { inter, poppins } from "./shared";

export const TutorialCompletoOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 80 } });
  const titleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 55], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const checkOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowOpacity = 0.3 + Math.sin(frame * 0.08) * 0.15;

  const features = [
    "✅ Login e cadastro de conta",
    "✅ Dados da empresa",
    "✅ Dashboard com KPIs",
    "✅ Contas a Pagar e Receber",
    "✅ Clientes e Fornecedores",
    "✅ Bancos e Cartões",
    "✅ Conciliação Bancária e de Cartão",
    "✅ Fluxo de Caixa",
    "✅ DRE Gerencial",
    "✅ Planejamento Orçamentário",
    "✅ Fechamento de Mês",
    "✅ Relatórios e Categorias",
    "✅ Auditoria e Configurações",
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
        opacity: glowOpacity,
      }} />

      <div style={{
        width: 120, height: 120, borderRadius: "50%", overflow: "hidden",
        transform: `scale(${interpolate(logoS, [0, 1], [0, 1])})`,
        boxShadow: "0 0 80px rgba(59,130,246,0.5)", marginBottom: 20,
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Img src={staticFile("images/logo-9nine.jpg")} style={{ width: 100, height: 100, objectFit: "contain" }} />
      </div>

      <div style={{ fontFamily: inter, fontSize: 48, fontWeight: 900, color: "#fff", opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: "center" }}>
        Tutorial Completo! 🎉
      </div>

      <div style={{ fontFamily: poppins, fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.7)", opacity: subOpacity, marginTop: 10, textAlign: "center" }}>
        Agora você domina todas as funcionalidades do 9Nine Business Control
      </div>

      {/* Checklist in 2 columns */}
      <div style={{
        marginTop: 30, display: "flex", gap: 30, opacity: checkOpacity,
      }}>
        {[features.slice(0, 7), features.slice(7)].map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {col.map((feat, i) => {
              const idx = ci * 7 + i;
              const s = spring({ frame: frame - 75 - idx * 3, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  fontFamily: poppins, fontSize: 14, color: "rgba(255,255,255,0.8)",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(s, [0, 1], [20, 0])}px)`,
                }}>
                  {feat}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 30,
        opacity: interpolate(frame, [130, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          fontFamily: inter, fontSize: 16, fontWeight: 600, color: "#fff",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          padding: "14px 44px", borderRadius: 50,
          boxShadow: "0 8px 30px rgba(59,130,246,0.4)",
        }}>
          Gestão Financeira Inteligente
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 40,
        fontFamily: poppins, fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.3)", letterSpacing: 2,
        opacity: interpolate(frame, [140, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        9Nine Business Control — www.9ninebpo.com.br
      </div>
    </AbsoluteFill>
  );
};
