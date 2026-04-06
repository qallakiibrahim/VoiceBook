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
}

export type ViewType = "library" | "player";
