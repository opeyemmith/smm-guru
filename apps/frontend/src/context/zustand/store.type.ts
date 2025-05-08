export interface ProviderIdState {
  selectedProviderId: number | null;
  setSelectedProviderId: (id: number) => void;
}

export interface CurrencyState {
  currency: string | null;
  setCurrency: (currency: string) => void;
}
