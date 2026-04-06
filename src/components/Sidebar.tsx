import React from "react";
import { BookOpen, Grid, Search, Plus } from "lucide-react";
import { ViewType } from "../types";
import { cn } from "@/src/lib/utils";

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onAddBooks: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, onAddBooks }) => {
  return (
    <aside className="w-64 bg-black flex flex-col border-r border-white/5">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center shadow-lg shadow-spotify-green/20">
            <BookOpen className="w-6 h-6 text-black" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight">VoiceBook</h1>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setView("library")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold transition-all",
              view === "library" ? "bg-white/10 text-spotify-green" : "text-gray-400 hover:text-white"
            )}
          >
            <Grid className="w-5 h-5" />
            Bibliotek
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-gray-400 hover:text-white transition-all">
            <Search className="w-5 h-5" />
            Sök
          </button>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/5">
        <button 
          onClick={onAddBooks}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-full hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Lägg till böcker
        </button>
      </div>
    </aside>
  );
};
