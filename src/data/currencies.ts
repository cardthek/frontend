export const ISO_CURRENCY_CODES = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD",
  "CAD", "CDF", "CHE", "CHF", "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUC", "CUP", "CVE", "CZK",
  "DJF", "DKK", "DOP", "DZD",
  "EGP", "ERN", "ETB", "EUR",
  "FJD", "FKP",
  "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD",
  "HKD", "HNL", "HTG", "HUF",
  "IDR", "ILS", "INR", "IQD", "IRR", "ISK",
  "JMD", "JOD", "JPY",
  "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT",
  "LAK", "LBP", "LKR", "LRD", "LSL", "LYD",
  "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR", "MZN",
  "NAD", "NGN", "NIO", "NOK", "NPR", "NZD",
  "OMR",
  "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG",
  "QAR",
  "RON", "RSD", "RUB", "RWF",
  "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", "SSP", "STN", "SVC", "SYP", "SZL",
  "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS",
  "UAH", "UGX", "USD", "USN", "UYI", "UYU", "UYW", "UZS",
  "VED", "VES", "VND", "VUV",
  "WST",
  "XAF", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XOF", "XPD", "XPF", "XPT", "XSU", "XTS", "XUA", "XXX",
  "YER",
  "ZAR", "ZMW", "ZWG",
] as const;

export const ALL_CURRENCIES_CODE = "*";
const currencyCodeSet = new Set<string>(ISO_CURRENCY_CODES);
const currencyNames = new Intl.DisplayNames(["zh-CN"], { type: "currency" });

export const PRIORITY_CURRENCY_CODES = ["CNY", "EUR", "USD", "JPY", "GBP", "HKD", "SGD", "CHF", "CAD", "AUD", "KRW"];

const currencyNameOverrides: Record<string, string> = {
  CNY: "人民币",
  EUR: "欧元",
  USD: "美元",
  JPY: "日元",
  XXX: "未知货币",
};

export function normalizeCurrencyCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === ALL_CURRENCIES_CODE) return ALL_CURRENCIES_CODE;
  return currencyCodeSet.has(normalized) ? normalized : "";
}

export function currencyName(code: string) {
  if (code === ALL_CURRENCIES_CODE) return "全币种";
  const normalized = normalizeCurrencyCode(code);
  if (!normalized) return code;
  return currencyNameOverrides[normalized] ?? currencyNames.of(normalized) ?? normalized;
}

export interface CurrencyOption {
  code: string;
  name: string;
}

const allCurrencyOptions: CurrencyOption[] = ISO_CURRENCY_CODES
  .map((code) => ({ code, name: currencyName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

export const priorityCurrencyOptions = PRIORITY_CURRENCY_CODES
  .map((code) => allCurrencyOptions.find((option) => option.code === code))
  .filter((option): option is CurrencyOption => Boolean(option));

export const allCurrencyOptionsIncludingPriority = allCurrencyOptions;

export const otherCurrencyOptions = allCurrencyOptions.filter(
  (option) => !PRIORITY_CURRENCY_CODES.includes(option.code),
);
