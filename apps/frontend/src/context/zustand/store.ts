import { create } from "zustand";
import { CurrencyState, ProviderIdState } from "./store.type";

export const useProviderId = create<ProviderIdState>((set) => ({
  selectedProviderId: null,
  setSelectedProviderId: (id) => set(() => ({ selectedProviderId: id })),
}));

export const useCurrency = create<CurrencyState>((set) => ({
  currency: null,
  setCurrency: (currency) => set(() => ({ currency: currency })),
}));
