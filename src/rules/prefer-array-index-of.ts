import { createRule } from "../utils";
import { wrapCreateFunction } from "../utils/common";
import { simpleArraySearchRule } from "../utils/shared";

export const RULE_NAME = "prefer-array-index-of";
export type MessageIds = string;
export type Options = [];

const indexOfOverFindIndexRule = simpleArraySearchRule({
	method: "findIndex",
	replacement: "indexOf",
});
const lastIndexOfOverFindLastIndexRule = simpleArraySearchRule({
	method: "findLastIndex",
	replacement: "lastIndexOf",
});

export default createRule<Options, MessageIds>({
	name: RULE_NAME,
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Prefer `Array#{indexOf,lastIndexOf}()` over `Array#{findIndex,findLastIndex}()` when looking for the index of an item.",
			requiresTypeChecking: true,
		},
		fixable: "code",
		schema: [],
		messages: {
			...indexOfOverFindIndexRule.messages,
			...lastIndexOfOverFindLastIndexRule.messages,
		},
		hasSuggestions: true,
	},
	defaultOptions: [],
	create: wrapCreateFunction((context) => {
		indexOfOverFindIndexRule.listen(context);
		lastIndexOfOverFindLastIndexRule.listen(context);
	}),
});
