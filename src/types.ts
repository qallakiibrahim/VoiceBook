export type BookType = "audio" | "document";

export interface Book {
  id: string;
  userId?: string;
  title: string;
  author: string;
  genre?: string;
  type: BookType;
  format: string;
  url: string;
  storagePath?: string;
  coverColor: string;
  progress: number;
  content?: string;
  summary?: string;
  lastPosition?: number;
  bookmarks?: Bookmark[];
  createdAt?: string;
}

export interface Bookmark {
  id: string;
  label: string;
  position: number; // chapter index for docs, seconds for audio
  timestamp: number;
}

export type ViewType = "library" | "player";
