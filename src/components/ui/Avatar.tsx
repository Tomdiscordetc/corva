import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = { sm: "size-7 text-2xs", md: "size-9 text-xs", lg: "size-12 text-sm" };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        "inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-neutral-900 font-semibold text-neutral-0",
        sizeClasses[size],
        className,
      )}
    >
      <RadixAvatar.Fallback delayMs={0}>{initials(name)}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
