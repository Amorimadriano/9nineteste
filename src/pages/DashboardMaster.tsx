import { useEmpresa } from "@/contexts/EmpresaContext";
import { useNavigate } from "react-router-dom";
import EmpresaCard from "@/components/EmpresaCard";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { useMemo } from "react";
import { useTableQuery } from "@/hooks/useSupabaseQuery";

export default function DashboardMaster() {
  const { empresas, selecionarEmpresa } = useEmpresa();
  const navigate = useNavigate();

  const { data: bancos = [] } = useTableQuery("bancos_cartoes");
  const { data: extrato = [] } = useTableQuery("extrato_bancario");

  const kpisPorEmpresa = useMemo(() => {
    const map = new Map<string, { saldo: number; pendentes: number }>();

    empresas.forEach((emp) => {
      const bancosEmp = (bancos as any[]).filter(
        (b) => b.empresa_id === emp.id && b.ativo
      );
      const saldo = bancosEmp.reduce(
        (s, b) => s + Number(b.saldo_inicial || 0),
        0
      );

      const pendentes = (extrato as any[]).filter(
        (e) =>
          e.empresa_id === emp.id && !e.conciliado
      ).length;

      map.set(emp.id, { saldo, pendentes });
    });

    return map;
  }, [empresas, bancos, extrato]);

  const handleAcessar = async (empresaId: string) => {
    await selecionarEmpresa(empresaId);
    navigate("/");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">
              Painel de Controle
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todos os CNPJs da sua operação BPO
          </p>
        </div>
        <Button onClick={() => navigate("/nova-empresa")}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Nova Empresa
        </Button>
      </div>

      {/* Lista de Empresas */}
      {empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium text-muted-foreground">
            Nenhuma empresa cadastrada
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Comece adicionando sua primeira empresa para gerenciar as finanças
            via BPO.
          </p>
          <Button className="mt-4" onClick={() => navigate("/nova-empresa")}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Empresa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas.map((empresa) => {
            const kpi = kpisPorEmpresa.get(empresa.id);
            return (
              <EmpresaCard
                key={empresa.id}
                empresa={empresa}
                onAcessar={handleAcessar}
                saldoBancario={kpi?.saldo}
                pendenciasConciliacao={kpi?.pendentes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
