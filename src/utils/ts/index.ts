import typeutils from "@typescript-eslint/type-utils";
import type {
	ParserServicesWithTypeInformation,
	TSESTree,
} from "@typescript-eslint/typescript-estree";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

export class TypeHelper {
	typeChecker: ts.TypeChecker;

	constructor(public services: ParserServicesWithTypeInformation) {
		this.typeChecker = services.program.getTypeChecker();
	}

	private getType(node: TSESTree.Node) {
		return typeutils.getConstrainedTypeAtLocation(this.services, node);
	}

	isTypeArrayTypeOrUnionOfArrayTypes(node: TSESTree.Node) {
		const nodeType = this.getType(node);

		return typeutils.isTypeArrayTypeOrUnionOfArrayTypes(
			nodeType,
			this.typeChecker,
		);
	}

	isNumber(node: TSESTree.Node) {
		const nodeType = this.getType(node);

		return tsutils.isTypeFlagSet(nodeType, ts.TypeFlags.Number);
	}

	isAny(node: TSESTree.Node) {
		const nodeType = this.getType(node);

		return typeutils.isTypeAnyType(nodeType);
	}
}
