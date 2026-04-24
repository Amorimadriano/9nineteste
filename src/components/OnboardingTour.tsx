import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronRight, ChevronLeft, X, Sparkles, Wallet, BarChart3, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  icon?: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour=\"sidebar\"]",
    title: "Menu Principal",
    content: "Acesse todas as funcionalidades do sistema através do menu lateral. Aqui você encontra gestão financeira, cadastros e relatórios.",
    placement: "right",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
  },
  {
    target: "[data-tour=\"dashboard\"]",
    title: "Dashboard",
    content: "Visualize indicadores financeiros importantes, gráficos de fluxo de caixa e resumo das contas a pagar e receber.",
    placement: "bottom",
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
  },
  {
    target: "[data-tour=\"contas-receber\"]",
    title: "Contas a Receber",
    content: "Gerencie todos os recebíveis da sua empresa. Cadastre clientes, emita boletos e acompanhe pagamentos.",
    placement: "right",
    icon: <Wallet className="h-5 w-5 text-emerald-500" />,
  },
  {
    target: "[data-tour=\"contas-pagar\"]",
    title: "Contas a Pagar",
    content: "Controle suas despesas e obrigações financeiras. Importe boletos via CNAB 240 e gerencie fornecedores.",
    placement: "right",
    icon: <FileText className="h-5 w-5 text-amber-500" />,
  },
  {
    target: "[data-tour=\"clientes\"]",
    title: "Cadastros",
    content: "Mantenha seus clientes, fornecedores e categorias organizados para facilitar a gestão financeira.",
    placement: "right",
    icon: <Users className="h-5 w-5 text-blue-500" />,
  },
  {
    target: "[data-tour=\"configuracoes\"]",
    title: "Configurações",
    content: "Personalize o sistema de acordo com as necessidades da sua empresa. Gerencie usuários e permissões.",
    placement: "right",
    icon: <Settings className="h-5 w-5 text-slate-500" />,
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const calculatePosition = useCallback((target: HTMLElement, placement: string) => {
    const targetRect = target.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 16;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + offset;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - offset;
        break;
      case "bottom":
        top = targetRect.bottom + offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
      default:
        top = targetRect.top - tooltipHeight - offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
    }

    // Boundary checks
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    return { top, left };
  }, []);

  useEffect(() => {
    if (!isOpen || !currentTourStep) return;

    const target = document.querySelector(currentTourStep.target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      const position = calculatePosition(target, currentTourStep.placement || "top");
      setTooltipPosition(position);

      // Add highlight effect
      target.style.position = "relative";
      target.style.zIndex = "9999";
      target.classList.add("tour-highlight");
    }

    return () => {
      if (target) {
        target.style.position = "";
        target.style.zIndex = "";
        target.classList.remove("tour-highlight");
      }
    };
  }, [isOpen, currentStep, currentTourStep, calculatePosition]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleComplete = () => {
    onClose();
    onComplete?.();
    setCurrentStep(0);
  };

  const handleSkip = () => {
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen || !currentTourStep) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={handleSkip}
          />

          {/* Spotlight around target element */}
          {targetElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[9998] pointer-events-none"
              style={{
                top: targetElement.getBoundingClientRect().top - 4,
                left: targetElement.getBoundingClientRect().left - 4,
                width: targetElement.getBoundingClientRect().width + 8,
                height: targetElement.getBoundingClientRect().height + 8,
              }}
            >
              <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-4 ring-offset-background animate-pulse" />
            </motion.div>
          )}

          {/* Tooltip Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[9999] w-[320px]"
            style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          >
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentTourStep.icon}
                    <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 -mt-2"
                    onClick={handleSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-sm mt-2">
                  {currentTourStep.content}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Progress indicators */}
                <div className="flex justify-center gap-1.5 mb-4">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        index === currentStep
                          ? "w-6 bg-primary"
                          : index < currentStep
                          ? "w-2 bg-primary/60"
                          : "w-2 bg-muted"
                      )}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    Pular tour
                  </Button>
                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="gap-1"
                    >
                      {isLastStep ? "Concluir" : "Próximo"}
                      {!isLastStep && <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Step counter */}
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Passo {currentStep + 1} de {tourSteps.length}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper component for tour tooltip labels
interface TourTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function TourTooltip({ children, content, side = "top" }: TourTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-[200px] text-sm">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default OnboardingTour;
