"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIChatProps {
  moduleId: string;
  lessonId?: string;
}

export function AIChat({ moduleId, lessonId }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const newMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, newMessage]);
      setInput("");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          userId: userData.user.id,
          moduleId,
          lessonId,
        }),
      });

      const data = await response.json();
      if (data.aiMessage) {
        setMessages((prev) => [...prev, data.aiMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-6 w-6" />
      </Button>

      {/* Chat dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
          <div className="flex items-center gap-2 p-4 border-b bg-[#f97316] text-white">
            <Bot className="h-5 w-5" />
            <h2 className="font-semibold">AI Tutor</h2>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3",
                      msg.role === "user"
                        ? "bg-[#4285f4] text-white text-sm max-w-[85%]"
                        : "bg-white shadow-sm border border-gray-100 max-w-[90%]"
                    )}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h3: ({ children }) => (
                              <h3 className="text-[#f97316] font-semibold text-base border-b border-orange-100 pb-1 mb-2">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-gray-700 text-[14px] leading-relaxed mb-2">
                                {children}
                              </p>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="bg-orange-50 rounded-lg px-4 py-2 my-2 border-l-4 border-orange-200">
                                {children}
                              </blockquote>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 my-2 space-y-1">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-gray-700 text-[14px]">
                                {children}
                              </li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                                {children}
                              </code>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-[#f97316]">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="bg-white shadow-sm border border-gray-100 rounded-lg px-4 py-3 text-sm animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI tutor..."
                className="min-h-[60px] max-h-[120px]"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="shrink-0"
              >
                Send
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
