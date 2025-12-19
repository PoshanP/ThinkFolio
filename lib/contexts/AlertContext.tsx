"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type AlertType = "success" | "error" | "info" | "warning";

interface AlertOptions {
  title?: string;
  type?: AlertType;
  confirmText?: string;
  onConfirm?: () => void;
}

interface AlertState {
  isOpen: boolean;
  message: string;
  title: string;
  type: AlertType;
  confirmText: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  alert: (message: string, options?: AlertOptions) => void;
  success: (message: string, options?: Omit<AlertOptions, "type">) => void;
  error: (message: string, options?: Omit<AlertOptions, "type">) => void;
  warning: (message: string, options?: Omit<AlertOptions, "type">) => void;
  info: (message: string, options?: Omit<AlertOptions, "type">) => void;
  close: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const defaultTitles: Record<AlertType, string> = {
  success: "Success",
  error: "Error",
  info: "Notice",
  warning: "Warning",
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    message: "",
    title: "",
    type: "info",
    confirmText: "OK",
  });

  const showAlert = useCallback((message: string, options: AlertOptions = {}) => {
    const type = options.type || "info";
    setAlertState({
      isOpen: true,
      message,
      title: options.title || defaultTitles[type],
      type,
      confirmText: options.confirmText || "OK",
      onConfirm: options.onConfirm,
    });
  }, []);

  const close = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertState.onConfirm, close]);

  const success = useCallback((message: string, options?: Omit<AlertOptions, "type">) => {
    showAlert(message, { ...options, type: "success" });
  }, [showAlert]);

  const error = useCallback((message: string, options?: Omit<AlertOptions, "type">) => {
    showAlert(message, { ...options, type: "error" });
  }, [showAlert]);

  const warning = useCallback((message: string, options?: Omit<AlertOptions, "type">) => {
    showAlert(message, { ...options, type: "warning" });
  }, [showAlert]);

  const info = useCallback((message: string, options?: Omit<AlertOptions, "type">) => {
    showAlert(message, { ...options, type: "info" });
  }, [showAlert]);

  const getIcon = () => {
    const iconClass = "h-6 w-6";
    switch (alertState.type) {
      case "success":
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case "error":
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getButtonColor = () => {
    switch (alertState.type) {
      case "success":
        return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
      case "error":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <AlertContext.Provider value={{ alert: showAlert, success, error, warning, info, close }}>
      {children}

      {/* Alert Dialog */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {getIcon()}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {alertState.title}
                </h3>
              </div>
              <button
                onClick={close}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {alertState.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={handleConfirm}
                autoFocus
                className={`px-5 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${getButtonColor()}`}
              >
                {alertState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
