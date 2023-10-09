import { TSESTree } from "@typescript-eslint/types";

type CallOrNewExpressionCheckOptions =
	| {
			name?: string;
			names?: string[];
			argumentsLength?: number;
			minimumArguments?: number;
			maximumArguments?: number;
			allowSpreadElement?: boolean;
			optional?: boolean;
	  }
	| string
	| string[];

function create(
	node: TSESTree.Node,
	options: CallOrNewExpressionCheckOptions,
	types: TSESTree.AST_NODE_TYPES[],
) {
	if (!types.includes(node?.type)) {
		return false;
	}

	if (typeof options === "string") {
		options = { names: [options] };
	}

	if (Array.isArray(options)) {
		options = { names: options };
	}

	let {
		name,
		names,
		argumentsLength,
		minimumArguments,
		maximumArguments,
		allowSpreadElement,
		optional,
	} = {
		minimumArguments: 0,
		maximumArguments: Number.POSITIVE_INFINITY,
		allowSpreadElement: false,
		...options,
	};

	if (name) {
		names = [name];
	}

	if (
		(optional === true && "optional" in node && node.optional !== optional) ||
		// `node.optional` can be `undefined` in some parsers
		(optional === false && "optional" in node && node.optional)
	) {
		return false;
	}

	if (
		typeof argumentsLength === "number" &&
		"arguments" in node &&
		node.arguments.length !== argumentsLength
	) {
		return false;
	}

	if (
		minimumArguments !== 0 &&
		"arguments" in node &&
		node.arguments.length < minimumArguments
	) {
		return false;
	}

	if (
		Number.isFinite(maximumArguments) &&
		"arguments" in node &&
		node.arguments.length > maximumArguments
	) {
		return false;
	}

	if (!allowSpreadElement) {
		const maximumArgumentsLength = Number.isFinite(maximumArguments)
			? maximumArguments
			: argumentsLength;
		if (
			typeof maximumArgumentsLength === "number" &&
			"arguments" in node &&
			node.arguments.some(
				(node, index) =>
					node.type === TSESTree.AST_NODE_TYPES.SpreadElement &&
					index < maximumArgumentsLength,
			)
		) {
			return false;
		}
	}

	if (
		Array.isArray(names) &&
		names.length > 0 &&
		"callee" in node &&
		(node.callee.type !== TSESTree.AST_NODE_TYPES.Identifier ||
			!names.includes(node.callee.name))
	) {
		return false;
	}

	return true;
}

export const isCallExpression = (
	node: TSESTree.Node,
	options: CallOrNewExpressionCheckOptions = {},
) => create(node, options, [TSESTree.AST_NODE_TYPES.CallExpression]);

export function isNewExpression(
	node: TSESTree.Node,
	options: CallOrNewExpressionCheckOptions = {},
) {
	if (
		typeof options === "object" &&
		!Array.isArray(options) &&
		typeof options?.optional === "boolean"
	) {
		throw new TypeError("Cannot check node.optional in `isNewExpression`.");
	}

	return create(node, options, [TSESTree.AST_NODE_TYPES.NewExpression]);
}

export const isCallOrNewExpression = (
	node: TSESTree.Node,
	options: CallOrNewExpressionCheckOptions = {},
) =>
	create(node, options, [
		TSESTree.AST_NODE_TYPES.CallExpression,
		TSESTree.AST_NODE_TYPES.NewExpression,
	]);
