"use client";

import { useMemo, useState } from "react";
import { byDateDesc, filters } from "@/content/projects";

/** Filter state for the archive. Shared by every direction; the markup is theirs. */
export function useArchive() {
  const [active, setActive] = useState("all");
  const visible = useMemo(() => {
    const filter = filters.find((f) => f.id === active) ?? filters[0];
    return byDateDesc.filter(filter.test);
  }, [active]);
  return { active, setActive, visible, filters, total: byDateDesc.length };
}
