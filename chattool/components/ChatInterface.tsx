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

function ChatInterface({chatId, initialMessages}: ChatInterfaceProps) {
    const {messages, setMessages} = useState<Doc<"messages">[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    return <main>
        <section></section>
        {/* Footer */}
        <footer>

        </footer>
    </main>;
}

export default ChatInterface