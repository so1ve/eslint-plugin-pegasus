import type { TSESLint } from "@typescript-eslint/utils";

import preferTopLevelAwait from "./rules/prefer-array-flat-map";

export default {
	rules: {
		"prefer-top-level-await": preferTopLevelAwait,
	} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>, // Fixes "The inferred type of 'default' cannot be named without a reference to..."
};
