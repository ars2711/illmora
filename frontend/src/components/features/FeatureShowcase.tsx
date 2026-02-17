"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Target,
  Flame,
  Zap,
  BarChart3,
  Trophy,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Shield,
  Wifi,
  Users,
  BookOpen,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface Feature {
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  href: string;
  badge?: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
  },
};

const pillVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35 },
  },
};

export default function FeatureShowcase() {
  const t = useTranslations("home.public.features");

  const features: Feature[] = [
    {
      icon: Brain,
      gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
      iconColor: "text-violet-500 dark:text-violet-400",
      title: t("smartAnalytics.title"),
      description: t("smartAnalytics.description"),
      stats: [
        { label: t("smartAnalytics.stats.concepts"), value: "50+" },
        { label: t("smartAnalytics.stats.tracking"), value: "Real-time" },
        { label: t("smartAnalytics.stats.insights"), value: "AI" },
      ],
      href: "/dashboard/analytics",
      badge: t("smartAnalytics.badge"),
    },
    {
      icon: Target,
      gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
      iconColor: "text-rose-500 dark:text-rose-400",
      title: t("weaknessRetarget.title"),
      description: t("weaknessRetarget.description"),
      stats: [
        { label: t("weaknessRetarget.stats.accuracy"), value: "60%" },
        { label: t("weaknessRetarget.stats.intervals"), value: "SRS" },
        { label: t("weaknessRetarget.stats.mix"), value: "20Q" },
      ],
      href: "/practice",
      badge: t("weaknessRetarget.badge"),
    },
    {
      icon: Flame,
      gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
      iconColor: "text-amber-500 dark:text-amber-400",
      title: t("gamification.title"),
      description: t("gamification.description"),
      stats: [
        { label: t("gamification.stats.streaks"), value: "Daily" },
        { label: t("gamification.stats.board"), value: "Weekly" },
        { label: t("gamification.stats.freeze"), value: "1 Free" },
      ],
      href: "/leaderboard",
    },
    {
      icon: Zap,
      gradient: "from-sky-500/20 via-cyan-500/10 to-transparent",
      iconColor: "text-sky-500 dark:text-sky-400",
      title: t("speed.title"),
      description: t("speed.description"),
      stats: [
        { label: t("speed.stats.isr"), value: "<60s" },
        { label: t("speed.stats.images"), value: "AVIF" },
        { label: t("speed.stats.bundle"), value: "Slim" },
      ],
      href: "/question-bank/mathematics",
    },
  ];

  const advantages: { icon: LucideIcon; text: string; color: string }[] = [
    { icon: BarChart3, text: t("advantages.conceptTagging"), color: "text-violet-500 dark:text-violet-400" },
    { icon: RefreshCw, text: t("advantages.spacedRepetition"), color: "text-rose-500 dark:text-rose-400" },
    { icon: Trophy, text: t("advantages.leaderboards"), color: "text-amber-500 dark:text-amber-400" },
    { icon: TrendingUp, text: t("advantages.trendDetection"), color: "text-sky-500 dark:text-sky-400" },
    { icon: Shield, text: t("advantages.ethicalAi"), color: "text-emerald-500 dark:text-emerald-400" },
    { icon: Wifi, text: t("advantages.offlineFirst"), color: "text-indigo-500 dark:text-indigo-400" },
    { icon: Users, text: t("advantages.studyGroups"), color: "text-pink-500 dark:text-pink-400" },
    { icon: BookOpen, text: t("advantages.knowledgeGraph"), color: "text-teal-500 dark:text-teal-400" },
    { icon: Clock, text: t("advantages.adaptivePacing"), color: "text-orange-500 dark:text-orange-400" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
          <Sparkles size={14} />
          {t("sectionBadge")}
        </p>
        <h2 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">
          {t("sectionTitlePrefix")}
          <span className="text-transparent bg-clip-text bg-[linear-gradient(120deg,_#fbbf24,_#38bdf8,_#a855f7)]">
            {" "}{t("sectionTitleHighlight")}{" "}
          </span>
          {t("sectionTitleSuffix")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-white/70">
          {t("sectionLede")}
        </p>
      </motion.div>

      {/* Feature cards grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 md:grid-cols-2"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div key={feature.title} variants={cardVariants}>
              <Link
                href={feature.href}
                className={`group relative block overflow-hidden rounded-[28px] border border-slate-200 bg-white/70 p-7 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5`}
              >
                {/* Gradient glow */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/5 transition-transform duration-300 group-hover:scale-110 dark:bg-white/10`}
                    >
                      <Icon size={24} className={feature.iconColor} />
                    </div>
                    {feature.badge && (
                      <span className="rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 font-display text-2xl">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">
                    {feature.description}
                  </p>

                  {/* Stats row */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {feature.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-slate-200/70 bg-white/60 p-3 text-center transition-colors duration-300 group-hover:border-slate-300/80 dark:border-white/5 dark:bg-white/5 dark:group-hover:border-white/15"
                      >
                        <p className={`text-sm font-bold ${feature.iconColor}`}>
                          {stat.value}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/50">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Advantage pills */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mt-10 flex flex-wrap justify-center gap-3"
      >
        {advantages.map((adv) => {
          const AdvIcon = adv.icon;
          return (
            <motion.span
              key={adv.text}
              variants={pillVariants}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 backdrop-blur transition-all duration-300 hover:border-slate-300 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20"
            >
              <AdvIcon size={14} className={adv.color} />
              {adv.text}
            </motion.span>
          );
        })}
      </motion.div>

      {/* Comparison statement */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-12 rounded-[28px] border border-slate-200 bg-gradient-to-r from-white/90 via-white/70 to-white/90 p-8 text-center backdrop-blur dark:border-white/10 dark:from-white/5 dark:via-white/[0.03] dark:to-white/5"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">
          {t("comparison.label")}
        </p>
        <p className="mx-auto mt-3 max-w-3xl font-display text-xl leading-relaxed text-slate-800 sm:text-2xl dark:text-white/90">
          {t("comparison.statement")}
        </p>
        <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-3 text-xs text-slate-500 dark:text-white/50">
          <span className="rounded-full border border-slate-200/60 px-3 py-1.5 dark:border-white/10">
            {t("comparison.tags.smarter")}
          </span>
          <span className="rounded-full border border-slate-200/60 px-3 py-1.5 dark:border-white/10">
            {t("comparison.tags.adaptive")}
          </span>
          <span className="rounded-full border border-slate-200/60 px-3 py-1.5 dark:border-white/10">
            {t("comparison.tags.ethical")}
          </span>
          <span className="rounded-full border border-slate-200/60 px-3 py-1.5 dark:border-white/10">
            {t("comparison.tags.yours")}
          </span>
        </div>
      </motion.div>
    </section>
  );
}
