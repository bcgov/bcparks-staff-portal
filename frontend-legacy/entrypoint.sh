#!/bin/sh

# Populate env.js for the legacy frontend

if [ -n "$REACT_APP_CMS_BASE_URL" ]; then
  echo "window.REACT_APP_CMS_BASE_URL = \"$REACT_APP_CMS_BASE_URL\";" >> $APP_ROOT/js/env.js
fi

if [ -n "$REACT_APP_FRONTEND_BASE_URL" ]; then
  echo "window.REACT_APP_FRONTEND_BASE_URL = \"$REACT_APP_FRONTEND_BASE_URL\";" >> $APP_ROOT/js/env.js
fi

if [ -n "$REACT_APP_KEYCLOAK_AUTH_URL" ]; then
  echo "window.REACT_APP_KEYCLOAK_AUTH_URL = \"$REACT_APP_KEYCLOAK_AUTH_URL\";" >> $APP_ROOT/js/env.js
fi

if [ -n "$REACT_APP_KEYCLOAK_REALM" ]; then
  echo "window.REACT_APP_KEYCLOAK_REALM = \"$REACT_APP_KEYCLOAK_REALM\";" >> $APP_ROOT/js/env.js
fi

if [ -n "$REACT_APP_KEYCLOAK_CLIENT_ID" ]; then
  echo "window.REACT_APP_KEYCLOAK_CLIENT_ID = \"$REACT_APP_KEYCLOAK_CLIENT_ID\";" >> $APP_ROOT/js/env.js
fi

if [ -n "$REACT_APP_STAT_HOLIDAY_API" ]; then
  echo "window.REACT_APP_STAT_HOLIDAY_API = \"$REACT_APP_STAT_HOLIDAY_API\";" >> $APP_ROOT/js/env.js
fi

if [ -n "$REACT_APP_PUBLIC_URL" ]; then
  echo "window.REACT_APP_PUBLIC_URL = \"$REACT_APP_PUBLIC_URL\";" >> $APP_ROOT/js/env.js
fi

# Populate env.js for the v2 frontend

if [ -n "$VITE_OIDC_AUTHORITY" ]; then
  echo "window.envVars.VITE_OIDC_AUTHORITY = \"$VITE_OIDC_AUTHORITY\";" >> $V2_APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_CLIENT_ID" ]; then
  echo "window.envVars.VITE_OIDC_CLIENT_ID = \"$VITE_OIDC_CLIENT_ID\";" >> $V2_APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_LOGIN_REDIRECT" ]; then
  echo "window.envVars.VITE_OIDC_LOGIN_REDIRECT = \"$VITE_OIDC_LOGIN_REDIRECT\";" >> $V2_APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_LOGOUT_REDIRECT" ]; then
  echo "window.envVars.VITE_OIDC_LOGOUT_REDIRECT = \"$VITE_OIDC_LOGOUT_REDIRECT\";" >> $V2_APP_ROOT/env.js
fi

# Start the server

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
