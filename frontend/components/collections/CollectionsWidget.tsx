"use client";

import { useState } from "react";
import { Plus, Loader2, ChevronRight } from "lucide-react";
import { CollectionIcon } from "./CollectionIcon";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { useCollections } from "@/lib/hooks/useCollections";
import Link from "next/link";
import { STYLE_CLASSES } from "@/lib/constants/ui";

export function CollectionsWidget() {
  const { data: collections, isLoading, refresh } = useCollections();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCollectionCreated = () => {
    refresh();
  };

  // Show top 5 collections by paper count
  const topCollections = [...(collections || [])]
    .sort((a, b) => b.paper_count - a.paper_count)
    .slice(0, 5);

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Collections
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`p-1.5 text-gray-500 dark:text-gray-400 ${STYLE_CLASSES.hoverTextPrimary} hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
              title="Create collection"
            >
              <Plus className="h-4 w-4" />
            </button>
            <Link
              href="/papers"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="View all collections"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : topCollections.length > 0 ? (
          <div className="space-y-2">
            {topCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/papers?collection=${collection.id}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CollectionIcon
                    icon={collection.icon}
                    color={collection.color}
                    size="sm"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                    {collection.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {collection.paper_count}
                </span>
              </Link>
            ))}

            {(collections?.length || 0) > 5 && (
              <Link
                href="/papers"
                className={`block text-center text-xs ${STYLE_CLASSES.textThemePrimary} hover:underline pt-2`}
              >
                View all {collections?.length} collections
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No collections yet
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`text-sm ${STYLE_CLASSES.textThemePrimary} hover:underline`}
            >
              Create your first collection
            </button>
          </div>
        )}
      </div>

      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCollectionCreated}
      />
    </>
  );
}
