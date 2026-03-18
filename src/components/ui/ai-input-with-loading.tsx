"use client";

import { CornerRightUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  loadingDuration?: number;
  thinkingDuration?: number;
  onSubmit?: (value: string) => void | Promise<void>;
  className?: string;
  autoAnimate?: boolean;
}

export function AIInputWithLoading({
  id = "ai-input-with-loading",
  placeholder = "Ask me anything!",
  minHeight = 56,
  maxHeight = 200,
  loadingDuration = 3000,
  thinkingDuration = 1000,
  onSubmit,
  className,
  autoAnimate = false,
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(autoAnimate);
  const [isAnimating] = useState(autoAnimate);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const runAnimation = () => {
      if (!isAnimating) return;
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, thinkingDuration);
      }, loadingDuration);
    };

    if (isAnimating) {
      runAnimation();
    }

    return () => clearTimeout(timeoutId);
  }, [isAnimating, loadingDuration, thinkingDuration]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || submitted) return;

    setSubmitted(true);
    await onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);

    setTimeout(() => {
      setSubmitted(false);
    }, loadingDuration);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative mx-auto flex w-full max-w-xl flex-col items-start gap-2">
        <div className="relative mx-auto w-full max-w-xl">
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-[22px] pl-6 pr-11 py-4",
              "border border-[var(--border-color)] bg-[var(--input-bg)]",
              "placeholder:text-[var(--text-muted)] text-[var(--text-primary)]",
              "resize-none leading-[1.2] shadow-[0_8px_32px_var(--shadow-color)]",
              "backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
            )}
            style={{ minHeight, maxHeight }}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            disabled={submitted}
          />
          <button
            onClick={() => {
              void handleSubmit();
            }}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5",
              "transition-all duration-200",
              submitted
                ? "bg-transparent"
                : "bg-white hover:bg-white/90"
            )}
            type="button"
            disabled={submitted}
            aria-label="Submit message"
          >
            {submitted ? (
              <div
                className="h-4 w-4 rounded-sm bg-[var(--text-primary)] animate-spin transition duration-700"
                style={{ animationDuration: "3s" }}
              />
            ) : (
              <CornerRightUp
                className={cn(
                  "h-4 w-4 text-slate-900 transition-opacity",
                  inputValue ? "opacity-100" : "opacity-60"
                )}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
