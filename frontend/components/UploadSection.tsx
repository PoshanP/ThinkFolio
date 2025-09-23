"use client";

import { useState, useRef } from "react";
import { Upload, Link2, FileText, X, Loader2, Plus, CheckCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function UploadSection() {
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      handleSubmit(file);
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

      if (uploadType === "file" && (file || selectedFile)) {
        fileToProcess = (file || selectedFile)!;
        paperTitle = fileToProcess.name.replace('.pdf', '');
        source = 'file upload';
      } else if (uploadType === "url" && url) {
        // For URL uploads, we'd need to fetch the PDF first
        setProcessingStatus("Fetching PDF from URL...");
        const response = await fetch(url);
        const blob = await response.blob();
        const urlParts = url.split('/');
        paperTitle = urlParts[urlParts.length - 1].replace('.pdf', '') || 'Downloaded Paper';
        fileToProcess = new File([blob], `${paperTitle}.pdf`, { type: 'application/pdf' });
        source = url;
      } else {
        throw new Error('No file or URL provided');
      }

      // Save paper to database first
      setProcessingStatus("Saving paper...");

      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: paperTitle,
          source: source,
          page_count: 1, // Will be updated after processing
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

      // Redirect to chat with the new session
      setProcessingStatus("Redirecting to chat...");
      setTimeout(() => {
        router.push(`/chat-new?session=${session.id}`);
      }, 500);

    } catch (error: any) {
      console.error('DEBUG: ERROR occurred during upload process:', error);
      console.error('DEBUG: Error details:', {
        message: error?.message,
        status: error?.status,
        details: error?.details,
        stack: error?.stack
      });
      alert(`Failed to upload paper: ${error?.message || 'Unknown error'}`);
      setIsProcessing(false);
      setProcessingStatus("");
      setSelectedFile(null);
      setUrl("");
    }
  };

  // Helper function to estimate page count from PDF
  const getPageCount = async (file: File): Promise<number> => {
    // This is a simple estimation based on file size
    // In production, you'd use a PDF library to get actual page count
    const sizeInMB = file.size / (1024 * 1024);
    return Math.max(1, Math.round(sizeInMB * 10)); // Rough estimate: 100KB per page
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      handleSubmit(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="sticky top-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Upload
        </h3>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setUploadType("file")}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploadType === "file"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => setUploadType("url")}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploadType === "url"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Link2 className="h-4 w-4" />
            <span>URL</span>
          </button>
        </div>

        {uploadType === "file" ? (
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
                <div className="space-y-2">
                  <FileText className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate px-2">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
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
              Max 50MB • PDF only
            </p>
          </div>
        ) : (
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arxiv.org/pdf/..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              onKeyPress={(e) => {
                if (e.key === "Enter" && url) {
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!url || isProcessing}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Recent Uploads
        </h4>
        <div className="space-y-2">
          {["Attention Is All...", "BERT: Pre-training...", "GPT-3: Language..."].map((title, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <FileText className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 truncate">{title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}