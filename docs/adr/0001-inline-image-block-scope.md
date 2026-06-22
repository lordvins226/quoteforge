# ADR 0001 — Inline image block: scope and deferred capabilities

- Status: Accepted
- Date: 2026-06-22
- Related spec: [docs/specs/2026-06-22-image-block-design.md](../specs/2026-06-22-image-block-design.md)

## Context

Users need to include images in cards and decks and control their placement. The
rendering pipeline is a vertical flow of typed blocks (`headline`, `divider`,
`spacer`, …) defined by a single Zod discriminated union and rendered through
per-type Nunjucks partials. Several image models are possible — inline (flow),
background, and free/absolute positioning — with increasing complexity.

## Decision

Ship V1 as an **inline image block** only: a new member of the block union that
flows in block order, with `align` (left/center/right), `width` (sm/md/lg/full),
and `alt`. Source may be a remote URL, a local file path (CLI), or a data-URI;
resolution to a Puppeteer-loadable `src` happens server-side, never in React.

## Deferred (explicitly out of scope for V1)

Each is recorded so the boundary is intentional, not an oversight:

1. **Rounded corners / border** — needs theme-driven color custom properties
   (CLAUDE.md #3) and a border-radius scale; purely cosmetic, no blocker.
2. **Caption text** — a themed sub-text under the image; adds a styling surface and
   another field; revisit once inline images are in real use.
3. **Background image** — a different layout model (image behind the card with an
   overlay for legibility); separate schema shape and CSS path. Worth its own spec.
4. **Absolute (x/y) positioning + drag-to-place** — the most flexible and most
   complex model; requires coordinate storage, overlap/z-index rules, and dnd-kit
   work in the studio. Deferred until there is demonstrated need.

## Consequences

- The schema, template, and studio changes stay small and follow existing patterns,
  keeping V1 low-risk and quick to review.
- Each deferred capability is additive: rounded corners and caption extend the same
  block; background and absolute positioning are new models that should get their
  own ADR + spec rather than being bolted onto the inline block.
- If a deferred item is later picked up, supersede or extend this ADR rather than
  silently widening the inline block's responsibilities.
