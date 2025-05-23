import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface AuthState {
	isAuthenticated: boolean;
	accessToken: string | null;
	user: {
		username: string;
		email?: string;
		full_name?: string;
	} | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	accessToken: null,
	user: null,
	isLoading: false,
	error: null
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	// Load token from localStorage on initialization
	if (browser) {
		const savedToken = localStorage.getItem('auth_token');
		const savedUser = localStorage.getItem('auth_user');
		
		if (savedToken && savedUser) {
			try {
				const user = JSON.parse(savedUser);
				set({
					isAuthenticated: true,
					accessToken: savedToken,
					user,
					isLoading: false,
					error: null
				});
			} catch (e) {
				// Clear invalid data
				localStorage.removeItem('auth_token');
				localStorage.removeItem('auth_user');
			}
		}
	}

	const login = async (username: string, password: string, serverUrl: string = 'http://localhost:8000') => {
		update(state => ({ ...state, isLoading: true, error: null }));

		try {
			// Create form data for OAuth2 login
			const formData = new FormData();
			formData.append('username', username);
			formData.append('password', password);

			const response = await fetch(`${serverUrl}/token`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
				throw new Error(errorData.detail || 'Login failed');
			}

			const tokenData = await response.json();
			const accessToken = tokenData.access_token;

			// Get user info
			const userResponse = await fetch(`${serverUrl}/users/me`, {
				headers: {
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (!userResponse.ok) {
				throw new Error('Failed to get user information');
			}

			const user = await userResponse.json();

			// Save to localStorage
			if (browser) {
				localStorage.setItem('auth_token', accessToken);
				localStorage.setItem('auth_user', JSON.stringify(user));
			}

			// Update state
			set({
				isAuthenticated: true,
				accessToken,
				user,
				isLoading: false,
				error: null
			});

			return { success: true };

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Login failed';
			update(state => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));
			return { success: false, error: errorMessage };
		}
	};

	const logout = () => {
		// Clear localStorage
		if (browser) {
			localStorage.removeItem('auth_token');
			localStorage.removeItem('auth_user');
		}

		// Reset state
		set(initialState);
	};

	const clearError = () => {
		update(state => ({ ...state, error: null }));
	};

	return {
		subscribe,
		login,
		logout,
		clearError
	};
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
export const accessToken = derived(authStore, $auth => $auth.accessToken);
export const currentUser = derived(authStore, $auth => $auth.user);
export const authLoading = derived(authStore, $auth => $auth.isLoading);
export const authError = derived(authStore, $auth => $auth.error);