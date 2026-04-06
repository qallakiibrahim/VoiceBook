import React from "react";
import { motion } from "motion/react";
import { Search, Plus, BookOpen } from "lucide-react";
import { BookCard } from "./BookCard";
import { Book } from "../types";
import { cn } from "@/src/lib/utils";

interface LibraryProps {
  filteredBooks: Book[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  onFileUpload: (e: React.DragEvent) => void;
  onOpenBook: (book: Book) => void;
  onRemoveBook: (e: React.MouseEvent, id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({
  filteredBooks,
  searchQuery,
  setSearchQuery,
  isDragging,
  setIsDragging,
  onFileUpload,
  onOpenBook,
  onRemoveBook
}) => {
  return (
    <motion.div 
      key="library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-6">Ditt Bibliotek</h2>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Sök bland dina böcker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-spotify-green transition-all"
            />
          </div>
        </div>
        
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
      </div>

      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Biblioteket är tomt</h3>
          <p className="text-gray-400 max-w-xs">Ladda upp din första ljudbok eller PDF för att börja lyssna.</p>
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
