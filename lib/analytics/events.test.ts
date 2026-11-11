import {describe, expect, it} from 'vitest';
import {
  ANALYTICS_EVENTS,
  ANALYTICS_PROPERTY_KEYS,
  isAnalyticsSuperProperty,
  registerAnalyticsProperty
} from './events';

describe('avatar analytics', () => {
  it('accepts only allowlisted super properties', () => {
    expect(isAnalyticsSuperProperty('avatar_used')).toBe(true);
    expect(isAnalyticsSuperProperty('email')).toBe(false);
  });

  it('lists the avatar events and keys', () => {
    expect(ANALYTICS_EVENTS).toContain('avatar_question_asked');
    expect(ANALYTICS_PROPERTY_KEYS).toEqual(
      expect.arrayContaining(['topic', 'outcome', 'latency'])
    );
  });

  it('does nothing outside the browser', () => {
    expect(() => registerAnalyticsProperty('avatar_used')).not.toThrow();
  });
});
