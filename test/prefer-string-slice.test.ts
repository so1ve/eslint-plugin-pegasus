import dedent from "dedent";

import rule, { RULE_NAME } from "../src/rules/prefer-string-slice";
import { test, testSnapshot } from "../src/utils/testing";

const errorsSubstr = [
	{
		messageId: "substr" as const,
	},
];
const errorsSubstring = [
	{
		messageId: "substring" as const,
	},
];

test(RULE_NAME, rule, {
	valid: [
		"const substr = foo.substr",
		"const substring = foo.substring",

		"foo.slice()",
		"foo.slice(0)",
		"foo.slice(1, 2)",
		"foo?.slice(1, 2)",
		"foo?.slice?.(1, 2)",
		"foo?.bar.baz.slice(1, 2)",
		"foo.slice(-3, -2)",
	],

	invalid: [
		{
			code: "foo.substr()",
			output: "foo.slice()",
			errors: errorsSubstr,
		},
		{
			code: "foo?.substr()",
			output: "foo?.slice()",
			errors: errorsSubstr,
		},
		{
			code: "foo.bar?.substring()",
			output: "foo.bar?.slice()",
			errors: errorsSubstring,
		},
		{
			code: "foo?.[0]?.substring()",
			output: "foo?.[0]?.slice()",
			errors: errorsSubstring,
		},
		{
			code: "foo.bar.substr?.()",
			output: "foo.bar.slice?.()",
			errors: errorsSubstr,
		},
		{
			code: "foo.bar?.substring?.()",
			output: "foo.bar?.slice?.()",
			errors: errorsSubstring,
		},
		{
			code: "foo.bar?.baz?.substr()",
			output: "foo.bar?.baz?.slice()",
			errors: errorsSubstr,
		},
		{
			code: "foo.bar?.baz.substring()",
			output: "foo.bar?.baz.slice()",
			errors: errorsSubstring,
		},
		{
			code: "foo.bar.baz?.substr()",
			output: "foo.bar.baz?.slice()",
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr()',
			output: '"foo".slice()',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1)',
			output: '"foo".slice(1)',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1, 2)',
			output: '"foo".slice(1, 3)',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(bar.length, Math.min(baz, 100))',
			output: '"foo".slice(bar.length, bar.length + Math.min(baz, 100))',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1, length)',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1, "abc".length)',
			output: '"foo".slice(1, 1 + "abc".length)',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr("1", 2)',
			errors: errorsSubstr,
		},
		{
			code: dedent`
				const length = 123;
				"foo".substr(1, length)
			`,
			output: dedent`
				const length = 123;
				"foo".slice(1, 1 + length)
			`,
			errors: errorsSubstr,
		},
		{
			code: dedent`
				const length = 123;
				"foo".substr(0, length)
			`,
			output: dedent`
				const length = 123;
				"foo".slice(0, Math.max(0, length))
			`,
			errors: errorsSubstr,
		},
		{
			code: dedent`
				const length = 123;
				"foo".substr('0', length)
			`,
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(0, -1)',
			output: '"foo".slice(0, 0)',
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(0, "foo".length)',
			output: '"foo".slice(0, "foo".length)',
			errors: errorsSubstr,
		},
		{
			code: dedent`
				const length = 123;
				"foo".substr(1, length - 4)
			`,
			output: dedent`
				const length = 123;
				"foo".slice(1, 1 + length - 4)
			`,
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1, length)',
			errors: errorsSubstr,
		},
		{
			code: dedent`
				const uri = 'foo';
				((uri || '')).substr(1)
			`,
			output: dedent`
				const uri = 'foo';
				((uri || '')).slice(1)
			`,
			errors: errorsSubstr,
		},

		{
			code: "foo.substr(start)",
			output: "foo.slice(start)",
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1)',
			output: '"foo".slice(1)',
			errors: errorsSubstr,
		},
		{
			code: "foo.substr(start, length)",
			errors: errorsSubstr,
		},
		{
			code: '"foo".substr(1, 2)',
			output: '"foo".slice(1, 3)',
			errors: errorsSubstr,
		},
		// Extra arguments
		{
			code: "foo.substr(1, 2, 3)",
			errors: errorsSubstr,
		},
		// #700
		{
			code: '"Sample".substr(0, "Sample".lastIndexOf("/"))',
			output: '"Sample".slice(0, "Sample".lastIndexOf("/"))',
			errors: errorsSubstr,
		},

		{
			code: "foo.substring()",
			output: "foo.slice()",
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring()',
			output: '"foo".slice()',
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(1)',
			output: '"foo".slice(1)',
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(1, 2)',
			output: '"foo".slice(1, 2)',
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(2, 1)',
			output: '"foo".slice(1, 2)',
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(-1, -5)',
			output: '"foo".slice(0, 0)',
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(-1, 2)',
			output: '"foo".slice(0, 2)',
			errors: errorsSubstring,
		},
		{
			code: 'const length = 1; "foo".substring(length)',
			output: 'const length = 1; "foo".slice(Math.max(0, length))', // TODO
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring("fo".length)',
			output: '"foo".slice("fo".length)',
			errors: errorsSubstring,
		},
		{
			code: 'const length = 1; "foo".substring(length, 0)',
			output: 'const length = 1; "foo".slice(0, Math.max(0, length))',
			errors: errorsSubstring,
		},

		{
			code: "foo.substring(start)",
			output: "foo.slice(Math.max(0, start))",
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(1)',
			output: '"foo".slice(1)',
			errors: errorsSubstring,
		},
		{
			code: "foo.substring(start, end)",
			errors: errorsSubstring,
		},
		{
			code: '"foo".substring(1, 3)',
			output: '"foo".slice(1, 3)',
			errors: errorsSubstring,
		},
		// Extra arguments
		{
			code: "foo.substring(1, 2, 3)",
			errors: errorsSubstring,
		},
	],
});

describe("prefer-string-slice", () => {
	testSnapshot(RULE_NAME, rule, {
		invalid: [
			dedent`
			/* 1 */ (( /* 2 */ 0 /* 3 */, /* 4 */ foo /* 5 */ )) /* 6 */
				. /* 7 */ substring /* 8 */ (
					/* 9 */ (( /* 10 */ bar /* 11 */ )) /* 12 */,
					/* 13 */ (( /* 14 */ 0 /* 15 */ )) /* 16 */,
					/* 17 */
				)
			/* 18 */
		`,
			"foo.substr(0, ...bar)",
			"foo.substr(...bar)",
			"foo.substr(0, (100, 1))",
			"foo.substr(0, 1, extraArgument)",
			"foo.substr((0, bar.length), (0, baz.length))",
			// TODO: Fix this
			// 'foo.substr(await 1, await 2)',
			"foo.substring((10, 1), 0)",
			"foo.substring(0, (10, 1))",
			"foo.substring(0, await 1)",
			"foo.substring((10, bar))",
		],
	});
});
