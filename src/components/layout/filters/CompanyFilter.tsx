// components/filters/CompanyFilter.tsx
"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface CompanyFilterProps {
  value?: string; // Now expects company ID
  onChange?: (value: string) => void; // Now sends company ID
  placeholder?: string;
  className?: string;
}

interface Company {
  _id: string;
  companyName: string;
  // Add other company fields as needed
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({
  value = "",
  onChange,
  placeholder = "Select a company...",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(value); // Changed variable name
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch companies from API
  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/user/company");
      if (response.data.success) {
        setCompanies(response.data.data || []);
      } else {
        setError("Failed to fetch companies");
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies when dropdown opens
  useEffect(() => {
    if (isOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen, companies.length]);

  // Filter companies based on search term (still using companyName for search)
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) {
      return companies;
    }
    return companies.filter(company =>
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  // Handle company selection (single select) - now using company ID
  const handleCompanySelect = (companyId: string) => {
    // If already selected, deselect it (clear selection)
    if (selectedCompanyId === companyId) {
      setSelectedCompanyId("");
      onChange?.("");
    } else {
      // Select new company (only one)
      setSelectedCompanyId(companyId);
      onChange?.(companyId);
    }
    setIsOpen(false); // Close dropdown after selection
    setSearchTerm(""); // Clear search term
  };

  // Clear selection
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompanyId("");
    onChange?.("");
    setSearchTerm("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Refresh companies
  const handleRefresh = () => {
    fetchCompanies();
  };

  // Get the selected company object
  const selectedCompany = companies.find(company => company._id === selectedCompanyId);

  return (
    <div className={cn("relative w-64", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between h-auto min-h-10",
          selectedCompanyId ? "px-3 py-2" : "px-3 py-2"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {!selectedCompany ? (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-primary px-2 py-1 rounded-md text-xs max-w-[180px] truncate"
              title={selectedCompany.companyName}
            >
              {selectedCompany.companyName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {selectedCompanyId && (
            <X
              className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={clearSelection}
            />
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen ? "rotate-180" : ""
          )} />
        </div>
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              placeholder="Type to search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading companies...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 text-center">
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          )}

          {/* Companies List */}
          {!loading && !error && (
            <div className="overflow-y-auto max-h-48">
              {filteredCompanies.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {companies.length === 0 ? "No companies available" : "No companies found"}
                </div>
              ) : (
                filteredCompanies.map(company => (
                  <div
                    key={company._id}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedCompanyId === company._id && "bg-muted"
                    )}
                    onClick={() => handleCompanySelect(company._id)} // Pass company ID
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded-full flex items-center justify-center",
                        selectedCompanyId === company._id
                          ? "bg-primary-dull border-primary-dull text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selectedCompanyId === company._id && (
                        <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                      )}
                    </div>
                    <span className="text-sm flex-1 truncate" title={company.companyName}>
                      {company.companyName}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyFilter;