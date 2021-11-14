import { evaluateTemplate } from '../src/template'

test('plain text', () => {
  expect(evaluateTemplate('foo', {})).toBe('foo')
})

test('multiline text', () => {
  expect(evaluateTemplate('foo\n```\ncode\n```\nbar', {})).toBe('foo\n```\ncode\n```\nbar')
})

test('interpolation with variable', () => {
  expect(evaluateTemplate('exit code ${code}, failed', { code: 2 })).toBe('exit code 2, failed')
})

test('interpolation with expression', () => {
  expect(evaluateTemplate('value ${value * 100}', { value: 3 })).toBe('value 300')
})

test('nested interpolation is not supported', () => {
  expect(() => evaluateTemplate('value ${value * 10 + ` dollars`}', { value: 5 })).toThrowError(SyntaxError)
  // toBe('value 50 dollars')
})
