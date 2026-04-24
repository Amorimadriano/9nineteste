import * as React from "react";

/** Breakpoint em pixels para considerar dispositivo mobile */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook para detectar se o dispositivo é mobile
 *
 * Usa media query para detectar se a largura da viewport é menor que
 * MOBILE_BREAKPOINT (768px). Atualiza automaticamente quando a janela é redimensionada.
 *
 * @returns boolean - true se largura < 768px, false caso contrário
 *
 * @example
 * ```typescript
 * function ResponsiveComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia}
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
