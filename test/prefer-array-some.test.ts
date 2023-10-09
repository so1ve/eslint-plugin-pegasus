import dedent from "dedent";

import type { MessageIds, Options } from "../src/rules/prefer-array-some";
import rule, { RULE_NAME } from "../src/rules/prefer-array-some";
import { testRule, testRuleSnapshot } from "../src/utils/testing";
import type { InvalidTestCase } from "../vendor/rule-tester/src";

const invalidCase = ({
	code,
	suggestionOutput,
	method,
}: {
	code: string;
	suggestionOutput: string;
	method: string;
}): InvalidTestCase<MessageIds, Options> => ({
	code,
	errors: [
		{
			messageId: "some",
			data: { method },
			suggestions: [
				{
					messageId: "someSuggestion",
					data: { method },
					output: suggestionOutput,
				},
			],
		},
	],
});

describe("prefer-array-some", () => {
	testRule(RULE_NAME, rule, {
		valid: [
			// Not `boolean`
			"const bar = foo.find(fn)",
			"const bar = foo.find(fn) || baz",
			"if (foo.find(fn) ?? bar) {}",

			// Not matched `CallExpression`
			...[
				// Not `CallExpression`
				"new foo.find(fn)",
				// Not `MemberExpression`
				"find(fn)",
				// `callee.property` is not a `Identifier`
				'foo["find"](fn)',
				'foo["fi" + "nd"](fn)',
				"foo[`find`](fn)",
				// Computed
				"foo[find](fn)",
				// Not `.find`
				"foo.notFind(fn)",
				// More or less argument(s)
				"foo.find()",
				"foo.find(fn, thisArgument, extraArgument)",
				"foo.find(...argumentsArray)",
			].flatMap((code) => [
				`if (${code}) {}`,
				`if (${code.replace("find", "findLast")}) {}`,
			]),
		],
		invalid: [
			...[
				"const bar = !foo.find(fn)",
				"const bar = Boolean(foo.find(fn))",
				"if (foo.find(fn)) {}",
				"const bar = foo.find(fn) ? 1 : 2",
				"while (foo.find(fn)) foo.shift();",
				"do {foo.shift();} while (foo.find(fn));",
				"for (; foo.find(fn); ) foo.shift();",
			].flatMap((code) => {
				code = `const foo = [];${code}`;

				return [
					invalidCase({
						code,
						suggestionOutput: code.replace("find", "some"),
						method: "find",
					}),
					invalidCase({
						code: code.replace("find", "findLast"),
						suggestionOutput: code.replace("find", "some"),
						method: "findLast",
					}),
				];
			}),
			// Comments
			invalidCase({
				code: "const foo = []; console.log(foo /* comment 1 */ . /* comment 2 */ find /* comment 3 */ (fn) ? a : b)",
				suggestionOutput:
					"const foo = []; console.log(foo /* comment 1 */ . /* comment 2 */ some /* comment 3 */ (fn) ? a : b)",
				method: "find",
			}),
		],
	});

	testRuleSnapshot(RULE_NAME, rule, {
		valid: [],
		invalid: [
			'const array = []; if (array.find(element => element === "🦄")) {}',
			'const array = []; const foo = array.find(element => element === "🦄") ? bar : baz;',
		],
	});

	// - `.filter(…).length > 0`
	// - `.filter(…).length !== 0`
	testRuleSnapshot(RULE_NAME, rule, {
		valid: [
			// `> 0`
			"array.filter(fn).length > 0.",
			"array.filter(fn).length > .0",
			"array.filter(fn).length > 0.0",
			"array.filter(fn).length > 0x00",
			"array.filter(fn).length < 0",
			"array.filter(fn).length >= 0",
			"0 > array.filter(fn).length",

			// `!== 0`
			"array.filter(fn).length !== 0.",
			"array.filter(fn).length !== .0",
			"array.filter(fn).length !== 0.0",
			"array.filter(fn).length !== 0x00",
			"array.filter(fn).length != 0",
			"array.filter(fn).length === 0",
			"array.filter(fn).length == 0",
			"array.filter(fn).length = 0",
			"0 !== array.filter(fn).length",

			// `>= 1`
			"array.filter(fn).length >= 1",
			"array.filter(fn).length >= 1.",
			"array.filter(fn).length >= 1.0",
			"array.filter(fn).length >= 0x1",
			"array.filter(fn).length > 1",
			"array.filter(fn).length < 1",
			"array.filter(fn).length = 1",
			"array.filter(fn).length += 1",
			"1 >= array.filter(fn).length",

			// `.length`
			"array.filter(fn)?.length > 0",
			"array.filter(fn)[length] > 0",
			"array.filter(fn).notLength > 0",
			"array.filter(fn).length() > 0",
			"+array.filter(fn).length >= 1",

			// `.filter`
			"array.filter?.(fn).length > 0",
			"array?.filter(fn).length > 0",
			"array.notFilter(fn).length > 0",
			"array.filter.length > 0",

			// `jQuery#filter`
			'$element.filter(":visible").length > 0',
		],
		invalid: [
			"array.filter(fn).length > 0",
			"array.filter(fn).length !== 0",
			dedent`
			if (
				((
					((
						((
							((
								array
							))
								.filter(what_ever_here)
						))
							.length
					))
					>
					(( 0 ))
				))
			);
		`,
		],
	});

	// Compare with `undefined`
	testRuleSnapshot(RULE_NAME, rule, {
		valid: [
			"foo.find(fn) == 0",
			'foo.find(fn) != ""',
			"foo.find(fn) === null",
			'foo.find(fn) !== "null"',
			"foo.find(fn) >= undefined",
			"foo.find(fn) instanceof undefined",
			// We are not checking this right now
			'typeof foo.find(fn) === "undefined"',
		],
		invalid: [
			"foo.find(fn) == null",
			"foo.find(fn) == undefined",
			"foo.find(fn) === undefined",
			"foo.find(fn) != null",
			"foo.find(fn) != undefined",
			"foo.find(fn) !== undefined",
			'a = (( ((foo.find(fn))) == ((null)) )) ? "no" : "yes";',
		].map((code) => `const foo = []; ${code}`),
	});
});
