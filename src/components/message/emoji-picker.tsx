"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "Gestures": ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏"],
  "Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟"],
  "Objects": ["🔥","⭐","🌟","✨","⚡","💫","🎉","🎊","🎈","🎁","🏆","🥇","🥈","🥉","🏅","🎖️","📌","📍","🔔","🔕","📣","📢","💡","🔮","🎯","🎪","🎭","🎨","🎬","🎤","🎧","🎵","🎶","🎹","🎸","🎻","🎺","🎷","🥁","💻","⌨️","🖥️","📱","📷","📹","📺","📻","⏰","⏳","📡","🔋","🔌"],
  "Symbols": ["✅","❌","❓","❗","‼️","⁉️","💯","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔶","🔷","🔸","🔹","▶️","⏸️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","🔀","🔁","🔂","➕","➖","➗","✖️","♾️","💲","💱","🔃","🔄","🔙","🔚","🔛","🔜","🔝"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Smileys");

  const allEmojis = useMemo(
    () => Object.values(EMOJI_CATEGORIES).flat(),
    []
  );

  const filteredEmojis = useMemo(() => {
    if (!search) return EMOJI_CATEGORIES[activeCategory] ?? [];
    return allEmojis.filter((e) => e.includes(search));
  }, [search, activeCategory, allEmojis]);

  return (
    <div className="w-[352px] rounded-lg border border-background-tertiary bg-background-floating shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-background-tertiary p-2">
        <div className="flex flex-1 items-center gap-1.5 rounded bg-background-tertiary px-2 py-1">
          <Search size={14} className="text-text-muted" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="flex-1 bg-transparent text-sm text-text-normal placeholder-text-muted outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-muted hover:text-text-normal">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      {!search && (
        <div className="flex gap-1 border-b border-background-tertiary px-2 py-1">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded px-2 py-0.5 text-xs ${
                activeCategory === cat
                  ? "bg-brand text-white"
                  : "text-text-muted hover:bg-background-primary hover:text-text-normal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="grid max-h-[256px] grid-cols-9 gap-0.5 overflow-y-auto p-2 scrollbar-thin">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded text-xl hover:bg-background-primary"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
