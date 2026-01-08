"use client";

import { STREAMING_UI } from "@/lib/constants";

interface ThinkingDotsProps {
  /** Optional custom class for the dot color (defaults to indigo-500) */
  dotClassName?: string;
}

/**
 * Animated dots indicating the LLM is processing
 */
export function ThinkingDots({ dotClassName = "bg-indigo-500" }: ThinkingDotsProps) {
  return (
    <div className="flex items-center gap-1">
      {STREAMING_UI.DOT_ANIMATION_DELAYS.map((delay, index) => (
        <div
          key={index}
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotClassName}`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

interface StreamingCursorProps {
  /** Optional custom class for the cursor color (defaults to indigo-500) */
  cursorClassName?: string;
}

/**
 * Blinking cursor shown while tokens are streaming
 */
export function StreamingCursor({ cursorClassName = "bg-indigo-500" }: StreamingCursorProps) {
  return (
    <span
      className={`inline-block w-0.5 h-4 ml-0.5 animate-pulse align-text-bottom ${cursorClassName}`}
    />
  );
}

interface StreamingIndicatorProps {
  /** Whether the LLM is still "thinking" (before first token) */
  isThinking: boolean;
  /** Whether tokens are actively streaming */
  isStreaming: boolean;
}

/**
 * Combined indicator for LLM response states
 */
export function StreamingIndicator({ isThinking, isStreaming }: StreamingIndicatorProps) {
  if (!isThinking && !isStreaming) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-gray-500 dark:text-gray-400 text-sm">
      {isThinking ? (
        <>
          <ThinkingDots />
          <span className="text-xs">{STREAMING_UI.MESSAGES.THINKING}</span>
        </>
      ) : (
        <div className="flex items-center gap-1.5">
          <StreamingCursor />
          <span className="text-xs text-gray-400">{STREAMING_UI.MESSAGES.GENERATING}</span>
        </div>
      )}
    </div>
  );
}
