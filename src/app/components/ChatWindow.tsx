import { useChat } from "@ai-sdk/react";



export const ChatWindow = () => {
    const { messages, input, handleInputChange, handleSubmit } = useChat({
        api: "/api/chat",
        initialMessages: [
            {
                role: "user",
                content: "Hello, world!",
            },
        ],
    });

    console.log('messages',messages);

    return (
        <div className="w-full h-full">
            <p>Chat Window</p>
        </div>
    )
}