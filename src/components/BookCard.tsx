import React from "react";
import { motion } from "motion/react";
import { Music, FileText, X, Zap } from "lucide-react";
import { Book } from "../types";
import { cn } from "@/src/lib/utils";

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
  onRemove: (e: React.MouseEvent, id: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onOpen, onRemove }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={() => onOpen(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpen(book);
        }
      }}
      className="bg-card-bg p-4 rounded-xl hover:bg-hover-bg transition-all text-left group relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-spotify-green"
    >
      <div className={cn(
        "aspect-[3/4] rounded-lg mb-4 shadow-xl flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br relative overflow-hidden",
        book.coverColor
      )}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
        {book.type === "audio" ? <Music className="w-12 h-12 mb-4 opacity-50" /> : <FileText className="w-12 h-12 mb-4 opacity-50" />}
        <div className="font-bold text-sm leading-tight line-clamp-3">{book.title}</div>
        
        {book.summary && (
          <div className="absolute top-2 right-2 bg-spotify-green/20 p-1 rounded-full">
            <Zap className="w-3 h-3 text-spotify-green" />
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="h-1 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60" 
              style={{ width: `${book.progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate mb-0.5">{book.title}</h3>
          <p className="text-[10px] text-gray-400 font-medium truncate mb-0.5">{book.author}</p>
          {book.genre && (
            <p className="text-[10px] text-spotify-green font-bold truncate">{book.genre}</p>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e, book.id);
          }}
          className="p-1.5 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Ta bort från bibliotek"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] font-black px-1.5 py-0.5 bg-white/5 rounded text-gray-400 uppercase tracking-wider">
          {book.format}
        </span>
        {book.progress > 0 && (
          <span className="text-[10px] font-bold text-spotify-green">
            {Math.round(book.progress)}% klar
          </span>
        )}
      </div>
    </motion.div>
  );
};
