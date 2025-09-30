"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2, Plus, CheckCircle, Link2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UploadMode = 'file' | 'url';

export function UploadSection() {
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size exceeds 5MB limit. Please select a smaller PDF file.");
        return;
      }
      setSelectedFile(file);
      // Auto-populate document name from filename (without extension)
      const nameWithoutExtension = file.name.replace('.pdf', '');
      setDocumentName(nameWithoutExtension);
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

      // Save paper to database first
      setProcessingStatus("Saving paper...");

      // Get estimated page count from file size
      const estimatedPageCount = await getPageCount(fileToProcess);

      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: paperTitle,
          source: source,
          page_count: estimatedPageCount, // Will be updated with actual count after processing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Process PDF using the working RAG endpoint
      setProcessingStatus("Processing PDF...");

      const formData = new FormData();
      formData.append('file', fileToProcess);
      formData.append('paper_id', paper.id);
      formData.append('user_id', user.id);

      const processResponse = await fetch('/api/rag/process', {
        method: 'POST',
        body: formData,
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(`Processing failed: ${errorData.error || 'Unknown error'}`);
      }

      const processResult = await processResponse.json();

      // Generate automatic summary
      setProcessingStatus("Generating summary...");

      // Create chat session first
      setProcessingStatus("Creating chat session...");

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

      // Generate automatic summary using the RAG system
      try {
        const summaryResponse = await fetch('/api/rag/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: "Please provide a comprehensive summary of this paper including its main contributions, methodology, and key findings.",
            paperId: paper.id,
            sessionId: session.id,
            userId: user.id,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();

          // Save the summary as the first message
          await supabase
            .from('chat_messages')
            .insert({
              session_id: session.id,
              role: 'assistant',
              content: summaryData.answer,
              user_id: user.id,
              created_at: new Date().toISOString(),
              metadata: {
                citations: summaryData.sources?.map((source: any) => ({
                  page: source.metadata?.page || 0,
                  text: source.content
                })),
                is_system_summary: true
              }
            });
        }
      } catch (summaryError) {
        console.log('Could not generate summary:', summaryError);
        // Continue anyway - user can ask questions manually
      }

      // Redirect to chat with the new session and paper ID for document-specific chat
      setProcessingStatus("Redirecting to chat...");
      setTimeout(() => {
        router.push(`/chat-new?session=${session.id}&paper=${paper.id}`);
      }, 500);

    } catch (error: any) {
      console.error('DEBUG: ERROR occurred during upload process:', error);
      console.error('DEBUG: Error details:', {
        message: error?.message,
        status: error?.status,
        details: error?.details,
        stack: error?.stack
      });
      alert(`Failed to upload document: ${error?.message || 'Unknown error'}`);
      setIsProcessing(false);
      setProcessingStatus("");
      setSelectedFile(null);
      setDocumentName("");
    }
  };

  // Function to estimate page count from PDF file size (will be updated with actual count after processing)
  const getPageCount = async (file: File): Promise<number> => {
    // Better estimation algorithm based on typical PDF characteristics
    const sizeInKB = file.size / 1024;

    // Improved estimation based on PDF file size patterns:
    // - Text-heavy PDFs: ~30-50KB per page
    // - Image-heavy PDFs: ~100-300KB per page
    // - Mixed content: ~75KB per page (average)

    let estimatedPages;
    if (sizeInKB < 100) {
      // Very small file, likely 1-2 pages
      estimatedPages = Math.max(1, Math.round(sizeInKB / 50));
    } else if (sizeInKB < 500) {
      // Small to medium file
      estimatedPages = Math.round(sizeInKB / 75);
    } else {
      // Larger file, likely more images
      estimatedPages = Math.round(sizeInKB / 100);
    }

    return Math.max(1, estimatedPages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size exceeds 5MB limit. Please select a smaller PDF file.");
        return;
      }
      setSelectedFile(file);
      // Auto-populate document name from filename (without extension)
      const nameWithoutExtension = file.name.replace('.pdf', '');
      setDocumentName(nameWithoutExtension);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const validateUrl = async (url: string): Promise<boolean> => {
    if (!url) return false;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = async () => {
    if (!pdfUrl || !documentName.trim()) return;

    setIsProcessing(true);
    setProcessingStatus("Validating URL...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const isValid = await validateUrl(pdfUrl);
      if (!isValid) {
        alert("Please enter a valid URL");
        setIsProcessing(false);
        setProcessingStatus("");
        return;
      }

      // Save paper to database first
      setProcessingStatus("Saving paper...");

      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: documentName,
          source: pdfUrl,
          page_count: 1, // Will be updated after processing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Process PDF using URL upload endpoint
      setProcessingStatus("Downloading and processing PDF...");

      const response = await fetch('/api/papers/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pdfUrl,
          title: documentName,
          userId: user.id,
          paperId: paper.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Delete the paper record if processing fails
        await supabase.from('papers').delete().eq('id', paper.id);
        throw new Error(errorData.error || 'Failed to process URL');
      }

      // Create chat session
      setProcessingStatus("Creating chat session...");

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

      // Generate automatic summary
      try {
        const summaryResponse = await fetch('/api/rag/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: "Please provide a comprehensive summary of this paper including its main contributions, methodology, and key findings.",
            paperId: paper.id,
            sessionId: session.id,
            userId: user.id,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();

          // Save the summary as the first message
          await supabase
            .from('chat_messages')
            .insert({
              session_id: session.id,
              role: 'assistant',
              content: summaryData.answer,
              user_id: user.id,
              created_at: new Date().toISOString(),
              metadata: {
                citations: summaryData.sources?.map((source: any) => ({
                  page: source.metadata?.page || 0,
                  text: source.content
                })),
                is_system_summary: true
              }
            });
        }
      } catch (summaryError) {
        console.log('Could not generate summary:', summaryError);
        // Continue anyway - user can ask questions manually
      }

      // Redirect to chat
      setProcessingStatus("Redirecting to chat...");
      setTimeout(() => {
        router.push(`/chat-new?session=${session.id}&paper=${paper.id}`);
      }, 500);

    } catch (error: any) {
      console.error('URL upload error:', error);
      alert(`Failed to upload document: ${error?.message || 'Unknown error'}`);
      setIsProcessing(false);
      setProcessingStatus("");
      setPdfUrl("");
      setDocumentName("");
    }
  };

  return (
    <div className="sticky top-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Document
        </h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setUploadMode('file');
              setPdfUrl("");
              setDocumentName("");
            }}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              uploadMode === 'file'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            File
          </button>
          <button
            onClick={() => {
              setUploadMode('url');
              setSelectedFile(null);
              setDocumentName("");
            }}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              uploadMode === 'url'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Link2 className="h-4 w-4 inline mr-2" />
            URL
          </button>
        </div>

        {uploadMode === 'file' ? (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-all cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              {isProcessing ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mx-auto animate-spin" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {processingStatus || "Processing..."}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This may take a few moments...
                  </p>
                </div>
              ) : selectedFile ? (
                <div className="space-y-4">
                  <FileText className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate px-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Document Name
                      </label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter document name..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSubmit(selectedFile)}
                        disabled={!documentName.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Upload & Process
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setDocumentName("");
                        }}
                        className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Drop PDF here
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      or click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Max 5MB • PDF only
            </p>
          </div>
        ) : (
          <div>
            {isProcessing ? (
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
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PDF URL
                  </label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    disabled={isProcessing}
                  />
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    disabled={isProcessing}
                  />
                </div>

                <button
                  onClick={handleUrlSubmit}
                  disabled={!pdfUrl.trim() || !documentName.trim() || isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Upload from URL
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Max 10MB • PDF only
            </p>
          </div>
        )}
      </div>

    </div>
  );
}