import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const ollamaRes = await fetch(
      "http://localhost:11434/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3", // Change to your preferred model if needed
          messages: body.messages,
          stream: false,
        }),
      }
    );

    if (!ollamaRes.ok) {
      throw new Error("Ollama server error");
    }

    const data = await ollamaRes.json();
    const aiMessage = data.choices?.[0]?.message;
    return NextResponse.json({ aiMessage });
  } catch (err) {
    return NextResponse.json({
      aiMessage: {
        role: "ai",
        content: "Error contacting Ollama AI service.",
      },
    });
  }
}
