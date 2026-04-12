import { Link, NavLink } from "react-router-dom";
import { Book, Terminal } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm font-semibold text-fog hover:text-mint transition-colors">
          <Terminal size={16} className="text-mint" />
          <span>quoteforge</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink
            to="/docs"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                isActive ? "text-fog bg-ink-3" : "text-fog-2 hover:text-fog hover:bg-ink-3/60"
              }`
            }
          >
            <Book size={14} />
            Docs
          </NavLink>
          <a
            href="https://github.com/lordvins226/quoteforge"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-fog-2 hover:text-fog hover:bg-ink-3/60 transition-colors"
          >
            <GithubIcon size={14} />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
