import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.includes("TODO")) {
      throw new Error("API-nyckel saknas. Vänligen kontrollera att du har lagt till GEMINI_API_KEY eller API_KEY i 'Secrets' i inställningarna och LADDA OM sidan (F5).");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function summarizeBook(title: string, content: string): Promise<string> {
  if (!content) return "Inget innehåll tillgängligt för sammanfattning.";

  try {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sammanfatta följande bok med titeln "${title}". 
      Ge en kortfattad översikt av de viktigaste punkterna, huvudtemat och de mest intressanta insikterna. 
      Svara på svenska.
      
      Innehåll:
      ${content.slice(0, 50000)}`,
    });

    return response.text || "Kunde inte generera en sammanfattning.";
  } catch (error) {
    console.error("Error summarizing book:", error);
    const message = error instanceof Error ? error.message : "Misslyckades med att sammanfatta boken. Försök igen senare.";
    throw new Error(message);
  }
}

export async function extractMetadata(title: string, content: string): Promise<{ author: string, genre: string }> {
  if (!content) return { author: "Okänd författare", genre: "Okänd genre" };

  try {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analysera följande bok med titeln "${title}". 
      Identifiera författaren och boken genre (t.ex. Fantasy, Deckare, Biografi, Facklitteratur).
      Svara i JSON-format med fälten "author" och "genre".
      Om du inte kan hitta författaren, svara med "Okänd författare".
      Om du inte kan hitta genren, svara med "Okänd genre".
      
      Innehåll (första delen):
      ${content.slice(0, 10000)}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      author: result.author || "Okänd författare",
      genre: result.genre || "Okänd genre"
    };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return { author: "Okänd författare", genre: "Okänd genre" };
  }
}
