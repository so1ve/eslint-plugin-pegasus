import { getStaticValue } from "@eslint-community/eslint-utils";
import { TSESTree } from "@typescript-eslint/types";
import type { TSESLint } from "@typescript-eslint/utils";

import { isNumberLiteral } from "../ast";

export const isStaticProperties = (
	node: TSESTree.Node,
	object: string,
	properties: Set<string>,
) =>
	node.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
	!node.computed &&
	!node.optional &&
	node.object.type === TSESTree.AST_NODE_TYPES.Identifier &&
	node.object.name === object &&
	node.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
	properties.has(node.property.name);
export const isFunctionCall = (node: TSESTree.Node, functionName: string) =>
	node.type === TSESTree.AST_NODE_TYPES.CallExpression &&
	!node.optional &&
	node.callee.type === TSESTree.AST_NODE_TYPES.Identifier &&
	node.callee.name === functionName;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math#static_properties
const mathProperties = new Set([
	"E",
	"LN2",
	"LN10",
	"LOG2E",
	"LOG10E",
	"PI",
	"SQRT1_2",
	"SQRT2",
]);

// `Math.{E,LN2,LN10,LOG2E,LOG10E,PI,SQRT1_2,SQRT2}`
export const isMathProperty = (node: TSESTree.Node) =>
	isStaticProperties(node, "Math", mathProperties);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math#static_methods
const mathMethods = new Set([
	"abs",
	"acos",
	"acosh",
	"asin",
	"asinh",
	"atan",
	"atanh",
	"atan2",
	"cbrt",
	"ceil",
	"clz32",
	"cos",
	"cosh",
	"exp",
	"expm1",
	"floor",
	"fround",
	"hypot",
	"imul",
	"log",
	"log1p",
	"log10",
	"log2",
	"max",
	"min",
	"pow",
	"random",
	"round",
	"sign",
	"sin",
	"sinh",
	"sqrt",
	"tan",
	"tanh",
	"trunc",
]);
// `Math.{abs, …, trunc}(…)`
export const isMathMethodCall = (node: TSESTree.Node) =>
	node.type === TSESTree.AST_NODE_TYPES.CallExpression &&
	!node.optional &&
	isStaticProperties(node.callee, "Math", mathMethods);

// `Number(…)`
export const isNumberCall = (node: TSESTree.Node) =>
	isFunctionCall(node, "Number");

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#static_properties
const numberProperties = new Set([
	"EPSILON",
	"MAX_SAFE_INTEGER",
	"MAX_VALUE",
	"MIN_SAFE_INTEGER",
	"MIN_VALUE",
	"NaN",
	"NEGATIVE_INFINITY",
	"POSITIVE_INFINITY",
]);
export const isNumberProperty = (node: TSESTree.Node) =>
	isStaticProperties(node, "Number", numberProperties);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#static_methods
const numberMethods = new Set(["parseFloat", "parseInt"]);
export const isNumberMethodCall = (node: TSESTree.Node) =>
	node.type === TSESTree.AST_NODE_TYPES.CallExpression &&
	!node.optional &&
	isStaticProperties(node.callee, "Number", numberMethods);
export const isGlobalParseToNumberFunctionCall = (node: TSESTree.Node) =>
	isFunctionCall(node, "parseInt") || isFunctionCall(node, "parseFloat");

export const isStaticNumber = (
	node: TSESTree.Node,
	scope: TSESLint.Scope.Scope,
) => typeof getStaticValue(node, scope)?.value === "number";

export const isLengthProperty = (node: TSESTree.Node) =>
	node.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
	!node.computed &&
	!node.optional &&
	node.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
	node.property.name === "length";

// `+` and `>>>` operators are handled separately
const mathOperators = new Set([
	"-",
	"*",
	"/",
	"%",
	"**",
	"<<",
	">>",
	"|",
	"^",
	"&",
]);
export function isNumber(node: TSESTree.Node, scope: TSESLint.Scope.Scope) {
	if (
		isNumberLiteral(node) ||
		isMathProperty(node) ||
		isMathMethodCall(node) ||
		isNumberCall(node) ||
		isNumberProperty(node) ||
		isNumberMethodCall(node) ||
		isGlobalParseToNumberFunctionCall(node) ||
		isLengthProperty(node)
	) {
		return true;
	}

	switch (node.type) {
		case TSESTree.AST_NODE_TYPES.AssignmentExpression: {
			const { operator } = node;
			if (operator === "=" && isNumber(node.right, scope)) {
				return true;
			}

			// Fall through
		}

		case TSESTree.AST_NODE_TYPES.BinaryExpression: {
			let { operator } = node;

			if (node.type === TSESTree.AST_NODE_TYPES.AssignmentExpression) {
				operator = operator.slice(0, -1) as any;
			}

			if (
				operator === "+" &&
				isNumber(node.left, scope) &&
				isNumber(node.right, scope)
			) {
				return true;
			}

			// `>>>` (zero-fill right shift) can't use on `BigInt`
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#operators
			if (operator === ">>>") {
				return true;
			}

			// `a * b` can be `BigInt`, we need make sure at least one side is number
			if (
				mathOperators.has(operator) &&
				(isNumber(node.left, scope) || isNumber(node.right, scope))
			) {
				return true;
			}

			break;
		}

		case TSESTree.AST_NODE_TYPES.UnaryExpression: {
			const { operator } = node;

			// `+` can't use on `BigInt`
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#operators
			if (operator === "+") {
				return true;
			}

			if (
				(operator === "-" || operator === "~") &&
				isNumber(node.argument, scope)
			) {
				return true;
			}

			break;
		}

		case TSESTree.AST_NODE_TYPES.UpdateExpression: {
			if (isNumber(node.argument, scope)) {
				return true;
			}

			break;
		}

		case TSESTree.AST_NODE_TYPES.ConditionalExpression: {
			const isConsequentNumber = isNumber(node.consequent, scope);
			const isAlternateNumber = isNumber(node.alternate, scope);

			if (isConsequentNumber && isAlternateNumber) {
				return true;
			}

			const testStaticValueResult = getStaticValue(node.test, scope);
			if (
				testStaticValueResult !== null &&
				((testStaticValueResult.value && isConsequentNumber) ||
					(!testStaticValueResult.value && isAlternateNumber))
			) {
				return true;
			}

			break;
		}

		case TSESTree.AST_NODE_TYPES.SequenceExpression: {
			if (isNumber(node.expressions.at(-1)!, scope)) {
				return true;
			}

			break;
		}
		// No default
	}

	return isStaticNumber(node, scope);
}
