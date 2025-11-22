import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchTTSBlob } from './textToSpeechService';

export interface Article {
    id: string;
    title: string;
    content: string;
    image?: string;
    url?: string;
}

/**
 * Export article as PDF with optional annotations
 */
export const exportToPDF = async (article: Article, includeImage: boolean = true): Promise<void> => {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        let yPosition = margin;

        // Add title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        const titleLines = pdf.splitTextToSize(article.title, contentWidth);
        pdf.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 10;

        // Add image if available and requested
        if (includeImage && article.image) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = article.image;

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const imgWidth = contentWidth;
                const imgHeight = (img.height / img.width) * imgWidth;

                if (yPosition + imgHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
            } catch (error) {
                console.warn('Failed to include image in PDF:', error);
            }
        }

        // Add content
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const contentLines = pdf.splitTextToSize(article.content, contentWidth);

        for (let i = 0; i < contentLines.length; i++) {
            if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }
            pdf.text(contentLines[i], margin, yPosition);
            yPosition += 7;
        }

        // Add footer with URL if available
        if (article.url) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Source: ${article.url}`, margin, pageHeight - 10);
        }

        // Save PDF
        const filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        pdf.save(filename);
    } catch (error) {
        console.error('PDF Export failed:', error);
        throw new Error('Failed to export PDF');
    }
};

/**
 * Export article audio (TTS)
 */
export const exportToAudio = async (article: Article, voice?: string): Promise<void> => {
    try {
        // Fetch TTS audio blob
        const blob = await fetchTTSBlob(article.content, { voice });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Audio Export failed:', error);
        throw new Error('Failed to export audio');
    }
};

/**
 * Export article as plain text
 */
export const exportToText = (article: Article): void => {
    try {
        let content = `${article.title}\n${'='.repeat(article.title.length)}\n\n${article.content}`;
        if (article.url) {
            content += `\n\nSource: ${article.url}`;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Text Export failed:', error);
        throw new Error('Failed to export text');
    }
};
