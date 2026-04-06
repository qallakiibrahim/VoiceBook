export type BookType = "audio" | "document";

export interface Book {
  id: string;
  title: string;
  author: string;
  type: BookType;
  format: string;
  url: string;
  coverColor: string;
  progress: number;
  content?: string;
  lastPosition?: number;
  bookmarks?: Bookmark[];
}

export interface Bookmark {
  id: string;
  label: string;
  position: number; // chapter index for docs, seconds for audio
  timestamp: number;
}

export type ViewType = "library" | "player";
