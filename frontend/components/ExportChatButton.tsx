"use client";

import { useState } from "react";
import { Download, Loader2, FileText, File } from "lucide-react";
import { exportChatAsPDF, exportChatAsTXT } from "@/lib/utils/export-chat";
import { useAlert } from "@/lib/contexts/AlertContext";

interface ExportChatButtonProps {
  sessionId: string;
  sessionTitle: string;
  paperTitle?: string;
  sessionDate: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
    metadata?: {
      citations?: Array<{
        page_no: number;
        score: number;
      }>;
    };
  }>;
}

export function ExportChatButton({
  sessionId,
  sessionTitle,
  paperTitle,
  sessionDate,
  messages
}: ExportChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { error: showError } = useAlert();

  const handleExport = async (format: 'pdf' | 'txt') => {
    if (messages.length === 0) return;

    setIsExporting(true);
    setIsOpen(false);

    try {
      const exportData = {
        sessionTitle,
        paperTitle,
        sessionDate,
        messages
      };

      if (format === 'pdf') {
        await exportChatAsPDF(exportData);
      } else {
        await exportChatAsTXT(exportData);
      }
    } catch (error) {
      console.error('Error exporting chat:', error);
      showError('Failed to export chat. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isEmpty || isExporting}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isEmpty ? "No messages to export" : "Export chat"}
      >
        {isExporting ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Download className="h-5 w-5 text-white" />
        )}
      </button>

      {isOpen && !isEmpty && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <File className="h-4 w-4" />
                Export as TXT
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
