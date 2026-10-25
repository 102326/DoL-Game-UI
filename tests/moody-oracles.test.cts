// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import oracles = require('./moody-oracles.cjs');

// Deterministically finish between browser tasks, without wall-clock sleeps or pausing a real animation.
const finishAfterPredicate=()=>{
 const dialog=document.querySelector('#dol-midnight-controls'),section=document.querySelector('section');
 if(!dialog?.hasAttribute('data-workspace-transition')||!section)return false;
 queueMicrotask(()=>{dialog.removeAttribute('data-workspace-transition');section.removeAttribute('inert')});
 return true;
};
(async()=>{
 const browser=await playwright.chromium.launch(browserOptions);
 try{
  const page=await browser.newPage();
  await page.setContent('<dialog id="dol-midnight-controls" data-workspace-transition><section class="dmt-workspace-section" inert aria-labelledby="dmt-material-heading"></section></dialog>');
  const old=await page.waitForFunction(finishAfterPredicate);await old.dispose();
  const lost=await oracles.settingsSnapshot(page);assert.equal(lost.transition,false);assert.equal(lost.sections[0]?.inert,false,'the old two-task sample loses its pending witness');
  await page.evaluate(()=>{const dialog=document.querySelector('dialog'),section=document.querySelector('section');if(!dialog||!section)throw Error('Missing sample fixture');dialog.setAttribute('data-workspace-transition','');section.setAttribute('inert','')});
  const captured=await oracles.settingsSample(page,finishAfterPredicate);
  assert.equal(captured.transition,true);assert.equal(captured.sections[0]?.inert,true);
  assert.throws(()=>oracles.assertSettings(captured,'dmt-material-heading'),/MOODY_SETTINGS_PENDING/,'the historical counterexample remains precisely rejected');
  const current=await oracles.settingsSnapshot(page);assert.equal(current.transition,false);assert.equal(current.sections[0]?.inert,false,'capturing must not pause or change completion');
  await oracles.waitSettings(page,'dmt-material-heading');await oracles.waitSettingsClosed(page);
  console.log('PASS atomic sample retains the precise pending witness across browser-task completion; natural settlement still passes');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
