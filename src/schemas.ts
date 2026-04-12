/**
 * Zod schemas for validating the `data` parameter of each MCP tool action.
 *
 * Every object schema uses `z.looseObject()` so unrecognised fields are
 * forwarded to the Green Invoice API rather than silently stripped.
 */

import { z } from "zod";

// ── Shared enums ────────────────────────────────────────────────────────

export const CurrencyEnum = z.enum([
  "ILS", "USD", "EUR", "GBP", "JPY", "CHF", "CNY", "AUD", "CAD",
  "DKK", "NOK", "ZAR", "SEK", "CZK", "IMP", "JOD", "LBP", "EGP",
  "HRK", "HUF", "INR", "RUB", "TRY", "UAH", "BRL", "PLN", "RON", "MXN",
]);

export const LangEnum = z.enum(["he", "en"]);

export const DocumentTypeSchema = z.number().int().describe(
  "Document type code: 10=Price Quote, 100=Order, 200=Delivery Note, 210=Return Delivery Note, " +
  "300=Transaction Account, 305=Tax Invoice, 320=Tax Invoice+Receipt, " +
  "330=Credit Invoice, 400=Receipt, 405=Donation Receipt, 500=Purchase Order, " +
  "600=Deposit Receipt, 610=Deposit Withdrawal"
);

export const PaymentTypeSchema = z.number().int().describe(
  "Payment type: -1=Unpaid, 0=Deduction at Source, 1=Cash, 2=Check, " +
  "3=Credit Card, 4=Bank Transfer, 5=PayPal, 10=Payment App, 11=Other"
);

const WebhookEventEnum = z.enum([
  "document.created", "document.updated", "document.sent",
  "document.paid", "document.overdue",
  "payment.received", "payment.failed", "payment.refunded",
  "client.created", "client.updated", "client.deleted",
]);

const FileTypeEnum = z.enum(["logo", "signature", "deduction", "bookkeeping"]);

// ── Reusable micro-schemas ──────────────────────────────────────────────

const IdRequired = z.looseObject({ id: z.string() });
const LangOptional = z.looseObject({ lang: LangEnum.optional() });

const PageShape = {
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
};

// ── Sub-schemas for documents / payments ────────────────────────────────

export const IncomeItemSchema = z.looseObject({
  catalogNum: z.string().optional(),
  description: z.string(),
  quantity: z.number().positive().optional(),
  price: z.number(),
  currency: CurrencyEnum.optional(),
  vatType: z.number().int().optional(),
  itemId: z.string().optional(),
});

export const PaymentItemSchema = z.looseObject({
  date: z.string(),
  type: PaymentTypeSchema,
  price: z.number().positive(),
  currency: CurrencyEnum.optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccount: z.string().optional(),
  chequeNum: z.string().optional(),
});

export const ClientSubSchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  emails: z.array(z.string()).optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  add: z.boolean().optional(),
  self: z.boolean().optional(),
});

