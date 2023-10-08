import { resolve } from "node:path";

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
