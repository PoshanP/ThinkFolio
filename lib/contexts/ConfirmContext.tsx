"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
}

// Predefined confirmation presets
export const CONFIRM_PRESETS = {
  deletePaper: {
    title: "Delete Paper",
    message: "This will permanently delete the paper and all associated chats.",
    confirmText: "Delete",
    variant: "danger" as const
  },
  deleteConversation: {
    title: "Delete Conversation",
    message: "This will permanently delete this conversation.",
    confirmText: "Delete",
    variant: "danger" as const
  },
  removeFromNextRead: {
    title: "Remove from Next Read",
    message: "Remove this paper from your reading queue?",
    confirmText: "Remove",
    variant: "danger" as const
  }
};

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDeletePaper: () => Promise<boolean>;
  confirmDeleteConversation: () => Promise<boolean>;
  confirmRemoveFromNextRead: () => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const confirmDeletePaper = useCallback(() => confirm(CONFIRM_PRESETS.deletePaper), [confirm]);
  const confirmDeleteConversation = useCallback(() => confirm(CONFIRM_PRESETS.deleteConversation), [confirm]);
  const confirmRemoveFromNextRead = useCallback(() => confirm(CONFIRM_PRESETS.removeFromNextRead), [confirm]);

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
    setResolvePromise(null);
    setOptions(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
    setResolvePromise(null);
    setOptions(null);
  };

  const getVariantStyles = () => {
    switch (options?.variant) {
      case "danger":
        return {
          icon: "text-red-500",
          button: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "text-yellow-500",
          button: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      default:
        return {
          icon: "text-blue-500",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDeletePaper, confirmDeleteConversation, confirmRemoveFromNextRead }}>
      {children}

      {/* Confirm Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${styles.icon}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {options?.title || "Confirm"}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300">
                {options?.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {options?.cancelText || "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.button}`}
              >
                {options?.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
