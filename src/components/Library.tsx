import React from "react";
import { motion } from "motion/react";
import { BookOpen, Loader2 } from "lucide-react";
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
  const isProcessing = !!uploadProgress || isExtracting;

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
        
        {!isProcessing && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onFileUpload}
            className={cn(
              "hidden md:flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all w-64 h-24 text-center",
              isDragging ? "border-spotify-green bg-spotify-green/5 scale-105" : "border-white/5 hover:border-white/10"
            )}
          >
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dra & Släpp</p>
            <p className="text-[10px] text-gray-600 mt-1">Filer för att lägga till</p>
          </div>
        )}
      </div>

      {filteredBooks.length === 0 && !isProcessing ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Inga böcker hittades</h3>
          <p className="text-gray-400 max-w-xs">Prova att ändra dina filter eller sökord.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Loading Placeholder Card */}
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center aspect-[3/4] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-spotify-green/10 to-transparent animate-pulse" />
              <Loader2 className="w-10 h-10 text-spotify-green animate-spin mb-4 relative z-10" />
              <div className="relative z-10">
                <h3 className="font-bold text-sm mb-1">
                  {isExtracting ? "Bearbetar..." : "Laddar upp..."}
                </h3>
                <p className="text-[10px] text-gray-400 line-clamp-2 px-2">
                  {uploadProgress?.fileName || "Vänligen vänta"}
                </p>
                {uploadProgress && (
                  <div className="mt-4 w-full px-4">
                    <div className="flex justify-between text-[8px] font-bold mb-1 uppercase tracking-tighter">
                      <span className="text-spotify-green">Status</span>
                      <span className="text-gray-500">{uploadProgress.current}/{uploadProgress.total}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-spotify-green"
                        initial={{ width: 0 }}
                        animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

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
