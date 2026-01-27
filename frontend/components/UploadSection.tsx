"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { FileText, X, Loader2, Plus, AlertCircle, AlertTriangle, File, Table, Book, Code, Presentation } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useStats } from "@/lib/contexts/StatsContext";
import { useData } from "@/lib/contexts/DataContext";
import { useCollections, invalidateCollectionCaches } from "@/lib/hooks/useCollections";
import { NEXT_READ_COLLECTION_NAME, STYLE_CLASSES } from "@/lib/constants";

// Supported file types and their configurations
const SUPPORTED_FORMATS = {
  'application/pdf': { ext: '.pdf', label: 'PDF', icon: FileText, maxSize: 50 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', label: 'Word', icon: FileText, maxSize: 50 },
  'text/plain': { ext: '.txt', label: 'Text', icon: File, maxSize: 10 },
  'application/rtf': { ext: '.rtf', label: 'RTF', icon: FileText, maxSize: 20 },
  'text/rtf': { ext: '.rtf', label: 'RTF', icon: FileText, maxSize: 20 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: '.pptx', label: 'PowerPoint', icon: Presentation, maxSize: 100 },
  'text/csv': { ext: '.csv', label: 'CSV', icon: Table, maxSize: 50 },
  'application/csv': { ext: '.csv', label: 'CSV', icon: Table, maxSize: 50 },
  'application/epub+zip': { ext: '.epub', label: 'EPUB', icon: Book, maxSize: 50 },
  'text/html': { ext: '.html', label: 'HTML', icon: Code, maxSize: 10 },
  'application/xhtml+xml': { ext: '.html', label: 'HTML', icon: Code, maxSize: 10 },
} as const;

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.rtf,.pptx,.csv,.epub,.html,.htm';
const ACCEPTED_MIME_TYPES = Object.keys(SUPPORTED_FORMATS);

// Map MIME types to file_type values for database
const MIME_TO_FILE_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/csv': 'csv',
  'application/csv': 'csv',
  'application/epub+zip': 'epub',
  'text/html': 'html',
  'application/xhtml+xml': 'html',
};

function getFileInfo(file: File) {
  const format = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
  if (format) return format;

  // Fallback: check by extension
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const byExt = Object.values(SUPPORTED_FORMATS).find(f => f.ext === ext);
  return byExt || { ext: ext || '', label: 'Document', icon: File, maxSize: 50 };
}

function getFileType(file: File): string {
  if (MIME_TO_FILE_TYPE[file.type]) return MIME_TO_FILE_TYPE[file.type];

  // Fallback: check by extension
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const extToType: Record<string, string> = {
    '.pdf': 'pdf', '.docx': 'docx', '.txt': 'txt', '.rtf': 'rtf',
    '.pptx': 'pptx', '.csv': 'csv', '.epub': 'epub', '.html': 'html', '.htm': 'html'
  };
  return ext ? extToType[ext] || 'pdf' : 'pdf';
}

