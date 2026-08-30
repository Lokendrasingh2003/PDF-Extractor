import { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setLoading(true);
      setResponse("");

      const res = await axios.post(
        "http://localhost:5000/api/chat",
        {
          message,
        }
      );

      setResponse(res.data.reply);
    } catch (error) {
      console.error(error);

      setResponse("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Chatbot 🤖</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask something..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="submit">
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>

      {response && (
        <div>
          <h3>AI Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;