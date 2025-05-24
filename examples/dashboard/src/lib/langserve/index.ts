// Re-export everything from the consolidated package
export * from 'svelte-langserve';

// Re-export local components that aren't in the package yet
export { default as ErrorBoundary } from './components/ErrorBoundary.svelte';
export { default as LoginForm } from './components/LoginForm.svelte';

// Re-export auth store with renamed exports to avoid conflicts
export {
	authStore,
	isAuthenticated as isAuth,
	currentUser as user,
	authLoading as loading,
	authError as error,
	accessToken as token
} from './stores/auth';
