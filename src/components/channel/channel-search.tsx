import { useState } from "react";
import { Search, X } from "lucide-react";

interface ChannelSearchProps {
  onSearch: (query: string) => void;
}

export function ChannelSearch({ onSearch }: ChannelSearchProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mx-2 mb-1 flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:bg-background-primary hover:text-text-normal"
      >
        <Search size={14} />
        <span>Search channels</span>
      </button>
    );
  }

  return (
    <div className="mx-2 mb-1 flex items-center gap-1 rounded bg-background-tertiary px-2 py-1">
      <Search size={14} className="shrink-0 text-text-muted" />
      <input
        autoFocus
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search channels..."
        className="min-w-0 flex-1 bg-transparent text-xs text-text-normal placeholder-text-muted outline-none"
      />
      <button
        onClick={() => { setQuery(""); setExpanded(false); onSearch(""); }}
        className="shrink-0 text-text-muted hover:text-text-normal"
      >
        <X size={14} />
      </button>
    </div>
  );
}
