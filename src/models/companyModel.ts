import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import { ICompany } from "@/types/company";

// Zod validation schema
export const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  defaultCurrency: z.string().min(1, "Default currency is required"),
  defaultLetterHead: z.string().optional(),
  taxId: z.string().optional(),
  domain: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  dateOfEstablishment: z.string().optional(),
  isGroup: z.boolean().default(false),
  parentCompany: z.string().optional(),
  defaultHolidayList: z.array(z.string()).default([]),
  registrationDetails: z.string().optional(),
  
  // Account Details
  chartOfAccountBasis: z.string().optional(),
  writeOffAccount: z.string().optional(),
  defaultPaymentDiscountAccount: z.string().optional(),
  unrealizedProfitLossAccount: z.string().optional(),
  defaultPaymentTermsTemplate: z.string().optional(),
  defaultFinanceBook: z.string().optional(),
  exchangeGainLossAccount: z.string().optional(),
  unrealizedExchangeGainLossAccount: z.string().optional(),
  roundOffAccount: z.string().optional(),
  roundOffForOpening: z.string().optional(),
  roundOffCostCenter: z.string().optional(),
  bookAdvancePaymentInSeparatePartyAccount: z.boolean().default(false),
  reconciliationEffectOn: z.string().min(1, "Reconciliation effect on is required"),
  autoCreateExchangeRateRevaluation: z.boolean().default(false),
  frequency: z.string().optional(),
  submitERRJournals: z.boolean().default(false),
  exceptionBudgetApproverRole: z.string().optional(),
  accumulatedDepreciationAccount: z.string().optional(),
  gainLossAccountOnAssetDisposal: z.string().optional(),
  depreciationExpenseAccount: z.string().optional(),
  assetDepreciationCostCenter: z.string().optional(),
  seriesForAssetDepreciationEntry: z.string().optional(),
  capitalWorkInProgressAccount: z.string().optional(),
  expensesIncludedInAssetValuation: z.string().optional(),
  assetReceivedButNotBilled: z.string().optional(),

  // Buying and Selling Settings
  defaultBuyingTerms: z.string().optional(),
  defaultSellingTerms: z.string().optional(),
  monthlySalesTarget: z.number().optional(),
  defaultWarehouseForSalesReturn: z.string().optional(),

  // Manufacturing
  defaultOperationCostAccount: z.string().optional(),

  // Audit fields
  editedBy: z.string().min(1, "Your id is missing, authentication required."),
  createdBy: z.string().min(1, "Your id is missing, please authenticate.")
});

// Mongoose schema
const CompanySchema: Schema = new Schema(
  {
    companyName: { type: String, required: true },
    abbreviation: { type: String, required: true },
    defaultCurrency: { type: String, required: true },
    defaultLetterHead: { type: String },
    taxId: { type: String },
    domain: { type: String },
    country: { type: String },
    dateOfEstablishment: { type: String },
    isGroup: { type: Boolean, default: false },
    parentCompany: { type: String },
    defaultHolidayList: { type: [String], default: [] },
    registrationDetails: { type: String },
    
    // Account Details
    chartOfAccountBasis: { type: String },
    writeOffAccount: { type: String },
    defaultPaymentDiscountAccount: { type: String },
    unrealizedProfitLossAccount: { type: String },
    defaultPaymentTermsTemplate: { type: String },
    defaultFinanceBook: { type: String },
    exchangeGainLossAccount: { type: String },
    unrealizedExchangeGainLossAccount: { type: String },
    roundOffAccount: { type: String },
    roundOffForOpening: { type: String },
    roundOffCostCenter: { type: String },
    bookAdvancePaymentInSeparatePartyAccount: { type: Boolean, default: false },
    reconciliationEffectOn: {type: String},
    autoCreateExchangeRateRevaluation: { type: Boolean, default: false },
    frequency: { type: String },
    submitERRJournals: { type: Boolean, default: false },
    exceptionBudgetApproverRole: { type: String },
    accumulatedDepreciationAccount: { type: String },
    gainLossAccountOnAssetDisposal: { type: String },
    depreciationExpenseAccount: { type: String },
    assetDepreciationCostCenter: { type: String },
    seriesForAssetDepreciationEntry: { type: String },
    capitalWorkInProgressAccount: { type: String },
    expensesIncludedInAssetValuation: { type: String },
    assetReceivedButNotBilled: { type: String },

    // Buying and Selling Settings
    defaultBuyingTerms: { type: String },
    defaultSellingTerms: { type: String },
    monthlySalesTarget: { type: Number },
    defaultWarehouseForSalesReturn: { type: String },

    // Manufacturing
    defaultOperationCostAccount: { type: String },

    // Audit fields
    createdBy: { type: Schema.Types.Mixed, ref: "users", required: true },
    editedBy: { type: Schema.Types.Mixed, ref: "users", required: true },
  },
  { timestamps: true }
);

// Create and export the model
export const Company =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);