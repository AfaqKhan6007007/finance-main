import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { MongoClient, ServerApiVersion, Document, Collection, Filter, WithId, ObjectId, Db } from "mongodb";

// ---------------------- ENV + MongoDB ----------------------
const mongoUri = process.env.MONGODB_URI || "";

const mongoClient = new MongoClient(mongoUri, {
  serverApi: ServerApiVersion.v1,
});
const dbName = "test";



// --------------------- Types interfaces ------------------
type CollectionName = keyof typeof DATABASE_SCHEMA;
type DisplayFields = keyof typeof DEFAULT_DISPLAY_FIELDS;

interface LLMQuery{
    collection?: string;
    filter?: Record<string, unknown>;
    fields?: string[];
    sort?: Record<string, 1 | -1>; 
    limit?: number;
    error?: string;
    raw?: string;
}

interface SynonymMap {
  [key: string]: string | string[];
}

type FieldSynonyms = Record<CollectionName, SynonymMap>;


// ---------------------- Database Schema ----------------------
const DATABASE_SCHEMA = {
    accounts: [
        "_id", "id", "disable", "accountName", "accountNumber", "isGroup", 
        "company", "taxRate", "currency", "parentAccount", "accountType", 
        "balanceMustBe", "rootType", "reportType", "frozen", "createdBy", 
        "editedBy", "createdAt", "updatedAt", "__v"
    ],
     activities: [
        "_id", "accountId", "journalId", "invoiceId", "companyId", "userId", 
        "activityType", "metadata", "createdAt", "updatedAt", "__v"
    ],
    companies: [
        "_id", "companyName", "abbreviation", "defaultCurrency", "defaultLetterHead", 
        "taxId", "domain", "country", "dateOfEstablishment", "isGroup", "parentCompany", 
        "defaultHolidayList", "registrationDetails",
        "chartOfAccountBasis", "writeOffAccount", "defaultPaymentDiscountAccount", "unrealizedProfitLossAccount", 
        "defaultPaymentTermsTemplate", "defaultFinanceBook", "exchangeGainLossAccount", 
        "unrealizedExchangeGainLossAccount", "roundOffAccount", "roundOffForOpening", 
        "roundOffCostCenter", "bookAdvancePaymentInSeparatePartyAccount", 
        "reconciliationEffectOn", "autoCreateExchangeRateRevaluation", "frequency", 
        "submitERRJournals", "exceptionBudgetApproverRole", "accumulatedDepreciationAccount", 
        "gainLossAccountOnAssetDisposal", "depreciationExpenseAccount", 
        "assetDepreciationCostCenter", "seriesForAssetDepreciationEntry", 
        "capitalWorkInProgressAccount", "expensesIncludedInAssetValuation", 
        "assetReceivedButNotBilled",
        "defaultBuyingTerms", "defaultSellingTerms", 
        "monthlySalesTarget", "defaultWarehouseForSalesReturn",
        "defaultOperationCostAccount",
        "createdBy", "editedBy", "createdAt", "updatedAt", "__v"
    ],
    invoices: [
        "_id", "id", "invoiceNumber", "date", "supplierName", "supplierVAT", 
        "customerName", "customerVAT", "amountBeforeVAT", "totalVAT", "totalAmount", 
        "qrCodePresent", "qrCodeValid", "status", "scannedInvoiceId", 
        "setAdvancesAndAllocate", "writeOffAmount", "supplierAddress", 
        "supplierContactPerson", "dispatchAddress", "shippingAddress", 
        "billingAddress", "paymentTermsTemplate", "terms", "termsAndConditions", 
        "creditTo", "isOpeningEntry", "fromDate", "toDate", "subscription", 
        "letterHead", "printHeading", "groupSameItems", "holdInvoice", "isSupplier", 
        "supplierGroup", "remarks", "createdBy", "editedBy", "createdAt", "updatedAt", "__v"
    ],
    "invoice-scans": [
        "_id", "id", "invoiceNumber", "invoiceDate", "date", "supplierName", 
        "supplierVAT", "customerName", "customerVAT", "amountBeforeVAT", 
        "totalVAT", "totalAmount", "qrCodePresent", "qrCodeValid", "status", 
        "isInvoiceCreated", "createdAt", "updatedAt", "__v"
    ],
    "journal-entries": [
        "_id", "id", "date", "account", "debitAccount", "creditAccount", 
        "amount", "debit", "credit", "description", "createdBy", "editedBy", 
        "createdAt", "updatedAt", "__v"
    ],
    users: [
        "_id", "clerkId", "firstName", "lastName", "username", "email", 
        "profile_image_url", "password", "provider", "forgotPasswordToken", 
        "forgotPasswordTokenExpiry", "emailVerified", "createdAt", "updatedAt", "__v"
    ]
} as const


