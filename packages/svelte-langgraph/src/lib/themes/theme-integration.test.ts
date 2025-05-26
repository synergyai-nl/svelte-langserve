import { describe, it, expect } from "vitest";
import { defaultTheme } from "./default.js";
import { flowbiteTheme, createFlowbiteTheme } from "./flowbite.js";
import {
  validateTheme,
  createSafeTheme,
  mergeThemeOverrides,
  themeClass,
  combineClasses,
} from "./utils.js";
import type { ChatTheme } from "./types.js";

describe("Theme System Integration", () => {
  describe("Theme Validation", () => {
    it("should validate all built-in themes", () => {
      expect(validateTheme(defaultTheme)).toBe(true);
      expect(validateTheme(flowbiteTheme)).toBe(true);
    });

    it("should reject incomplete themes", () => {
      const incompleteTheme = {
        container: "some-class",
        sidebar: "sidebar-class",
        // Missing many required properties
      } as unknown as ChatTheme;

      expect(validateTheme(incompleteTheme)).toBe(false);
    });

    it("should handle edge cases in validation", () => {
      expect(validateTheme({} as ChatTheme)).toBe(false);
      expect(validateTheme(null as unknown as ChatTheme)).toBe(false);
      expect(validateTheme(undefined as unknown as ChatTheme)).toBe(false);
    });
  });

  describe("Safe Theme Creation", () => {
    it("should create complete theme from partial input", () => {
      const partialTheme = {
        sendButton: "custom-btn-class",
        messageUser: "custom-user-msg",
      };

      const safeTheme = createSafeTheme(partialTheme);

      expect(validateTheme(safeTheme)).toBe(true);
      expect(safeTheme.sendButton).toBe("custom-btn-class");
      expect(safeTheme.messageUser).toBe("custom-user-msg");
      expect(safeTheme.container).toBe(defaultTheme.container);
    });

    it("should handle completely empty input", () => {
      const safeTheme = createSafeTheme({});
      expect(safeTheme).toEqual(defaultTheme);
      expect(validateTheme(safeTheme)).toBe(true);
    });
  });

  describe("Theme Overrides", () => {
    it("should merge multiple overrides correctly", () => {
      const override1 = { sendButton: "btn-1", messageUser: "msg-1" };
      const override2 = { sendButton: "btn-2", inputField: "input-2" };
      const override3 = { messageAssistant: "assistant-3" };

      const merged = mergeThemeOverrides(override1, override2, override3);

      expect(merged.sendButton).toBe("btn-2"); // Last override wins
      expect(merged.messageUser).toBe("msg-1");
      expect(merged.inputField).toBe("input-2");
      expect(merged.messageAssistant).toBe("assistant-3");
    });

    it("should handle undefined overrides gracefully", () => {
      const override1 = { sendButton: "btn-1" };
      const merged = mergeThemeOverrides(override1, undefined, {
        inputField: "input-2",
      });

      expect(merged.sendButton).toBe("btn-1");
      expect(merged.inputField).toBe("input-2");
    });
  });

  describe("Theme Class Utilities", () => {
    const mockTheme = {
      sendButton: "btn-primary",
      messageUser: "user-message",
      container: "",
    } as unknown as ChatTheme;

    it("should return correct theme class", () => {
      expect(themeClass(mockTheme, "sendButton")).toBe("btn-primary");
      expect(themeClass(mockTheme, "messageUser")).toBe("user-message");
    });

    it("should handle conditional application", () => {
      expect(themeClass(mockTheme, "sendButton", true)).toBe("btn-primary");
      expect(themeClass(mockTheme, "sendButton", false)).toBe("");
      expect(themeClass(mockTheme, "sendButton", false, "fallback")).toBe(
        "fallback",
      );
    });

    it("should handle missing properties", () => {
      expect(themeClass(mockTheme, "container")).toBe(""); // Empty string in theme
      expect(themeClass(mockTheme, "nonExistent" as keyof ChatTheme)).toBe("");
    });

    it("should combine classes correctly", () => {
      expect(combineClasses("btn-primary", "ml-2 mt-1")).toBe(
        "btn-primary ml-2 mt-1",
      );
      expect(combineClasses("btn-primary", "")).toBe("btn-primary");
      expect(combineClasses("", "ml-2")).toBe("ml-2");
      expect(combineClasses("btn-primary", "ml-2", false)).toBe("");
    });
  });

  describe("Flowbite Theme Variants", () => {
    it("should create different variants correctly", () => {
      const primary = createFlowbiteTheme("primary");
      const dark = createFlowbiteTheme("dark");
      const compact = createFlowbiteTheme("compact");

      expect(validateTheme(primary)).toBe(true);
      expect(validateTheme(dark)).toBe(true);
      expect(validateTheme(compact)).toBe(true);

      // Variants should have different values for some properties
      expect(compact.sidebar).not.toBe(primary.sidebar);
      expect(compact.messageContainer).not.toBe(primary.messageContainer);
    });

    it("should apply custom overrides to variants", () => {
      const customButton = "bg-purple-600 hover:bg-purple-700";
      const theme = createFlowbiteTheme("primary", {
        sendButton: customButton,
      });

      expect(theme.sendButton).toBe(customButton);
      expect(theme.container).toBe(flowbiteTheme.container); // Other props unchanged
    });
  });

  describe("Real-world Usage Patterns", () => {
    it("should handle typical customization workflow", () => {
      // 1. Start with a base theme
      let currentTheme = flowbiteTheme;
      expect(validateTheme(currentTheme)).toBe(true);

      // 2. Apply user customizations
      const userOverrides = {
        sendButton: "bg-green-600 hover:bg-green-700",
        messageUser: "bg-blue-600 text-white p-4 rounded-xl",
      };
      currentTheme = { ...currentTheme, ...userOverrides };
      expect(validateTheme(currentTheme)).toBe(true);

      // 3. Use theme utilities for conditional styling
      const isDisabled = false;
      const buttonClass = themeClass(currentTheme, "sendButton", !isDisabled);
      const finalButtonClass = combineClasses(buttonClass, "px-4 py-2");

      expect(finalButtonClass).toContain("bg-green-600");
      expect(finalButtonClass).toContain("px-4 py-2");
    });

    it("should handle theme switching", () => {
      const themes = {
        default: defaultTheme,
        flowbite: flowbiteTheme,
        custom: createSafeTheme({
          ...flowbiteTheme,
          sendButton: "custom-send-button",
        }),
      };

      for (const [_name, theme] of Object.entries(themes)) {
        expect(validateTheme(theme)).toBe(true);
        expect(typeof theme.container).toBe("string");
        expect(theme.container.length).toBeGreaterThan(0);
      }
    });

    it("should maintain performance with large override sets", () => {
      const largeOverride = Object.keys(defaultTheme).reduce((acc, key) => {
        acc[key as keyof ChatTheme] = `custom-${key}`;
        return acc;
      }, {} as Partial<ChatTheme>);

      const startTime = performance.now();
      const customTheme = createSafeTheme(largeOverride);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
      expect(validateTheme(customTheme)).toBe(true);
    });
  });

  describe("Theme Consistency", () => {
    it("should have consistent property sets across themes", () => {
      const defaultKeys = Object.keys(defaultTheme).sort();
      const flowbiteKeys = Object.keys(flowbiteTheme).sort();

      expect(flowbiteKeys).toEqual(defaultKeys);
    });

    it("should have non-empty string values for all properties", () => {
      const themes = [defaultTheme, flowbiteTheme];
      // Some properties can be empty (optional styling/decorators)
      const optionalProperties = [
        "sendButtonIcon",
        "loadingSpinner",
        "inputFieldFocus",
      ];

      for (const theme of themes) {
        for (const [key, value] of Object.entries(theme)) {
          expect(typeof value).toBe("string");
          if (!optionalProperties.includes(key)) {
            expect(value.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    it("should have valid CSS class names", () => {
      const cssClassRegex = /^[a-zA-Z0-9\s\-_:/.[\]]*$/; // Allow empty strings with *

      const themes = [defaultTheme, flowbiteTheme];
      for (const theme of themes) {
        for (const [_key, value] of Object.entries(theme)) {
          expect(value).toMatch(cssClassRegex);
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed theme objects gracefully", () => {
      const malformedThemes = [
        null,
        undefined,
        {},
        { container: null },
        { container: 123 },
        { container: "valid", sidebar: undefined },
      ];

      for (const malformed of malformedThemes) {
        expect(() =>
          validateTheme(malformed as unknown as ChatTheme),
        ).not.toThrow();
        expect(validateTheme(malformed as unknown as ChatTheme)).toBe(false);
      }
    });

    it("should create safe fallbacks for invalid themes", () => {
      const invalidTheme = { container: "valid-class" }; // Missing most properties
      const safeTheme = createSafeTheme(invalidTheme);

      expect(validateTheme(safeTheme)).toBe(true);
      expect(safeTheme.container).toBe("valid-class");
      expect(safeTheme.sendButton).toBe(defaultTheme.sendButton);
    });
  });
});
