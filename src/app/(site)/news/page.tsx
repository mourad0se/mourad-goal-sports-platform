import { Newspaper } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getLatestNews } from "@/lib/queries";
import { NewsExplorer } from "@/components/NewsExplorer";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const articles = await getLatestNews(30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitch-500/12 text-pitch-400 ring-1 ring-pitch-500/30">
          <Newspaper size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{t.newsPage.title}</h1>
          <p className="mt-1 text-sm text-mist">{t.newsPage.subtitle}</p>
        </div>
      </div>

      <NewsExplorer articles={articles} />
    </div>
  );
}
