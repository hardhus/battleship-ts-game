#!/bin/bash

cd /home/hardhus/Desktop/WEB/battleship-ts-game/

echo "Installing dependencies..."
pnpm install

echo "Building the project with Vite..."
pnpm build

echo "Cleaning up old PM2 processes..."
pm2 delete battleship --silent

pm2 serve dist --name "battleship" --port 4000

pm2 startup

pm2 save

echo "Deployment completed!"