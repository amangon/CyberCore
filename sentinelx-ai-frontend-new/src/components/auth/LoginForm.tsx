"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import * as authService from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api";

type LoginState = "idle" | "loading" | "success" | "error";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState("");

  const validate = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) return "Email address is required.";
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";

    return "";
  };

  const handleLogin = async () => {
    setState("loading");
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    try {
      await authService.login({
        email: email.trim(),
        password,
        rememberMe,
      });

      setState("success");

      // Redirect to the originally requested page (or the dashboard).
      const redirect = searchParams.get("redirect");
      router.replace(redirect && redirect.startsWith("/") ? redirect : "/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setState("error");
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleLogin();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">Secure access to SentinelX AI</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Email Address
            </label>
            <motion.div whileFocus={{ scale: 1.01 }} className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== "idle") setState("idle");
                }}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/40 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="security@company.com"
              />
            </motion.div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>
            <motion.div whileFocus={{ scale: 1.01 }} className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (state !== "idle") setState("idle");
                }}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/40 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Enter your password"
              />
            </motion.div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-950/50 text-cyan-400 focus:ring-cyan-400/20"
            />
            Remember me
          </label>

          {state === "error" && error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {state === "success" ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Signed in successfully. Redirecting...</span>
            </div>
          ) : null}

          <motion.button
            whileHover={state === "loading" ? {} : { y: -1, scale: 1.01 }}
            whileTap={state === "loading" ? {} : { scale: 0.99 }}
            type="submit"
            disabled={state === "loading"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 font-medium text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_45px_rgba(34,211,238,0.35)] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            <span>{state === "loading" ? "Signing In..." : "Sign In"}</span>
          </motion.button>
        </form>

<div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-xs font-medium tracking-[0.2em] text-emerald-300">
          SENTINEL AI PROTECTION ACTIVE
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Register
          </Link>
        </p>
      </div>
    </motion.div>
  );
}