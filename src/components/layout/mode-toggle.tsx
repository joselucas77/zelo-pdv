"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModeToggle({
  className,
  title,
}: {
  className?: string;
  title?: boolean;
}) {
  const { setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn("relative overflow-hidden", className)}
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out ${
          isDark
            ? "scale-0 rotate-90 translate-y-4 opacity-0"
            : "scale-100 rotate-0 translate-y-0 opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out ${
          isDark
            ? "scale-100 rotate-0 translate-y-0 opacity-100"
            : "scale-0 -rotate-90 -translate-y-4 opacity-0"
        }`}
      />
      {isDark ? (
        <span className={`${title ? "" : "sr-only"}`}>Tema claro</span>
      ) : (
        <span className={`${title ? "" : "sr-only"}`}>Tema escuro</span>
      )}
    </Button>
  );
}
