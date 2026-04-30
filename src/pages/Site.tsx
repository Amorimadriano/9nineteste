import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AgenteVendas } from "@/components/site/AgenteVendas";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, BarChart3, Monitor, Phone, Mail, Instagram,
  ChevronRight, CheckCircle2, ArrowRight, Menu, X, Shield,
  TrendingUp, Users, FileText, Zap, Star, MapPin, Gift, Clock, Target
} from "lucide-react";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Sistema ERP", href: "#erp" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

export default function Site() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAcessar = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <a href="#inicio" className="flex items-center gap-3">
            <img
              src="/logo-9nine-new.png"
              alt="9Nine Business Control"
              className="h-14 w-14 rounded-full object-cover shadow-md ring-2 ring-blue-500/20"
            />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-blue-900 tracking-tight">9Nine</span>
              <span className="text-xl font-bold text-blue-500 tracking-tight"> Business Control</span>
              <p className="text-[10px] text-blue-400 -mt-1 tracking-widest uppercase">Gestão Financeira Inteligente</p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-500 after:transition-all"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={handleAcessar}
              className="ml-2 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-colors"
            >
              Acessar Sistema
            </button>
            
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-blue-800"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-blue-50 px-6 pb-4 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-gray-700 hover:text-blue-600 py-2"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={handleAcessar}
              className="block text-center px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
            >
              Acessar Sistema
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center pt-20"
        style={{
          background: "linear-gradient(135deg, #0a1628 0%, #112240 40%, #1a3a6e 100%)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left – Logo + Text */}
          <div className="space-y-8">
            <div className="flex items-center gap-5 mb-4">
              <img
                src="/logo-9nine-new.png"
                alt="9Nine Business Control"
                className="h-28 w-28 lg:h-36 lg:w-36 rounded-full object-cover shadow-2xl ring-4 ring-blue-400/30"
              />
              <div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  9Nine <span className="text-blue-400">Business Control</span>
                </h1>
                <p className="text-blue-300/80 text-sm tracking-[0.25em] uppercase mt-1">
                  Gestão Financeira Inteligente
                </p>
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-snug">
              Gestão financeira{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 font-extrabold">
                inteligente
              </span>{" "}
              para o seu negócio
            </h2>

            <p className="text-blue-200/70 text-lg max-w-lg leading-relaxed">
              Somos especialistas em BPO Financeiro e Consultoria Empresarial. 
              Contamos com um <strong className="text-white">sistema ERP financeiro próprio</strong> para 
              entregar mais controle, eficiência e visão estratégica ao seu negócio.
            </p>

          </div>

          {/* Right – Stats cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: "Segurança", desc: "Dados protegidos com criptografia" },
              { icon: TrendingUp, label: "Performance", desc: "Resultados reais e mensuráveis" },
              { icon: Users, label: "Atendimento", desc: "Equipe especializada e dedicada" },
              { icon: Zap, label: "Agilidade", desc: "Processos automatizados e rápidos" },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
              >
                <card.icon className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={32} />
                <h3 className="text-white font-bold text-lg">{card.label}</h3>
                <p className="text-blue-300/60 text-sm mt-1">{card.desc}</p>
              </div>
            ))}
          </div>
             <div className="flex flex-wrap gap-4">
              <a
                href="#contato"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-400/40">
                Fale Conosco <ArrowRight size={18} />
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-blue-400/30 text-blue-300 font-semibold hover:bg-blue-400/10 transition-all">
              
                Nossos Serviços <ChevronRight size={18} />
              </a>
            </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="servicos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Nossos Serviços
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-blue-900">
              Soluções completas em{" "}
              <span className="text-blue-500">gestão financeira</span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Oferecemos um ecossistema integrado de serviços para transformar a gestão financeira da sua empresa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* BPO */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                <DollarSign className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">BPO Financeiro</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Terceirização completa do departamento financeiro da sua empresa com profissionais especializados e processos otimizados.
              </p>
              <ul className="space-y-3">
                {["Contas a pagar e receber", "Conciliação bancária", "Fluxo de caixa", "Relatórios gerenciais", "Gestão de cobranças"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Consultoria */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 md:-mt-4 md:mb-4">
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                  ★ Destaque
                </span>
              </div>
              <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
                <BarChart3 className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Consultoria Financeira Empresarial</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Análise estratégica e orientação especializada para decisões financeiras que impulsionam o crescimento do seu negócio.
              </p>
              <ul className="space-y-3">
                {["Planejamento estratégico", "Análise de viabilidade", "Reestruturação financeira", "Planejamento tributário", "Indicadores de performance"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ERP */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-700/30">
                <Monitor className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Sistema ERP Financeiro</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Plataforma própria desenvolvida sob medida com dashboards inteligentes, relatórios avançados e controle total das finanças.
              </p>
              <ul className="space-y-3">
                {["Dashboard em tempo real", "DRE e fluxo de caixa", "Conciliação bancária e cartão", "Planejamento orçamentário", "Fechamento mensal automatizado"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── ERP Highlight ── */}
      <section id="erp" className="py-24" style={{ background: "linear-gradient(135deg, #0a1628 0%, #112240 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest rounded-full">
                Tecnologia Própria
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-snug">
                <span className="text-blue-400">9Nine Business Control</span> — Nosso sistema ERP financeiro
              </h2>
              <p className="text-blue-200/60 text-lg leading-relaxed">
                Desenvolvemos internamente um sistema de gestão financeira completo e moderno. 
                Com interface intuitiva, dashboards em tempo real e automações inteligentes, 
                o 9Nine Business Control coloca as finanças da sua empresa na palma da sua mão.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FileText, label: "Relatórios PDF" },
                  { icon: BarChart3, label: "DRE Automático" },
                  { icon: Shield, label: "Dados Seguros" },
                  { icon: Star, label: "Interface Premium" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <f.icon size={20} className="text-blue-400" />
                    <span className="text-white text-sm font-medium">{f.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAcessar}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-500 text-white font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-400 transition-colors"
              >
                Acessar o 9Nine Business Control <ArrowRight size={18} />
              </button>
            </div>

            <div className="relative">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-blue-300/40 text-xs">9Nine Business Control — Dashboard</span>
                </div>
                {/* Mock dashboard */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Receitas", value: "R$ 85.400", color: "bg-green-500/20 text-green-400" },
                    { label: "Despesas", value: "R$ 42.100", color: "bg-red-500/20 text-red-400" },
                    { label: "Saldo", value: "R$ 43.300", color: "bg-blue-500/20 text-blue-400" },
                  ].map((kpi) => (
                    <div key={kpi.label} className={`rounded-xl p-3 ${kpi.color}`}>
                      <p className="text-[10px] uppercase tracking-wider opacity-60">{kpi.label}</p>
                      <p className="text-lg font-bold mt-1">{kpi.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 h-28">
                  {[65, 40, 75, 50, 85, 60, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {["Contas", "Conciliação", "DRE", "Fluxo"].map((tab) => (
                    <span key={tab} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-blue-300/60">
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="sobre" className="py-24 bg-blue-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
            Sobre Nós
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-blue-900 mb-6">
            Por que escolher a <span className="text-blue-500">9Nine Business Control</span>?
          </h2>
          <p className="text-gray-500 max-w-3xl mx-auto text-lg leading-relaxed mb-16">
            Combinamos expertise financeira com tecnologia de ponta para oferecer soluções 
            que realmente transformam a gestão do seu negócio. Nossa equipe está comprometida 
            com a excelência e com os resultados dos nossos clientes.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "100%", label: "Dedicação ao cliente" },
              { number: "24/7", label: "Sistema disponível" },
              { number: "ERP", label: "Próprio e exclusivo" },
              { number: "BPO", label: "Financeiro completo" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-8 shadow-sm border border-blue-50 hover:shadow-lg transition-all">
                <p className="text-4xl font-extrabold text-blue-600 mb-2">{stat.number}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── TESTIMONIALS ── */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #0a1628 0%, #112240 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Depoimentos
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
              O que nossos <span className="text-blue-400">clientes dizem</span>
            </h2>
            <p className="text-blue-200/60 mt-4 max-w-2xl mx-auto">
              Empresas que transformaram sua gestão financeira com a 9Nine Business Control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                nome: "Carlos Mendonça",
                cargo: "CEO — Mendonça & Associados",
                texto: "O BPO Financeiro da 9Nine transformou completamente nossa rotina. Antes gastávamos horas com planilhas, hoje temos relatórios prontos e decisões baseadas em dados reais. O sistema ERP é simplesmente fantástico!",
                estrelas: 5,
              },
              {
                nome: "Fernanda Oliveira",
                cargo: "Diretora Financeira — TechBrasil Soluções",
                texto: "O 9Nine Business Control nos deu uma visão 360° das finanças. A conciliação bancária automatizada economiza horas por semana, e o dashboard em tempo real mudou a forma como tomamos decisões estratégicas.",
                estrelas: 5,
              },
              {
                nome: "Roberto Almeida",
                cargo: "Sócio-fundador — Grupo RAL Engenharia",
                texto: "Contratamos o BPO Financeiro e o sistema ERP juntos. A combinação é imbatível: equipe dedicada + tecnologia de ponta. O ponto de equilíbrio e o DRE automático nos ajudam a planejar com segurança.",
                estrelas: 5,
              },
              {
                nome: "Juliana Prates",
                cargo: "Gerente Administrativa — Prates Logística",
                texto: "Nosso fluxo de caixa estava desorganizado. Com o 9Nine, conseguimos enxergar exatamente para onde o dinheiro vai, prever cenários e reduzir custos desnecessários em mais de 20%.",
                estrelas: 5,
              },
              {
                nome: "André Matsumoto",
                cargo: "Proprietário — Matsumoto Comércio Exterior",
                texto: "A régua de cobrança e os alertas automatizados reduziram nossa inadimplência pela metade. O suporte da equipe 9Nine é excepcional — sempre disponíveis e proativos.",
                estrelas: 5,
              },
              {
                nome: "Patrícia Duarte",
                cargo: "CFO — Duarte & Filhos Construções",
                texto: "Migrar para o 9Nine Business Control foi a melhor decisão do ano. O fechamento mensal que antes levava 3 dias agora é feito em horas. A integração com nosso contador ficou perfeita.",
                estrelas: 5,
              },
            ].map((dep) => (
              <div
                key={dep.nome}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: dep.estrelas }).map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed mb-6 italic">
                  "{dep.texto}"
                </p>
                <div>
                  <p className="text-white font-bold text-sm">{dep.nome}</p>
                  <p className="text-blue-300/60 text-xs">{dep.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLIENT LOGOS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Nossos Clientes
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-blue-900">
              Empresas que <span className="text-blue-500">confiam</span> na 9Nine
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              "Mendonça & Associados",
              "TechBrasil Soluções",
              "Grupo RAL Engenharia",
              "Prates Logística",
              "Matsumoto Comércio Exterior",
              "Duarte & Filhos Construções",
              "Bella Vista Restaurantes",
              "Nova Era Contabilidade",
              "FortePlan Consultoria",
              "Atlântica Importação",
              "GreenTech Ambiental",
              "Master Serviços Ltda",
            ].map((empresa) => (
              <div
                key={empresa}
                className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 flex items-center justify-center text-center hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <span className="text-sm font-bold text-blue-800/80">{empresa}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIAGNÓSTICO FINANCEIRO GRATUITO ── */}
      <SecaoDiagnostico />

      {/* ── ENDEREÇO & MAPA ── */}
      <section id="contato" className="bg-gray-50 py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-900">Nosso Escritório</h2>
            <p className="text-gray-500 mt-2">Venha nos visitar ou entre em contato</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={24} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-lg font-semibold text-blue-900">Avenida Paulista, 1842</p>
                  <p className="text-gray-600">Conjunto 178 — 17º Andar</p>
                  <p className="text-gray-600">Bairro Bela Vista — São Paulo/SP</p>
                  <p className="text-gray-600">CEP: 01310-936</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Phone size={18} className="text-green-500" />
                <a href="https://wa.me/5511960012210" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600 transition-colors">
                  (11) 96001-2210
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500" />
                <a href="mailto:contato@9ninebusinesscontrol.com.br" className="text-gray-700 hover:text-blue-600 transition-colors">
                  contato@9ninebusinesscontrol.com.br
                </a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-blue-100">
              <iframe
                title="Localização 9Nine Business Control"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0976951312897!2d-46.65588492378789!3d-23.56326746126953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0x63e5b2f3e4a0f079!2sAv.%20Paulista%2C%201842%20-%20Bela%20Vista%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2001310-936!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENTE VIRTUAL DE VENDAS ── */}
      <AgenteVendas />

      {/* ── FOOTER ── */}
      <footer className="bg-blue-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 items-start">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <img
                src="/logo-9nine-new.png"
                alt="9Nine Business Control"
                className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-400/30"
              />
              <div>
                <p className="text-lg font-bold">
                  9Nine <span className="text-blue-400">Business Control</span>
                </p>
                <p className="text-blue-300/50 text-xs">Gestão Financeira Inteligente</p>
              </div>
            </div>

            {/* Contacts */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-4">Contato</h4>
              <a
                href="https://wa.me/5511960012210"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-blue-200/70 hover:text-white transition-colors text-sm"
              >
                <Phone size={16} className="text-green-400" />
                (11) 96001-2210
              </a>
              <a
                href="mailto:contato@9ninebusinesscontrol.com.br"
                className="flex items-center gap-3 text-blue-200/70 hover:text-white transition-colors text-sm"
              >
                <Mail size={16} className="text-blue-400" />
                contato@9ninebusinesscontrol.com.br
              </a>
              <button
                onClick={() => window.open("https://www.instagram.com/9ninebusinesscontrol/", "_blank", "noopener,noreferrer")}
                className="flex items-center gap-3 text-blue-200/70 hover:text-white transition-colors text-sm cursor-pointer"
              >
                <Instagram size={16} className="text-pink-400" />
                @9ninebusinesscontrol
              </button>
              <div className="flex items-start gap-3 text-blue-200/70 text-sm pt-2">
                <MapPin size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span>Av. Paulista, 1842 — Cj. 178 — 17º Andar<br />Bela Vista, São Paulo/SP — CEP 01310-936</span>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-4">Serviços</h4>
              <p className="text-blue-200/70 text-sm">BPO Financeiro</p>
              <p className="text-blue-200/70 text-sm">Consultoria Financeira Empresarial</p>
              <p className="text-blue-200/70 text-sm">Sistema ERP Financeiro — 9Nine Business Control</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-800/50 text-center">
            <p className="text-blue-300/40 text-xs">
              © {new Date().getFullYear()} 9Nine Business Control — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============= DIAGNÓSTICO FINANCEIRO GRATUITO =============
function SecaoDiagnostico() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      nome: String(fd.get("nome") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      telefone: String(fd.get("telefone") || "").trim(),
      empresa: String(fd.get("empresa") || "").trim(),
      cnpj: String(fd.get("cnpj") || "").trim() || null,
      faturamento_mensal: String(fd.get("faturamento_mensal") || "") || null,
      num_funcionarios: String(fd.get("num_funcionarios") || "") || null,
      principal_dor: String(fd.get("principal_dor") || "").trim() || null,
      origem: "site_diagnostico",
      status: "novo",
    };

    try {
      const { error } = await (supabase.from("leads_diagnostico") as any).insert(payload);
      if (error) throw error;
      setEnviado(true);
      form.reset();
      // Redireciona para WhatsApp com mensagem qualificada
      const msg = encodeURIComponent(
        `Olá! Acabei de solicitar um *Diagnóstico Financeiro Gratuito* no site da 9Nine.\n\n` +
        `📋 *Dados:*\n` +
        `Nome: ${payload.nome}\n` +
        `Empresa: ${payload.empresa}\n` +
        `Faturamento: ${payload.faturamento_mensal || "Não informado"}\n` +
        `Funcionários: ${payload.num_funcionarios || "Não informado"}\n\n` +
        `🎯 *Principal necessidade:*\n${payload.principal_dor || "Quero conhecer o serviço de BPO Financeiro"}`
      );
      setTimeout(() => {
        window.open(`https://wa.me/5511960012210?text=${msg}`, "_blank", "noopener,noreferrer");
      }, 800);
    } catch (err: any) {
      setErro(err?.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section id="cadastro" className="py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 relative overflow-hidden">
      {/* Decoração */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Coluna esquerda — Persuasão */}
          <div className="text-white">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              <Gift size={14} /> 100% Gratuito • Sem Compromisso
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
              Descubra <span className="text-yellow-300">onde sua empresa está perdendo dinheiro</span> em 30 minutos
            </h2>
            <p className="text-blue-100/80 text-lg leading-relaxed mb-8">
              Receba um <strong className="text-white">Diagnóstico Financeiro Gratuito</strong> realizado por nossos especialistas em BPO Financeiro. Identificamos gargalos, oportunidades de economia e organizamos um plano de ação personalizado.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: Target, titulo: "Análise de fluxo de caixa", desc: "Identificamos vazamentos e padrões de gastos" },
                { icon: TrendingUp, titulo: "Oportunidades de economia", desc: "Em média, encontramos 8-15% de redução de custos" },
                { icon: Clock, titulo: "Plano de ação em 7 dias", desc: "Você recebe um relatório executivo personalizado" },
                { icon: Shield, titulo: "Sigilo total garantido", desc: "Conformidade com LGPD e NDA quando solicitado" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{item.titulo}</p>
                    <p className="text-blue-200/70 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-900 flex items-center justify-center text-xs font-bold text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex text-yellow-300">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
              </div>
              <p className="text-blue-100/80 text-sm italic">
                "Em 60 dias identificamos R$ 47.000 em gastos desnecessários. O ROI do BPO foi imediato."
              </p>
              <p className="text-blue-300/60 text-xs mt-2">— Carlos M., CEO de e-commerce</p>
            </div>
          </div>

          {/* Coluna direita — Formulário */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            {enviado ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">Solicitação recebida! 🎉</h3>
                <p className="text-gray-600 mb-6">
                  Em até <strong>2 horas úteis</strong>, nossa equipe entrará em contato para agendar seu diagnóstico gratuito.
                </p>
                <p className="text-sm text-gray-500">
                  Você está sendo redirecionado para o WhatsApp...
                </p>
                <button
                  onClick={() => setEnviado(false)}
                  className="mt-6 text-sm text-blue-600 hover:underline"
                >
                  Enviar nova solicitação
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">
                    Quero meu diagnóstico gratuito
                  </h3>
                  <p className="text-sm text-gray-500">
                    Preencha em 60 segundos. Resposta em até 2h úteis.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="nome"
                      required
                      maxLength={100}
                      placeholder="Seu nome *"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <input
                      name="empresa"
                      required
                      maxLength={100}
                      placeholder="Empresa *"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={255}
                      placeholder="E-mail *"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <input
                      name="telefone"
                      required
                      maxLength={20}
                      placeholder="WhatsApp *"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  <input
                    name="cnpj"
                    maxLength={20}
                    placeholder="CNPJ (opcional)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      name="faturamento_mensal"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                    >
                      <option value="">Faturamento mensal *</option>
                      <option value="Até R$ 50 mil">Até R$ 50 mil</option>
                      <option value="R$ 50 mil a R$ 200 mil">R$ 50 mil a R$ 200 mil</option>
                      <option value="R$ 200 mil a R$ 500 mil">R$ 200 mil a R$ 500 mil</option>
                      <option value="R$ 500 mil a R$ 1 mi">R$ 500 mil a R$ 1 mi</option>
                      <option value="Acima de R$ 1 mi">Acima de R$ 1 mi</option>
                    </select>
                    <select
                      name="num_funcionarios"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                    >
                      <option value="">Nº funcionários</option>
                      <option value="1-5">1 a 5</option>
                      <option value="6-20">6 a 20</option>
                      <option value="21-50">21 a 50</option>
                      <option value="51-100">51 a 100</option>
                      <option value="100+">Mais de 100</option>
                    </select>
                  </div>

                  <textarea
                    name="principal_dor"
                    rows={3}
                    maxLength={500}
                    placeholder="Qual é o principal desafio financeiro da sua empresa hoje? (opcional)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                  />

                  {erro && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {erro}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-950 font-bold text-base hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {enviando ? "Enviando..." : <>Quero meu diagnóstico gratuito <ArrowRight size={20} /></>}
                  </button>

                  <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Shield size={12} /> Seus dados estão seguros • LGPD
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
