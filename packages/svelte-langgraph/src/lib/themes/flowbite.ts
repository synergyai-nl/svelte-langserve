import type {
  ChatTheme,
  ThemeConfig,
  ThemePackage,
  ThemeVariant,
} from "./types.js";

/**
 * Flowbite theme implementing Flowbite design system patterns
 * Uses authentic Flowbite component classes for professional look
 */
export const flowbiteTheme: ChatTheme = {
  // Main layout containers
  container: "flex h-screen bg-white dark:bg-gray-900",
  sidebar:
    "w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto",
  chatArea: "flex-1 flex flex-col bg-white dark:bg-gray-900",

  // Header elements
  header:
    "p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
  title: "text-xl font-semibold text-gray-900 dark:text-white",
  subtitle: "text-sm text-gray-500 dark:text-gray-400 mt-1",

  // Message display - using Flowbite chat bubble patterns
  messageContainer: "flex-1 overflow-y-auto p-4 space-y-4",
  messageWrapper: "flex w-full",
  messageUser: "flex justify-end",
  messageUserBubble:
    "flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-blue-600 rounded-e-xl rounded-es-xl dark:bg-blue-600",
  messageAssistant: "flex justify-start",
  messageAssistantBubble:
    "flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700",
  messageSystem: "flex justify-center",
  messageTimestamp: "text-sm font-normal text-gray-500 dark:text-gray-400",
  messageContent: "text-sm font-normal text-white dark:text-white", // For user messages

  // Message states
  messageStreaming: "animate-pulse border-l-4 border-blue-500",
  messageError:
    "bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300",
  messageLoading: "opacity-70",

  // Input area - Flowbite form styling
  inputContainer:
    "p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
  inputWrapper: "flex items-center space-x-2",
  inputField:
    "block w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
  inputFieldFocus: "", // Included in inputField
  sendButton:
    "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800",
  sendButtonDisabled:
    "text-gray-400 bg-gray-200 cursor-not-allowed font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-600 dark:text-gray-500",
  sendButtonIcon: "w-4 h-4",

  // Endpoint selector - Flowbite checkbox/radio styling
  endpointSelector: "mb-6",
  endpointSelectorLabel:
    "block mb-2 text-sm font-medium text-gray-900 dark:text-white",
  endpointOption:
    "flex items-center p-4 border border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
  endpointOptionSelected:
    "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-600",
  endpointHealth: "ml-auto w-3 h-3 rounded-full",
  endpointHealthy: "bg-green-400",
  endpointUnhealthy: "bg-red-400",

  // Configuration panel - Flowbite card styling
  configPanel:
    "mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700",
  configSection: "mb-6",
  configLabel: "block mb-2 text-sm font-medium text-gray-900 dark:text-white",
  configInput:
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
  configSlider:
    "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider",
  configToggle: "relative inline-flex items-center cursor-pointer",
  configButton:
    "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700",

  // Conversation list - Flowbite list styling
  conversationList: "flex-1 overflow-y-auto space-y-1",
  conversationItem:
    "flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white cursor-pointer",
  conversationItemActive:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-l-4 border-blue-500",
  conversationTitle:
    "flex-1 text-sm font-medium text-gray-900 dark:text-white truncate",
  conversationPreview: "text-xs text-gray-500 dark:text-gray-400 mt-1 truncate",
  conversationTimestamp: "text-xs text-gray-400 dark:text-gray-500",
  conversationActions: "mt-2 flex gap-2",

  // Navigation and actions - Flowbite button variants
  createConversationButton:
    "w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed",
  joinConversationButton:
    "text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xs px-3 py-2 text-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-600 dark:focus:ring-blue-800",
  testEndpointButton:
    "text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-xs px-3 py-2 text-center dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800",
  getSchemasButton:
    "text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-xs px-3 py-2 text-center dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800",

  // States and feedback - Flowbite alert styling
  loading: "text-blue-800 text-sm font-medium",
  loadingSpinner: "animate-spin w-4 h-4 text-blue-600 fill-blue-300",
  loadingText: "text-blue-600 text-sm italic ml-2",
  error: "text-red-800 text-sm font-medium",
  errorMessage:
    "flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800",
  success: "text-green-800 text-sm font-medium",
  warning: "text-yellow-800 text-sm font-medium",

  // Empty states - Flowbite centered content
  emptyState:
    "flex flex-col items-center justify-center h-full p-8 text-center",
  emptyStateIcon: "w-16 h-16 text-gray-400 dark:text-gray-600 mb-4",
  emptyStateTitle: "mb-2 text-xl font-bold text-gray-900 dark:text-white",
  emptyStateDescription:
    "mb-6 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400",
  emptyStateAction:
    "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800",

  // Responsive classes
  mobile: "sm:hidden",
  tablet: "hidden sm:block lg:hidden",
  desktop: "hidden lg:block",
};

/**
 * Dark mode variant for Flowbite theme
 */
export const flowbiteDarkTheme: Partial<ChatTheme> = {
  messageContent: "text-sm font-normal text-gray-200", // For assistant messages in dark mode
  messageUserBubble:
    "flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-blue-600 rounded-e-xl rounded-es-xl",
  messageAssistantBubble:
    "flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-700 rounded-e-xl rounded-es-xl",
};

/**
 * Compact variant for smaller screens
 */
export const flowbiteCompactTheme: Partial<ChatTheme> = {
  sidebar:
    "w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2 overflow-y-auto",
  messageContainer: "flex-1 overflow-y-auto p-2 space-y-2",
  messageUserBubble:
    "flex flex-col w-full max-w-[280px] leading-1.5 p-3 border-gray-200 bg-blue-600 rounded-e-xl rounded-es-xl dark:bg-blue-600",
  messageAssistantBubble:
    "flex flex-col w-full max-w-[280px] leading-1.5 p-3 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700",
  inputContainer:
    "p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
};

/**
 * Flowbite theme variant package
 */
export const flowbiteThemeVariant: ThemeVariant = {
  primary: flowbiteTheme,
  dark: flowbiteDarkTheme,
  compact: flowbiteCompactTheme,
};

/**
 * Flowbite theme configuration
 */
export const flowbiteThemeConfig: ThemeConfig = {
  name: "flowbite",
  displayName: "Flowbite",
  description:
    "Professional design system with comprehensive component library",
  author: "Flowbite Team",
  framework: "flowbite",
  darkMode: true,
  responsive: true,
  version: "1.0.0",
};

/**
 * Complete Flowbite theme package
 */
export const flowbiteThemePackage: ThemePackage = {
  config: flowbiteThemeConfig,
  theme: flowbiteThemeVariant,
};

/**
 * Helper function to get Flowbite theme with variant
 */
export function createFlowbiteTheme(
  variant: "primary" | "dark" | "compact" = "primary",
  overrides?: Partial<ChatTheme>,
): ChatTheme {
  let baseTheme = flowbiteTheme;

  if (variant === "dark") {
    baseTheme = { ...flowbiteTheme, ...flowbiteDarkTheme };
  } else if (variant === "compact") {
    baseTheme = { ...flowbiteTheme, ...flowbiteCompactTheme };
  }

  return {
    ...baseTheme,
    ...overrides,
  };
}
