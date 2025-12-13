"use client";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountNumberFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const AccountNumberFilter: React.FC<AccountNumberFilterProps> = ({
  value = "",
  onChange,
  placeholder = "Search by Account Number",
  className
}) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce implementation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue !== value) {
        onChange?.(inputValue);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValue, value, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const clearInput = () => {
    setInputValue("");
    onChange?.("");
  };

  return (
    <div className={cn("relative w-64", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          className="w-full pr-8"
        />
        {inputValue && (
          <X
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={clearInput}
          />
        )}
      </div>
      
    </div>
  );
};

export default AccountNumberFilter;