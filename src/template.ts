export const replaceTemplate = (s: string, context: Record<string, string>): string => {
  for (const [k, v] of Object.entries(context)) {
    s = s.replaceAll(k, v)
  }
  return s
}
