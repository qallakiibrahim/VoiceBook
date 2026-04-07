import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Gemini API Endpoint
  app.post("/api/summarize", async (req, res) => {
    const { title, content } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey.includes("TODO") || apiKey === "undefined") {
      return res.status(500).json({ 
        error: "API-nyckel saknas på servern. Vänligen kontrollera 'Secrets' i inställningarna." 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sammanfatta följande bok med titeln "${title}". 
        Ge en kortfattad översikt av de viktigaste punkterna, huvudtemat och de mest intressanta insikterna. 
        Svara på svenska.
        
        Innehåll:
        ${content.slice(0, 50000)}`,
      });

      res.json({ summary: response.text || "Kunde inte generera en sammanfattning." });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Misslyckades med att generera sammanfattning." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
