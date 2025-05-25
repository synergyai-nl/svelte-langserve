import type { ChatTheme, ThemeConfig, ThemePackage } from './types.js';

/**
 * Default theme that matches current styling exactly
 * Uses Tailwind CSS classes - maintains backward compatibility
 */
export const defaultTheme: ChatTheme = {
  // Main layout containers
  container: "flex h-screen bg-white",
  sidebar: "w-80 border-r p-4 overflow-y-auto flex flex-col",
  chatArea: "flex-1 flex flex-col",
  
  // Header elements
  header: "p-3 border-b bg-gray-50",
  title: "text-lg font-semibold",
  subtitle: "text-sm text-gray-600",
  
  // Message display
  messageContainer: "flex-1 overflow-y-auto p-4",
  messageWrapper: "my-3 p-3 rounded-lg",
  messageUser: "my-3 p-3 rounded-lg bg-blue-50",
  messageUserBubble: "my-3 p-3 rounded-lg bg-blue-50",
  messageAssistant: "my-3 p-3 rounded-lg bg-gray-50",
  messageAssistantBubble: "my-3 p-3 rounded-lg bg-gray-50",
  messageSystem: "my-3 p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-400",
  messageTimestamp: "text-xs text-gray-500 mt-1",
  messageContent: "whitespace-pre-wrap",
  
  // Message states
  messageStreaming: "border-l-4 border-blue-400",
  messageError: "bg-red-50 border-l-4 border-red-400",
  messageLoading: "opacity-70 animate-pulse",
  
  // Input area
  inputContainer: "p-3 border-t flex",
  inputWrapper: "flex-1 mr-2",
  inputField: "flex-1 border rounded-md p-2 mr-2 resize-none",
  inputFieldFocus: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  sendButton: "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600",
  sendButtonDisabled: "px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed",
  sendButtonIcon: "w-4 h-4",
  
  // Endpoint selector
  endpointSelector: "mb-4",
  endpointSelectorLabel: "block text-sm font-medium text-gray-700 mb-2",
  endpointOption: "flex items-center justify-between p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50",
  endpointOptionSelected: "border-blue-500 bg-blue-50",
  endpointHealth: "ml-2 w-2 h-2 rounded-full",
  endpointHealthy: "bg-green-500",
  endpointUnhealthy: "bg-red-500",
  
  // Configuration panel
  configPanel: "mb-4 p-3 border rounded-md bg-gray-50",
  configSection: "mb-3",
  configLabel: "block text-sm font-medium text-gray-700 mb-1",
  configInput: "w-full p-2 border rounded-md text-sm",
  configSlider: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
  configToggle: "relative inline-flex h-6 w-11 items-center rounded-full",
  configButton: "px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md",
  
  // Conversation list
  conversationList: "flex-1 overflow-y-auto",
  conversationItem: "p-2 border-b cursor-pointer hover:bg-gray-50",
  conversationItemActive: "bg-blue-50 border-l-4 border-blue-500",
  conversationTitle: "font-medium text-sm",
  conversationPreview: "text-xs text-gray-600 mt-1 truncate",
  conversationTimestamp: "text-xs text-gray-500",
  conversationActions: "mt-2 flex gap-1",
  
  // Navigation and actions
  createConversationButton: "w-full py-2 mb-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed",
  joinConversationButton: "px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded",
  testEndpointButton: "px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded",
  getSchemasButton: "px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded",
  
  // States and feedback
  loading: "text-xs text-blue-500 italic mt-1",
  loadingSpinner: "animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full",
  loadingText: "text-blue-500 text-sm italic ml-1",
  error: "text-red-600 text-sm",
  errorMessage: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded",
  success: "text-green-600 text-sm",
  warning: "text-yellow-600 text-sm",
  
  // Empty states
  emptyState: "flex items-center justify-center h-full",
  emptyStateIcon: "text-gray-400 text-6xl mb-4",
  emptyStateTitle: "text-xl font-semibold mb-3",
  emptyStateDescription: "text-gray-600 mb-2",
  emptyStateAction: "mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600",
  
  // Responsive classes
  mobile: "sm:hidden",
  tablet: "hidden sm:block lg:hidden",
  desktop: "hidden lg:block",
};

/**
 * Default theme configuration
 */
export const defaultThemeConfig: ThemeConfig = {
  name: 'default',
  displayName: 'Default',
  description: 'Clean, minimal design using Tailwind CSS',
  framework: 'tailwind',
  darkMode: false,
  responsive: true,
  version: '1.0.0',
};

/**
 * Complete default theme package
 */
export const defaultThemePackage: ThemePackage = {
  config: defaultThemeConfig,
  theme: defaultTheme,
};

/**
 * Helper function to get theme with user overrides
 */
export function createDefaultTheme(overrides?: Partial<ChatTheme>): ChatTheme {
  return {
    ...defaultTheme,
    ...overrides,
  };
}