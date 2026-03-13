import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface MessageContentProps {
  content: string;
}

// Parse message content into segments: text, code blocks, inline code, LaTeX
type Segment =
  | { type: "text"; value: string }
  | { type: "codeblock"; language: string; code: string }
  | { type: "inlinecode"; code: string }
  | { type: "latex-block"; expr: string }
  | { type: "latex-inline"; expr: string }
  | { type: "blockquote"; value: string };

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    // Check for code block ```
    const codeBlockMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      segments.push({
        type: "codeblock",
        language: codeBlockMatch[1] || "",
        code: codeBlockMatch[2]!,
      });
      remaining = remaining.slice(codeBlockMatch[0].length);
      continue;
    }

    // Check for block LaTeX $$...$$
    const latexBlockMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    if (latexBlockMatch) {
      segments.push({ type: "latex-block", expr: latexBlockMatch[1]! });
      remaining = remaining.slice(latexBlockMatch[0].length);
      continue;
    }

    // Check for inline code `...`
    const inlineCodeMatch = remaining.match(/^`([^`\n]+)`/);
    if (inlineCodeMatch) {
      segments.push({ type: "inlinecode", code: inlineCodeMatch[1]! });
      remaining = remaining.slice(inlineCodeMatch[0].length);
      continue;
    }

    // Check for inline LaTeX $...$
    const latexInlineMatch = remaining.match(/^\$([^\$\n]+)\$/);
    if (latexInlineMatch) {
      segments.push({ type: "latex-inline", expr: latexInlineMatch[1]! });
      remaining = remaining.slice(latexInlineMatch[0].length);
      continue;
    }

    // Find next special token
    const nextSpecial = remaining.search(/```|\$\$|\$|`/);
    if (nextSpecial === -1) {
      segments.push({ type: "text", value: remaining });
      break;
    } else if (nextSpecial === 0) {
      // Single char that didn't match a full pattern, treat as text
      segments.push({ type: "text", value: remaining[0]! });
      remaining = remaining.slice(1);
    } else {
      segments.push({ type: "text", value: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return segments;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(code.split("\n").length > 20);
  const lines = code.split("\n");
  const displayLines = collapsed ? lines.slice(0, 10) : lines;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/code relative my-1 rounded-md border border-background-tertiary bg-[#1e1e2e] text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-background-tertiary px-3 py-1">
        <span className="text-xs text-text-muted">
          {language || "plain text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-normal"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* Code body with line numbers */}
      <div className="overflow-x-auto p-3">
        <table className="w-full border-collapse">
          <tbody>
            {displayLines.map((line, i) => (
              <tr key={i} className="leading-5">
                <td className="select-none pr-4 text-right text-xs text-text-muted/50 align-top w-8">
                  {i + 1}
                </td>
                <td className="whitespace-pre font-mono text-text-normal">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Collapse toggle */}
      {lines.length > 20 && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-1 border-t border-background-tertiary py-1 text-xs text-text-muted hover:text-text-normal"
        >
          {collapsed ? (
            <>
              <ChevronDown size={12} /> Show {lines.length - 10} more lines
            </>
          ) : (
            <>
              <ChevronRight size={12} /> Collapse
            </>
          )}
        </button>
      )}
    </div>
  );
}

function LatexBlock({ expr }: { expr: string }) {
  // Render LaTeX as styled monospace (KaTeX would need npm package)
  return (
    <div className="my-1 rounded bg-[#1e1e2e] px-3 py-2 font-mono text-sm text-[#cdd6f4] overflow-x-auto">
      {expr}
    </div>
  );
}

function LatexInline({ expr }: { expr: string }) {
  return (
    <code className="rounded bg-[#1e1e2e] px-1.5 py-0.5 font-mono text-xs text-[#cdd6f4]">
      {expr}
    </code>
  );
}

// Render inline markdown: bold, italic, strikethrough, underline, spoilers, links, mentions
function InlineMarkdown({ text }: { text: string }) {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold + italic ***text***
    let match = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (match) {
      elements.push(<strong key={key++} className="font-bold"><em>{match[1]}</em></strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold **text**
    match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      elements.push(<strong key={key++} className="font-bold">{match[1]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Underline __text__
    match = remaining.match(/^__(.+?)__/);
    if (match) {
      elements.push(<u key={key++}>{match[1]}</u>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic *text* or _text_
    match = remaining.match(/^\*(.+?)\*/);
    if (!match) match = remaining.match(/^_(.+?)_/);
    if (match) {
      elements.push(<em key={key++}>{match[1]}</em>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    match = remaining.match(/^~~(.+?)~~/);
    if (match) {
      elements.push(<del key={key++} className="text-text-muted">{match[1]}</del>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Spoiler ||text||
    match = remaining.match(/^\|\|(.+?)\|\|/);
    if (match) {
      elements.push(<SpoilerText key={key++} text={match[1]!} />);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // URL auto-link
    match = remaining.match(/^(https?:\/\/[^\s<]+)/);
    if (match) {
      elements.push(
        <a
          key={key++}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-link hover:underline"
        >
          {match[1]}
        </a>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Find next special token
    const nextIdx = remaining.search(/\*\*\*|\*\*|__|\*|_|~~|\|\||https?:\/\//);
    if (nextIdx === -1) {
      elements.push(remaining);
      break;
    } else if (nextIdx === 0) {
      // Single char that didn't match a full pattern
      elements.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      elements.push(remaining.slice(0, nextIdx));
      remaining = remaining.slice(nextIdx);
    }
  }

  return <>{elements}</>;
}

function SpoilerText({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={cn(
        "cursor-pointer rounded px-0.5 transition-all duration-200",
        revealed
          ? "bg-background-tertiary/50 text-text-normal"
          : "bg-text-muted text-transparent hover:bg-text-muted/80"
      )}
    >
      {text}
    </span>
  );
}

export function MessageContent({ content }: MessageContentProps) {
  const [expanded, setExpanded] = useState(false);
  const segments = useMemo(() => parseContent(content), [content]);

  const lineCount = content.split("\n").length;
  const charCount = content.length;
  const shouldCollapse = !expanded && (lineCount > 15 || charCount > 2000);

  return (
    <div className="relative">
      <div
        className={cn(
          "text-sm text-text-normal leading-[1.375rem] break-words",
          shouldCollapse && "max-h-[300px] overflow-hidden"
        )}
      >
        {segments.map((seg, i) => {
          switch (seg.type) {
            case "text":
              return (
                <span key={i} className="whitespace-pre-wrap">
                  <InlineMarkdown text={seg.value} />
                </span>
              );
            case "codeblock":
              return <CodeBlock key={i} language={seg.language} code={seg.code} />;
            case "inlinecode":
              return (
                <code
                  key={i}
                  className="rounded bg-background-tertiary px-1.5 py-0.5 font-mono text-xs text-text-normal"
                >
                  {seg.code}
                </code>
              );
            case "latex-block":
              return <LatexBlock key={i} expr={seg.expr} />;
            case "latex-inline":
              return <LatexInline key={i} expr={seg.expr} />;
          }
        })}
      </div>

      {/* Collapse/expand toggle for long messages */}
      {(lineCount > 15 || charCount > 2000) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "text-xs font-medium text-text-link hover:underline",
            shouldCollapse &&
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background-primary via-background-primary to-transparent pt-8 pb-1 text-center"
          )}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