// ----------------------- Field Synonyms --------------------
const FIELD_SYNONYMS: FieldSynonyms = {
  accounts: {
    "name": "accountName",
    "number": "accountNumber",
    "type": "accountType",
    "group": "isGroup",
    "currency": "currency",
    "parent": "parentAccount",
    "balance": "balanceMustBe",
    "frozen": "frozen",
    "tax": "taxRate",
    "created": "createdAt",
    "updated": "updatedAt",
    "creator": "createdBy",
    "editor": "editedBy"
  },
  activities: {
    "activity": "activityType",
    "type": "activityType",
    "user": "userId",
    "account": "accountId",
    "journal": "journalId",
    "invoice": "invoiceId",
    "company": "companyId",
    "created": "createdAt",
    "updated": "updatedAt",
    "creator": "userId",
    "editor": "userId",
    "details": "metadata"
  },
  companies: {
    "name": "companyName",
    "abbr": "abbreviation",
    "currency": "defaultCurrency",
    "country": "country",
    "domain": "domain",
    "established": "dateOfEstablishment",
    "parent": "parentCompany",
    "group": "isGroup",
    "tax": "taxId",
    "holidays": "defaultHolidayList",
    "registration": "registrationDetails",
    
    // Account details
    "chart": "chartOfAccountBasis",
    "write off": "writeOffAccount",
    "discount account": "defaultPaymentDiscountAccount",
    "profit loss": "unrealizedProfitLossAccount",
    "payment terms": "defaultPaymentTermsTemplate",
    "finance book": "defaultFinanceBook",
    "exchange gain loss": "exchangeGainLossAccount",
    "unrealized exchange": "unrealizedExchangeGainLossAccount",
    "round off": "roundOffAccount",
    "cost center": "roundOffCostCenter",
    "reconciliation": "reconciliationEffectOn",
    "exchange rate": "autoCreateExchangeRateRevaluation",
    "depreciation": ["accumulatedDepreciationAccount", "depreciationExpenseAccount"],
    "asset": ["capitalWorkInProgressAccount", "assetReceivedButNotBilled"],
    
    // Buying and selling
    "buying": "defaultBuyingTerms",
    "selling": "defaultSellingTerms",
    "sales target": "monthlySalesTarget",
    "warehouse": "defaultWarehouseForSalesReturn",
    
    // Manufacturing
    "operation cost": "defaultOperationCostAccount",
    
    // Audit
    "created": "createdAt",
    "updated": "updatedAt",
    "creator": "createdBy",
    "editor": "editedBy"
  },
  invoices: {
    "number": "invoiceNumber",
    "date": "date",
    "supplier": "supplierName",
    "customer": "customerName",
    "vat": ["supplierVAT", "customerVAT"],
    "amount": ["amountBeforeVAT", "totalAmount"],
    "total": "totalAmount",
    "vat amount": "totalVAT",
    "qr": ["qrCodePresent", "qrCodeValid"],
    "qrcode": ["qrCodePresent", "qrCodeValid"],
    "status": "status",
    "scan": "scannedInvoiceId",
    "advance": "setAdvancesAndAllocate",
    "write off": "writeOffAmount",
    "address": ["supplierAddress", "dispatchAddress", "shippingAddress", "billingAddress"],
    "contact": "supplierContactPerson",
    "payment terms": "paymentTermsTemplate",
    "terms": ["terms", "termsAndConditions"],
    "credit": "creditTo",
    "opening": "isOpeningEntry",
    "period": ["fromDate", "toDate"],
    "subscription": "subscription",
    "letter": "letterHead",
    "group": "groupSameItems",
    "hold": "holdInvoice",
    "is supplier": "isSupplier",
    "supplier invoice": "isSupplier",
    "purchase invoice": "isSupplier",      
    "vendor invoice": "isSupplier",       
    "is purchase": "isSupplier",           
    "from supplier": "isSupplier",   
    "remarks": "remarks",
    "created": "createdAt",
    "updated": "updatedAt",
    "creator": "createdBy",
    "editor": "editedBy",
    
  },
  "invoice-scans": {
    "number": "invoiceNumber",
    "date": ["invoiceDate", "date"],
    "supplier": "supplierName",
    "customer": "customerName",
    "vat": ["supplierVAT", "customerVAT"],
    "amount": ["amountBeforeVAT", "totalAmount"],
    "total": "totalAmount",
    "vat amount": "totalVAT",
    "qr": ["qrCodePresent", "qrCodeValid"],
    "qrcode": ["qrCodePresent", "qrCodeValid"],
    "status": "status",
    "created": "createdAt",
    "updated": "updatedAt",
    "invoice created": "isInvoiceCreated"
  },
  "journal-entries": {
    "date": "date",
    "account": ["account", "debitAccount", "creditAccount"],
    "debit": ["debitAccount", "debit"],
    "credit": ["creditAccount", "credit"],
    "debit amount": "debit",          
    "credit amount": "credit",         
    "debit account": "debitAccount",   
    "credit account": "creditAccount",
    "amount": ["amount", "debit", "credit"],
    "description": "description",
    "entry": "description",
    "created": "createdAt",
    "updated": "updatedAt",
    "creator": "createdBy",
    "editor": "editedBy"
  },
  users: {
    "name": ["firstName", "lastName"],
    "firstname": "firstName",
    "lastname": "lastName",
    "username": "username",
    "email": "email",
    "profile": "profile_image_url",
    "image": "profile_image_url",
    "avatar": "profile_image_url",
    "provider": "provider",
    "password": "password",
    "token": "forgotPasswordToken",
    "email verified": "emailVerified",
    "joined": "createdAt",
    "created": "createdAt",
    "updated": "updatedAt"
  }
};

//  ---------------------- Default Display Fields ---------------------
const DEFAULT_DISPLAY_FIELDS = {
  accounts: ["accountName", "accountNumber", "accountType", "currency"],
  invoices: ["invoiceNumber", "customerName", "totalAmount", "date", "status"],
  "invoice-scans" : ["invoiceNumber", "customerName", "totalAmount", "supplierName", "invoiceDate"],
  "journal-entries": ["id", "date", "description", "debit", "credit", "account"],
  companies: ["companyName", "defaultCurrency", "country", "taxId"],
  users: ["firstName", "lastName", "email", "username"]
} as const;


