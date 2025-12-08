import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const model = async () => {
    const result = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: 'Hello, world!',
    });

    // // Method 1: Use process.stdout.write for raw output
    // console.log('=== Full Result Output ===');
    // process.stdout.write(result.text + '\n');

    // Method 2: Alternative - log with JSON.stringify for inspection
    console.log('\n=== Result Object ===');
    console.log(JSON.stringify(result, null, 2));
};


