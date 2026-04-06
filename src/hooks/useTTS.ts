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
      window.speechSynthesis.getVoices();
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
    const text = chapters[index];
    
    if (!text || text.trim().length === 0) {
      if (index < chapters.length - 1) {
        setCurrentChapter(index + 1);
      } else {
        setIsPlaying(false);
      }
      return;
    }

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
      setCurrentCharIndex(0);
    };
    
    utterance.onend = () => {
      if (index < chapters.length - 1) {
        setTimeout(() => {
          setCurrentChapter(prev => prev + 1);
        }, 300);
      } else {
        setIsPlaying(false);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error("TTS Error:", e);
        setIsPlaying(false);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [activeBook, playbackRate, setIsPlaying]);

  // Handle chapter changes and play/pause state for documents
  useEffect(() => {
    if (activeBook?.type === "document") {
      if (isPlaying) {
        playChapter(currentChapter);
      } else {
        window.speechSynthesis.cancel();
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

  return {
    playbackRate,
    currentChapter,
    setCurrentChapter,
    currentCharIndex,
    setCurrentCharIndex,
    textContainerRef,
    activeWordRef,
    cyclePlaybackRate
  };
};
