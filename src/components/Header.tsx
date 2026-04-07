import React from "react";
import { BookOpen, LogOut, Search, Plus, Music, FileText } from "lucide-react";
import { User, logout } from "../firebase";
import { cn } from "@/src/lib/utils";

interface HeaderProps {
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: "all" | "audio" | "document";
  setFilter: (filter: "all" | "audio" | "document") => void;
  genreFilter: string;
  setGenreFilter: (genre: string) => void;
  genres: string[];
  onAddBooks: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  searchQuery, 
  setSearchQuery, 
  filter, 
  setFilter,
  genreFilter,
  setGenreFilter,
  genres,
  onAddBooks 
}) => {
  return (
    <header className="h-20 md:h-24 bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-spotify-green rounded-full flex items-center justify-center shadow-lg shadow-spotify-green/20">
          <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </div>
        <h1 className="font-black text-[10px] md:text-xs tracking-tighter uppercase mt-1 text-spotify-green">VoiceBook</h1>
      </div>

      {/* Search & Filters */}
      <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-spotify-green transition-colors" />
          <input 
            type="text"
            placeholder="Sök i ditt bibliotek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-spotify-green/50 focus:bg-white/10 transition-all"
          />
        </div>

        <div className="hidden lg:flex items-center bg-white/5 rounded-full p-1 border border-white/10 shrink-0">
          <button 
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
              filter === "all" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            )}
          >
            Alla
          </button>
          <button 
            onClick={() => setFilter("audio")}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
              filter === "audio" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <Music className="w-3 h-3" />
            Ljud
          </button>
          <button 
            onClick={() => setFilter("document")}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
              filter === "document" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <FileText className="w-3 h-3" />
            Text
          </button>
        </div>

        {genres.length > 0 && (
          <select 
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="hidden sm:block bg-white/5 border border-white/10 rounded-full px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-spotify-green/50 transition-all cursor-pointer"
          >
            <option value="all" className="bg-dark-bg">Alla genrer</option>
            {genres.map(genre => (
              <option key={genre} value={genre} className="bg-dark-bg">{genre}</option>
            ))}
          </select>
        )}
      </div>

      {/* Actions & User */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button 
          onClick={onAddBooks}
          className="p-2 md:px-4 md:py-2 bg-white text-black rounded-full font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-transform active:scale-95 whitespace-nowrap"
          title="Lägg till böcker"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">+ Bok</span>
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-white/20 hidden sm:block"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Logga ut"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
