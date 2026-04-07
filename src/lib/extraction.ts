import * as pdfjsLib from 'pdfjs-dist';
import ePub from 'epubjs';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const extractTextFromPDF = async (url: string): Promise<string> => {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 500); i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n\n";
  }
  return fullText;
};

export const extractTextFromEPUB = async (url: string): Promise<string> => {
  const book = ePub(url);
  await book.ready;
  let fullText = "";
  // @ts-ignore - epubjs types can be tricky
  const spine = book.spine;
  const spineLength = (spine as any).length || 0;
  for (let i = 0; i < Math.min(spineLength, 100); i++) {
    const item = (spine as any).get(i);
    const doc = await item.load(book.load.bind(book));
    // @ts-ignore
    fullText += doc.textContent + "\n\n";
  }
  return fullText;
};

export const getChapters = (content: string) => {
  if (!content) return [];
  
  // First try splitting by double newline (paragraphs/pages)
  let chapters = content.split("\n\n").filter(c => c.trim().length > 0);
  
  // If we only got one huge chapter, try splitting by single newline
  if (chapters.length === 1 && chapters[0].length > 5000) {
    chapters = content.split("\n").filter(c => c.trim().length > 0);
  }
  
  // Final safety: if any chapter is still too long for TTS (limit is usually ~32k, we use 4k for better UX)
  const finalChapters: string[] = [];
  for (const chapter of chapters) {
    if (chapter.length > 4000) {
      // Split by sentences or just chunks
      const chunks = chapter.match(/.{1,4000}(\s|$)/g) || [chapter];
      finalChapters.push(...chunks.map(c => c.trim()));
    } else {
      finalChapters.push(chapter);
    }
  }
  
  return finalChapters;
};
