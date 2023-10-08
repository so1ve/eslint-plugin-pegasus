import {
	isClosingParenToken,
	isOpeningParenToken,
	isParenthesized,
} from "@eslint-community/eslint-utils";
import type { TSESTree } from "@typescript-eslint/types";
import type { TSESLint } from "@typescript-eslint/utils";

export function getParenthesizedTimes(
	node: TSESTree.Node,
	sourceCode: TSESLint.SourceCode,
) {
	let times = 0;

	while (isParenthesized(times + 1, node, sourceCode)) {
		times++;
	}

	return times;
}

export function getParentheses(
	node: TSESTree.Node,
	sourceCode: TSESLint.SourceCode,
) {
	const count = getParenthesizedTimes(node, sourceCode);

	if (count === 0) {
		return [];
	}

	return [
		...sourceCode.getTokensBefore(node, { count, filter: isOpeningParenToken }),
		...sourceCode.getTokensAfter(node, { count, filter: isClosingParenToken }),
	];
}

export function getParenthesizedRange(
	node: TSESTree.Node,
	sourceCode: TSESLint.SourceCode,
) {
	const parentheses = getParentheses(node, sourceCode);
	const [start] = (parentheses[0] || node).range;
	const [, end] = (parentheses.at(-1) ?? node).range;

	return [start, end];
}

export function getParenthesizedText(
	node: TSESTree.Node,
	sourceCode: TSESLint.SourceCode,
) {
	const [start, end] = getParenthesizedRange(node, sourceCode);

	return sourceCode.text.slice(start, end);
}
