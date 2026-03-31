/**
 * MCP tool definitions for the Green Invoice API.
 *
 * DISCLAIMER: This is an unofficial, third-party integration.
 * Not affiliated with or endorsed by Green Invoice.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GreenInvoiceClient } from "./client.js";

// ── Reference data exposed as tool descriptions ──────────────────────────

const DOC_TYPES_DESC = `Document type codes:
10=Price Quote, 100=Order, 200=Delivery Note, 210=Return Delivery Note,
300=Transaction Account, 305=Tax Invoice, 320=Tax Invoice+Receipt,
330=Credit Invoice, 400=Receipt, 405=Donation Receipt,
500=Purchase Order, 600=Deposit Receipt, 610=Deposit Withdrawal`;

const PAYMENT_TYPES_DESC = `Payment type codes:
-1=Unpaid, 0=Deduction at Source, 1=Cash, 2=Check, 3=Credit Card,
4=Bank Transfer, 5=PayPal, 10=Payment App, 11=Other`;

const CURRENCY_DESC = `Currencies: ILS, USD, EUR, GBP, JPY, CHF, CNY, AUD, CAD, and more`;

export function registerTools(server: McpServer, client: GreenInvoiceClient) {
  // ════════════════════════════════════════════════════════════════════
  //  ACCOUNT
  // ════════════════════════════════════════════════════════════════════

  server.tool("get_account", "Get current account information", {}, async () => {
    const data = await client.get("/account/me");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool(
    "get_account_settings",
    "Get account settings",
    {},
    async () => {
      const data = await client.get("/account/settings");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ════════════════════════════════════════════════════════════════════
  //  BUSINESSES
  // ════════════════════════════════════════════════════════════════════

  server.tool(
    "get_business",
    "Get business information for the authenticated account",
    {},
    async () => {
      const data = await client.get("/businesses");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_business",
    "Update business information",
    { data: z.string().describe("JSON string of business fields to update") },
    async ({ data }) => {
      const result = await client.put("/businesses", JSON.parse(data));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ════════════════════════════════════════════════════════════════════
  //  DOCUMENTS
  // ════════════════════════════════════════════════════════════════════

  server.tool(
    "search_documents",
    `Search documents with filters and pagination. ${DOC_TYPES_DESC}. Document statuses: 0=Open, 1=Closed, 2=Manually Closed, 3=Canceling, 4=Canceled`,
    {
      page: z.number().optional().describe("Page number (default 0)"),
      pageSize: z
        .number()
        .optional()
        .describe("Results per page (default 20, max 50)"),
      type: z
        .array(z.number())
        .optional()
        .describe("Filter by document type codes"),
      status: z
        .array(z.number())
        .optional()
        .describe("Filter by status codes"),
      fromDate: z.string().optional().describe("From date (YYYY-MM-DD)"),
      toDate: z.string().optional().describe("To date (YYYY-MM-DD)"),
      sort: z
        .string()
        .optional()
        .describe("Sort field (e.g. 'creationDate', 'documentDate')"),
      sortType: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction"),
    },
    async (params) => {
      const data = await client.post("/documents/search", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_document",
    "Get a document by ID",
    { id: z.string().describe("Document ID") },
    async ({ id }) => {
      const data = await client.get(`/documents/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_document",
    `Create a new document (invoice, receipt, quote, etc.).
${DOC_TYPES_DESC}
${PAYMENT_TYPES_DESC}
${CURRENCY_DESC}

IMPORTANT field names: use 'income' (not 'items'), 'payment' (not 'payments'),
'remarks' (not 'notes'), 'lang' (not 'language'), 'emails' (array, not 'email').
Types 320, 400, 405 REQUIRE a payment array. Payment dates cannot be in the future for receipts.
Set client.add=true to auto-create the client if they don't exist.`,
    {
      type: z.number().describe("Document type code (e.g. 305, 320)"),
      client: z
        .object({
          id: z.string().optional().describe("Existing client ID"),
          name: z.string().optional().describe("Client name"),
          emails: z
            .array(z.string())
            .optional()
            .describe("Client email addresses"),
          taxId: z.string().optional().describe("Client tax/VAT ID"),
          add: z
            .boolean()
            .optional()
            .describe("Auto-create client if not found"),
        })
        .describe("Client information"),
      income: z
        .array(
          z.object({
            description: z.string().describe("Line item description"),
            quantity: z.number().describe("Quantity"),
            price: z.number().describe("Unit price"),
            currency: z.string().optional().describe("Currency code"),
            vatType: z
              .number()
              .optional()
              .describe("0=default, 1=VAT included, 2=VAT exempt"),
          })
        )
        .describe("Income line items"),
      payment: z
        .array(
          z.object({
            type: z.number().describe("Payment type code"),
            price: z.number().describe("Payment amount"),
            currency: z.string().optional().describe("Currency code"),
            date: z.string().describe("Payment date (YYYY-MM-DD)"),
            bankName: z.string().optional(),
            bankBranch: z.string().optional(),
            bankAccount: z.string().optional(),
            chequeNum: z.string().optional(),
          })
        )
        .optional()
        .describe("Payment lines (required for types 320, 400, 405)"),
      currency: z.string().optional().describe("Document currency (default ILS)"),
      lang: z.enum(["he", "en"]).optional().describe("Document language"),
      description: z.string().optional().describe("Document description/title"),
      remarks: z.string().optional().describe("Remarks/notes"),
      footer: z.string().optional().describe("Footer text"),
      emailContent: z.string().optional().describe("Custom email body"),
      signed: z.boolean().optional().describe("Digitally sign the document"),
      rounding: z.boolean().optional().describe("Round totals"),
      attachment: z.boolean().optional().describe("Attach PDF to email"),
    },
    async (params) => {
      const data = await client.post("/documents", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_document",
    "Update an existing document",
    {
      id: z.string().describe("Document ID"),
      data: z.string().describe("JSON string of fields to update"),
    },
    async ({ id, data }) => {
      const result = await client.put(`/documents/${id}`, JSON.parse(data));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_document",
    "Delete a document by ID",
    { id: z.string().describe("Document ID") },
    async ({ id }) => {
      const data = await client.delete(`/documents/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "close_document",
    "Close/mark a document as closed",
    { id: z.string().describe("Document ID") },
    async ({ id }) => {
      const data = await client.post(`/documents/${id}/close`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "send_document",
    "Send a document via email",
    {
      id: z.string().describe("Document ID"),
      email: z.string().optional().describe("Override recipient email"),
    },
    async ({ id, ...rest }) => {
      const data = await client.post(`/documents/${id}/send`, rest);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_document_download_links",
    "Get download links (Hebrew, English, original) for a document",
    { id: z.string().describe("Document ID") },
    async ({ id }) => {
      const data = await client.get(`/documents/${id}/download/links`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "add_document_payment",
    `Add a payment to an existing document. ${PAYMENT_TYPES_DESC}`,
    {
      id: z.string().describe("Document ID"),
      type: z.number().describe("Payment type code"),
      price: z.number().describe("Payment amount"),
      currency: z.string().optional().describe("Currency code"),
      date: z.string().describe("Payment date (YYYY-MM-DD)"),
    },
    async ({ id, ...payment }) => {
      const data = await client.post(`/documents/${id}/payment`, payment);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "preview_document",
    "Preview a document (returns base64 PDF)",
    {
      data: z.string().describe("JSON string of document preview data (same shape as create_document: type, client, income, payment, currency, lang)"),
    },
    async ({ data: jsonStr }) => {
      const data = await client.post("/documents/preview", JSON.parse(jsonStr));
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ════════════════════════════════════════════════════════════════════
  //  CLIENTS
  // ════════════════════════════════════════════════════════════════════

  server.tool(
    "search_clients",
    "Search clients with filters and pagination",
    {
      page: z.number().optional().describe("Page number"),
      pageSize: z.number().optional().describe("Results per page (max 50)"),
      name: z.string().optional().describe("Filter by client name"),
      taxId: z.string().optional().describe("Filter by tax ID"),
      active: z.boolean().optional().describe("Filter by active status"),
      sort: z.string().optional().describe("Sort field"),
      sortType: z.enum(["asc", "desc"]).optional(),
    },
    async (params) => {
      const data = await client.post("/clients/search", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_client",
    "Get a client by ID",
    { id: z.string().describe("Client ID") },
    async ({ id }) => {
      const data = await client.get(`/clients/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_client",
    "Create a new client",
    {
      name: z.string().describe("Client name"),
      emails: z
        .array(z.string())
        .optional()
        .describe("Email addresses (array)"),
      taxId: z.string().optional().describe("Tax/VAT ID"),
      phone: z.string().optional().describe("Phone number"),
      mobile: z.string().optional().describe("Mobile number"),
      fax: z.string().optional().describe("Fax number"),
      city: z.string().optional(),
      zip: z.string().optional(),
      address: z.string().optional(),
      country: z.string().optional().describe("Country code"),
      category: z.number().optional().describe("Client category"),
      subCategory: z.number().optional(),
      accountingKey: z.string().optional(),
      paymentTerms: z.number().optional().describe("Payment terms in days"),
      bankName: z.string().optional(),
      bankBranch: z.string().optional(),
      bankAccount: z.string().optional(),
      active: z.boolean().optional(),
    },
    async (params) => {
      const data = await client.post("/clients", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_client",
    "Update an existing client",
    {
      id: z.string().describe("Client ID"),
      data: z.string().describe("JSON string of client fields to update"),
    },
    async ({ id, data }) => {
      const result = await client.put(`/clients/${id}`, JSON.parse(data));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_client",
    "Delete a client by ID",
    { id: z.string().describe("Client ID") },
    async ({ id }) => {
      const data = await client.delete(`/clients/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_client_documents",
    "Get all documents associated with a client",
    { id: z.string().describe("Client ID") },
    async ({ id }) => {
      const data = await client.get(`/clients/${id}/documents`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ════════════════════════════════════════════════════════════════════
  //  ITEMS (Product/Service Catalog)
  // ════════════════════════════════════════════════════════════════════

  server.tool(
    "search_items",
    "Search product/service catalog items",
    {
      page: z.number().optional(),
      pageSize: z.number().optional(),
      name: z.string().optional().describe("Filter by item name"),
      active: z.boolean().optional(),
    },
    async (params) => {
      const data = await client.post("/items/search", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_item",
    "Get a catalog item by ID",
    { id: z.string().describe("Item ID") },
    async ({ id }) => {
      const data = await client.get(`/items/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "create_item",
    "Create a new catalog item (product or service)",
    {
      name: z.string().describe("Item name"),
      description: z.string().optional(),
      price: z.number().describe("Default price"),
      currency: z.string().optional().describe("Currency code"),
      vatType: z
        .number()
        .optional()
        .describe("0=default, 1=VAT included, 2=VAT exempt"),
      sku: z.string().optional().describe("SKU / catalog number"),
      active: z.boolean().optional(),
    },
    async (params) => {
      const data = await client.post("/items", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "update_item",
    "Update a catalog item",
    {
      id: z.string().describe("Item ID"),
      data: z.string().describe("JSON string of item fields to update"),
    },
    async ({ id, data }) => {
      const result = await client.put(`/items/${id}`, JSON.parse(data));
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ════════════════════════════════════════════════════════════════════
  //  PAYMENT LINKS
  // ════════════════════════════════════════════════════════════════════

  server.tool(
    "create_payment_link",
    "Create a payment link for online payment collection",
    {
      data: z.string().describe("JSON string with: client (object), income (array of line items), currency (optional), lang ('he'|'en' optional), remarks (optional)"),
    },
    async ({ data: jsonStr }) => {
      const data = await client.post("/payment/links", JSON.parse(jsonStr));
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_payment_link",
    "Get payment link details",
    { id: z.string().describe("Payment link ID") },
    async ({ id }) => {
      const data = await client.get(`/payment/links/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_payment_link_status",
    "Check the status of a payment link",
    { id: z.string().describe("Payment link ID") },
    async ({ id }) => {
      const data = await client.get(`/payment/links/${id}/status`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ════════════════════════════════════════════════════════════════════
  //  WEBHOOKS
  // ════════════════════════════════════════════════════════════════════

  server.tool(
    "create_webhook",
    `Create a webhook subscription. Events: document.created, document.updated,
document.sent, document.paid, document.overdue, payment.received,
payment.failed, payment.refunded, client.created, client.updated, client.deleted`,
    {
      url: z.string().describe("Webhook callback URL"),
      events: z.array(z.string()).describe("Event types to subscribe to"),
    },
    async (params) => {
      const data = await client.post("/webhooks", params);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_webhook",
    "Get webhook by ID",
    { id: z.string().describe("Webhook ID") },
    async ({ id }) => {
      const data = await client.get(`/webhooks/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_webhook",
    "Delete a webhook subscription",
    { id: z.string().describe("Webhook ID") },
    async ({ id }) => {
      const data = await client.delete(`/webhooks/${id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
