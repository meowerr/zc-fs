import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9225;
const SCREENSHOTS_DIR = path.resolve('screenshots');
const BASE_URL = 'http://localhost:5174';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) {
            reject(new Error(data.error.message || JSON.stringify(data.error)));
          } else {
            resolve(data.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile,
      hasTouch: isMobile,
    });
    if (isMobile) {
      await this.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    } else {
      await this.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
    await sleep(200);
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(1500);
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const targetPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(targetPath, buffer);
    console.log(`  📸 Saved: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function run() {
  console.log('='.repeat(80));
  console.log('🏁 CAPTURING PITLANE COMPREHENSIVE SCREENSHOT SUITE (DESKTOP & MOBILE)');
  console.log('='.repeat(80));

  const tmpProfile = path.join(process.env.TEMP, `edge_screenshot_${Date.now()}`);
  const edgeProc = spawn(
    EDGE_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${tmpProfile}`,
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let client = null;

  try {
    // Wait for Edge CDP to become available
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://localhost:${CDP_PORT}/json/version`);
        versionData = await res.json();
        break;
      } catch {
        await sleep(300);
      }
    }

    if (!versionData) {
      throw new Error('Edge CDP failed to initialize on port ' + CDP_PORT);
    }

    console.log(`✅ Connected to browser: ${versionData.Browser}`);

    // Create a new target/page
    const newPageRes = await fetch(`http://localhost:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
    const pageData = await newPageRes.json();
    client = new CDPClient(pageData.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    const viewports = [
      { name: 'desktop', width: 1440, height: 900, isMobile: false },
      { name: 'mobile', width: 390, height: 844, isMobile: true },
    ];

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ---`);
      await client.setViewport(vp.width, vp.height, vp.isMobile);

      // 1. Auth Screen
      await client.navigate(`${BASE_URL}/`);
      await client.evaluate(`
        sessionStorage.clear();
        localStorage.clear();
        window.location.reload();
      `);
      await sleep(2500); // Allow Three.js shader to animate
      await client.captureScreenshot(`01_auth_screen_${vp.name}.png`);

      // 2. Pending Approval Screen
      await client.navigate(`${BASE_URL}/?demo=true&role=pending`);
      await sleep(1000);
      await client.captureScreenshot(`02_pending_approval_${vp.name}.png`);

      // 3. Mission Control (Dashboard)
      await client.navigate(`${BASE_URL}/?demo=true`);
      await sleep(1500);
      await client.captureScreenshot(`03_mission_control_${vp.name}.png`);

      // 4. Tasks Hub
      await client.evaluate(`
        const tasksBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && el.textContent.includes('Tasks') || el.textContent.includes('DELIVERABLES'));
        if (tasksBtn) tasksBtn.click();
      `);
      await sleep(1200);
      await client.captureScreenshot(`04_tasks_hub_${vp.name}.png`);

      // 5. Task Detail Modal - Overview
      await client.evaluate(`
        const card = document.querySelector('[role="article"], .cursor-pointer.rounded-xl, .group.relative');
        if (card) card.click();
      `);
      await sleep(1000);
      await client.captureScreenshot(`05_modal_task_detail_overview_${vp.name}.png`);

      // 6. Task Detail Modal - Submissions
      await client.evaluate(`
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const subTab = tabs.find(t => t.textContent && t.textContent.includes('Submissions'));
        if (subTab) subTab.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`06_modal_task_detail_submissions_${vp.name}.png`);

      // 7. Task Detail Modal - Thread
      await client.evaluate(`
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const threadTab = tabs.find(t => t.textContent && t.textContent.includes('Thread'));
        if (threadTab) threadTab.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`07_modal_task_detail_thread_${vp.name}.png`);

      // 8. Task Detail Modal - Timeline
      await client.evaluate(`
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const tlTab = tabs.find(t => t.textContent && t.textContent.includes('Timeline'));
        if (tlTab) tlTab.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`08_modal_task_detail_timeline_${vp.name}.png`);

      // Close Task Detail Modal
      await client.evaluate(`
        const closeBtn = document.querySelector('button[aria-label*="Close"], button[title="Close"]');
        if (closeBtn) closeBtn.click();
      `);
      await sleep(600);

      // 9. New Task Creation Modal
      await client.evaluate(`
        const newBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('New Task') || b.textContent.includes('Create Deliverable') || b.textContent.includes('+ Deliverable')));
        if (newBtn) newBtn.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`09_modal_new_task_create_${vp.name}.png`);

      // Close New Task Modal
      await client.evaluate(`
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
        if (cancelBtn) cancelBtn.click();
      `);
      await sleep(500);

      // 10. Mobile Filter Sheet (if mobile)
      if (vp.isMobile) {
        await client.evaluate(`
          const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Filter') || b.getAttribute('title') === 'Filter');
          if (filterBtn) filterBtn.click();
        `);
        await sleep(800);
        await client.captureScreenshot(`10_sheet_task_filter_mobile.png`);
        await client.evaluate(`
          const closeFilter = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Apply') || b.textContent.includes('Close') || b.textContent.includes('Cancel')));
          if (closeFilter) closeFilter.click();
        `);
        await sleep(500);
      }

      // 11. Chat View
      await client.evaluate(`
        const chatNav = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && (el.textContent.includes('Chat') || el.textContent.includes('Comms')));
        if (chatNav) chatNav.click();
      `);
      await sleep(1200);
      await client.captureScreenshot(`11_chat_view_${vp.name}.png`);

      // 12. Team Directory
      await client.evaluate(`
        const teamNav = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && (el.textContent.includes('Team') || el.textContent.includes('Roster')));
        if (teamNav) teamNav.click();
      `);
      await sleep(1200);
      await client.captureScreenshot(`12_team_directory_${vp.name}.png`);

      // 13. Documents Hub
      await client.evaluate(`
        const docsNav = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && (el.textContent.includes('Documents') || el.textContent.includes('CAD')));
        if (docsNav) docsNav.click();
      `);
      await sleep(1200);
      await client.captureScreenshot(`13_documents_hub_${vp.name}.png`);

      // 14. Document Upload Modal
      await client.evaluate(`
        const uploadBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Upload') || b.textContent.includes('Commit Asset')));
        if (uploadBtn) uploadBtn.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`14_modal_document_upload_${vp.name}.png`);

      // Close Document Upload Modal
      await client.evaluate(`
        const closeUpload = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
        if (closeUpload) closeUpload.click();
      `);
      await sleep(500);

      // 15. Admin Approval Hub
      await client.evaluate(`
        const adminNav = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent && (el.textContent.includes('Admin') || el.textContent.includes('Approvals')));
        if (adminNav) adminNav.click();
      `);
      await sleep(1200);
      await client.captureScreenshot(`15_admin_hub_${vp.name}.png`);

      // 16. Notification Drawer
      await client.evaluate(`
        const notifBtn = document.querySelector('button[title*="Notification"], button[aria-label*="Notification"], button:has(svg.lucide-bell)');
        if (notifBtn) notifBtn.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`16_drawer_notifications_${vp.name}.png`);

      // Close Notification Drawer
      await client.evaluate(`
        const closeDrawer = document.querySelector('button[aria-label*="Close"], button[title="Close"]');
        if (closeDrawer) closeDrawer.click();
      `);
      await sleep(500);

      // 17. Global Telemetry Search Modal
      await client.evaluate(`
        const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Search') || b.textContent.includes('Ctrl+K') || b.textContent.includes('Cmd+K')) || b.querySelector('svg.lucide-search'));
        if (searchBtn) searchBtn.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`17_modal_global_search_${vp.name}.png`);

      // Close Search Modal
      await client.evaluate(`
        const closeSearch = document.querySelector('button[aria-label*="Close"], button[title="Close"]');
        if (closeSearch) closeSearch.click();
      `);
      await sleep(500);

      // 18. Role Operations Guide Modal
      await client.evaluate(`
        const guideBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('title')?.includes('Guide') || b.getAttribute('aria-label')?.includes('Guide') || b.textContent?.includes('Guide'));
        if (guideBtn) guideBtn.click();
      `);
      await sleep(800);
      await client.captureScreenshot(`18_modal_role_guide_${vp.name}.png`);

      // Close Guide Modal
      await client.evaluate(`
        const closeGuide = document.querySelector('button[aria-label*="Close"], button[title="Close"]');
        if (closeGuide) closeGuide.click();
      `);
      await sleep(500);

      // 19. Mobile Garage Door Navigation (Mobile only)
      if (vp.isMobile) {
        await client.evaluate(`
          const garageTrigger = document.querySelector('[aria-label*="Garage"], [aria-label*="Navigation"], [role="button"]:has(svg.lucide-menu), .garage-door-tab');
          if (garageTrigger) garageTrigger.click();
        `);
        await sleep(800);
        await client.captureScreenshot(`19_sheet_mobile_garage_door.png`);
        await client.evaluate(`
          const closeGarage = document.querySelector('[aria-label*="Close"]');
          if (closeGarage) closeGarage.click();
        `);
        await sleep(500);
      }

      // 20. Styleguide
      await client.navigate(`${BASE_URL}/styleguide?demo=true`);
      await sleep(1500);
      await client.captureScreenshot(`20_styleguide_${vp.name}.png`);

      // 21. Legal - Privacy Policy
      await client.navigate(`${BASE_URL}/privacy?demo=true`);
      await sleep(1200);
      await client.captureScreenshot(`21_legal_privacy_${vp.name}.png`);

      // 22. Legal - Terms of Service
      await client.navigate(`${BASE_URL}/terms?demo=true`);
      await sleep(1200);
      await client.captureScreenshot(`22_legal_terms_${vp.name}.png`);
    }

    console.log('\n🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED IN DESKTOP AND MOBILE FORM!');
  } catch (err) {
    console.error('❌ Screenshot capture error:', err);
    throw err;
  } finally {
    if (client) client.close();
    edgeProc.kill();
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch {}
  }
}

run();
