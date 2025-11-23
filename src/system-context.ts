import type {Message} from "ai"; 

export class SystemContext{
    // private variables: 
    step: number; 
    queries: string[]; 
    url: string;
    constructor({step,queries, url }: {step: number, queries: string[], url: string}){
        this.step = step;
        this.queries = queries;
        this.url = url;
    }

}