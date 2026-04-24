/**
 * Hook de Autosave
 * Salva automaticamente rascunhos de formulários
 */

import { useState, useCallback } from "react";

interface UseAutosaveReturn<T> {
  salvarRascunho: (data: T) => void;
  rascunhoSalvo: boolean;
  ultimoSalvamento: string | null;
  carregando: boolean;
  rascunho?: T;
}

export function useAutosave<T extends Record<string, unknown>>(
  key: string,
  initialData?: T
): UseAutosaveReturn<T> {
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);
  const [ultimoSalvamento, setUltimoSalvamento] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [rascunho, setRascunho] = useState<T | undefined>(initialData);

  const salvarRascunho = useCallback(
    (data: T) => {
      setCarregando(true);

      // Simular salvamento no localStorage
      try {
        localStorage.setItem(`rascunho-${key}`, JSON.stringify(data));
        setRascunhoSalvo(true);
        setUltimoSalvamento(new Date().toISOString());
        setRascunho(data);

        // Resetar estado de salvo após 2 segundos
        setTimeout(() => {
          setRascunhoSalvo(false);
        }, 2000);
      } catch (error) {
        console.error("Erro ao salvar rascunho:", error);
      } finally {
        setCarregando(false);
      }
    },
    [key]
  );

  return {
    salvarRascunho,
    rascunhoSalvo,
    ultimoSalvamento,
    carregando,
    rascunho,
  };
}
