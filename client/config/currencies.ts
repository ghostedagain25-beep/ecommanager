export interface Currency {
  name: string;
  code: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { name: 'US Dollar', code: 'USD', symbol: '$' },
  { name: 'Euro', code: 'EUR', symbol: '€' },
  { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
  { name: 'British Pound', code: 'GBP', symbol: '£' },
  { name: 'Australian Dollar', code: 'AUD', symbol: 'A$' },
  { name: 'Canadian Dollar', code: 'CAD', symbol: 'C$' },
  { name: 'Swiss Franc', code: 'CHF', symbol: 'CHF' },
  { name: 'Chinese Yuan', code: 'CNY', symbol: '¥' },
  { name: 'Indian Rupee', code: 'INR', symbol: '₹' },
  { name: 'Brazilian Real', code: 'BRL', symbol: 'R$' },
  { name: 'Russian Ruble', code: 'RUB', symbol: '₽' },
  { name: 'South African Rand', code: 'ZAR', symbol: 'R' },
  { name: 'New Zealand Dollar', code: 'NZD', symbol: 'NZ$' },
  { name: 'Singapore Dollar', code: 'SGD', symbol: 'S$' },
  { name: 'Mexican Peso', code: 'MXN', symbol: 'Mex$' },
  { name: 'Hong Kong Dollar', code: 'HKD', symbol: 'HK$' },
  { name: 'Norwegian Krone', code: 'NOK', symbol: 'kr' },
  { name: 'Swedish Krona', code: 'SEK', symbol: 'kr' },
  { name: 'South Korean Won', code: 'KRW', symbol: '₩' },
  { name: 'Turkish Lira', code: 'TRY', symbol: '₺' },
  { name: 'United Arab Emirates Dirham', code: 'AED', symbol: 'د.إ' },
  { name: 'Argentine Peso', code: 'ARS', symbol: '$' },
  { name: 'Chilean Peso', code: 'CLP', symbol: '$' },
  { name: 'Colombian Peso', code: 'COP', symbol: '$' },
  { name: 'Danish Krone', code: 'DKK', symbol: 'kr' },
  { name: 'Egyptian Pound', code: 'EGP', symbol: 'E£' },
  { name: 'Indonesian Rupiah', code: 'IDR', symbol: 'Rp' },
  { name: 'Israeli New Shekel', code: 'ILS', symbol: '₪' },
  { name: 'Malaysian Ringgit', code: 'MYR', symbol: 'RM' },
  { name: 'Pakistani Rupee', code: 'PKR', symbol: '₨' },
  { name: 'Philippine Peso', code: 'PHP', symbol: '₱' },
  { name: 'Polish Złoty', code: 'PLN', symbol: 'zł' },
  { name: 'Qatari Riyal', code: 'QAR', symbol: 'ر.ق' },
  { name: 'Saudi Riyal', code: 'SAR', symbol: 'ر.س' },
  { name: 'Thai Baht', code: 'THB', symbol: '฿' },
  { name: 'Vietnamese Dong', code: 'VND', symbol: '₫' },
];
