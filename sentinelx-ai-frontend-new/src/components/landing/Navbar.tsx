"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Shield, X } from "lucide-react";

const MotionLink = motion.create(Link);

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Threat Intelligence", href: "/threats" },
  { label: "Scanner", href: "/scan" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hash, setHash] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onHashChange = () => setHash(window.location.hash);

    onScroll();
    onHashChange();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/" && (hash === "" || hash === "#");
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href;
  };

  const navClass = useMemo(
    () =>
      [
        "sticky top-0 z-50 border-b border-white/10 transition-all duration-300",
        scrolled
          ? "bg-[rgba(2,6,23,0.7)] shadow-2xl shadow-cyan-950/10 backdrop-blur-xl"
          : "bg-transparent backdrop-blur-0",
      ].join(" "),
    [scrolled]
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={navClass}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
            <Shield className="h-5 w-5" />
          </span>

          <span className="leading-none">
            <span className="block text-lg font-semibold tracking-tight text-white">
              Sentinel
              <span className="text-cyan-300">X</span>
              <span className="ml-1 text-white">AI</span>
            </span>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Security Platform
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <MotionLink
                key={item.label}
                href={item.href}
                whileHover={{ y: -1 }}
                className="relative rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                  />
                ) : null}
              </MotionLink>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-md transition hover:border-cyan-400/25 hover:bg-white/10"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-cyan-400/15"
          >
            Register
          </Link>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:from-cyan-300 hover:to-blue-400"
            >
              Launch Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-100 transition hover:bg-white/10 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/10 bg-[rgba(2,6,23,0.88)] backdrop-blur-xl lg:hidden"
          >
            <motion.div
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              className="mx-auto max-w-7xl px-4 py-3 sm:px-6"
            >
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <MotionLink
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                    className="relative block rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-400" />
                    ) : null}
                  </MotionLink>
                );
              })}

              <div className="mt-3 grid grid-cols-2 gap-3 pb-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-slate-100 transition hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Register
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:from-cyan-300 hover:to-blue-400"
                >
                  Launch
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

