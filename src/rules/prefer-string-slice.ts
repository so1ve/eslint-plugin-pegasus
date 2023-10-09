// TODO: Math.max

import { getStaticValue } from "@eslint-community/eslint-utils";
import typeutils from "@typescript-eslint/type-utils";
import type {
	ParserServicesWithTypeInformation,
	TSESLint,
	TSESTree,
} from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { createRule } from "../utils";
import { isMethodCall, isNumberLiteral } from "../utils/ast";
import type { AbortFunction } from "../utils/common";
import {
	getParenthesizedRange,
	getParenthesizedText,
	isNumber,
	wrapFixFunction,
} from "../utils/common";
import { replaceArgument } from "../utils/fix";

export const RULE_NAME = "prefer-string-slice";
export type MessageIds = "substr" | "substring";
export type Options = [];

function getNumericValue(node: TSESTree.Node): number | undefined {
	if (isNumberLiteral(node)) {
		return node.value;
	}

	if (node.type === "UnaryExpression" && node.operator === "-") {
		return -(getNumericValue(node.argument) ?? 0);
	}
}

// This handles cases where the argument is very likely to be a number, such as `.substring('foo'.length)`.
const isLengthProperty = (node: TSESTree.Node) =>
	node?.type === "MemberExpression" &&
	node.computed === false &&
	node.property.type === "Identifier" &&
	node.property.name === "length";

interface FixOptions {
	node: TSESTree.CallExpression;
	fixer: TSESLint.RuleFixer;
	context: TSESLint.RuleContext<MessageIds, Options>;
	abort: AbortFunction;
	services: ParserServicesWithTypeInformation;
}

function* fixSubstrArguments({
	node,
	fixer,
	context,
	abort,
	services,
}: FixOptions) {
	const argumentNodes = node.arguments;
	const [firstArgument, secondArgument] = argumentNodes;

	if (!secondArgument) {
		return;
	}

	const { sourceCode } = context;
	// TODO: Missing types
	const scope = (sourceCode as any).getScope(node);
	const firstArgumentStaticResult = getStaticValue(firstArgument, scope);
	const secondArgumentRange = getParenthesizedRange(secondArgument, sourceCode);
	const replaceSecondArgument = (text: string | number) =>
		replaceArgument(fixer, secondArgument, text, sourceCode);

	if (firstArgumentStaticResult?.value === 0) {
		if (isNumberLiteral(secondArgument) || isLengthProperty(secondArgument)) {
			return;
		}

		if (typeof getNumericValue(secondArgument) === "number") {
			yield replaceSecondArgument(
				Math.max(0, getNumericValue(secondArgument) ?? 0),
			);

			return;
		}

		const secondArgumentType = typeutils.getConstrainedTypeAtLocation(
			services,
			secondArgument,
		);

		if (tsutils.isTypeFlagSet(secondArgumentType, ts.TypeFlags.Number)) {
			return;
		}

		yield fixer.insertTextBeforeRange(secondArgumentRange, "Math.max(0, ");
		yield fixer.insertTextAfterRange(secondArgumentRange, ")");

		return;
	}

	if (isNumberLiteral(firstArgument) && isNumberLiteral(secondArgument)) {
		yield replaceSecondArgument(firstArgument.value + secondArgument.value);

		return;
	}

	if (argumentNodes.every((node) => isNumber(node, scope))) {
		const firstArgumentText = getParenthesizedText(firstArgument, sourceCode);

		yield fixer.insertTextBeforeRange(
			secondArgumentRange,
			`${firstArgumentText} + `,
		);

		return;
	}

	return abort();
}

