// Keep the Windows Edge workflow; CI uses Playwright's pinned Chromium.
import type {LaunchOptions} from 'playwright';
const options:LaunchOptions={headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})};
export = options;
