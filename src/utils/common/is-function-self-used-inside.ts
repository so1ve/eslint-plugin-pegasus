import { findVariable } from "@eslint-community/eslint-utils";
import { TSESTree } from "@typescript-eslint/types";
import type { TSESLint } from "@typescript-eslint/utils";

function getReferences(
	scope: TSESLint.Scope.Scope,
	nodeOrName: TSESTree.Node | string,
) {
	const { references = [] } = findVariable(scope, nodeOrName) || {};

	return references;
}
export function isFunctionSelfUsedInside(
	functionNode: TSESTree.FunctionLike,
	functionScope: TSESLint.Scope.Scopes.FunctionScope,
) {
	/* c8 ignore next 3 */
	if (functionScope.block !== functionNode) {
		throw new Error('"functionScope" should be the scope of "functionNode".');
	}

	const { type, id } = functionNode;

	if (type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression) {
		return false;
	}

	// TODO
	if (functionScope.thisFound) {
		return true;
	}

	if (
		getReferences(functionScope, "arguments").some(
			({ from }: any) => from === functionScope,
		)
	) {
		return true;
	}

	if (id && getReferences(functionScope, id).length > 0) {
		return true;
	}

	return false;
}
