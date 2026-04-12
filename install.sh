#!/usr/bin/env sh
set -eu

REPO="lordvins226/quoteforge"
INSTALL_DIR="${QUOTEFORGE_INSTALL_DIR:-$HOME/.local/bin}"

fail() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

detect_triple() {
  uname_s=$(uname -s)
  uname_m=$(uname -m)

  case "$uname_s" in
    Darwin)
      case "$uname_m" in
        arm64|aarch64) echo "aarch64-apple-darwin" ;;
        x86_64) echo "x86_64-apple-darwin" ;;
        *) fail "unsupported macOS arch: $uname_m" ;;
      esac
      ;;
    Linux)
      case "$uname_m" in
        x86_64) echo "x86_64-unknown-linux-gnu" ;;
        aarch64|arm64) echo "aarch64-unknown-linux-gnu" ;;
        *) fail "unsupported Linux arch: $uname_m" ;;
      esac
      ;;
    *)
      fail "unsupported OS: $uname_s (use cargo/bun install or Windows release zip)"
      ;;
  esac
}

resolve_version() {
  if [ "${QUOTEFORGE_VERSION:-latest}" = "latest" ]; then
    curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
      | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' \
      | head -n1
  else
    printf '%s' "$QUOTEFORGE_VERSION"
  fi
}

verify_sha256() {
  archive="$1"
  expected="$2"
  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "$archive" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    actual=$(shasum -a 256 "$archive" | awk '{print $1}')
  else
    printf 'warning: no sha256 tool found, skipping checksum verification\n' >&2
    return 0
  fi
  if [ "$actual" != "$expected" ]; then
    fail "sha256 mismatch: expected $expected, got $actual"
  fi
}

main() {
  command -v curl >/dev/null 2>&1 || fail "curl is required"
  command -v tar >/dev/null 2>&1 || fail "tar is required"

  triple=$(detect_triple)
  version=$(resolve_version)
  [ -n "$version" ] || fail "could not resolve release version (set QUOTEFORGE_VERSION to override)"

  archive="quoteforge-$triple.tar.gz"
  url="https://github.com/$REPO/releases/download/$version/$archive"
  sha_url="$url.sha256"

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT

  printf 'downloading %s %s...\n' "$version" "$triple"
  curl -fsSL -o "$tmp/$archive" "$url" || fail "download failed: $url"

  if curl -fsSL -o "$tmp/$archive.sha256" "$sha_url" 2>/dev/null; then
    expected=$(awk '{print $1}' "$tmp/$archive.sha256")
    verify_sha256 "$tmp/$archive" "$expected"
    printf 'sha256 ok\n'
  else
    printf 'warning: no sha256 file published, skipping verification\n' >&2
  fi

  mkdir -p "$INSTALL_DIR"
  tar -xzf "$tmp/$archive" -C "$tmp"
  mv "$tmp/quoteforge" "$INSTALL_DIR/quoteforge"
  chmod +x "$INSTALL_DIR/quoteforge"

  printf '\ninstalled quoteforge %s to %s/quoteforge\n' "$version" "$INSTALL_DIR"

  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
      printf '\nadd %s to your PATH:\n' "$INSTALL_DIR"
      printf '  echo '\''export PATH="%s:$PATH"'\'' >> ~/.zshrc   # or ~/.bashrc\n' "$INSTALL_DIR"
      ;;
  esac

  printf '\nverify with: quoteforge doctor\n'
}

main "$@"
