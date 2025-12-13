export interface ICompany {
  _id: string; // MongoDB ID
  companyName: string;
  abbreviation: string;
  defaultCurrency: string;
  defaultLetterHead?: string;
  taxId?: string;
  domain?: string;
  country?: string;
  dateOfEstablishment?: Date;
  isGroup: boolean;
  parentCompany?: string;
  defaultHolidayList?: string[];
  registrationDetails?: string;
  
  // Account Details
  chartOfAccountBasis?: string;
  writeOffAccount?: string;
  defaultPaymentDiscountAccount?: string;
  unrealizedProfitLossAccount?: string;
  defaultPaymentTermsTemplate?: string;
  defaultFinanceBook?: string;
  exchangeGainLossAccount?: string;
  unrealizedExchangeGainLossAccount?: string;
  roundOffAccount?: string;
  roundOffForOpening?: string;
  roundOffCostCenter?: string;
  bookAdvancePaymentInSeparatePartyAccount: boolean;
  reconciliationEffectOn: string;
  autoCreateExchangeRateRevaluation: boolean;
  frequency?: string;
  submitERRJournals: boolean;
  exceptionBudgetApproverRole?: string;
  accumulatedDepreciationAccount?: string;
  gainLossAccountOnAssetDisposal?: string;
  depreciationExpenseAccount?: string;
  assetDepreciationCostCenter?: string;
  seriesForAssetDepreciationEntry?: string;
  capitalWorkInProgressAccount?: string;
  expensesIncludedInAssetValuation?: string;
  assetReceivedButNotBilled?: string;

  // Buying and Selling Settings
  defaultBuyingTerms?: string;
  defaultSellingTerms?: string;
  monthlySalesTarget?: number;
  defaultWarehouseForSalesReturn?: string;

  // Manufacturing
  defaultOperationCostAccount?: string;

  // Audit fields
  createdBy: string;
  editedBy: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}