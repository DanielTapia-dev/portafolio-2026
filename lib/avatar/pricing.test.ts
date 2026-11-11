import {describe, expect, it} from 'vitest';
import {messageCostMicroUsd, usageCostMicroUsd} from './pricing';

describe('pricing', () => {
  it('prices a first Opus question', () => expect(usageCostMicroUsd('claude-opus-5-5', {input_tokens: 400, cache_creation_input_tokens: 15000, cache_read_input_tokens: 0, output_tokens: 330})).toBe(83200));
  it('prices a cached Opus question', () => expect(usageCostMicroUsd('claude-opus-5-5', {input_tokens: 400, cache_creation_input_tokens: 0, cache_read_input_tokens: 15000, output_tokens: 330})).toBe(11200));
  it('prices an unknown model at the highest known rates', () => expect(usageCostMicroUsd('claude-future', {input_tokens: 1, output_tokens: 1})).toBe(30));
  it('rounds the cost up', () => expect(usageCostMicroUsd('claude-haiku-5-5', {input_tokens: 1, output_tokens: 0})).toBe(1));
  it('adds every fallback iteration at its own price', () => expect(messageCostMicroUsd({model: 'claude-opus-5', usage: {input_tokens: 100, output_tokens: 10, iterations: [{model: 'claude-opus-5-5', input_tokens: 100, output_tokens: 0}, {model: 'claude-opus-5', input_tokens: 100, output_tokens: 10}]}})).toBe(400 + 750));
  it('uses the message model for iterations without one', () => expect(messageCostMicroUsd({model: 'claude-opus-5', usage: {input_tokens: 0, output_tokens: 0, iterations: [{input_tokens: 100, output_tokens: 0}]}})).toBe(500));
  it('uses the top-level usage without iterations', () => expect(messageCostMicroUsd({model: 'claude-opus-5-5', usage: {input_tokens: 100, output_tokens: 10}})).toBe(600));
});
