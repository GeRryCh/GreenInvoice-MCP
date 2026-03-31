# Green Invoice MCP Server

> **DISCLAIMER: This is an UNOFFICIAL, third-party MCP server. It is NOT affiliated with, endorsed by, or supported by Green Invoice (Optimax Ltd). Use at your own risk. Always verify operations against the official Green Invoice dashboard.**

An MCP (Model Context Protocol) server that provides AI assistants with access to the [Green Invoice](https://www.greeninvoice.co.il/) API for Israeli invoicing and accounting.

## Features

- **Documents** -- Create, search, update, delete, close, send, and preview invoices, receipts, quotes, and other document types
- **Clients** -- Full client management (CRUD + search + document history)
- **Items** -- Product/service catalog management
- **Payment Links** -- Create and check payment link status
- **Webhooks** -- Manage webhook subscriptions
- **Account & Business** -- View account info, settings, and business details
- Automatic JWT token management with caching and refresh
- Built-in rate limiting (~3 req/s to match API limits)
- Sandbox mode support for testing

## Prerequisites

You need API credentials from Green Invoice:

1. Log into your Green Invoice account
2. Go to **My Account** > **Developer Tools** > **API Keys**
3. Click **Add Key** to generate an API ID and Secret

## Installation

### From npm

```bash
npm install -g greeninvoice-mcp
```

### From source

```bash
git clone https://github.com/danielrosehill/GreenInvoice-MCP.git
cd GreenInvoice-MCP
npm install
npm run build
```

## Configuration

The server requires these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `GREENINVOICE_API_ID` | Yes | Your Green Invoice API key ID |
| `GREENINVOICE_API_SECRET` | Yes | Your Green Invoice API key secret |
| `GREENINVOICE_SANDBOX` | No | Set to `true` to use the sandbox environment |

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "greeninvoice": {
      "command": "npx",
      "args": ["-y", "greeninvoice-mcp"],
      "env": {
        "GREENINVOICE_API_ID": "your-api-id-here",
        "GREENINVOICE_API_SECRET": "your-api-secret-here"
      }
    }
  }
}
```

For sandbox/testing:

```json
{
  "mcpServers": {
    "greeninvoice": {
      "command": "npx",
      "args": ["-y", "greeninvoice-mcp"],
      "env": {
        "GREENINVOICE_API_ID": "your-api-id-here",
        "GREENINVOICE_API_SECRET": "your-api-secret-here",
        "GREENINVOICE_SANDBOX": "true"
      }
    }
  }
}
```

### Running from source with Claude Code

If you cloned the repo locally:

```json
{
  "mcpServers": {
    "greeninvoice": {
      "command": "node",
      "args": ["/path/to/GreenInvoice-MCP/dist/index.js"],
      "env": {
        "GREENINVOICE_API_ID": "your-api-id-here",
        "GREENINVOICE_API_SECRET": "your-api-secret-here"
      }
    }
  }
}
```

## Available Tools

### Account & Business

| Tool | Description |
|------|-------------|
| `get_account` | Get current account information |
| `get_account_settings` | Get account settings |
| `get_business` | Get business information |
| `update_business` | Update business information |

### Documents

| Tool | Description |
|------|-------------|
| `search_documents` | Search with filters (type, status, date range, pagination) |
| `get_document` | Get document by ID |
| `create_document` | Create invoice, receipt, quote, etc. |
| `update_document` | Update an existing document |
| `delete_document` | Delete a document |
| `close_document` | Close/mark a document as closed |
| `send_document` | Send document via email |
| `get_document_download_links` | Get PDF download links |
| `add_document_payment` | Add payment to a document |
| `preview_document` | Preview document as PDF |

### Clients

| Tool | Description |
|------|-------------|
| `search_clients` | Search clients with filters |
| `get_client` | Get client by ID |
| `create_client` | Create a new client |
| `update_client` | Update client details |
| `delete_client` | Delete a client |
| `get_client_documents` | Get all documents for a client |

### Items (Catalog)

| Tool | Description |
|------|-------------|
| `search_items` | Search catalog items |
| `get_item` | Get item by ID |
| `create_item` | Create a product/service item |
| `update_item` | Update a catalog item |

### Payment Links

| Tool | Description |
|------|-------------|
| `create_payment_link` | Create a payment collection link |
| `get_payment_link` | Get payment link details |
| `get_payment_link_status` | Check payment link status |

### Webhooks

| Tool | Description |
|------|-------------|
| `create_webhook` | Subscribe to events |
| `get_webhook` | Get webhook details |
| `delete_webhook` | Remove a webhook subscription |

## Document Type Reference

| Code | Type |
|------|------|
| 10 | Price Quote |
| 100 | Order |
| 200 | Delivery Note |
| 305 | Tax Invoice |
| 320 | Tax Invoice + Receipt |
| 330 | Credit Invoice (Refund) |
| 400 | Receipt |
| 405 | Donation Receipt |

## Important API Notes

- Field names differ from what you might expect: use `income` (not `items`), `payment` (not `payments`), `remarks` (not `notes`), `lang` (not `language`), `emails` (array, not `email`)
- Document types 320, 400, and 405 **require** a payment array
- Payment dates cannot be in the future for receipt-type documents
- Set `client.add = true` to auto-create a client during document creation
- Token lasts ~30 minutes; the server handles refresh automatically

## License

MIT

---

**This project is not affiliated with, endorsed by, or supported by Green Invoice (Optimax Ltd). "Green Invoice" is a trademark of its respective owner. This is an independent, community-developed integration.**
