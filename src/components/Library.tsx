import React from "react";
import { motion } from "motion/react";
import { Plus, BookOpen } from "lucide-react";
import { BookCard } from "./BookCard";
import { Book } from "../types";
import { cn } from "@/src/lib/utils";

interface LibraryProps {
  filteredBooks: Book[];
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  onFileUpload: (e: React.DragEvent) => void;
  onOpenBook: (book: Book) => void;
  onRemoveBook: (e: React.MouseEvent, id: string) => void;
  uploadProgress: { current: number, total: number, fileName: string } | null;
  isExtracting: boolean;
}

export const Library: React.FC<LibraryProps> = ({
  filteredBooks,
  isDragging,
  setIsDragging,
  onFileUpload,
  onOpenBook,
  onRemoveBook,
  uploadProgress,
  isExtracting
}) => {
  return (
    <motion.div 
      key="library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Ditt Bibliotek</h2>
          <p className="text-gray-400 mt-1">Hantera och lyssna på din samling</p>
        </div>
        
        {uploadProgress || isExtracting ? (
          <div className="flex-1 max-w-md mx-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-spotify-green animate-pulse">
                {isExtracting ? "Extraherar text..." : `Laddar upp: ${uploadProgress?.fileName}`}
              </span>
              {uploadProgress && (
                <span className="text-gray-400">{uploadProgress.current} av {uploadProgress.total}</span>
              )}
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-spotify-green"
                initial={{ width: 0 }}
                animate={{ width: isExtracting ? "100%" : `${(uploadProgress?.current || 0) / (uploadProgress?.total || 1) * 100}%` }}
                transition={isExtracting ? { duration: 2, repeat: Infinity } : {}}
              />
            </div>
          </div>
        ) : (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onFileUpload}
            className={cn(
              "hidden md:flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all w-64 h-32 text-center",
              isDragging ? "border-spotify-green bg-spotify-green/5 scale-105" : "border-white/10 hover:border-white/20"
            )}
          >
            <Plus className={cn("w-6 h-6 mb-2", isDragging ? "text-spotify-green animate-bounce" : "text-gray-500")} />
            <p className="text-xs font-bold text-gray-400">Släpp filer här för att lägga till</p>
          </div>
        )}
      </div>

      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Inga böcker hittades</h3>
          <p className="text-gray-400 max-w-xs">Prova att ändra dina filter eller sökord.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              onOpen={onOpenBook} 
              onRemove={onRemoveBook} 
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
