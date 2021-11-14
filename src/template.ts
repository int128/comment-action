export const evaluateTemplate = (s: string, context: Record<string, unknown>): string => {
  const escaped = 'return `' + s.replace(/`/g, '\\`') + '`'

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...Object.keys(context), escaped)

  return String(fn(...Object.values(context)))
}
