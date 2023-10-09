import type { TSESLint } from "@typescript-eslint/utils";
import type { RuleCreateFunction } from "@typescript-eslint/utils/ts-eslint";

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

type Listener = (node: any) => void;
type EnhanceContext<CreateFunction extends RuleCreateFunction> =
	Parameters<CreateFunction>[0] & {
		on: (selectorOrSelectors: string | string[], listener: Listener) => void;
		onExit: (
			selectorOrSelectors: string | string[],
			listener: Listener,
		) => void;
	};
export type EnhancedAnyContext = EnhanceContext<RuleCreateFunction>;
type EnhanceCreateFunction<CreateFunction extends RuleCreateFunction> = (
	context: EnhanceContext<CreateFunction>,
) => ReturnType<CreateFunction> | void;
export function wrapCreateFunction<
	Options extends readonly unknown[],
	MessageIds extends string,
	CreateFunction extends RuleCreateFunction<MessageIds>,
>(
	create: EnhanceCreateFunction<CreateFunction>,
): RuleCreateFunction<MessageIds, Options> {
	const wrapped: RuleCreateFunction<MessageIds, Options> = (context) => {
		const listeners: Record<string, (Listener | undefined)[]> = {};
		function addListener(selector: string, listener: Listener | undefined) {
			listeners[selector] ??= [];
			listeners[selector].push(listener);
		}

		const contextProxy: EnhanceContext<CreateFunction> = new Proxy(context, {
			get(target, property, receiver) {
				if (property === "on") {
					return (
						selectorOrSelectors: string | string[],
						listener: Listener,
					) => {
						const selectors = Array.isArray(selectorOrSelectors)
							? selectorOrSelectors
							: [selectorOrSelectors];
						for (const selector of selectors) {
							addListener(selector, listener);
						}
					};
				}

				if (property === "onExit") {
					return (
						selectorOrSelectors: string | string[],
						listener: Listener,
					) => {
						const selectors = Array.isArray(selectorOrSelectors)
							? selectorOrSelectors
							: [selectorOrSelectors];
						for (const selector of selectors) {
							addListener(`${selector}:exit`, listener);
						}
					};
				}

				return Reflect.get(target, property, receiver);
			},
		}) as any;

		for (const [selector, listener] of Object.entries(
			create(contextProxy) ?? {},
		)) {
			addListener(selector, listener as any);
		}

		return Object.fromEntries(
			Object.entries(listeners).map(([selector, listeners]) => [
				selector,
				// Listener arguments can be `codePath, node` or `node`
				(...listenerArguments) => {
					for (const listener of listeners) {
						listener?.(...listenerArguments);
					}
				},
			]),
		);
	};

	return wrapped;
}
