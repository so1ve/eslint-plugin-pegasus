import { TSESTree } from "@typescript-eslint/utils";

export function isNodeMatchesNameOrPath(
	node: TSESTree.Node,
	nameOrPath: string,
) {
	const names = nameOrPath.trim().split(".");
	for (let index = names.length - 1; index >= 0; index--) {
		const name = names[index];
		if (!name) {
			return false;
		}

		if (index === 0) {
			return (
				(node.type === TSESTree.AST_NODE_TYPES.Identifier &&
					node.name === name) ||
				(name === "this" &&
					node.type === TSESTree.AST_NODE_TYPES.ThisExpression)
			);
		}

		if (
			node.type !== TSESTree.AST_NODE_TYPES.MemberExpression ||
			node.optional ||
			node.computed ||
			node.property.type !== TSESTree.AST_NODE_TYPES.Identifier ||
			node.property.name !== name
		) {
			return false;
		}

		node = node.object;
	}
}

export const isNodeMatches = (node: TSESTree.Node, nameOrPaths: string[]) =>
	nameOrPaths.some((nameOrPath) => isNodeMatchesNameOrPath(node, nameOrPath));
