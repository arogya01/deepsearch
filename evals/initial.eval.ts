import {evalite} from "evalite";
import {Levenshtein} from "autoevals";

export const initialEval = evalite("My Eval",{
    data: async () => {
        return [
            {input: "hello", expected: "hello world"}
        ]
    }, 
    task: async (input) => {
        return input + " world";
    },
   scorers: [Levenshtein]
})