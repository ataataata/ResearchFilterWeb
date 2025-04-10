"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableAuthorsProps {
  authors: string;
  threshold?: number;
}

export function ExpandableAuthors({ authors, threshold = 3 }: ExpandableAuthorsProps) {
  const authorList = authors.split(",").map(a => a.trim()).filter(a => a.length > 0);
  const [expanded, setExpanded] = useState(false);

  if (authorList.length <= threshold) {
    return <span>{authors}</span>;
  }

  if (expanded) {
    return (
      <div className="flex flex-col gap-1">
        <span>{authorList.join(", ")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="self-start text-blue-600 hover:underline flex items-center gap-1"
        >
          <ChevronUp size={16} /> Show Less
        </Button>
      </div>
    );
  } else {
    const displayedAuthors = authorList.slice(0, threshold).join(", ");
    const remainingCount = authorList.length - threshold;
    return (
      <div className="flex flex-col gap-1">
        <span>{displayedAuthors}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className="self-start text-blue-600 hover:underline flex items-center gap-1"
        >
          <ChevronDown size={16} /> +{remainingCount} More
        </Button>
      </div>
    );
  }
}
