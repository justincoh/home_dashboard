#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Starting backend..."
cd backend
uvicorn main:app --reload &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo
echo "backend  (uvicorn) PID: $BACKEND_PID"
echo "frontend (vite)    PID: $FRONTEND_PID"
echo "stop with: kill $BACKEND_PID $FRONTEND_PID"
