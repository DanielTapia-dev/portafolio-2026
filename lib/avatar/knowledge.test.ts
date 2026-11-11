import {describe, expect, it} from 'vitest';
import {findEmails, findPhoneNumbers} from '@/evals/avatar/rules';
import {buildKnowledge, KNOWLEDGE, loadKnowledgeSources} from './knowledge';

describe('knowledge', () => {
  it('is identical on every build', () =>
    expect(buildKnowledge(loadKnowledgeSources())).toBe(KNOWLEDGE));
  it.each([
    'SAA-C03',
    'CLF-C02',
    'Technical University of Ambato',
    'Senior Full Stack Developer',
    'Falabella Seller Center',
    '<site lang="es">',
    '<cv>'
  ])('contains %s', (text) => expect(KNOWLEDGE).toContain(text));
  it('has no contact data', () => {
    expect(findEmails(KNOWLEDGE)).toEqual([]);
    expect(findPhoneNumbers(KNOWLEDGE)).toEqual([]);
  });
  it.each([
    'Copy email address',
    'Toggle menu',
    '<highlight>',
    '/projects/',
    'aws-cloud-practitioner'
  ])('leaves out %s', (text) => expect(KNOWLEDGE).not.toContain(text));
  it('skips placeholder links', () => expect(KNOWLEDGE).not.toMatch(/live=#/));
});