// -------------------- Step-1 LLM Request ---------------------------
async function llmResponse(prompt: string): Promise<LLMQuery | { error: string; raw?: string }> {
    const today = new Date().toISOString().split("T")[0];
    const schemaText = JSON.stringify(DATABASE_SCHEMA, null, 2);

    // Flatten the synonyms into the string list
    const flattenedSynonyms: string[] = [];
    for (const [coll, mapping] of Object.entries(FIELD_SYNONYMS)) {
        for (const [syn, target] of Object.entries(mapping)) {
            flattenedSynonyms.push(`${coll}.${syn} → ${target}`);
        }
    }
    const synonymsInfo = flattenedSynonyms.join("\n");

    const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        maxOutputTokens: 1024,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: `
You are an AI assistant specialized in understanding and answering queries about Finance System data stored in MongoDB.
If the user asks for any specific field, return only that field with other relevant fields as per the schema.
If the user doesn't specify fields, return the most relevant fields in the collection.
Use ISO 8601 date format (YYYY-MM-DD). Assume today's date is '${today}'.

### Database Schema
You MUST use the following database schema and only return fields and collections defined below (field names are lowercase):

${schemaText}

### Query Format

Return a valid JSON object with this structure:
{
  "collection": "invoices",
  "filter": { "status": "paid" },
  "fields": ["invoiceNumber", "customerName", "totalAmount"]
  "sort": { "createdAt": -1 }, // Added for ordering
   "limit": 50 // Added for maximum records
}

- collection: must match one from the schema
- filter: must be a MongoDB filter object
- fields: (optional) list of fields; omit to return all fields
- sort: (optional) MongoDB sort object (e.g., {"field": -1} for descending)
- limit: (optional) integer to limit number of documents
- Use $regex, $gte, $lte, $in as needed
- Do NOT invent fields or collections

### User Lookup Instructions
IMPORTANT: When users ask about creators, authors, or who created/edited records:
- createdBy and editedBy fields contain MongoDB ObjectId references to users collection
- If user asks "who created this", "show creator", "who is the author", etc.:
  - Include "createdBy" in the fields to fetch the user ID in all collections except activities, where it would be "userId"
  - The system will automatically lookup the user's name from users collection
- Same applies for "who edited this", "last edited by", etc. with "editedBy" field
- If user asks about the activity details "what was the activity?", add the "metadata" in the fields

### IMPORTANT: Querying for Latest/Last Activity
When the user asks for the **'last' or 'latest'** record (e.g., 'last activity', 'latest comment'), you **MUST** include both:
1. A **"sort"** field set to '{ "createdAt": -1 }' (to get the newest first).
2. A **"limit"** field set to "1".

### Activities Collection Specific Instructions
For activities queries:
- When asking about "last activity", do NOT add date filters unless explicitly requested
- For account activities, search by accountId field using account names
- The four activity types are: "create", "update", "like", "comment"
- Include "userId" field to identify who performed the activity

### Relative Dates
Recognize:
- "last 7 days" → from 7 days ago to today
- "last month" → previous calendar month
- "this month" → from 1st of this month to today
- "last quarter" → previous 3 months
- "this year" → from Jan 1st to today

### Finance-Specific Queries
Handle financial terminology:
- "debit", "credit", "accounts", "journal entries", "invoices", "transactions"
- "balance", "amount", "tax", "vat", "supplier", "customer"
- "created by", "edited by", "creator", "author", "owner"

### Synonym Mapping
Users may refer to fields using synonyms. Use the correct schema field instead.

${synonymsInfo}
                `
            },
            { role: "user", content: prompt }
        ]
    });

    let responseText = text.trim();

    // Remove ```json ... ``` wrappers if present
    if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```[a-zA-Z]*\n?/, "").trim();
        if (responseText.endsWith("```")) {
            responseText = responseText.slice(0, -3).trim();
        }
    }

    try {
          return JSON.parse(responseText) as LLMQuery;
     } catch{
          console.warn("Initial JSON parsing failed. Attempting LLM extraction retry.");
     }

    // Try to convert non -json to json by llm
    try {
          const extractionPrompt = `The following text contains a MongoDB query object. Extract ONLY the valid JSON object and return nothing else. DO NOT include any markdown blocks, comments, or explanations. Just the raw JSON object. \n\nTEXT:\n${responseText}`;

          const { text: extractedText } = await generateText({
               model: groq("llama-3.3-70b-versatile"), // Use the same model
               maxOutputTokens: 1000,
               temperature: 0, // Lower temperature for extraction
               messages: [
                    { role: "system", content: "You are a JSON extractor. Output ONLY the valid JSON object from the user's text." },
                    { role: "user", content: extractionPrompt }
               ]
          });

          let finalResponse = extractedText.trim();
          // Final cleanup, just in case the extraction LLM uses markdown
          if (finalResponse.startsWith("```")) {
               finalResponse = finalResponse.replace(/^```[a-zA-Z]*\n?/, "").trim();
               if (finalResponse.endsWith("```")) {
                    finalResponse = finalResponse.slice(0, -3).trim();
               }
          }

          return JSON.parse(finalResponse) as LLMQuery;
     } catch{
          // If the second attempt fails, return the original raw text and error
          return { error: "Invalid JSON from LLM after retry", raw: text };
     }
}

// ---------------------- Step-2 Validate Request ---------------------
function validateLLMResult(
  llmResult: unknown,
  databaseSchema: Record<string, unknown>
): [boolean, string?] {
  // Ensure it's an object (non-null, non-array)
  if (typeof llmResult !== "object" || llmResult === null || Array.isArray(llmResult)) {
    return [false, "LLM returned a non-dictionary response."];
  }

  const result = llmResult as LLMQuery;

  // Validate collection
  const collection = result.collection;
  if (typeof collection !== "string" || collection.trim() === "") {
    return [false, "Missing or invalid 'collection' in LLM response."];
  }

  const collectionLower = collection.toLowerCase();
  if (!(collectionLower in databaseSchema)) {
    // Optional: Suggest close matches using a simple string similarity
    const keys = Object.keys(databaseSchema);
    const closeMatches = keys.filter(k => 
      k.toLowerCase().startsWith(collectionLower[0]) // basic heuristic
    ).slice(0, 3);

    const suggestion = closeMatches.length > 0
      ? `Did you mean: ${closeMatches.join(", ")}?`
      : "No similar collection found in schema.";

    return [false, `Collection '${collectionLower}' not in schema. ${suggestion}`];
  }

  // Validate filter
  const rawFilter = result.filter ?? {};
  if (typeof rawFilter !== "object" || rawFilter === null || Array.isArray(rawFilter)) {
    return [false, "Filter must be a JSON object (dictionary)."];
  }

  // Validate fields
  const fields = result.fields;
  if (fields !== undefined && !Array.isArray(fields)) {
    return [false, "Fields must be a list when present."];
  }

  return [true];
}

// ---------------------- Step 4- Date Parsing --------------------
function parseRelativeDates<T extends Record<string, unknown>>(filter: T): T {
  const RELATIVE_TERMS = new Set([
    "last month", "last_month", "previous month", "previous_month", "past month", "past_month",
    "this month", "this_month", "current month", "current_month",
    "last 7 days", "last_7_days", "last week", "last_week", "previous week", "previous_week", "past week", "past_week",
    "last year", "last_year", "previous year", "previous_year", "past year", "past_year"
  ]);

  const today = new Date();
  const format = (d: Date) => d.toISOString().split("T")[0];

  function resolveDateTerm(term: string): { $gte: string; $lte: string } | string {
    const t = term.toLowerCase();

    if ([
      "last month", "last_month", "previous month", "previous_month", "past month", "past_month"
    ].includes(t)) {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { $gte: format(start), $lte: format(end) };
    }

    if ([
      "this month", "this_month", "current month", "current_month"
    ].includes(t)) {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { $gte: format(start), $lte: format(today) };
    }

    if ([
      "last 7 days", "last_7_days", "last week", "last_week",
      "previous week", "previous_week", "past week", "past_week"
    ].includes(t)) {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return { $gte: format(start), $lte: format(today) };
    }

    if ([
      "last year", "last_year", "previous year", "previous_year", "past year", "past_year"
    ].includes(t)) {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31);
      return { $gte: format(start), $lte: format(end) };
    }

    return term; // leave unchanged if not matched
  }

  function process(obj: Record<string, unknown>): Record<string, unknown> {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      const v = obj[key];
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        newObj[key] = process(v as Record<string, unknown>);
      } else if (typeof v === "string" && RELATIVE_TERMS.has(v.toLowerCase())) {
        newObj[key] = resolveDateTerm(v);
      } else {
        newObj[key] = v;
      }
    }
    return newObj;
  }

  return process(JSON.parse(JSON.stringify(filter))) as T;
}

