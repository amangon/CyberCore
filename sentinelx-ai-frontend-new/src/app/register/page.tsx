"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import * as authService from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api";

type FormState = {
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof FormState, string>> & { form?: string };

const minPassword = 8;

function validate(values: FormState): Errors {
  const errors: Errors = {};

  if (!values.firstName.trim())
    errors.firstName = "First name required.";

  if (!values.lastName.trim())
    errors.lastName = "Last name required.";

  if (!values.organization.trim())
    errors.organization = "Organization required.";

  if (!values.email.trim())
    errors.email = "Email required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "Invalid email.";

  if (values.password.length < minPassword)
    errors.password = `Minimum ${minPassword} characters.`;

  if (values.confirmPassword !== values.password)
    errors.confirmPassword = "Passwords do not match.";

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    organization: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await authService.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        organization: form.organization.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (result?.token) {
        setSuccess(true);
        router.replace("/dashboard");
      } else {
        setSuccess(true);
        window.setTimeout(() => {
          router.replace("/login");
        }, 1200);
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: getApiErrorMessage(err),
      }));
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: keyof FormState) => (v: string) => {
    setForm((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: undefined, form: undefined }));
    setSuccess(false);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),transparent_28%),linear-gradient(to_bottom_right,rgba(15,23,42,1),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.28)]">
              <Shield className="h-7 w-7 text-cyan-300" />
            </div>

            <div className="max-w-xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                SentinelX AI
              </p>

              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Create your security operations account and start monitoring threats with AI intelligence.
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Enterprise-grade defense. Live threat visibility. Fast onboarding for modern security teams.
              </p>
            </div>

            <motion.div
              aria-hidden="true"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="mt-12 flex h-52 w-52 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 shadow-[0_0_80px_rgba(34,211,238,0.18)]"
            >
              <div className="h-32 w-32 rounded-full border border-purple-400/20 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 blur-[0.5px]" />
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex items-center justify-center"
          >
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Create account</h2>
                <p className="mt-2 text-sm text-slate-400">Join your SentinelX security workspace.</p>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">Account created successfully.</p>
                  </div>
                </motion.div>
              ) : null}

              {errors.form ? (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-rose-200">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{errors.form}</p>
                </div>
              ) : null}

              <form className="space-y-5" onSubmit={onSubmit} noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="First Name"
                    value={form.firstName}
                    onChange={setField("firstName")}
                    placeholder="John"
                    error={errors.firstName}
                  />
                  <Field
                    label="Last Name"
                    value={form.lastName}
                    onChange={setField("lastName")}
                    placeholder="Doe"
                    error={errors.lastName}
                  />
                </div>
                <Field
                  label="Organization"
                  value={form.organization}
                  onChange={setField("organization")}
                  placeholder="Acme Corp"
                  error={errors.organization}
                />
                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  placeholder="security@company.com"
                  error={errors.email}
                />
                <Field
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={setField("password")}
                  placeholder="Create password"
                  error={errors.password}
                />
                <Field
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={setField("confirmPassword")}
                  placeholder="Confirm password"
                  error={errors.confirmPassword}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 font-medium text-white shadow-[0_0_30px_rgba(59,130,246,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 bg-white/0 transition group-hover:bg-white/10" />
                  {loading ? (
                    <span className="relative flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="relative">Create Account</span>
                  )}
                </button>

                <p className="text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-cyan-300 transition hover:text-cyan-200">
                    Login
                  </Link>
                </p>

                {hasErrors ? (
                  <p className="text-xs text-slate-500">
                    Password rules: {minPassword}+ chars, upper, lower, number.
                  </p>
                ) : null}
              </form>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
      />
      {error ? <span className="mt-2 block text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}