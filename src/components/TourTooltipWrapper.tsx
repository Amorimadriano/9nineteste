import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourTooltipWrapperProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  showIndicator?: boolean;
  indicatorPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

export function TourTooltipWrapper({
  children,
  content,
  side = "top",
  showIndicator = false,
  indicatorPosition = "top-right",
  className,
}: TourTooltipWrapperProps) {
  const indicatorPositionClasses = {
    "top-right": "-top-1 -right-1",
    "top-left": "-top-1 -left-1",
    "bottom-right": "-bottom-1 -right-1",
    "bottom-left": "-bottom-1 -left-1",
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild className={cn("relative inline-flex", className)}>
          <div className="relative inline-flex">
            {children}
            {showIndicator && (
              <span
                className={cn(
                  "absolute w-4 h-4 rounded-full bg-primary animate-pulse z-10",
                  indicatorPositionClasses[indicatorPosition]
                )}
              >
                <HelpCircle className="w-4 h-4 text-primary-foreground" />
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[280px] p-3 text-sm leading-relaxed"
          sideOffset={8}
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Specialized tooltip for quick actions
interface QuickActionTooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function QuickActionTooltip({
  children,
  title,
  description,
  shortcut,
  side = "bottom",
}: QuickActionTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-[250px] p-3">
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {shortcut && (
              <p className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                {shortcut}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Component for feature highlights in the UI
interface FeatureHighlightProps {
  children: React.ReactNode;
  title: string;
  description: string;
  isNew?: boolean;
}

export function FeatureHighlight({
  children,
  title,
  description,
  isNew = false,
}: FeatureHighlightProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-help">
            {children}
            {isNew && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                !
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{title}</p>
              {isNew && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-medium">
                  Novo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TourTooltipWrapper;
