"use client";

import { useState, useRef, useEffect } from "react";
import { Bookmark } from "lucide-react";

interface HighlightableTextProps {
  text: string;
  messageId: string;
  paperId?: string;
  onSave: (text: string, pageNo?: number) => void;
  className?: string;
}

export function HighlightableText({
  text,
  messageId,
  paperId,
  onSave,
  className = "",
}: HighlightableTextProps) {
  const [showButton, setShowButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        textRef.current &&
        !textRef.current.contains(event.target as Node)
      ) {
        setShowButton(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowButton(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 3) {
      setShowButton(false);
      return;
    }

    // Get the range of the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate position for the button (above the selection)
    const buttonTop = rect.top + window.scrollY - 45;
    const buttonLeft = rect.left + window.scrollX + rect.width / 2 - 60;

    setSelectedText(text);
    setButtonPosition({ top: buttonTop, left: buttonLeft });
    setShowButton(true);
  };

  const handleSaveHighlight = () => {
    if (selectedText) {
      onSave(selectedText);
      setShowButton(false);

      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <>
      <div
        ref={textRef}
        onMouseUp={handleTextSelection}
        className={className}
      >
        {text}
      </div>

      {showButton && (
        <button
          ref={buttonRef}
          onClick={handleSaveHighlight}
          style={{
            position: "absolute",
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            zIndex: 1000,
          }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
        >
          <Bookmark className="h-4 w-4" />
          Save Quote
        </button>
      )}
    </>
  );
}
