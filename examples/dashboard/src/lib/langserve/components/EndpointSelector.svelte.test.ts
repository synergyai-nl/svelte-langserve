import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { writable } from 'svelte/store';
import EndpointSelector from './EndpointSelector.svelte';
import * as langserveStore from '../stores/langserve';

// Mock the langserve store
vi.mock('../stores/langserve', () => {
	const mockAvailableEndpoints = writable([
		{
			id: 'endpoint-1',
			name: 'Chatbot',
			url: 'http://localhost:8000/chatbot',
			description: 'General chatbot'
		},
		{
			id: 'endpoint-2', 
			name: 'Code Assistant',
			url: 'http://localhost:8000/code-assistant',
			description: 'Helps with code'
		}
	]);

	const mockEndpointHealth = writable(new Map([
		['endpoint-1', true],
		['endpoint-2', false]
	]));

	const mockTestEndpoint = vi.fn();
	const mockGetEndpointSchemas = vi.fn();

	return {
		availableEndpoints: mockAvailableEndpoints,
		endpointHealth: mockEndpointHealth,
		testEndpoint: mockTestEndpoint,
		getEndpointSchemas: mockGetEndpointSchemas
	};
});

describe('EndpointSelector', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Reset mock data to default state
		langserveStore.availableEndpoints.set([
			{
				id: 'endpoint-1',
				name: 'Chatbot',
				url: 'http://localhost:8000/chatbot',
				description: 'General chatbot'
			},
			{
				id: 'endpoint-2', 
				name: 'Code Assistant',
				url: 'http://localhost:8000/code-assistant',
				description: 'Helps with code'
			}
		]);
		
		langserveStore.endpointHealth.set(new Map([
			['endpoint-1', true],
			['endpoint-2', false]
		]));
	});

	it('renders available endpoints', () => {
		render(EndpointSelector);
		
		expect(screen.getByText('Available Endpoints')).toBeInTheDocument();
		expect(screen.getByText('Chatbot')).toBeInTheDocument();
		expect(screen.getByText('Code Assistant')).toBeInTheDocument();
	});

	it('shows endpoint health status', () => {
		render(EndpointSelector);
		
		expect(screen.getByText('Status: healthy')).toBeInTheDocument();
		expect(screen.getByText('Status: unhealthy')).toBeInTheDocument();
	});

	it('renders no endpoints message when list is empty', () => {
		// Mock empty endpoints
		langserveStore.availableEndpoints.set([]);

		render(EndpointSelector);
		
		expect(screen.getByText('No endpoints available')).toBeInTheDocument();
	});

	it('allows selecting and deselecting endpoints', async () => {
		const user = userEvent.setup();
		const component = render(EndpointSelector, {
			props: { selectedEndpoints: [] }
		});

		const chatbotCheckbox = screen.getByRole('checkbox', { name: /chatbot/i });
		const codeAssistantCheckbox = screen.getByRole('checkbox', { name: /code assistant/i });

		// Initially unselected
		expect(chatbotCheckbox).not.toBeChecked();
		expect(codeAssistantCheckbox).not.toBeChecked();

		// Select chatbot
		await user.click(chatbotCheckbox);
		expect(chatbotCheckbox).toBeChecked();

		// Select code assistant
		await user.click(codeAssistantCheckbox);
		expect(codeAssistantCheckbox).toBeChecked();

		// Deselect chatbot
		await user.click(chatbotCheckbox);
		expect(chatbotCheckbox).not.toBeChecked();
		expect(codeAssistantCheckbox).toBeChecked();
	});

	it('shows/hides endpoint details when toggled', async () => {
		const user = userEvent.setup();
		render(EndpointSelector);

		const detailsButton = screen.getByRole('button', { name: /show details/i });
		
		// Initially hidden
		expect(screen.queryByText('URL: http://localhost:8000/chatbot')).not.toBeInTheDocument();
		
		// Show details
		await user.click(detailsButton);
		expect(screen.getByText('URL: http://localhost:8000/chatbot')).toBeInTheDocument();
		expect(screen.getByText('URL: http://localhost:8000/code-assistant')).toBeInTheDocument();
		expect(screen.getByText('General chatbot')).toBeInTheDocument();
		expect(screen.getByText('Helps with code')).toBeInTheDocument();
		
		// Button text changes
		expect(screen.getByRole('button', { name: /hide details/i })).toBeInTheDocument();
		
		// Hide details
		await user.click(screen.getByRole('button', { name: /hide details/i }));
		expect(screen.queryByText('URL: http://localhost:8000/chatbot')).not.toBeInTheDocument();
	});

	it('calls testEndpoint when test button is clicked', async () => {
		const user = userEvent.setup();
		
		render(EndpointSelector);

		const testButtons = screen.getAllByRole('button', { name: /test/i });
		await user.click(testButtons[0]);

		expect(langserveStore.testEndpoint).toHaveBeenCalledWith('endpoint-1');
	});

	it('calls getEndpointSchemas when schemas button is clicked', async () => {
		const user = userEvent.setup();
		
		render(EndpointSelector);

		const schemaButtons = screen.getAllByRole('button', { name: /schemas/i });
		await user.click(schemaButtons[0]);

		expect(langserveStore.getEndpointSchemas).toHaveBeenCalledWith('endpoint-1');
	});

	it('applies correct styling based on endpoint health', () => {
		render(EndpointSelector);
		
		const healthyStatus = screen.getByText('Status: healthy');
		const unhealthyStatus = screen.getByText('Status: unhealthy');
		
		expect(healthyStatus).toHaveClass('text-green-600');
		expect(unhealthyStatus).toHaveClass('text-red-600');
	});

	it('handles unknown endpoint health status', () => {
		// Mock endpoint with unknown health
		langserveStore.endpointHealth.set(new Map());

		render(EndpointSelector);
		
		const unknownStatuses = screen.getAllByText('Status: unknown');
		expect(unknownStatuses).toHaveLength(2);
		unknownStatuses.forEach(status => {
			expect(status).toHaveClass('text-gray-500');
		});
	});

	it('updates selection when props change', () => {
		const { rerender } = render(EndpointSelector, {
			props: { selectedEndpoints: [] }
		});

		const chatbotCheckbox = screen.getByRole('checkbox', { name: /chatbot/i });
		expect(chatbotCheckbox).not.toBeChecked();

		// Update props to have endpoint-1 selected
		rerender({
			props: { selectedEndpoints: ['endpoint-1'] }
		});

		expect(chatbotCheckbox).toBeChecked();
	});
});