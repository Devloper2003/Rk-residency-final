#!/bin/bash
# Persistent Next.js dev server launcher — survives parent shell exit.
cd /home/z/my-project
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1
rm -f /home/z/my-project/dev.log
# Clear any stale DATABASE_URL from the parent shell so the .env file is
# the single source of truth (the agent shell sometimes leaks an old
# SQLite URL from earlier in the session).
unset DATABASE_URL
# Use setsid to fully detach from the controlling terminal.
setsid env -u DATABASE_URL bun run dev > /home/z/my-project/dev.log 2>&1 < /dev/null &
PID=$!
disown $PID 2>/dev/null || true
echo "dev server launched, pid=$PID"
# Wait for server to be ready
for i in $(seq 1 60); do
  if curl -s --max-time 2 http://127.0.0.1:3000/ > /dev/null 2>&1; then
    echo "ready after ${i}s"
    break
  fi
  sleep 1
done
ps -ef | grep -E 'next-server|next dev' | grep -v grep | head -5
