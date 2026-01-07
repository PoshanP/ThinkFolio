"use client";

import {
  Folder,
  FileText,
  GraduationCap,
  Briefcase,
  BarChart3,
  Code,
  Calculator,
  Bookmark,
  Lightbulb,
  Star,
  Heart,
  Tag,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  folder: Folder,
  document: FileText,
  academic: GraduationCap,
  briefcase: Briefcase,
  chart: BarChart3,
  code: Code,
  calculator: Calculator,
  bookmark: Bookmark,
  lightbulb: Lightbulb,
  star: Star,
  heart: Heart,
  tag: Tag,
};

interface CollectionIconProps {
  icon: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CollectionIcon({
  icon,
  color = "#6366f1",
  size = "md",
  className = "",
}: CollectionIconProps) {
  const IconComponent = iconMap[icon] || Folder;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <IconComponent
      className={`${sizeClasses[size]} ${className}`}
      style={{ color }}
    />
  );
}

// Export icon map for IconPicker
export { iconMap };