function* fixSubstringArguments({
	node,
	fixer,
	context,
	abort,
	services,
}: FixOptions) {
	const { sourceCode } = context;
	const [firstArgument, secondArgument] = node.arguments;

	const firstNumber = firstArgument
		? getNumericValue(firstArgument)
		: undefined;
	const firstArgumentText = getParenthesizedText(firstArgument, sourceCode);
	const replaceFirstArgument = (text: string | number) =>
		replaceArgument(fixer, firstArgument, text, sourceCode);

	if (!secondArgument) {
		if (isLengthProperty(firstArgument)) {
			return;
		}

		if (firstNumber !== undefined) {
			yield replaceFirstArgument(Math.max(0, firstNumber));

			return;
		}

		const firstArgumentType = typeutils.getConstrainedTypeAtLocation(
			services,
			firstArgument,
		);

		if (tsutils.isTypeFlagSet(firstArgumentType, ts.TypeFlags.Number)) {
			return;
		}

		const firstArgumentRange = getParenthesizedRange(firstArgument, sourceCode);
		yield fixer.insertTextBeforeRange(firstArgumentRange, "Math.max(0, ");
		yield fixer.insertTextAfterRange(firstArgumentRange, ")");

		return;
	}

	const secondNumber = getNumericValue(secondArgument);
	const secondArgumentText = getParenthesizedText(secondArgument, sourceCode);
	const replaceSecondArgument = (text: string | number) =>
		replaceArgument(fixer, secondArgument, text, sourceCode);

	if (firstNumber !== undefined && secondNumber !== undefined) {
		const argumentsValue = [
			Math.max(0, firstNumber),
			Math.max(0, secondNumber),
		];
		if (firstNumber > secondNumber) {
			argumentsValue.reverse();
		}

		if (argumentsValue[0] !== firstNumber) {
			yield replaceFirstArgument(argumentsValue[0]);
		}

		if (argumentsValue[1] !== secondNumber) {
			yield replaceSecondArgument(argumentsValue[1]);
		}

		return;
	}

	if (firstNumber === 0 || secondNumber === 0) {
		yield replaceFirstArgument(0);
		yield replaceSecondArgument(
			`Math.max(0, ${
				firstNumber === 0 ? secondArgumentText : firstArgumentText
			})`,
		);

		return;
	}

	// As values aren't Literal, we can not know whether secondArgument will become smaller than the first or not, causing an issue:
	//   .substring(0, 2) and .substring(2, 0) returns the same result
	//   .slice(0, 2) and .slice(2, 0) doesn't return the same result
	// There's also an issue with us now knowing whether the value will be negative or not, due to:
	//   .substring() treats a negative number the same as it treats a zero.
	// The latter issue could be solved by wrapping all dynamic numbers in Math.max(0, <value>), but the resulting code would not be nice

	return abort();
}

export default createRule<Options, MessageIds>({
	name: RULE_NAME,
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Prefer `String#slice()` over `String#substr()` and `String#substring()`.",
			requiresTypeChecking: true,
		},
		fixable: "code",
		schema: [],
		messages: {
			substr: "Prefer `String#slice()` over `String#substr()`.",
			substring: "Prefer `String#slice()` over `String#substring()`.",
		},
	},
	defaultOptions: [],
	create: (context) => {
		const services = ESLintUtils.getParserServices(context);

		return {
			CallExpression(node) {
				if (!isMethodCall(node, { methods: ["substr", "substring"] })) {
					return;
				}
				// TODO
				const method: MessageIds = (node.callee.property as any).name;

				context.report({
					node,
					messageId: method,
					fix: wrapFixFunction(function* fix(fixer, { abort }) {
						yield fixer.replaceText(node.callee.property, "slice");

						if (node.arguments.length === 0) {
							return;
						}

						if (
							node.arguments.length > 2 ||
							node.arguments.some((node) => node.type === "SpreadElement")
						) {
							return abort();
						}

						const fixArguments =
							method === "substr" ? fixSubstrArguments : fixSubstringArguments;
						yield* fixArguments({
							node,
							fixer,
							context,
							abort,
							services,
						});
					}),
				});
			},
		};
	},
});