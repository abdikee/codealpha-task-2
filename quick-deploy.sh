#!/bin/bash

# Quick Deploy Script for Social Media Platform
# This script automates the deployment process

set -e  # Exit on error

echo "=========================================="
echo "  Social Media Platform - Quick Deploy"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found .env file"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node --version) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm $(npm --version) is installed"

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo ""
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend built successfully"
else
    echo -e "${RED}✗${NC} Frontend build failed"
    exit 1
fi

# Install server dependencies
echo ""
echo "Installing server dependencies..."
cd server
npm install

# Run production setup
echo ""
echo "Running production setup checks..."
node setup-production.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Production setup completed"
else
    echo -e "${RED}✗${NC} Production setup failed"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo -e "${YELLOW}PM2 is not installed. Installing globally...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✓${NC} PM2 is installed"

# Ask if user wants to start the server
echo ""
read -p "Do you want to start the server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting server with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  Deployment Successful! 🎉"
    echo "==========================================${NC}"
    echo ""
    echo "Server is running. Useful commands:"
    echo "  pm2 status              - Check server status"
    echo "  pm2 logs                - View logs"
    echo "  pm2 monit               - Monitor resources"
    echo "  pm2 restart all         - Restart server"
    echo "  pm2 stop all            - Stop server"
    echo ""
    echo "Health check: curl http://localhost:3000/health"
    echo ""
else
    echo ""
    echo -e "${GREEN}Setup complete!${NC}"
    echo ""
    echo "To start the server manually:"
    echo "  cd server"
    echo "  pm2 start ecosystem.config.js --env production"
    echo ""
fi
