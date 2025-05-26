/**
 * Theme interface for styling LangServe chat components
 * Provides complete customization of all visual elements
 */
export interface ChatTheme {
  // Main layout containers
  container: string;
  sidebar: string;
  chatArea: string;

  // Header elements
  header: string;
  title: string;
  subtitle: string;

  // Message display
  messageContainer: string;
  messageWrapper: string;
  messageUser: string;
  messageUserBubble: string;
  messageAssistant: string;
  messageAssistantBubble: string;
  messageSystem: string;
  messageTimestamp: string;
  messageContent: string;

  // Message states
  messageStreaming: string;
  messageError: string;
  messageLoading: string;

  // Input area
  inputContainer: string;
  inputWrapper: string;
  inputField: string;
  inputFieldFocus: string;
  sendButton: string;
  sendButtonDisabled: string;
  sendButtonIcon: string;

  // Endpoint selector
  endpointSelector: string;
  endpointSelectorLabel: string;
  endpointOption: string;
  endpointOptionSelected: string;
  endpointHealth: string;
  endpointHealthy: string;
  endpointUnhealthy: string;

  // Configuration panel
  configPanel: string;
  configSection: string;
  configLabel: string;
  configInput: string;
  configSlider: string;
  configToggle: string;
  configButton: string;

  // Conversation list
  conversationList: string;
  conversationItem: string;
  conversationItemActive: string;
  conversationTitle: string;
  conversationPreview: string;
  conversationTimestamp: string;
  conversationActions: string;

  // Navigation and actions
  createConversationButton: string;
  joinConversationButton: string;
  testEndpointButton: string;
  getSchemasButton: string;

  // States and feedback
  loading: string;
  loadingSpinner: string;
  loadingText: string;
  error: string;
  errorMessage: string;
  success: string;
  warning: string;

  // Empty states
  emptyState: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateAction: string;

  // Responsive classes
  mobile: string;
  tablet: string;
  desktop: string;
}

/**
 * Theme variant system for different modes (dark, compact, etc.)
 */
export interface ThemeVariant {
  primary: ChatTheme;
  dark?: Partial<ChatTheme>;
  compact?: Partial<ChatTheme>;
  mobile?: Partial<ChatTheme>;
}

/**
 * Theme configuration options
 */
export interface ThemeConfig {
  name: string;
  displayName: string;
  description?: string;
  author?: string;
  version?: string;
  framework?: "tailwind" | "bootstrap" | "flowbite" | "material" | "custom";
  darkMode?: boolean;
  responsive?: boolean;
}

/**
 * Complete theme package with config and styles
 */
export interface ThemePackage {
  config: ThemeConfig;
  theme: ChatTheme | ThemeVariant;
}

/**
 * Helper type for theme overrides
 */
export type ThemeOverride = Partial<ChatTheme>;

/**
 * Theme context type
 */
export interface ThemeContext {
  theme: ChatTheme;
  config: ThemeConfig;
  variant?: "primary" | "dark" | "compact" | "mobile";
  override?: ThemeOverride;
}
