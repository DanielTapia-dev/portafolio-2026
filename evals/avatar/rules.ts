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
