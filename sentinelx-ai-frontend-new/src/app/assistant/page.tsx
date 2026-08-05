"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, User } from "lucide-react";

const suggestions = [
  "Summarize today's security alerts",
  "Which assets have critical vulnerabilities?",
  "Draft an incident response plan for ransomware",
  "Explain the latest threat intelligence feed",
];

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Hello! I'm Sentinel AI, your security operations assistant. Ask me about threats, vulnerabilities, alerts, or any security topic.",
  },
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: trimmed },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: "I've analyzed that request. This assistant is a demo — connect your security intelligence backend to enable live AI responses.",
      },
    ]);
    setInput("");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                Sentinel AI Assistant
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                AI Security Assistant
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Ask questions about your security posture and get AI-powered answers.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[50vh] flex-col rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isUser ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-violet-400/20 bg-violet-500/10 text-violet-300"}`}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      isUser
                        ? "border-cyan-400/20 bg-cyan-500/10 text-slate-100"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/25 hover:bg-white/10 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 focus-within:border-cyan-400/30"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sentinel AI anything..."
              className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-slate-500 outline-none"
              aria-label="Ask the assistant"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 transition hover:from-cyan-300 hover:to-blue-400"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

