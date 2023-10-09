import { TSESTree } from "@typescript-eslint/types";

export const isLogicalExpression = (
	node?: TSESTree.Node,
): node is TSESTree.LogicalExpression & { operator: "&&" | "||" } =>
	node?.type === TSESTree.AST_NODE_TYPES.LogicalExpression &&
	(node.operator === "&&" || node.operator === "||");

module.exports = isLogicalExpression;
