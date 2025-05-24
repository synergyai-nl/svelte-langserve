<script lang="ts">
	import { authStore, authLoading, authError } from '../stores/auth.js';

	interface Props {
		serverUrl?: string;
		onloginSuccess?: () => void;
	}

	let { serverUrl = 'http://localhost:8000', onloginSuccess }: Props = $props();

	let username = $state('demo');
	let password = $state('secret');
	let showPassword = $state(false);

	async function handleSubmit() {
		const result = await authStore.login(username, password, serverUrl);
		if (result.success) {
			onloginSuccess?.();
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function clearError() {
		authStore.clearError();
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h2>Login to Claude Dashboard</h2>

		{#if $authError}
			<div class="error-banner">
				<span class="error-text">{$authError}</span>
				<button class="error-close" onclick={clearError} aria-label="Clear error">×</button>
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label for="server-url">Server URL</label>
				<input
					id="server-url"
					type="url"
					bind:value={serverUrl}
					placeholder="http://localhost:8000"
					disabled={$authLoading}
					required
				/>
			</div>

			<div class="form-group">
				<label for="username">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="demo"
					disabled={$authLoading}
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<div class="password-input">
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder="secret"
						disabled={$authLoading}
						required
					/>
					<button
						type="button"
						class="password-toggle"
						onclick={togglePasswordVisibility}
						disabled={$authLoading}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{showPassword ? '👁️' : '👁️‍🗨️'}
					</button>
				</div>
			</div>

			<button type="submit" class="login-button" disabled={$authLoading}>
				{$authLoading ? 'Logging in...' : 'Login'}
			</button>
		</form>

		<div class="demo-info">
			<h3>Demo Credentials</h3>
			<p><strong>Username:</strong> demo or admin</p>
			<p><strong>Password:</strong> secret</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.login-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 400px;
	}

	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.5rem;
	}

	.error-banner {
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 6px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.error-text {
		color: #c33;
		font-size: 0.9rem;
	}

	.error-close {
		background: none;
		border: none;
		color: #c33;
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
	}

	input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.password-input {
		position: relative;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 0;
	}

	.password-toggle:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.login-button {
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.login-button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.login-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.demo-info {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #eee;
		text-align: center;
	}

	.demo-info h3 {
		margin-bottom: 0.5rem;
		color: #666;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.demo-info p {
		margin: 0.25rem 0;
		font-size: 0.85rem;
		color: #777;
	}
</style>
