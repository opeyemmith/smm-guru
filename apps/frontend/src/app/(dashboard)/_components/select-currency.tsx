"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/lib/localstorage/functions";
import { useCurrency } from "@/context/zustand/store";

const currencies = [
  {
    value: "USD",
    label: "USD",
    flag: "🇺🇸",
    name: "US Dollar",
  },
  {
    value: "INR",
    label: "INR",
    flag: "🇮🇳",
    name: "Indian Rupee",
  },
];

type CurrencySelectProps = {
  value: string | null;
  onChange: (value: string) => void;
};

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.value}
            onSelect={() => {
              const newValue = currency.value === value ? "" : currency.value;
              setToLocalStorage("currency", newValue);
              onChange(newValue);
            }}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{currency.flag}</span>
              <span>{currency.label}</span>
            </span>
            {value === currency.value && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CurrencyForm() {
  const { currency, setCurrency } = useCurrency();

  React.useEffect(() => {
    const currencyFromLocal = getFromLocalStorage("currency");
    if (currencyFromLocal) {
      setCurrency(currencyFromLocal);
    } else {
      setCurrency("INR");
    }
  }, []);

  return <CurrencySelect value={currency} onChange={setCurrency} />;
}
