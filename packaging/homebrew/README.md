# Homebrew Tap

`quoteforge.rb` is the formula source, versioned alongside the code.

## One-time setup

1. Create a public repo `lordvins226/homebrew-quoteforge`.
2. Add a `Formula/` directory and copy `quoteforge.rb` into it.
3. Add a fine-grained PAT with `contents: write` on the tap repo and store it
   as `HOMEBREW_TAP_TOKEN` in this repo's Actions secrets.

## Per-release flow

The `homebrew-bump.yml` workflow runs after a successful release publish. It:

1. Downloads the four `.sha256` files from the GitHub Release.
2. Rewrites `quoteforge.rb` with the new version + per-arch sha256 values.
3. Opens a PR against `lordvins226/homebrew-quoteforge` bumping the formula.

Users install with:

```bash
brew install lordvins226/quoteforge/quoteforge
```

## Manual bump fallback

If the workflow fails, bump by hand:

```bash
gh release view v0.1.0 --repo lordvins226/quoteforge \
  --json assets --jq '.assets[] | select(.name | endswith(".sha256")) | .url' \
  | xargs -I{} curl -fsSL {} | paste - -   # file-sha pairs
```

Then update `quoteforge.rb`, commit to the tap's `Formula/` dir, push.
