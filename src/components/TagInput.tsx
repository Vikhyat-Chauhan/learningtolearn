"use client";

import { useMemo, useRef, useState } from "react";
import { MAX_TAGS } from "@/lib/tags";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Previously-used tags, offered as autosuggestions. */
  suggestions: string[];
  id?: string;
  placeholder?: string;
};

// A controlled multi-tag input: existing tags render as removable chips, and a
// text field commits new tags on Enter/comma (Backspace on an empty field removes
// the last chip). An autosuggest dropdown surfaces previously-used tags. Dedupes
// case-insensitively against the current value. Dependency-free, plain React.
export default function TagInput({ value, onChange, suggestions, id, placeholder }: Props) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasTag = (tag: string) =>
    value.some((t) => t.toLowerCase() === tag.toLowerCase());

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || hasTag(tag) || value.length >= MAX_TAGS) return;
    onChange([...value, tag]);
    setDraft("");
    setOpen(false);
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  // Suggestions not already applied, matching the current draft (prefix-insensitive).
  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !hasTag(s))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, suggestions, value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape" && open) {
      // Swallow Escape so the surrounding panel doesn't close while the
      // suggestion list is open.
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-input-field" onClick={() => inputRef.current?.focus()}>
        {value.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button
              type="button"
              className="tag-chip-remove"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          className="tag-input-text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={value.length === 0 ? placeholder : ""}
          autoComplete="off"
          disabled={value.length >= MAX_TAGS}
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="tag-suggestions">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="tag-suggestion"
                // onMouseDown (not onClick) so it fires before the input's blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
