#!/usr/bin/env node

/**
 * Green Invoice MCP Server
 *
 * DISCLAIMER: This is an UNOFFICIAL, third-party MCP server for the Green Invoice API.
 * It is NOT affiliated with, endorsed by, or supported by Green Invoice (Optimax Ltd).
 * Use at your own risk. Always verify operations against the official Green Invoice dashboard.
 *
 * @see https://www.greeninvoice.co.il/api-docs/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GreenInvoiceClient } from "./client.js";
import { registerTools } from "./tools.js";

// Determine active environment
const envVar = process.env.GREENINVOICE_ENVIRONMENT?.toLowerCase();
const legacySandbox = process.env.GREENINVOICE_SANDBOX === "true";
const isSandbox = envVar === "sandbox" || (!envVar && legacySandbox);

// Resolve credentials for the active environment
const API_ID = isSandbox
  ? (process.env.GREENINVOICE_SANDBOX_API_ID || process.env.GREENINVOICE_API_ID)
  : (process.env.GREENINVOICE_PRODUCTION_API_ID || process.env.GREENINVOICE_API_ID);

const API_SECRET = isSandbox
  ? (process.env.GREENINVOICE_SANDBOX_API_SECRET || process.env.GREENINVOICE_API_SECRET)
  : (process.env.GREENINVOICE_PRODUCTION_API_SECRET || process.env.GREENINVOICE_API_SECRET);

if (!API_ID || !API_SECRET) {
  const env = isSandbox ? "sandbox" : "production";
  console.error(
    `Error: No API credentials found for the ${env} environment.\n` +
      `Set GREENINVOICE_${env.toUpperCase()}_API_ID and GREENINVOICE_${env.toUpperCase()}_API_SECRET,\n` +
      `or the fallback GREENINVOICE_API_ID and GREENINVOICE_API_SECRET.\n` +
      "Get your API credentials from Green Invoice: My Account > Developer Tools > API Keys > Add Key"
  );
  process.exit(1);
}

console.error(`[green-invoice-mcp] Environment: ${isSandbox ? "sandbox" : "production"}`);

const server = new McpServer({
  name: "greeninvoice-mcp",
  version: "0.1.0",
  description:
    "Unofficial MCP server for the Green Invoice API. Not affiliated with or endorsed by Green Invoice.",
});

const client = new GreenInvoiceClient(API_ID, API_SECRET, isSandbox);

registerTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
