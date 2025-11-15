# QNAP Quick Start Guide

This is a simplified guide specifically for QNAP Container Station users who want to run the Homebox MCP Server alongside their Homebox installation.

## Overview

You have Homebox running in a Docker container on your QNAP. This guide will help you add the MCP server as another container that can talk to Homebox and be accessed by Claude Desktop.

## What You Need

- QNAP NAS with Container Station installed
- Homebox already running in Container Station
- Your Homebox login email and password
- (Optional) SSH access to your QNAP for easier setup

## Installation Steps

### Step 1: Get the Files on Your QNAP

**Option A: Using Git (Recommended)**

1. SSH into your QNAP:
   ```bash
   ssh admin@your-qnap-ip
   ```

2. Navigate to the Container folder:
   ```bash
   cd /share/Container
   ```

3. Clone this repository:
   ```bash
   git clone <repository-url> homebox-mcp
   cd homebox-mcp
   ```

**Option B: Manual Upload**

1. Download all files from this repository as a ZIP
2. Extract the ZIP on your computer
3. Use QNAP File Station to create a folder: `/share/Container/homebox-mcp`
4. Upload all files to that folder

### Step 2: Find Your Homebox Network Name

You need to know what Docker network your Homebox container uses:

**Method A: Container Station UI**
1. Open Container Station on your QNAP
2. Click on your Homebox container
3. Look at the "Network" section
4. Note the network name (looks like: `qnet-static-eth0-xxxxxx`)

**Method B: SSH Command**
```bash
ssh admin@your-qnap-ip
docker inspect homebox --format='{{.HostConfig.NetworkMode}}'
```

Write down this network name - you'll need it!

### Step 3: Configure the MCP Server

**Edit the docker-compose file:**

1. Open `/share/Container/homebox-mcp/docker-compose.qnap.yml` in a text editor

2. Update these lines:
   ```yaml
   environment:
     - HOMEBOX_URL=http://homebox:7745
     - HOMEBOX_EMAIL=your-email@example.com      # <-- Change this
     - HOMEBOX_PASSWORD=your-password             # <-- Change this

   networks:
     - qnet-static-eth0-xxxxxx                    # <-- Change this to your network name
   ```

3. At the bottom, also update:
   ```yaml
   networks:
     qnet-static-eth0-xxxxxx:                     # <-- Change this too
       external: true
   ```

4. Save the file

**Important Notes:**
- Replace `your-email@example.com` with your Homebox email
- Replace `your-password` with your Homebox password
- Replace `qnet-static-eth0-xxxxxx` with the network name from Step 2
- The network name appears in TWO places - update both!

### Step 4: Deploy the Container

**Method A: Container Station UI**

1. Open Container Station
2. Click "Create" → "Create Application"
3. Name it: `homebox-mcp`
4. Copy and paste the contents of your edited `docker-compose.qnap.yml`
5. Click "Validate and Apply"
6. Click "Create"

The system will build the Docker image (this takes a few minutes the first time) and start the container.

**Method B: SSH Command Line**

```bash
ssh admin@your-qnap-ip
cd /share/Container/homebox-mcp
docker-compose -f docker-compose.qnap.yml up -d --build
```

### Step 5: Verify It's Working

**Check the logs:**

In Container Station:
1. Click on the `homebox-mcp-server` container
2. Click "Logs"
3. You should see:
   ```
   Starting Homebox MCP Server...
   Loaded configuration from environment variables
   Successfully authenticated with Homebox
   Homebox MCP Server running on stdio
   ```

Or via SSH:
```bash
docker logs homebox-mcp-server
```

**If you see errors:**
- "Authentication failed" - Check your email/password
- "Cannot connect" - Check the network configuration
- See [DOCKER.md](DOCKER.md) for detailed troubleshooting

### Step 6: Connect Claude Desktop

Now you need to tell Claude Desktop how to access the MCP server running on your QNAP.

**Option A: If Claude Desktop is on the same network as QNAP**

Edit your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this:
```json
{
  "mcpServers": {
    "homebox": {
      "command": "ssh",
      "args": [
        "admin@your-qnap-ip",
        "docker",
        "exec",
        "-i",
        "homebox-mcp-server",
        "node",
        "/app/dist/index.js"
      ]
    }
  }
}
```

