"use client";

import Link from "next/link";
import Image from "next/image";
import { Upload, MessageSquare, BookOpen, Sparkles, ArrowRight, CheckCircle, FileText, Zap, FileCheck } from "lucide-react";
// Commented out stats icons - will re-add when stats section is enabled
// import { Users, MessagesSquare, Files } from "lucide-react";
import {
  BRAND,
  BRAND_COPY,
  ASSETS,
  EXTERNAL_LINKS,
  IMAGE_DIMENSIONS,
  ROUTES,
  LOGO_SIZES,
  ICON_SIZES,
  FEATURE_ICON_CONTAINER,
  STYLE_CLASSES,
  FEATURES,
  FEATURE_COLORS,
} from "@/lib/constants";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const HOW_IT_WORKS_ICONS = [Upload, MessageSquare, BookOpen];

// Scroll-animated section wrapper
function ScrollSection({
  children,
  className = "",
  stagger = false,
  direction = "up"
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  direction?: "up" | "left" | "right" | "scale";
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  const hiddenClass = direction === "left" ? "scroll-hidden-left"
    : direction === "right" ? "scroll-hidden-right"
    : direction === "scale" ? "scroll-hidden-scale"
    : "scroll-hidden";

  const visibleClass = direction === "left" ? "scroll-visible-left"
    : direction === "right" ? "scroll-visible-right"
    : direction === "scale" ? "scroll-visible-scale"
    : "scroll-visible";

  return (
    <div
      ref={ref}
      className={`${className} ${stagger ? "scroll-stagger" : ""} ${isVisible ? visibleClass : hiddenClass}`}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Primary gradient orb - top right (sky blue) */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sky-400/30 via-cyan-400/20 to-transparent dark:from-sky-600/20 dark:via-cyan-600/10 rounded-full blur-3xl animate-float-slow" />

        {/* Secondary gradient orb - bottom left (emerald) */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-emerald-400/25 via-teal-400/15 to-transparent dark:from-emerald-600/15 dark:via-teal-600/10 rounded-full blur-3xl animate-float-slow-reverse" />

        {/* Tertiary orb - center right (mixed) */}
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-gradient-to-l from-sky-300/20 via-emerald-400/10 to-transparent dark:from-sky-500/15 dark:via-emerald-500/10 rounded-full blur-3xl animate-pulse-subtle" />

        {/* Small accent orb - top left (amber/beige) */}
        <div className="absolute top-32 left-20 w-32 h-32 bg-gradient-to-br from-amber-300/20 to-yellow-400/10 dark:from-amber-400/15 dark:to-yellow-500/10 rounded-full blur-2xl animate-float" />

        {/* Mid-page accent orb */}
        <div className="absolute top-[60%] left-1/4 w-48 h-48 bg-gradient-to-tr from-teal-400/15 via-sky-400/10 to-transparent dark:from-teal-500/10 dark:via-sky-500/5 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '-5s' }} />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.04]" />

        {/* Noise texture for depth */}
        <div className="absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay" />

        {/* Radial vignette for depth */}
        <div className="absolute inset-0 bg-radial-vignette" />
      </div>

      <div className="relative">
        {/* Logo */}
        <div className="flex justify-center pt-8 pb-4">
          <Image
            src={ASSETS.logo.path}
            alt={ASSETS.logo.alt}
            width={IMAGE_DIMENSIONS.logo.landing.width}
            height={IMAGE_DIMENSIONS.logo.landing.height}
            className={`${LOGO_SIZES.landing} w-auto ${STYLE_CLASSES.logoTheme}`}
            priority
          />
        </div>

        {/* Hero Section */}
        <section className="py-8 sm:py-12 lg:py-16 relative">
          <div className="text-center max-w-4xl mx-auto relative">
            {/* AI-Powered Badge */}
            <div className="flex justify-center mb-6">
              <div className="badge-shimmer inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-700 bg-white/80 dark:bg-gray-900/80">
                <Zap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
                  AI-Powered Document Intelligence
                </span>
              </div>
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${STYLE_CLASSES.textPrimary} leading-tight`}>
              {BRAND_COPY.hero.title}
              <span className="block gradient-text mt-2">
                {BRAND_COPY.hero.subtitle}
              </span>
            </h1>
            <p className={`mt-6 text-lg sm:text-xl ${STYLE_CLASSES.textSecondary} max-w-2xl mx-auto`}>
              {BRAND_COPY.hero.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <div className="gradient-border-btn">
                <Link
                  href={ROUTES.auth}
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 font-semibold px-8 py-3 rounded-lg"
                >
                  {BRAND_COPY.hero.cta}
                  <ArrowRight className={ICON_SIZES.xs} />
                </Link>
              </div>
            </div>

            {/* Supported Formats */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {['PDF', 'DOCX', 'TXT', 'Research Papers'].map((format) => (
                <span
                  key={format}
                  className="format-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                >
                  <FileCheck className="h-3 w-3" />
                  {format}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Commented out for now, will add with real data later
        <section className="py-8 sm:py-12">
          <ScrollSection stagger>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: Files, value: '10K+', label: 'Documents Processed' },
                { icon: Users, value: '500+', label: 'Active Users' },
                { icon: MessagesSquare, value: '50K+', label: 'Questions Answered' },
                { icon: FileCheck, value: '99%', label: 'Accuracy Rate' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="stat-glow text-center p-4 sm:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-sky-500 dark:text-sky-400" />
                  <div className="stat-number text-2xl sm:text-3xl font-bold">{stat.value}</div>
                  <div className={`text-xs sm:text-sm ${STYLE_CLASSES.textMuted}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollSection>
        </section>
        */}

        {/* How It Works Section */}
        <section className={`py-12 sm:py-16 ${STYLE_CLASSES.borderSection}`}>
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold ${STYLE_CLASSES.textPrimary}`}>
              {BRAND_COPY.howItWorks.title}
            </h2>
            <p className={`mt-3 ${STYLE_CLASSES.textSecondary}`}>
              {BRAND_COPY.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {BRAND_COPY.howItWorks.steps.map((step, index) => {
              const Icon = HOW_IT_WORKS_ICONS[index];
              const isLast = index === BRAND_COPY.howItWorks.steps.length - 1;
              return (
                <div
                  key={index}
                  className={`relative ${!isLast ? 'arrow-connector' : ''}`}
                >
                  <div className={`${STYLE_CLASSES.sectionBg} rounded-xl p-6 sm:p-8 ${STYLE_CLASSES.borderDefault} border card-hover h-full`}>
                    <div className={`w-14 h-14 ${FEATURE_COLORS.indigo.bg} ${FEATURE_COLORS.indigo.bgDark} rounded-2xl flex items-center justify-center mb-4 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                      <Icon className={`h-7 w-7 ${FEATURE_COLORS.indigo.text} ${FEATURE_COLORS.indigo.textDark}`} />
                    </div>
                    <h3 className={`text-xl font-semibold ${STYLE_CLASSES.textPrimary} mb-2`}>
                      {step.title}
                    </h3>
                    <p className={STYLE_CLASSES.textSecondary}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Grid Section */}
        <section className={`py-12 sm:py-16 ${STYLE_CLASSES.borderSection}`}>
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold ${STYLE_CLASSES.textPrimary}`}>
              {BRAND_COPY.features.title}
            </h2>
            <p className={`mt-3 ${STYLE_CLASSES.textSecondary}`}>
              {BRAND_COPY.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className={`${STYLE_CLASSES.sectionBg} rounded-lg p-5 ${STYLE_CLASSES.borderDefault} border feature-card-hover group`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${FEATURE_ICON_CONTAINER.sm} ${feature.color.bg} ${feature.color.bgDark} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`${ICON_SIZES.sm} ${feature.color.text} ${feature.color.textDark}`} />
                    </div>
                    <h3 className={`font-semibold ${STYLE_CLASSES.textPrimary}`}>{feature.title}</h3>
                  </div>
                  <p className={`text-sm ${STYLE_CLASSES.textSecondary}`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className={`py-12 sm:py-16 ${STYLE_CLASSES.borderSection}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold ${STYLE_CLASSES.textPrimary} mb-6`}>
                {BRAND_COPY.benefits.title}
              </h2>
              <ul className="space-y-4">
                {BRAND_COPY.benefits.items.map((item, index) => (
                  <li key={index} className="benefit-item flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-default">
                    <CheckCircle className="benefit-check h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className={STYLE_CLASSES.textSecondary}>
                      <strong className={STYLE_CLASSES.textPrimary}>{item.label}:</strong> {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-sky-100 dark:border-sky-800 card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-float">
                  <Sparkles className={`${ICON_SIZES.md} text-sky-600 dark:text-sky-400`} />
                </div>
                <h3 className={`text-lg font-semibold ${STYLE_CLASSES.textPrimary}`}>
                  {BRAND_COPY.benefits.aiCard.title}
                </h3>
              </div>
              <p className={`${STYLE_CLASSES.textSecondary} mb-4`}>
                {BRAND_COPY.benefits.aiCard.description}
              </p>
              <div className={`flex items-center gap-2 text-sm ${STYLE_CLASSES.textMuted}`}>
                <FileText className={ICON_SIZES.xs} />
                <span>{BRAND_COPY.benefits.aiCard.fileSupport}</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-12 sm:py-16 ${STYLE_CLASSES.borderSection}`}>
          <div className="text-center cta-gradient rounded-xl p-8 sm:p-12 border border-sky-200 dark:border-sky-800 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative">
              <h2 className={`text-2xl sm:text-3xl font-bold ${STYLE_CLASSES.textPrimary} mb-4`}>
                {BRAND_COPY.cta.title}
              </h2>
              <p className={`${STYLE_CLASSES.textSecondary} mb-6 max-w-xl mx-auto`}>
                {BRAND_COPY.cta.description}
              </p>
              <div className="gradient-border-btn inline-block hover:scale-105 transition-transform duration-300">
                <Link
                  href={ROUTES.auth}
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 font-semibold px-8 py-3 rounded-lg"
                >
                  {BRAND_COPY.hero.ctaSecondary}
                  <ArrowRight className={ICON_SIZES.xs} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`py-8 ${STYLE_CLASSES.borderSection}`}>
          <div className="text-center">
            <a
              href={EXTERNAL_LINKS.devswarm.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center space-x-2 px-4 py-3 text-sm ${STYLE_CLASSES.textSecondary} hover:text-gray-800 dark:hover:text-gray-300 transition-colors group ${STYLE_CLASSES.touchTarget}`}
            >
              <span>{BRAND_COPY.footer.poweredBy}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={EXTERNAL_LINKS.devswarm.logo}
                alt={EXTERNAL_LINKS.devswarm.alt}
                className="h-5 group-hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
