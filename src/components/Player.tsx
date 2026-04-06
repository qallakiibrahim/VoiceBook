import React from "react";
import { motion } from "motion/react";
import { 
  Music, FileText, Play, Pause, SkipBack, SkipForward, 
  Clock, Zap, Bookmark 
} from "lucide-react";
import { Book } from "../types";
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
  activeWordRef
}) => {
  return (
    <motion.div 
      key="player"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-5xl mx-auto w-full pt-8"
    >
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className={cn(
          "w-72 h-96 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br shrink-0",
          activeBook.coverColor
        )}>
          {activeBook.type === "audio" ? <Music className="w-20 h-20 mb-6 opacity-40" /> : <FileText className="w-20 h-20 mb-6 opacity-40" />}
          <h2 className="text-2xl font-bold leading-tight">{activeBook.title}</h2>
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
              <button className="hover:text-white transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative h-2 bg-white/10 rounded-full group cursor-pointer overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-spotify-green group-hover:bg-spotify-green/80 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>0:00</span>
                <span>{activeBook.type === "audio" ? "42:15" : `Kapitel ${currentChapter + 1}`}</span>
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
                  const text = getChapters(activeBook.content || "")[currentChapter] || "";
                  if (!text) return "Ingen text kunde extraheras från detta dokument.";
                  
                  let nextSpace = text.indexOf(' ', currentCharIndex);
                  if (nextSpace === -1) nextSpace = text.length;
                  
                  const before = text.substring(0, currentCharIndex);
                  const current = text.substring(currentCharIndex, nextSpace);
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
