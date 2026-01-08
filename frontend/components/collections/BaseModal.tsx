"use client";

import { useEffect, useCallback, ReactNode, FormEvent } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  // Form support
  onSubmit?: (e: FormEvent) => void;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  maxWidth = "md",
  onSubmit,
}: BaseModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const Wrapper = onSubmit ? "form" : "div";
  const wrapperProps = onSubmit ? { onSubmit } : {};

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <Wrapper
        {...wrapperProps}
        className={`relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {titleIcon}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </Wrapper>
    </div>
  );
}

// Reusable button components for modal actions
interface ModalButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}

export function ModalButton({
  onClick,
  disabled,
  children,
  variant = "secondary",
  type = "button",
}: ModalButtonProps) {
  const variantClasses = {
    primary:
      "text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed",
    secondary:
      "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600",
    danger:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}
