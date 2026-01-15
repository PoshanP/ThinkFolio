"use client";

import Link from "next/link";
import Image from "next/image";
import { Upload, MessageSquare, BookOpen, Sparkles, ArrowRight, CheckCircle, FileText } from "lucide-react";
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

const HOW_IT_WORKS_ICONS = [Upload, MessageSquare, BookOpen];

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
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
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${STYLE_CLASSES.textPrimary} leading-tight`}>
              {BRAND_COPY.hero.title}
              <span className="block text-indigo-600 dark:text-indigo-400 mt-2">
                {BRAND_COPY.hero.subtitle}
              </span>
            </h1>
            <p className={`mt-6 text-lg sm:text-xl ${STYLE_CLASSES.textSecondary} max-w-2xl mx-auto`}>
              {BRAND_COPY.hero.description}
            </p>
            <div className="mt-8">
              <Link
                href={ROUTES.auth}
                className={`inline-flex items-center justify-center gap-2 ${STYLE_CLASSES.buttonPrimary} px-8 py-3 rounded-lg ${STYLE_CLASSES.touchTargetComfortable}`}
              >
                {BRAND_COPY.hero.cta}
                <ArrowRight className={ICON_SIZES.xs} />
              </Link>
            </div>
          </div>
        </section>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {BRAND_COPY.howItWorks.steps.map((step, index) => {
              const Icon = HOW_IT_WORKS_ICONS[index];
              return (
                <div
                  key={index}
                  className={`${STYLE_CLASSES.sectionBg} rounded-xl p-6 sm:p-8 ${STYLE_CLASSES.borderDefault} border`}
                >
                  <div className={`${FEATURE_ICON_CONTAINER.md} ${FEATURE_COLORS.indigo.bg} ${FEATURE_COLORS.indigo.bgDark} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`${ICON_SIZES.md} ${FEATURE_COLORS.indigo.text} ${FEATURE_COLORS.indigo.textDark}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${STYLE_CLASSES.textPrimary} mb-2`}>
                    {step.title}
                  </h3>
                  <p className={STYLE_CLASSES.textSecondary}>
                    {step.description}
                  </p>
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
                  className={`${STYLE_CLASSES.sectionBg} rounded-lg p-5 ${STYLE_CLASSES.borderDefault} border`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${FEATURE_ICON_CONTAINER.sm} ${feature.color.bg} ${feature.color.bgDark} rounded-lg flex items-center justify-center`}>
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
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className={STYLE_CLASSES.textSecondary}>
                      <strong className={STYLE_CLASSES.textPrimary}>{item.label}:</strong> {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className={`${ICON_SIZES.md} text-indigo-600 dark:text-indigo-400`} />
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
          <div className={`text-center ${STYLE_CLASSES.sectionBg} rounded-xl p-8 sm:p-12 ${STYLE_CLASSES.borderDefault} border`}>
            <h2 className={`text-2xl sm:text-3xl font-bold ${STYLE_CLASSES.textPrimary} mb-4`}>
              {BRAND_COPY.cta.title}
            </h2>
            <p className={`${STYLE_CLASSES.textSecondary} mb-6 max-w-xl mx-auto`}>
              {BRAND_COPY.cta.description}
            </p>
            <Link
              href={ROUTES.auth}
              className={`inline-flex items-center justify-center gap-2 ${STYLE_CLASSES.buttonPrimary} px-8 py-3 rounded-lg ${STYLE_CLASSES.touchTargetComfortable}`}
            >
              {BRAND_COPY.hero.ctaSecondary}
              <ArrowRight className={ICON_SIZES.xs} />
            </Link>
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
