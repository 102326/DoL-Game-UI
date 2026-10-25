"use strict";
// Terminal failure receipts: caught diagnostic errors and stderr text are not proof.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const Module = require("node:module");
const caseRuntime = require("./ci-cases.cjs");
const renderer = require('./ci/renderer.ts');
const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
function moduleLoader(value) { return (typeof value === 'function' || record(value)) && '_load' in value && typeof value._load === 'function'; }
function chromium(value) { return record(value) && typeof value.launch === 'function'; }
// _load is a Node-private API; its real preload/receipt path is checked on Node 26.
if (!moduleLoader(Module))
    throw Error('Node module loader unavailable');
const load = Module._load, proxies = new WeakMap();
let assertions = 0;
caseRuntime.setAssertionCounter(() => assertions);
function counted(target) {
    const existing = proxies.get(target);
    if (existing)
        return existing;
    const proxy = new Proxy(target, {
        apply(fn, receiver, args) { assertions++; return Reflect.apply(fn, receiver, args); },
        get(fn, key) { const value = Reflect.get(fn, key); return typeof value === 'function' && !['AssertionError', 'CallTracker'].includes(String(key)) ? counted(value) : value; }
    });
    proxies.set(target, proxy);
    return proxy;
}
Module._load = function (request, parent, isMain) {
    const value = load.call(this, request, parent, isMain);
    if (request === 'playwright' && process.env.MOODY_EXECUTION_ID) {
        if (!record(value) || !chromium(value.chromium))
            throw Error('Playwright Chromium unavailable');
        renderer.instrumentChromium(value.chromium);
    }
    return ['assert', 'node:assert', 'assert/strict', 'node:assert/strict'].includes(request) && typeof value === 'function' ? counted(value) : value;
};
function recordFailure(error, { nodeTest = false } = {}) {
    const file = process.env.MOODY_PROCESS_RECEIPT ? process.env.MOODY_PROCESS_RECEIPT + '.' + process.pid + '.json' : null, executionId = process.env.MOODY_EXECUTION_ID;
    if (!file || !executionId)
        return;
    const detail = record(error) ? error : undefined;
    const assertion = error instanceof assert.AssertionError || (nodeTest && detail?.code === 'ERR_ASSERTION' && detail?.name === 'AssertionError');
    try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify({ schema: 1, executionId, pid: process.pid, terminal: true, kind: assertion ? 'assertion' : 'infrastructure', source: nodeTest ? 'node:test' : 'terminal', code: detail?.code || null, name: detail?.name || null, message: String(detail?.message || error).slice(0, 2000) }));
    }
    catch { }
}
function terminalFailure(error) { recordFailure(error); console.error(error); }
process.on('uncaughtExceptionMonitor', error => recordFailure(error));
process.on('beforeExit', () => {
    const file = process.env.MOODY_PROCESS_RECEIPT ? process.env.MOODY_PROCESS_RECEIPT + '.' + process.pid + '.json' : null, executionId = process.env.MOODY_EXECUTION_ID;
    if (!file || !executionId)
        return;
    try {
        let report = { schema: 1, executionId };
        if (fs.existsSync(file)) {
            const prior = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (record(prior) && prior.executionId === executionId && prior.pid === process.pid)
                report = prior;
        }
        const terminal = report.terminal ? { kind: typeof report.kind === 'string' ? report.kind : undefined, message: typeof report.message === 'string' ? report.message : undefined } : undefined;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify({ ...report, pid: process.pid, naturalCompletion: true, assertions, ...caseRuntime.finishCases(terminal), graphics: renderer.graphicsSnapshot() }));
    }
    catch { }
});
function recordNodeCases(nodeTests, nodeCaseIssues) {
    const executionId = process.env.MOODY_EXECUTION_ID, base = process.env.MOODY_PROCESS_RECEIPT;
    if (!base || !executionId)
        return;
    const file = base + '.' + process.pid + '.json';
    try {
        let report = { schema: 1, executionId, pid: process.pid };
        if (fs.existsSync(file)) {
            const prior = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (!record(prior))
                throw Error('Invalid process receipt');
            report = prior;
        }
        fs.writeFileSync(file, JSON.stringify({ ...report, nodeTests, nodeCaseIssues }));
    }
    catch { }
}
module.exports = { recordFailure, terminalFailure, recordNodeCases };
