import {describe, expect, it} from 'vitest';
import {findEmails, findPhoneNumbers} from './rules';

describe('rules', () => {
  it('finds phone numbers', () =>
    expect(findPhoneNumbers('Call +1 202 555 0143 or 202-555-0199')).toHaveLength(2));
  it('ignores year ranges and amounts', () =>
    expect(findPhoneNumbers('2020 - 2022, over $500,000')).toEqual([]));
  it('finds emails', () =>
    expect(findEmails('write to name.surname@example.com')).toEqual([
      'name.surname@example.com'
    ]));
});
