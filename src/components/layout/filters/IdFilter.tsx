// components/filters/IdFilter.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const IdFilter: React.FC<IdFilterProps> = ({
  value = "",
  onChange,
  placeholder = "ID",
  className
}) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce implementation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only trigger onChange if the value has actually changed
      if (inputValue !== value) {
        onChange?.(inputValue);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [inputValue, value, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Clear input
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

export default IdFilter;