"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export function TagInput({ value, onChange, maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    if (value.includes(tag)) return;
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-full hover:bg-zinc-600 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {value.length < maxTags && (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag and press Enter"
          className="bg-zinc-900 border-zinc-700"
        />
      )}
      <p className="text-xs text-zinc-500">
        {value.length}/{maxTags} tags
      </p>
    </div>
  );
}
