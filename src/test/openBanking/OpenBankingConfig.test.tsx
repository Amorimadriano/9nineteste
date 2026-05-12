/**
 * Testes de UI Open Banking
 * Renderização, wizard de conexão, estados loading, mensagens erro/sucesso
 */
import React, { useState } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { mockBankConfigs, mockOpenBankingConnection } from "../fixtures/openBanking";

// Tipos para o componente
interface BankConfig {
  id: string;
  name: string;
  code: string;
  ispbCode: string;
  logoUrl: string;
}

interface OpenBankingConnection {
  id: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  agency: string;
  consentStatus: string;
  lastSyncAt?: string;
  status: "active" | "inactive" | "error";
}

// Componente mock de OpenBankingConfig
const OpenBankingConfig: React.FC<{
  banks: BankConfig[];
  connections: OpenBankingConnection[];
  onConnect: (bankId: string) => Promise<void>;
  onDisconnect: (connectionId: string) => Promise<void>;
  onSync: (connectionId: string) => Promise<void>;
}> = ({ banks, connections, onConnect, onDisconnect, onSync }) => {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    setIsWizardOpen(true);
    setWizardStep(1);
    setError(null);
  };

  const handleConnect = async () => {
    if (!selectedBank) return;

    setIsLoading(true);
    setError(null);

    try {
      await onConnect(selectedBank);
      setWizardStep(3); // Step de sucesso
      setSuccessMessage("Conexão realizada com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setIsLoading(true);
    try {
      await onDisconnect(connectionId);
    } catch (err) {
      setError("Erro ao desconectar");
    } finally {
      setIsLoading(false);
    }
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(1);
    setSelectedBank(null);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div data-testid="open-banking-config">
      <h1>Configuração Open Banking</h1>

      {/* Lista de bancos conectados */}
      <div data-testid="connections-list">
        <h2>Contas Conectadas</h2>
        {connections.length === 0 ? (
          <p>Nenhuma conta conectada</p>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.id}
              data-testid={`connection-${conn.id}`}
              data-status={conn.status}
            >
              <span>{conn.bankName}</span>
              <span>Ag: {conn.agency} - Cc: {conn.accountNumber}</span>
              <span>Status: {conn.consentStatus}</span>
              {conn.lastSyncAt && (
                <span>Última sync: {conn.lastSyncAt}</span>
              )}
              <button
                onClick={() => onSync(conn.id)}
                data-testid={`sync-btn-${conn.id}`}
              >
                Sincronizar
              </button>
              <button
                onClick={() => handleDisconnect(conn.id)}
                data-testid={`disconnect-btn-${conn.id}`}
              >
                Desconectar
              </button>
            </div>
          ))
        )}
      </div>

      {/* Lista de bancos disponíveis */}
      <div data-testid="banks-list">
        <h2>Adicionar Conta</h2>
        <div>
          {banks.map((bank) => (
            <button
              key={bank.id}
              data-testid={`bank-btn-${bank.id}`}
              onClick={() => handleBankSelect(bank.id)}
            >
              <img src={bank.logoUrl} alt={bank.name} />
              <span>{bank.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard de Conexão */}
      {isWizardOpen && (
        <div data-testid="connection-wizard">
          <div data-testid="wizard-step">Passo {wizardStep} de 3</div>

          {/* Step 1: Seleção do banco */}
          {wizardStep === 1 && (
            <div data-testid="wizard-step-1">
              <h3>Conectar com {banks.find((b) => b.id === selectedBank)?.name}</h3>
              <p>
                Você será redirecionado para o ambiente seguro do banco para
                autorizar o acesso.
              </p>
              <button
                data-testid="wizard-next-btn"
                onClick={() => setWizardStep(2)}
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: Autorização */}
          {wizardStep === 2 && (
            <div data-testid="wizard-step-2">
              <h3>Autorização</h3>
              <p>Autorize o acesso no site do banco.</p>
              <button
                data-testid="wizard-connect-btn"
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isLoading ? "Conectando..." : "Já autorizei"}
              </button>
            </div>
          )}

          {/* Step 3: Sucesso */}
          {wizardStep === 3 && (
            <div data-testid="wizard-step-3">
              <h3>Conectado! </h3>
              <p data-testid="success-message">{successMessage}</p>
              <button data-testid="wizard-close-btn" onClick={closeWizard}>
                Fechar
              </button>
            </div>
          )}

          {/* Mensagens de erro */}
          {error && (
            <div data-testid="error-message" className="error">
              {error}
            </div>
          )}

          <button data-testid="wizard-cancel-btn" onClick={closeWizard}>
            Cancelar
          </button>
        </div>
      )}

      {/* Estado de loading global */}
      {isLoading && (
        <div data-testid="loading-indicator">Carregando...</div>
      )}
    </div>
  );
};

// Mock do componente para testes
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("OpenBankingConfig UI", () => {
  const mockOnConnect = vi.fn().mockResolvedValue(undefined);
  const mockOnDisconnect = vi.fn().mockResolvedValue(undefined);
  const mockOnSync = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização da lista de bancos", () => {
    it("deve renderizar o componente principal", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByTestId("open-banking-config")).toBeInTheDocument();
    });

    it("deve exibir lista de bancos disponíveis", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByTestId("banks-list")).toBeInTheDocument();
      mockBankConfigs.forEach((bank) => {
        expect(screen.getByTestId(`bank-btn-${bank.id}`)).toBeInTheDocument();
      });
    });

    it("deve exibir nome de cada banco", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText("Itaú Unibanco")).toBeInTheDocument();
      expect(screen.getByText("Bradesco")).toBeInTheDocument();
      expect(screen.getByText("Santander")).toBeInTheDocument();
    });

    it("deve exibir seção de contas conectadas vazia", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText("Nenhuma conta conectada")).toBeInTheDocument();
    });

    it("deve exibir contas conectadas", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[mockOpenBankingConnection]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(
        screen.getByTestId(`connection-${mockOpenBankingConnection.id}`)
      ).toBeInTheDocument();
      expect(screen.getAllByText("Itaú Unibanco").length).toBeGreaterThanOrEqual(1);
    });

    it("deve exibir botões de sincronizar e desconectar", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[mockOpenBankingConnection]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(
        screen.getByTestId(`sync-btn-${mockOpenBankingConnection.id}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`disconnect-btn-${mockOpenBankingConnection.id}`)
      ).toBeInTheDocument();
    });
  });

  describe("Wizard de conexão", () => {
    it("deve abrir wizard ao clicar em banco", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));

      expect(screen.getByTestId("connection-wizard")).toBeInTheDocument();
      expect(screen.getByTestId("wizard-step-1")).toBeInTheDocument();
    });

    it("deve avançar para passo 2 ao clicar continuar", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));

      expect(screen.getByTestId("wizard-step-2")).toBeInTheDocument();
    });

    it("deve exibir nome do banco no wizard", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));

      expect(screen.getByText(/Conectar com Itaú Unibanco/)).toBeInTheDocument();
    });

    it("deve fechar wizard ao clicar cancelar", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-cancel-btn"));

      expect(screen.queryByTestId("connection-wizard")).not.toBeInTheDocument();
    });

    it("deve chamar onConnect ao conectar", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));
      await userEvent.click(screen.getByTestId("wizard-connect-btn"));

      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenCalledWith("itau");
      });
    });
  });

  describe("Estados de loading", () => {
    it("deve desabilitar botão durante conexão", async () => {
      const slowConnect = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={slowConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));

      const connectBtn = screen.getByTestId("wizard-connect-btn");
      await userEvent.click(connectBtn);

      expect(connectBtn).toBeDisabled();
      expect(screen.getByText("Conectando...")).toBeInTheDocument();
    });

    it("deve exibir indicador de loading global", async () => {
      const slowConnect = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={slowConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));
      await userEvent.click(screen.getByTestId("wizard-connect-btn"));

      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });
  });

  describe("Mensagens de erro", () => {
    it("deve exibir mensagem de erro em caso de falha", async () => {
      const failConnect = vi.fn().mockRejectedValue(new Error("Erro de conexão"));

      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={failConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));
      await userEvent.click(screen.getByTestId("wizard-connect-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(screen.getByText("Erro de conexão")).toBeInTheDocument();
      });
    });

    it("deve exibir mensagem genérica quando erro não tem mensagem", async () => {
      const failConnect = vi.fn().mockRejectedValue({});

      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={failConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));
      await userEvent.click(screen.getByTestId("wizard-connect-btn"));

      await waitFor(() => {
        expect(screen.getByText("Erro ao conectar")).toBeInTheDocument();
      });
    });
  });

  describe("Mensagens de sucesso", () => {
    it("deve exibir mensagem de sucesso após conexão", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(screen.getByTestId("bank-btn-itau"));
      await userEvent.click(screen.getByTestId("wizard-next-btn"));
      await userEvent.click(screen.getByTestId("wizard-connect-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("wizard-step-3")).toBeInTheDocument();
        expect(screen.getByTestId("success-message")).toHaveTextContent(
          "Conexão realizada com sucesso!"
        );
      });
    });
  });

  describe("Ações de conta conectada", () => {
    it("deve chamar onSync ao clicar em sincronizar", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[mockOpenBankingConnection]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(
        screen.getByTestId(`sync-btn-${mockOpenBankingConnection.id}`)
      );

      expect(mockOnSync).toHaveBeenCalledWith(mockOpenBankingConnection.id);
    });

    it("deve chamar onDisconnect ao clicar em desconectar", async () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[mockOpenBankingConnection]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      await userEvent.click(
        screen.getByTestId(`disconnect-btn-${mockOpenBankingConnection.id}`)
      );

      expect(mockOnDisconnect).toHaveBeenCalledWith(mockOpenBankingConnection.id);
    });

    it("deve exibir informações da conta", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[mockOpenBankingConnection]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/Ag: 0001/)).toBeInTheDocument();
      expect(screen.getByText(/Cc: 12345-6/)).toBeInTheDocument();
      expect(screen.getByText(/Status: AUTHORISED/)).toBeInTheDocument();
    });

    it("deve exibir data da última sincronização", () => {
      render(
        <OpenBankingConfig
          banks={mockBankConfigs}
          connections={[mockOpenBankingConnection]}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/Última sync:/)).toBeInTheDocument();
    });
  });
});
