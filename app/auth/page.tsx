"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSupabase } from "@/lib/hooks/useSupabase";
import {
  BRAND_COPY,
  ASSETS,
  EXTERNAL_LINKS,
  IMAGE_DIMENSIONS,
  ROUTES,
  LOGO_SIZES,
  ICON_SIZES,
  STYLE_CLASSES,
  PASSWORD_REQUIREMENTS,
} from "@/lib/constants";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Sign Up state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const router = useRouter();
  const supabase = useSupabase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError) throw signInError;

      if (data.session) {
        router.push(ROUTES.home);
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");
    setSignupSuccess("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
            name: signupName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: signupName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        if (data.user.email_confirmed_at) {
          router.push(ROUTES.home);
        } else {
          setSignupSuccess(BRAND_COPY.auth.signUp.success);
          setSignupName("");
          setSignupEmail("");
          setSignupPassword("");
        }
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setSignupError(errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  const { auth } = BRAND_COPY;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Back Button - Top Left */}
      <Link
        href={ROUTES.home}
        className={`absolute top-4 left-4 p-2 rounded-lg ${STYLE_CLASSES.textSecondary} hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        aria-label="Back to home"
      >
        <ArrowLeft className={ICON_SIZES.sm} />
      </Link>

      {/* Compact Branding */}
      <div className="text-center mb-8">
        <Link href={ROUTES.home} className="inline-block mb-4">
          <Image
            src={ASSETS.logo.path}
            alt={ASSETS.logo.alt}
            width={IMAGE_DIMENSIONS.logo.auth.width}
            height={IMAGE_DIMENSIONS.logo.auth.height}
            className={`${LOGO_SIZES.auth} w-auto ${STYLE_CLASSES.logoTheme}`}
            priority
          />
        </Link>
        <h1 className={`text-2xl sm:text-3xl font-bold ${STYLE_CLASSES.textPrimary}`}>
          {BRAND_COPY.hero.title}
        </h1>
        <p className={`mt-2 ${STYLE_CLASSES.textSecondary}`}>
          {BRAND_COPY.hero.subtitle}
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className={`${STYLE_CLASSES.card2xl} overflow-hidden`}>
          {/* Tabs */}
          <div className={`flex ${STYLE_CLASSES.borderDefault} border-b`}>
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "signin"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : `${STYLE_CLASSES.textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
              }`}
            >
              {auth.signIn.tab}
              {activeTab === "signin" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "signup"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : `${STYLE_CLASSES.textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
              }`}
            >
              {auth.signUp.tab}
              {activeTab === "signup" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {activeTab === "signin" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className={`block text-sm font-medium ${STYLE_CLASSES.textSecondary} mb-2`}>
                    {auth.labels.email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className={`${ICON_SIZES.sm} text-gray-400`} />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={`block w-full pl-11 pr-4 py-3 ${STYLE_CLASSES.input}`}
                      placeholder={auth.placeholders.email}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className={`block text-sm font-medium ${STYLE_CLASSES.textSecondary} mb-2`}>
                    {auth.labels.password}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className={`${ICON_SIZES.sm} text-gray-400`} />
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`block w-full pl-11 pr-4 py-3 ${STYLE_CLASSES.input}`}
                      placeholder={auth.placeholders.password}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm ${STYLE_CLASSES.buttonPrimaryWithShadow} disabled:opacity-50 disabled:cursor-not-allowed ${STYLE_CLASSES.touchTargetComfortable}`}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className={`${ICON_SIZES.sm} animate-spin`} />
                      {auth.signIn.loading}
                    </>
                  ) : (
                    <>
                      {auth.signIn.button}
                      <ArrowRight className={ICON_SIZES.xs} />
                    </>
                  )}
                </button>

                <p className={`text-center text-sm ${STYLE_CLASSES.textMuted}`}>
                  {auth.signIn.noAccount}{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {auth.signIn.createLink}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-5">
                {signupError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {signupError}
                  </div>
                )}
                {signupSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                    {signupSuccess}
                  </div>
                )}

                <div>
                  <label htmlFor="signup-name" className={`block text-sm font-medium ${STYLE_CLASSES.textSecondary} mb-2`}>
                    {auth.labels.fullName}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className={`${ICON_SIZES.sm} text-gray-400`} />
                    </div>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className={`block w-full pl-11 pr-4 py-3 ${STYLE_CLASSES.input}`}
                      placeholder={auth.placeholders.fullName}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className={`block text-sm font-medium ${STYLE_CLASSES.textSecondary} mb-2`}>
                    {auth.labels.email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className={`${ICON_SIZES.sm} text-gray-400`} />
                    </div>
                    <input
                      id="signup-email"
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={`block w-full pl-11 pr-4 py-3 ${STYLE_CLASSES.input}`}
                      placeholder={auth.placeholders.email}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-password" className={`block text-sm font-medium ${STYLE_CLASSES.textSecondary} mb-2`}>
                    {auth.labels.password}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className={`${ICON_SIZES.sm} text-gray-400`} />
                    </div>
                    <input
                      id="signup-password"
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className={`block w-full pl-11 pr-4 py-3 ${STYLE_CLASSES.input}`}
                      placeholder={auth.placeholders.passwordCreate}
                      minLength={PASSWORD_REQUIREMENTS.minLength}
                    />
                  </div>
                  <p className={`mt-2 text-xs ${STYLE_CLASSES.textMuted}`}>
                    {auth.signUp.passwordHint}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm ${STYLE_CLASSES.buttonPrimaryWithShadow} disabled:opacity-50 disabled:cursor-not-allowed ${STYLE_CLASSES.touchTargetComfortable}`}
                >
                  {signupLoading ? (
                    <>
                      <Loader2 className={`${ICON_SIZES.sm} animate-spin`} />
                      {auth.signUp.loading}
                    </>
                  ) : (
                    <>
                      {auth.signUp.button}
                      <ArrowRight className={ICON_SIZES.xs} />
                    </>
                  )}
                </button>

                <p className={`text-center text-sm ${STYLE_CLASSES.textMuted}`}>
                  {auth.signUp.hasAccount}{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {auth.signUp.signInLink}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a
            href={EXTERNAL_LINKS.devswarm.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-sm ${STYLE_CLASSES.textMuted} hover:text-gray-700 dark:hover:text-gray-300 transition-colors`}
          >
            <span>{BRAND_COPY.footer.poweredBy}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EXTERNAL_LINKS.devswarm.logo}
              alt={EXTERNAL_LINKS.devswarm.alt}
              className="h-4"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
