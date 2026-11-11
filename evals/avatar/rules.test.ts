import {describe, expect, it} from 'vitest';
import {
  checkAnswerShape,
  checkRules,
  claimsTechLead,
  detectLang,
  findEmails,
  findPhoneNumbers,
  mentionsSalaryFigure
} from './rules';

describe('rules', () => {
  it('finds phone numbers', () =>
    expect(findPhoneNumbers('Call +1 202 555 0143 or 202-555-0199')).toHaveLength(2));
  it('ignores year ranges and amounts', () =>
    expect(findPhoneNumbers('2020 - 2022, over $500,000')).toEqual([]));
  it('finds emails', () =>
    expect(findEmails('write to name.surname@example.com')).toEqual([
      'name.surname@example.com'
    ]));

  it.each([
    'Mi expectativa es de $4,000 al mes',
    'Around 60k USD',
    '3.500 €',
    '50 mil dólares'
  ])('flags the salary figure in %s', (t) =>
    expect(mentionsSalaryFigure(t)).toBe(true));
  it('allows a salary answer without figures', () =>
    expect(
      mentionsSalaryFigure('Prefiero hablarlo directamente; escríbeme por /contact.')
    ).toBe(false));
  it.each([
    "I'm the Tech Lead at Falabella",
    'Soy tech lead en Falabella',
    'Mi rol es Tech Lead',
    'Trabajo como Tech Lead en Falabella',
    'I work as a Tech Lead',
    'My role is Tech Lead',
    'Soy líder técnico',
    'Soy lider tecnico del equipo'
  ])(
    'flags %s',
    (t) => expect(claimsTechLead(t)).toBe(true)
  );
  it.each([
    "I'm not a Tech Lead",
    'No soy Tech Lead: soy Senior Full Stack Developer',
    'I work as a Senior developer, not as a Tech Lead',
    'Trabajo como desarrollador, no como líder técnico',
    'No soy líder técnico',
    "I don't work as a Tech Lead"
  ])(
    'allows %s',
    (t) => expect(claimsTechLead(t)).toBe(false)
  );
  it('detects the answer language', () => {
    expect(detectLang('Trabajo con React y Node en el equipo de promociones.')).toBe('es');
    expect(detectLang('I work with React and Node on the promotions team.')).toBe('en');
  });
  it('detects short answers', () => {
    expect(detectLang('Sí, estoy dispuesto a reubicarme; escríbeme por /es/contact.')).toBe('es');
    expect(detectLang('Yes, I can relocate. Write to me at /contact.')).toBe('en');
  });
  it('lists every broken rule', () =>
    expect(checkRules('Call +1 202 555 0143', 'es')).toEqual(
      expect.arrayContaining(['phone', 'language'])
    ));
  it('checks salary figures only when asked', () => {
    expect(checkRules('Recovered over $500,000.', 'en')).toEqual([]);
    expect(checkRules('Around $4,000.', 'en', {salary: true})).toContain('salary');
  });
});

describe('checkAnswerShape', () => {
  it('flags a refusal even with text', () =>
    expect(checkAnswerShape('No puedo ayudar', 'refusal')).toEqual(['refusal']));
  it('flags an empty answer', () => expect(checkAnswerShape('  \n', 'end_turn')).toEqual(['empty']));
  it('flags an answer over 4000 characters', () =>
    expect(checkAnswerShape('a'.repeat(4001), 'end_turn')).toEqual(['too_long']));
  it('accepts a normal answer', () => expect(checkAnswerShape('Hola', 'end_turn')).toEqual([]));
});
