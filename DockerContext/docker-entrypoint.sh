#!/bin/sh
# Generate /usr/share/nginx/html/config.js at container startup from runtime env vars.
# This replaces the build-time ARG injection previously used in the Dockerfile.
cat > /usr/share/nginx/html/config.js <<EOF
window.__JEJUNE_CONFIG__ = {
  DOCS_SERVER_URL:      "${JEJUNE_DOCS_SERVER_URL:-}",
  MARKDOWN_TRIGGER_URL: "${JEJUNE_MARKDOWN_TRIGGER_URL:-}",
  MARKDOWN_BROWSER_URL: "${JEJUNE_MARKDOWN_BROWSER_URL:-}",
  OXIGRAPH_URL:         "${JEJUNE_OXIGRAPH_URL:-}"
};
EOF
exec nginx -g 'daemon off;'
