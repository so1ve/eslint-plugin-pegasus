import type { TSESTree } from "@typescript-eslint/types";

export function isMemberExpression(
	node: TSESTree.Node,
	options?:
		| {
				property?: string;
				properties?: string[];
				object?: string;
				objects?: string[];
				optional?: boolean;
				computed?: boolean;
		  }
		| string
		| string[],
) {
	if (node?.type !== "MemberExpression") {
		return false;
	}

	if (typeof options === "string") {
		options = { properties: [options] };
	}

	if (Array.isArray(options)) {
		options = { properties: options };
	}

	let { property, properties, object, objects, optional, computed } = {
		property: "",
		properties: [],
		object: "",
		...options,
	};

	if (property) {
		properties = [property];
	}

	if (object) {
		objects = [object];
	}

	if (
		(optional === true && node.optional !== optional) ||
		// `node.optional` can be `undefined` in some parsers
		(optional === false && node.optional)
	) {
		return false;
	}

	if (Array.isArray(properties) && properties.length > 0) {
		if (
			node.property.type !== "Identifier" ||
			!properties.includes(node.property.name)
		) {
			return false;
		}

		computed ??= false;
	}

	if (
		(computed === true && node.computed !== computed) ||
		// `node.computed` can be `undefined` in some parsers
		(computed === false && node.computed)
	) {
		return false;
	}

	if (
		Array.isArray(objects) &&
		objects.length > 0 &&
		(node.object.type !== "Identifier" || !objects.includes(node.object.name))
	) {
		return false;
	}

	return true;
}
