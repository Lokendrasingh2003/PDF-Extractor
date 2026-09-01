
import chroma from "../config/chroma.js";

export async function getCollection() {
  const collection = await chroma.getOrCreateCollection({
    name: "documents",
    embeddingFunction: null,
  });

  return collection;
}