const DocumentBodyShape = {
  type: DocumentTypeSchema,
  client: ClientSubSchema.optional(),
  income: z.array(IncomeItemSchema).optional(),
  payment: z.array(PaymentItemSchema).optional(),
  currency: CurrencyEnum.optional(),
  lang: LangEnum.optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  footer: z.string().optional(),
  emailContent: z.string().optional(),
  signed: z.boolean().optional(),
  rounding: z.boolean().optional(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  discount: z.looseObject({
    amount: z.number(),
    type: z.number().int(),
  }).optional(),
  maxPayments: z.number().int().positive().optional(),
  linkedDocumentIds: z.array(z.string()).optional(),
  linkedPaymentId: z.string().optional(),
  attachment: z.string().optional(),
};

// ═══════════════════════════════════════════════════════════════════════
// Per-tool schema maps
// ═══════════════════════════════════════════════════════════════════════

// ── 1. ACCOUNT ─────────────────────────────────────────────────────────
// Both actions (get, settings) take no data.
const accountSchemas: Record<string, z.ZodTypeAny> = {};

// ── 2. BUSINESS ────────────────────────────────────────────────────────
const businessSchemas: Record<string, z.ZodTypeAny> = {
  // list, get_numbering, get_footer: no data needed (omitted)
  get: z.looseObject({ id: z.string().optional() }),
  update: z.looseObject({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    taxId: z.string().optional(),
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    bankAccount: z.string().optional(),
  }),
  set_numbering: z.record(z.string(), z.number().int()),
  get_types: LangOptional,
  upload_file: z.looseObject({
    type: FileTypeEnum,
    file: z.string(),
  }),
  delete_file: z.looseObject({
    type: FileTypeEnum,
  }),
};

// ── 3. DOCUMENT ────────────────────────────────────────────────────────
const documentSchemas: Record<string, z.ZodTypeAny> = {
  search: z.looseObject({
    ...PageShape,
    type: z.array(z.number().int()).optional(),
    status: z.array(z.number().int()).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    clientId: z.string().optional(),
    clientName: z.string().optional(),
    description: z.string().optional(),
    number: z.string().optional(),
    paymentTypes: z.array(z.number().int()).optional(),
    sort: z.string().optional(),
    download: z.boolean().optional(),
  }),

  get: IdRequired,

  create: z.looseObject({ ...DocumentBodyShape }),

  update: z.looseObject({
    id: z.string(),
    ...DocumentBodyShape,
    type: DocumentTypeSchema.optional(), // type becomes optional on update
  }),

  close: IdRequired,
  open: IdRequired,

  send: z.looseObject({
    id: z.string(),
    email: z.string().optional(),
  }),

  download_links: IdRequired,

  add_payment: z.looseObject({
    id: z.string(),
    date: z.string(),
    type: PaymentTypeSchema,
    price: z.number().positive(),
    currency: CurrencyEnum.optional(),
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    bankAccount: z.string().optional(),
    chequeNum: z.string().optional(),
  }),

  preview: z.looseObject({ ...DocumentBodyShape }),

  get_linked: IdRequired,

  get_info: z.looseObject({ type: z.number().int() }),

  get_types: LangOptional,
  get_statuses: LangOptional,

  search_payments: z.looseObject({
    ...PageShape,
    type: z.array(z.number().int()).optional(),
    paymentTypes: z.array(z.number().int()).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    paymentId: z.string().optional(),
    sort: z.string().optional(),
  }),
};

// ── 4. CLIENT ──────────────────────────────────────────────────────────
const clientOptionalFields = {
  emails: z.array(z.string()).optional(),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  accountingKey: z.string().optional(),
  paymentTerms: z.number().int().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccount: z.string().optional(),
  active: z.boolean().optional(),
  department: z.string().optional(),
  contactPerson: z.string().optional(),
  remarks: z.string().optional(),
  labels: z.array(z.string()).optional(),
};

const clientSchemas: Record<string, z.ZodTypeAny> = {
  search: z.looseObject({
    ...PageShape,
    name: z.string().optional(),
    email: z.string().optional(),
    taxId: z.string().optional(),
    active: z.boolean().optional(),
    contactPerson: z.string().optional(),
    labels: z.array(z.string()).optional(),
    sort: z.string().optional(),
    sortType: z.enum(["asc", "desc"]).optional(),
  }),

  get: IdRequired,

  create: z.looseObject({
    name: z.string(),
    ...clientOptionalFields,
  }),

  update: z.looseObject({
    id: z.string(),
    name: z.string().optional(),
    ...clientOptionalFields,
  }),

  delete: IdRequired,

  associate_docs: z.looseObject({
    id: z.string(),
    ids: z.array(z.string()),
  }),

  merge: z.looseObject({
    id: z.string(),
    mergeId: z.string(),
  }),

  update_balance: z.looseObject({
    id: z.string(),
    balance: z.number(),
  }),
};

// ── 5. SUPPLIER ────────────────────────────────────────────────────────
const supplierOptionalFields = {
  emails: z.array(z.string()).optional(),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  department: z.string().optional(),
  accountingKey: z.string().optional(),
  paymentTerms: z.number().int().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccount: z.string().optional(),
  active: z.boolean().optional(),
  contactPerson: z.string().optional(),
  remarks: z.string().optional(),
  labels: z.array(z.string()).optional(),
};

const supplierSchemas: Record<string, z.ZodTypeAny> = {
  search: z.looseObject({
    ...PageShape,
    name: z.string().optional(),
    email: z.string().optional(),
    active: z.boolean().optional(),
    contactPerson: z.string().optional(),
    labels: z.array(z.string()).optional(),
  }),

  get: IdRequired,

  create: z.looseObject({
    name: z.string(),
    ...supplierOptionalFields,
  }),

  update: z.looseObject({
    id: z.string(),
    name: z.string().optional(),
    ...supplierOptionalFields,
  }),

  delete: IdRequired,

  merge: z.looseObject({
    id: z.string(),
    mergeId: z.string(),
  }),
};

// ── 6. ITEM ────────────────────────────────────────────────────────────
const itemSchemas: Record<string, z.ZodTypeAny> = {
  search: z.looseObject({
    ...PageShape,
    name: z.string().optional(),
    description: z.string().optional(),
    currency: CurrencyEnum.optional(),
    active: z.boolean().optional(),
  }),

  get: IdRequired,

  create: z.looseObject({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    currency: CurrencyEnum.optional(),
    vatType: z.number().int().optional(),
    sku: z.string().optional(),
    active: z.boolean().optional(),
  }),

  update: z.looseObject({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    currency: CurrencyEnum.optional(),
    vatType: z.number().int().optional(),
    sku: z.string().optional(),
    active: z.boolean().optional(),
  }),

  delete: IdRequired,
};

// ── 7. EXPENSE ─────────────────────────────────────────────────────────
const SupplierSubSchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  taxId: z.string().optional(),
});

