// working around https://github.com/microsoft/TypeScript/issues/17002
export const isReadonlyArray = (arg: unknown): arg is readonly unknown[] =>
	Array.isArray(arg);
