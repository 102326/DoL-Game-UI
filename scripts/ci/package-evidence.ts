import {readReport} from './records.ts';
import {requiredPackages,sameIdentity} from './contracts.ts';
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const object=(value:unknown):Record<string,unknown>=>{if(!record(value))throw Error('Invalid evidence object');return value};
const rows=(value:unknown):Record<string,unknown>[]=>{if(!Array.isArray(value))throw Error('Invalid evidence list');return value.map(object)};
const digest=(value:unknown):boolean=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
type Context={dir:string;identity:{projectId?:string;source:unknown;run:{id:string;githubRunId?:string|null;attempt:string}}};
export function packageEvidence(ctx:Context) {
  // Malformed or partial evidence must not prevent the whole-run summary/upload.
  try {
    const report = readReport(ctx, 'package-contracts.json');if(!report)return false;const reproducibility=object(report.reproducibility);
    if (!report || report.kind !== 'package-contracts' || report.status !== 'PASS' || (object(report.versionSources).status !== 'PASS' || object(report.versionSources).projectId!==ctx.identity.projectId) || reproducibility.status !== 'PASS' || !Array.isArray(reproducibility.differences) || reproducibility.differences.length !== 0) return false;
    const namesMatch = (values:unknown) => Array.isArray(values) && values.length === requiredPackages.length && new Set(values).size === requiredPackages.length && values.every(name => typeof name==='string'&&requiredPackages.includes(name));
    const expectedBuild={projectId:ctx.identity.projectId,commit:object(ctx.identity.source).head,runId:ctx.identity.run.githubRunId||ctx.identity.run.id,attempt:ctx.identity.run.attempt};
    if(!sameIdentity(report.buildIdentity,expectedBuild))return false;
    const negatives = object(report.negativeTests);
    const plan=Array.isArray(negatives.plan)?negatives.plan:[];
    const requiredNegatives = ['test_rejects_broken_packages', 'test_ignores_source_mtime_and_permissions', 'test_rejects_mismatches_in_independent_sources', 'test_all_current_positive_and_precise_mutations', 'test_joint_manifest_corruption_and_incomplete_compilation', 'test_metadata_drift_and_comparison_diagnostics', 'test_stale_incomplete_receipts_and_report_limit'];
    if (!Array.isArray(report.contracts) || !namesMatch(report.expectedPackages) || !namesMatch(rows(report.contracts).map(p => p.name)) || !rows(report.contracts).every(p => p.status === 'PASS' && digest(p.sha256))) return false;
    if (negatives?.status !== 'PASS' || !Array.isArray(negatives.plan) || !requiredNegatives.every(name => plan.some(id => typeof id === 'string' && id.endsWith('.' + name))) || new Set(negatives.plan).size !== negatives.plan.length || negatives.testsRun !== negatives.plan.length || ['failures', 'errors', 'skipped', 'expectedFailures', 'unexpectedSuccesses'].some(field => negatives[field] !== 0)) return false;
    if (!Array.isArray(report.builds) || report.builds.length !== 2 || !rows(report.builds).every(b => sameIdentity(object(b.receipt).buildIdentity,expectedBuild) && typeof object(b.receipt).invocation === 'string' && object(b.receipt).invocation && sameIdentity(object(b.receipt).source, ctx.identity.source) && object(b.receipt).runId === ctx.identity.run.id && Array.isArray(object(b.receipt).packages) && namesMatch(rows(object(b.receipt).packages).map(p => p.name)) && Array.isArray(b.snapshots) && b.snapshots.length === requiredPackages.length && new Set(rows(b.snapshots).map(s => s.file)).size === requiredPackages.length)) return false;
    if (object(rows(report.builds)[0]?.receipt).invocation === object(rows(report.builds)[1]?.receipt).invocation) return false;
    const isolation=object(rows(report.builds)[1]?.isolation);if(!isolation||isolation.workspace!=='independent Git checkout and source overlay'||isolation.compilerCache!=='fresh isolated directory'||object(isolation.environment).TZ!=='Pacific/Kiritimati'||object(isolation.environment).LC_ALL!=='C')return false;
    return rows(report.builds).every(b => rows(object(b.receipt).packages).every(p => {
      const expected = object(rows(report.contracts).find(c => c.name === p.name)), snapshot = object(rows(b.snapshots).find(s => s.file === p.file));
      if (p.file !== expected.file || p.sha256 !== expected.sha256 || snapshot?.sha256 !== p.sha256 || snapshot.archiveComment !== '' || !Array.isArray(snapshot.members)) return false;
      const members = object(expected.members);
      if (!members || !Object.hasOwn(members, 'boot.json') || !Object.hasOwn(members, 'LICENSE') || Object.keys(members).length !== snapshot.members.length || new Set(rows(snapshot.members).map(m => m.name)).size !== snapshot.members.length) return false;
      if (!sameIdentity(rows(snapshot.members).map(m => m.name), Object.keys(members).sort())) return false;
      return rows(snapshot.members).every(m => {
        const meta = object(m.metadata);
        return digest(m.sha256) && m.sha256 === (typeof m.name==='string'?members[m.name]:undefined) && digest(m.compressedSha256) &&
          meta && sameIdentity(meta.date_time, [2026, 1, 1, 0, 0, 0]) && meta.compress_type === 8 && meta.create_system === 3 && meta.create_version === 20 && meta.extract_version === 20 && meta.external_attr === (0o600 << 16) && meta.internal_attr === 0 &&
          meta.flag_bits === ((typeof m.name==='string'&&/^[\x00-\x7F]*$/.test(m.name)) ? 0 : 0x800) && meta.extra === '' && meta.comment === '' && ['file_size', 'compress_size', 'CRC', 'header_offset'].every(field => Number.isSafeInteger(meta[field]) && typeof meta[field]==='number'&&meta[field] >= 0);
      }) && sameIdentity(snapshot, rows(rows(report.builds)[0]?.snapshots).find(s => s.file === p.file));
    }));
  } catch { return false; }
}
