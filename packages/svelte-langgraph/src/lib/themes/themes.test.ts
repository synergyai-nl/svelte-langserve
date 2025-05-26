import { describe, it, expect, vi, beforeEach } from "vitest";
import { defaultTheme, defaultThemeConfig } from "./default.js";
import {
  flowbiteTheme,
  flowbiteThemeConfig,
  createFlowbiteTheme,
} from "./flowbite.js";
import {
  useTheme,
  createThemeContext,
  validateTheme,
  createSafeTheme,
  mergeThemeOverrides,
  themeClass,
  combineClasses,
} from "./utils.js";
import type { ChatTheme } from "./types.js";

// Mock Svelte context functions
vi.mock("svelte", () => ({
  getContext: vi.fn(),
  setContext: vi.fn(),
}));

describe("Default Theme", () => {
  it("should have all required theme properties", () => {
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme.container).toBeDefined();
    expect(defaultTheme.sidebar).toBeDefined();
    expect(defaultTheme.chatArea).toBeDefined();
    expect(defaultTheme.messageUser).toBeDefined();
    expect(defaultTheme.messageAssistant).toBeDefined();
    expect(defaultTheme.inputField).toBeDefined();
    expect(defaultTheme.sendButton).toBeDefined();
  });

  it("should have valid theme config", () => {
    expect(defaultThemeConfig.name).toBe("default");
    expect(defaultThemeConfig.displayName).toBe("Default");
    expect(defaultThemeConfig.framework).toBe("tailwind");
  });

  it("should validate as a complete theme", () => {
    expect(validateTheme(defaultTheme)).toBe(true);
  });
});

describe("Flowbite Theme", () => {
  it("should have all required theme properties", () => {
    expect(flowbiteTheme).toBeDefined();
    expect(flowbiteTheme.container).toBeDefined();
    expect(flowbiteTheme.sidebar).toBeDefined();
    expect(flowbiteTheme.chatArea).toBeDefined();
    expect(flowbiteTheme.messageUser).toBeDefined();
    expect(flowbiteTheme.messageAssistant).toBeDefined();
    expect(flowbiteTheme.inputField).toBeDefined();
    expect(flowbiteTheme.sendButton).toBeDefined();
  });

  it("should have valid theme config", () => {
    expect(flowbiteThemeConfig.name).toBe("flowbite");
    expect(flowbiteThemeConfig.displayName).toBe("Flowbite");
    expect(flowbiteThemeConfig.framework).toBe("flowbite");
    expect(flowbiteThemeConfig.darkMode).toBe(true);
  });

  it("should validate as a complete theme", () => {
    expect(validateTheme(flowbiteTheme)).toBe(true);
  });

  it("should create theme variants correctly", () => {
    const primaryTheme = createFlowbiteTheme("primary");
    const darkTheme = createFlowbiteTheme("dark");
    const compactTheme = createFlowbiteTheme("compact");

    expect(primaryTheme).toBeDefined();
    expect(darkTheme).toBeDefined();
    expect(compactTheme).toBeDefined();

    // Dark theme should have different message content styling
    expect(darkTheme.messageContainer).toBeDefined();

    // Compact theme should have smaller sidebar
    expect(compactTheme.sidebar).toContain("w-64");
  });

  it("should support custom overrides", () => {
    const customTheme = createFlowbiteTheme("primary", {
      sendButton: "custom-send-button-class",
    });

    expect(customTheme.sendButton).toBe("custom-send-button-class");
    expect(customTheme.container).toBe(flowbiteTheme.container); // Other props unchanged
  });
});

describe("Theme Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateTheme", () => {
    it("should validate complete themes", () => {
      expect(validateTheme(defaultTheme)).toBe(true);
      expect(validateTheme(flowbiteTheme)).toBe(true);
    });

    it("should reject incomplete themes", () => {
      const incompleteTheme = {
        container: "some-class",
        // Missing required properties
      };

      expect(validateTheme(incompleteTheme as ChatTheme)).toBe(false);
    });

    it("should reject themes with invalid property types", () => {
      const invalidTheme = {
        ...defaultTheme,
        container: 123, // Should be string
      };

      expect(validateTheme(invalidTheme as unknown as ChatTheme)).toBe(false);
    });
  });

  describe("createSafeTheme", () => {
    it("should merge partial theme with default theme", () => {
      const partialTheme = {
        sendButton: "custom-button-class",
        messageUser: "custom-user-message",
      };

      const safeTheme = createSafeTheme(partialTheme);

      expect(safeTheme.sendButton).toBe("custom-button-class");
      expect(safeTheme.messageUser).toBe("custom-user-message");
      expect(safeTheme.container).toBe(defaultTheme.container); // Falls back to default
      expect(validateTheme(safeTheme)).toBe(true);
    });

    it("should handle empty theme object", () => {
      const safeTheme = createSafeTheme({});
      expect(safeTheme).toEqual(defaultTheme);
      expect(validateTheme(safeTheme)).toBe(true);
    });
  });

  describe("mergeThemeOverrides", () => {
    it("should merge multiple override objects", () => {
      const override1 = { sendButton: "btn-1", messageUser: "msg-1" };
      const override2 = { sendButton: "btn-2", inputField: "input-2" };
      const override3 = undefined;

      const merged = mergeThemeOverrides(override1, override2, override3);

      expect(merged.sendButton).toBe("btn-2"); // Last override wins
      expect(merged.messageUser).toBe("msg-1");
      expect(merged.inputField).toBe("input-2");
    });

    it("should handle all undefined overrides", () => {
      const merged = mergeThemeOverrides(undefined, undefined);
      expect(merged).toEqual({});
    });
  });

  describe("themeClass", () => {
    const mockTheme = {
      sendButton: "btn-primary",
      messageUser: "user-msg",
    } as unknown as ChatTheme;

    it("should return theme class when condition is true", () => {
      expect(themeClass(mockTheme, "sendButton")).toBe("btn-primary");
      expect(themeClass(mockTheme, "sendButton", true)).toBe("btn-primary");
    });

    it("should return fallback when condition is false", () => {
      expect(themeClass(mockTheme, "sendButton", false)).toBe("");
      expect(themeClass(mockTheme, "sendButton", false, "fallback")).toBe(
        "fallback",
      );
    });

    it("should return fallback when theme property is missing", () => {
      expect(
        themeClass(mockTheme, "nonExistentProperty" as keyof ChatTheme),
      ).toBe("");
      expect(
        themeClass(
          mockTheme,
          "nonExistentProperty" as keyof ChatTheme,
          true,
          "fallback",
        ),
      ).toBe("fallback");
    });
  });

  describe("combineClasses", () => {
    it("should combine theme class with additional classes", () => {
      expect(combineClasses("btn-primary", "ml-2 mt-1")).toBe(
        "btn-primary ml-2 mt-1",
      );
    });

    it("should handle empty additional classes", () => {
      expect(combineClasses("btn-primary", "")).toBe("btn-primary");
      expect(combineClasses("btn-primary")).toBe("btn-primary");
    });

    it("should return empty string when condition is false", () => {
      expect(combineClasses("btn-primary", "ml-2", false)).toBe("");
    });

    it("should filter out empty classes", () => {
      expect(combineClasses("", "ml-2")).toBe("ml-2");
      expect(combineClasses("btn-primary", "")).toBe("btn-primary");
    });
  });
});