function isSupported(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? ACCEPTED_EXTENSIONS.includes(ext) : false;
}

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
  const { data: collections, refresh: refreshCollections } = useCollections();

  // Get the Next Read collection
  const nextReadCollection = useMemo(() =>
    collections?.find(c => c.name === NEXT_READ_COLLECTION_NAME),
    [collections]
  );

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
      // Check for supported file extensions in URL
      const supportedExtensions = ['.pdf', '.docx', '.txt', '.rtf', '.pptx', '.csv', '.epub', '.html', '.htm'];
      const hasValidExtension = supportedExtensions.some(ext =>
        pdfUrl.toLowerCase().endsWith(ext) || url.pathname.toLowerCase().includes(ext)
      );

      if (hasValidExtension) {
        setUrlError("");
        setIsValidUrl(true);
      } else {
        setUrlError("URL should point to a supported document (PDF, DOCX, TXT, etc.)");
        setIsValidUrl(false);
      }
    } catch {
      setUrlError("Please enter a valid URL");
      setIsValidUrl(false);
    }
  }, [pdfUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupported(file)) {
      showWarning("Unsupported file type. Please upload PDF, DOCX, TXT, RTF, PPTX, CSV, EPUB, or HTML files.");
      return;
    }

    const fileInfo = getFileInfo(file);
    const maxSize = fileInfo.maxSize * 1024 * 1024;

    if (file.size > maxSize) {
      showWarning(`File size exceeds ${fileInfo.maxSize}MB limit for ${fileInfo.label} files.`);
      return;
    }

    setSelectedFile(file);
    // Remove extension from filename for display
    const nameWithoutExtension = file.name.replace(/\.[^.]+$/, '');
    setDocumentName(nameWithoutExtension);
    // Clear URL when file is selected
    setPdfUrl("");
    setUrlError("");
    setIsValidUrl(false);
  };

  const handleSubmit = async (file?: File) => {
    setIsProcessing(true);
    setProcessingStatus("Uploading document...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      let fileToProcess: File;
      let paperTitle: string;

      if (file || selectedFile) {
        fileToProcess = (file || selectedFile)!;
        paperTitle = documentName || fileToProcess.name.replace(/\.[^.]+$/, '');
      } else {
        throw new Error('No file provided');
      }

      const fileInfo = getFileInfo(fileToProcess);
      const fileType = getFileType(fileToProcess);
      const estimatedPageCount = await getPageCount(fileToProcess);

      // Get file extension
      const ext = fileToProcess.name.toLowerCase().match(/\.[^.]+$/)?.[0] || '.pdf';

      // Step 1: Create paper record with pending status FIRST
      setProcessingStatus("Creating record...");
      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: paperTitle,
          source: 'upload',
          page_count: estimatedPageCount,
          file_type: fileType,
          processing_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Step 2: Upload file to Supabase Storage directly (client-side)
      setProcessingStatus(`Uploading ${fileInfo.label}...`);
      const storagePath = `${user.id}/${paper.id}${ext}`;

      // Convert file to Blob with application/octet-stream to bypass MIME restrictions
      const fileBuffer = await fileToProcess.arrayBuffer();
      const uploadBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });

      const { error: uploadError } = await supabase.storage
        .from('papers')
        .upload(storagePath, uploadBlob, {
          cacheControl: '3600',
          contentType: 'application/octet-stream',
          upsert: true,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Update paper status to failed
        await supabase
          .from('papers')
          .update({
            processing_status: 'failed',
            processing_error: uploadError.message
          })
          .eq('id', paper.id);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Step 3: Update paper with storage path
      await supabase
        .from('papers')
        .update({ storage_path: storagePath })
        .eq('id', paper.id);

      // Step 4: Add to Next Read collection if not opening immediately
      if (!openImmediately && nextReadCollection) {
        try {
          await fetch(`/api/collections/${nextReadCollection.id}/papers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ paperIds: [paper.id] }),
          });
          invalidateCollectionCaches();
          refreshCollections();
        } catch (err) {
          console.warn('Failed to add to Next Read collection:', err);
        }
      }

      // Step 5: Trigger background processing (fire and forget)
      setProcessingStatus("Starting processing...");
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
        showSuccess(`"${paperTitle}" uploaded and saved to Next Read`);
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
    if (!file) return;

    if (!isSupported(file)) {
      showWarning("Unsupported file type. Please upload PDF, DOCX, TXT, RTF, PPTX, CSV, EPUB, or HTML files.");
      return;
    }

    const fileInfo = getFileInfo(file);
    const maxSize = fileInfo.maxSize * 1024 * 1024;

    if (file.size > maxSize) {
      showWarning(`File size exceeds ${fileInfo.maxSize}MB limit for ${fileInfo.label} files.`);
      return;
    }

    setSelectedFile(file);
    const nameWithoutExtension = file.name.replace(/\.[^.]+$/, '');
    setDocumentName(nameWithoutExtension);
    setPdfUrl("");
    setUrlError("");
    setIsValidUrl(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUrlSubmit = async () => {
    if (!pdfUrl || !documentName.trim() || !isValidUrl) return;

    setIsProcessing(true);
    setProcessingStatus("Saving document...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
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
          processing_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Add to Next Read collection if not opening immediately
      if (!openImmediately && nextReadCollection) {
        try {
          await fetch(`/api/collections/${nextReadCollection.id}/papers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ paperIds: [paper.id] }),
          });
          invalidateCollectionCaches();
          refreshCollections();
        } catch (err) {
          console.warn('Failed to add to Next Read collection:', err);
        }
      }

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

  // Get file icon component
  const FileIcon = selectedFile ? getFileInfo(selectedFile).icon : FileText;
  const fileLabel = selectedFile ? getFileInfo(selectedFile).label : 'Document';

  return (
    <div>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
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
              <Loader2 className={`h-10 w-10 ${STYLE_CLASSES.spinnerColor} mx-auto animate-spin`} />
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
            <div className={`${STYLE_CLASSES.fileSelectedBorder} p-4 ${STYLE_CLASSES.fileSelectedBg}`}>
              <div className="flex items-center gap-3">
                <FileText className={`h-8 w-8 ${STYLE_CLASSES.fileIconColor} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {fileLabel} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                className={`w-full px-3 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${STYLE_CLASSES.inputFocusRing} min-h-[44px]`}
              />
            </div>

            {/* Read Now / Next Read Selector */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenImmediately(true)}
                className={`flex-1 py-3 px-3 text-sm font-medium transition-colors min-h-[44px] ${
                  openImmediately
                    ? STYLE_CLASSES.toggleActivePrimary
                    : STYLE_CLASSES.toggleInactive
                }`}
              >
                Read Now
              </button>
              <button
                type="button"
                onClick={() => setOpenImmediately(false)}
                className={`flex-1 py-3 px-3 text-sm font-medium transition-colors min-h-[44px] ${
                  !openImmediately
                    ? STYLE_CLASSES.toggleActiveAccent
                    : STYLE_CLASSES.toggleInactive
                }`}
              >
                Next Read
              </button>
            </div>

            <button
              onClick={() => handleSubmit(selectedFile)}
              disabled={!documentName.trim()}
              className={`w-full text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[48px] ${
                openImmediately
                  ? STYLE_CLASSES.buttonPrimary
                  : STYLE_CLASSES.buttonAccent
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
              className={`${STYLE_CLASSES.dropZone} p-6 text-center cursor-pointer`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="space-y-2">
                <div className={`w-10 h-10 ${STYLE_CLASSES.dropZoneIcon} rounded-full flex items-center justify-center mx-auto`}>
                  <Plus className={`h-5 w-5 ${STYLE_CLASSES.dropZoneIconColor}`} />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drop file here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, DOCX, TXT, RTF, PPTX, CSV, EPUB, HTML
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
                className={`w-full px-3 py-3 text-base border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 min-h-[44px] ${
                  urlError
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                    : isValidUrl
                      ? 'border-green-300 dark:border-green-600 focus:ring-green-500'
                      : `border-gray-300 dark:border-gray-600 ${STYLE_CLASSES.inputFocusRing}`
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
                    className={`w-full px-3 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${STYLE_CLASSES.inputFocusRing} min-h-[44px]`}
                  />
                </div>

                {/* Read Now / Next Read Selector */}
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenImmediately(true)}
                    className={`flex-1 py-3 px-3 text-sm font-medium transition-colors min-h-[44px] ${
                      openImmediately
                        ? STYLE_CLASSES.toggleActivePrimary
                        : STYLE_CLASSES.toggleInactive
                    }`}
                  >
                    Read Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenImmediately(false)}
                    className={`flex-1 py-3 px-3 text-sm font-medium transition-colors min-h-[44px] ${
                      !openImmediately
                        ? STYLE_CLASSES.toggleActiveAccent
                        : STYLE_CLASSES.toggleInactive
                    }`}
                  >
                    Next Read
                  </button>
                </div>

                <button
                  onClick={handleUrlSubmit}
                  disabled={!documentName.trim()}
                  className={`w-full text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[48px] ${
                    openImmediately
                      ? STYLE_CLASSES.buttonPrimary
                      : STYLE_CLASSES.buttonAccent
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
