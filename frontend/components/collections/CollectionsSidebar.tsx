"use client";

import { useState } from "react";
import { Plus, FileText, Loader2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { CollectionIcon } from "./CollectionIcon";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { EditCollectionModal } from "./EditCollectionModal";
import { useCollections } from "@/lib/hooks/useCollections";
import { CollectionWithCount } from "@/lib/types/database";

interface CollectionsSidebarProps {
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  totalPaperCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function CollectionsSidebar({
  selectedCollectionId,
  onSelectCollection,
  totalPaperCount = 0,
  isCollapsed = false,
  onToggleCollapse,
}: CollectionsSidebarProps) {
  const { data: collections, isLoading, refresh } = useCollections();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null);

  const handleCollectionCreated = () => {
    refresh();
  };

  const handleCollectionUpdated = () => {
    refresh();
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <>
        <div className="w-14 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
          {/* Expand button */}
          <button
            onClick={onToggleCollapse}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-800"
            title="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5 mx-auto" />
          </button>

          {/* All Papers */}
          <button
            onClick={() => onSelectCollection(null)}
            className={`p-3 transition-colors ${
              selectedCollectionId === null
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="All Papers"
          >
            <FileText className="h-5 w-5 mx-auto" />
          </button>

          {/* Collection icons */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
            {collections?.map((collection) => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection(collection.id)}
                className={`w-full p-3 transition-colors ${
                  selectedCollectionId === collection.id
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={`${collection.name} (${collection.paper_count})`}
              >
                <div className="flex justify-center">
                  <CollectionIcon icon={collection.icon} color={collection.color} size="md" />
                </div>
              </button>
            ))}
          </div>

          {/* Add collection button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-3 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-t border-gray-200 dark:border-gray-800"
            title="Create collection"
          >
            <Plus className="h-5 w-5 mx-auto" />
          </button>
        </div>

        {/* Modals */}
        <CreateCollectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCollectionCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Collections</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Create collection"
            >
              <Plus className="h-4 w-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* All Papers */}
        <div className="p-3">
          <button
            onClick={() => onSelectCollection(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              selectedCollectionId === null
                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">All Papers</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedCollectionId === null
                ? "bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}>
              {totalPaperCount}
            </span>
          </button>
        </div>

        {/* Divider with label */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Your Collections</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
          </div>
        </div>

        {/* Collections list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : collections && collections.length > 0 ? (
            collections.map((collection) => (
              <div key={collection.id} className="group relative">
                <button
                  onClick={() => onSelectCollection(collection.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    selectedCollectionId === collection.id
                      ? "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CollectionIcon
                      icon={collection.icon}
                      color={collection.color}
                      size="sm"
                    />
                    <span className={`text-sm truncate ${
                      selectedCollectionId === collection.id
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {collection.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCollectionId === collection.id
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {collection.paper_count}
                    </span>
                    {!collection.is_system && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCollection(collection);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Edit collection"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <Plus className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                No collections yet
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Create your first collection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCollectionCreated}
      />

      <EditCollectionModal
        isOpen={!!editingCollection}
        collection={editingCollection}
        onClose={() => setEditingCollection(null)}
        onSuccess={handleCollectionUpdated}
      />
    </>
  );
}
