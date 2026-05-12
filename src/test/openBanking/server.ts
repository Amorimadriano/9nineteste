/**
 * Configuração do servidor MSW para testes
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// Helper para resetar handlers entre testes
export const resetServer = () => {
  server.resetHandlers();
};
