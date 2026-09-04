import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export const TooltipProvider = RadixTooltip.Provider;

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={300}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={[
            "z-50 rounded-sm bg-invert px-2.5 py-1.5 text-2xs font-medium text-on-invert shadow-[var(--shadow-raised)]",
            "data-[state=delayed-open]:animate-[tooltip-in_var(--t-fast)_var(--ease-standard)]",
          ].join(" ")}
        >
          {content}
          <RadixTooltip.Arrow className="fill-invert" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
