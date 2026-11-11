export const LINKEDIN_URL = 'https://www.linkedin.com/in/daniel-tapia-dev/';

export type TextPart =
  | {type: 'text'; text: string}
  | {type: 'link'; href: string; label: string; external: boolean};

// Only these targets become links. Everything the model writes is rendered as
// text, so an unknown URL can never turn into a clickable one.
// A target must be a whole word: at the start or after a space or "(", and
// followed by the end, a space or punctuation (which stays outside the link).
const LINK_PATTERN =
  /(?<=^|[\s(])(\/es\/contact|\/contact|(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/daniel-tapia-dev\/?)(?=$|[\s.,;:!?)])/g;

export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const label = match[1];
    if (match.index > last) {
      parts.push({type: 'text', text: text.slice(last, match.index)});
    }
    const internal = label.startsWith('/');
    parts.push({
      type: 'link',
      href: internal ? label : LINKEDIN_URL,
      label,
      external: !internal
    });
    last = match.index + label.length;
  }
  if (last < text.length) parts.push({type: 'text', text: text.slice(last)});
  return parts;
}

export type LatencyBucket = 'lt1s' | '1to2s' | '2to3s' | 'gt3s';

export function latencyBucket(ms: number): LatencyBucket {
  if (ms < 1000) return 'lt1s';
  if (ms < 2000) return '1to2s';
  if (ms < 3000) return '2to3s';
  return 'gt3s';
}
