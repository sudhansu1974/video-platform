import { createElement } from "react";

/**
 * Highlight search terms in text by wrapping matches in <mark> elements.
 * Returns React elements (safe, no dangerouslySetInnerHTML).
 */
export function highlightSearchTerms(
  text: string,
  query: string
): React.ReactNode {
  if (!query.trim()) return text;

  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(pattern);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (pattern.test(part)) {
      return createElement(
        "mark",
        {
          key: i,
          className: "bg-blue-500/30 text-zinc-50 rounded-sm px-0.5",
        },
        part
      );
    }
    return part;
  });
}

/**
 * Truncate text with context around the first matching query term.
 * Adds ellipsis at start/end if truncated.
 */
export function truncateWithContext(
  text: string,
  query: string,
  maxLength: number = 200
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Find first occurrence of any query word
  let firstIndex = -1;
  for (const word of words) {
    const idx = text.toLowerCase().indexOf(word.toLowerCase());
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    // No match found, return start of text
    return text.slice(0, maxLength) + "...";
  }

  // Center the window around the first match
  const halfWindow = Math.floor(maxLength / 2);
  let start = Math.max(0, firstIndex - halfWindow);
  const end = Math.min(text.length, start + maxLength);

  // Adjust start if end is at the boundary
  if (end === text.length) {
    start = Math.max(0, end - maxLength);
  }

  let result = text.slice(start, end);

  // Try to break at word boundaries
  if (start > 0) {
    const spaceIdx = result.indexOf(" ");
    if (spaceIdx !== -1 && spaceIdx < 20) {
      result = result.slice(spaceIdx + 1);
    }
    result = "..." + result;
  }

  if (end < text.length) {
    const lastSpaceIdx = result.lastIndexOf(" ");
    if (lastSpaceIdx !== -1 && lastSpaceIdx > result.length - 20) {
      result = result.slice(0, lastSpaceIdx);
    }
    result = result + "...";
  }

  return result;
}
