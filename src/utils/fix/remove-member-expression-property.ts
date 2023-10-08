import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { getParenthesizedRange } from "../common";

export function removeMemberExpressionProperty(
	fixer: TSESLint.RuleFixer,
	memberExpression: TSESTree.MemberExpression,
	sourceCode: TSESLint.SourceCode,
) {
	const [, start] = getParenthesizedRange(memberExpression.object, sourceCode);
	const [, end] = memberExpression.range;

	return fixer.removeRange([start, end]);
}
