import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  BarChart3,
  Tag,
  Users,
  Truck,
  LogOut,
  Building2,
  Bell,
  FileSpreadsheet,
  Scale,
  CreditCard,
  Target,
  CalendarCheck,
  BookOpen,
  Settings,
  UsersRound,
  Briefcase,
  ShieldCheck,
  Receipt,
  KeyRound,
  TrendingUp,
  ArrowRightLeft,
  Crosshair,
  Banknote,
  FileText,
  Calculator,
  TreeDeciduous,
  Search,
  Shield,
  Percent,
  Gem,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Empresa", url: "/empresa", icon: Briefcase },
  { title: "Licenças de Software", url: "/licencas-software", icon: KeyRound, adminOnly: true },
  { title: "Dashboard", url: "/", icon: LayoutDashboard, tour: "dashboard" },
  { title: "Bancos e Cartões", url: "/bancos-cartoes", icon: Building2 },
  { title: "Open Banking", url: "/open-banking", icon: Banknote, disabled: true },
  { title: "Categorias", url: "/categorias", icon: Tag },
  { title: "Plano de Contas", url: "/plano-contas", icon: TreeDeciduous, disabled: true },
  { title: "Clientes", url: "/clientes", icon: Users, tour: "clientes" },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
  { title: "Contas a Receber", url: "/contas-receber", icon: ArrowDownCircle, tour: "contas-receber" },
  { title: "Contas a Pagar", url: "/contas-pagar", icon: ArrowUpCircle, tour: "contas-pagar" },
  { title: "Transferências Entre Contas", url: "/transferencias-contas", icon: ArrowRightLeft },
  { title: "Régua de Cobrança", url: "/regua-cobranca", icon: Bell },
  { title: "Consulta CNPJ/CPF", url: "/consulta-cnpj-cpf", icon: Search },
  { title: "Score Serasa", url: "/consulta-score-serasa", icon: Shield },
  { title: "Simulador IBS/CBS", url: "/simulador-ibs-cbs", icon: Percent },
  { title: "Conciliação Bancária", url: "/conciliacao-bancaria", icon: Scale },
  { title: "Conciliação de Cartões", url: "/conciliacao-cartao", icon: CreditCard },
  { title: "9nine Card Control", url: "/card-audit", icon: Receipt },
  { title: "CNAB 240", url: "/cnab240", icon: FileSpreadsheet, adminOnly: true },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: DollarSign },
  { title: "DRE Gerencial", url: "/dre", icon: BarChart3 },
  { title: "Planejamento Orçamentário", url: "/planejamento-orcamentario", icon: Target },
  { title: "Auditoria Recebíveis", url: "/auditoria-recebiveis", icon: Receipt },
  { title: "NFS-e Emissão", url: "/nfse", icon: FileText, disabled: true },
  { title: "Integração Contábil", url: "/integracao-contabil", icon: Calculator, disabled: true },
  { title: "ROI", url: "/roi", icon: TrendingUp },
  { title: "Ponto de Equilíbrio", url: "/ponto-equilibrio", icon: Crosshair },
  { title: "Fechamento de Mês", url: "/fechamento-mes", icon: CalendarCheck },
  { title: "Contador", url: "/contador", icon: BookOpen },
];

const cadastroItems = [
  { title: "Planos", url: "/planos", icon: Gem },
  { title: "Configurações", url: "/configuracoes", icon: Settings, tour: "configuracoes" },
  { title: "Usuários", url: "/usuarios", icon: UsersRound },
  { title: "Email Marketing", url: "/email-marketing", icon: Receipt, adminOnly: true },
  { title: "Leads Capturados", url: "/leads", icon: Target, adminOnly: true },
  { title: "Auditoria do Sistema", url: "/auditoria", icon: ShieldCheck, adminOnly: true },
];

const relatorioItems = [
  { title: "Relatórios", url: "/relatorios", icon: FileSpreadsheet },
];

function obterIniciais(nome?: string | null): string {
  if (!nome) return "ME";
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase();
}

function LogoComCacheBusting(url?: string | null): string | null {
  if (!url) return null;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { empresaSelecionada } = useEmpresa();

  const nomeFantasia = empresaSelecionada?.nome_fantasia || empresaSelecionada?.razao_social || "Minha Empresa";
  const logoUrl = LogoComCacheBusting(empresaSelecionada?.logo_url);
  const iniciais = obterIniciais(nomeFantasia);

  return (
    <Sidebar collapsible="icon" data-tour="sidebar">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-primary"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) parent.innerHTML = `<span class="text-xs font-bold text-primary-foreground">${iniciais}</span>`;
                }}
              />
            ) : (
              <span className="text-xs font-bold text-primary-foreground">{iniciais}</span>
            )}
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold font-display text-sidebar-foreground">9Nine Business Control</p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {nomeFantasia}
              </p>
            </div>
          )}
        </div>

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestão Financeira</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => !(item as any).adminOnly || ADMIN_EMAILS.includes(user?.email || ""))
                .map((item) => (
                <SidebarMenuItem key={item.title} data-tour={(item as any).tour}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cadastros */}
        <SidebarGroup>
          <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cadastroItems
                .filter((item) => !(item as any).adminOnly || ADMIN_EMAILS.includes(user?.email || ""))
                .map((item) => (
                <SidebarMenuItem key={item.title} data-tour={(item as any).tour}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Relatórios */}
        <SidebarGroup>
          <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {relatorioItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground truncate mb-2 px-1">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
