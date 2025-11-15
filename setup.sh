#!/bin/bash

# Homebox MCP Server Setup Script
# This script helps you set up the Homebox MCP server

echo "======================================="
echo "Homebox MCP Server Setup"
echo "======================================="
echo ""

# Check if Node.js is installed
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Download the LTS version and run the installer."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"
echo ""

# Check if npm is installed
echo "Checking for npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "npm usually comes with Node.js. Please reinstall Node.js."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm found: $NPM_VERSION"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "Creating config.json from template..."
    cp config.json.example config.json
    echo "✅ config.json created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit config.json and add your Homebox details:"
    echo "   - homeboxUrl: The URL where your Homebox is running"
    echo "   - email: Your Homebox login email"
    echo "   - password: Your Homebox login password"
    echo ""
    echo "You can edit it with any text editor:"
    echo "   nano config.json"
    echo "   or"
    echo "   vim config.json"
    echo "   or open it in your preferred editor"
    echo ""
    read -p "Press Enter once you've edited config.json..."
else
    echo "✅ config.json already exists"
    echo ""
fi

# Build the server
echo "Building the server..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build the server"
    exit 1
fi

echo "✅ Server built successfully"
echo ""

echo "======================================="
echo "Setup Complete!"
echo "======================================="
echo ""
echo "Next steps:"
echo "1. Make sure your Homebox instance is running"
echo "2. Test the server with: npm start"
echo "3. Configure Claude Desktop (see README.md)"
echo ""
echo "For detailed instructions, see README.md"
