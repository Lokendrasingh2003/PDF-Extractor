
import { createEmbedding } from "./createEmbedding.js";
import { getCollection } from "./vectorStore.js";

export async function searchDocuments(query, topK = 3) {
  // 1. Create embedding for user's question
  const queryEmbedding = await createEmbedding(query);

  // 2. Get ChromaDB collection
  const collection = await getCollection();

  // 3. Search for similar vectors
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  return results;
}

