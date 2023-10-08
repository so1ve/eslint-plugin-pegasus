import dedent from "dedent";
import { expect } from "vitest";

import rule, { RULE_NAME } from "../src/rules/prefer-array-flat-map";
import { getRuleTester } from "../src/utils/testing";

const valid = [
	"const bar = [1,2,3].map()",
	"const bar = [1,2,3].map(i => i)",
	"const bar = [1,2,3].map((i) => i)",
	"const bar = [1,2,3].map((i) => { return i; })",
	"const bar = foo.map(i => i)",
	"const bar = [[1],[2],[3]].flat()",
	"const bar = [1,2,3].map(i => [i]).sort().flat()",
	dedent`
			let bar = [1,2,3].map(i => [i]);
			bar = bar.flat();
		`,
	"const bar = [[1],[2],[3]].map(i => [i]).flat(2)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(1, null)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(Infinity)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(Number.POSITIVE_INFINITY)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(Number.MAX_VALUE)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(Number.MAX_SAFE_INTEGER)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(...[1])",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(0.4 +.6)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(+1)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(foo)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(foo.bar)",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(1.00)",
	"const bar = { map: () => {} }.map(i => [i]).flat()", // not an array
];

const invalid = [
	"const bar = [[1],[2],[3]].map(i => [i]).flat()",
	"const bar = [[1],[2],[3]].map(i => [i]).flat(1,)",
	"const bar = [1,2,3].map(i => [i]).flat()",
	"const bar = [1,2,3].map((i) => [i]).flat()",
	"const bar = [1,2,3].map((i) => { return [i]; }).flat()",
	"const bar = [1,2,3].map(foo).flat()",
	"const bar = [1,2,3].map(i => i).map(i => [i]).flat()",
	"const bar = [1,2,3].sort().map(i => [i]).flat()",
	"const bar = (([1,2,3].map(i => [i]))).flat()",
	dedent`
		let bar = [1,2,3].map(i => {
			return [i];
		}).flat();
	`,
	dedent`
		let bar = [1,2,3].map(i => {
			return [i];
		})
		.flat();
	`,
	dedent`
		let bar = [1,2,3].map(i => {
			return [i];
		}) // comment
		.flat();
	`,
	dedent`
		let bar = [1,2,3].map(i => {
			return [i];
		}) // comment
		.flat(); // other
	`,
	dedent`
		let bar = [1,2,3]
			.map(i => { return [i]; })
			.flat();
	`,
	dedent`
		let bar = [1,2,3].map(i => { return [i]; })
			.flat();
	`,
	"let bar = [1,2,3] . map( x => y ) . flat () // 🤪",
	"const bar = [1,2,3].map(i => [i]).flat(1);",
];

const ruleTester = getRuleTester();

ruleTester.run(RULE_NAME, rule, {
	valid,
	invalid: invalid.map((i) => ({
		code: i,
		errors: null,
		onOutput: (output: string) => {
			expect(output).toMatchSnapshot();
		},
	})),
});