const AccountingClassificationSubSchema = z.looseObject({
  id: z.string().optional(),
  key: z.string().optional(),
  code: z.string().optional(),
  title: z.string().optional(),
});

const expenseOptionalFields = {
  paymentType: PaymentTypeSchema.optional(),
  currency: CurrencyEnum.optional(),
  currencyRate: z.number().optional(),
  vat: z.number().optional(),
  dueDate: z.string().optional(),
  reportingDate: z.string().optional(),
  documentType: z.number().int().optional(),
  number: z.string().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  supplier: SupplierSubSchema.optional(),
  accountingClassification: AccountingClassificationSubSchema.optional(),
  active: z.boolean().optional(),
  addRecipient: z.boolean().optional(),
  addAccountingClassification: z.boolean().optional(),
};

const expenseSchemas: Record<string, z.ZodTypeAny> = {
  search: z.looseObject({
    ...PageShape,
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    dueDate: z.string().optional(),
    description: z.string().optional(),
    supplierId: z.string().optional(),
    supplierName: z.string().optional(),
    number: z.string().optional(),
    paid: z.boolean().optional(),
    reported: z.boolean().optional(),
    sort: z.string().optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
    accountingClassificationId: z.string().optional(),
  }),

  get: IdRequired,

  create: z.looseObject({
    amount: z.number(),
    date: z.string(),
    ...expenseOptionalFields,
  }),

  update: z.looseObject({
    id: z.string(),
    amount: z.number().optional(),
    date: z.string().optional(),
    ...expenseOptionalFields,
  }),

  delete: IdRequired,
  open: IdRequired,
  close: IdRequired,
  // get_statuses, get_classifications: no data needed (omitted)

  search_drafts: z.looseObject({
    ...PageShape,
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    description: z.string().optional(),
    supplierId: z.string().optional(),
    supplierName: z.string().optional(),
  }),
};

// ── 8. PAYMENT ─────────────────────────────────────────────────────────
const paymentSchemas: Record<string, z.ZodTypeAny> = {
  get_form: z.looseObject({
    type: z.number().int().optional(),
    description: z.string().optional(),
    lang: LangEnum.optional(),
    currency: CurrencyEnum.optional(),
    vatType: z.number().int().optional(),
    amount: z.number().positive().optional(),
    maxPayments: z.number().int().positive().optional(),
    pluginId: z.string().optional(),
    group: z.string().optional(),
    client: ClientSubSchema.optional(),
    income: z.array(IncomeItemSchema).optional(),
    remarks: z.string().optional(),
    successUrl: z.string().url().optional(),
    failureUrl: z.string().url().optional(),
    notifyUrl: z.string().url().optional(),
    custom: z.string().optional(),
  }),

  search_tokens: z.looseObject({
    paymentNumber: z.string().optional(),
    cardHolder: z.string().optional(),
    externalKey: z.string().optional(),
  }),

  charge_token: z.looseObject({
    id: z.string(),
    type: z.number().int().optional(),
    description: z.string().optional(),
    lang: LangEnum.optional(),
    currency: CurrencyEnum.optional(),
    vatType: z.number().int().optional(),
    amount: z.number().positive().optional(),
    maxPayments: z.number().int().positive().optional(),
    income: z.array(IncomeItemSchema).optional(),
    remarks: z.string().optional(),
    notifyUrl: z.string().url().optional(),
  }),

  create_link: z.looseObject({
    client: ClientSubSchema.optional(),
    income: z.array(IncomeItemSchema).optional(),
    currency: CurrencyEnum.optional(),
    lang: LangEnum.optional(),
    remarks: z.string().optional(),
  }),

  get_link: IdRequired,
  get_link_status: IdRequired,
};

// ── 9. WEBHOOK ─────────────────────────────────────────────────────────
const webhookSchemas: Record<string, z.ZodTypeAny> = {
  create: z.looseObject({
    url: z.string().url(),
    events: z.array(WebhookEventEnum),
  }),

  get: IdRequired,
  delete: IdRequired,
};

// ── 10. REFERENCE DATA ─────────────────────────────────────────────────
const referenceDataSchemas: Record<string, z.ZodTypeAny> = {
  occupations: z.looseObject({ locale: z.string().optional() }),
  countries: z.looseObject({ locale: z.string().optional() }),
  cities: z.looseObject({
    locale: z.string().optional(),
    country: z.string().optional(),
  }),
  currencies: z.looseObject({ base: CurrencyEnum.optional() }),
};

// ═══════════════════════════════════════════════════════════════════════
// Unified lookup
// ═══════════════════════════════════════════════════════════════════════

export const toolSchemas: Record<string, Record<string, z.ZodTypeAny>> = {
  account: accountSchemas,
  business: businessSchemas,
  document: documentSchemas,
  client: clientSchemas,
  supplier: supplierSchemas,
  item: itemSchemas,
  expense: expenseSchemas,
  payment: paymentSchemas,
  webhook: webhookSchemas,
  reference_data: referenceDataSchemas,
};
