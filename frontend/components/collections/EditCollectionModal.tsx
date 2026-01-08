"use client";

import { useState, useEffect, FormEvent } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { BaseModal, ModalButton } from "./BaseModal";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { updateCollection, deleteCollection } from "@/lib/api/collections";
import { CollectionWithCount } from "@/lib/types/database";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useConfirm } from "@/lib/contexts/ConfirmContext";

interface EditCollectionModalProps {
  isOpen: boolean;
  collection: CollectionWithCount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCollectionModal({
  isOpen,
  collection,
  onClose,
  onSuccess,
}: EditCollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { error: showError, success: showSuccess } = useAlert();
  const { confirm } = useConfirm();

  // Reset form when collection changes
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
      setColor(collection.color);
      setIcon(collection.icon);
    }
  }, [collection]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!collection) return;

    if (!name.trim()) {
      showError("Collection name is required");
      return;
    }

    setSaving(true);
    try {
      await updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon,
      });

      showSuccess("Collection updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update collection";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    const confirmed = await confirm({
      title: "Delete Collection",
      message: `Are you sure you want to delete "${collection.name}"? This will not delete the papers in this collection.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteCollection(collection.id);
      showSuccess("Collection deleted successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete collection";
      showError(message);
    } finally {
      setDeleting(false);
    }
  };

  if (!collection) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Collection"
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-between w-full">
          <ModalButton
            onClick={handleDelete}
            disabled={deleting || saving}
            variant="danger"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>{deleting ? "Deleting..." : "Delete"}</span>
          </ModalButton>

          <div className="flex items-center gap-3">
            <ModalButton onClick={onClose} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton
              disabled={saving || deleting || !name.trim()}
              variant="primary"
              type="submit"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Saving..." : "Save"}</span>
            </ModalButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="edit-collection-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-collection-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Collection name"
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="edit-collection-description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="edit-collection-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Optional description..."
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Color
          </label>
          <ColorPicker selectedColor={color} onColorChange={setColor} />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Icon
          </label>
          <IconPicker
            selectedIcon={icon}
            selectedColor={color}
            onIconChange={setIcon}
          />
        </div>

        {/* Paper count info */}
        {collection.paper_count > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            This collection contains {collection.paper_count} paper{collection.paper_count !== 1 ? "s" : ""}.
            Deleting the collection will not delete the papers.
          </p>
        )}
      </div>
    </BaseModal>
  );
}
