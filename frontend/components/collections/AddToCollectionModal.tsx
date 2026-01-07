"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, FolderPlus } from "lucide-react";
import { CollectionIcon } from "./CollectionIcon";
import { useCollections, usePaperCollections, invalidateCollectionCaches } from "@/lib/hooks/useCollections";
import { updatePaperCollections } from "@/lib/api/collections";
import { useAlert } from "@/lib/contexts/AlertContext";

interface AddToCollectionModalProps {
  isOpen: boolean;
  paperId: string | null;
  paperTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddToCollectionModal({
  isOpen,
  paperId,
  paperTitle,
  onClose,
  onSuccess,
}: AddToCollectionModalProps) {
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: paperCollections, isLoading: paperCollectionsLoading } = usePaperCollections(paperId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const { error: showError, success: showSuccess } = useAlert();

  // Initialize selected IDs from current paper collections
  useEffect(() => {
    if (paperCollections) {
      setSelectedIds(new Set(paperCollections.map(c => c.id)));
    }
  }, [paperCollections]);

  const handleToggle = (collectionId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!paperId) return;

    setSaving(true);
    try {
      await updatePaperCollections(paperId, Array.from(selectedIds));
      invalidateCollectionCaches();
      showSuccess("Collections updated");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update collections";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const isLoading = collectionsLoading || paperCollectionsLoading;

  if (!isOpen || !paperId) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Add to Collection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Paper title */}
        {paperTitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
            {paperTitle}
          </p>
        )}

        {/* Collections list */}
        <div className="flex-1 overflow-y-auto -mx-5 px-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : collections && collections.length > 0 ? (
            <div className="space-y-1">
              {collections.map((collection) => {
                const isSelected = selectedIds.has(collection.id);
                return (
                  <button
                    key={collection.id}
                    onClick={() => handleToggle(collection.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <CollectionIcon
                      icon={collection.icon}
                      color={collection.color}
                      size="sm"
                    />
                    <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 truncate">
                      {collection.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {collection.paper_count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No collections yet.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Create a collection from the sidebar.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
