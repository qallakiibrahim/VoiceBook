import { useState, useEffect } from "react";
import { Book, Bookmark } from "../types";
import { COVER_COLORS } from "../constants";
import { extractTextFromPDF, extractTextFromEPUB } from "../lib/extraction";
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  User,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  storage
} from "../firebase";

export const useLibrary = (user: User | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load books from Firestore when user changes
  useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }

    const booksRef = collection(db, "users", user.uid, "books");
    const q = query(booksRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData: Book[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Book;
        booksData.push({ ...data, id: doc.id });
      });
      setBooks(booksData);
    }, (error) => {
      console.error("Error fetching books:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!user) return;
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      setIsExtracting(true);
      const isAudio = file.type.startsWith("audio/") || file.name.endsWith(".m4b");
      const isPDF = file.type === "application/pdf";
      const isEPUB = file.name.endsWith(".epub");
      
      const blobUrl = URL.createObjectURL(file);
      let content = "";

      try {
        // 1. Extract text content
        if (isPDF) content = await extractTextFromPDF(blobUrl);
        if (isEPUB) content = await extractTextFromEPUB(blobUrl);
        if (file.type === "text/plain") content = await file.text();

        // 2. Upload file to Firebase Storage
        const bookId = Math.random().toString(36).substr(2, 9);
        const storageRef = ref(storage, `users/${user.uid}/books/${bookId}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        // 3. Save metadata to Firestore
        const newBook: any = {
          id: bookId,
          userId: user.uid,
          title: file.name.replace(/\.[^/.]+$/, ""),
          author: "Okänd författare",
          type: isAudio ? "audio" : "document",
          format: file.name.split(".").pop()?.toUpperCase() || "FIL",
          url: downloadUrl, // Use the permanent download URL
          storagePath: storageRef.fullPath, // Store path for deletion
          coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
          progress: 0,
          content: content,
          lastPosition: 0,
          createdAt: new Date().toISOString(),
          bookmarks: []
        };

        await setDoc(doc(db, "users", user.uid, "books", bookId), newBook);
      } catch (err) {
        console.error("Error processing file:", err);
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const removeBook = async (id: string) => {
    if (!user) return;
    try {
      const book = books.find(b => b.id === id);
      if (book?.storagePath) {
        const storageRef = ref(storage, book.storagePath);
        await deleteObject(storageRef).catch(e => console.warn("File not found in storage", e));
      }
      await deleteDoc(doc(db, "users", user.uid, "books", id));
    } catch (err) {
      console.error("Error removing book:", err);
    }
  };

  const updateBookProgress = async (id: string, progress: number, lastPosition?: number) => {
    if (!user) return;
    try {
      const bookRef = doc(db, "users", user.uid, "books", id);
      await updateDoc(bookRef, {
        progress,
        lastPosition: lastPosition ?? 0
      });
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const addBookmark = async (bookId: string, label: string, position: number) => {
    if (!user) return;
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const bookmarkId = Math.random().toString(36).substr(2, 9);
      const newBookmark: Bookmark = {
        id: bookmarkId,
        label,
        position,
        timestamp: Date.now()
      };

      const bookRef = doc(db, "users", user.uid, "books", bookId);
      await updateDoc(bookRef, {
        bookmarks: [...(book.bookmarks || []), newBookmark]
      });
    } catch (err) {
      console.error("Error adding bookmark:", err);
    }
  };

  const removeBookmark = async (bookId: string, bookmarkId: string) => {
    if (!user) return;
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const bookRef = doc(db, "users", user.uid, "books", bookId);
      await updateDoc(bookRef, {
        bookmarks: (book.bookmarks || []).filter(bm => bm.id !== bookmarkId)
      });
    } catch (err) {
      console.error("Error removing bookmark:", err);
    }
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
