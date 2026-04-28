import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  isCompleted && "bg-green-600 border-green-600 text-white",
                  isCurrent && "bg-primary border-primary text-white",
                  !isCompleted && !isCurrent && "bg-gray-100 border-gray-300 text-gray-500"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-1 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  index < currentStep ? "bg-green-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
