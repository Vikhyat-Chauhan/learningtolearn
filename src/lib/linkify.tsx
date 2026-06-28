import { Fragment, type ReactNode } from "react";

// Turns a plain string into React nodes, making links clickable at display time.
// Notes/titles are stored as the raw text the user typed or pasted; we never store
// markup. Two link forms are recognised, in priority order:
//   1. Markdown links — [label](https://…) — rendered with the label as the text.
//   2. Bare URLs — https://… , http://… , or www.… — rendered as-is (www. gets an
//      https:// scheme prepended for the href).
// One global regex alternates between the two so a single left-to-right pass keeps
// markdown links from being half-eaten by the bare-URL rule.
const LINK_RE =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/g;

// Bare URLs commonly sit at the end of a sentence ("see https://x.com.") or inside
// parens; trailing punctuation and an unbalanced ")" shouldn't be part of the link.
function trimTrailingPunctuation(url: string): string {
  let end = url.length;
  while (end > 0) {
    const ch = url[end - 1];
    if (".,;:!?".includes(ch)) {
      end -= 1;
    } else if (ch === ")" && !url.slice(0, end).includes("(")) {
      end -= 1;
    } else {
      break;
    }
  }
  return url.slice(0, end);
}

function anchor(href: string, text: string, key: number): ReactNode {
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      // Stop the click from bubbling to a clickable container the link sits inside.
      onClick={(e) => e.stopPropagation()}
    >
      {text}
    </a>
  );
}

type Props = { text: string | null | undefined };

export function Linkify({ text }: Props): ReactNode {
  if (!text) return null;
  // Cheap early-out: most notes have no links at all.
  if (!text.includes("http") && !text.includes("www.")) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  LINK_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = LINK_RE.exec(text)) !== null) {
    const [whole, mdLabel, mdUrl, bareHttp, bareWww] = match;
    const start = match.index;

    // Text before this match.
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    if (mdUrl) {
      nodes.push(anchor(mdUrl, mdLabel, key++));
      lastIndex = start + whole.length;
    } else {
      const raw = bareHttp ?? bareWww ?? "";
      const trimmed = trimTrailingPunctuation(raw);
      const href = trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;
      nodes.push(anchor(href, trimmed, key++));
      // Keep any punctuation we trimmed off as following text.
      lastIndex = start + trimmed.length;
      LINK_RE.lastIndex = lastIndex;
    }
  }

  // Trailing remainder.
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return <Fragment>{nodes}</Fragment>;
}
