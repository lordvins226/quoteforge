import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-line/60 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="font-mono text-xs text-fog-3">
          <span className="text-mint">{"$"}</span> quoteforge — MIT © {new Date().getFullYear()}
        </div>
        <nav className="flex items-center gap-5 text-xs text-fog-2">
          <Link to="/docs" className="hover:text-fog transition-colors">Docs</Link>
          <Link to="/docs/cli" className="hover:text-fog transition-colors">CLI</Link>
          <Link to="/docs/studio" className="hover:text-fog transition-colors">Studio</Link>
          <a href="https://github.com/lordvins226/quoteforge" className="hover:text-fog transition-colors">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
