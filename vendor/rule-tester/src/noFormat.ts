/**
 * Simple no-op tag to mark code samples as "should not format with prettier"
 *   for the plugin-test-formatting lint rule
 */
export const noFormat = (raw: TemplateStringsArray, ...keys: string[]): string => (String.raw({ raw }, ...keys));
