import { resolve } from "node:path";

import type { TSESLint } from "@typescript-eslint/utils";
import { expect } from "vitest";

import { RuleTester } from "../../vendor/rule-tester/src/RuleTester";

const fixturesDir = resolve(process.cwd(), "test", "fixtures");

export function getRuleTester() {
	const ruleTester = new RuleTester({
		parser: require.resolve("@typescript-eslint/parser"),
		parserOptions: {
			ecmaVersion: 2018,
			tsconfigRootDir: fixturesDir,
			project: "./tsconfig.json",
		},
	});

	return ruleTester;
}

export function test<
	MessageIds extends string,
	Options extends readonly unknown[] = [],
	RuleListener extends TSESLint.RuleListener = TSESLint.RuleListener,
>(
	ruleName: string,
	rule: TSESLint.RuleModule<MessageIds, Options, RuleListener>,
	{
		valid,
		invalid,
	}: {
		valid: string[];
		invalid: TSESLint.InvalidTestCase<MessageIds, Options>[];
	},
) {
	const ruleTester = getRuleTester();

	ruleTester.run(ruleName, rule, {
		valid,
		invalid,
	});
}

export function testSnapshot<
	MessageIds extends string,
	Options extends readonly unknown[] = [],
	RuleListener extends TSESLint.RuleListener = TSESLint.RuleListener,
>(
	ruleName: string,
	rule: TSESLint.RuleModule<MessageIds, Options, RuleListener>,
	{
		valid = [],
		invalid = [],
	}: {
		valid?: string[];
		invalid?: string[];
	},
) {
	const ruleTester = getRuleTester();

	ruleTester.run(ruleName, rule, {
		valid,
		invalid: invalid.map((i) => ({
			code: i,
			errors: null,
			onOutput: (output: string) => {
				expect(output).toMatchSnapshot();
			},
		})),
	});
}
