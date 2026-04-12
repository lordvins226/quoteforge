import { Link } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";

export function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-32 text-center">
        <p className="font-mono text-xs text-mint uppercase tracking-wider mb-3">404</p>
        <h1 className="font-mono text-4xl font-semibold text-fog mb-4">Page not found</h1>
        <p className="text-fog-2 mb-8">That URL doesn't point to anything we render.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-mint text-ink font-medium text-sm hover:bg-mint-2 transition-colors">
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
