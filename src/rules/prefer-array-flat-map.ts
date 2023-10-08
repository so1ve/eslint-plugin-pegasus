import { ESLintUtils } from "@typescript-eslint/utils";

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
		const services = ESLintUtils.getParserServices(context);

		return {
			CallExpression(callExpression) {
				if (
					!(
						isMethodCall(callExpression, {
							method: "flat",
							optionalCall: false,
							optionalMember: false,
						}) &&
						(callExpression.arguments.length === 0 ||
							(callExpression.arguments.length === 1 &&
								callExpression.arguments[0].type === "Literal" &&
								callExpression.arguments[0].raw === "1")) &&
						isMethodCall(callExpression.callee.object, {
							method: "map",
							optionalCall: false,
							optionalMember: false,
						})
					)
				) {
					return;
				}

				const flatCallExpression = callExpression;
				const mapCallExpression = flatCallExpression.callee.object;
				const { sourceCode } = context;
				const mapProperty = mapCallExpression.callee.property;

				return {
					node: flatCallExpression,
					loc: {
						start: mapProperty.loc.start,
						end: flatCallExpression.loc.end,
					},
					messageId: MESSAGE_ID,
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
				};
			},
		};
	},
});
