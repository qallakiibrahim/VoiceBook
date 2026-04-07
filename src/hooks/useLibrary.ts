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
  storage,
  auth
} from "../firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const useLibrary = (user: User | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number, fileName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "audio" | "document">("all");
  const [error, setError] = useState<string | null>(null);

  // Load books from Firestore when user changes
  useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }

    const path = `users/${user.uid}/books`;
    const booksRef = collection(db, "users", user.uid, "books");
    const q = query(booksRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData: Book[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Book;
        booksData.push({ ...data, id: doc.id });
      });
      setBooks(booksData);
      setError(null);
    }, (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Kunde inte hämta biblioteket: ${msg}`);
      console.error("Error fetching books:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!user) {
      setError("Du måste vara inloggad för att ladda upp böcker.");
      return;
    }
    const fileList = Array.from(files);
    setError(null);
    setUploadProgress({ current: 0, total: fileList.length, fileName: "" });
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress({ current: i + 1, total: fileList.length, fileName: file.name });
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

        // Check Firestore document size limit (approx 1MB)
        // We'll use a safe limit of 800KB for the text content to leave room for metadata
        const contentSize = new TextEncoder().encode(content).length;
        if (contentSize > 800 * 1024) {
          throw new Error(`Filen "${file.name}" är för stor för att sparas i databasen (max ~800KB text). Prova en mindre fil.`);
        }

        let downloadUrl = "";
        let storagePath = "";

        // 2. Upload file to Firebase Storage ONLY for audio
        // Documents are saved directly to Firestore as text to avoid CORS/Upgrade issues
        if (isAudio) {
          const bookId = Math.random().toString(36).substr(2, 9);
          const storageRef = ref(storage, `users/${user.uid}/books/${bookId}_${file.name}`);
          
          console.log("Uploading audio to storage:", storageRef.fullPath);
          try {
            const uploadResult = await uploadBytes(storageRef, file);
            downloadUrl = await getDownloadURL(uploadResult.ref);
            storagePath = storageRef.fullPath;
          } catch (storageErr: any) {
            console.error("Storage upload failed:", storageErr);
            if (storageErr.code === 'storage/unauthorized' || storageErr.message.includes('CORS')) {
              throw new Error("Firebase Storage är inte konfigurerat. Gå till Firebase Console och aktivera Storage för att ladda upp ljudfiler.");
            }
            throw storageErr;
          }
        } else {
          // For documents, we use the blobUrl for the current session if needed,
          // but we don't persist it to Firestore since it's temporary.
          // The reader will use the 'content' field.
          downloadUrl = null as any; 
          storagePath = null as any;
        }

        // 3. Save metadata to Firestore
        const bookId = Math.random().toString(36).substr(2, 9);
        const newBook: any = {
          id: bookId,
          userId: user.uid,
          title: file.name.replace(/\.[^/.]+$/, ""),
          author: "Okänd författare",
          type: isAudio ? "audio" : "document",
          format: file.name.split(".").pop()?.toUpperCase() || "FIL",
          url: downloadUrl,
          storagePath: storagePath,
          coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
          progress: 0,
          content: content,
          lastPosition: 0,
          createdAt: new Date().toISOString(),
          bookmarks: []
        };

        await setDoc(doc(db, "users", user.uid, "books", bookId), newBook);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Ett fel uppstod vid uppladdning: ${msg}`);
        console.error("Error processing file:", err);
      } finally {
        setIsExtracting(false);
      }
    }
    setUploadProgress(null);
  };

  const removeBook = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/books/${id}`;
    try {
      const book = books.find(b => b.id === id);
      if (book?.storagePath) {
        const storageRef = ref(storage, book.storagePath);
        await deleteObject(storageRef).catch(e => console.warn("File not found in storage", e));
      }
      await deleteDoc(doc(db, "users", user.uid, "books", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const updateBookProgress = async (id: string, progress: number, lastPosition?: number) => {
    if (!user) return;
    const path = `users/${user.uid}/books/${id}`;
    try {
      const bookRef = doc(db, "users", user.uid, "books", id);
      await updateDoc(bookRef, {
        progress,
        lastPosition: lastPosition ?? 0
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const addBookmark = async (bookId: string, label: string, position: number) => {
    if (!user) return;
    const path = `users/${user.uid}/books/${bookId}`;
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
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const removeBookmark = async (bookId: string, bookmarkId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/books/${bookId}`;
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const bookRef = doc(db, "users", user.uid, "books", bookId);
      await updateDoc(bookRef, {
        bookmarks: (book.bookmarks || []).filter(bm => bm.id !== bookmarkId)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || b.type === filter;
    return matchesSearch && matchesFilter;
  });

  return {
    books,
    filteredBooks,
    isExtracting,
    uploadProgress,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    handleFileUpload,
    removeBook,
    updateBookProgress,
    addBookmark,
    removeBookmark,
    error
  };
};
