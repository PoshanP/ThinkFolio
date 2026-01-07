"use client";

import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { createCollection } from "@/lib/api/collections";
import { DEFAULT_COLLECTION_COLOR, DEFAULT_COLLECTION_ICON } from "@/lib/constants";
import { useAlert } from "@/lib/contexts/AlertContext";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLLECTION_COLOR);
  const [icon, setIcon] = useState(DEFAULT_COLLECTION_ICON);
  const [saving, setSaving] = useState(false);
  const { error: showError, success: showSuccess } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError("Collection name is required");
      return;
    }

    setSaving(true);
    try {
      await createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      });

      showSuccess("Collection created successfully");
      onSuccess();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create collection";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setColor(DEFAULT_COLLECTION_COLOR);
    setIcon(DEFAULT_COLLECTION_ICON);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/20"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Collection
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="collection-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Research Papers"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="collection-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="collection-description"
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{saving ? "Creating..." : "Create"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
