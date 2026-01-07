"use client";

import { CollectionWithCount } from "@/lib/types/database";

interface CollectionBadgesProps {
  collections: CollectionWithCount[];
  maxVisible?: number;
  size?: "sm" | "md";
}

export function CollectionBadges({
  collections,
  maxVisible = 2,
  size = "sm",
}: CollectionBadgesProps) {
  if (!collections || collections.length === 0) {
    return null;
  }

  const visibleCollections = collections.slice(0, maxVisible);
  const remainingCount = collections.length - maxVisible;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleCollections.map((collection) => (
        <span
          key={collection.id}
          className={`inline-flex items-center rounded-full font-medium truncate max-w-[80px] ${sizeClasses[size]}`}
          style={{
            backgroundColor: `${collection.color}20`,
            color: collection.color,
          }}
          title={collection.name}
        >
          {collection.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={`inline-flex items-center rounded-full font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 ${sizeClasses[size]}`}
          title={collections.slice(maxVisible).map(c => c.name).join(", ")}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
