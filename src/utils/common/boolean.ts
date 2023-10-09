// TODO: Currently doesn't support Vue

import { TSESTree } from "@typescript-eslint/types";

import { isLogicalExpression } from "./is-logical-expression";

export const isLogicNot = (node?: TSESTree.Node) =>
	node?.type === "UnaryExpression" && node.operator === "!";
export const isLogicNotArgument = (node: TSESTree.Node) =>
	isLogicNot(node.parent) &&
	!!node.parent &&
	"argument" in node.parent &&
	node.parent?.argument === node;
export const isBooleanCall = (node?: TSESTree.Node) =>
	node?.type === TSESTree.AST_NODE_TYPES.CallExpression &&
	node.callee.type === TSESTree.AST_NODE_TYPES.Identifier &&
	node.callee.name === "Boolean" &&
	node.arguments.length === 1;
export const isBooleanCallArgument = (node: TSESTree.Node) =>
	isBooleanCall(node.parent) &&
	!!node.parent &&
	"arguments" in node.parent &&
	node.parent?.arguments[0] === node;
export function isBooleanNode(node: TSESTree.Node) {
	if (
		isLogicNot(node) ||
		isLogicNotArgument(node) ||
		isBooleanCall(node) ||
		isBooleanCallArgument(node)
	) {
		return true;
	}

	const { parent } = node;
	if (
		parent &&
		(parent.type === TSESTree.AST_NODE_TYPES.IfStatement ||
			parent.type === TSESTree.AST_NODE_TYPES.ConditionalExpression ||
			parent.type === TSESTree.AST_NODE_TYPES.WhileStatement ||
			parent.type === TSESTree.AST_NODE_TYPES.DoWhileStatement ||
			parent.type === TSESTree.AST_NODE_TYPES.ForStatement) &&
		parent.test === node
	) {
		return true;
	}

	if (isLogicalExpression(parent)) {
		return isBooleanNode(parent);
	}

	return false;
}

export function getBooleanAncestor(node: TSESTree.Node): {
	node: TSESTree.Node;
	isNegative: boolean;
} {
	let isNegative = false;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		if (isLogicNotArgument(node)) {
			isNegative = !isNegative;
			node = node.parent!;
		} else if (isBooleanCallArgument(node)) {
			node = node.parent!;
		} else {
			break;
		}
	}

	return { node, isNegative };
}
