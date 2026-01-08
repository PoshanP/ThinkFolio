"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, FolderPlus } from "lucide-react";
import { BaseModal, ModalButton } from "./BaseModal";
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

  const isLoading = collectionsLoading || paperCollectionsLoading;

  if (!paperId) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Collection"
      titleIcon={<FolderPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
      maxWidth="sm"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton
            onClick={handleSave}
            disabled={saving || isLoading}
            variant="primary"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{saving ? "Saving..." : "Save"}</span>
          </ModalButton>
        </>
      }
    >
      {/* Paper title */}
      {paperTitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
          {paperTitle}
        </p>
      )}

      {/* Collections list */}
      <div className="overflow-y-auto max-h-[40vh] -mx-6 px-6">
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
                  type="button"
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
    </BaseModal>
  );
}
