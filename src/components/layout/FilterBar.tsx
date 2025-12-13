// components/FilterBar.tsx
import React from "react";
import { FilterConfig } from "@/types/filters";
import CompanyFilter from "@/components/layout/filters/CompanyFilter";
import IdFilter from "@/components/layout/filters/IdFilter";
import AccountNumberFilter from "@/components/layout/filters/AccountNumberFilter";
import AccountRootTypeFilter from "@/components/layout/filters/AccountRootTypeFilter";
import AccountReportTypeFilter from "@/components/layout/filters/AccountReportTypeFilter";
import AccountTypeFilter from "@/components/layout/filters/AccountTypeFilter";

interface FilterBarProps {
  filters: FilterConfig[];
  onFiltersChange?: (filters: Record<string, string>) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange}) => {
  const handleFilterChange = (filterId: string, value: string) => {
    onFiltersChange?.({ [filterId]: value });
  };

  return (
    <div className="flex gap-2">
      {filters.map((filter) => {
        switch (filter.type) {
          case "company":
            return (
              <CompanyFilter
                key={filter.id}
                value={filter.props?.value}
                onChange={(value) => handleFilterChange(filter.id, value)}
                placeholder={filter.props?.placeholder}
                className={filter.props?.className}
              />
            );
          case "id":
            return(
               <IdFilter
                  key={filter.id}
                  value={filter.props?.value}
                  onChange={(value) => handleFilterChange(filter.id, value)}
                  placeholder={filter.props?.placeholder}
                  className={filter.props?.className}
                />
            )
          case "accountNumber":
            return (
              <AccountNumberFilter
                key={filter.id}
                value={filter.props?.value}
                onChange={(value) => handleFilterChange(filter.id, value)}
                placeholder={filter.props?.placeholder}
                className={filter.props?.className}
              />
            );
          case "rootType":
            return (
              <AccountRootTypeFilter
                key={filter.id}
                value={filter.props?.value}
                onChange={(value) => handleFilterChange(filter.id, value)}
                placeholder={filter.props?.placeholder}
                className={filter.props?.className}
              />
            );
          case "reportType":
            return (
              <AccountReportTypeFilter
                key={filter.id}
                value={filter.props?.value}
                onChange={(value) => handleFilterChange(filter.id, value)}
                placeholder={filter.props?.placeholder}
                className={filter.props?.className}
              />
            );
          case "accountType":
            return (
              <AccountTypeFilter
                key={filter.id}
                value={filter.props?.value}
                onChange={(value) => handleFilterChange(filter.id, value)}
                placeholder={filter.props?.placeholder}
                className={filter.props?.className}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default FilterBar;