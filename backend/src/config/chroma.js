import { ChromaClient } from "chromadb";

const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
});

export default chroma;