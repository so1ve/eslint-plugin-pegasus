import type { TSESLint } from "@typescript-eslint/utils";

const isIterable = (object: any): object is Iterable<any> =>
	typeof object?.[Symbol.iterator] === "function";

class FixAbortError extends Error {}
const fixOptions = {
	abort() {
		throw new FixAbortError("Fix aborted.");
	},
};

export type AbortFunction = () => void;

type WrappedFixFunction = (
	fixer: TSESLint.RuleFixer,
	additional: { abort: AbortFunction },
) =>
	| IterableIterator<TSESLint.RuleFix>
	| TSESLint.RuleFix
	| readonly TSESLint.RuleFix[]
	| null;

export const wrapFixFunction =
	(fix: WrappedFixFunction): TSESLint.ReportFixFunction =>
	(fixer) => {
		const result = fix(fixer, fixOptions);

		if (isIterable(result)) {
			try {
				return [...result];
			} catch (error) {
				if (error instanceof FixAbortError) {
					return [];
				}

				throw error;
			}
		}

		return result;
	};
