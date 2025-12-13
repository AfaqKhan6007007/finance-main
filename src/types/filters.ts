// Discriminated union for filter configs
export interface FilterConfig {
  id: string;
  type: "company" | "id" | "accountNumber" | "rootType" | "reportType" | "accountType";
  props?: {
    value?: string;
    placeholder?: string;
    className?: string;
    // Add other filter-specific props here
  };
}

export type FilterValues = {
  companies?: string;
}
