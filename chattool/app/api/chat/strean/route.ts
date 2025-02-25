// import { api } from "@/convex/_generated/api";
// import { getConvexClient } from "@/lib/convex";
// import {
//   ChatRequestBody,
//   SSE_DATA_PREFIX,
//   SSE_LINE_DELIMITER,
//   StreamMessage,
//   StreamMessageType,
// } from "@/lib/types";
// import { auth } from "@clerk/nextjs/server";
// import { AIMessage, HumanMessage } from "@langchain/core/messages";
// import { transform } from "next/dist/build/swc/generated-native";
// import { NextResponse } from "next/server";
// import { Stream } from "stream";

// function sendSSEMessage(
//   writer: WritableStreamDefaultWriter<Uint8Array>,
//   data: StreamMessage
// ) {
//   const encoder = new TextEncoder();
//   return writer.write(
//     encoder.encode(
//       `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
//     )
//   );
// }
// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return new Response("Unauthorized", { status: 401 });
//     }
//     const body = (await req.json()) as ChatRequestBody;
//     const { messages, newMessage, chatId } = body;

//     const convex = getConvexClient();

//     const stream = new TransformStream({}, { highWaterMark: 1024 });
//     const writer = stream.writable.getWriter(); //send messages through the stream

//     const response = new Response(stream.readable, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         Connection: "keep-alive",
//         "X-Accel-Buffering": "no",
//       },
//     });

//     const startStream = async () => {
//       try {
//         //stream will be implemented here
//         await sendSSEMessage(writer, { type: StreamMessageType.Connected });

//         await convex.mutation(api.messages.send, {
//           chatId,
//           content: newMessage,
//         });

//         //convert the messgae in langchain format
//         const langchainMessages = [
//           ...messages.map((msg) =>
//             msg.role === "user"
//               ? new HumanMessage(msg.content)
//               : new AIMessage(msg.content)
//           ),
//           new HumanMessage(newMessage),
//         ];

//         try {
//           const eventStream = await submitQuestion(langchainMessages, chatId);
//           for await (const event of eventStream) {
//             if (event.event === "on_chat_model_stream") {
//               const token = event.data.chunk;
//               if (token) {
//                 // Access the text property from the AIMessageChunk
//                 const text = token.content.at(0)?.["text"];
//                 if (text) {
//                   await sendSSEMessage(writer, {
//                     type: StreamMessageType.Token,
//                     token: text,
//                   });
//                 }
//               }
//             } else if (event.event === "on_tool_start") {
//                 await sendSSEMessage(writer, {
//                     type: StreamMessageType.ToolStart,
//                     tool: event.name || "unknown",
//                     input: event.data.input,
//                   });
//             } else if (event.event === "on_tool_end") {
//                 const toolMessage = new ToolMessage(event.data.output);

//               await sendSSEMessage(writer, {
//                 type: StreamMessageType.ToolEnd,
//                 tool: toolMessage.lc_kwargs.name || "unknown",
//                 output: event.data.output,
//               });
//             }
//           }
//         } catch (streamError) {
//           console.error("Error in event stream:", streamError);
//           await sendSSEMessage(writer, {
//             type: StreamMessageType.Error,
//             error:
//               streamError instanceof Error
//                 ? streamError.message
//                 : "Stream processing failed",
//           });
//         }
//       } catch (error) {
//         console.error("Error in Stream", error);
//         await sendSSEMessage(writer, {
//           type: StreamMessageType.Error,
//           error: error instanceof Error ? error.message : "Unknown Error",
//         });
//       }finally {
//         try {
//           await writer.close();
//         } catch (closeError) {
//           console.error("Error closing writer:", closeError);
//         }
//     }

//     };
//     startStream();
//     return response;
//   } catch (error) {
//     console.error("Error in chat API", error);
//     return NextResponse.json(
//       { error: "failed to porcess the chat request" } as const,
//       { status: 500 }
//     );
//   }
// }

import { submitQuestion } from "@/lib/langgraph";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { getConvexClient } from "@/lib/convex";
import {
  ChatRequestBody,
  StreamMessage,
  StreamMessageType,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
} from "@/lib/types";

export const runtime = "edge";

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, newMessage, chatId } =
      (await req.json()) as ChatRequestBody;
    const convex = getConvexClient();

    // Create stream with larger queue strategy for better performance
    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        // "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering for nginx which is required for SSE to work properly
      },
    });

    // Handle the streaming response
    (async () => {
      try {
        // Send initial connection established message
        await sendSSEMessage(writer, { type: StreamMessageType.Connected });

        // Send user message to Convex
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        });

        // Convert messages to LangChain format
        const langChainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
        ];

        try {
          // Create the event stream
          const eventStream = await submitQuestion(langChainMessages, chatId);

          // Process the events
          for await (const event of eventStream) {
            // console.log("🔄 Event:", event);

            if (event.event === "on_chat_model_stream") {
              const token = event.data.chunk;
              if (token) {
                // Access the text property from the AIMessageChunk
                const text = token.content.at(0)?.["text"];
                if (text) {
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name || "unknown",
                input: event.data.input,
              });
            } else if (event.event === "on_tool_end") {
              const toolMessage = new ToolMessage(event.data.output);

              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: toolMessage.lc_kwargs.name || "unknown",
                output: event.data.output,
              });
            }
          }

          // Send completion message without storing the response
          await sendSSEMessage(writer, { type: StreamMessageType.Done });
        } catch (streamError) {
          console.error("Error in event stream:", streamError);
          await sendSSEMessage(writer, {
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
      } catch (error) {
        console.error("Error in stream:", error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error("Error closing writer:", closeError);
        }
      }
    })();

    return response;
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" } as const,
      { status: 500 }
    );
  }
}
