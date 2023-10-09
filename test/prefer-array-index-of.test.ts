import rule, { RULE_NAME } from "../src/rules/prefer-array-index-of";
import { testRuleSnapshot } from "../src/utils/testing";
import { createSimpleArraySearchRuleTestFixtures } from "./fixtures/prefer-array-index-of";

const indexOfOverFindIndexFixtures = createSimpleArraySearchRuleTestFixtures({
	method: "findIndex",
	replacement: "indexOf",
});

testRuleSnapshot(RULE_NAME, rule, indexOfOverFindIndexFixtures);

const lastIndexOfOverFindLastIndexFixtures =
	createSimpleArraySearchRuleTestFixtures({
		method: "findLastIndex",
		replacement: "lastIndexOf",
	});

testRuleSnapshot(RULE_NAME, rule, lastIndexOfOverFindLastIndexFixtures);
