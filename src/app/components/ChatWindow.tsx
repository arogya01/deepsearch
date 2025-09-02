import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export const ChatWindow = () => {
    const [input, setInput] = useState("");
    
    const { messages, sendMessage, status, error } = useChat({
        initialMessages: [
            {
                role: "user",
                content: "Hello, world!",
            },
        ],
    });

    const isLoading = status === "loading";

    return (
        <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-100 p-4 border-b">
                <h2 className="text-lg font-semibold">Chat</h2>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-800"
                            }`}
                        >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="animate-pulse">Thinking...</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                        sendMessage({ role: "user", content: input.trim() });
                        setInput("");
                    }
                }} 
                className="p-4 border-t bg-white"
            >
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};