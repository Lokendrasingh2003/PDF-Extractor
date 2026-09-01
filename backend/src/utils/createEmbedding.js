import ai from "../config/gemini.js";

export async function createEmbedding(text) {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🧠 Creating embedding... attempt ${attempt + 1}`
      );

      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      return response.embeddings[0].values;

    } catch (error) {
      const errorMessage = error?.message || "";

      const isRateLimitError =
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("Quota exceeded");

      // If it isn't a quota/rate-limit error,
      // don't retry it.
      if (!isRateLimitError) {
        throw error;
      }

      // If we've used all retries, throw the error.
      if (attempt === maxRetries) {
        throw new Error(
          "Gemini embedding quota exceeded. Please wait and try again."
        );
      }

      // Exponential backoff:
      // 2 sec → 4 sec → 8 sec
      const delay = 2000 * Math.pow(2, attempt);

      console.log(
        `⏳ Gemini quota exceeded. Retrying in ${
          delay / 1000
        } seconds...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }
}

