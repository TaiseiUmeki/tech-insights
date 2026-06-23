#!/bin/bash
# .claude/hooks/validate-command.sh
# Pre-tool validation hook for Claude Code
# Blocks dangerous command patterns before execution

COMMAND=$(jq -r '.tool_input.command' < /dev/stdin)

# Block rm -rf with root or wildcard targets
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+(/|~|\*|\.\.)'; then
  echo "Blocked: destructive rm -rf command is not allowed" >&2
  exit 2
fi

# Block piping remote scripts to shell
if echo "$COMMAND" | grep -qE '(curl|wget).*\|\s*(bash|sh|zsh)'; then
  echo "Blocked: piping remote scripts to shell is not allowed" >&2
  exit 2
fi

# Block access to production environments
if echo "$COMMAND" | grep -qE '\b(prod|production)\b.*\b(deploy|push|ssh|connect|exec)\b'; then
  echo "Blocked: production environment access is not allowed" >&2
  exit 2
fi

# Block reading secret files via shell commands
if echo "$COMMAND" | grep -qE '(cat|head|tail|less|more|vi|vim|nano)\s+.*\.(env|pem|key)\b'; then
  echo "Blocked: reading secret files via shell is not allowed" >&2
  exit 2
fi

# Block chmod 777
if echo "$COMMAND" | grep -qE 'chmod\s+777'; then
  echo "Blocked: chmod 777 is not allowed (use more restrictive permissions)" >&2
  exit 2
fi

exit 0
