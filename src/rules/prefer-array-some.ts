import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils";
import {
	isLiteral,
	isMemberExpression,
	isMethodCall,
	isUndefined,
} from "../utils/ast";
import {
	getParenthesizedRange,
	isBooleanNode,
	isNodeValueNotFunction,
} from "../utils/common";
import { removeMemberExpressionProperty } from "../utils/fix";
import { TypeHelper } from "../utils/ts";

export const RULE_NAME = "prefer-array-some";
export type MessageIds = "some" | "someSuggestion" | "filter";
export type Options = [];

const isCheckingUndefined = (node: TSESTree.Node) =>
	node.parent?.type === TSESTree.AST_NODE_TYPES.BinaryExpression &&
	// Not checking yoda expression `null != foo.find()` and `undefined !== foo.find()
	node.parent.left === node &&
	(((node.parent.operator === "!=" ||
		node.parent.operator === "==" ||
		node.parent.operator === "===" ||
		node.parent.operator === "!==") &&
		isUndefined(node.parent.right)) ||
		((node.parent.operator === "!=" || node.parent.operator === "==") &&
			// eslint-disable-next-line unicorn/no-null
			isLiteral(node.parent.right, null)));

export default createRule<Options, MessageIds>({
	name: RULE_NAME,
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Prefer `.some(…)` over `.filter(…).length` check and `.{find,findLast}(…)`.",
			requiresTypeChecking: true,
		},
		fixable: "code",
		schema: [],
		messages: {
			some: "Prefer `.some(…)` over `.{{method}}(…)`.",
			someSuggestion: "Replace `.{{method}}(…)` with `.some(…)`.",
			filter: "Prefer `.some(…)` over non-zero length check from `.filter(…)`.",
		},
		hasSuggestions: true,
	},
	defaultOptions: [],
	create: (context) => {
		const services = ESLintUtils.getParserServices(context);
		const typeHelper = new TypeHelper(services);

		return {
			CallExpression(callExpression) {
				if (
					!isMethodCall(callExpression, {
						methods: ["find", "findLast"],
						minimumArguments: 1,
						maximumArguments: 2,
						optionalCall: false,
						optionalMember: false,
					})
				) {
					return;
				}

				const isCompare = isCheckingUndefined(callExpression);
				if (!isCompare && !isBooleanNode(callExpression)) {
					return;
				}

				const { property: methodNode, object: arrayNode } =
					callExpression.callee;

				if (
					methodNode.type !== TSESTree.AST_NODE_TYPES.Identifier ||
					!typeHelper.isTypeArrayTypeOrUnionOfArrayTypes(arrayNode)
				) {
					return;
				}

				context.report({
					node: methodNode,
					messageId: "some",
					data: { method: methodNode.name },
					suggest: [
						{
							messageId: "someSuggestion",
							data: { method: methodNode.name },
							*fix(fixer) {
								yield fixer.replaceText(methodNode, "some");

								if (!isCompare) {
									return;
								}

								const parenthesizedRange = getParenthesizedRange(
									callExpression,
									context.sourceCode,
								);
								yield fixer.replaceTextRange(
									[parenthesizedRange[1], callExpression.parent.range[1]],
									"",
								);

								if (
									callExpression.parent.type !==
										TSESTree.AST_NODE_TYPES.BinaryExpression ||
									callExpression.parent.operator === "!=" ||
									callExpression.parent.operator === "!=="
								) {
									return;
								}

								yield fixer.insertTextBeforeRange(parenthesizedRange, "!");
							},
						},
					],
				});
			},
			BinaryExpression(binaryExpression) {
				if (
					!(
						// We assume the user already follows `unicorn/explicit-length-check`. These are allowed in that rule.
						(
							(binaryExpression.operator === ">" ||
								binaryExpression.operator === "!==") &&
							binaryExpression.right.type === "Literal" &&
							binaryExpression.right.raw === "0" &&
							isMemberExpression(binaryExpression.left, {
								property: "length",
								optional: false,
							}) &&
							isMethodCall(binaryExpression.left.object, {
								method: "filter",
								optionalCall: false,
								optionalMember: false,
							})
						)
					)
				) {
					return;
				}

				const filterCall = binaryExpression.left.object;
				const [firstArgument] = filterCall.arguments;
				if (!firstArgument || isNodeValueNotFunction(firstArgument)) {
					return;
				}

				const filterProperty = filterCall.callee.property;

				context.report({
					node: filterProperty,
					messageId: "filter",
					*fix(fixer) {
						// `.filter` to `.some`
						yield fixer.replaceText(filterProperty, "some");

						const { sourceCode } = context;
						const lengthNode =
							binaryExpression.left as TSESTree.MemberExpression;
						/*
							Remove `.length`
							`(( (( array.filter() )).length )) > (( 0 ))`
							------------------------^^^^^^^
						*/
						yield removeMemberExpressionProperty(fixer, lengthNode, sourceCode);

						/*
							Remove `> 0`
							`(( (( array.filter() )).length )) > (( 0 ))`
							----------------------------------^^^^^^^^^^
						*/
						yield fixer.removeRange([
							getParenthesizedRange(lengthNode, sourceCode)[1],
							binaryExpression.range[1],
						]);

						// The `BinaryExpression` always ends with a number or `)`, no need check for ASI
					},
				});
			},
		};
	},
});
