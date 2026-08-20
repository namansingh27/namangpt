"use client";

import Link from "next/link";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ReactNode,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string; timestamp: number };
type Prompt = { text: string; icon: ReactNode };
type RecentEntry = { idx: number; content: string; timestamp: number };

const HISTORY_KEY = "namangpt_history";
const HISTORY_LIMIT = 50;

// ─── Sidebar date grouping ─────────────────────────────────────────────────

function dateGroupLabel(ts: number): "Today" | "Yesterday" | "Earlier" {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const oneDay = 24 * 60 * 60 * 1000;
  const todayStart = startOfDay(Date.now());
  const msgStart = startOfDay(ts);
  if (msgStart === todayStart) return "Today";
  if (msgStart === todayStart - oneDay) return "Yesterday";
  return "Earlier";
}

// Reduces a full question down to a short 2-3 word label for the sidebar.
function extractLabel(question: string): string {
  const q = question.toLowerCase().trim();

  if (q.includes("work experience") || q.includes("experience")) return "Work Experience";
  if (q.includes("project") || q.includes("built") || q.includes("build")) return "Projects";
  if (q.includes("tech stack") || q.includes("technology") || q.includes("stack")) return "Tech Stack";
  if (q.includes("skill")) return "Skills";
  if (q.includes("education") || q.includes("degree") || q.includes("university") || q.includes("gpa")) return "Education";
  if (q.includes("contact") || q.includes("reach") || q.includes("email") || q.includes("linkedin")) return "Contact";
  if (q.includes("achievement") || q.includes("award") || q.includes("accomplish")) return "Achievements";
  if (q.includes("leadership") || q.includes("president") || q.includes("club")) return "Leadership";
  if (q.includes("internship") || q.includes("intern") || q.includes("dep") || q.includes("nyc")) return "Internship";
  if (q.includes("startup") || q.includes("startuphub")) return "StartupHub";
  if (q.includes("sql") || q.includes("text2sql") || q.includes("agent")) return "Text2SQL";
  if (q.includes("flight") || q.includes("delay")) return "Flight Prediction";
  if (q.includes("airbnb") || q.includes("pricing")) return "Airbnb Pricing";
  if (q.includes("career explorer")) return "Career Explorer";
  if (q.includes("product manager") || q.includes("pm") || q.includes("product management")) return "Product Management";
  if (q.includes("research") || q.includes("stevens")) return "Research";
  if (q.includes("recommend") || q.includes("hire") || q.includes("should i")) return "Recommendation";
  if (q.includes("about") || q.includes("who is") || q.includes("tell me about naman")) return "About Naman";
  if (q.includes("summary") || q.includes("overview")) return "Overview";

  // fallback — take first 3 meaningful words
  const words = question
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 3);
  return words.length > 0
    ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : question.slice(0, 20);
}

// ─── Escaping & linkification ─────────────────────────────────────────────────
// Text is always HTML-escaped before link patterns are applied, so anything
// injected via dangerouslySetInnerHTML stays safe from markup/script injection.

