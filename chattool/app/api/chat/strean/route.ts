import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { transform } from "next/dist/build/swc/generated-native";
import { NextResponse } from "next/server";

export async function  POST(req: Request) {
    try {
        const { userId } = await auth();
        if(!userId) {
            return new Response("Unauthorized", {status: 401});
        }
        const body = await req.json() as ChatRequestBody;
        const { messages, newMessage, chatId } = body;  

        const convex = getConvexClient();

        const stream = new TransformStream({}, { highWaterMark: 1024 });
        const writer = stream.writable.getWriter(); //send messages through the stream
        

        const response = new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no",  
            },
        });

        const startStream = async () => {
            try {  
                //stream will be implemented here
                await sendSSEMessage(writer, {type:StreamMessagesType.Connected});

            } catch (error) { 
                console.error("Error in chat API", error);
                return NextResponse.json(
            { error: "failed to porcess the chat request" } as const, 
            { status: 500 }
                );
            }
        };
        startStream();
        return response;

    } catch (error) {
        console.error("Error in chat API", error);
        return NextResponse.json(
            { error: "failed to porcess the chat request" } as const, 
            { status: 500 }
        );

    }
}