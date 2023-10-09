import type { TSESLint } from "@typescript-eslint/utils";

import preferArrayFlatMap from "./rules/prefer-array-flat-map";

export default {
	rules: {
		"prefer-array-flat-map": preferArrayFlatMap,
	} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>, // Fixes "The inferred type of 'default' cannot be named without a reference to..."
};
