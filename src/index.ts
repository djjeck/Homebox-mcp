#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration interface
interface HomeboxConfig {
  homeboxUrl: string;
  email: string;
  password: string;
}

// Homebox API client
class HomeboxClient {
  private axios: AxiosInstance;
  private config: HomeboxConfig;
  private authToken: string | null = null;

  constructor(config: HomeboxConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.homeboxUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.axios.post("/api/v1/users/login", {
        username: this.config.email,
        password: this.config.password,
      });

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        this.axios.defaults.headers.common["Authorization"] = `Bearer ${this.authToken}`;
      } else {
        throw new Error("Authentication failed: No token received");
      }
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async searchItems(query: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get("/api/v1/items", {
        params: { q: query },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to search items: ${error.message}`);
    }
  }

  async getItem(itemId: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get(`/api/v1/items/${itemId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  async listLocations(): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get("/api/v1/locations");
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to list locations: ${error.message}`);
    }
  }

  async getLocation(locationId: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get(`/api/v1/locations/${locationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }

  async listLabels(): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get("/api/v1/labels");
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to list labels: ${error.message}`);
    }
  }

  async getLabel(labelId: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get(`/api/v1/labels/${labelId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get label: ${error.message}`);
    }
  }

  async getItemsByLocation(locationId: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get(`/api/v1/locations/${locationId}/items`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get items by location: ${error.message}`);
    }
  }

  async getItemsByLabel(labelId: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axios.get(`/api/v1/labels/${labelId}/items`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get items by label: ${error.message}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken) {
      await this.authenticate();
    }
  }
}

// Load configuration
function loadConfig(): HomeboxConfig {
  const configPath = join(__dirname, "..", "config.json");
  try {
    const configData = readFileSync(configPath, "utf-8");
    return JSON.parse(configData);
  } catch (error: any) {
    console.error("Error loading config.json:", error.message);
    console.error("Please create a config.json file based on config.json.example");
    process.exit(1);
  }
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "search_items",
    description: "Search for items in your Homebox inventory by name, description, or other fields. Returns a list of matching items with their basic information.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find items",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_item",
    description: "Get detailed information about a specific item by its ID. Returns complete item details including name, description, location, labels, purchase info, warranty info, and more.",
    inputSchema: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description: "The ID of the item to retrieve",
        },
      },
      required: ["itemId"],
    },
  },
  {
    name: "list_locations",
    description: "List all locations in your Homebox inventory. Locations are where items are stored (e.g., 'Kitchen', 'Garage', 'Living Room'). Returns location names, IDs, and descriptions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_location",
    description: "Get detailed information about a specific location by its ID, including its name, description, and parent location if nested.",
    inputSchema: {
      type: "object",
      properties: {
        locationId: {
          type: "string",
          description: "The ID of the location to retrieve",
        },
      },
      required: ["locationId"],
    },
  },
  {
    name: "list_labels",
    description: "List all labels in your Homebox inventory. Labels are used to categorize items (e.g., 'Electronics', 'Important', 'Fragile'). Returns label names, IDs, and descriptions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_label",
    description: "Get detailed information about a specific label by its ID, including its name, description, and color.",
    inputSchema: {
      type: "object",
      properties: {
        labelId: {
          type: "string",
          description: "The ID of the label to retrieve",
        },
      },
      required: ["labelId"],
    },
  },
  {
    name: "get_items_by_location",
    description: "Get all items stored in a specific location. Useful for finding everything in a particular room or storage area.",
    inputSchema: {
      type: "object",
      properties: {
        locationId: {
          type: "string",
          description: "The ID of the location",
        },
      },
      required: ["locationId"],
    },
  },
  {
    name: "get_items_by_label",
    description: "Get all items that have a specific label. Useful for finding all items in a category (e.g., all electronics, all important items).",
    inputSchema: {
      type: "object",
      properties: {
        labelId: {
          type: "string",
          description: "The ID of the label",
        },
      },
      required: ["labelId"],
    },
  },
];

// Main server setup
async function main() {
  console.error("Starting Homebox MCP Server...");

  const config = loadConfig();
  const homeboxClient = new HomeboxClient(config);

  // Test authentication on startup
  try {
    await homeboxClient.authenticate();
    console.error("Successfully authenticated with Homebox");
  } catch (error: any) {
    console.error("Failed to authenticate with Homebox:", error.message);
    console.error("Please check your config.json settings");
    process.exit(1);
  }

  const server = new Server(
    {
      name: "homebox-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_items": {
          const result = await homeboxClient.searchItems(args.query as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_item": {
          const result = await homeboxClient.getItem(args.itemId as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "list_locations": {
          const result = await homeboxClient.listLocations();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_location": {
          const result = await homeboxClient.getLocation(args.locationId as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "list_labels": {
          const result = await homeboxClient.listLabels();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_label": {
          const result = await homeboxClient.getLabel(args.labelId as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_items_by_location": {
          const result = await homeboxClient.getItemsByLocation(args.locationId as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_items_by_label": {
          const result = await homeboxClient.getItemsByLabel(args.labelId as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Homebox MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
