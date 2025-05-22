// Client-side implementation for LangServe Socket.IO Frontend
import { io, Socket } from 'socket.io-client';
import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface LangServeEndpoint {
	id: string;
	name: string;
	url: string;
	description?: string;
	config_schema?: any;
	input_schema?: any;
	output_schema?: any;
	healthy?: boolean;
}

interface ChatMessage {
	id: string;
	type: 'human' | 'ai' | 'system' | 'tool';
	content: string | any[];
	sender_id: string;
	sender_type: 'user' | 'agent';
	timestamp: string;
	conversation_id: string;
	additional_kwargs?: Record<string, any>;
}

interface Conversation {
	id: string;
	participants: {
		users: string[];
		agents: LangServeEndpoint[];
	};
	messages: ChatMessage[];
	status: 'active' | 'paused' | 'ended';
	created_at: string;
	metadata?: Record<string, any>;
}

interface MessageChunk {
	message_id: string;
	chunk_id: string;
	content: string;
	sender_id: string;
	sender_name: string;
	conversation_id: string;
}

// Custom Hook for LangServe Frontend
export function useLangServeFrontend(serverUrl: string, userId: string, authToken?: string) {
	const [socket, setSocket] = useState < Socket | null > (null);
	const [connected, setConnected] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);
	const [availableEndpoints, setAvailableEndpoints] = useState < LangServeEndpoint[] > ([]);
	const [conversations, setConversations] = useState < Conversation[] > ([]);
	const [activeConversationId, setActiveConversationId] = useState < string | null > (null);
	const [streamingMessages, setStreamingMessages] = useState < Map < string, string>> (new Map());
	const [connectionError, setConnectionError] = useState < string | null > (null);
	const [endpointHealth, setEndpointHealth] = useState < Map < string, boolean>> (new Map());

	const streamingTimeouts = useRef < Map < string, NodeJS.Timeout>> (new Map());

	// Initialize connection
	useEffect(() => {
		const newSocket = io(serverUrl, {
			autoConnect: false,
			transports: ['websocket', 'polling']
		});

		// Connection events
		newSocket.on('connect', () => {
			setConnected(true);
			setConnectionError(null);
			newSocket.emit('authenticate', { user_id: userId, token: authToken });
		});

		newSocket.on('disconnect', () => {
			setConnected(false);
			setAuthenticated(false);
		});

		newSocket.on('connect_error', (error) => {
			setConnectionError(error.message);
		});

		// Authentication
		newSocket.on('authenticated', (data: { user_id: string; available_endpoints: LangServeEndpoint[] }) => {
			setAuthenticated(true);
			setAvailableEndpoints(data.available_endpoints);
			console.log('Authenticated with', data.available_endpoints.length, 'endpoints available');
		});

		// Conversation management
		newSocket.on('conversation_created', (conversation: Conversation) => {
			setConversations(prev => [...prev, conversation]);
			setActiveConversationId(conversation.id);
		});

		newSocket.on('conversation_joined', (conversation: Conversation) => {
			setConversations(prev => {
				const existing = prev.find(c => c.id === conversation.id);
				if (existing) {
					return prev.map(c => c.id === conversation.id ? conversation : c);
				}
				return [...prev, conversation];
			});
			setActiveConversationId(conversation.id);
		});

		newSocket.on('conversations_list', (conversationsList: Conversation[]) => {
			setConversations(conversationsList);
		});

		// Message events
		newSocket.on('message_received', (message: ChatMessage) => {
			setConversations(prev =>
				prev.map(conv =>
					conv.id === message.conversation_id
						? { ...conv, messages: [...conv.messages, message] }
						: conv
				)
			);
		});

		// Streaming events
		newSocket.on('agent_response_start', (data: { message_id: string; endpoint_id: string; endpoint_name: string }) => {
			setStreamingMessages(prev => new Map(prev).set(data.message_id, ''));
		});

		newSocket.on('message_chunk', (chunk: MessageChunk) => {
			setStreamingMessages(prev => {
				const updated = new Map(prev);
				const current = updated.get(chunk.message_id) || '';
				updated.set(chunk.message_id, current + chunk.content);
				return updated;
			});

			// Clear any existing timeout for this message
			const existingTimeout = streamingTimeouts.current.get(chunk.message_id);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			// Set a timeout to clean up if streaming stops unexpectedly
			const timeout = setTimeout(() => {
				setStreamingMessages(prev => {
					const updated = new Map(prev);
					updated.delete(chunk.message_id);
					return updated;
				});
				streamingTimeouts.current.delete(chunk.message_id);
			}, 10000);

			streamingTimeouts.current.set(chunk.message_id, timeout);
		});

		newSocket.on('agent_response_complete', (message: ChatMessage) => {
			// Clear streaming state
			setStreamingMessages(prev => {
				const updated = new Map(prev);
				updated.delete(message.id);
				return updated;
			});

			const timeout = streamingTimeouts.current.get(message.id);
			if (timeout) {
				clearTimeout(timeout);
				streamingTimeouts.current.delete(message.id);
			}

			// Add final message
			setConversations(prev =>
				prev.map(conv =>
					conv.id === message.conversation_id
						? { ...conv, messages: [...conv.messages.filter(m => m.id !== message.id), message] }
						: conv
				)
			);
		});

		// Endpoint management
		newSocket.on('endpoint_schemas', (data: { endpoint_id: string; schemas: any }) => {
			setAvailableEndpoints(prev =>
				prev.map(ep =>
					ep.id === data.endpoint_id
						? { ...ep, ...data.schemas }
						: ep
				)
			);
		});

		newSocket.on('endpoint_test_result', (data: { endpoint_id: string; healthy: boolean; error?: string }) => {
			setEndpointHealth(prev => new Map(prev).set(data.endpoint_id, data.healthy));

			if (!data.healthy && data.error) {
				console.warn(`Endpoint ${data.endpoint_id} is unhealthy:`, data.error);
			}
		});

		// Error handling
		newSocket.on('error', (error: { message: string }) => {
			setConnectionError(error.message);
			console.error('Socket error:', error.message);
		});

		newSocket.on('agent_error', (error: { endpoint_id: string; endpoint_name: string; error: string }) => {
			console.error(`Agent error from ${error.endpoint_name}:`, error.error);
			// Could show user-friendly error message in UI
		});

		newSocket.on('agent_response_error', (error: { message_id: string; endpoint_id: string; error: string }) => {
			// Clean up streaming state on error
			setStreamingMessages(prev => {
				const updated = new Map(prev);
				updated.delete(error.message_id);
				return updated;
			});
		});

		setSocket(newSocket);

		return () => {
			// Clear all timeouts
			streamingTimeouts.current.forEach(timeout => clearTimeout(timeout));
			newSocket.disconnect();
		};
	}, [serverUrl, userId, authToken]);

	// Connection management
	const connect = useCallback(() => {
		if (socket && !connected) {
			socket.connect();
		}
	}, [socket, connected]);

	const disconnect = useCallback(() => {
		if (socket) {
			socket.disconnect();
		}
	}, [socket]);

	// Endpoint management
	const testEndpoint = useCallback((endpointId: string) => {
		if (socket && authenticated) {
			socket.emit('test_endpoint', { endpoint_id: endpointId });
		}
	}, [socket, authenticated]);

	const getEndpointSchemas = useCallback((endpointId: string) => {
		if (socket && authenticated) {
			socket.emit('get_endpoint_schemas', { endpoint_id: endpointId });
		}
	}, [socket, authenticated]);

	const testAllEndpoints = useCallback(() => {
		availableEndpoints.forEach(endpoint => {
			testEndpoint(endpoint.id);
		});
	}, [availableEndpoints, testEndpoint]);

	// Conversation management
	const createConversation = useCallback((
		endpointIds: string[],
		initialMessage?: string,
		config?: Record<string, any>
	) => {
		if (socket && authenticated) {
			socket.emit('create_conversation', {
				endpoint_ids: endpointIds,
				initial_message: initialMessage,
				config
			});
		}
	}, [socket, authenticated]);

	const joinConversation = useCallback((conversationId: string) => {
		if (socket && authenticated) {
			socket.emit('join_conversation', { conversation_id: conversationId });
		}
	}, [socket, authenticated]);

	const sendMessage = useCallback((
		conversationId: string,
		content: string,
		config?: Record<string, any>
	) => {
		if (socket && authenticated) {
			socket.emit('send_message', {
				conversation_id: conversationId,
				content,
				config
			});
		}
	}, [socket, authenticated]);

	const loadConversations = useCallback(() => {
		if (socket && authenticated) {
			socket.emit('list_conversations');
		}
	}, [socket, authenticated]);

	const getConversationHistory = useCallback((conversationId: string) => {
		if (socket && authenticated) {
			socket.emit('get_conversation_history', { conversation_id: conversationId });
		}
	}, [socket, authenticated]);

	// Get active conversation
	const activeConversation = conversations.find(c => c.id === activeConversationId);

	// Get messages with streaming content
	const getDisplayMessages = useCallback((conversationId: string): ChatMessage[] => {
		const conversation = conversations.find(c => c.id === conversationId);
		if (!conversation) return [];

		const messages = [...conversation.messages];

		// Add streaming messages as temporary messages
		streamingMessages.forEach((content, messageId) => {
			if (content) {
				const streamingMessage: ChatMessage = {
					id: messageId,
					type: 'ai',
					content,
					sender_id: 'streaming',
					sender_type: 'agent',
					timestamp: new Date().toISOString(),
					conversation_id: conversationId,
					additional_kwargs: { streaming: true }
				};
				messages.push(streamingMessage);
			}
		});

		return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
	}, [conversations, streamingMessages]);

	return {
		// Connection state
		connected,
		authenticated,
		connectionError,
		connect,
		disconnect,

		// Endpoints
		availableEndpoints,
		endpointHealth,
		testEndpoint,
		testAllEndpoints,
		getEndpointSchemas,

		// Conversations
		conversations,
		activeConversation,
		activeConversationId,
		setActiveConversationId,
		createConversation,
		joinConversation,
		loadConversations,
		getConversationHistory,

		// Messaging
		sendMessage,
		getDisplayMessages,

		// Streaming state
		streamingMessages: Array.from(streamingMessages.entries()),
		hasStreamingMessages: streamingMessages.size > 0
	};
}