const LINK_STYLE = "color:#6366f1;text-decoration:underline;";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Wraps LinkedIn/GitHub profile links and emails in clickable <a> tags.
// Matches both protocol-prefixed ("https://linkedin.com/in/...") and bare
// ("linkedin.com/in/...") forms, since the model doesn't always include the
// protocol. The bare-form patterns exclude matches preceded by `"` or `/` so
// they don't re-match the URL already wrapped by the protocol-form pass just
// above them (e.g. the text sitting inside a freshly-built href="https://...").
// Expects `escaped` to already be HTML-escaped — operates on safe text only.
function applyLinks(escaped: string): string {
  return escaped
    .replace(
      /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s,<]+)/g,
      `<a href="$1" target="_blank" rel="noopener noreferrer" style="${LINK_STYLE}">LinkedIn Profile</a>`
    )
    .replace(
      /(?<!["/])((?:www\.)?linkedin\.com\/in\/[^\s,<]+)/g,
      `<a href="https://$1" target="_blank" rel="noopener noreferrer" style="${LINK_STYLE}">LinkedIn Profile</a>`
    )
    .replace(
      /(https?:\/\/(?:www\.)?github\.com\/[^\s,<]+)/g,
      `<a href="$1" target="_blank" rel="noopener noreferrer" style="${LINK_STYLE}">GitHub Profile</a>`
    )
    .replace(
      /(?<!["/])((?:www\.)?github\.com\/[^\s,<]+)/g,
      `<a href="https://$1" target="_blank" rel="noopener noreferrer" style="${LINK_STYLE}">GitHub Profile</a>`
    )
    .replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      `<a href="mailto:$1" style="${LINK_STYLE}">$1</a>`
    );
}

// Escapes raw text and linkifies it — used for the live-streaming preview,
// which skips full markdown parsing.
function linkify(raw: string): string {
  return applyLinks(escapeHtml(raw));
}

// ─── Markdown renderer ───────────────────────────────────────────────────────
// Converts a small subset of markdown to safe HTML.
// HTML is escaped before patterns are applied to prevent XSS.

function renderMarkdown(raw: string, dark: boolean): string {
  const codeStyle = [
    dark ? "background:rgba(255,255,255,0.09)" : "background:rgba(0,0,0,0.06)",
    "padding:1px 5px",
    "border-radius:3px",
    "font-size:0.8em",
    "font-family:ui-monospace,SFMono-Regular,Menlo,monospace",
  ].join(";");

  const inline = (s: string) =>
    applyLinks(
      escapeHtml(s)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, `<code style="${codeStyle}">$1</code>`)
    );

  const out: string[] = [];
  let inList = false;

  for (const line of raw.split("\n")) {
    if (/^[-*•] /.test(line)) {
      if (!inList) { out.push('<ul class="md-ul">'); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*•] /, ""))}</li>`);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (/^### /.test(line))
        out.push(`<div class="md-h3">${inline(line.slice(4))}</div>`);
      else if (/^## /.test(line))
        out.push(`<div class="md-h2">${inline(line.slice(3))}</div>`);
      else if (/^# /.test(line))
        out.push(`<div class="md-h1">${inline(line.slice(2))}</div>`);
      else if (line.trim() === "") {
        if (out.length && out[out.length - 1] !== "<br/>") out.push("<br/>");
      } else {
        out.push(`<span class="md-ln">${inline(line)}</span>`);
      }
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const S = { width: 13, height: 13, fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };

const IconCode     = <svg {...S}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconBrief    = <svg {...S}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const IconCpu      = <svg {...S}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>;
const IconAward    = <svg {...S}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
const IconMail     = <svg {...S}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconBook     = <svg {...S}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const IconSun      = <svg {...S}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconMoon     = <svg {...S}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const IconLinkedIn = <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const IconGitHub   = <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>;
const IconSend     = <svg {...{ ...S, width: 13, height: 13, strokeWidth: 2.5 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconPlus     = <svg {...S}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const PROMPTS: Prompt[] = [
  { text: "What has Naman built?",              icon: IconCode  },
  { text: "Tell me about his work experience",  icon: IconBrief },
  { text: "What is Naman's tech stack?",        icon: IconCpu   },
  { text: "What are his achievements?",         icon: IconAward },
  { text: "How can I contact Naman?",           icon: IconMail  },
  { text: "Tell me about his education",        icon: IconBook  },
];

// Injected once — drives message fade-in and prose styles
const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .msg-in  { animation: fadeUp 0.22s ease-out; }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .assistant-in { animation: fadeIn 150ms ease-out; }
  @keyframes blinkCursor {
    0%, 50%   { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }
  .stream-cursor { display: inline-block; margin-left: 1px; animation: blinkCursor 1s steps(1) infinite; }
  .md-ul   { list-style-type: disc; padding-left: 1.3rem; margin: 3px 0; }
  .md-ul li{ margin: 2px 0; line-height: 1.6; }
  .md-ln   { display: block; }
  .md-h1   { font-weight: 700; margin-top: 10px; }
  .md-h2   { font-weight: 700; font-size: 0.93em; margin-top: 7px; }
  .md-h3   { font-weight: 600; margin-top: 5px; }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const [isDark, setIsDark]             = useState(false);
  // Past sessions' messages, loaded from localStorage once on mount — feeds
  // the Recents sidebar only. The active chat (`messages`) always starts
  // empty on page load and never gets restored from this.
  const [pastMessages, setPastMessages] = useState<Message[]>([]);

  // bottomRef marks the very end of the last message — kept as an anchor
  // point, but nothing auto-scrolls to it; see lastUserMsgRef below.
  const bottomRef           = useRef<HTMLDivElement>(null);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const lastUserMsgRef      = useRef<HTMLDivElement>(null);
  const streamingRef        = useRef<HTMLSpanElement>(null);
  const isStreaming         = useRef(false);

  // Restore persisted theme (runs after hydration to avoid mismatch)
  useEffect(() => {
    if (localStorage.getItem("namangpt-theme") === "dark") setIsDark(true);
  }, []);

  // Load past conversation history for the Recents sidebar only — the
  // active chat always starts fresh on page load and is never restored.
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setPastMessages(parsed);
    } catch {
      // Ignore corrupted history and start fresh.
    }
  }, []);

  // Persist conversation history (past sessions + this session), capped to
  // the most recent 50 messages, so the Recents sidebar reflects live chats
  // without ever restoring them into the active view.
  useEffect(() => {
    if (messages.length === 0) return;
    const combined = [...pastMessages, ...messages];
    const capped = combined.length > HISTORY_LIMIT ? combined.slice(-HISTORY_LIMIT) : combined;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(capped));
  }, [messages, pastMessages]);

  // Grow textarea with content
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const toggleDark = () =>
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("namangpt-theme", next ? "dark" : "light");
      return next;
    });

  // ─ dark/light helper: pick string based on theme
  const D = (d: string, l: string) => (isDark ? d : l);

  // ─ Send a message and stream the response
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const msgs: Message[] = [...messages, { role: "user", content: trimmed, timestamp: Date.now() }];
      setMessages(msgs);
      setInput("");
      setLoading(true);

      // Scroll so the user's new question is in view — once, right after
      // it's sent. Nothing else triggers a scroll from here on.
      requestAnimationFrame(() => {
        lastUserMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      try {
        const res = await fetch("/api/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ messages: msgs }),
        });
        if (!res.ok || !res.body) throw new Error();

        const reader = res.body.getReader();
        const dec    = new TextDecoder();

        setLoading(false);

        // Stream directly into the DOM via ref — no React state updates
        // (and therefore no re-renders) while tokens are arriving.
        isStreaming.current = true;
        setShowStreaming(true);
        if (streamingRef.current) streamingRef.current.innerHTML = "";

        let finalText = "";

        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value, { stream: true });
            finalText += chunk;
            if (streamingRef.current) {
              // Re-linkify the full accumulated text each time (not just the
              // new chunk) so a URL split across two chunks still links up.
              streamingRef.current.innerHTML = linkify(finalText);
            }
            // No scrolling here — let the user read the response as it streams in.
          }
        } finally {
          isStreaming.current = false;
          setShowStreaming(false);
          // Only now does the completed message enter React state.
          setMessages((p) => [...p, { role: "assistant", content: finalText, timestamp: Date.now() }]);
          // Clear the DOM buffer so the now-hidden placeholder doesn't sit
          // there full height (just invisible) and throw off page layout.
          if (streamingRef.current) streamingRef.current.innerHTML = "";
        }
      } catch {
        setLoading(false);
        isStreaming.current = false;
        setShowStreaming(false);
        setMessages((p) => [
          ...p,
          { role: "assistant", content: "Something went wrong. Please try again.", timestamp: Date.now() },
        ]);
      }
    },
    [messages, loading]
  );

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setPastMessages([]);
    setMessages([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmpty = messages.length === 0 && !loading;

  // Group the user's questions for the sidebar — most recent first within
  // each bucket, buckets shown in Today / Yesterday / Earlier order. Sourced
  // from past sessions (localStorage) plus this session's live messages, so
  // the sidebar is a history log independent of what's in the active chat.
  const recentGroups = (() => {
    const order: Array<"Today" | "Yesterday" | "Earlier"> = ["Today", "Yesterday", "Earlier"];
    const buckets: Record<string, RecentEntry[]> = { Today: [], Yesterday: [], Earlier: [] };
    const sidebarMessages = [...pastMessages, ...messages];
    for (let idx = sidebarMessages.length - 1; idx >= 0; idx--) {
      const m = sidebarMessages[idx];
      if (m.role !== "user") continue;
      buckets[dateGroupLabel(m.timestamp)].push({ idx, content: m.content, timestamp: m.timestamp });
    }
    return order
      .map((label) => ({ label, items: buckets[label] }))
      .filter((g) => g.items.length > 0);
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col h-screen w-full max-w-full overflow-x-hidden font-sans transition-colors duration-200 ${
        D("bg-[#0A0A0A] text-gray-100", "bg-[#FAFAFA] text-gray-900")
      }`}
    >
      <style>{STYLES}</style>

      {/* ━━━ HEADER — full page width, spans behind the sidebar too ━━━━━━━ */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-200 ${
          D("bg-black/80 border-gray-800", "bg-white/80 border-gray-100")
        }`}
      >
        <div className="flex items-center justify-between h-14 px-5">

          {/* Left: avatar + name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMessages([])}
              aria-label="Reset chat"
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold select-none shadow-sm hover:opacity-80 active:scale-95 transition-all"
            >
              NS
            </button>
            <span className={`font-semibold text-sm tracking-tight ${D("text-gray-100", "text-gray-900")}`}>
              NamanGPT
            </span>
          </div>

          {/* Right: open-to-work · linkedin · github · theme toggle */}
          <div className="ml-auto flex items-center gap-1">
            <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border mr-2 ${
              D("bg-emerald-950/40 border-emerald-900/50 text-emerald-400",
                "bg-emerald-50 border-emerald-100 text-emerald-700")
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open to work
            </span>

            <a
              href="https://www.linkedin.com/in/naman-singh-9aa209209/"
              target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                D("text-gray-500 hover:text-blue-400 hover:bg-white/5",
                  "text-gray-400 hover:text-blue-600 hover:bg-gray-100")
              }`}
            >
              {IconLinkedIn}
            </a>

            <a
              href="https://github.com/namansingh27"
              target="_blank" rel="noopener noreferrer" aria-label="GitHub"
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                D("text-gray-500 hover:text-gray-200 hover:bg-white/5",
                  "text-gray-400 hover:text-gray-900 hover:bg-gray-100")
              }`}
            >
              {IconGitHub}
            </a>

            <a
              href="mailto:naman.singhms@gmail.com"
              aria-label="Email Naman"
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                D("text-gray-500 hover:text-indigo-400 hover:bg-white/5",
                  "text-gray-400 hover:text-indigo-600 hover:bg-gray-100")
              }`}
            >
              {IconMail}
            </a>

            <button
              onClick={toggleDark}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                D("text-gray-500 hover:text-yellow-300 hover:bg-white/5",
                  "text-gray-400 hover:text-gray-900 hover:bg-gray-100")
              }`}
            >
              {isDark ? IconSun : IconMoon}
            </button>
          </div>
        </div>
      </header>

      {/* ━━━ BODY — sidebar + chat column, below the full-width header ━━━━ */}
      <div className="flex flex-1 min-h-0">

        {/* ━━━ SIDEBAR (Recents) — hidden below the md breakpoint (768px) ━━ */}
        <aside
          className={`hidden md:flex md:flex-col w-[260px] flex-none h-full border-r transition-colors duration-200 ${
            D("bg-[#0A0A0A] border-gray-800", "bg-[#FAFAFA] border-gray-200")
          }`}
        >
          <div className="flex-none px-4 pt-4 pb-1">
            <h2 className={`text-sm font-bold ${D("text-gray-100", "text-gray-900")}`}>Recents</h2>
          </div>

          <div className="flex-none px-3 pb-2">
            <button
              onClick={() => setMessages([])}
              className={`w-full flex items-center gap-2 text-sm py-2 px-3 rounded-lg border transition-colors ${
                D("border-gray-700 hover:bg-gray-800 text-gray-100",
                  "border-gray-200 hover:bg-gray-100 text-gray-900")
              }`}
            >
              <span className="flex-none">{IconPlus}</span>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {recentGroups.map((group) => (
              <div key={group.label} className="mb-1">
                <div className="text-xs font-medium text-gray-400 uppercase px-3 py-1">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.idx}
                    // Recents are a history log, not a session restore — a
                    // past question may not exist in the current chat, so
                    // clicking one intentionally does nothing.
                    className={`truncate text-sm py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      D("text-gray-400 hover:bg-gray-800", "text-gray-600 hover:bg-gray-100")
                    }`}
                  >
                    {extractLabel(item.content)}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex-none px-3 py-3">
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Clear history
            </button>
          </div>
        </aside>

        {/* ━━━ MAIN CHAT COLUMN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

      {/* ━━━ MESSAGE AREA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 overflow-y-auto">

        {isEmpty ? (
          /* ── Hero / empty state ── */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 text-center">

            {/* Hero photo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto">
              <img
                src="/naman.jpg"
                alt="Naman Singh"
                className="w-full h-full object-cover object-top scale-125"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <h1 className={`text-[1.85rem] font-bold tracking-tight leading-tight mb-3 ${D("text-white", "text-gray-900")}`}>
              Hi, I&apos;m NamanGPT
            </h1>
            <p className={`max-w-[22rem] text-sm leading-relaxed mb-2.5 ${D("text-gray-400", "text-gray-500")}`}>
              I know everything about Naman Singh — his projects, experience,
              skills, and background. Ask me anything.
            </p>
            <p className={`text-xs mb-10 ${D("text-gray-600", "text-gray-400")}`}>
              Built by Naman Singh
            </p>

            {/* Prompt cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[30rem]">
              {PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => sendMessage(p.text)}
                  style={{ borderLeftWidth: "3px", borderLeftColor: "#6366f1" }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-150 hover:-translate-y-0.5 ${
                    D("bg-[#111111] border-gray-800 text-gray-300 hover:shadow-lg hover:shadow-black/30",
                      "bg-white border-gray-100 text-gray-700 hover:shadow-md hover:shadow-gray-200/80")
                  }`}
                >
                  <span className={`flex-none ${D("text-indigo-400", "text-indigo-500")}`}>
                    {p.icon}
                  </span>
                  <span className="leading-snug">{p.text}</span>
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ── Chat messages ── */
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

            {(() => {
              const lastUserIdx = messages.reduce(
                (acc, m, idx) => (m.role === "user" ? idx : acc),
                -1
              );
              const lastIdx = messages.length - 1;

              return messages.map((msg, i) =>
                msg.role === "user" ? (
                  /* User bubble */
                  <div
                    key={i}
                    id={`msg-${i}`}
                    ref={i === lastUserIdx ? lastUserMsgRef : undefined}
                    className="flex justify-end msg-in"
                  >
                    <div className="max-w-lg px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-sm leading-relaxed shadow-sm shadow-indigo-900/25 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {i === lastIdx && <div ref={bottomRef} />}
                  </div>
                ) : (
                  /* Assistant bubble */
                  <div key={i} id={`msg-${i}`} className="flex items-start gap-3 msg-in">
                    <div className="flex-none w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold select-none mt-1 shadow-sm">
                      NS
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm assistant-in ${
                        D("bg-[#1A1A1A] border border-gray-800 text-gray-100",
                          "bg-white border border-gray-100 text-gray-800")
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.content, isDark),
                      }}
                    />
                    {i === lastIdx && <div ref={bottomRef} />}
                  </div>
                )
              );
            })()}

            {/* Streaming placeholder — updated directly via DOM ref (streamingRef),
                bypassing React state until the response finishes. Always rendered;
                visibility is toggled with opacity via the showStreaming flag. */}
            <div
              className={`flex items-start gap-3 msg-in transition-opacity duration-150 ${
                showStreaming ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={!showStreaming}
            >
              <div className="flex-none w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold select-none mt-1 shadow-sm">
                NS
              </div>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  D("bg-[#1A1A1A] border border-gray-800 text-gray-100",
                    "bg-white border border-gray-100 text-gray-800")
                }`}
              >
                <span ref={streamingRef} />
                {showStreaming && <span className="stream-cursor">▍</span>}
              </div>
            </div>

            {/* Loading dots */}
            {loading && (
              <div className="flex items-start gap-3 msg-in">
                <div className="flex-none w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold select-none mt-1 shadow-sm">
                  NS
                </div>
                <div className={`px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
                  D("bg-[#1A1A1A] border border-gray-800", "bg-white border border-gray-100")
                }`}>
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className={`w-[5px] h-[5px] rounded-full animate-bounce ${D("bg-gray-600", "bg-gray-300")}`}
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━ INPUT BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={`flex-none px-4 pt-3 pb-4 transition-colors duration-200 ${D("bg-[#0A0A0A]", "bg-[#FAFAFA]")}`}>
        <div className="max-w-2xl mx-auto">

          {/* Input card */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-md transition-colors ${
            D("bg-[#111111] border border-gray-800 shadow-black/50",
              "bg-white border border-gray-100 shadow-gray-200/60")
          }`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Naman..."
              rows={1}
              className={`flex-1 resize-none bg-transparent text-sm outline-none leading-5 ${
                D("text-gray-100 placeholder-gray-600", "text-gray-800 placeholder-gray-400")
              }`}
              style={{ minHeight: "20px", maxHeight: "160px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="flex-none w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white disabled:opacity-25 disabled:cursor-not-allowed hover:from-indigo-400 hover:to-indigo-600 active:scale-95 transition-all"
            >
              {IconSend}
            </button>
          </div>

          {/* Hint */}
          <p className={`hidden md:block text-center text-[10px] mt-1.5 ${D("text-gray-700", "text-gray-400")}`}>
            Press <kbd className={`px-1 rounded border font-mono text-[9px] ${D("border-gray-700 bg-gray-900 text-gray-500", "border-gray-200 bg-gray-50 text-gray-500")}`}>Enter</kbd> to send
            {" "}·{" "}NamanGPT only answers questions about Naman Singh
          </p>

        </div>
      </div>

      {/* Disclaimer */}
      <p className="flex flex-wrap items-center justify-center gap-x-1 px-4 py-2 text-xs text-gray-400 text-center">
        AI-generated responses may not be 100% accurate. For verified information, contact Naman directly.
        {" "}·{" "}
        <Link href="/privacy" className="hover:underline hover:text-gray-300">
          Privacy Policy
        </Link>
      </p>
      </div>
      </div>
    </div>
  );
}
