import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { dirOf, getDict, getLocale } from "@/lib/i18n";
import { getArticleBySlug, getRelatedNews } from "@/lib/queries";
import { CategoryChip } from "@/components/Chips";
import { NewsCard } from "@/components/NewsCard";
import { SectionHeading } from "@/components/SectionHeading";
import { formatFullDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale();
  const article = await getArticleBySlug((await params).slug);
  if (!article) return { title: "News" };
  return { title: locale === "ar" ? article.titleAr : article.titleEn };
}

export default async function ArticlePage({ params }: Props) {
  const locale = await getLocale();
  const t = getDict(locale);
  const dir = dirOf(locale);
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const article = await getArticleBySlug((await params).slug);
  if (!article) notFound();

  const related = await getRelatedNews(article.id, 3);
  const title = locale === "ar" ? article.titleAr : article.titleEn;
  const content = (locale === "ar" ? article.contentAr : article.contentEn) ?? "";
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/news" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-mist transition-colors hover:text-pitch-400">
        <Arrow size={15} />
        {t.newsPage.backToNews}
      </Link>

      <article>
        <div className="flex flex-wrap items-center gap-3">
          <CategoryChip category={article.category} />
          <time className="text-xs font-semibold text-mist/70">
            {t.newsPage.publishedOn} · {formatFullDate(article.publishedAt, locale)}
          </time>
        </div>

        <h1 className="mt-4 text-3xl font-black leading-snug tracking-tight text-white sm:text-4xl">{title}</h1>

        {article.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt={title}
            className="mt-6 aspect-video w-full rounded-2xl border border-white/8 object-cover"
          />
        )}

        <div className="mt-7 space-y-5 text-[15.5px] leading-loose text-mist">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p>{locale === "ar" ? article.excerptAr : article.excerptEn}</p>
          )}
        </div>

        {article.sourceName && (
          <div className="surface mt-8 flex flex-wrap items-center gap-2 rounded-xl px-5 py-4 text-sm text-mist">
            <ExternalLink size={15} className="text-pitch-400" />
            <span className="font-bold text-white">{t.newsPage.source}:</span>
            {article.sourceUrl ? (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-pitch-400 underline-offset-4 hover:underline">
                {article.sourceName}
              </a>
            ) : (
              <span>{article.sourceName}</span>
            )}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={t.matchPage.relatedNews} />
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
