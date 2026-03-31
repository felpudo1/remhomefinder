export function currencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "USD":
      return "U$S";
    case "ARS":
    case "UYU":
      return "$U";
    case "UI":
      return "UI";
    default:
      return currency;
  }
}
