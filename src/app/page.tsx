"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const API_KEY = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
const API_URL =
  "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

export default function ChatbotPage() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { type: "user" | "bot"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!message.trim()) return;

    setChatHistory((prev) => [...prev, { type: "user", text: message }]);
    setMessage("");
    setLoading(true);

    const fetchAIResponse = async (retryCount = 0) => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: message }),
        });

        const data = await response.json();
        console.log("API Response:", data);

        if (data.error && data.error.includes("loading")) {
          if (retryCount < 5) {
            // Retry up to 5 times
            console.log(
              `Model is loading... Retrying in 10 seconds (${retryCount + 1}/5)`
            );
            setTimeout(() => fetchAIResponse(retryCount + 1), 10000);
            return;
          } else {
            setChatHistory((prev) => [
              ...prev,
              {
                type: "bot",
                text: "The AI model is still loading. Try again later.",
              },
            ]);
            setLoading(false);
            return;
          }
        }

        const aiResponse =
          data?.[0]?.generated_text || "I couldn't process that.";
        setChatHistory((prev) => [...prev, { type: "bot", text: aiResponse }]);
      } catch (error) {
        console.error("API Error:", error);
        setChatHistory((prev) => [
          ...prev,
          { type: "bot", text: "Oops! Something went wrong." },
        ]);
      }

      setLoading(false);
    };

    fetchAIResponse();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 sm:p-4">
      <Card className="w-full h-full sm:w-[80%] sm:max-w-2xl shadow-lg flex flex-col">
        {/* Title at the top */}
        <div className="bg-blue-500 text-white text-center text-2xl font-semibold p-4">
          Hugging Face AI
        </div>

        {/* Chat History (Auto-Scroll) */}
        <CardContent
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-white space-y-3"
        >
          {chatHistory.length === 0 ? (
            <p className="text-center text-gray-500">
              Your messages will appear here...
            </p>
          ) : (
            chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${
                  chat.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-xs ${
                    chat.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {chat.text}
                </div>
              </div>
            ))
          )}

          {/* Show "Thinking..." while AI generates response */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg max-w-xs flex items-center gap-2">
                <span>Thinking...</span>
                <span className="animate-spin">🤔</span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Textarea Input + Send Button */}
        <CardFooter className="bg-gray-100 border-t flex items-center gap-2 p-2 sm:p-4">
          <Textarea
            className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 resize-none h-16"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // Allow sending message with Enter (Shift+Enter for new line)
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading} // Disable input when AI is responding
          />
          <Button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            disabled={loading} // Disable button while AI is thinking
          >
            {loading ? "Thinking..." : "Send"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