// ---------------------- Step 4.5: Resolve Company and Account IDs --------------------
async function resolveFilterNamesToIds(
  filter: Record<string, unknown>,
  db: Db
): Promise<Record<string, unknown>> {
  const resolvedFilter = { ...filter };
  
  // Helper function to find company ID by name
  async function findCompanyIdByName(companyName: string): Promise<string | null> {
    try {
      const company = await db.collection('companies')
        .findOne({ companyName: { $regex: `^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
      return company?._id.toString() || null;
    } catch (error) {
      console.error(`Error finding company by name '${companyName}':`, error);
      return null;
    }
  }

  // Helper function to find account ID by name
  async function findAccountIdByName(accountName: string): Promise<string | null> {
    try {
      const account = await db.collection('accounts')
        .findOne({ id: { $regex: `^${accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
      return account?._id.toString() || null;
    } catch (error) {
      console.error(`Error finding account by name '${accountName}':`, error);
      return null;
    }
  }

  // Helper function to find journal ID by journal entry ID
  async function findJournalIdByEntryId(journalEntryId: string): Promise<string | null> {
    try {
      const journal = await db.collection('journal-entries')
        .findOne({ id: { $regex: `^${journalEntryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
      return journal?._id.toString() || null;
    } catch (error) {
      console.error(`Error finding journal by entry ID '${journalEntryId}':`, error);
      return null;
    }
  }

  // Helper function to find invoice ID by invoice ID field
  async function findInvoiceIdByInvoiceId(invoiceId: string): Promise<string | null> {
    try {
      const invoice = await db.collection('invoices')
        .findOne({ id: { $regex: `^${invoiceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
      return invoice?._id.toString() || null;
    } catch (error) {
      console.error(`Error finding invoice by ID '${invoiceId}':`, error);
      return null;
    }
  }

  // Generic function to handle regex patterns for any field
  async function handleRegexField(fieldName: string, regexValue: string): Promise<ObjectId | null | string> {
    switch (fieldName) {
      case 'accountId':
        const accountId = await findAccountIdByName(regexValue);
        return accountId ? new ObjectId(accountId) : null;
      
      case 'companyId':
        const companyId = await findCompanyIdByName(regexValue);
        return companyId ? new ObjectId(companyId) : null;
      
      case 'company':
      const company = await findCompanyIdByName(regexValue);
      return company ? company : null;
      
      case 'journalId':
        const journalId = await findJournalIdByEntryId(regexValue);
        return journalId ? new ObjectId(journalId) : null;
      
      case 'invoiceId':
        const invoiceId = await findInvoiceIdByInvoiceId(regexValue);
        return invoiceId ? new ObjectId(invoiceId) : null;
      
      default:
        return null;
    }
  }

  // Process direct string values for each field
  const fieldMappings = {
    accountId: findAccountIdByName,
    companyId: findCompanyIdByName,
    company: findCompanyIdByName,
    journalId: findJournalIdByEntryId,
    invoiceId: findInvoiceIdByInvoiceId
  };

  for (const [fieldName, findFunction] of Object.entries(fieldMappings)) {
    if (resolvedFilter[fieldName] && typeof resolvedFilter[fieldName] === 'string') {
      const id = await findFunction(resolvedFilter[fieldName] as string);
      if (id) {
        if (fieldName === 'company') {
            resolvedFilter[fieldName] = id; // Keep as String because account collection have company as string
        } else {
            resolvedFilter[fieldName] = new ObjectId(id); // Cast to ObjectId
        }
      } else {
        console.warn(`${fieldName} not found with value: ${resolvedFilter[fieldName]}`);
        resolvedFilter[fieldName] = null;
      }
    }
  }

  // Handle regex patterns for all ID fields
  const idFields = ['accountId', 'companyId','company', 'journalId', 'invoiceId'];
  
  for (const fieldName of idFields) {
    if (resolvedFilter[fieldName] && 
        typeof resolvedFilter[fieldName] === 'object' && 
        resolvedFilter[fieldName] !== null) {
      
      const fieldFilter = resolvedFilter[fieldName] as Record<string, unknown>;
      
      if (fieldFilter.$regex && typeof fieldFilter.$regex === 'string') {
        const regexValue = fieldFilter.$regex;
        const objectId = await handleRegexField(fieldName, regexValue);
        console.log("the object id right fetchedd: ", objectId);
        
        if (objectId) {
          // Replace the regex filter with direct ObjectId match
          resolvedFilter[fieldName] = objectId;
        } else {
          console.warn(`${fieldName} not found with regex pattern: ${regexValue}`);
          // If not found, set to null to ensure no matches
          resolvedFilter[fieldName] = null;
        }
      }
    }
  }

  // Recursively process nested objects (for complex filters with $and, $or, etc.)
  for (const [key, value] of Object.entries(resolvedFilter)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof ObjectId)) {
      resolvedFilter[key] = await resolveFilterNamesToIds(value as Record<string, unknown>, db);
    }
    
    // Handle arrays of conditions (like $or, $and)
    if (Array.isArray(value)) {
      const resolvedArray = await Promise.all(
        value.map(async (item) => {
          if (item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof ObjectId)) {
            return await resolveFilterNamesToIds(item as Record<string, unknown>, db);
          }
          return item;
        })
      );
      resolvedFilter[key] = resolvedArray;
    }
  }
  return resolvedFilter;
}

// ----------------------- Step-5 : Mapping Synonyms to the Matching field
function mapSynonymsToSchemaFields(collection: CollectionName, fields: string[]): string[] {
  const synonymMap = FIELD_SYNONYMS[collection] || {};
  const mapped: string[] = [];
  for (const f of fields) {
    const match = synonymMap[f];
    if (match) {
      if (Array.isArray(match)) mapped.push(...match);
      else mapped.push(match);
    } else {
      mapped.push(f);
    }
  }
  return mapped;
}

// ----------------------- Step-7 : Safe MongoDB Find -------------------------------
async function safeMongoFind<T extends Document>(
  collection: Collection<T>,
  filterQuery: Filter<T>,
  projection?: Record<string, 0 | 1>,
  sortQuery?: Record<string, 1 | -1>,
  limit = 50,
  retries = 2,
  backoff = 0.5
): Promise<[WithId<T>[] | null, string | null]> {
  let attempt = 0;

  const caseInsensitiveFilter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filterQuery)) {
    if (typeof value === 'string') {
      caseInsensitiveFilter[key] = { 
        $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 
        $options: 'i' 
      };
    } else {
      caseInsensitiveFilter[key] = value;
    }
  }
  console.log("the projection use for mongodb query: ", projection)
  console.log("the sort use for mongodb query: ", sortQuery)
  while (attempt <= retries) {
    try {
      let cursor = collection.find(caseInsensitiveFilter as Filter<T>, projection ? { projection } : {});

      if (sortQuery) {
          cursor = cursor.sort(sortQuery);
      }
      
      if (limit) {
        cursor = cursor.limit(limit);
      }

      const docs = await cursor.toArray();
      return [docs, null];

    } catch (err) {
      console.error(`Query failed (attempt ${attempt + 1}):`, err);
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (attempt === retries) {
        return [null, errorMsg];
      }

      await new Promise(resolve => setTimeout(resolve, backoff * 1000 * (2 ** attempt)));
      attempt += 1;
    }
  }

  return [null, "Unknown error"]; // Should not be reached
}

// ------------------------ Step 08: Post Process Doc ---------------------
async function enrichWithNames(
  docs: WithId<Document>[],
  db: Db,
  actualFields?: string[]
): Promise<WithId<Document>[]> {
  try {
    const enrichedDocs = [...docs];
    
    // Check if we need to enrich various entity names
    const shouldEnrichAccounts = actualFields?.some(field => 
      ['account', 'debitAccount', 'creditAccount', 'accountId'].includes(field)
    ) || docs.some(doc => 
      doc.account || doc.debitAccount || doc.creditAccount || doc.accountId
    );

    const shouldEnrichCompanies = actualFields?.some(field => 
      ['company', 'companyId', 'parentCompany'].includes(field)
    ) || docs.some(doc => doc.companyId || doc.company || doc.parentCompany);

    const shouldEnrichJournals = actualFields?.some(field => 
      ['journalId'].includes(field)
    ) || docs.some(doc => doc.journalId);

    const shouldEnrichInvoices = actualFields?.some(field => 
      ['invoiceId'].includes(field)
    ) || docs.some(doc => doc.invoiceId);

    // Helper function to extract ID string (handles both string and ObjectId)
    const extractIdString = (id: unknown): string | null => {
      if (!id) return null;
      
      // Handle string
      if (typeof id === 'string') return id;
      
      // Handle ObjectId
      if (id instanceof ObjectId) return id.toString();
      
      // Handle objects with _id property
      if (typeof id === 'object' && id !== null) {
        const obj = id as Record<string, unknown>;
        if ('_id' in obj && obj._id) {
          // Recursively handle the _id value
          return extractIdString(obj._id);
        }
      }
      
      return null;
    };

    // Step 1: Enrich user names 
    const userIds = new Set<string>();
    
    enrichedDocs.forEach(doc => {
      // Handle userId (for activities)
      const userId = extractIdString(doc.userId);
      if (userId && userId !== 'Administrator') {
        userIds.add(userId);
      }
      
      // Handle createdBy/editedBy (for other collections)
      const createdBy = extractIdString(doc.createdBy);
      if (createdBy && createdBy !== 'Administrator') {
        userIds.add(createdBy);
      }
      const editedBy = extractIdString(doc.editedBy);
      if (editedBy && editedBy !== 'Administrator') {
        userIds.add(editedBy);
      }
    });

    const userMap = new Map();
    if (userIds.size > 0) {
      const users = await db.collection('users')
        .find({ _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) } })
        .project({ firstName: 1, lastName: 1, username: 1 })
        .toArray();

      users.forEach(user => {
        userMap.set(user._id.toString(), user);
      });
    }

    console.log("the enriched docs: ", enrichedDocs);

    // Step 2: Enrich account names
    const accountIds = new Set<string>();
    
    if (shouldEnrichAccounts) {
      enrichedDocs.forEach(doc => {
        const accountId = extractIdString(doc.accountId);
        if (accountId) {
          accountIds.add(accountId);
        }
        
        // Also check for other account fields
        const account = extractIdString(doc.account);
        if (account) accountIds.add(account);
        
        const debitAccount = extractIdString(doc.debitAccount);
        if (debitAccount) accountIds.add(debitAccount);
        
        const creditAccount = extractIdString(doc.creditAccount);
        if (creditAccount) accountIds.add(creditAccount);
      });
    }

    const accountMap = new Map();
    if (accountIds.size > 0) {
      const accounts = await db.collection('accounts')
        .find({ _id: { $in: Array.from(accountIds).map(id => new ObjectId(id)) } })
        .project({ id: 1, accountNumber: 1, _id: 1 })
        .toArray();

      accounts.forEach(account => {
        accountMap.set(account._id.toString(), account);
      });
    }

    console.log("the account map: ", accountMap)

    // Step 3: Enrich company names
    const companyIds = new Set<string>();
    
    if (shouldEnrichCompanies) {
      enrichedDocs.forEach(doc => {
        const companyId = extractIdString(doc.companyId );
        if (companyId) {
          companyIds.add(companyId);
        }

        const parentCompany = extractIdString(doc.parentCompany);
        if(parentCompany){
          companyIds.add(parentCompany)
        }
      });
    }

    const companyMap = new Map();
    if (companyIds.size > 0) {
      const companies = await db.collection('companies')
        .find({ _id: { $in: Array.from(companyIds).map(id => new ObjectId(id)) } })
        .project({ companyName: 1, _id: 1 })
        .toArray();

      companies.forEach(company => {
        companyMap.set(company._id.toString(), company);
      });
    }

    console.log("the company map: ", companyMap);

    // Step 4: Enrich journal names
    const journalIds = new Set<string>();
    
    if (shouldEnrichJournals) {
      enrichedDocs.forEach(doc => {
        const journalId = extractIdString(doc.journalId);
        if (journalId) {
          journalIds.add(journalId);
        }
      });
    }

    const journalMap = new Map();
    if (journalIds.size > 0) {
      const journals = await db.collection('journal-entries')
        .find({ _id: { $in: Array.from(journalIds).map(id => new ObjectId(id)) } })
        .project({ id: 1, _id: 1 })
        .toArray();

      journals.forEach(journal => {
        journalMap.set(journal._id.toString(), journal);
      });
    }

    // Step 5: Enrich invoice names
    const invoiceIds = new Set<string>();
    
    if (shouldEnrichInvoices) {
      enrichedDocs.forEach(doc => {
        const invoiceId = extractIdString(doc.invoiceId);
        if (invoiceId) {
          invoiceIds.add(invoiceId);
        }
      });
    }

    const invoiceMap = new Map();
    if (invoiceIds.size > 0) {
      const invoices = await db.collection('invoices')
        .find({ _id: { $in: Array.from(invoiceIds).map(id => new ObjectId(id)) } })
        .project({ id: 1, _id: 1 })
        .toArray();

      invoices.forEach(invoice => {
        invoiceMap.set(invoice._id.toString(), invoice);
      });
    }

    // Apply all enrichments to documents
    return enrichedDocs.map(doc => {
      const enrichedDoc = { ...doc };
      
      // Enrich user names
      const userId = extractIdString(doc.userId);
      if (userId) {
        const user = userMap.get(userId);
        if (user) {
          enrichedDoc.userId = `${user.firstName} ${user.lastName}`.trim() || user.username;
        } else if (userId === 'Administrator') {
          enrichedDoc.userId = 'Administrator';
        } else {
          enrichedDoc.userId = 'Unknown User';
        }
      }
      
      // Enrich createdBy/editedBy
      const createdBy = extractIdString(doc.createdBy);
      if (createdBy) {
        const creator = userMap.get(createdBy);
        if (creator) {
          enrichedDoc.createdBy = `${creator.firstName} ${creator.lastName}`.trim() || creator.username;
         } else if (createdBy === 'Administrator') {
          enrichedDoc.createdBy = 'Administrator';
        }else {
          enrichedDoc.createdBy = 'Unknown User';
        }
      }
      
      const editedBy = extractIdString(doc.editedBy);
      if (editedBy) {
        const editor = userMap.get(editedBy);
        if (editor) {
          enrichedDoc.editedBy = `${editor.firstName} ${editor.lastName}`.trim() || editor.username;
        } else if (editedBy === 'Administrator') {
          enrichedDoc.editedBy = 'Administrator';
        } else {
          enrichedDoc.editedBy = 'Unknown User';
        }
      }
      
      // Enrich account names
      const accountId = extractIdString(doc.accountId);
      if (accountId) {
        const account = accountMap.get(accountId);
        if (account) {
          enrichedDoc.accountId = account.id || `Account #${account.accountNumber}`;
        }
      }

      const account = extractIdString(doc.account);
      if (account) {
        const accountDetails = accountMap.get(account);
        if (accountDetails) {
          enrichedDoc.account = accountDetails.id || `Account #${accountDetails.accountNumber}`;
        }
      }

      const debitAccount = extractIdString(doc.debitAccount);
      if (debitAccount) {
        const account = accountMap.get(debitAccount);
        if (account) {
          enrichedDoc.debitAccount = account.id || `Account #${account.accountNumber}`;
        }
      }

       const creditAccount = extractIdString(doc.creditAccount);
      if (creditAccount) {
        const account = accountMap.get(creditAccount);
        if (account) {
          enrichedDoc.creditAccount = account.id || `Account #${account.accountNumber}`;
        }
      }
      
      // Enrich company names
      const companyId = extractIdString(doc.companyId);
      if (companyId) {
        const company = companyMap.get(companyId);
        if (company) {
          enrichedDoc.companyId = company.companyName;
        }
      }

      const parentCompany = extractIdString(doc.parentCompany);
      if(parentCompany){
        const company = companyMap.get(parentCompany);
        if(company){
          enrichedDoc.parentCompany = company.companyName
        }
      }
      
      // Enrich journal names
      const journalId = extractIdString(doc.journalId);
      if (journalId) {
        const journal = journalMap.get(journalId);
        if (journal) {
          enrichedDoc.journalId = journal.id || 'Journal Entry';
        }
      }
      
      // Enrich invoice names
      const invoiceId = extractIdString(doc.invoiceId);
      if (invoiceId) {
        const invoice = invoiceMap.get(invoiceId);
        if (invoice) {
          enrichedDoc.invoiceId = invoice.id || 'Invoice';
        }
      }
      console.log("The enriched docs:", enrichedDoc )
      return enrichedDoc;
    });
    
  } catch (error) {
    console.error("Error enriching names:", error);
    return docs; // Return original docs if enrichment fails
  }
}

function formatDateForDisplay(isoDateString: string | Date): string{
  try {
    const date = new Date(isoDateString);
    return date.toISOString().split('T')[0];
  } catch{
    return String(isoDateString);
  }
}

// Add this function somewhere in your file, e.g., before postProcessDocs
function formatActivityMetadata(
   activityType: string,
   metadata: Record<string, unknown> | undefined
): string {
   if (!metadata) {
     return "";
   }

   switch (activityType) {
     case 'update':
        const updatedFields = metadata.updatedFields as Record<string, unknown> | undefined;
        if (!updatedFields) return "Updated record details.";

        const changes: string[] = [];
        changes.push("You updated record details:");

        for (const [field, changeDetails] of Object.entries(updatedFields)) {
          const details = changeDetails as { old?: string, new?: string } | undefined;
          if (details) {
             const oldVal = details.old || 'N/A';
             const newVal = details.new || 'N/A';
             changes.push(`- ${field}: ${oldVal} → ${newVal}`);
          }
        }
        return changes.join('\n');
   
     case 'comment':
        // Assuming a comment activity has a 'comment' field in metadata
        const commentText = metadata.comment || metadata.text;
        return `Commented: "${commentText || 'No comment text'}"`;

     case 'like':
        return "Liked a record.";
   
     case 'create':
        return "Created a new record.";
   
     default:
        return "Activity details are unavailable.";
   }
}

function postProcessDocs(
  collectionName: string,
  docs: Record<string, unknown>[]
): Record<string, unknown>[] {

  // Format all date fields for better display
  for (const doc of docs) {
    Object.keys(doc).forEach(key => {
      const value = doc[key];
      // Check if it's a date field (common date field names)
      const isDateField = ['createdAt', 'updatedAt', 'date', 'dueDate', 'fromDate', 'toDate', 'invoiceDate', 'dateOfEstablishment'].includes(key);
      
      if (isDateField) {
        const parsed = new Date(value as string | Date);
        if (!isNaN(parsed.getTime())) {
          doc[key] = formatDateForDisplay(parsed);
        }
      }
    });
  }

  if (collectionName === "activities") {
     for (const doc of docs) {
        if (doc.activityType === 'update' || doc.activityType === 'comment' || doc.activityType === 'like' || doc.activityType === 'create') {
          const activityType = doc.activityType as string;
          const metadata = doc.metadata as Record<string, unknown> | undefined;

          // Replace the raw metadata object with the formatted string
          doc.metadata = formatActivityMetadata(activityType, metadata);

          // Optional: You might want to rename 'metadata' to 'details' or 'activityDetails' 
          // for better display, but for now, we'll keep the field name.
        }
     }
   }


  if (collectionName === "contacts") {
    for (const doc of docs) {
      const first = (doc["firstName"] as string) || "";
      const last = (doc["lastName"] as string) || "";

      if (first || last) {
        doc["name"] = `${first} ${last}`.trim();
      } else if (typeof doc["username"] === "string") {
        doc["name"] = doc["username"];
      } else if (typeof doc["fullName"] === "string") {
        doc["name"] = doc["fullName"];
      }
    }
  }
  return docs;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof ObjectId) {
    return value.toHexString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val);
    }
    return result;
  }
  return value;
}


