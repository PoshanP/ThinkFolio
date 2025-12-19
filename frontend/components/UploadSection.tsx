"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, X, Loader2, Plus, AlertCircle, AlertTriangle } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useStats } from "@/lib/contexts/StatsContext";
import { useData } from "@/lib/contexts/DataContext";

export function UploadSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string>("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [openImmediately, setOpenImmediately] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = useSupabase();
  const { error: showError, warning: showWarning, success: showSuccess } = useAlert();
  const { refreshStats } = useStats();
  const { papers, refreshPapers, refreshRecentReads } = useData();

  const MAX_PAPERS = 6;
  const paperCount = papers?.length || 0;
  const isLimitReached = paperCount >= MAX_PAPERS;

  // Validate URL when it changes
  useEffect(() => {
    if (!pdfUrl.trim()) {
      setUrlError("");
      setIsValidUrl(false);
      return;
    }

    try {
      const url = new URL(pdfUrl);
      // Check if URL ends with .pdf or contains pdf in path
      const isPdfUrl = pdfUrl.toLowerCase().endsWith('.pdf') ||
                       url.pathname.toLowerCase().includes('.pdf') ||
                       url.pathname.toLowerCase().includes('/pdf');

      if (isPdfUrl) {
        setUrlError("");
        setIsValidUrl(true);
      } else {
        setUrlError("URL should point to a PDF file");
        setIsValidUrl(false);
      }
    } catch {
      setUrlError("Please enter a valid URL");
      setIsValidUrl(false);
    }
  }, [pdfUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showWarning("File size exceeds 5MB limit. Please select a smaller PDF file.");
        return;
      }
      setSelectedFile(file);
      const nameWithoutExtension = file.name.replace('.pdf', '');
      setDocumentName(nameWithoutExtension);
      // Clear URL when file is selected
      setPdfUrl("");
      setUrlError("");
      setIsValidUrl(false);
    }
  };

  const handleSubmit = async (file?: File) => {
    setIsProcessing(true);
    setProcessingStatus("Uploading PDF...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      let fileToProcess: File;
      let paperTitle: string;
      let source: string;

      if (file || selectedFile) {
        fileToProcess = (file || selectedFile)!;
        paperTitle = documentName || fileToProcess.name.replace('.pdf', '');
        source = 'file upload';
      } else {
        throw new Error('No file provided');
      }

      const estimatedPageCount = await getPageCount(fileToProcess);

      // Create paper record with pending status
      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: paperTitle,
          source: source,
          page_count: estimatedPageCount,
          is_next_read: !openImmediately,
          processing_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Upload file to storage
      setProcessingStatus("Saving file...");
      try {
        const storagePath = `${user.id}/${paper.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('papers')
          .upload(storagePath, fileToProcess, {
            cacheControl: '3600',
            contentType: 'application/pdf',
            upsert: true,
          });

        if (!uploadError) {
          await supabase
            .from('papers')
            .update({ storage_path: storagePath })
            .eq('id', paper.id);
        }
      } catch (storageErr) {
        console.warn('Storage upload error:', storageErr);
      }

      // Start background processing (fire and forget)
      const formData = new FormData();
      formData.append('file', fileToProcess);
      formData.append('paper_id', paper.id);
      formData.append('user_id', user.id);

      fetch('/api/rag/process', {
        method: 'POST',
        body: formData,
      }).catch(err => console.error('Background processing error:', err));

      // Refresh data
      refreshStats();
      refreshPapers();

      if (!openImmediately) {
        showSuccess(`"${paperTitle}" saved to Next Read`);
        resetForm();
        return;
      }

      // Create chat session and redirect immediately
      setProcessingStatus("Opening chat...");

      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          paper_id: paper.id,
          user_id: user.id,
          title: paperTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Refresh recent reads (new chat session created)
      refreshRecentReads();

      // Redirect to chat - processing will continue in background
      router.push(`/chat-new?session=${session.id}&paper=${paper.id}`);

    } catch (error: any) {
      showError(`Failed to upload document: ${error?.message || 'Unknown error'}`);
      resetForm();
    }
  };

  const getPageCount = async (file: File): Promise<number> => {
    const sizeInKB = file.size / 1024;
    let estimatedPages;
    if (sizeInKB < 100) {
      estimatedPages = Math.max(1, Math.round(sizeInKB / 50));
    } else if (sizeInKB < 500) {
      estimatedPages = Math.round(sizeInKB / 75);
    } else {
      estimatedPages = Math.round(sizeInKB / 100);
    }
    return Math.max(1, estimatedPages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showWarning("File size exceeds 5MB limit.");
        return;
      }
      setSelectedFile(file);
      const nameWithoutExtension = file.name.replace('.pdf', '');
      setDocumentName(nameWithoutExtension);
      setPdfUrl("");
      setUrlError("");
      setIsValidUrl(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUrlSubmit = async () => {
    if (!pdfUrl || !documentName.trim() || !isValidUrl) return;

    setIsProcessing(true);
    setProcessingStatus("Saving paper...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Create paper record with pending status
      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: documentName,
          source: pdfUrl,
          page_count: 1,
          is_next_read: !openImmediately,
          processing_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Start background processing (fire and forget)
      fetch('/api/papers/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pdfUrl,
          title: documentName,
          userId: user.id,
          paperId: paper.id,
        }),
      }).catch(err => console.error('Background URL processing error:', err));

      // Refresh data
      refreshStats();
      refreshPapers();

      if (!openImmediately) {
        showSuccess(`"${documentName}" saved to Next Read`);
        resetForm();
        return;
      }

      // Create chat session and redirect immediately
      setProcessingStatus("Opening chat...");

      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          paper_id: paper.id,
          user_id: user.id,
          title: documentName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Refresh recent reads (new chat session created)
      refreshRecentReads();

      // Redirect to chat - processing will continue in background
      router.push(`/chat-new?session=${session.id}&paper=${paper.id}`);

    } catch (error: any) {
      showError(`Failed to upload document: ${error?.message || 'Unknown error'}`);
      resetForm();
    }
  };

  const resetForm = () => {
    setIsProcessing(false);
    setProcessingStatus("");
    setSelectedFile(null);
    setDocumentName("");
    setPdfUrl("");
    setUrlError("");
    setIsValidUrl(false);
  };

  // Check if we have valid input (either file or valid URL)
  const hasValidInput = selectedFile || isValidUrl;
  const canSubmit = hasValidInput && documentName.trim();

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Document
        </h3>

        {isLimitReached ? (
          <div className="border-2 border-dashed border-yellow-300 dark:border-yellow-600 rounded-lg p-8 text-center bg-yellow-50 dark:bg-yellow-900/20">
            <div className="space-y-3">
              <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mx-auto" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Maximum limit reached
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You have reached the maximum of {MAX_PAPERS} documents. Please delete some documents to upload new ones.
              </p>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mx-auto animate-spin" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {processingStatus || "Processing..."}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This may take a few moments...
              </p>
            </div>
          </div>
        ) : selectedFile ? (
          /* File selected view */
          <div className="space-y-4">
            <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-900/20">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setDocumentName("");
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Read Now / Next Read Selector */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenImmediately(true)}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  openImmediately
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Read Now
              </button>
              <button
                type="button"
                onClick={() => setOpenImmediately(false)}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  !openImmediately
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Next Read
              </button>
            </div>

            <button
              onClick={() => handleSubmit(selectedFile)}
              disabled={!documentName.trim()}
              className={`w-full text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed ${
                openImmediately
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {openImmediately ? 'Upload & Read' : 'Save to Next Read'}
            </button>
          </div>
        ) : (
          /* Default upload view */
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drop PDF here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Max 5MB
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400">or paste URL</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* URL input */}
            <div>
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  urlError
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                    : isValidUrl
                      ? 'border-green-300 dark:border-green-600 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                }`}
              />
              {urlError && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <p className="text-xs text-red-500">{urlError}</p>
                </div>
              )}
            </div>

            {/* Show options when valid URL is entered */}
            {isValidUrl && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Enter document name..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Read Now / Next Read Selector */}
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenImmediately(true)}
                    className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                      openImmediately
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Read Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenImmediately(false)}
                    className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                      !openImmediately
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Next Read
                  </button>
                </div>

                <button
                  onClick={handleUrlSubmit}
                  disabled={!documentName.trim()}
                  className={`w-full text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed ${
                    openImmediately
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {openImmediately ? 'Upload & Read' : 'Save to Next Read'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
