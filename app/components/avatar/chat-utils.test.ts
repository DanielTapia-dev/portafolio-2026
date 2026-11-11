import {describe, expect, it} from 'vitest';
import {LINKEDIN_URL, latencyBucket, splitLinks} from './chat-utils';

describe('splitLinks', () => {
  it('links the contact page', () =>
    expect(splitLinks('Use /contact.')).toEqual([
      {type: 'text', text: 'Use '},
      {type: 'link', href: '/contact', label: '/contact', external: false},
      {type: 'text', text: '.'}
    ]));

  it('links the Spanish contact page inside parentheses', () =>
    expect(splitLinks('(/es/contact)')).toEqual([
      {type: 'text', text: '('},
      {
        type: 'link',
        href: '/es/contact',
        label: '/es/contact',
        external: false
      },
      {type: 'text', text: ')'}
    ]));

  it('links LinkedIn in any common spelling', () => {
    for (const url of [
      'https://www.linkedin.com/in/daniel-tapia-dev/',
      'linkedin.com/in/daniel-tapia-dev'
    ]) {
      expect(splitLinks(url)[0]).toMatchObject({
        type: 'link',
        href: LINKEDIN_URL,
        external: true
      });
    }
  });

  it('keeps the trailing punctuation out of the LinkedIn link', () =>
    expect(
      splitLinks('Find me at https://www.linkedin.com/in/daniel-tapia-dev/.')
    ).toEqual([
      {type: 'text', text: 'Find me at '},
      {
        type: 'link',
        href: LINKEDIN_URL,
        label: 'https://www.linkedin.com/in/daniel-tapia-dev/',
        external: true
      },
      {type: 'text', text: '.'}
    ]));

  it.each([
    'https://evil.example/contact',
    'see example.com/contact',
    '/contactme',
    'javascript:alert(1)'
  ])('keeps %s as text', (text) =>
    expect(splitLinks(text).every((p) => p.type === 'text')).toBe(true)
  );

  it('returns plain text unchanged', () =>
    expect(splitLinks('Hello')).toEqual([{type: 'text', text: 'Hello'}]));
});

describe('latencyBucket', () => {
  it.each([
    [999, 'lt1s'],
    [1000, '1to2s'],
    [2999, '2to3s'],
    [3000, 'gt3s']
  ])('%i ms is %s', (ms, bucket) => expect(latencyBucket(ms)).toBe(bucket));
});
