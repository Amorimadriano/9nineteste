import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  segmento: string | null;
  logo_url: string | null;
  ativo: boolean;
}

interface EmpresaContextType {
  empresas: Empresa[];
  empresaSelecionada: Empresa | null;
  selecionarEmpresa: (empresaId: string) => Promise<void>;
  recarregarEmpresa: () => Promise<void>;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType>({
  empresas: [],
  empresaSelecionada: null,
  selecionarEmpresa: async () => {},
  recarregarEmpresa: async () => {},
  loading: true,
});

export const useEmpresa = () => useContext(EmpresaContext);

const STORAGE_KEY = "9nine_empresa_selecionada";

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] =
    useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar empresas do usuário
  useEffect(() => {
    if (!user) {
      setEmpresas([]);
      setEmpresaSelecionada(null);
      setLoading(false);
      return;
    }

    const carregarEmpresas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("usuario_empresas")
        .select("empresa_id, empresas(id, razao_social, nome_fantasia, cnpj, segmento, logo_url, ativo)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao carregar empresas:", error);
        setLoading(false);
        return;
      }

      const lista: Empresa[] = (data ?? [])
        .map((item: any) => item.empresas)
        .filter(Boolean);

      setEmpresas(lista);

      // Restaurar seleção do localStorage ou usar a primeira
      const salva = localStorage.getItem(STORAGE_KEY);
      const encontrada = lista.find((e) => e.id === salva);
      if (encontrada) {
        setEmpresaSelecionada(encontrada);
      } else if (lista.length > 0) {
        setEmpresaSelecionada(lista[0]);
        localStorage.setItem(STORAGE_KEY, lista[0].id);
      }

      setLoading(false);
    };

    carregarEmpresas();
  }, [user]);

  const selecionarEmpresa = useCallback(
    async (empresaId: string) => {
      const encontrada = empresas.find((e) => e.id === empresaId);
      if (encontrada) {
        setEmpresaSelecionada(encontrada);
        localStorage.setItem(STORAGE_KEY, empresaId);
      }
    },
    [empresas]
  );

  const recarregarEmpresa = useCallback(async () => {
    if (!empresaSelecionada) return;
    const { data, error } = await supabase
      .from("empresas")
      .select("id, razao_social, nome_fantasia, cnpj, segmento, logo_url, ativo")
      .eq("id", empresaSelecionada.id)
      .single();

    if (error) {
      console.error("Erro ao recarregar empresa:", error);
      return;
    }

    if (data) {
      const atualizada: Empresa = {
        id: data.id,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        segmento: data.segmento,
        logo_url: data.logo_url,
        ativo: data.ativo,
      };
      setEmpresaSelecionada(atualizada);
      setEmpresas((prev) =>
        prev.map((e) => (e.id === atualizada.id ? atualizada : e))
      );
    }
  }, [empresaSelecionada]);

  return (
    <EmpresaContext.Provider
      value={{ empresas, empresaSelecionada, selecionarEmpresa, recarregarEmpresa, loading }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}
