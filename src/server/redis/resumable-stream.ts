import { createResumableStreamContext, type ResumableStreamContext } from "resumable-stream/ioredis";
import {after} from 'next/server'; 

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext ()  {
  if(!globalStreamContext) {
    try{
        globalStreamContext = createResumableStreamContext({
            keyPrefix: 'resumable-stream:',
            waitUntil: after
        })
    } catch (error) {
        console.error('Error creating resumable stream context:', error);
        throw error;
    }
    return globalStreamContext;
  }

  return globalStreamContext;
}