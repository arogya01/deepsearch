import {generateObject} from 'ai'; 
import {google} from "@ai-sdk/google"; 
import { actionSchema } from './output-schema';
import { SystemContext } from './system-context';

export async function getNextAction(ctx:SystemContext){
    const result = await generateObject({
        model:google('gemini-2.5-flash'), 
        schema: actionSchema, 
        prompt: `You are a research Assistant deciding the next action.
        User Question: ${ctx.getQuestion()}
        Current Research State: ${ctx.getContextSummary()}

        Steps Taken: ${ctx.getStep()}/10

        Decide the Next Action: 
        - "Search" if you need more information from the web 
        - "Scrape" if you found relevant URLs to dig deeper into 
        - "Answer" if you have enough information to answer the question

        Return your decision.
        `
    })

    return result.object;
}