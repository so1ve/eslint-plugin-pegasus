import {
	findVariable,
	hasSideEffect,
	isParenthesized,
} from "@eslint-community/eslint-utils";
import { TSESTree } from "@typescript-eslint/types";
import type { TSESLint } from "@typescript-eslint/utils";

import { isMethodCall } from "../ast";
import type { EnhancedAnyContext } from "../common";
import { isFunctionSelfUsedInside, isSameIdentifier } from "../common";

const isSimpleCompare = (node: TSESTree.Node, compareNode: TSESTree.Node) =>
	node.type === TSESTree.AST_NODE_TYPES.BinaryExpression &&
	node.operator === "===" &&
	(isSameIdentifier(node.left, compareNode) ||
		isSameIdentifier(node.right, compareNode));
const isSimpleCompareCallbackFunction = (node: TSESTree.Node) =>
	// Matches `foo.findIndex(bar => bar === baz)`
	(node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression &&
		!node.async &&
		node.params.length === 1 &&
		isSimpleCompare(node.body, node.params[0])) ||
	// Matches `foo.findIndex(bar => {return bar === baz})`
	// Matches `foo.findIndex(function (bar) {return bar === baz})`
	((node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression ||
		node.type === TSESTree.AST_NODE_TYPES.FunctionExpression) &&
		!node.async &&
		!node.generator &&
		node.params.length === 1 &&
		node.body.type === "BlockStatement" &&
		node.body.body.length === 1 &&
		node.body.body[0].type === "ReturnStatement" &&
		isSimpleCompare(node.body.body[0].argument!, node.params[0]));
const isIdentifierNamed = (
	{ type, name }: { type: TSESTree.AST_NODE_TYPES; name: string },
	expectName: string,
) => type === TSESTree.AST_NODE_TYPES.Identifier && name === expectName;

export type ErrorMethod = "findIndex" | "findLastIndex" | "some";
export function simpleArraySearchRule({
	method,
	replacement,
}: {
	method: ErrorMethod;
	replacement: string;
}) {
	// Add prefix to avoid conflicts in `prefer-includes` rule
	const MESSAGE_ID_PREFIX = `prefer-${replacement}-over-${method}/`;
	const ERROR = `${MESSAGE_ID_PREFIX}error`;
	const SUGGESTION = `${MESSAGE_ID_PREFIX}suggestion`;
	const ERROR_MESSAGES = {
		findIndex:
			"Use `.indexOf()` instead of `.findIndex()` when looking for the index of an item.",
		findLastIndex:
			"Use `.lastIndexOf()` instead of `findLastIndex() when looking for the index of an item.`",
		some: `Use \`.${replacement}()\` instead of \`.${method}()\` when checking value existence.`,
	} satisfies Record<ErrorMethod, string>;

	const messages = {
		[ERROR]: ERROR_MESSAGES[method],
		[SUGGESTION]: `Replace \`.${method}()\` with \`.${replacement}()\`.`,
	};

	function listen(context: EnhancedAnyContext) {
		const { sourceCode } = context;
		const { scopeManager } = sourceCode;

		context.on("CallExpression", (callExpression: TSESTree.CallExpression) => {
			if (
				!isMethodCall(callExpression, {
					method,
					argumentsLength: 1,
					optionalCall: false,
					optionalMember: false,
				}) ||
				!isSimpleCompareCallbackFunction(callExpression.arguments[0])
			) {
				return;
			}

			const [callback] = callExpression.arguments;
			const binaryExpression: TSESTree.BinaryExpression =
				(callback as any).body.type === TSESTree.AST_NODE_TYPES.BinaryExpression
					? (callback as any).body
					: (callback as any).body.body[0].argument;
			const [parameter] = (callback as any)
				.params as TSESTree.CallExpressionArgument[];
			const { left, right } = binaryExpression;
			const { name } = parameter as any;

			let searchValueNode: TSESTree.Node;
			let parameterInBinaryExpression: TSESTree.BinaryExpression;
			if (isIdentifierNamed(left as any, name)) {
				searchValueNode = right;
				parameterInBinaryExpression = left as any;
			} else if (isIdentifierNamed(right as any, name)) {
				searchValueNode = left;
				parameterInBinaryExpression = right as any;
			} else {
				return;
			}

			const callbackScope = scopeManager!.acquire(
				callback,
			) as TSESLint.Scope.Scopes.FunctionScope;
			if (
				// `parameter` is used somewhere else
				findVariable(callbackScope, parameter).references.some(
					({ identifier }: any) => identifier !== parameterInBinaryExpression,
				) ||
				isFunctionSelfUsedInside(
					callback as TSESTree.FunctionLike,
					callbackScope,
				)
			) {
				return;
			}

			const methodNode = callExpression.callee.property;
			const problem: any = {
				node: methodNode,
				messageId: ERROR,
				suggest: [],
			};

			function* fix(fixer: TSESLint.RuleFixer) {
				let text = sourceCode.getText(searchValueNode);
				if (
					isParenthesized(searchValueNode, sourceCode) &&
					!isParenthesized(callback, sourceCode)
				) {
					text = `(${text})`;
				}

				yield fixer.replaceText(methodNode, replacement);
				yield fixer.replaceText(callback, text);
			}

			if (hasSideEffect(searchValueNode, sourceCode)) {
				problem.suggest.push({ messageId: SUGGESTION, fix });
			} else {
				problem.fix = fix;
			}

			context.report(problem);
		});
	}

	return { messages, listen };
}
