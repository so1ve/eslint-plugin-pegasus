import type { TSESTree } from "@typescript-eslint/types";

export function isLiteral<T>(
	node: TSESTree.Node,
	value: T,
): node is TSESTree.Literal & { value: T } {
	if (node?.type !== "Literal") {
		return false;
	}

	if (value === null) {
		return node.raw === "null";
	}

	return node.value === value;
}

export const isStringLiteral = (
	node: TSESTree.Node,
): node is TSESTree.StringLiteral =>
	node?.type === "Literal" && typeof node.value === "string";
export const isNumberLiteral = (
	node: TSESTree.Node,
): node is TSESTree.NumberLiteral =>
	node.type === "Literal" && typeof node.value === "number";
export const isRegexLiteral = (
	node: TSESTree.Node,
): node is TSESTree.RegExpLiteral =>
	node.type === "Literal" && "regex" in node && Boolean(node.regex);
export const isNullLiteral = (
	node: TSESTree.Node,
): node is TSESTree.NullLiteral => isLiteral(node, null);
export const isBigIntLiteral = (
	node: TSESTree.Node,
): node is TSESTree.BigIntLiteral =>
	node.type === "Literal" && "bigint" in node && Boolean(node.bigint);
