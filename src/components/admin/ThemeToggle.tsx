import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  // Force light theme on mount
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  // Return null - no toggle UI needed since we only use light mode
  return null;
}
