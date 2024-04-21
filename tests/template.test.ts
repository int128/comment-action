import { replaceTemplate } from '../src/template.js'

test('plain text', () => {
  expect(replaceTemplate('foo', {})).toBe('foo')
})

test('multiline text', () => {
  expect(replaceTemplate('foo\n```\ncode\n```\nbar', {})).toBe('foo\n```\ncode\n```\nbar')
})

test('interpolation with variable', () => {
  expect(replaceTemplate('exit code ${code}, failed', { '${code}': '2' })).toBe('exit code 2, failed')
})

test('interpolation with expression is not supported', () => {
  expect(replaceTemplate('value ${value * 100}', {})).toBe('value ${value * 100}')
})
