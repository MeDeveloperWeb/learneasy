"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSplitScreen } from "./SplitScreenProvider";
import { useUser } from "./UserProvider";
import {
  KEY_STORAGE,
  MODEL_STORAGE,
  MODELS_STORAGE,
  FALLBACK_MODELS,
  GeminiModel,
  fetchGeminiModels,
  pickDefaultModel,
  markdownToHtml,
  withMarker,
  MARKDOWN_CLASS,
  getPromptTemplate,
  setPromptTemplate,
  DEFAULT_PROMPT_TEMPLATE,
  TOPIC_VAR,
  PAPER_VAR,
} from "@/lib/gemini";

const API_KEYS_URL = "https://aistudio.google.com/api-keys";

// Read the cached model list saved from a previous fetch (so we don't hit the
// API on every open). Returns null if nothing valid is cached.
function loadCachedModels(): GeminiModel[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MODELS_STORAGE);
    if (!raw) return null;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

interface Msg {
  role: "user" | "model";
  text: string;
}

// Chats are saved locally, one bucket per topic (or "global" when opened off a
// topic, e.g. the Google search panel).
const chatKey = (topicId: string | null) => `geminiChat:${topicId || "global"}`;

function loadChat(key: string): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveChat(key: string, msgs: Msg[]) {
  try {
    // Drop the empty placeholder of an in-flight reply so reloads stay clean.
    localStorage.setItem(key, JSON.stringify(msgs.filter((m) => m.text.trim())));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export function GeminiChat({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { geminiInitialPrompt, currentTopicId, currentTopicName } = useSplitScreen();
  const { userId, username } = useUser();
  const topicKey = chatKey(currentTopicId);

  const [apiKey, setApiKey] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(KEY_STORAGE) : null
  );
  const [keyInput, setKeyInput] = useState("");
  const [models, setModels] = useState<GeminiModel[]>(() => loadCachedModels() || FALLBACK_MODELS);
  const [model, setModel] = useState<string>(
    () => (typeof window !== "undefined" && localStorage.getItem(MODEL_STORAGE)) || FALLBACK_MODELS[0].id
  );
  const [refreshingModels, setRefreshingModels] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Loaded from this topic's saved chat so reopening keeps history.
  const [messages, setMessages] = useState<Msg[]>(() => loadChat(chatKey(currentTopicId)));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection mode for saving messages to the resource section.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Prompt-template editor.
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  // Auto-send waits for this so the seeded question posts with a resolved model.
  // Ready immediately when we already have a cached model list.
  const [modelsReady, setModelsReady] = useState(() => !!loadCachedModels());

  // Fetch the live model list, cache it, and keep the selection valid. Only a
  // real fetch is cached, so a failed attempt retries next time.
  const fetchAndCacheModels = async () => {
    if (!apiKey) return;
    const list = await fetchGeminiModels(apiKey);
    setModels(list);
    if (list !== FALLBACK_MODELS) {
      localStorage.setItem(MODELS_STORAGE, JSON.stringify(list));
    }
    const stored = localStorage.getItem(MODEL_STORAGE);
    if (!stored || !list.some((m) => m.id === stored)) {
      const def = pickDefaultModel(list);
      setModel(def);
      localStorage.setItem(MODEL_STORAGE, def);
    }
  };

  // First use only: if nothing is cached yet, fetch once. Afterwards the cached
  // list is reused on every open; the user re-fetches via "Refresh model list".
  useEffect(() => {
    if (!apiKey || loadCachedModels()) return;
    let cancelled = false;
    fetchAndCacheModels().finally(() => {
      if (!cancelled) setModelsReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const refreshModels = async () => {
    if (refreshingModels) return;
    setMenuOpen(false);
    setRefreshingModels(true);
    setNotice(null);
    try {
      await fetchAndCacheModels();
      setNotice("Model list updated ✓");
    } catch {
      setNotice("Couldn't refresh models.");
    } finally {
      setRefreshingModels(false);
    }
  };

  // Keep the conversation scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // If the topic changes while the panel stays mounted, swap in that topic's chat.
  const loadedKeyRef = useRef(topicKey);
  useEffect(() => {
    if (loadedKeyRef.current === topicKey) return;
    loadedKeyRef.current = topicKey;
    setMessages(loadChat(topicKey));
  }, [topicKey]);

  // Persist this topic's chat on every change (cleared only via "Clear chat").
  useEffect(() => {
    saveChat(topicKey, messages);
  }, [topicKey, messages]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    localStorage.setItem(KEY_STORAGE, k);
    setApiKey(k);
    setKeyInput("");
    setError(null);
  };

  const clearKey = () => {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem(MODELS_STORAGE);
    setMenuOpen(false);
    setApiKey(null);
    setError(null);
  };

  // Explicit, user-triggered wipe of this topic's saved chat.
  const clearChat = () => {
    setMenuOpen(false);
    setMessages([]);
    setError(null);
    setNotice(null);
    try {
      localStorage.removeItem(topicKey);
    } catch {
      /* ignore */
    }
  };

  const changeModel = (m: string) => {
    setModel(m);
    localStorage.setItem(MODEL_STORAGE, m);
  };

  const sendMessage = async (raw: string, base?: Msg[]) => {
    const text = raw.trim();
    if (!text || loading || !apiKey) return;
    setError(null);

    const history = [...(base ?? messages), { role: "user" as const, text }];
    setMessages([...history, { role: "model", text: "" }]);
    setInput("");
    setLoading(true);

    try {
      // Call Gemini directly from the browser with the user's own key:
      // the key and conversation go straight to Google, never to our server.
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || `Request failed (HTTP ${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      // Parse the SSE stream: each "data:" line carries a JSON chunk.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const json = trimmed.slice(5).trim();
          if (!json) continue;
          try {
            const data = JSON.parse(json);
            const part = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (part) {
              acc += part;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "model", text: acc };
                return copy;
              });
            }
          } catch {
            /* partial JSON across chunks — ignore, next read completes it */
          }
        }
      }

      if (!acc) {
        setMessages((prev) => prev.slice(0, -1));
        setError("No response returned (the prompt may have been blocked).");
      }
    } catch (e) {
      setMessages((prev) => prev.slice(0, -1));
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendMessage(input);

  // Resend the last (failed) user message, rebuilding from the history before it
  // so the bubble isn't duplicated.
  const retry = () => {
    const idx = messages.map((m) => m.role).lastIndexOf("user");
    if (idx < 0 || loading) return;
    sendMessage(messages[idx].text, messages.slice(0, idx));
  };

  // Auto-send the seeded prompt once, only when starting a fresh thread — if a
  // saved chat already exists for this topic, don't post anything automatically.
  useEffect(() => {
    if (apiKey && geminiInitialPrompt && modelsReady && messages.length === 0 && !autoSentRef.current) {
      autoSentRef.current = true;
      sendMessage(geminiInitialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, geminiInitialPrompt, modelsReady]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ---- Selection / save-to-resources ----
  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelected(new Set());
    setNotice(null);
  };

  const toggleSelected = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Long-press a bubble to enter selection mode (WhatsApp-style, mobile).
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const startPress = (i: number) => {
    longPressedRef.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      setSelectMode(true);
      toggleSelected(i);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
    }, 450);
  };
  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  // Tap handler: ignore the click that fires right after a long-press fired.
  const onMessageClick = (i: number) => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (selectMode) toggleSelected(i);
  };

  // Desktop: double-click a bubble to enter selection mode and select it.
  const selectViaDoubleClick = (i: number) => {
    setSelectMode(true);
    setSelected((prev) => new Set(prev).add(i));
    if (typeof window !== "undefined") window.getSelection()?.removeAllRanges();
  };

  // Concatenate the selected messages into one tidy markdown document, labelling
  // user turns "Question:" and model turns "Answer:", pairs split by a rule.
  const buildResourceMarkdown = (indices: number[]): string => {
    const blocks: string[] = [];
    indices.forEach((i, n) => {
      const m = messages[i];
      if (!m || !m.text.trim()) return;
      const prevWasModel = n > 0 && messages[indices[n - 1]]?.role === "model";
      if (m.role === "user") {
        if (prevWasModel) blocks.push("---");
        blocks.push(`**Question:** ${m.text.trim()}`);
      } else {
        blocks.push(`**Answer:**\n\n${m.text.trim()}`);
      }
    });
    return blocks.join("\n\n");
  };

  // Save the given messages as one TEXT resource on the current topic.
  const saveIndicesToResources = async (indices: number[], fromSelection: boolean) => {
    if (saving) return;
    if (!currentTopicId) {
      setNotice("Open Gemini from a topic page to save messages there.");
      return;
    }
    if (!username) {
      setNotice("Set a username (top-right menu) before saving.");
      return;
    }
    if (!indices.length) {
      setNotice("Nothing to save yet.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const md = buildResourceMarkdown(indices);
      const html = withMarker(markdownToHtml(md));

      // Name from the first question, else the topic.
      const firstUser = indices.map((i) => messages[i]).find((m) => m?.role === "user");
      const baseName = (firstUser?.text || currentTopicName || "AI notes").trim();
      const name = `AI: ${baseName.slice(0, 60)}${baseName.length > 60 ? "…" : ""}`;

      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contentType: "TEXT",
          textContent: html,
          topicId: currentTopicId,
          userId,
          username,
        }),
      });

      if (!res.ok) throw new Error("save failed");
      router.refresh();
      if (fromSelection) {
        setSelectMode(false);
        setSelected(new Set());
      }
      setNotice(`Saved ${indices.length} message${indices.length > 1 ? "s" : ""} to resources ✓`);
    } catch {
      setNotice("Couldn't save to resources. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveSelectedToResources = () =>
    saveIndicesToResources([...selected].sort((a, b) => a - b), true);

  const saveWholeChat = () => {
    setMenuOpen(false);
    saveIndicesToResources(messages.map((_, i) => i), false);
  };

  // ---- Prompt editor ----
  const openPromptEditor = () => {
    setPromptDraft(getPromptTemplate());
    setEditingPrompt(true);
  };

  const savePrompt = () => {
    setPromptTemplate(promptDraft.trim() || DEFAULT_PROMPT_TEMPLATE);
    setEditingPrompt(false);
  };

  // ---- Setup screen: no key stored yet ----
  if (!apiKey) {
    return (
      <div className="relative h-full bg-white flex flex-col">
        <ChatHeader title="Ask Gemini" onClose={onClose} />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-md mx-auto">
            <div className="mb-5 flex items-center gap-3">
              <SparkleIcon className="w-7 h-7 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Connect your Gemini key</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              This chat runs on <strong>your own</strong> Gemini API key, so it uses your
              account&apos;s free quota and plan — not ours.
            </p>

            <ol className="text-sm text-gray-700 space-y-2 mb-5 list-decimal pl-5">
              <li>
                Open{" "}
                <a href={API_KEYS_URL} target="_blank" rel="noopener noreferrer"
                  className="text-purple-600 font-medium hover:underline">
                  aistudio.google.com/api-keys
                </a>
              </li>
              <li>Sign in with the Google account whose plan you want to use.</li>
              <li>Click <strong>Create API key</strong> and copy it.</li>
              <li>Paste it below.</li>
            </ol>

            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              placeholder="Paste API key (starts with AIza…)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />

            <button
              type="button"
              onClick={saveKey}
              disabled={!keyInput.trim()}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-teal-400
                         text-white rounded-lg font-medium hover:shadow-lg transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save &amp; start chatting
            </button>

            <p className="mt-4 text-xs text-gray-400 leading-relaxed">
              Your key is stored only in this browser (localStorage) and is sent directly to
              Google when you chat. It never reaches our servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Chat screen ----
  return (
    <div className="relative h-full bg-white flex flex-col">
      <ChatHeader title="Ask Gemini" onClose={onClose}>
        <select
          value={model}
          onChange={(e) => changeModel(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700
                     focus:outline-none focus:ring-1 focus:ring-purple-400 max-w-[7rem] sm:max-w-[12rem]"
          title="Model"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Save the whole chat — prominent so it's easy to find. Label shows on
            desktop; mobile gets the icon only to stay compact. */}
        <button
          type="button"
          onClick={saveWholeChat}
          disabled={saving || messages.length === 0}
          title="Add chat to page"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium flex-shrink-0
                     bg-gradient-to-r from-purple-500 to-teal-400 text-white hover:shadow-md
                     transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>{saving ? "Adding…" : "Add to page"}</span>
        </button>

        <IconButton
          title={selectMode ? "Cancel selection" : "Select messages to save"}
          onClick={toggleSelectMode}
          active={selectMode}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </IconButton>

        <div className="relative">
          <IconButton title="More" onClick={() => setMenuOpen((v) => !v)} active={menuOpen}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </IconButton>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white rounded-lg shadow-xl border border-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openPromptEditor();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit prompt
                </button>
                <button
                  type="button"
                  onClick={refreshModels}
                  disabled={refreshingModels}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${refreshingModels ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshingModels ? "Refreshing…" : "Refresh model list"}
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear chat
                </button>
                <button
                  type="button"
                  onClick={clearKey}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Remove API key
                </button>
              </div>
            </>
          )}
        </div>
      </ChatHeader>

      {/* Prompt editor panel */}
      {editingPrompt && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-purple-50/50 p-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Auto-send prompt — <code className="bg-white px-1 rounded">{TOPIC_VAR}</code> and{" "}
            <code className="bg-white px-1 rounded">{PAPER_VAR}</code> are replaced with the current topic and paper
          </label>
          <textarea
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            rows={3}
            className="w-full resize-y px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={savePrompt}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-lg font-medium">
              Save
            </button>
            <button type="button" onClick={() => setPromptDraft(DEFAULT_PROMPT_TEMPLATE)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Reset to default
            </button>
            <button type="button" onClick={() => setEditingPrompt(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg ml-auto">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 px-6">
            <SparkleIcon className="w-10 h-10 mb-3 text-purple-300" />
            <p className="text-sm">Ask anything about what you&apos;re reading.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const isSel = selected.has(i);
          return (
            <div
              key={i}
              className={`flex items-start gap-2 ${
                m.role === "user" ? "justify-end" : "justify-start"
              } ${selectMode ? "cursor-pointer" : ""}`}
              onClick={() => onMessageClick(i)}
              onDoubleClick={() => selectViaDoubleClick(i)}
              onTouchStart={() => startPress(i)}
              onTouchEnd={cancelPress}
              onTouchMove={cancelPress}
              onContextMenu={(e) => {
                if (typeof window !== "undefined" && window.innerWidth < 640) e.preventDefault();
              }}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  checked={isSel}
                  readOnly
                  className="mt-2 w-4 h-4 accent-purple-600 flex-shrink-0"
                />
              )}
              <div
                className={`relative max-w-[85%] px-4 py-2.5 rounded-2xl select-none sm:select-text [-webkit-touch-callout:none] ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-br-sm whitespace-pre-wrap break-words text-sm" +
                      (isSel ? " ring-2 ring-purple-300" : "")
                    : "bg-white border text-gray-800 rounded-bl-sm " + (isSel ? "border-purple-400 ring-1 ring-purple-300" : "border-gray-200")
                }`}
              >
                {isSel && (
                  <span className="absolute inset-0 z-10 rounded-2xl bg-purple-500/25 pointer-events-none" />
                )}
                {m.role === "model" ? (
                  m.text ? (
                    <div className={MARKDOWN_CLASS} dangerouslySetInnerHTML={{ __html: markdownToHtml(m.text) }} />
                  ) : loading && i === messages.length - 1 ? (
                    <TypingDots />
                  ) : null
                ) : (
                  m.text
                )}
              </div>
            </div>
          );
        })}
      </div>

      {notice && (
        <div className="px-4 py-2 text-xs text-purple-700 bg-purple-50 border-t border-purple-100">
          {notice}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <span className="min-w-0 flex-1">{error}</span>
          {!loading && messages.some((m) => m.role === "user") && (
            <button
              type="button"
              onClick={retry}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          )}
        </div>
      )}

      {/* Selection action bar OR composer */}
      {selectMode ? (
        <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-white flex items-center gap-2">
          {currentTopicId ? (
            <>
              <span className="text-sm text-gray-500">{selected.size} selected</span>
              <button
                type="button"
                onClick={saveSelectedToResources}
                disabled={saving || selected.size === 0}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-lg
                           font-medium text-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Add to resources"}
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-400">Open Gemini from a topic page to save messages there.</span>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              rows={1}
              placeholder="Message Gemini…  (Enter to send, Shift+Enter for newline)"
              className="flex-1 resize-none max-h-32 px-3 py-2 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 p-2.5 bg-gradient-to-r from-purple-500 to-teal-400 text-white
                         rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatHeader({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-2 p-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 min-w-0">
        <SparkleIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
        <h2 className="font-semibold text-gray-900 truncate hidden sm:block">{title}</h2>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {children}
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function IconButton({
  title,
  onClick,
  active = false,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ? "bg-purple-100 text-purple-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16.5l-1.9-5.6L4.5 9l5.6-1.4L12 2zm6.5 11l.95 2.8L22 16.5l-2.55.95L18.5 20l-.95-2.55L15 16.5l2.55-.7.95-2.8z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
    </span>
  );
}
