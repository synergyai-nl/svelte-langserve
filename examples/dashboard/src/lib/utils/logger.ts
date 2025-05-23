/**
 * Comprehensive logging utility for the LangServe Frontend
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
	TRACE = 4
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	context: string;
	message: string;
	data?: any;
	error?: Error;
	userId?: string;
	conversationId?: string;
	correlationId?: string;
}

class Logger {
	private logLevel: LogLevel;
	private logs: LogEntry[] = [];
	private maxLogs = 1000; // Keep last 1000 logs in memory
	private enableConsole = true;
	private enableStorage = false;

	constructor(logLevel = LogLevel.INFO) {
		this.logLevel = logLevel;
		
		// Try to read log level from environment or localStorage
		if (typeof window !== 'undefined') {
			const storedLevel = localStorage.getItem('langserve_log_level');
			if (storedLevel && LogLevel[storedLevel as keyof typeof LogLevel] !== undefined) {
				this.logLevel = LogLevel[storedLevel as keyof typeof LogLevel];
			}
		}
	}

	private shouldLog(level: LogLevel): boolean {
		return level <= this.logLevel;
	}

	private createLogEntry(
		level: LogLevel,
		context: string,
		message: string,
		data?: any,
		error?: Error
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			context,
			message,
			data,
			error,
			correlationId: this.generateCorrelationId()
		};
	}

	private generateCorrelationId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private logToConsole(entry: LogEntry): void {
		if (!this.enableConsole) return;

		const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.context}]`;
		
		switch (entry.level) {
			case LogLevel.ERROR:
				if (entry.error) {
					console.error(prefix, entry.message, entry.data || '', entry.error);
				} else {
					console.error(prefix, entry.message, entry.data || '');
				}
				break;
			case LogLevel.WARN:
				console.warn(prefix, entry.message, entry.data || '');
				break;
			case LogLevel.INFO:
				console.info(prefix, entry.message, entry.data || '');
				break;
			case LogLevel.DEBUG:
				console.debug(prefix, entry.message, entry.data || '');
				break;
			case LogLevel.TRACE:
				console.trace(prefix, entry.message, entry.data || '');
				break;
		}
	}

	private storeLog(entry: LogEntry): void {
		this.logs.push(entry);
		
		// Remove old logs if we exceed the limit
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Store in localStorage if enabled
		if (this.enableStorage && typeof window !== 'undefined') {
			try {
				const recentLogs = this.logs.slice(-100); // Store only last 100 logs
				localStorage.setItem('langserve_logs', JSON.stringify(recentLogs));
			} catch (error) {
				// Ignore storage errors
			}
		}
	}

	private log(level: LogLevel, context: string, message: string, data?: any, error?: Error): void {
		if (!this.shouldLog(level)) return;

		const entry = this.createLogEntry(level, context, message, data, error);
		this.logToConsole(entry);
		this.storeLog(entry);
	}

	// Public logging methods
	error(context: string, message: string, data?: any, error?: Error): void {
		this.log(LogLevel.ERROR, context, message, data, error);
	}

	warn(context: string, message: string, data?: any): void {
		this.log(LogLevel.WARN, context, message, data);
	}

	info(context: string, message: string, data?: any): void {
		this.log(LogLevel.INFO, context, message, data);
	}

	debug(context: string, message: string, data?: any): void {
		this.log(LogLevel.DEBUG, context, message, data);
	}

	trace(context: string, message: string, data?: any): void {
		this.log(LogLevel.TRACE, context, message, data);
	}

	// Utility methods
	setLogLevel(level: LogLevel): void {
		this.logLevel = level;
		if (typeof window !== 'undefined') {
			localStorage.setItem('langserve_log_level', LogLevel[level]);
		}
	}

	getLogLevel(): LogLevel {
		return this.logLevel;
	}

	getLogs(filter?: { level?: LogLevel; context?: string; limit?: number }): LogEntry[] {
		let filteredLogs = this.logs;

		if (filter) {
			if (filter.level !== undefined) {
				filteredLogs = filteredLogs.filter(log => log.level === filter.level);
			}
			if (filter.context) {
				filteredLogs = filteredLogs.filter(log => log.context.includes(filter.context!));
			}
			if (filter.limit) {
				filteredLogs = filteredLogs.slice(-filter.limit);
			}
		}

		return filteredLogs;
	}

	clearLogs(): void {
		this.logs = [];
		if (typeof window !== 'undefined') {
			localStorage.removeItem('langserve_logs');
		}
	}

	// Configuration methods
	setConsoleLogging(enabled: boolean): void {
		this.enableConsole = enabled;
	}

	setStorageLogging(enabled: boolean): void {
		this.enableStorage = enabled;
	}

	// Context-specific loggers
	createContextLogger(context: string) {
		return {
			error: (message: string, data?: any, error?: Error) => this.error(context, message, data, error),
			warn: (message: string, data?: any) => this.warn(context, message, data),
			info: (message: string, data?: any) => this.info(context, message, data),
			debug: (message: string, data?: any) => this.debug(context, message, data),
			trace: (message: string, data?: any) => this.trace(context, message, data)
		};
	}

	// Performance logging
	time(label: string): void {
		console.time(label);
		this.debug('Performance', `Timer started: ${label}`);
	}

	timeEnd(label: string): void {
		console.timeEnd(label);
		this.debug('Performance', `Timer ended: ${label}`);
	}

	// User and conversation context
	setUserContext(userId: string): void {
		this.logs.forEach(log => {
			if (!log.userId) log.userId = userId;
		});
	}

	setConversationContext(conversationId: string): void {
		this.logs.forEach(log => {
			if (!log.conversationId) log.conversationId = conversationId;
		});
	}
}

// Create and export singleton logger instance
export const logger = new Logger();

// Export convenience functions for common contexts
export const socketLogger = logger.createContextLogger('Socket.IO');
export const authLogger = logger.createContextLogger('Authentication');
export const chatLogger = logger.createContextLogger('Chat');
export const streamingLogger = logger.createContextLogger('Streaming');
export const errorLogger = logger.createContextLogger('Error');
export const performanceLogger = logger.createContextLogger('Performance');

// Development helpers
export function enableDebugLogging(): void {
	logger.setLogLevel(LogLevel.DEBUG);
	logger.setConsoleLogging(true);
	logger.setStorageLogging(true);
}

export function enableProductionLogging(): void {
	logger.setLogLevel(LogLevel.WARN);
	logger.setConsoleLogging(true);
	logger.setStorageLogging(false);
}

// Browser debugging helpers
if (typeof window !== 'undefined') {
	// @ts-ignore - Add to window for debugging
	window.langserveLogger = {
		logger,
		enableDebug: enableDebugLogging,
		enableProduction: enableProductionLogging,
		setLevel: (level: string) => logger.setLogLevel(LogLevel[level as keyof typeof LogLevel]),
		getLogs: (filter?: any) => logger.getLogs(filter),
		clearLogs: () => logger.clearLogs()
	};
}