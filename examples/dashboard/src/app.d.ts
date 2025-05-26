// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SocketServer } from '$lib/server/socket/SocketServer';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			socketServer?: SocketServer;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			node?: {
				server?: import('http').Server | import('https').Server;
			};
		}
	}
}

export {};
