import React, { useState, useRef, useEffect, Component } from "react";
import { ChevronLeft, LogOut, LogIn, Music } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/src/lib/utils";

// Types & Constants
import { Book, ViewType } from "./types";
import { getChapters } from "./lib/extraction";

// Hooks
import { useLibrary } from "./hooks/useLibrary";
import { useTTS } from "./hooks/useTTS";

// Firebase
import { auth, loginWithGoogle, logout, User, db, doc, setDoc, getDoc } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Components
import { Sidebar } from "./components/Sidebar";
import { Library } from "./components/Library";
import { Player } from "./components/Player";
import { DragOverlay } from "./components/DragOverlay";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-dark-bg flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Ett fel uppstod</h1>
          <pre className="bg-black/40 p-4 rounded text-xs text-red-400 max-w-full overflow-auto mb-4">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-spotify-green text-black rounded-full font-bold"
          >
            Ladda om sidan
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [view, setView] = useState<ViewType>("library");
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists in Firestore
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString(),
              role: 'user'
            });
          }
        } catch (err) {
          console.error("Error ensuring user document:", err);
        }
      }
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const {
    books,
    filteredBooks,
    isExtracting,
    searchQuery,
    setSearchQuery,
    handleFileUpload,
    removeBook,
    updateBookProgress,
    addBookmark,
    removeBookmark,
    error: libraryError
  } = useLibrary(user);

  // Derive activeBook from books array to keep it in sync
  const activeBook = books.find(b => b.id === activeBookId) || null;

  const {
    playbackRate,
    currentChapter,
    setCurrentChapter,
    currentCharIndex,
    textContainerRef,
    activeWordRef,
    cyclePlaybackRate
  } = useTTS(activeBook, isPlaying, setIsPlaying);

  // Sleep timer logic
  useEffect(() => {
    if (sleepTimer !== null && isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (isPlaying) setIsPlaying(false);
        setSleepTimer(null);
      }, sleepTimer * 60 * 1000);
    } else if (!isPlaying && timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sleepTimer, isPlaying]);

  // Media Session API for lock screen controls
  useEffect(() => {
    if ('mediaSession' in navigator && activeBook) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeBook.title,
        artist: activeBook.author,
        album: "VoiceBook",
        artwork: [
          { src: 'https://picsum.photos/seed/book/512/512', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', skipBackward);
      navigator.mediaSession.setActionHandler('nexttrack', skipForward);
      navigator.mediaSession.setActionHandler('seekbackward', skipBackward);
      navigator.mediaSession.setActionHandler('seekforward', skipForward);
    }
  }, [activeBook, isPlaying]); // Re-sync when book or play state changes

  const togglePlay = () => {
    if (!activeBook) return;

    if (activeBook.type === "audio") {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && activeBook?.type === "audio") {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const p = (current / duration) * 100;
      setProgress(p);
      updateBookProgress(activeBook.id, p, current);
    }
  };

  const openBook = (book: Book) => {
    if (isPlaying) {
      audioRef.current?.pause();
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setActiveBookId(book.id);
    setView("player");
    setProgress(book.progress);
    setCurrentChapter(0);
  };

  const skipForward = () => {
    if (activeBook?.type === "audio" && audioRef.current) {
      audioRef.current.currentTime += 15;
    } else if (activeBook?.type === "document") {
      const chapters = getChapters(activeBook.content || "");
      if (currentChapter < chapters.length - 1) {
        setCurrentChapter(prev => prev + 1);
      }
    }
  };

  const skipBackward = () => {
    if (activeBook?.type === "audio" && audioRef.current) {
      audioRef.current.currentTime -= 15;
    } else if (activeBook?.type === "document") {
      if (currentChapter > 0) {
        setCurrentChapter(prev => prev - 1);
      }
    }
  };

  const jumpToPosition = (position: number) => {
    if (activeBook?.type === "audio" && audioRef.current) {
      audioRef.current.currentTime = position;
    } else if (activeBook?.type === "document") {
      setCurrentChapter(position);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-dark-bg flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className="w-24 h-24 bg-spotify-green rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(30,215,96,0.3)]">
            <Music className="w-12 h-12 text-black" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-4">VoiceBook</h1>
            <p className="text-gray-400 text-lg">Ditt personliga bibliotek, synkroniserat över alla dina enheter.</p>
          </div>
          <button 
            onClick={loginWithGoogle}
            className="w-full py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-xl"
          >
            <LogIn className="w-6 h-6" />
            Logga in med Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className="flex h-screen bg-dark-bg text-white overflow-hidden font-sans relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        handleFileUpload(e.dataTransfer.files);
        setIsDragging(false);
      }}
    >
      <DragOverlay isDragging={isDragging} />

      <Sidebar 
        view={view} 
        setView={setView} 
        onAddBooks={() => fileInputRef.current?.click()} 
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-white/5 to-dark-bg">
        <header className="h-16 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {view === "player" && (
              <button 
                onClick={() => setView("library")}
                className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {isExtracting && (
              <div className="flex items-center gap-2 text-xs font-bold text-spotify-green animate-pulse">
                <div className="w-2 h-2 bg-spotify-green rounded-full" />
                EXTRAHERAR TEXT...
              </div>
            )}
            <div className="flex items-center gap-3 bg-black/40 p-1.5 pr-4 rounded-full border border-white/5">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt={user.displayName || ""} 
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold truncate max-w-[100px]">{user.displayName}</span>
              <button 
                onClick={logout}
                className="p-1 hover:text-red-500 transition-colors"
                title="Logga ut"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-32">
          {libraryError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
              <span>{libraryError}</span>
              <button onClick={() => window.location.reload()} className="underline font-bold">Försök igen</button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {view === "library" ? (
              <Library 
                filteredBooks={filteredBooks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                onFileUpload={(e) => handleFileUpload(e.dataTransfer.files)}
                onOpenBook={openBook}
                onRemoveBook={(e, id) => removeBook(id)}
              />
            ) : activeBook && (
              <Player 
                activeBook={activeBook}
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                progress={progress}
                currentChapter={currentChapter}
                currentCharIndex={currentCharIndex}
                playbackRate={playbackRate}
                cyclePlaybackRate={cyclePlaybackRate}
                sleepTimer={sleepTimer}
                setSleepTimer={setSleepTimer}
                skipForward={skipForward}
                skipBackward={skipBackward}
                textContainerRef={textContainerRef}
                activeWordRef={activeWordRef}
                addBookmark={addBookmark}
                removeBookmark={removeBookmark}
                onJumpToPosition={jumpToPosition}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef}
          src={activeBook?.type === "audio" ? activeBook.url : undefined}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)} 
          className="hidden" 
          multiple 
          accept=".mp3,.m4b,.pdf,.epub,.txt"
        />
      </main>
    </div>
    </ErrorBoundary>
  );
}
