// Only the controlled first-party settings/combat fixtures may request pixels.
const fs = require('node:fs');
const path = require('node:path');
const { fixtureChecks, root, writeJson } = require('../scripts/ci-evidence.cjs');

async function captureFailure(page, { kind, error, snapshot }) {
  const check = process.env.MOODY_CHECK_NAME, directory = process.env.MOODY_EVIDENCE_DIR;
  if (!fixtureChecks.includes(check) || !['settings', 'combat'].includes(kind) || !directory) return;
  const expected = path.join(root, 'tests/artifacts/ci', process.env.MOODY_EVIDENCE_ID || '', 'fixtures', check);
  if (path.resolve(directory) !== expected || !/^[a-zA-Z0-9_-]{1,100}$/.test(process.env.MOODY_EVIDENCE_ID || '')) return;
  try {
    const data = { kind, check, assertion: { name: error?.name, code: error?.code, message: String(error?.message || error).slice(0, 4000) }, snapshot };
    let json = JSON.stringify(data, null, 2) + '\n';
    if (Buffer.byteLength(json) > 65536) json = JSON.stringify({ kind, check, assertion: data.assertion, snapshotOmitted: '64 KiB limit' });
    writeJson(path.join(directory, 'snapshot.json'), JSON.parse(json));
    const viewport = page?.viewportSize();
    if (!viewport || viewport.width > 2048 || viewport.height > 1536) return;
    const pixels = await page.screenshot({ type: 'jpeg', quality: 60, animations: 'disabled', timeout: 3000 });
    if (pixels.length <= 524288) fs.writeFileSync(path.join(directory, 'viewport.jpg'), pixels);
  } catch (captureError) {
    // The original assertion remains the failure even if browser capture is unavailable.
    console.error('Controlled fixture capture unavailable:', captureError.code || captureError.name);
  }
}

module.exports = { captureFailure };
