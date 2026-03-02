#!/usr/bin/env bash
set -e

trap 'kill 0' EXIT

cd "$(dirname "$0")"

echo "Starting backend..."
cd backend
uvicorn main:app --reload &

echo "Starting frontend..."
cd ../frontend
npm run dev &

wait
