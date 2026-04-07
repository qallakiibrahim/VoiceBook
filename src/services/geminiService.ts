export async function summarizeBook(title: string, content: string): Promise<string> {
  if (!content) return "Inget innehåll tillgängligt för sammanfattning.";

  try {
    const response = await fetch(`${window.location.origin}/api/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content: content.slice(0, 50000) }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Kunde inte generera en sammanfattning.");
    }

    const data = await response.json();
    return data.summary || "Kunde inte generera en sammanfattning.";
  } catch (error) {
    console.error("Error summarizing book:", error);
    const message = error instanceof Error ? error.message : "Misslyckades med att sammanfatta boken. Försök igen senare.";
    throw new Error(message);
  }
}
