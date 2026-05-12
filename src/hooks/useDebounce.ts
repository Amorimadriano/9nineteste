import { useState, useEffect } from "react";

/**
 * Hook para debounce de valores - util para filtros de busca
 * @param value - Valor a ser debounced
 * @param delay - Delay em ms (default: 300ms)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
