#!/bin/sh

echo "window.envVars = {};" > $APP_ROOT/env.js

if [ -n "$VITE_OIDC_AUTHORITY" ]; then
  echo "window.envVars.VITE_OIDC_AUTHORITY = \"$VITE_OIDC_AUTHORITY\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_CLIENT_ID" ]; then
  echo "window.envVars.VITE_OIDC_CLIENT_ID = \"$VITE_OIDC_CLIENT_ID\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_LOGIN_REDIRECT" ]; then
  echo "window.envVars.VITE_OIDC_LOGIN_REDIRECT = \"$VITE_OIDC_LOGIN_REDIRECT\";" >> $APP_ROOT/env.js
fi

if [ -n "$VITE_OIDC_LOGOUT_REDIRECT" ]; then
  echo "window.envVars.VITE_OIDC_LOGOUT_REDIRECT = \"$VITE_OIDC_LOGOUT_REDIRECT\";" >> $APP_ROOT/env.js
fi
