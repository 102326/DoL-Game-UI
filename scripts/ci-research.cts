// Edit CTS; generated CJS is retained for npm-free evidence verification.
import catalog = require('./ci-catalog.cjs');
import reports = require('./ci/research-reports.ts');
import runner = require('./ci/research-runner.ts');
import summary = require('./ci/research-summary.ts');
import upload = require('./ci/research-upload.ts');
import files = require('./ci/research-files.ts');
const {researchPlan:plan}=catalog;
const {caseIds,recordReport}=reports;
const {runResearch}=runner;
const {researchSummary}=summary;
const {researchUpload}=upload;
const {reportsFor,stamp}=files;
export = {plan,caseIds,recordReport,runResearch,researchSummary,researchUpload,reportsFor,stamp};
