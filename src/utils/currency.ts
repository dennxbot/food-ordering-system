/**
 * Currency formatting utility for the application
 */

// Currency configuration
export const CURRENCY = {
  code: 'PHP',
  symbol: '₱',
  name: 'Philippine Peso',
  locale: 'en-PH',
  exchangeRate: 1, // Set to 1 since we're using PHP as base currency
};

/**
 * Format a number as Philippine Peso
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const formatter = new Intl.NumberFormat(CURRENCY.locale, {
    style: 'decimal',
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formattedAmount = formatter.format(amount);
  const parts: string[] = [];

  if (showSymbol) {
    parts.push(CURRENCY.symbol);
  }

  parts.push(formattedAmount);

  if (showCode) {
    parts.push(` ${CURRENCY.code}`);
  }

  return parts.join('');
};

/**
 * Convert USD to PHP (if needed in the future)
 * @param usdAmount - Amount in USD
 * @returns Amount in PHP
 */
export const convertUSDtoPHP = (usdAmount: number): number => {
  // Current exchange rate is approximately 1 USD = 56.50 PHP
  const exchangeRate = 56.50;
  return usdAmount * exchangeRate;
};
