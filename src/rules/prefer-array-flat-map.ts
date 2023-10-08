import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../utils";
import { isMethodCall } from "../utils/ast";
import { removeMethodCall } from "../utils/fix";

export const RULE_NAME = "prefer-array-flat-map";
export type MessageIds = "preferArrayFlatMap";
export type Options = [];

export default createRule<Options, MessageIds>({
	name: RULE_NAME,
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer `.flatMap(…)` over `.map(…).flat()`.",
		},
		fixable: "code",
		schema: [],
		messages: {
			preferArrayFlatMap: "Prefer `.flatMap(…)` over `.map(…).flat()`.",
		},
	},
	defaultOptions: [],
	create: (context) => {
		// const services = ESLintUtils.getParserServices(context);

		return {
			CallExpression(node) {
				if (
					!(
						isMethodCall(node, {
							method: "flat",
							optionalCall: false,
							optionalMember: false,
						}) &&
						(node.arguments.length === 0 ||
							(node.arguments.length === 1 &&
								node.arguments[0].type === "Literal" &&
								node.arguments[0].raw === "1")) &&
						isMethodCall(node.callee.object, {
							method: "map",
							optionalCall: false,
							optionalMember: false,
						})
					)
				) {
					return;
				}

				const flatCallExpression = node;
				if (
					flatCallExpression.callee.type !== AST_NODE_TYPES.MemberExpression
				) {
					return;
				}
				const mapCallExpression = flatCallExpression.callee.object;
				if (
					mapCallExpression.type !== AST_NODE_TYPES.CallExpression ||
					mapCallExpression.callee.type !== AST_NODE_TYPES.MemberExpression
				) {
					return;
				}
				const { sourceCode } = context;
				const mapProperty = mapCallExpression.callee.property;

				context.report({
					node: flatCallExpression,
					loc: {
						start: mapProperty.loc.start,
						end: flatCallExpression.loc.end,
					},
					messageId: "preferArrayFlatMap",
					*fix(fixer) {
						// Removes:
						//   map(…).flat();
						//         ^^^^^^^
						//   (map(…)).flat();
						//           ^^^^^^^
						yield* removeMethodCall(fixer, flatCallExpression, sourceCode);

						// Renames:
						//   map(…).flat();
						//   ^^^
						//   (map(…)).flat();
						//    ^^^
						yield fixer.replaceText(mapProperty, "flatMap");
					},
				});
			},
		};
	},
});
