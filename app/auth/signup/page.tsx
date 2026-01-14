"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { brand, signup } from "@/lib/content";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        if (data.user.email_confirmed_at) {
          router.push("/");
        } else {
          setSuccess(true);
        }
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const errorMessage = err instanceof Error ? err.message : signup.errors.default;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {brand.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {brand.tagline}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {success ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {signup.success.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ve sent a confirmation link to{" "}
                <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
                Click the link to activate your account.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {signup.success.backButton}
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {signup.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {signup.subtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {signup.form.nameLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder={signup.form.namePlaceholder}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {signup.form.emailLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder={signup.form.emailPlaceholder}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {signup.form.passwordLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder={signup.form.passwordPlaceholder}
                        minLength={6}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {signup.form.passwordHint}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    {signup.form.termsPrefix}{" "}
                    <Link href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                      {signup.form.termsLink}
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {signup.form.submittingButton}
                    </>
                  ) : (
                    signup.form.submitButton
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {signup.footer.hasAccount}{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    {signup.footer.signInLink}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
