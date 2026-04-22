#!/bin/sh

# Populate env.js for the frontend
# This allows us to inject environment variables at runtime,
# which is necessary because the frontend static files are only built once
# and then reused across various environments.

if [ -n "$VITE_CMS_BASE_URL" ]; then
  echo "window.envVars.VITE_CMS_BASE_URL = \"$VITE_CMS_BASE_URL\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_FRONTEND_BASE_URL" ]; then
  echo "window.envVars.VITE_FRONTEND_BASE_URL = \"$VITE_FRONTEND_BASE_URL\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_STAT_HOLIDAY_API" ]; then
  echo "window.envVars.VITE_STAT_HOLIDAY_API = \"$VITE_STAT_HOLIDAY_API\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_BCPARKS_PUBLIC_URL" ]; then
  echo "window.envVars.VITE_BCPARKS_PUBLIC_URL = \"$VITE_BCPARKS_PUBLIC_URL\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_AUTHORITY" ]; then
  echo "window.envVars.VITE_OIDC_AUTHORITY = \"$VITE_OIDC_AUTHORITY\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_CLIENT_ID" ]; then
  echo "window.envVars.VITE_OIDC_CLIENT_ID = \"$VITE_OIDC_CLIENT_ID\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_API_BASE_URL" ]; then
  echo "window.envVars.VITE_API_BASE_URL = \"$VITE_API_BASE_URL\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_CKEDITOR_LICENSE_KEY" ]; then
  echo "window.envVars.VITE_CKEDITOR_LICENSE_KEY = \"$VITE_CKEDITOR_LICENSE_KEY\";" >> $APP_ROOT/env.js
fi

# Start the server

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
