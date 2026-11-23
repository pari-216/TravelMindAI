import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Send, Bot, User, Zap, RotateCcw } from "lucide-react";

const QUICK_PROMPTS = [
  "Plan Bali in ₹50k",
  "Hidden gems in Kyoto",
  "5 days Japan itinerary",
  "Packing list for Iceland",
  "Travel safety tips in Europe",
  "Best time to visit Santorini",
];

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end space-x-3 py-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-sky-100 rounded-2xl rounded-bl-sm px-4 py-3 flex space-x-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Markdown component overrides ────────────────────────────────────────────
const mdComponents = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed text-slate-700">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-700">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed text-slate-700">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-600">{children}</em>
  ),
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-slate-900 mt-3 mb-1 border-b border-slate-200 pb-1">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-slate-900 mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold text-slate-800 mt-2 mb-1">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-700 mt-2 mb-0.5">{children}</h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-purple-400 pl-3 my-2 text-slate-600 italic bg-purple-50 py-1 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-slate-100 text-purple-700 text-xs font-mono px-1.5 py-0.5 rounded">
        {children}
      </code>
    ) : (
      <pre className="bg-slate-900 text-green-300 text-xs font-mono p-3 rounded-xl overflow-x-auto my-2">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gradient-to-r from-purple-50 to-blue-50">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-100">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-slate-600">{children}</td>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-600 hover:text-purple-800 underline underline-offset-2"
    >
      {children}
    </a>
  ),
  br: () => <br />,
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-blue-600"
            : "bg-gradient-to-br from-purple-600 to-blue-600"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white border border-sky-100 text-slate-700 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={mdComponents}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        <p className="text-xs opacity-50 mt-1.5 text-right">
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIChat() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [historyId, setHistoryId] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load latest history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/ai/chat/history");
        if (data.messages?.length) {
          setMessages(data.messages);
          setHistoryId(data._id);
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Hey there! ✈️ I'm **Maya**, your AI travel companion. I can help you plan trips, suggest hidden gems, build itineraries, give packing tips, and more.\n\nWhere are you headed?",
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (err) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hey there! ✈️ I'm **Maya**, your AI travel companion. I can help you plan trips, suggest hidden gems, build itineraries, give packing tips, and more.\n\nWhere are you headed?",
            timestamp: Date.now(),
          },
        ]);
      }
    };
    fetchHistory();
  }, [token]);

  // Auto-scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || isThinking) return;

    setInput("");
    setError("");

    const userMsg = { role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const { data } = await api.post("/ai/chat", { message: msg, historyId });
      setHistoryId(data.historyId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, timestamp: Date.now() },
      ]);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || "Something went wrong. Please try again.";
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${errMsg}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! Where would you like to explore next? 🌍",
        timestamp: Date.now(),
      },
    ]);
    setHistoryId(null);
    setError("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-heading)" }}
            >
              Maya — AI Travel Assistant
            </h1>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-500">Powered by Groq AI</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 bg-white hover:bg-sky-100 text-slate-500 hover:text-sky-700 rounded-xl border border-sky-100 transition-colors"
          title="Clear chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp}
              onClick={() => sendMessage(qp)}
              className="px-3 py-1.5 bg-white/70 hover:bg-sky-100 text-slate-600 hover:text-sky-700 text-xs font-medium rounded-xl border border-sky-100 transition-colors flex items-center space-x-1.5"
            >
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>{qp}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2 scrollbar-thin custom-scrollbar">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isThinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-4 bg-white/70 backdrop-blur border border-sky-100 rounded-2xl p-3 shadow-xl">
        <div className="flex items-end space-x-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about travel…"
            rows={1}
            style={{
              resize: "none",
              height: "auto",
              maxHeight: "120px",
              overflowY: "auto",
              color: "var(--text-primary)",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 py-2 px-1"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isThinking}
            className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 shadow-lg shadow-purple-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1 ml-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
