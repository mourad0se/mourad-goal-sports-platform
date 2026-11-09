/**
 * Database seed — realistic bilingual demo data.
 * Streams are well-known, openly licensed test HLS endpoints
 * (Mux demo / Apple HLS samples / Blender Foundation content).
 * Run: npx tsx src/db/seed.ts
 */
import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { db, pool } from "./index";
import {
  adSettings,
  competitions,
  matches,
  newsArticles,
  siteSettings,
  sports,
  streams,
  teams,
  users,
} from "./schema";

const HLS_MUX = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const HLS_APPLE =
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_4x3/gear1/prog_index.m3u8";
const HLS_TOS =
  "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8";

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000);

async function main() {
  const [{ count: userCount }] = await db.select({ count: count() }).from(users);
  if (userCount > 0) {
    console.log("Seed skipped: database already populated (users table is not empty).");
    await pool.end();
    return;
  }

  /* ---- Admin user ---- */
  const email = (process.env.ADMIN_EMAIL ?? "admin@mourad-goal.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "MouradGoal#2025";
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, name: "Mourad", passwordHash, role: "admin" });
  console.log(`Admin created: ${email}`);

  /* ---- Sports ---- */
  const [football, basketball, tennis, boxing] = await db
    .insert(sports)
    .values([
      { slug: "football", nameAr: "كرة القدم", nameEn: "Football", icon: "trophy", sortOrder: 0 },
      { slug: "basketball", nameAr: "كرة السلة", nameEn: "Basketball", icon: "medal", sortOrder: 1 },
      { slug: "tennis", nameAr: "التنس", nameEn: "Tennis", icon: "target", sortOrder: 2 },
      { slug: "boxing", nameAr: "الملاكمة", nameEn: "Boxing", icon: "swords", sortOrder: 3 },
    ])
    .returning();

  /* ---- Competitions ---- */
  const [laliga, epl, ucl, saudi, egy, nba, atp, wbn] = await db
    .insert(competitions)
    .values([
      { sportId: football.id, nameAr: "الدوري الإسباني", nameEn: "La Liga", country: "Spain", color: "#FF4B44" },
      { sportId: football.id, nameAr: "الدوري الإنجليزي الممتاز", nameEn: "Premier League", country: "England", color: "#7C4DFF" },
      { sportId: football.id, nameAr: "دوري أبطال أوروبا", nameEn: "UEFA Champions League", country: "Europe", color: "#2F6BFF" },
      { sportId: football.id, nameAr: "دوري روشن السعودي", nameEn: "Saudi Pro League", country: "Saudi Arabia", color: "#16C784" },
      { sportId: football.id, nameAr: "الدوري المصري الممتاز", nameEn: "Egyptian Premier League", country: "Egypt", color: "#E53935" },
      { sportId: basketball.id, nameAr: "الدوري الأمريكي للسلة", nameEn: "NBA", country: "USA", color: "#F97316" },
      { sportId: tennis.id, nameAr: "بطولة الماسترز", nameEn: "ATP Masters 1000", country: "International", color: "#38BDF8" },
      { sportId: boxing.id, nameAr: "ليلة الملاكمة العالمية", nameEn: "World Boxing Night", country: "International", color: "#FACC15" },
    ])
    .returning();

  /* ---- Teams ---- */
  const teamDefs = [
    { ar: "ريال مدريد", en: "Real Madrid", code: "RMA", color: "#C9A227", country: "Spain" },
    { ar: "برشلونة", en: "FC Barcelona", code: "BAR", color: "#A50044", country: "Spain" },
    { ar: "مانشستر سيتي", en: "Manchester City", code: "MCI", color: "#6CABDD", country: "England" },
    { ar: "ليفربول", en: "Liverpool FC", code: "LIV", color: "#C8102E", country: "England" },
    { ar: "باريس سان جيرمان", en: "Paris Saint-Germain", code: "PSG", color: "#004170", country: "France" },
    { ar: "بايرن ميونخ", en: "Bayern München", code: "BAY", color: "#DC052D", country: "Germany" },
    { ar: "إنتر ميلان", en: "Inter Milan", code: "INT", color: "#0068A8", country: "Italy" },
    { ar: "الهلال", en: "Al Hilal", code: "HIL", color: "#1034A6", country: "Saudi Arabia" },
    { ar: "النصر", en: "Al Nassr", code: "NSR", color: "#D9A514", country: "Saudi Arabia" },
    { ar: "الأهلي", en: "Al Ahly", code: "AHL", color: "#D20A11", country: "Egypt" },
    { ar: "الزمالك", en: "Zamalek SC", code: "ZAM", color: "#B71C1C", country: "Egypt" },
    { ar: "لوس أنجلوس ليكرز", en: "LA Lakers", code: "LAL", color: "#552583", country: "USA" },
    { ar: "بوسطن سيلتكس", en: "Boston Celtics", code: "BOS", color: "#007A33", country: "USA" },
    { ar: "كارلوس ألكاراز", en: "Carlos Alcaraz", code: "ALC", color: "#0EA5E9", country: "Spain" },
    { ar: "يانيك سينر", en: "Jannik Sinner", code: "SIN", color: "#10B981", country: "Italy" },
    { ar: "أولكسندر أوسيك", en: "Oleksandr Usyk", code: "USK", color: "#2563EB", country: "Ukraine" },
    { ar: "تايسون فيوري", en: "Tyson Fury", code: "FUR", color: "#9333EA", country: "England" },
  ] as const;

  const insertedTeams = await db
    .insert(teams)
    .values(
      teamDefs.map((t) => ({ nameAr: t.ar, nameEn: t.en, shortCode: t.code, color: t.color, country: t.country })),
    )
    .returning();
  const T = Object.fromEntries(insertedTeams.map((t) => [t.shortCode, t.id])) as Record<string, number>;

  /* ---- Matches ---- */
  type MatchDef = {
    sport: { id: number };
    comp: { id: number };
    home: string;
    away: string;
    kickoff: Date;
    status: "scheduled" | "live" | "finished" | "postponed";
    hs?: number;
    as?: number;
    venue: string;
    featured: boolean;
    dAr: string | null;
    dEn: string | null;
  };
  const matchDefs: MatchDef[] = [
    {
      sport: football, comp: laliga, home: "RMA", away: "BAR",
      kickoff: hoursFromNow(-0.9), status: "live" as const, hs: 2, as: 1,
      venue: "Santiago Bernabéu", featured: true,
      dAr: "قمة الكلاسيكو المنتظرة بين ريال مدريد وبرشلونة في صراع مباشر على صدارة الدوري الإسباني. مواجهة تحمل دائماً نكهة خاصة وتاريخاً حافلاً بين العملاقين.",
      dEn: "The El Clásico showdown — Real Madrid against Barcelona in a direct battle at the top of La Liga. A fixture that always delivers drama between the two giants.",
    },
    {
      sport: football, comp: saudi, home: "HIL", away: "NSR",
      kickoff: hoursFromNow(-0.4), status: "live" as const, hs: 0, as: 0,
      venue: "Kingdom Arena", featured: false,
      dAr: "ديربي الرياض بين الهلال والنصر في قمة دوري روشن السعودي.",
      dEn: "The Riyadh derby — Al Hilal face Al Nassr in the Saudi Pro League headline clash.",
    },
    {
      sport: basketball, comp: nba, home: "LAL", away: "BOS",
      kickoff: hoursFromNow(-1.1), status: "live" as const, hs: 78, as: 74,
      venue: "Crypto.com Arena", featured: false,
      dAr: "كلاسيكو كرة السلة الأمريكية بين ليكرز وسيلتكس.",
      dEn: "The NBA's greatest rivalry — Lakers vs Celtics under the lights.",
    },
    {
      sport: football, comp: epl, home: "MCI", away: "LIV",
      kickoff: hoursFromNow(2.2), status: "scheduled" as const,
      venue: "Etihad Stadium", featured: false,
      dAr: "قمّة إنجليزية نارية بين مانشستر سيتي وليفربول.",
      dEn: "A heavyweight Premier League clash between Manchester City and Liverpool.",
    },
    {
      sport: football, comp: egy, home: "AHL", away: "ZAM",
      kickoff: hoursFromNow(4), status: "scheduled" as const,
      venue: "Cairo International Stadium", featured: false,
      dAr: "قمة القاهرة بين الأهلي والزمالك في ديربي لا يقبل القسمة على اثنين.",
      dEn: "The Cairo derby — Al Ahly meet Zamalek in Egypt's biggest fixture.",
    },
    {
      sport: tennis, comp: atp, home: "ALC", away: "SIN",
      kickoff: hoursFromNow(6), status: "scheduled" as const,
      venue: "Centre Court", featured: false,
      dAr: "نهائي مرتقب يجمع ألكاراز وسينر في بطولة الماسترز.",
      dEn: "A blockbuster Masters final: Alcaraz against Sinner.",
    },
    {
      sport: football, comp: ucl, home: "BAY", away: "INT",
      kickoff: hoursFromNow(-5), status: "finished" as const, hs: 1, as: 2,
      venue: "Allianz Arena", featured: false,
      dAr: "إنتر يحسم مواجهة أليانز أرينا بثنائية في دوري الأبطال.",
      dEn: "Inter took the points at the Allianz Arena with a 2-1 win.",
    },
    {
      sport: football, comp: ucl, home: "PSG", away: "MCI",
      kickoff: hoursFromNow(-7), status: "finished" as const, hs: 2, as: 2,
      venue: "Parc des Princes", featured: false,
      dAr: null, dEn: null,
    },
    {
      sport: boxing, comp: wbn, home: "USK", away: "FUR",
      kickoff: hoursFromNow(26), status: "scheduled" as const,
      venue: "Kingdom Arena, Riyadh", featured: false,
      dAr: "نزال القرن على الألقاب الموحدة للوزن الثقيل بين أوسيك وفيوري.",
      dEn: "The undisputed heavyweight title fight — Usyk vs Fury.",
    },
    {
      sport: football, comp: epl, home: "BAY", away: "LIV",
      kickoff: hoursFromNow(30), status: "postponed" as const,
      venue: "Anfield", featured: false, dAr: null, dEn: null,
    },
  ];

  const insertedMatches = await db
    .insert(matches)
    .values(
      matchDefs.map((m) => ({
        sportId: m.sport.id,
        competitionId: m.comp.id,
        homeTeamId: T[m.home],
        awayTeamId: T[m.away],
        kickoffAt: m.kickoff,
        status: m.status,
        homeScore: m.hs ?? null,
        awayScore: m.as ?? null,
        venue: m.venue,
        descriptionAr: m.dAr,
        descriptionEn: m.dEn,
        featured: m.featured,
      })),
    )
    .returning({ id: matches.id });

  const [clasico, derby, nbaGame] = insertedMatches;

  /* ---- Authorized demo streams ---- */
  await db.insert(streams).values([
    {
      matchId: clasico.id, label: "Main · HD", type: "hls", url: HLS_MUX, priority: 0, enabled: true,
      startsAt: hoursFromNow(-1), endsAt: hoursFromNow(3),
    },
    {
      matchId: clasico.id, label: "Backup", type: "hls", url: HLS_TOS, priority: 1, enabled: true,
    },
    {
      matchId: derby.id, label: "Main · HD", type: "hls", url: HLS_APPLE, priority: 0, enabled: true,
      startsAt: hoursFromNow(-1), endsAt: hoursFromNow(3),
    },
    {
      matchId: nbaGame.id, label: "Main · HD", type: "hls", url: HLS_MUX, priority: 0, enabled: true,
    },
    {
      matchId: insertedMatches[3].id, label: "Main · HD", type: "hls", url: HLS_MUX, priority: 0, enabled: false,
      unavailableMessageAr: "يبدأ البث قبل انطلاق المباراة بـ 30 دقيقة.",
      unavailableMessageEn: "The broadcast starts 30 minutes before kickoff.",
    },
  ]);

  /* ---- News (original bilingual blurbs + attributed sources) ---- */
  const img = {
    clasico: "https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    stadium: "https://images.pexels.com/photos/28827841/pexels-photo-28827841.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    night: "https://images.pexels.com/photos/36862525/pexels-photo-36862525.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    pitch: "https://images.pexels.com/photos/16826138/pexels-photo-16826138.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    basket: "https://images.pexels.com/photos/31177167/pexels-photo-31177167.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tennis: "https://images.pexels.com/photos/5739200/pexels-photo-5739200.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    boxing: "https://images.pexels.com/photos/40547418/pexels-photo-40547418.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  };

  await db.insert(newsArticles).values([
    {
      slug: "el-clasico-la-liga-summit",
      titleAr: "كلاسيكو مشتعل: ريال مدريد يستضيف برشلونة في قمة الليغا",
      titleEn: "El Clásico heats up: Real Madrid host Barcelona in La Liga summit",
      excerptAr: "ملعب سانتياغو برنابيو يحتضن قمة الجولة بين الغريمين التقليديين والصراع مباشرة على الصدارة.",
      excerptEn: "The Santiago Bernabéu hosts the clash of the round as the eternal rivals fight for top spot.",
      contentAr: "يستضيف ملعب سانتياغو برنابيو الليلة قمة الكرة الإسبانية بين ريال مدريد وبرشلونة في مواجهة قد تحسم ملامح صراع اللقب مبكراً.\n\nيدخل الفريقان المباراة بمعنويات مرتفعة بعد سلسلة من الانتصارات المتتالية، ويُتوقع أن يشهد اللقاء حضوراً جماهيرياً قياسياً.\n\nالمؤتمرات الصحفية قبل المباراة أشارت إلى جاهزية كاملة للصفوف، مع ترقب لتشكيلة المدربين وقراراتهما التكتيكية.",
      contentEn: "The Santiago Bernabéu hosts Spain's biggest fixture tonight as Real Madrid meet Barcelona in a match that could shape the title race early.\n\nBoth sides arrive in strong form after consecutive wins, with a record crowd expected in the stands.\n\nPre-match press conferences confirmed full squads are available, while tactical choices of both managers remain the big question.",
      imageUrl: img.clasico, category: "football", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-2),
    },
    {
      slug: "riyadh-derby-al-hilal-al-nassr",
      titleAr: "ديربي الرياض يتصدر المشهد: الهلال والنصر وجهاً لوجه",
      titleEn: "Riyadh derby takes center stage: Al Hilal vs Al Nassr",
      excerptAr: "قمة سعودية مرتقبة في المملكة أرينا وسط سباق محتدم على لقب دوري روشن.",
      excerptEn: "A packed Kingdom Arena hosts the Saudi Pro League's fiercest rivalry.",
      contentAr: "تتجه أنظار الكرة العربية والآسيوية الليلة نحو المملكة أرينا حيث يلتقي الهلال بالنصر في ديربي الرياض المنتظر.\n\nالفريقان يدخلان اللقاء وفي جعبتهما نجوم عالميون، ما يضفي على المواجهة طابعاً جماهيرياً وإعلامياً واسعاً.",
      contentEn: "Asian football turns its eyes to Kingdom Arena tonight as Al Hilal meet Al Nassr in the Riyadh derby.\n\nBoth squads are stacked with international stars, giving the fixture enormous regional and global attention.",
      imageUrl: img.stadium, category: "competitions", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-4),
    },
    {
      slug: "champions-league-drama-inter-bayern",
      titleAr: "إنتر يخطف فوزاً مثيراً من أرض بايرن في دوري الأبطال",
      titleEn: "Inter snatch dramatic win at Bayern in the Champions League",
      excerptAr: "النيراتزوري يعودون من أليانز أرينا بثلاث نقاط غالية بعد مباراة مفتوحة ومثيرة.",
      excerptEn: "The Nerazzurri leave the Allianz Arena with a famous win after an open, dramatic contest.",
      contentAr: "قدّم إنتر ميلان أداءً بطولياً في أليانز أرينا وعاد بفوز ثمين 2-1 على بايرن ميونخ ضمن مواجهات دوري أبطال أوروبا.\n\nالمباراة شهدت إثارة كبيرة في الشوط الثاني بعدما تبادل الفريقان السيطرة والفرص.",
      contentEn: "Inter Milan produced a heroic display at the Allianz Arena, beating Bayern München 2-1 in the Champions League.\n\nThe second half delivered end-to-end drama as both sides traded control and chances.",
      imageUrl: img.night, category: "competitions", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-6),
    },
    {
      slug: "transfer-window-europe-talks",
      titleAr: "سوق الانتقالات: مفاوضات متقدمة في أوروبا قبل إغلاق النافذة",
      titleEn: "Transfer window: advanced talks across Europe before deadline",
      excerptAr: "أندية القارة العجوز تكثف تحركاتها في الساعات الأخيرة لتدعيم الصفوف قبل المواع النهائي.",
      excerptEn: "Europe's top clubs intensify late moves to strengthen squads ahead of the deadline.",
      contentAr: "تشهد الساعات الأخيرة من سوق الانتقالات نشاطاً مكثفاً من كبار الأندية الأوروبية لتدعيم الصفوف قبل إغلاق النافذة.\n\nمصادر مقربة من المفاوضات تشير إلى قرب الإعلان عن صفقات كبرى، فيما تبقى التفاصيل المالية محل تكتم.\n\nجدير بالذكر أن الأندية ملزمة بقواعد اللعب المالي النظيف عند إبرام أي تعاقدات جديدة.",
      contentEn: "The final hours of the transfer window are seeing intense activity from Europe's biggest clubs.\n\nSources close to the negotiations suggest major announcements are imminent, though financial details remain undisclosed.\n\nClubs remain bound by financial fair play rules when completing any new signings.",
      imageUrl: img.pitch, category: "transfers", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-9),
    },
    {
      slug: "nba-lakers-celtics-classic",
      titleAr: "كلاسيكو NBA: ليكرز وسيلتكس يجددان الصراع التاريخي",
      titleEn: "NBA classic: Lakers and Celtics renew their historic rivalry",
      excerptAr: "أعظم مواجهة في تاريخ كرة السلة الأمريكية تعود الليلة بحضور جماهيري كبير.",
      excerptEn: "The greatest rivalry in basketball returns tonight in front of a packed arena.",
      contentAr: "يجدد لوس أنجلوس ليكرز وبوسطن سيلتكس الليلة موعدهما مع التاريخ في واحدة من أعرق مواجهات الرياضة الأمريكية.\n\nالفريقان يتنافسان على تحسين موقعيهما في سباق الملاحقة نحو الأدوار الإقصائية.",
      contentEn: "The LA Lakers and Boston Celtics renew their historic rivalry tonight in one of American sport's most storied fixtures.\n\nBoth teams are battling for playoff seeding as the season enters its decisive stretch.",
      imageUrl: img.basket, category: "international", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-12),
    },
    {
      slug: "alcaraz-sinner-masters-final",
      titleAr: "نهائي الماسترز: ألكاراز وسينر في قمة جيل جديد",
      titleEn: "Masters final: Alcaraz and Sinner headline the new generation",
      excerptAr: "نجما التنس الشابان يلتقيان مجدداً في نهائي يعِد بالإثارة.",
      excerptEn: "Tennis' young superstars meet again in a final that promises fireworks.",
      contentAr: "يلتقي كارلوس ألكاراز ويانيك سينر في نهائي بطولة الماسترز في مواجهة باتت تمثل مستقبل التنس العالمي.\n\nالمواجهات المباشرة بينهما تتسم بالندية والإثارة، وتوقعات المحللين منقسمة حول هوية البطل.",
      contentEn: "Carlos Alcaraz and Jannik Sinner meet in the Masters final — a rivalry already defining the future of tennis.\n\nTheir head-to-head battles are famously tight, and analysts are split on who lifts the trophy.",
      imageUrl: img.tennis, category: "events", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-18),
    },
    {
      slug: "usyk-fury-heavyweight-rematch",
      titleAr: "نزال القرن: أوسيك وفيوري يقتربان من حسم اللقب الموحد",
      titleEn: "Fight of the century: Usyk vs Fury nears for the undisputed crown",
      excerptAr: "عشاق الملاكمة على موعد مع ليلة تاريخية في الرياض على ألقاب الوزن الثقيل.",
      excerptEn: "Boxing fans are set for a historic night in Riyadh for the undisputed heavyweight titles.",
      contentAr: "تستضيف الرياض النزال المنتظر بين أولكسندر أوسيك وتايسون فيوري على اللقب الموحد للوزن الثقيل.\n\nالنزال يعد من أضخم أحداث الملاكمة في السنوات الأخيرة مع تغطية إعلامية عالمية واسعة.",
      contentEn: "Riyadh hosts the anticipated showdown between Oleksandr Usyk and Tyson Fury for the undisputed heavyweight crown.\n\nThe bout ranks among boxing's biggest events in years, with global media coverage to match.",
      imageUrl: img.boxing, category: "events", sourceName: "Mourad Goal Editorial", published: true, publishedAt: hoursFromNow(-26),
    },
  ]);

  /* ---- Singleton settings ---- */
  await db.insert(adSettings).values({
    enabled: true,
    demoDurationSec: 8,
    skipAfterSec: 4,
    fallbackPolicy: "allow",
  });

  await db.insert(siteSettings).values({
    siteNameAr: "مراد جول",
    siteNameEn: "Mourad Goal",
    taglineAr: "وجهتك الأولى لمشاهدة كرة القدم المباشرة المرخّصة",
    taglineEn: "Your home for authorized live football",
    defaultLocale: "ar",
    contactEmail: "contact@mourad-goal.com",
    twitterUrl: "https://x.com/mouradgoal",
    youtubeUrl: "https://youtube.com/@mouradgoal",
    instagramUrl: "https://instagram.com/mouradgoal",
  });

  console.log("Seed complete: sports, competitions, teams, matches, demo streams, news, settings.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
