// Deterministic checks shared by the avatar evals and the knowledge tests.

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;

export function findEmails(text: string): string[] {
  return text.match(EMAIL) ?? [];
}

// Nine digits or more, so year ranges and amounts are not mistaken for phones.
export function findPhoneNumbers(text: string): string[] {
  return (text.match(PHONE) ?? []).filter(
    (match) => match.replace(/\D/g, '').length >= 9
  );
}

// A number next to a currency marker, or a "60k"/"50 mil" shorthand.
const SALARY_FIGURES = [
  /(?:\$|€|US\$|\b(?:USD|EUR)\s?)\s?\d/i,
  /\d\s?(?:\$|€|\b(?:USD|EUR|d[oó]lares|dollars)\b)/i,
  /\d\s?(?:k|mil)\b/i
];

export function mentionsSalaryFigure(text: string): boolean {
  return SALARY_FIGURES.some((pattern) => pattern.test(text));
}

// The negative lookbehinds let "I'm not a Tech Lead" and "No soy Tech Lead" through.
const TECH_LEAD =
  /(?<!\bno\s)(?<!\bnot\s)\b(soy|I am|I['’]m)\s+(el\s+|un\s+|the\s+|a\s+)?tech lead\b/i;

export function claimsTechLead(text: string): boolean {
  return TECH_LEAD.test(text);
}

const STOPWORDS = {
  es: 'de la que el en y los las por con para una mi es del',
  en: 'the and of to in my is with for a on as at it i'
};

function countWords(text: string, words: string): number {
  return words
    .split(' ')
    .reduce(
      (total, word) => total + (text.match(new RegExp(`\\b${word}\\b`, 'gi'))?.length ?? 0),
      0
    );
}

// Frequent function words are enough for the answers of this eval; a tie is English.
export function detectLang(text: string): 'en' | 'es' {
  return countWords(text, STOPWORDS.es) > countWords(text, STOPWORDS.en) ? 'es' : 'en';
}

// Returns the codes of the broken rules. The salary rule is opt-in because other
// answers may quote amounts from the site, such as the Bomberos recovery.
export function checkRules(
  answer: string,
  lang: 'en' | 'es',
  options: {salary?: boolean} = {}
): string[] {
  const broken: string[] = [];
  if (findEmails(answer).length > 0) broken.push('email');
  if (findPhoneNumbers(answer).length > 0) broken.push('phone');
  if (options.salary && mentionsSalaryFigure(answer)) broken.push('salary');
  if (claimsTechLead(answer)) broken.push('tech_lead');
  if (detectLang(answer) !== lang) broken.push('language');
  return broken;
}
