import { TSESTree } from "@typescript-eslint/types";

export const isSameIdentifier = (nodeA: TSESTree.Node, nodeB: TSESTree.Node) =>
	nodeB.type === TSESTree.AST_NODE_TYPES.Identifier &&
	nodeA.type === TSESTree.AST_NODE_TYPES.Identifier &&
	nodeA.name === nodeB.name;
