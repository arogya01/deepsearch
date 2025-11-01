import { createResumableStreamContext, type ResumableStreamContext } from "resumable-stream/ioredis";
import {after} from 'next/server'; 
import { getRedisClient } from './index';

let globalStreamContext: ResumableStreamContext | null = null;

export async function getStreamContext(): Promise<ResumableStreamContext> {
  if(!globalStreamContext) {
    try{
        const redisClient = getRedisClient();
        
        // Ensure main client is connected
        if (redisClient.status !== 'ready') {
          await redisClient.connect();
        }
        
        // Create and connect duplicate clients
        const publisherClient = redisClient.duplicate();
        const subscriberClient = redisClient.duplicate();
        
        await Promise.all([
          publisherClient.connect(),
          subscriberClient.connect()
        ]);
        
        console.log('Redis clients for resumable streams connected');
        
        // Note: Stream TTL is 24 hours (hardcoded in resumable-stream package)
        // Streams will be automatically removed from Redis after this time
        // This prevents Redis memory buildup from abandoned streams
        globalStreamContext = createResumableStreamContext({
            publisher: publisherClient,
            subscriber: subscriberClient,
            keyPrefix: 'resumable-stream:',
            waitUntil: after
        });
    } catch (error) {
        console.error('Error creating resumable stream context:', error);
        throw error;
    }
  }

  return globalStreamContext;
}