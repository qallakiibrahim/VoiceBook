import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

// Types & Constants
import { Book, ViewType } from "./types";
import { getChapters } from "./lib/extraction";

// Hooks
import { useLibrary } from "./hooks/useLibrary";
import { useTTS } from "./hooks/useTTS";

// Components
import { Sidebar } from "./components/Sidebar";
import { Library } from "./components/Library";
import { Player } from "./components/Player";
import { DragOverlay } from "./components/DragOverlay";

export default function App() {
  const [view, setView] = useState<ViewType>("library");
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    filteredBooks,
    isExtracting,
    searchQuery,
    setSearchQuery,
    handleFileUpload,
    removeBook,
    updateBookProgress,
    addBookmark,
    removeBookmark
  } = useLibrary();

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
    setActiveBook(book);
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

  return (
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
            <button 
              onClick={() => setView("library")}
              className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {isExtracting && (
              <div className="flex items-center gap-2 text-xs font-bold text-spotify-green animate-pulse">
                <div className="w-2 h-2 bg-spotify-green rounded-full" />
                EXTRAHERAR TEXT...
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">
              IQ
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-32">
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
  );
}
