import type { TSESLint } from "@typescript-eslint/utils";

import preferTopLevelAwait from "./rules/prefer-array-flat-map";
import preferStringSlice from "./rules/prefer-string-slice";

export default {
	rules: {
		"prefer-top-level-await": preferTopLevelAwait,
		"prefer-string-slice": preferStringSlice,
	} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>, // Fixes "The inferred type of 'default' cannot be named without a reference to..."
};
