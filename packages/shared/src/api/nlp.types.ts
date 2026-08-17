// NLP date parsing (NIC-1931/1932). Locale is restricted to what the backend
// olebedev/when wrapper actually supports — Hebrew has no rule set.
export type NLPDateLocale = 'en' | 'ru';

export interface ParseNLPDateRequest {
  text: string;
  timezone: string;
  locale: NLPDateLocale;
}

export interface ParseNLPDateResponse {
  date: string | null;
  confidence: 'high' | 'low';
  display: string | null;
}
