#!/bin/sh
set -e

cat << 'BANNER'

        (\(\
        ( -.-)    {  H o p L o g  }
        o_(")(")
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     A simple blog built for developers
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

BANNER

if [ ! -d "/app/content" ] || [ -z "$(ls -A /app/content 2>/dev/null)" ]; then
  cp -r /app/content-seed/. /app/content/
fi

# profile.yml fallback: copy from example if missing
if [ ! -f "/app/content/profile.yml" ] && [ -f "/app/content/profile.example.yml" ]; then
  cp /app/content/profile.example.yml /app/content/profile.yml
fi

PUID=${PUID:-1001}
PGID=${PGID:-1001}

chown -R "$PUID:$PGID" /app/content

exec su-exec "$PUID:$PGID" "$@"
