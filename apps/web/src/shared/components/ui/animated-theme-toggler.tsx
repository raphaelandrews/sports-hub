import { useCallback, useEffect, useState } from "react";
import { Droplets, Flame, Leaf } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { cn } from "@sports-system/ui/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

interface ThemeSelectorProps {
  className?: string;
}

const themes = [
  { value: "blue", label: "Squirtle", icon: Droplets },
  { value: "green", label: "Bulbasaur", icon: Leaf },
  { value: "orange", label: "Charmander", icon: Flame },
] as const;

export const AnimatedThemeToggler = ({ className }: ThemeSelectorProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleValueChange = useCallback(
    async (value: string | null) => {
      if (!value) return;
      if (!("startViewTransition" in document)) {
        setTheme(value);
        return;
      }

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(value);
        });
      });

      await transition.ready;

      const maxRadius = Math.hypot(window.innerWidth, window.innerHeight);

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at 50% 50%)`,
            `circle(${maxRadius}px at 50% 50%)`,
          ],
        },
        {
          duration: 400,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    },
    [setTheme],
  );

  const current = mounted ? (resolvedTheme ?? "blue") : "blue";
  const currentTheme = themes.find((t) => t.value === current) ?? themes[0];
  const Icon = currentTheme.icon;

  return (
    <Select value={current} onValueChange={handleValueChange}>
      <SelectTrigger
        className={cn(
          "w-auto gap-1.5 border-0 bg-transparent! px-2 shadow-none hover:bg-muted! focus:ring-0 focus:ring-offset-0",
          className,
        )}
        size="sm"
        hideChevron
      >
        <SelectValue>
          <Icon size={16} />
          <span className="sr-only">Theme</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" side="bottom">
        {themes.map((theme) => {
          const ThemeIcon = theme.icon;
          return (
            <SelectItem key={theme.value} value={theme.value}>
              <ThemeIcon size={16} />
              {theme.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
