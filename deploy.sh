#!/bin/bash

cd /home/hardhus/Desktop/WEB/battleship-ts-game/ || exit 1


echo "Pulling latest changes from Git..."
git pull

echo "Installing dependencies..."
pnpm install || exit 1

echo "Building the project with Vite..."
pnpm build || exit 1

echo "Cleaning up old PM2 processes..."
pm2 delete battleship --silent 

echo "Starting the app with PM2..."
pm2 serve dist --name "battleship" --port 4000 || exit 1

echo "Configuring PM2 to restart on boot..."
pm2 startup || exit 1

echo "Saving PM2 process list..."
pm2 save || exit 1

echo "Deployment completed successfully!"