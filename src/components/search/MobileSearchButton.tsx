"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/SearchInput";

export function MobileSearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Full-width mobile search overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-3">
            <div className="flex-1">
              <SearchInput variant="header" className="block w-full [&_input]:w-full" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
