/**
 * Money Value Object
 * Immutable value object for handling monetary values with currency
 */

import { ValidationException } from '../../shared/exceptions/base.exception.js';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CNY' | 'INR';

export class Money {
  private readonly _amount: number;
  private readonly _currency: Currency;

  constructor(amount: number, currency: Currency = 'USD') {
    this.validateAmount(amount);
    this.validateCurrency(currency);
    
    // Round to 4 decimal places to handle floating point precision
    this._amount = Math.round(amount * 10000) / 10000;
    this._currency = currency;
  }

  /**
   * Create Money from string amount
   */
  public static fromString(amount: string, currency: Currency = 'USD'): Money {
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount)) {
      throw new ValidationException(`Invalid amount: ${amount}`);
    }
    
    return new Money(numericAmount, currency);
  }

  /**
   * Create zero money
   */
  public static zero(currency: Currency = 'USD'): Money {
    return new Money(0, currency);
  }

  /**
   * Create Money from cents/smallest unit
   */
  public static fromCents(cents: number, currency: Currency = 'USD'): Money {
    const divisor = this.getCurrencyDivisor(currency);
    return new Money(cents / divisor, currency);
  }

  // Getters
  public get amount(): number {
    return this._amount;
  }

  public get currency(): Currency {
    return this._currency;
  }

  /**
   * Get amount in cents/smallest unit
   */
  public get cents(): number {
    const divisor = Money.getCurrencyDivisor(this._currency);
    return Math.round(this._amount * divisor);
  }

  /**
   * Check if amount is zero
   */
  public isZero(): boolean {
    return this._amount === 0;
  }

  /**
   * Check if amount is positive
   */
  public isPositive(): boolean {
    return this._amount > 0;
  }

  /**
   * Check if amount is negative
   */
  public isNegative(): boolean {
    return this._amount < 0;
  }

  /**
   * Check if this money is greater than another
   */
  public isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  /**
   * Check if this money is greater than or equal to another
   */
  public isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount >= other._amount;
  }

  /**
   * Check if this money is less than another
   */
  public isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  /**
   * Check if this money is less than or equal to another
   */
  public isLessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount <= other._amount;
  }

  /**
   * Check if this money equals another
   */
  public equals(other: Money): boolean {
    return this._currency === other._currency && this._amount === other._amount;
  }

  /**
   * Add money
   */
  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Subtract money
   */
  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * Multiply by a number
   */
  public multiply(multiplier: number): Money {
    if (isNaN(multiplier) || !isFinite(multiplier)) {
      throw new ValidationException('Multiplier must be a finite number');
    }
    
    return new Money(this._amount * multiplier, this._currency);
  }

  /**
   * Divide by a number
   */
  public divide(divisor: number): Money {
    if (isNaN(divisor) || !isFinite(divisor) || divisor === 0) {
      throw new ValidationException('Divisor must be a finite non-zero number');
    }
    
    return new Money(this._amount / divisor, this._currency);
  }

  /**
   * Get absolute value
   */
  public abs(): Money {
    return new Money(Math.abs(this._amount), this._currency);
  }

  /**
   * Negate the amount
   */
  public negate(): Money {
    return new Money(-this._amount, this._currency);
  }

  /**
   * Apply percentage
   */
  public percentage(percent: number): Money {
    return this.multiply(percent / 100);
  }

  /**
   * Round to specified decimal places
   */
  public round(decimalPlaces: number = 2): Money {
    const factor = Math.pow(10, decimalPlaces);
    const rounded = Math.round(this._amount * factor) / factor;
    return new Money(rounded, this._currency);
  }

  /**
   * Format as string with currency symbol
   */
  public format(options: {
    showSymbol?: boolean;
    decimalPlaces?: number;
    locale?: string;
  } = {}): string {
    const {
      showSymbol = true,
      decimalPlaces = 2,
      locale = 'en-US'
    } = options;

    const formatted = this._amount.toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    if (showSymbol) {
      const symbol = this.getCurrencySymbol();
      return `${symbol}${formatted}`;
    }

    return formatted;
  }

  /**
   * Convert to JSON
   */
  public toJSON(): { amount: number; currency: Currency } {
    return {
      amount: this._amount,
      currency: this._currency,
    };
  }

  /**
   * Convert to string
   */
  public toString(): string {
    return this.format();
  }

  /**
   * Create Money from JSON
   */
  public static fromJSON(data: { amount: number; currency: Currency }): Money {
    return new Money(data.amount, data.currency);
  }

  // Private helper methods

  /**
   * Validate amount
   */
  private validateAmount(amount: number): void {
    if (isNaN(amount) || !isFinite(amount)) {
      throw new ValidationException('Amount must be a finite number');
    }
  }

  /**
   * Validate currency
   */
  private validateCurrency(currency: Currency): void {
    const validCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];
    
    if (!validCurrencies.includes(currency)) {
      throw new ValidationException(`Invalid currency: ${currency}`);
    }
  }

  /**
   * Ensure same currency for operations
   */
  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new ValidationException(
        `Cannot perform operation on different currencies: ${this._currency} and ${other._currency}`
      );
    }
  }

  /**
   * Get currency symbol
   */
  private getCurrencySymbol(): string {
    const symbols: Record<Currency, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
    };

    return symbols[this._currency] || this._currency;
  }

  /**
   * Get currency divisor for converting to/from smallest unit
   */
  private static getCurrencyDivisor(currency: Currency): number {
    // Most currencies use 100 (cents), but some like JPY don't have subdivisions
    const divisors: Record<Currency, number> = {
      USD: 100,
      EUR: 100,
      GBP: 100,
      CAD: 100,
      AUD: 100,
      JPY: 1, // Yen doesn't have subdivisions
      CNY: 100,
      INR: 100,
    };

    return divisors[currency] || 100;
  }
}
