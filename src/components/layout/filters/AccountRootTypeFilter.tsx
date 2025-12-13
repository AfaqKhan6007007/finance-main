"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountRootTypeFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const rootTypes = ["Asset", "Liability", "Income", "Expense", "Equity"];

const AccountRootTypeFilter: React.FC<AccountRootTypeFilterProps> = ({
  value = "",
  onChange,
  placeholder = "Root Type",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (rootType: string) => {
    const newValue = rootType === "none" ? "" : rootType;
    setSelectedValue(newValue);
    onChange?.(newValue);
    setIsOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValue("");
    onChange?.("");
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

  return (
    <div className={cn("relative w-48", className)} ref={dropdownRef}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between",
          selectedValue ? "pr-8" : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("truncate", !selectedValue && "text-muted-foreground")}>
          {selectedValue || placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {selectedValue && (
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

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          <div className="overflow-y-auto max-h-48">
            {/* Empty option */}
            <div
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground"
              onClick={() => handleSelect("none")}
            >
              {/* {placeholder} */}
            </div>
            
            {/* Root type options */}
            {rootTypes.map((rootType) => (
              <div
                key={rootType}
                className={cn(
                  "p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm",
                  selectedValue === rootType && "bg-muted font-medium"
                )}
                onClick={() => handleSelect(rootType)}
              >
                {rootType}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountRootTypeFilter;