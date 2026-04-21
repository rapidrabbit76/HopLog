import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface ColorTheme {
  id: string;
  name: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

const defaultThemes: ColorTheme[] = [
  {
    id: "default",
    name: "Default Blue",
    light: {
      background: "#ffffff",
      foreground: "#191f28",
      card: "#ffffff",
      "card-foreground": "#191f28",
      muted: "#f2f4f6",
      "muted-foreground": "#8b95a1",
      border: "#e5e8eb",
      primary: "#3182f6",
      "primary-foreground": "#ffffff",
    },
    dark: {
      background: "#000000",
      foreground: "#f9fafb",
      card: "#131518",
      "card-foreground": "#f9fafb",
      muted: "#1e2024",
      "muted-foreground": "#8b95a1",
      border: "#222428",
      primary: "#3182f6",
      "primary-foreground": "#ffffff",
    },
  },
];

/**
 * Validates that a CSS color value does not contain injection characters.
 * Allows hex (#fff, #ffffff, #ffffffff), rgb/rgba/hsl/hsla/oklch functions,
 * and CSS named colors (single word, lowercase letters only).
 */
const SAFE_CSS_COLOR = /^(#[\da-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|lch|lab)\([^;{}]*\)|[a-z]+)$/;

export function isSafeCssColor(value: string): boolean {
  return SAFE_CSS_COLOR.test(value.trim());
}

function isValidColorTheme(value: unknown): value is ColorTheme {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ColorTheme>;
  if (typeof candidate.id !== "string" || !candidate.id.trim()) return false;
  if (typeof candidate.name !== "string" || !candidate.name.trim()) return false;
  if (!candidate.light || typeof candidate.light !== "object") return false;
  if (!candidate.dark || typeof candidate.dark !== "object") return false;

  for (const colorValue of [...Object.values(candidate.light), ...Object.values(candidate.dark)]) {
    if (typeof colorValue !== "string" || !isSafeCssColor(colorValue)) {
      return false;
    }
  }

  return true;
}

function loadThemeFile(filePath: string): ColorTheme | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const parsed = yaml.load(fileContents);

    if (!isValidColorTheme(parsed)) {
      console.error(`Invalid theme file (failed validation): ${filePath}`);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error(`Failed to load theme file: ${filePath}`, error);
    return null;
  }
}

export function getColorThemes(): ColorTheme[] {
  const contentDir = process.env.CONTENT_DIR || "content";
  const themesDir = path.join(process.cwd(), contentDir, "themes");
  const legacyThemesDir = path.join(process.cwd(), contentDir, "schemas");
  const legacyFilePath = path.join(process.cwd(), contentDir, "schemas.yml");

  for (const directoryPath of [themesDir, legacyThemesDir]) {
    if (!fs.existsSync(directoryPath)) {
      continue;
    }

    try {
      const themeFiles = fs
        .readdirSync(directoryPath)
        .filter((fileName) => /\.ya?ml$/i.test(fileName))
        .sort();

      const themes = themeFiles
        .map((fileName) => loadThemeFile(path.join(directoryPath, fileName)))
        .filter((theme): theme is ColorTheme => theme !== null);

      if (themes.length > 0) {
        return themes;
      }
    } catch (error) {
      console.error(`Failed to load theme directory: ${directoryPath}`, error);
    }
  }

  if (fs.existsSync(legacyFilePath)) {
    try {
      const fileContents = fs.readFileSync(legacyFilePath, "utf8");
      return yaml.load(fileContents) as ColorTheme[];
    } catch (error) {
      console.error("Failed to load legacy schemas.yml", error);
    }
  }

  return defaultThemes;
}
