import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, FileText, Play, Pause, SkipBack, SkipForward, 
  Clock, Zap, Bookmark as BookmarkIcon, Trash2, ChevronRight, ChevronLeft
} from "lucide-react";
import { Book, Bookmark } from "../types";
import { getChapters } from "../lib/extraction";
import { cn } from "@/src/lib/utils";

interface PlayerProps {
  activeBook: Book;
  isPlaying: boolean;
  togglePlay: () => void;
  progress: number;
  currentChapter: number;
  currentCharIndex: number;
  playbackRate: number;
  cyclePlaybackRate: () => void;
  sleepTimer: number | null;
  setSleepTimer: (val: number | null | ((prev: number | null) => number | null)) => void;
  skipForward: () => void;
  skipBackward: () => void;
  textContainerRef: React.RefObject<HTMLDivElement>;
  activeWordRef: React.RefObject<HTMLSpanElement>;
  addBookmark: (bookId: string, label: string, position: number) => void;
  removeBookmark: (bookId: string, bookmarkId: string) => void;
  onJumpToPosition: (position: number) => void;
  onBack: () => void;
}

export const Player: React.FC<PlayerProps> = ({
  activeBook,
  isPlaying,
  togglePlay,
  progress,
  currentChapter,
  currentCharIndex,
  playbackRate,
  cyclePlaybackRate,
  sleepTimer,
  setSleepTimer,
  skipForward,
  skipBackward,
  textContainerRef,
  activeWordRef,
  addBookmark,
  removeBookmark,
  onJumpToPosition,
  onBack
}) => {
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleAddBookmark = () => {
    const position = activeBook.type === "document" ? currentChapter : (activeBook.lastPosition || 0);
    
    // Check for duplicate
    const isDuplicate = activeBook.bookmarks?.some(bm => bm.position === position);
    if (isDuplicate) return;

    const label = activeBook.type === "document" 
      ? `Kapitel ${currentChapter + 1}` 
      : new Date((activeBook.lastPosition || 0) * 1000).toISOString().substr(11, 8);
    
    addBookmark(activeBook.id, label, position);
    
    // Show feedback
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getDocumentProgress = () => {
    if (activeBook.type !== "document" || !activeBook.content) return "0:00";
    const chapters = getChapters(activeBook.content);
    const text = chapters[currentChapter] || "";
    const progress = text.length > 0 ? (currentCharIndex / text.length) * 100 : 0;
    return `${Math.round(progress)}% av kapitel`;
  };

  return (
    <motion.div 
      key="player"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-5xl mx-auto w-full pt-8"
    >
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm">Tillbaka till biblioteket</span>
      </button>

      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="flex flex-col gap-6 shrink-0">
          <div className={cn(
            "w-72 h-96 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br relative overflow-hidden",
            activeBook.coverColor
          )}>
            {activeBook.type === "audio" ? <Music className="w-20 h-20 mb-6 opacity-40" /> : <FileText className="w-20 h-20 mb-6 opacity-40" />}
            <h2 className="text-2xl font-bold leading-tight">{activeBook.title}</h2>
          </div>

          {/* Bookmarks List */}
          <div className="w-72 bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-spotify-green" />
                Bokmärken
              </h3>
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                {activeBook.bookmarks?.length || 0}
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {activeBook.bookmarks && activeBook.bookmarks.length > 0 ? (
                activeBook.bookmarks.map((bm) => (
                  <div 
                    key={bm.id}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onJumpToPosition(bm.position)}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">{bm.label}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(bm.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(activeBook.id, bm.id);
                        }}
                        className="p-1 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-500 text-center py-4">Inga bokmärken än</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-8 w-full">
          <div>
            <div className="text-spotify-green font-bold text-sm tracking-widest uppercase mb-2">Nu spelas</div>
            <h1 className="text-5xl font-black tracking-tighter mb-4">{activeBook.title}</h1>
            <p className="text-gray-400 text-xl font-medium">{activeBook.author}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm font-bold text-gray-400">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSleepTimer(prev => prev === null ? 15 : prev === 60 ? null : prev + 15)}
                  className={cn(
                    "hover:text-white transition-colors flex items-center gap-2",
                    sleepTimer && "text-spotify-green"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {sleepTimer ? `${sleepTimer}m kvar` : "Sömntimer"}
                </button>
                <button 
                  onClick={cyclePlaybackRate}
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {playbackRate}x hastighet
                </button>
              </div>
              <div className="relative">
                <button 
                  onClick={handleAddBookmark}
                  className="hover:text-spotify-green transition-colors p-2 bg-white/5 rounded-full"
                  title="Sätt bokmärke"
                >
                  <BookmarkIcon className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {showSavedFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -40, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-spotify-green text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none"
                    >
                      Bokmärke sparat!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative h-2 bg-white/10 rounded-full group cursor-pointer overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-spotify-green group-hover:bg-spotify-green/80 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>{activeBook.type === "audio" ? formatTime(activeBook.lastPosition || 0) : getDocumentProgress()}</span>
                <span>{activeBook.type === "audio" ? "Ljudbok" : `Kapitel ${currentChapter + 1}`}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={skipBackward}
                className="text-gray-400 hover:text-white transition-all"
              >
                <SkipBack className="w-8 h-8" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform active:scale-95 shadow-xl"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              <button 
                onClick={skipForward}
                className="text-gray-400 hover:text-white transition-all"
              >
                <SkipForward className="w-8 h-8" />
              </button>
            </div>
          </div>

          {activeBook.type === "document" && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col h-64">
              <h3 className="font-bold mb-4 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-spotify-green" />
                  Kapitel {currentChapter + 1}
                </span>
                <span className="text-xs text-gray-500">
                  {getChapters(activeBook.content || "").length} kapitel totalt
                </span>
              </h3>
              <div 
                ref={textContainerRef}
                className="text-gray-300 text-lg leading-relaxed overflow-y-auto custom-scrollbar pr-2 h-full"
              >
                {(() => {
                  const chapters = getChapters(activeBook.content || "");
                  const text = chapters[currentChapter] || "";
                  if (!text || text.trim().length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <FileText className="w-12 h-12 text-gray-600 mb-4" />
                        <p className="text-gray-500">Ingen text kunde hittas i detta kapitel.</p>
                        <p className="text-xs text-gray-600 mt-2">Detta kan bero på att boken laddades upp med en tidigare begränsning eller att PDF:en endast innehåller bilder.</p>
                      </div>
                    );
                  }
                  
                  // Ensure index is within bounds
                  const safeIndex = Math.min(Math.max(0, currentCharIndex), text.length);
                  let nextSpace = text.indexOf(' ', safeIndex);
                  if (nextSpace === -1) nextSpace = text.length;
                  
                  const before = text.substring(0, safeIndex);
                  const current = text.substring(safeIndex, nextSpace);
                  const after = text.substring(nextSpace);
                  
                  return (
                    <div className="relative">
                      <span className="opacity-30 transition-opacity duration-300">{before}</span>
                      <span 
                        ref={activeWordRef}
                        className="bg-spotify-green text-black px-1 rounded transition-all duration-200 font-bold shadow-[0_0_15px_rgba(30,215,96,0.4)] mx-0.5"
                      >
                        {current}
                      </span>
                      <span className="transition-opacity duration-300">{after}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
