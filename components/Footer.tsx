import Link from "next/link";

export default function Footer() {
  const cols: [string, [string, string][]][] = [
    [
      "Browse",
      [
        ["/browse", "All Titles"],
        ["/browse?type=movie", "Movies"],
        ["/browse?type=tv", "TV Shows"],
        ["/genres", "Genres"],
      ],
    ],
    [
      "Your Space",
      [
        ["/my-list", "My List"],
        ["/continue-watching", "Continue Watching"],
        ["/history", "Watch History"],
        ["/profile", "My Profile"],
      ],
    ],
    [
      "Account",
      [
        ["/account", "Account Settings"],
        ["/login", "Log In"],
        ["/signup", "Sign Up"],
        ["/forgot-password", "Forgot Password"],
      ],
    ],
    [
      "Support",
      [
        ["/help", "Help & Support"],
        ["/help#faq", "FAQs"],
        ["/help#contact", "Contact"],
      ],
    ],
  ];

  return (
    <footer className="mt-20 border-t border-white/8 bg-[#080a10]">
      <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {cols.map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-dim">{title}</h3>
              <ul className="space-y-2 text-sm">
                {links.map(([href, label]) => (
                  <li key={href + label}>
                    <Link href={href} className="link-dim">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/8 pt-6 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-brand font-extrabold text-white">NEBULA</span>
            <span className="font-brand font-extrabold text-[#e50914]">STREAM</span> — a demo streaming platform.
            Every film streamed here is an <strong>open-licensed modern work (2016–2026)</strong> — Creative
            Commons open movies and public-domain mission animations — hosted by the Internet Archive.
          </p>
          <p>© {new Date().getFullYear()} NebulaStream Demo · Built with Next.js + SQLite</p>
        </div>
      </div>
    </footer>
  );
}
