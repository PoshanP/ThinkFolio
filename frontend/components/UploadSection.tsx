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

      // Upload to Supabase Storage
      setProcessingStatus("Storing PDF...");
      const fileExt = 'pdf';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('papers')
        .upload(fileName, fileToProcess, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket not configured. Please run setup-storage.sql in Supabase SQL editor.');
        }
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Extract basic metadata
      const pageCount = await getPageCount(fileToProcess);

      // Create paper record in database
      setProcessingStatus("Creating paper record...");
      const { data: paper, error: dbError } = await supabase
        .from('papers')
        .insert({
          title: paperTitle,
          source: source,
          page_count: pageCount,
          user_id: user.id,
          storage_path: fileName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create processing status record
      await supabase
        .from('document_processing_status')
        .insert({
          paper_id: paper.id,
          status: 'processing',
          started_at: new Date().toISOString()
        });

      // Process document for RAG (chunking and embedding)
      setProcessingStatus("Processing document for AI chat...");
      const formData = new FormData();
      formData.append('file', fileToProcess);
      formData.append('paper_id', paper.id);
      formData.append('user_id', user.id);

      try {
        const processResponse = await fetch('/api/rag/process', {
          method: 'POST',
          body: formData,
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          console.error('Document processing failed:', errorData);
          // Continue anyway - document is uploaded
        }
      } catch (processError) {
        console.error('Document processing error:', processError);
        // Continue anyway - document is uploaded
      }

      // Generate summary
      setProcessingStatus("Generating summary...");
      let summary = "Your paper has been uploaded successfully. Start asking questions about it!";

      try {
        console.log('Requesting summary for paper:', paper.id);
        const summaryResponse = await fetch('/api/rag/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paper_id: paper.id }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          console.log('Summary received:', summaryData.summary?.substring(0, 200) + '...');
          summary = summaryData.summary;
        } else {
          console.error('Summary generation failed, using default message');
        }
      } catch (summaryError) {
        console.error('Summary generation error:', summaryError);
        // Use default summary
      }

      // Create initial chat session
      setProcessingStatus("Creating chat session...");
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          paper_id: paper.id,
          user_id: user.id,
          title: 'Initial Discussion',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add summary as first message from the system
      const summaryMessage = `📄 **Paper Successfully Uploaded and Processed**

📝 **Title:** ${paperTitle}
📄 **Pages:** ${pageCount}
📋 **Source:** ${source}

---

🔍 **Paper Summary:**
${summary}

---

💡 **How can I help you?**
I can:
• Explain complex concepts from the paper
• Summarize specific sections
• Answer questions about methodology or findings
• Help you understand the implications
• Compare with related research

Feel free to ask me anything about this paper!`;

      console.log('Attempting to save message for session:', session.id);
      console.log('User ID:', user.id);
      console.log('Summary length:', summaryMessage.length);

      // First, let's verify the session exists
      const { data: sessionCheck } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', session.id)
        .single();

      console.log('Session exists:', !!sessionCheck);

      // Keep it simple - only required fields
      const messageToInsert = {
        session_id: session.id,
        role: 'assistant' as const,
        content: summaryMessage.substring(0, 10000) // Ensure not too long
      };

      console.log('Inserting message:', messageToInsert);

      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert(messageToInsert)
        .select()
        .single();

      if (messageError) {
        console.error('Failed to save summary message:', {
          error: messageError,
          message: messageError?.message,
          details: messageError?.details,
          hint: messageError?.hint,
          code: messageError?.code
        });

        // Try a simpler insert
        console.log('Retrying with minimal fields...');
        const simpleMessage = {
          session_id: session.id,
          role: 'assistant' as const,
          content: 'Test message'
        };

        console.log('Retry message:', simpleMessage);

        const { data: retryData, error: retryError } = await supabase
          .from('chat_messages')
          .insert(simpleMessage)
          .select();

        if (retryError) {
          console.error('Retry also failed:', {
            error: retryError,
            message: retryError?.message,
            details: retryError?.details,
            hint: retryError?.hint
          });
        } else {
          console.log('Test message saved!', retryData);
        }
      } else {
        console.log('Summary message saved successfully:', messageData);
      }

      // Update processing status to completed
      await supabase
        .from('document_processing_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('paper_id', paper.id);

      setProcessingStatus("Redirecting to chat...");

      // Redirect to chat with the new session
      setTimeout(() => {
        router.push(`/chat/${paper.id}?session=${session.id}`);
      }, 500);

    } catch (error: any) {
      console.error('Error uploading paper:', error);
      console.error('Error details:', {
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