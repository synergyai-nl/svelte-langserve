import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ConfigPanel from './ConfigPanel.svelte';

describe('ConfigPanel', () => {
	it('renders with default props', () => {
		render(ConfigPanel);

		expect(screen.getByText('Configuration')).toBeInTheDocument();
		expect(screen.getByText('Temperature:')).toBeInTheDocument();
		expect(screen.getByText('Enable Streaming')).toBeInTheDocument();

		// Check default values
		const temperatureSlider = screen.getByRole('slider');
		expect(temperatureSlider).toHaveValue('0.7');

		const streamingCheckbox = screen.getByRole('checkbox');
		expect(streamingCheckbox).toBeChecked();
	});

	it('renders with custom props', () => {
		render(ConfigPanel, {
			temperature: 0.5,
			streaming: false
		});

		const temperatureSlider = screen.getByRole('slider');
		expect(temperatureSlider).toHaveValue('0.5');
		expect(screen.getByText('0.5')).toBeInTheDocument();

		const streamingCheckbox = screen.getByRole('checkbox');
		expect(streamingCheckbox).not.toBeChecked();
	});

	it('has correct accessibility attributes', () => {
		render(ConfigPanel);

		const temperatureSlider = screen.getByRole('slider');
		expect(temperatureSlider).toHaveAttribute('min', '0');
		expect(temperatureSlider).toHaveAttribute('max', '1');
		expect(temperatureSlider).toHaveAttribute('step', '0.1');

		const streamingCheckbox = screen.getByRole('checkbox');
		expect(streamingCheckbox).toHaveAttribute('type', 'checkbox');
	});

	it('displays temperature value correctly', async () => {
		const { rerender } = render(ConfigPanel, {
			temperature: 0.2,
			streaming: false
		});

		expect(screen.getByText('0.2')).toBeInTheDocument();
		expect(screen.getByRole('checkbox')).not.toBeChecked();

		// Test another configuration
		rerender({
			temperature: 0.9,
			streaming: true
		});

		// Give time for reactivity
		await waitFor(() => {
			expect(screen.getByRole('checkbox')).toBeChecked();
		});
	});
});
