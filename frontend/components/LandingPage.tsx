"use client";

import Link from "next/link";
import { FileText, MessageSquare, FolderOpen, Search, Quote, Bookmark, Globe, Sparkles, BookOpen, Moon } from "lucide-react";
import { brand, landing } from "@/lib/content";

const featureIcons = [FileText, MessageSquare, Quote, FolderOpen];
const moreFeatureIcons = [Globe, Sparkles, Bookmark, Moon];
const stepIcons = [FileText, BookOpen, MessageSquare];

export function LandingPage() {
  return (
    <div className="space-y-12 sm:space-y-16 relative min-h-screen -m-4 sm:-m-6 p-4 sm:p-6 lg:-mx-8 lg:px-8">
      {/* Twinkling stars animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes twinkle-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.2; }
        }
        .stars-layer-1 { animation: twinkle 3s ease-in-out infinite; }
        .stars-layer-2 { animation: twinkle-slow 4s ease-in-out infinite 1s; }
        .stars-layer-3 { animation: twinkle 5s ease-in-out infinite 2s; }
      `}</style>

      {/* Base background */}
      <div className="fixed inset-0 pointer-events-none bg-gray-900 z-0" />

      {/* Stars layer 1 - bright stars */}
      <div
        className="fixed inset-0 pointer-events-none stars-layer-1 z-[1]"
        style={{
          background: `
            radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 200px 50px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 350px 30px, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 550px 140px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 90px 180px, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 480px 220px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 150px 280px, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 420px 90px, rgba(255,255,255,0.9), transparent),
            radial-gradient(2px 2px at 580px 320px, rgba(255,255,255,0.95), transparent),
            radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.9), transparent),
            radial-gradient(1.5px 1.5px at 70px 120px, rgba(255,255,255,0.85), transparent),
            radial-gradient(1.5px 1.5px at 250px 250px, rgba(255,255,255,0.85), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '650px 380px',
        }}
      />

      {/* Stars layer 2 - medium stars */}
      <div
        className="fixed inset-0 pointer-events-none stars-layer-2 z-[1]"
        style={{
          background: `
            radial-gradient(1.5px 1.5px at 160px 120px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 280px 90px, rgba(255,255,255,0.75), transparent),
            radial-gradient(1.5px 1.5px at 450px 180px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 520px 70px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 30px 200px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 380px 260px, rgba(255,255,255,0.75), transparent),
            radial-gradient(1.5px 1.5px at 100px 320px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 590px 240px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 220px 40px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 500px 340px, rgba(255,255,255,0.75), transparent),
            radial-gradient(1.5px 1.5px at 350px 300px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 60px 60px, rgba(255,255,255,0.7), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '650px 380px',
        }}
      />

      {/* Stars layer 3 - dim stars */}
      <div
        className="fixed inset-0 pointer-events-none stars-layer-3 z-[1]"
        style={{
          background: `
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 220px 150px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 320px 200px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 400px 120px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 500px 60px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 180px 240px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 280px 30px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 460px 280px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 550px 200px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 100px 260px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 620px 100px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 370px 350px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 15px 310px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 530px 370px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 240px 340px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 420px 40px, rgba(255,255,255,0.4), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '650px 380px',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            {brand.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
            {brand.tagline}
          </p>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <Link
            href="/auth/login"
            className="px-3 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors min-h-[44px] flex items-center"
          >
            {landing.hero.secondaryCta}
          </Link>
          <Link
            href="/auth/signup"
            className="px-3 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors min-h-[44px] flex items-center"
          >
            {landing.hero.primaryCta}
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
          {landing.hero.title}
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-400 leading-relaxed">
          {landing.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors min-h-[48px] flex items-center justify-center"
          >
            {landing.hero.primaryCta}
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors min-h-[48px] flex items-center justify-center"
          >
            {landing.hero.secondaryCta}
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10">
        <h3 className="text-xl sm:text-2xl font-semibold text-white text-center mb-8">
          {landing.features.title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {landing.features.items.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <div
                key={index}
                className="bg-gray-800 rounded-lg border border-gray-700 p-5"
              >
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* More Features Section */}
      <div className="relative z-10">
        <h3 className="text-xl sm:text-2xl font-semibold text-white text-center mb-8">
          {landing.moreFeatures.title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {landing.moreFeatures.items.map((feature, index) => {
            const Icon = moreFeatureIcons[index];
            return (
              <div
                key={index}
                className="bg-gray-800 rounded-lg border border-gray-700 p-5"
              >
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 sm:p-8 relative z-10">
        <h3 className="text-xl sm:text-2xl font-semibold text-white text-center mb-8">
          {landing.howItWorks.title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {landing.howItWorks.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-600">
                  <Icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="text-sm font-medium text-indigo-400 mb-1">
                  Step {step.step}
                </div>
                <h4 className="text-base font-semibold text-white mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-400">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center relative z-10">
        <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
          {landing.cta.title}
        </h3>
        <p className="text-sm sm:text-base text-gray-400 mb-6">
          {landing.cta.subtitle}
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex px-6 py-3 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors min-h-[48px] items-center justify-center"
        >
          {landing.cta.button}
        </Link>
      </div>

      {/* Footer */}
      <div className="pt-6 sm:pt-8 border-t border-gray-700 relative z-10">
        <div className="text-center">
          <a
            href="https://devswarm.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-3 text-sm text-gray-400 hover:text-gray-300 transition-colors group min-h-[44px]"
          >
            <span>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/684228174606b26ec8e3e29e/684b4952707b6e17b3ef79df_Logo.png"
              alt="DevSwarm"
              className="h-5 group-hover:opacity-80 transition-opacity"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
