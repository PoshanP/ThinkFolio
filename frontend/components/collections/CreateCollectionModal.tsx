"use client";

import { useState, FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { BaseModal, ModalButton } from "./BaseModal";
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

  const handleSubmit = async (e: FormEvent) => {
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Collection"
      onSubmit={handleSubmit}
      footer={
        <>
          <ModalButton onClick={handleClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton
            disabled={saving || !name.trim()}
            variant="primary"
            type="submit"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>{saving ? "Creating..." : "Create"}</span>
          </ModalButton>
        </>
      }
    >
      <div className="space-y-5">
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
      </div>
    </BaseModal>
  );
}
