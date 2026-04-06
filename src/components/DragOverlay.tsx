import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

interface DragOverlayProps {
  isDragging: boolean;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ isDragging }) => {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-spotify-green/20 backdrop-blur-sm border-4 border-spotify-green border-dashed flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="bg-black/80 p-12 rounded-3xl flex flex-col items-center gap-6 shadow-2xl scale-110">
            <div className="w-24 h-24 bg-spotify-green rounded-full flex items-center justify-center animate-bounce">
              <Plus className="w-12 h-12 text-black" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black mb-2">Släpp dina böcker här</h2>
              <p className="text-gray-400 font-bold">Ljudböcker, PDF:er eller EPUB-filer</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