describe("Theme Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useTheme", () => {
    it("should return default theme when no context", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(undefined);

      const theme = useTheme();
      expect(theme).toEqual(defaultTheme);
    });

    it("should return theme from context", async () => {
      const { getContext } = await import("svelte");
      const mockContext = {
        theme: flowbiteTheme,
        config: flowbiteThemeConfig,
      };
      vi.mocked(getContext).mockReturnValue(mockContext);

      const theme = useTheme();
      expect(theme).toEqual(flowbiteTheme);
    });

    it("should apply overrides from context", async () => {
      const { getContext } = await import("svelte");
      const override = { sendButton: "custom-btn" };
      const mockContext = {
        theme: defaultTheme,
        config: defaultThemeConfig,
        override,
      };
      vi.mocked(getContext).mockReturnValue(mockContext);

      const theme = useTheme();
      expect(theme.sendButton).toBe("custom-btn");
      expect(theme.container).toBe(defaultTheme.container); // Other props unchanged
    });
  });

  describe("createThemeContext", () => {
    it("should create theme context with all properties", async () => {
      const { setContext } = await import("svelte");

      const context = createThemeContext(
        flowbiteTheme,
        flowbiteThemeConfig,
        "dark",
        { sendButton: "custom" },
      );

      expect(context.theme).toBe(flowbiteTheme);
      expect(context.config).toBe(flowbiteThemeConfig);
      expect(context.variant).toBe("dark");
      expect(context.override).toEqual({ sendButton: "custom" });
      expect(setContext).toHaveBeenCalledWith(
        "svelte-langgraph-theme",
        context,
      );
    });

    it("should work with minimal parameters", async () => {
      const { setContext } = await import("svelte");

      const context = createThemeContext(defaultTheme, defaultThemeConfig);

      expect(context.theme).toBe(defaultTheme);
      expect(context.config).toBe(defaultThemeConfig);
      expect(context.variant).toBeUndefined();
      expect(context.override).toBeUndefined();
      expect(setContext).toHaveBeenCalled();
    });
  });
});

describe("Theme Properties Coverage", () => {
  it("should have consistent property coverage across themes", () => {
    const defaultKeys = Object.keys(defaultTheme);
    const flowbiteKeys = Object.keys(flowbiteTheme);

    // Flowbite theme should have all properties that default theme has
    for (const key of defaultKeys) {
      expect(flowbiteKeys).toContain(key);
    }
  });

  it("should have non-empty string values for all theme properties", () => {
    const themes = [defaultTheme, flowbiteTheme];
    // Some properties can be empty (optional styling/decorators)
    const optionalProperties = [
      "sendButtonIcon",
      "loadingSpinner",
      "inputFieldFocus",
    ];

    for (const theme of themes) {
      for (const [key, value] of Object.entries(theme)) {
        expect(typeof value, `Property ${key} should be a string`).toBe(
          "string",
        );
        if (!optionalProperties.includes(key)) {
          expect(value.trim(), `Property ${key} should not be empty`).not.toBe(
            "",
          );
        }
      }
    }
  });
});

describe("Theme Integration", () => {
  it("should work with real-world usage patterns", () => {
    // Test the complete flow from theme selection to usage
    const customOverride = { sendButton: "bg-purple-600 hover:bg-purple-700" };
    const safeTheme = createSafeTheme({ ...flowbiteTheme, ...customOverride });

    expect(validateTheme(safeTheme)).toBe(true);
    expect(safeTheme.sendButton).toBe(customOverride.sendButton);

    // Test conditional class application
    const buttonClass = themeClass(safeTheme, "sendButton", true);
    const combinedClass = combineClasses(buttonClass, "px-4 py-2");

    expect(combinedClass).toContain("bg-purple-600");
    expect(combinedClass).toContain("px-4 py-2");
  });
});
