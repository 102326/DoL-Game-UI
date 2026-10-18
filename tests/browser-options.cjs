// Keep the existing Windows Edge workflow; CI uses Playwright's pinned Chromium.
module.exports={headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})};
