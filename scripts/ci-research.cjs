"use strict";
// Edit CTS; generated CJS is retained for npm-free evidence verification.
const catalog = require("./ci-catalog.cjs");
const reports = require("./ci/research-reports.ts");
const runner = require("./ci/research-runner.ts");
const summary = require("./ci/research-summary.ts");
const upload = require("./ci/research-upload.ts");
const files = require("./ci/research-files.ts");
const { researchPlan: plan } = catalog;
const { caseIds, recordReport } = reports;
const { runResearch } = runner;
const { researchSummary } = summary;
const { researchUpload } = upload;
const { reportsFor, stamp } = files;
module.exports = { plan, caseIds, recordReport, runResearch, researchSummary, researchUpload, reportsFor, stamp };
