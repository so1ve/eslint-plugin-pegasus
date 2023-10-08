import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { getParenthesizedRange } from "../common";

export const replaceArgument = (
	fixer: TSESLint.RuleFixer,
	node: TSESTree.Node,
	text: string | number,
	sourceCode: TSESLint.SourceCode,
) =>
	fixer.replaceTextRange(getParenthesizedRange(node, sourceCode), String(text));
