import { NavLink, useLocation } from "react-router-dom";
import { getNavItems } from "./navItems";
import { Logo } from "./Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { markNavDirection } from "@/lib/navDirection";

/**
 * Schmale Icon-Leiste (Layout-Entscheidung aus dem Plan). Auf schmalen
 * Bildschirmen wird sie zur unteren Leiste, siehe Media-Query in AppShell.
 */
export function Sidebar() {
  const items = getNavItems();
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 border-r border-line bg-surface py-4",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:h-16 max-lg:flex-row",
        "max-lg:justify-around max-lg:border-r-0 max-lg:border-t max-lg:py-0",
        "w-16",
      )}
    >
      <div className="mb-4 flex items-center justify-center text-text max-lg:hidden">
        <Logo />
      </div>
      {items.map((item) => (
        <Tooltip key={item.path} content={item.label} side="right">
          <NavLink
            viewTransition
            to={item.path}
            end={item.path === "/app"}
            onClick={() => markNavDirection(pathname, item.path)}
            className={({ isActive }) =>
              cn(
                "flex size-11 items-center justify-center rounded-md text-text-muted",
                "transition-colors duration-[var(--t-fast)] ease-[var(--ease-standard)]",
                "hover:bg-surface-hover hover:text-text",
                isActive && "bg-invert text-on-invert hover:bg-invert hover:text-on-invert",
              )
            }
          >
            <item.icon className="size-5" />
          </NavLink>
        </Tooltip>
      ))}
    </nav>
  );
}