**Important:** Replace `admin@your-qnap-ip` with your actual QNAP username and IP address.

**Option B: If you have Docker installed locally**

Some QNAP models allow remote Docker access. If configured:

```json
{
  "mcpServers": {
    "homebox": {
      "command": "docker",
      "args": [
        "-H",
        "tcp://your-qnap-ip:2376",
        "exec",
        "-i",
        "homebox-mcp-server",
        "node",
        "/app/dist/index.js"
      ]
    }
  }
}
```

### Step 7: Set Up SSH Keys (For Option A)

Claude Desktop requires SSH key authentication (not password).

**On your computer:**

1. Generate SSH key if you don't have one:
   ```bash
   ssh-keygen -t rsa -b 4096
   ```
   Press Enter to accept defaults

2. Copy key to QNAP:
   ```bash
   ssh-copy-id admin@your-qnap-ip
   ```
   Enter your QNAP password when prompted

3. Test SSH connection:
   ```bash
   ssh admin@your-qnap-ip echo "success"
   ```
   Should print "success" without asking for password

### Step 8: Test with Claude

1. Restart Claude Desktop
2. Open a new conversation
3. Ask: "Can you list all the locations in my Homebox inventory?"

If it works, Claude will show your locations! 🎉

## Common Issues

### "Authentication failed"

**Problem:** Wrong email or password

**Solution:**
1. Stop the container in Container Station
2. Edit `docker-compose.qnap.yml` with correct credentials
3. Rebuild: `docker-compose -f docker-compose.qnap.yml up -d --build`

### "Cannot connect to Homebox"

**Problem:** Containers can't talk to each other

**Solution:**
1. Verify both containers are on the same network
2. Check your Homebox container name:
   ```bash
   docker ps --format '{{.Names}}' | grep homebox
   ```
3. Update HOMEBOX_URL to match the exact container name

### Claude can't connect

**Problem:** SSH or Docker connection issue

**Solution:**
1. Test SSH manually: `ssh admin@your-qnap-ip docker ps`
2. Verify SSH keys are set up (no password prompt)
3. Check container is running: `docker ps | grep homebox-mcp`

### Container keeps restarting

**Problem:** Configuration error

**Solution:**
1. Check logs: `docker logs homebox-mcp-server`
2. Common causes:
   - Invalid JSON in config
   - Missing environment variables
   - Network misconfiguration

## Updating the MCP Server

When a new version is released:

```bash
ssh admin@your-qnap-ip
cd /share/Container/homebox-mcp
git pull
docker-compose -f docker-compose.qnap.yml down
docker-compose -f docker-compose.qnap.yml up -d --build
```

## Security Tips

1. **Keep credentials secure** - The environment variables contain your password
2. **Use SSH keys** - Don't use password authentication for SSH
3. **Restrict SSH access** - Only allow SSH from trusted IPs if possible
4. **Keep QNAP updated** - Regular system updates improve security
5. **Use strong passwords** - For both QNAP and Homebox

## Need More Help?

- **Detailed Docker guide**: See [DOCKER.md](DOCKER.md)
- **General setup**: See [README.md](README.md)
- **Example queries**: See [EXAMPLES.md](EXAMPLES.md)
- **QNAP Container Station docs**: [QNAP Official Guide](https://www.qnap.com/en/how-to/tutorial/article/how-to-use-container-station)

## Architecture Diagram

```
┌─────────────────┐
│ Claude Desktop  │
│ (Your Computer) │
└────────┬────────┘
         │ SSH
         ↓
┌─────────────────────────────────────┐
│         QNAP Container Station      │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Homebox    │←→│  MCP Server │ │
│  │  Container   │  │  Container  │ │
│  └──────────────┘  └─────────────┘ │
│         ↑                ↑          │
│         └────────────────┘          │
│      Same Docker Network            │
└─────────────────────────────────────┘
```

The MCP Server container talks to Homebox via the Docker network, and Claude Desktop talks to the MCP Server via SSH (which executes commands inside the container).