// ----------------------- Step -9: ------------------------
type MongoDocument = Record<string, unknown>;
async function generateNaturalLanguageAnswer(
  userQuery: string,
  mongoResults: MongoDocument[],
  collectionName: DisplayFields,
  requestedFields?: string[]
): Promise<string> {
  // Get key fields for this collection
  let keyFields: readonly string[] = DEFAULT_DISPLAY_FIELDS[collectionName] || [];
  if (requestedFields && requestedFields.length > 0) {
    keyFields = Array.from(new Set([...keyFields, ...requestedFields]));
  }

  // Filter documents to only include key fields
  const filteredResults = mongoResults.map(doc => {
    const filteredDoc: MongoDocument = {};
    for (const k of keyFields) {
      if (doc[k] !== undefined) {
        filteredDoc[k] = doc[k];
      }
    }
    return filteredDoc;
  });

  const count = filteredResults.length;

  const systemPrompt = `
    You are an AI assistant that returns database query results in a clear, scannable, and natural language format.

    Rules:
    - You are also given the exact count of results (${count}).
    - Briefly explain in 1 sentence how many record you have found in natural language.
    - The results must be presented as a **numbered list**.
    - Never show raw MongoDB _id values unless they are explicitly meaningful.
    
    ### Crucial Formatting Rules:
    1. **Main Field:** Combine the record number and the first field. **Bold ONLY this first field name** (e.g., "1. **Company Name:** Pakola").
    2. **Other Fields:** List the remaining fields as bullet points using '*'. **Do NOT bold the field names** in the bullet points. Just write "Field: Value".
    3. **Spacing:** Ensure there is a line break between every field.

    - **Show All Data:** Include all fields provided in the JSON for each record, even if the value is "none", "0", or "false". Only omit fields if they are strictly null, undefined, or an empty string "".
    - Ensure there is a line break between the fields of a single record so they appear as a list.

    - Example Output Format:
      
      Found 3 companies.

      1. **Company Name:** Pakola
      * Default Currency: USD
      * Country: Pakistan
      * Status: Active

      2. **Company Name: Google
      * Default Currency: USD
      * Country: United States
      * Status: None

    - Example Output for Activities:
      
      Found 2 activities.

      1. **Activity Type:** UPDATE (by John Doe)
      * Date: 2025-11-20
      * Details: Updated account type from Cash to Liability.
    
    - Do not include fields that have undefined or empty values.
    - If no results, say: "No matching records found."
  `;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      maxOutputTokens: 2000,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `User query: ${userQuery}\nResults JSON:\n${JSON.stringify(filteredResults, null, 2)}` 
        }
      ]
    });

    return text.trim();
  } catch (e) {
    console.error("Error generating concise answer:", e);
    return `Error generating concise answer: ${(e as Error).message}`;
  }
}

