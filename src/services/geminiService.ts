import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Try multiple sources for the API key
    const apiKey = 
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY || process.env?.API_KEY : null) || 
      (import.meta as any).env?.VITE_GEMINI_API_KEY || 
      (import.meta as any).env?.VITE_API_KEY;
    
    const isInvalid = (key: any) => 
      !key || 
      key === "undefined" || 
      key === "null" || 
      key === "MY_GEMINI_API_KEY" || 
      key === "MY_API_KEY" || 
      (typeof key === 'string' && (key.trim() === "" || key.includes("TODO")));

    if (isInvalid(apiKey)) {
      throw new Error("[v4] API-nyckel saknas. Vänligen kontrollera att du har lagt till GEMINI_API_KEY eller API_KEY i 'Secrets' i inställningarna och LADDA OM sidan (F5).");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function summarizeBook(title: string, content: string): Promise<string> {
  if (!content) return "Inget innehåll tillgängligt för sammanfattning.";

  try {
    const ai = getAI();
    // Limit content to avoid token limits if book is very long
    // Gemini 3 Flash has a large context window, but for a quick summary 
    // we can focus on the first 50k characters if it's massive.
    const truncatedContent = content.slice(0, 100000);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sammanfatta följande bok med titeln "${title}". 
      Ge en kortfattad översikt av de viktigaste punkterna, huvudtemat och de mest intressanta insikterna. 
      Svara på svenska.
      
      Innehåll:
      ${truncatedContent}`,
    });

    return response.text || "Kunde inte generera en sammanfattning.";
  } catch (error) {
    console.error("Error summarizing book:", error);
    const message = error instanceof Error ? error.message : "Misslyckades med att sammanfatta boken. Försök igen senare.";
    throw new Error(message);
  }
}
