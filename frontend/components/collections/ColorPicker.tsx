"use client";

import { Check } from "lucide-react";
import { COLLECTION_COLORS } from "@/lib/constants";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {COLLECTION_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onColorChange(color.value)}
          className={`
            relative w-10 h-10 rounded-lg transition-all
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800
            ${selectedColor === color.value
              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110"
              : "hover:scale-105"
            }
          `}
          style={{
            backgroundColor: color.value,
            boxShadow: selectedColor === color.value ? `0 0 0 2px ${color.value}` : undefined,
          }}
          title={color.name}
          aria-label={`Select ${color.name} color`}
          aria-pressed={selectedColor === color.value}
        >
          {selectedColor === color.value && (
            <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
          )}
        </button>
      ))}
    </div>
  );
}
