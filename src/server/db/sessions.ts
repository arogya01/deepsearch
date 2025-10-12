import {db} from "./index"; 
import {chatSessions} from "./schema";
import {eq, desc, and} from "drizzle-orm"; 

export type ChatMessage = {
    role: "user" | "assis"
}