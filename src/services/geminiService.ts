import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY saknas. Vänligen konfigurera din API-nyckel i inställningarna.");
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
    throw new Error("Misslyckades med att sammanfatta boken. Försök igen senare.");
  }
}
