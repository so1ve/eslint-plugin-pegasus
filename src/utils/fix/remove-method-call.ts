import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { getParenthesizedRange } from "../common";
import { removeMemberExpressionProperty } from "./remove-member-expression-property";

export function* removeMethodCall(
	fixer: TSESLint.RuleFixer,
	callExpression: TSESTree.CallExpression,
	sourceCode: TSESLint.SourceCode,
) {
	const memberExpression = callExpression.callee as TSESTree.MemberExpression;

	// `(( (( foo )).bar ))()`
	//              ^^^^
	yield removeMemberExpressionProperty(fixer, memberExpression, sourceCode);

	// `(( (( foo )).bar ))()`
	//                     ^^
	const [, start] = getParenthesizedRange(memberExpression, sourceCode);
	const [, end] = callExpression.range;

	yield fixer.removeRange([start, end]);
}
