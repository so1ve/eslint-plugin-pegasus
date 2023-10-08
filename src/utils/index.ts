import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
	(ruleName) =>
		`https://github.com/so1ve/eslint-plugin-pegasus/blob/main/docs/rules/${ruleName}.md`,
);
