import { TSESTree } from "@typescript-eslint/types";

export const isUndefined = (node: TSESTree.Node) =>
	node.type === TSESTree.AST_NODE_TYPES.Identifier && node.name === "undefined";
