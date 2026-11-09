"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { CategoryChip } from "@/components/Chips";
import { formatFullDate } from "@/lib/utils";
import type { NewsDTO } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function NewsCard({
  article,
  featured = false,
}: {
  article: NewsDTO;
  featured?: boolean;
}) {
  const { t, locale, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const title = locale === "ar" ? article.titleAr : article.titleEn;
  const excerpt = locale === "ar" ? article.excerptAr : article.excerptEn;

  return (
    <Link
      href={`/news/${article.slug}`}
      className={cn(
        "surface surface-hover group flex flex-col overflow-hidden rounded-2xl",
        featured && "md:col-span-2 md:flex-row",
      )}
    >
      <div className={cn("relative overflow-hidden bg-navy-800", featured ? "md:w-1/2" : "")}>
        {article.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt={title}
            loading="lazy"
            className={cn(
              "w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]",
              featured ? "aspect-video h-full md:aspect-auto" : "aspect-video",
            )}
          />
        ) : (
          <div className={cn("w-full bg-gradient-to-br from-pitch-600/30 to-navy-800", featured ? "h-full min-h-48" : "aspect-video")} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-950/70 to-transparent" />
        <div className="absolute start-3 top-3">
          <CategoryChip category={article.category} />
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col p-5", featured && "justify-center md:p-7")}>
        <time className="text-[11px] font-semibold text-mist/70">
          {formatFullDate(article.publishedAt, locale)}
        </time>
        <h3
          className={cn(
            "mt-2 font-extrabold leading-snug text-white transition-colors group-hover:text-pitch-400",
            featured ? "text-xl line-clamp-3 md:text-2xl" : "text-[15px] line-clamp-2",
          )}
        >
          {title}
        </h3>
        {excerpt && (
          <p className={cn("mt-2 text-sm leading-relaxed text-mist", featured ? "line-clamp-3" : "line-clamp-2")}>
            {excerpt}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2 pt-1 text-xs">
          {article.sourceName ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-mist/80">
              <ExternalLink size={12} className="shrink-0" />
              <span className="truncate">{article.sourceName}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-pitch-400">
            {t.common.readMore}
            <Arrow size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
