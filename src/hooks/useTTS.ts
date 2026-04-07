import { useState, useRef, useEffect, useCallback } from "react";
import { Book } from "../types";
import { getChapters } from "../lib/extraction";
import { SWEDISH_STOP_WORDS } from "../constants";

export const useTTS = (activeBook: Book | null, isPlaying: boolean, setIsPlaying: (val: boolean) => void) => {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const word = activeWordRef.current;
      
      const wordTop = word.offsetTop;
      const containerHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      
      if (wordTop < scrollTop || wordTop > scrollTop + containerHeight - 50) {
        container.scrollTo({
          top: wordTop - containerHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentCharIndex]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices.length, voices.map(v => v.lang).slice(0, 5));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const detectLanguage = (text: string): string => {
    const words = text.toLowerCase().split(/\s+/);
    const swedishCount = words.filter(w => SWEDISH_STOP_WORDS.includes(w)).length;
    return swedishCount > 0 ? "sv-SE" : "en-US";
  };

  const playChapter = useCallback((index: number) => {
    if (!activeBook || activeBook.type !== "document") return;
    
    window.speechSynthesis.cancel();
    const chapters = getChapters(activeBook.content || "");
    
    if (chapters.length === 0 || (chapters.length === 1 && chapters[0].trim().length === 0)) {
      console.warn("Book has no content to play.");
      setIsPlaying(false);
      return;
    }

    const text = chapters[index];
    
    if (!text || text.trim().length === 0) {
      if (index < chapters.length - 1) {
        setCurrentChapter(index + 1);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    // Small timeout to ensure cancel() has finished and to help with mobile browser quirks
    setTimeout(() => {
      const detectedLang = detectLanguage(text);
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes(detectedLang) || v.lang.replace("-", "_").includes(detectedLang.replace("-", "_")));
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = detectedLang;
      utterance.rate = playbackRate;
      
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setCurrentCharIndex(event.charIndex);
        }
      };
      
      utterance.onstart = () => {
        console.log("TTS started playing chapter", index);
        setCurrentCharIndex(0);
      };
      
      utterance.onend = () => {
        console.log("TTS finished chapter", index);
        if (index < chapters.length - 1) {
          setTimeout(() => {
            setCurrentChapter(prev => prev + 1);
          }, 300);
        } else {
          setIsPlaying(false);
        }
      };

      utterance.onerror = (e) => {
        // Aggressively ignore common interruption/cancellation events
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        
        console.error("TTS Error:", e.error, e);
        if (e.error === 'not-allowed') {
          console.warn("TTS playback not allowed. Requires user gesture.");
        }
        setIsPlaying(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, [activeBook?.id, activeBook?.content, activeBook?.type, playbackRate, setIsPlaying]);

  // Handle chapter changes and play/pause state for documents
  const lastPlayedRef = useRef<{ id: string, chapter: number } | null>(null);

  useEffect(() => {
    if (activeBook?.type === "document") {
      if (isPlaying) {
        // Only trigger playChapter if the book or chapter actually changed
        if (lastPlayedRef.current?.id !== activeBook.id || lastPlayedRef.current?.chapter !== currentChapter) {
          playChapter(currentChapter);
          lastPlayedRef.current = { id: activeBook.id, chapter: currentChapter };
        }
      } else {
        window.speechSynthesis.cancel();
        lastPlayedRef.current = null;
      }
    }
    return () => {
      if (activeBook?.type === "document") {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentChapter, isPlaying, playChapter, activeBook?.id, activeBook?.type]);

  const cyclePlaybackRate = () => {
    const rates = [0.5, 0.6, 0.65, 0.7, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const primeTTS = () => {
    // Unlocks TTS on mobile browsers by speaking an empty string during a user gesture
    const utterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.cancel();
  };

  return {
    playbackRate,
    currentChapter,
    setCurrentChapter,
    currentCharIndex,
    setCurrentCharIndex,
    textContainerRef,
    activeWordRef,
    cyclePlaybackRate,
    primeTTS
  };
};
