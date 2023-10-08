import type { TSESTree } from "@typescript-eslint/types";

import { isCallExpression } from "./call-or-new-expression";
import { isMemberExpression } from "./is-member-expression";

export function isMethodCall(
	node: TSESTree.Node,
	options?:
		| {
				// `isCallExpression` options
				argumentsLength?: number;
				minimumArguments?: number;
				maximumArguments?: number;
				optionalCall?: boolean;
				allowSpreadElement?: boolean;

				// `isMemberExpression` options
				method?: string;
				methods?: string[];
				object?: string;
				objects?: string[];
				optionalMember?: boolean;
				computed?: boolean;
		  }
		| string
		| string[],
) {
	if (typeof options === "string") {
		options = { methods: [options] };
	}

	if (Array.isArray(options)) {
		options = { methods: options };
	}

	const {
		optionalCall,
		optionalMember,
		method,
		methods,
		object,
		objects,
		computed,
		argumentsLength,
		minimumArguments,
		maximumArguments,
		allowSpreadElement,
	} = {
		method: "",
		methods: [],
		...options,
	};

	return (
		isCallExpression(node, {
			argumentsLength,
			minimumArguments,
			maximumArguments,
			allowSpreadElement,
			optional: optionalCall,
		}) &&
		"callee" in node &&
		isMemberExpression(node.callee, {
			object,
			objects,
			computed,
			property: method,
			properties: methods,
			optional: optionalMember,
		})
	);
}
