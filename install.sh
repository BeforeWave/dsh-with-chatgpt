#!/bin/sh
set -eu

# Stable raw bootstrap. Version selection is an argument; versioned artifacts live in GitHub Releases.
# curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh
# curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh -s -- 0.1.4

VERSION=${DSH_WITH_CHATGPT_VERSION:-${1:-latest}}
VERSION=${VERSION#v}
RELEASE_URL=${DSH_WITH_CHATGPT_RELEASE_URL:-https://github.com/BeforeWave/dsh-with-chatgpt/releases}
RELEASE_TOOL_URL=${BEFOREWAVE_RELEASE_TOOL_URL:-https://raw.githubusercontent.com/BeforeWave/agent-helm/main/install-release.sh}
PROFILE=${DSH_WITH_CHATGPT_PROFILE:-web}

fail() {
  printf '%s\n' "DSH with ChatGPT installer: $1" >&2
  exit 1
}

stage() {
  printf '%s\n' "DSH with ChatGPT [$1/3] $2"
}

release_tool() {
  curl -fsSL "$RELEASE_TOOL_URL" | /bin/sh -s -- "$@"
}

stage 1 "DSH host check"
command -v dsh >/dev/null 2>&1 || fail "dsh is required. Install DSH Desktop/CLI first."
command -v curl >/dev/null 2>&1 || fail "curl is required."

VERSION=$(release_tool resolve --release-url "$RELEASE_URL" --version "$VERSION") \
  || fail "Could not resolve DSH with ChatGPT GitHub Release version."
stage 2 "GitHub Release ${VERSION}"

ROOT=$(mktemp -d "${TMPDIR:-/tmp}/dsh-with-chatgpt-release.XXXXXX")
trap 'rm -rf "$ROOT"' EXIT HUP INT TERM
ARCHIVE=$ROOT/dsh-with-chatgpt.tgz
release_tool download \
  --release-url "$RELEASE_URL" \
  --version "$VERSION" \
  --artifact-id dsh-with-chatgpt-package \
  --output "$ARCHIVE" >/dev/null \
  || fail "Could not download DSH with ChatGPT GitHub Release v$VERSION."

dsh plugin --profile "$PROFILE" add "$ARCHIVE"
trap - EXIT HUP INT TERM
rm -rf "$ROOT"

stage 3 "Installed in DSH profile ${PROFILE}"
printf '%s\n' "DSH with ChatGPT ${VERSION} installed. Start with: dsh ${PROFILE}"
