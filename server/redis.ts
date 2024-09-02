import { Redis } from "ioredis"
import { createAdapter } from "@socket.io/redis-adapter"

export async function setupRedis() {
	const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379")
	const subClient = pubClient.duplicate()	

    // Attach error handlers
    const handleError = (type: string) => (error: Error) => {
        console.error(`Redis ${type} client error:`, error);
        // Implement your error handling logic; possibly reconnect or alert
    };
 
    pubClient.on('error', handleError('Publisher'));
    subClient.on('error', handleError('Subscriber'));
	
	return {
		socketIoAdapter: createAdapter(pubClient, subClient),
	}
}