// Serialize a document (top-level object)
function serializeDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc)) {
    serialized[key] = serializeValue(val);
  }
  return serialized;
}

type NestedObject = Record<string, unknown>;

function getNestedValue<T extends NestedObject>(
  doc: T,
  field: string
): unknown | null {
  const parts = field.split(".");
  let cur: unknown = doc;

  for (const p of parts) {
    if (cur && typeof cur === "object" && !Array.isArray(cur) && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return null;
    }
  }

  return cur;
}

function formatDocsLocally<T extends NestedObject>(
  collectionName: DisplayFields,
  docs: T[],
  keyFields?: readonly string[]
): string {
  const fields = keyFields ?? DEFAULT_DISPLAY_FIELDS[collectionName];

  const lines: string[] = docs.map((doc, index) => {
    const parts: string[] = [];

    for (const f of fields) {
      const val = getNestedValue(doc, f);
      if (val !== null && val !== undefined) {
        const label = f.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        parts.push(`${label}: ${val}`);
      }
    }

    if (parts.length === 0) {
      parts.push("(no displayable fields)");
    }

    return `${index + 1}. ${parts.join(", ")}`;
  });

  return lines.join("\n");
}

// -------------------- API Route POST Request --------------------
export async function POST(req: NextRequest){
    try{
        const {query} : {query: string} = await req.json();
        const rawUserQuery = query;
        const normalizedQuery = rawUserQuery.toLowerCase();

        // Step 1:  Parse user query (Natural Language)  ---> LLM (Strucuted Query - JSON)
        const llmResult = await llmResponse(normalizedQuery);
        // const llmResult = {
        //   collection: 'activities',
        //   filter: { accountId: { '$regex': '101 - Cash in Hand - GNH' } },
        //   fields: [ 'activityType', 'accountId', 'userId', 'metadata', 'createdAt' ]
        // }
        console.log("LLM Result:", llmResult);
        if ("error" in llmResult) {
            console.log("LLM parsing error:", llmResult.error);
            return NextResponse.json({
                results_json: [],
                results_text: llmResult.raw,
            });
        }

        // Step - 2 Validate LLM result
        const [ok, validationMsg] = validateLLMResult(llmResult,DATABASE_SCHEMA);
            if (!ok) {
            console.log("LLM validation error:", validationMsg)
            return NextResponse.json(
                { error: "LLM validation failed", details: validationMsg },
                { status: 400 }
            );
        }

        // Step- 3) Validate collection
        const collectionName = llmResult.collection!.toLowerCase() as CollectionName;
        const collectionNamedisplay = llmResult.collection?.toLowerCase() as DisplayFields;
        if (!(collectionName in DATABASE_SCHEMA)) {
            console.log("Invalid collection:", llmResult.collection);
            return NextResponse.json(
                { error: "Invalid collection", details: llmResult.collection },
                { status: 400 }
            );
        }

        // Step- 4) Resolve filter
        const rawFilter = llmResult.filter || {};
        const filterQuery = parseRelativeDates(rawFilter);

        // Step- 4.5) Connect to Mongo early for ID resolution
        await mongoClient.connect();
        const db = mongoClient.db(dbName);

        // Resolve company names and account names to their IDs
        const resolvedFilter = await resolveFilterNamesToIds(filterQuery, db);
        console.log("the resolved filter: ", resolvedFilter);
        console.log("the llm result fields: ", llmResult.fields);
        // 5) Determine projection fields
        let actualFields: string[] | undefined;
        if (Array.isArray(llmResult.fields) && llmResult.fields.length > 0) {
            const requestedLower = llmResult.fields.map(f => f);
            actualFields = mapSynonymsToSchemaFields(collectionName, requestedLower);
            console.log("the actual fields after synonyms mapping: ", actualFields);
            // Keep only valid schema fields
            actualFields = actualFields.filter(
                f =>
                (DATABASE_SCHEMA[collectionName] as readonly string[]).includes(f) || f.includes(".")
            );
            console.log("the valid actual fields scehma: ", actualFields);

            if (actualFields.length === 0) actualFields = undefined;
        }

        let projection: Record<string, 1> | undefined;
        if (actualFields) {
            projection = Object.fromEntries(actualFields.map(f => [f, 1])) as Record<string, 1>;
        } else {
            const defaultFields = DEFAULT_DISPLAY_FIELDS[collectionNamedisplay] as readonly string[];
            if (defaultFields) {
                projection = Object.fromEntries(defaultFields.map(f => [f, 1])) as Record<string, 1>;
            }
        }


        // 6) Check the Collection in the MongoDB
        const existingCollections = await db.listCollections().toArray();
        const existingCollectionNames = existingCollections.map(c => c.name);
        if (!existingCollectionNames.includes(collectionName)) {
          console.log("Collection not found in DB:", collectionName);
          return NextResponse.json(
            {
              error: "Collection not found in database",
              details: `Collection '${collectionName}' not present on the MongoDB server.`,
            },
            { status: 400 }
          );
        }

        const sortQuery = llmResult.sort as Record<string, 1 | -1> | undefined;
        const limitValue = llmResult.limit as number | undefined;

        // 7) Execute Mongo query with retries
        const [docs, mongoErr] = await safeMongoFind(
          db.collection(collectionName),
          resolvedFilter,
          projection,
          sortQuery,
          limitValue || 50,
          2,
          0.5
        );
        if (mongoErr) {
          return NextResponse.json(
            { error: "MongoDB query failed after retries", details: mongoErr },
            { status: 500 }
          );
        }

        console.log("the doc recieved from the mongodb: ",docs)

        if (!docs || docs.length === 0) {
          return NextResponse.json({
            results_json: [],
            results_text: "No matching records found.",
          });
        }

        // 8) Post-process docs
        // replacing the created and edited by name with the actual name instead of ids
        if (!docs || docs.length === 0) {
          return NextResponse.json({
            results_json: [],
            results_text: "No matching records found.",
          });
        }

        // Step: Check if we need to enrich with user names
        const shouldEnrichUsers = actualFields?.includes('createdBy') || 
                                actualFields?.includes('editedBy') ||
                                actualFields?.includes('userId') ||
                                rawUserQuery.toLowerCase().includes('who created') ||
                                rawUserQuery.toLowerCase().includes('creator');

        // change the jorunal entry account._id to their actual IDs
        const shouldEnrichAccounts = actualFields?.some(field => 
          ['account', 'debitAccount', 'creditAccount', 'id',].includes(field)
        ) || docs.some(doc => 
          doc.account || doc.debitAccount || doc.creditAccount || doc.id
        );

        console.log("should enrcih accounts: ", shouldEnrichAccounts);

        const shouldEnrichCompanies = actualFields?.some(field => 
          ['company', 'companyId', 'parentCompany'].includes(field)
        ) || docs.some(doc => 
          doc.company || doc.parentCompany || doc.companyId
        );

        const shouldEnrichJournals = actualFields?.includes('journalId') || 
                                  docs.some(doc => doc.journalId);

        const shouldEnrichInvoices = actualFields?.includes('invoiceId') || 
                                  docs.some(doc => doc.invoiceId);


        let enrichedDocs = docs;

        if (shouldEnrichUsers || shouldEnrichAccounts || shouldEnrichCompanies || shouldEnrichJournals || shouldEnrichInvoices) {
          console.log("Enriching with names...");
          enrichedDocs = await enrichWithNames(docs, db);
        }


        const processedDocs = postProcessDocs(collectionName, enrichedDocs);
        const serializedDocs = processedDocs.map(serializeDoc);
        console.log(serializedDocs);

        // 9) Format readable output
        let readableText: string;
        const fieldsForFormatter: string[] = (
          actualFields ?? (DEFAULT_DISPLAY_FIELDS[collectionNamedisplay] as readonly string[])
        ) as string[];

        try {
          readableText = await generateNaturalLanguageAnswer(
            rawUserQuery,
            serializedDocs,
            collectionNamedisplay,
            fieldsForFormatter
          );

          if (readableText.toLowerCase().startsWith("error")) {
            throw new Error(readableText);
          }
        } catch (e) {
          console.error("Second LLM failed; falling back to local formatter:", e);
          const fallbackText = formatDocsLocally(
            collectionNamedisplay,
            serializedDocs,
            fieldsForFormatter
          );
          readableText = `${fallbackText}\n\n(Note: formatted locally due to LLM failure.)`;
        }
        console.log("the readable text: ",readableText)
        return NextResponse.json({
          results_json: serializedDocs,
          results_text: readableText,
        });
    }catch (err) {
    console.error("Unhandled error in POST handler:", err);
    return NextResponse.json(
      { error: "Unexpected server error", details: String(err) },
      { status: 500 }
    );
  }
}

