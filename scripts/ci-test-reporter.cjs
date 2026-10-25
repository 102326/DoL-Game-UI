"use strict";
const path = require("node:path");
const receipt = require("./ci-process-receipt.cjs");
const { recordFailure, recordNodeCases } = receipt;
const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
async function* reporter(source) {
    let assertion, summary;
    const cases = [];
    const value = JSON.parse(process.env.MOODY_EXPECTED_NODE_CASES || '[]');
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))
        throw Error('Invalid expected node cases');
    const expected = value;
    for await (const event of source) {
        if ((event.type === 'test:pass' || event.type === 'test:fail') && event.data.file) {
            const error = event.type === 'test:fail' ? event.data.details.error : undefined;
            const id = path.basename(event.data.file) + '::' + event.data.name;
            cases.push({ id, status: event.data.skip || event.data.todo ? 'SKIP' : event.type === 'test:fail' ? 'FAIL' : 'PASS', milliseconds: event.data.details.duration_ms ?? null, assertions: null, assertionEvidence: 'native node:test outcome; individual assertion counts unavailable', path: 'node:test', ...(event.type === 'test:fail' ? { failureSignature: String(error?.message || 'native test failed').slice(0, 500) } : {}) });
        }
        if (event.type === 'test:fail') {
            const error = event.data.details.error.cause || event.data.details.error;
            if (record(error) && error.code === 'ERR_ASSERTION')
                assertion = error;
            recordFailure(assertion || error, { nodeTest: true });
        }
        if (event.type === 'test:summary')
            summary = event.data;
        const data = event.data;
        yield JSON.stringify({ type: event.type, name: data && 'name' in data ? data.name : undefined, counts: data && 'counts' in data ? data.counts : undefined, message: event.type === 'test:fail' ? event.data.details.error.message : undefined }) + '\n';
    }
    // Node emits per-file summaries before the aggregate summary; compare at EOF.
    const issues = [];
    if (!expected.length || cases.length !== expected.length || new Set(cases.map(c => c.id)).size !== cases.length || cases.some(c => !expected.includes(c.id)))
        issues.push('NodeCasePlanMismatch');
    if (!summary?.counts.tests || summary.counts.skipped || summary.counts.todo || summary.counts.cancelled || cases.some(c => c.status === 'SKIP'))
        issues.push('EmptyOrSkippedNodeTests');
    recordNodeCases(cases, issues);
    if (issues.length)
        process.exitCode = 1;
}
module.exports = reporter;
