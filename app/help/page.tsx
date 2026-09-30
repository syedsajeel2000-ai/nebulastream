import Link from "next/link";
import type { Metadata } from "next";
import HelpAccordion from "@/components/HelpAccordion";

export const metadata: Metadata = { title: "Help & Support" };

const FAQS: [string, string][] = [
  [
    "How do I create an account?",
    "Click Sign Up in the top-right corner, fill in your name, username, email and a password of at least 8 characters, then submit. Your account (and a default profile) is created instantly — no email verification needed in this demo.",
  ],
  [
    "How do I watch a movie or show?",
    "Open any title from Home, Browse or Search, then press the PLAY button (or pick an episode for TV shows). The player opens at /watch/[id] and streams a full-length public-domain film. Your position is saved automatically as you watch.",
  ],
  [
    "How do I add content to My List?",
    "Hover a poster (on mobile, tap the card first) and press the ＋ button, or use the ＋ My List button on any title page. Press it again to remove. Your list persists across sessions, devices and logins because it's stored in the database.",
  ],
  [
    "How does Continue Watching work?",
    "Every few seconds while you watch, your exact playback position is saved. Stop anywhere, close the tab, come back later — press Resume from the Continue Watching page and playback picks up from the same second. Finishing a title (95%+) removes it from Continue Watching and marks it Completed in your history.",
  ],
  [
    "How do I search?",
    "Use the magnifier in the header (or the search field on the Search page). It searches titles, genres and cast names in real time. Press Enter for the full results page with filters and sorting.",
  ],
  [
    "How do recommendations work?",
    "Recommendations are generated from your own activity: the genres you watch, like and save are weighted (watching counts most, then likes, then your list), and the highest-rated titles in those genres you haven't seen yet are suggested. The more you watch, the smarter it gets.",
  ],
  [
    "How do I change my profile?",
    "Open the avatar menu → My Profile. You can switch between profiles, add up to five, edit names/avatars, enable Kids mode, or delete profiles. Each profile has independent history, list, likes and recommendations.",
  ],
  [
    "Can I change my email, username or password?",
    "Yes — Account Settings (avatar menu → Account Settings) lets you edit your name, username and email, and change your password after confirming your current one. Changing the password signs out all other sessions.",
  ],
  [
    "I forgot my password — what now?",
    "Use Forgot Password on the login page. This demo doesn't have an email provider configured, so it clearly shows you the single-use reset token directly (instead of pretending to email it). Enter it with your new password to finish.",
  ],
  [
    "Is the content real?",
    "Yes — every title streams a complete, full-length motion picture (typically 1–2 hours). All films and TV episodes are public-domain works hosted by the Internet Archive, so streaming is fully legal. The catalog metadata (synopses, artwork) is written for this project.",
  ],
];

export default function HelpPage() {
  return (
    <div className="anim-fade-in mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#e50914] to-[#5f0409] text-3xl shadow-xl">
          🎬
        </div>
        <h1 className="text-3xl font-semibold sm:text-4xl">Help & Support</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-dim">
          Everything you need to know about using NebulaStream — accounts, watching, lists, progress and recommendations.
        </p>
      </header>

      <section id="faq" className="mb-12">
        <h2 className="section-title mb-4">Frequently Asked Questions</h2>
        <HelpAccordion items={FAQS} />
      </section>

      <section id="contact" className="card-surface p-6 text-center">
        <h2 className="section-title">Still need a hand?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-dim">
          This is a portfolio demo project, so there's no live support desk — but everything about how it works is
          documented in the README on GitHub.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/browse" className="btn btn-accent">Browse Content</Link>
          <Link href="/login" className="btn btn-outline">Log In</Link>
        </div>
      </section>
    </div>
  );
}
