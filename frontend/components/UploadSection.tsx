"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Link2, FileText, Loader2, Plus, CheckCircle, AlertCircle } from "lucide-react";

interface UploadSectionProps {
  onUploadSuccess?: () => void;
}

export function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [recentUploads, setRecentUploads] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  const fetchRecentUploads = async () => {
    try {
      const response = await fetch('/api/papers');
      if (response.ok) {
        const data = await response.json();
        const recent = (data.data || []).slice(0, 3).map((paper: any) => paper.title);
        setRecentUploads(recent);
      }
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setTitle(file.name.replace('.pdf', ''));
      setUploadStatus('idle');
      setErrorMessage("");
    } else if (file) {
      setErrorMessage("Please select a PDF file");
      setUploadStatus('error');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage("Please enter a title for your paper");
      setUploadStatus('error');
      return;
    }

    if (uploadType === 'file' && !selectedFile) {
      setErrorMessage("Please select a file");
      setUploadStatus('error');
      return;
    }

    if (uploadType === 'url' && !url.trim()) {
      setErrorMessage("Please enter a URL");
      setUploadStatus('error');
      return;
    }

    setIsProcessing(true);
    setUploadStatus('idle');
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('source', uploadType);

      if (uploadType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (uploadType === 'url') {
        formData.append('url', url.trim());
      }

      const response = await fetch('/api/papers/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setSelectedFile(null);
        setUrl("");
        setTitle("");

        // Refresh recent uploads and call parent callback
        await fetchRecentUploads();
        onUploadSuccess?.();

        // Reset success status after 3 seconds
        setTimeout(() => setUploadStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setTitle(file.name.replace('.pdf', ''));
      setUploadStatus('idle');
      setErrorMessage("");
    } else if (file) {
      setErrorMessage("Please drop a PDF file");
      setUploadStatus('error');
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

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter paper title..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>

        {/* Upload Type Toggle */}
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

        {/* Upload Area */}
        {uploadType === "file" ? (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-all cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              } ${
                uploadStatus === 'success' ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""
              } ${
                uploadStatus === 'error' ? "border-red-500 bg-red-50 dark:bg-red-900/10" : ""
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
                    Processing...
                  </p>
                </div>
              ) : uploadStatus === 'success' ? (
                <div className="space-y-3">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Upload Successful!
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
            {selectedFile && uploadStatus !== 'success' && (
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !title.trim()}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isProcessing ? "Processing..." : "Upload"}
              </button>
            )}
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
                if (e.key === "Enter" && url && title.trim()) {
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!url || !title.trim() || isProcessing}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Uploaded!</span>
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

        {/* Error Message */}
        {uploadStatus === 'error' && errorMessage && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Recent Uploads */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Recent Uploads
        </h4>
        <div className="space-y-2">
          {recentUploads.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No uploads yet
            </p>
          ) : (
            recentUploads.map((title, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <FileText className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 truncate">{title}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}