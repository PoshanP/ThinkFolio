import jsPDF from 'jspdf';

interface ExportMessage {
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
}

interface ExportChatData {
  sessionTitle: string;
  paperTitle?: string;
  sessionDate: string;
  messages: ExportMessage[];
}

/**
 * Sanitizes a filename by removing invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-\s]/gi, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Formats a date string into a readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats citations for display
 */
function formatCitations(citations?: Array<{ page_no: number; score: number }>): string {
  if (!citations || citations.length === 0) return '';

  const pages = [...new Set(citations.map(c => c.page_no))].sort((a, b) => a - b);
  return `[Citations: Pages ${pages.join(', ')}]`;
}

/**
 * Exports chat session as a PDF file
 */
export async function exportChatAsPDF(data: ExportChatData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, fontSize: number, fontStyle: string = 'normal', maxWidth?: number) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    const width = maxWidth || contentWidth;
    const lines = pdf.splitTextToSize(text, width);

    for (let i = 0; i < lines.length; i++) {
      checkNewPage(fontSize * 0.5);
      pdf.text(lines[i], x, yPosition);
      yPosition += fontSize * 0.5;
    }
  };

  // Title
  addWrappedText(data.sessionTitle, margin, 16, 'bold');
  yPosition += 5;

  // Paper title if available
  if (data.paperTitle) {
    pdf.setTextColor(100, 100, 100);
    addWrappedText(`Document: ${data.paperTitle}`, margin, 10, 'italic');
    pdf.setTextColor(0, 0, 0);
    yPosition += 3;
  }

  // Date
  pdf.setTextColor(100, 100, 100);
  addWrappedText(formatDate(data.sessionDate), margin, 10);
  pdf.setTextColor(0, 0, 0);
  yPosition += 10;

  // Messages
  data.messages.forEach((message) => {
    // Add separator line
    checkNewPage(15);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Role label
    const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
    pdf.setTextColor(60, 60, 60);
    addWrappedText(roleLabel, margin, 11, 'bold');
    pdf.setTextColor(0, 0, 0);
    yPosition += 2;

    // Message content
    addWrappedText(message.content, margin, 10, 'normal');
    yPosition += 2;

    // Citations if available
    const citationsText = formatCitations(message.metadata?.citations);
    if (citationsText) {
      pdf.setTextColor(70, 130, 180);
      addWrappedText(citationsText, margin, 9, 'italic');
      pdf.setTextColor(0, 0, 0);
    }

    yPosition += 5;
  });

  // Generate filename and save
  const filename = `${sanitizeFilename(data.sessionTitle)}_${Date.now()}.pdf`;
  pdf.save(filename);
}

/**
 * Exports chat session as a TXT file
 */
export async function exportChatAsTXT(data: ExportChatData): Promise<void> {
  let content = '';

  // Header
  content += '='.repeat(80) + '\n';
  content += data.sessionTitle + '\n';
  content += '='.repeat(80) + '\n\n';

  if (data.paperTitle) {
    content += `Document: ${data.paperTitle}\n`;
  }
  content += `Date: ${formatDate(data.sessionDate)}\n\n`;
  content += '='.repeat(80) + '\n\n';

  // Messages
  data.messages.forEach((message) => {
    const roleLabel = message.role === 'user' ? 'YOU' : 'ASSISTANT';

    content += `${'-'.repeat(80)}\n`;
    content += `${roleLabel}\n`;
    content += `${'-'.repeat(80)}\n`;
    content += `${message.content}\n`;

    const citationsText = formatCitations(message.metadata?.citations);
    if (citationsText) {
      content += `\n${citationsText}\n`;
    }

    content += '\n';
  });

  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(data.sessionTitle)}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
