
import * as pdfjsLib from 'pdfjs-dist';

// Handle potential ESM default export wrapping to fix "undefined" error
const pdf = (pdfjsLib as any).default || pdfjsLib;

// Set worker source for pdf.js to allow it to parse in the browser
if (pdf.GlobalWorkerOptions) {
    pdf.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use the resolved 'pdf' object which contains getDocument
    const loadingTask = pdf.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to read PDF file. Please ensure it is a valid PDF.");
  }
};