// React Component for LangServe Frontend Interface
export function LangServeFrontendInterface({
	userId,
	authToken,
	serverUrl = 'http://localhost:3000'
}: {
	userId: string;
	authToken?: string;
	serverUrl?: string;
}) {
	const langserve = useLangServeFrontend(serverUrl, userId, authToken);
	const [messageInput, setMessageInput] = useState('');
	const [selectedEndpoints, setSelectedEndpoints] = useState < string[] > ([]);
	const [config, setConfig] = useState({ temperature: 0.7, streaming: true });
	const [showEndpointDetails, setShowEndpointDetails] = useState(false);

	useEffect(() => {
		langserve.connect();
		return () => langserve.disconnect();
	}, []);

	useEffect(() => {
		if (langserve.authenticated) {
			langserve.loadConversations();
			langserve.testAllEndpoints();
		}
	}, [langserve.authenticated]);

	const handleSendMessage = () => {
		if (messageInput.trim() && langserve.activeConversationId) {
			langserve.sendMessage(langserve.activeConversationId, messageInput.trim(), config);
			setMessageInput('');
		}
	};

	const handleCreateConversation = () => {
		if (selectedEndpoints.length > 0) {
			langserve.createConversation(selectedEndpoints, undefined, config);
		}
	};

	const getEndpointStatus = (endpointId: string) => {
		const health = langserve.endpointHealth.get(endpointId);
		return health === undefined ? 'unknown' : health ? 'healthy' : 'unhealthy';
	};

	if (!langserve.connected) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<h2>Connecting to LangServe Frontend...</h2>
				{langserve.connectionError && (
					<div style={{ color: 'red', margin: '10px 0' }}>
						Error: {langserve.connectionError}
					</div>
				)}
				<button onClick={langserve.connect}>Retry Connection</button>
			</div>
		);
	}

	if (!langserve.authenticated) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<h2>Authenticating...</h2>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', height: '100vh' }}>
			{/* Sidebar */}
			<div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '10px' }}>
				<h3>LangServe Frontend</h3>

				{/* Available Endpoints */}
				<div style={{ marginBottom: '20px' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h4>Available Endpoints</h4>
						<button
							onClick={() => setShowEndpointDetails(!showEndpointDetails)}
							style={{ fontSize: '12px' }}
						>
							{showEndpointDetails ? 'Hide' : 'Show'} Details
						</button>
					</div>

					{langserve.availableEndpoints.map(endpoint => (
						<div key={endpoint.id} style={{ margin: '8px 0', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
							<label style={{ display: 'flex', alignItems: 'center' }}>
								<input
									type="checkbox"
									checked={selectedEndpoints.includes(endpoint.id)}
									onChange={(e) => {
										if (e.target.checked) {
											setSelectedEndpoints([...selectedEndpoints, endpoint.id]);
										} else {
											setSelectedEndpoints(selectedEndpoints.filter(id => id !== endpoint.id));
										}
									}}
									style={{ marginRight: '8px' }}
								/>
								<div>
									<strong>{endpoint.name}</strong>
									<div style={{
										fontSize: '12px',
										color: getEndpointStatus(endpoint.id) === 'healthy' ? 'green' :
											getEndpointStatus(endpoint.id) === 'unhealthy' ? 'red' : 'gray'
									}}>
										Status: {getEndpointStatus(endpoint.id)}
									</div>
									{showEndpointDetails && (
										<div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
											{endpoint.description}<br />
											URL: {endpoint.url}
										</div>
									)}
								</div>
							</label>
							<div style={{ marginTop: '4px' }}>
								<button
									onClick={() => langserve.testEndpoint(endpoint.id)}
									style={{ fontSize: '10px', padding: '2px 6px' }}
								>
									Test
								</button>
								<button
									onClick={() => langserve.getEndpointSchemas(endpoint.id)}
									style={{ fontSize: '10px', padding: '2px 6px', marginLeft: '4px' }}
								>
									Schemas
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Configuration */}
				<div style={{ marginBottom: '20px' }}>
					<h4>Configuration</h4>
					<div style={{ margin: '8px 0' }}>
						<label>
							Temperature:
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								value={config.temperature}
								onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
								style={{ marginLeft: '8px' }}
							/>
							{config.temperature}
						</label>
					</div>
					<div style={{ margin: '8px 0' }}>
						<label>
							<input
								type="checkbox"
								checked={config.streaming}
								onChange={(e) => setConfig({ ...config, streaming: e.target.checked })}
								style={{ marginRight: '8px' }}
							/>
							Enable Streaming
						</label>
					</div>
				</div>

				{/* Create Conversation */}
				<button
					onClick={handleCreateConversation}
					disabled={selectedEndpoints.length === 0}
					style={{
						width: '100%',
						padding: '10px',
						backgroundColor: selectedEndpoints.length > 0 ? '#007bff' : '#ccc',
						color: 'white',
						border: 'none',
						borderRadius: '4px'
					}}
				>
					Create Conversation ({selectedEndpoints.length} endpoints)
				</button>

				{/* Conversations List */}
				<div style={{ marginTop: '20px' }}>
					<h4>Conversations</h4>
					{langserve.conversations.map(conv => (
						<div
							key={conv.id}
							onClick={() => langserve.setActiveConversationId(conv.id)}
							style={{
								padding: '8px',
								margin: '4px 0',
								backgroundColor: langserve.activeConversationId === conv.id ? '#e3f2fd' : '#f5f5f5',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px'
							}}
						>
							<div><strong>ID:</strong> {conv.id.slice(0, 8)}...</div>
							<div><strong>Agents:</strong> {conv.participants.agents.map(a => a.name).join(', ')}</div>
							<div><strong>Messages:</strong> {conv.messages.length}</div>
						</div>
					))}
				</div>
			</div>

			{/* Main Chat Area */}
			<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				{langserve.activeConversation ? (
					<>
						{/* Chat Header */}
						<div style={{ padding: '10px', borderBottom: '1px solid #ccc', backgroundColor: '#f8f9fa' }}>
							<h3>Conversation: {langserve.activeConversation.id.slice(0, 12)}...</h3>
							<div style={{ fontSize: '14px', color: '#666' }}>
								Agents: {langserve.activeConversation.participants.agents.map(a => a.name).join(', ')}
							</div>
							{langserve.hasStreamingMessages && (
								<div style={{ fontSize: '12px', color: '#007bff', fontStyle: 'italic' }}>
									🔄 Agents are responding...
								</div>
							)}
						</div>

						{/* Messages */}
						<div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
							{langserve.getDisplayMessages(langserve.activeConversationId).map(message => (
								<div
									key={message.id}
									style={{
										margin: '10px 0',
										padding: '12px',
										backgroundColor: message.sender_type === 'user' ? '#e3f2fd' : '#f5f5f5',
										borderRadius: '8px',
										borderLeft: message.additional_kwargs?.streaming ? '4px solid #007bff' : 'none'
									}}
								>
									<div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
										{message.sender_type === 'user' ? 'You' :
											message.additional_kwargs?.endpoint_name || message.sender_id}
										{message.additional_kwargs?.streaming && ' (streaming...)'}
									</div>
									<div>{message.content}</div>
									<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
										{new Date(message.timestamp).toLocaleTimeString()}
									</div>
								</div>
							))}
						</div>

						{/* Input */}
						<div style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex' }}>
							<input
								type="text"
								value={messageInput}
								onChange={(e) => setMessageInput(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
								placeholder="Type a message..."
								style={{ flex: 1, marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
							/>
							<button
								onClick={handleSendMessage}
								style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
							>
								Send
							</button>
						</div>
					</>
				) : (
					<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<div style={{ textAlign: 'center' }}>
							<h3>Welcome to LangServe Frontend</h3>
							<p>Select endpoints and create a conversation to get started.</p>
							<p>Available endpoints: {langserve.availableEndpoints.length}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
