import { useTheme } from "next-themes";
import squirtleLogo from "@/assets/logo-squirtle.svg";
import charmanderLogo from "@/assets/logo-charmander.svg";
import bulbasaurLogo from "@/assets/logo-bulbasaur.svg";

const logos: Record<string, string> = {
  blue: squirtleLogo,
  dark: squirtleLogo,
  green: bulbasaurLogo,
  orange: charmanderLogo,
};

const favicons: Record<string, string> = {
  blue: "/favicon-squirtle.ico",
  dark: "/favicon-squirtle.ico",
  green: "/favicon-bulbasaur.ico",
  orange: "/favicon-chamander.ico",
};

export function useThemeAssets() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? "blue";

  return {
    logo: logos[theme] ?? squirtleLogo,
    favicon: favicons[theme] ?? "/favicon-squirtle.ico",
  };
}
