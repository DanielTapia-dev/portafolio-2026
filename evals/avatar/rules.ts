// Deterministic checks shared by the avatar evals and the knowledge tests.
import {CHAT_LIMITS} from '@/lib/avatar/protocol';

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

// Daniel is not a Tech Lead, so the avatar must not present itself as one, in
// either language. Each pattern is "the speaker is / works as / has the role of".
// The negative lookbehinds let "I'm not a Tech Lead", "No soy Tech Lead" and
// "I don't work as a Tech Lead" through.
const ROLE = String.raw`(?:el\s+|la\s+|un\s+|una\s+|the\s+|a\s+)?(?:tech lead|l[ií]der t[eé]cnico)\b`;
const NOT = String.raw`(?<!\bno\s)(?<!\bnot\s)(?<!n['’]t\s)`;
const TECH_LEAD = [
  new RegExp(String.raw`${NOT}\b(?:soy|I am|I['’]m)\s+${ROLE}`, 'i'),
  new RegExp(String.raw`\b(?:mi rol es|my role is)\s+${ROLE}`, 'i'),
  new RegExp(String.raw`${NOT}\b(?:trabajo|work|works|working)\s+(?:como|as)\s+${ROLE}`, 'i')
];

export function claimsTechLead(text: string): boolean {
  return TECH_LEAD.some((pattern) => pattern.test(text));
}

// No word shared by both languages ("a", "no", "i"), so short answers are not biased.
const STOPWORDS = {
  es: new Set(
    'de la que el en y los las por con para una mi es del se no un su lo al como más'.split(' ')
  ),
  en: new Set('the and of to in my is with for on as at it am are was this that you'.split(' '))
};

function countWords(words: string[], vocabulary: Set<string>): number {
  return words.filter((word) => vocabulary.has(word)).length;
}

// Frequent function words are enough for the answers of this eval; a tie is English.
// Splitting on non-letters keeps accented words whole, which \b would not.
export function detectLang(text: string): 'en' | 'es' {
  const words = text.toLowerCase().split(/[^\p{L}]+/u);
  return countWords(words, STOPWORDS.es) > countWords(words, STOPWORDS.en) ? 'es' : 'en';
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

// What the chat route does with an answer it cannot show: a refusal, an empty
// answer or one over the transcript limit all end the turn with an error.
export function checkAnswerShape(answer: string, stopReason: string | null): string[] {
  if (stopReason === 'refusal') return ['refusal'];
  if (answer.trim().length === 0) return ['empty'];
  if (answer.length > CHAT_LIMITS.assistantTextMax) return ['too_long'];
  return [];
}
