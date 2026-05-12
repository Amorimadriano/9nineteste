// Declaracoes de tipo para runtime Deno (Supabase Edge Functions)
// Silencia erros TS no VS Code para imports via URL e namespace Deno

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

// Catch-all para imports via URL (Deno / esm.sh)
declare module "https://*" {
  const mod: any;
  export = mod;
  export default mod;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
  export { default } from "@supabase/supabase-js";
}

// node-forge via esm.sh e coberto pelo catch-all "https://*" acima
