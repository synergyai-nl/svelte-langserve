// Theme types
export type {
  ChatTheme,
  ThemeVariant,
  ThemeConfig,
  ThemePackage,
  ThemeOverride,
  ThemeContext,
} from "./types.js";

// Default theme
export {
  defaultTheme,
  defaultThemeConfig,
  defaultThemePackage,
  createDefaultTheme,
} from "./default.js";

// Flowbite theme
export {
  flowbiteTheme,
  flowbiteDarkTheme,
  flowbiteCompactTheme,
  flowbiteThemeVariant,
  flowbiteThemeConfig,
  flowbiteThemePackage,
  createFlowbiteTheme,
} from "./flowbite.js";

// Theme utilities
export { useTheme, createThemeContext } from "./utils.js";
