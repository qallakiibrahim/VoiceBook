import { useState, useEffect } from "react";
import { Book } from "../types";
import { COVER_COLORS } from "../constants";
import { extractTextFromPDF, extractTextFromEPUB } from "../lib/extraction";

export const useLibrary = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load books from localStorage on mount
  useEffect(() => {
    const savedBooks = localStorage.getItem("voicebook_library");
    if (savedBooks) {
      try {
        const parsed = JSON.parse(savedBooks);
        setBooks(parsed);
      } catch (e) {
        console.error("Failed to load library", e);
      }
    }
  }, []);

  // Save books to localStorage when they change
  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem("voicebook_library", JSON.stringify(books));
    }
  }, [books]);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      setIsExtracting(true);
      const isAudio = file.type.startsWith("audio/") || file.name.endsWith(".m4b");
      const isPDF = file.type === "application/pdf";
      const isEPUB = file.name.endsWith(".epub");
      
      const url = URL.createObjectURL(file);
      let content = "";

      try {
        if (isPDF) content = await extractTextFromPDF(url);
        if (isEPUB) content = await extractTextFromEPUB(url);
        if (file.type === "text/plain") content = await file.text();

        const newBook: Book = {
          id: Math.random().toString(36).substr(2, 9),
          title: file.name.replace(/\.[^/.]+$/, ""),
          author: "Okänd författare",
          type: isAudio ? "audio" : "document",
          format: file.name.split(".").pop()?.toUpperCase() || "FIL",
          url: url,
          coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
          progress: 0,
          content: content,
          lastPosition: 0
        };

        setBooks(prev => [newBook, ...prev]);
      } catch (err) {
        console.error("Error processing file:", err);
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const removeBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const updateBookProgress = (id: string, progress: number, lastPosition?: number) => {
    setBooks(prev => prev.map(b => 
      b.id === id ? { ...b, progress, lastPosition: lastPosition ?? b.lastPosition } : b
    ));
  };

  const addBookmark = (bookId: string, label: string, position: number) => {
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        const newBookmark = {
          id: Math.random().toString(36).substr(2, 9),
          label,
          position,
          timestamp: Date.now()
        };
        return { ...b, bookmarks: [...(b.bookmarks || []), newBookmark] };
      }
      return b;
    }));
  };

  const removeBookmark = (bookId: string, bookmarkId: string) => {
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return { ...b, bookmarks: (b.bookmarks || []).filter(bm => bm.id !== bookmarkId) };
      }
      return b;
    }));
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    books,
    filteredBooks,
    isExtracting,
    searchQuery,
    setSearchQuery,
    handleFileUpload,
    removeBook,
    updateBookProgress,
    addBookmark,
    removeBookmark
  };
};
