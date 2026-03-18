import { useState } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";

export function AIInputWithLoadingDemo() {
  const [messages, setMessages] = useState<string[]>([]);

  const simulateResponse = async (message: string) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="min-w-[350px] space-y-8">
      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="rounded-lg bg-black/5 p-4 dark:bg-white/5">
            {msg}
          </div>
        ))}
        <AIInputWithLoading
          onSubmit={simulateResponse}
          loadingDuration={3000}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}
