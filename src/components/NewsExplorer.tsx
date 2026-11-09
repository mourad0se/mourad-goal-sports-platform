"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { NewsCard } from "@/components/NewsCard";
import { EmptyState } from "@/components/EmptyState";
import type { NewsDTO } from "@/lib/queries";

const CATEGORIES = ["football", "international", "transfers", "competitions", "events"] as const;

export function NewsExplorer({ articles, withFilters = true }: { articles: NewsDTO[]; withFilters?: boolean }) {
  const { t } = useI18n();
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(
    () => (cat === "all" ? articles : articles.filter((a) => a.category === cat)),
    [articles, cat],
  );

  return (
    <div>
      {withFilters && (
        <div className="mb-7 flex flex-wrap gap-2.5">
          <button data-active={cat === "all"} onClick={() => setCat("all")} className="chip">
            {t.common.all}
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} data-active={cat === c} onClick={() => setCat(c)} className="chip">
              {t.category[c]}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={t.common.noResults} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => (
            <NewsCard key={a.id} article={a} featured={i === 0 && filtered.length > 2} />
          ))}
        </div>
      )}
    </div>
  );
}
