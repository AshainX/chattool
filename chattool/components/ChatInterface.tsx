"use client";

import { useEffect, useRef, useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
// import { ChatRequestBody, StreamMessageType } from "@/lib/types";
// import WelcomeMessage from "@/components/WelcomeMessage";
// import { createSSEParser } from "@/lib/SSEParser";
// import { MessageBubble } from "@/components/MessageBubble";
import { ArrowRight } from "lucide-react";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


interface ChatInterfaceProps {
    chatId: Id<"chats">;
    initialMessages: Doc<"messages">[];
  }

export default function ChatInterface({chatId, initialMessages}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Doc<"messages">[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamedResponse, setStreamedResponse] = useState("");
    const [currentTool, setCurrentTool] = useState<{
        name: string;
        input: unknown;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages,streamedResponse]);
        


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent the page from reloading

        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;
        
        
        //reset the state for new message
        setInput("");
        setStreamedResponse("");
        setCurrentTool(null);
        setIsLoading(true);

        //add user message immediately
        const optimisticUserMessage: Doc<"messages"> = {
            _id: `temp_${Date.now()}`,
            chatId,
            content: trimmedInput,
            role: "user",
            createdAt: Date.now(),
        } as Doc<"messages">;

        setMessages((prev) => [...prev, optimisticUserMessage]);
    };


    return <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
        <section className="flex-1">
            <div>
                {/* messgaes */}
                {messages.map((message) => (
                    <div key={message._id}>{message.content}</div>
                ))}


                {/* messgaes */}
                <div ref={messagesEndRef}/>
            </div>
        </section>


        {/* Footer */}
        <footer className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative" >
                <div className="relative flex items-center">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Chat with us"
                className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-gray-50 placeholder:text-gray-500"
                disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
                input.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <ArrowRight />
            </Button>
          </div>
        </form>

    </footer>
    </main>;
}

//export default ChatInterface