"use client";

import { Check } from "lucide-react";
import { COLLECTION_ICONS } from "@/lib/constants";
import { CollectionIcon, iconMap } from "./CollectionIcon";

interface IconPickerProps {
  selectedIcon: string;
  selectedColor: string;
  onIconChange: (icon: string) => void;
}

// Icon display names for accessibility
const iconNames: Record<string, string> = {
  folder: "Folder",
  document: "Document",
  academic: "Academic",
  briefcase: "Briefcase",
  chart: "Chart",
  code: "Code",
  calculator: "Calculator",
  bookmark: "Bookmark",
  lightbulb: "Lightbulb",
  star: "Star",
  heart: "Heart",
  tag: "Tag",
};

export function IconPicker({
  selectedIcon,
  selectedColor,
  onIconChange,
}: IconPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {COLLECTION_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onIconChange(icon)}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-lg transition-all
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800
            ${selectedIcon === icon
              ? "bg-gray-100 dark:bg-gray-700 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110"
              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105"
            }
          `}
          style={{
            borderColor: selectedIcon === icon ? selectedColor : undefined,
            borderWidth: selectedIcon === icon ? 2 : undefined,
          }}
          title={iconNames[icon] || icon}
          aria-label={`Select ${iconNames[icon] || icon} icon`}
          aria-pressed={selectedIcon === icon}
        >
          <CollectionIcon
            icon={icon}
            color={selectedIcon === icon ? selectedColor : "#6b7280"}
            size="md"
          />
          {selectedIcon === icon && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedColor }}
            >
              <Check className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
