import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Filter, Hash, User, Calendar, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedTimestamp: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

interface SearchPanelProps {
  guildId: string;
  onClose: () => void;
  onNavigate: (channelId: string, messageId: string) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-brand/30 text-brand-light rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchPanel({ guildId, onClose, onNavigate }: SearchPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [dateBefore, setDateBefore] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (channelId) params.set("channelId", channelId);
    if (authorId) params.set("authorId", authorId);
    if (dateBefore) params.set("before", dateBefore);
    return params.toString();
  }, [debouncedQuery, channelId, authorId, dateBefore]);

  const { data, isLoading, isFetching } = useQuery<SearchResponse>({
    queryKey: ["search", guildId, queryParams],
    queryFn: () => api.get(`/guilds/${guildId}/search?${queryParams}`),
    enabled: debouncedQuery.length > 0,
    staleTime: 30_000,
  });

  return (
    <div className={cn(
      "w-[420px] h-full flex flex-col",
      "bg-background-secondary border-l border-surface-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border/50">
        <h2 className="text-lg font-semibold text-header-primary">Search</h2>
        <button
          onClick={onClose}
          className={cn(
            "p-1.5 rounded-lg",
            "text-text-muted transition-all duration-150",
            "hover:bg-background-hover hover:text-text-normal",
            "active:scale-95"
          )}
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search
            size={18}
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2",
              "text-text-muted transition-colors duration-200",
              inputValue && "text-brand-light"
            )}
          />
          <input
            type="text"
            aria-label="Search messages"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search messages..."
            className={cn(
              "input pl-10 pr-10",
              "bg-background-tertiary focus:bg-background-primary"
            )}
            autoFocus
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                setDebouncedQuery("");
              }}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "p-1 rounded-md text-text-muted",
                "transition-colors duration-150",
                "hover:bg-background-hover hover:text-text-normal"
              )}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 text-sm",
            "text-text-muted transition-colors duration-150",
            "hover:text-text-normal"
          )}
        >
          <Filter size={14} />
          {showFilters ? "Hide filters" : "Show filters"}
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              showFilters && "rotate-180"
            )}
          />
        </button>

        {/* Filters */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-smooth",
            showFilters ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-2 p-3 bg-background-tertiary rounded-xl border border-surface-border">
            <FilterInput
              icon={<Hash size={14} />}
              value={channelId}
              onChange={setChannelId}
              placeholder="Channel ID"
            />
            <FilterInput
              icon={<User size={14} />}
              value={authorId}
              onChange={setAuthorId}
              placeholder="User ID"
            />
            <FilterInput
              icon={<Calendar size={14} />}
              value={dateBefore}
              onChange={setDateBefore}
              placeholder=""
              type="date"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin">
        {/* Loading */}
        {(isLoading || isFetching) && debouncedQuery && (
          <div className="flex items-center justify-center py-8">
            <div className="spinner-brand h-6 w-6" />
          </div>
        )}

        {/* Total Count */}
        {data && !isFetching && (
          <p className="text-xs text-text-muted mb-3 animate-fade-in">
            {data.totalCount} {data.totalCount === 1 ? "result" : "results"} found
          </p>
        )}

        {/* No results */}
        {data && data.results.length === 0 && !isFetching && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted animate-fade-in-up">
            <div className="h-16 w-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <Search size={32} className="opacity-40" />
            </div>
            <p className="text-base font-medium text-header-secondary">No results found</p>
            <p className="text-sm mt-1 text-center">
              Try a different search term or adjust your filters
            </p>
          </div>
        )}

        {/* Results List */}
        {data && data.results.length > 0 && !isFetching && (
          <div className="space-y-2">
            {data.results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => onNavigate(result.channelId, result.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl",
                  "bg-surface border border-transparent",
                  "transition-all duration-200",
                  "hover:bg-surface-light hover:border-surface-border",
                  "hover:-translate-y-0.5 hover:shadow-card",
                  "group animate-fade-in-up"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-muted font-medium">
                    {result.authorId.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(result.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-text-normal line-clamp-3 group-hover:text-header-primary transition-colors">
                  {highlightMatch(result.content, debouncedQuery)}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Initial state */}
        {!debouncedQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <Search size={32} className="opacity-40" />
            </div>
            <p className="text-sm">Enter a search term to find messages</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterInput({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "date";
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted shrink-0">{icon}</span>
      <input
        type={type}
        aria-label={placeholder || type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex-1 px-3 py-1.5 rounded-lg",
          "bg-background-primary text-text-normal text-sm",
          "border border-transparent",
          "transition-all duration-200",
          "placeholder:text-text-muted",
          "focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
        )}
      />
    </div>
  );
}
