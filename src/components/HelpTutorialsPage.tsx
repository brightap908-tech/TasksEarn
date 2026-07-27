import React from "react";
import { ArrowLeft, BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HelpTutorialsPageProps {
  isDarkMode: boolean;
}

const tutorials = [
  {
    title: "How to Complete Tasks and Earn Money",
    description: "Learn how to find available tasks, submit proof, and track your earnings.",
    videoId: "sm_7GrMr4fY",
    accent: "#2563EB",
  },
  {
    title: "How to Create a Campaign",
    description: "See how to set up a campaign, choose your audience, and reach your goals.",
    videoId: "2XdlKVgfkLM",
    accent: "#1D4ED8",
  },
];

export default function HelpTutorialsPage({ isDarkMode }: HelpTutorialsPageProps) {
  const navigate = useNavigate();
  const surface = isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF";
  const border = isDarkMode ? "rgba(255,255,255,0.09)" : "#E2E8F0";
  const heading = isDarkMode ? "#F1F5F9" : "#0F172A";
  const muted = isDarkMode ? "#94A3B8" : "#64748B";

  return (
    <div
      className="min-h-[calc(100vh-56px)] px-4 py-6 sm:px-6 lg:px-8"
      style={{ background: isDarkMode ? "#0F172A" : "#F8FAFC" }}
    >
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/overview")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors cursor-pointer"
          style={{
            color: "#2563EB",
            background: isDarkMode ? "rgba(37,99,235,0.12)" : "#EFF6FF",
            border: "1px solid rgba(37,99,235,0.18)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <header
          className="relative mb-6 overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 52%, #60A5FA 100%)",
            boxShadow: "0 16px 40px rgba(37,99,235,0.24)",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-16 h-48 w-48 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)" }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-24 h-44 w-44 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <div className="relative max-w-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              Learn TasksEarn
            </p>
            <h1 className="font-black tracking-tight text-white" style={{ fontSize: "clamp(1.75rem,5vw,2.75rem)" }}>
              Help &amp; Tutorials
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-50 sm:text-base">
              Get the most from your one TasksEarn account. Earn from tasks and create campaigns from the same dashboard.
            </p>
          </div>
        </header>

        <div className="mb-5 flex items-start gap-3 rounded-2xl p-4" style={{ background: surface, border: `1px solid ${border}` }}>
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold" style={{ color: heading }}>Watch a quick guide</h2>
            <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: muted }}>
              Both videos play right here on TasksEarn, so you can learn without leaving your account.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {tutorials.map((tutorial) => (
            <article
              key={tutorial.videoId}
              className="overflow-hidden rounded-2xl"
              style={{
                background: surface,
                border: `1px solid ${border}`,
                boxShadow: isDarkMode ? "none" : "0 4px 18px rgba(15,23,42,0.06)",
              }}
            >
              <div className="aspect-video w-full bg-slate-900">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${tutorial.videoId}?rel=0`}
                  title={tutorial.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 shrink-0" style={{ color: tutorial.accent }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tutorial.accent }}>
                    Tutorial
                  </span>
                </div>
                <h2 className="text-lg font-black leading-tight" style={{ color: heading }}>
                  {tutorial.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: muted }}>
                  {tutorial.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}