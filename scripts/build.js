// scripts/build.js
const fs = require('fs');
const path = require('path');
const { runbooks } = require('./runbooks-data');

const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to escape HTML
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Generate the standalone HTML content for a runbook
function generateRunbookHtml(rb) {
  const isSubdir = rb.filename.includes('/');
  const homePath = isSubdir ? '../index.html' : 'index.html';

  let sectionsHtml = '';
  let totalItemsCount = 0;

  rb.sections.forEach((section, sIdx) => {
    let itemsHtml = '';
    section.items.forEach((item, iIdx) => {
      totalItemsCount++;
      const codeHtml = item.code 
        ? `<div class="code-preview">
            <div class="code-header">
              <span class="code-label">CLI Command / Verification</span>
              <button type="button" class="btn-copy-code" onclick="copySnippet(this)" title="Copy Command">Copy</button>
            </div>
            <pre><code>${escapeHtml(item.code)}</code></pre>
          </div>`
        : '';

      itemsHtml += `
        <!-- ITEM ${item.id} -->
        <div class="check-item" data-id="${item.id}" id="item-${item.id}">
          <div class="check-controls">
            <!-- 1. Done Checkbox (Green Tick when checked) -->
            <button type="button" class="btn-check btn-done" data-action="done" title="Mark as Done" aria-label="Mark as Done">
              <span class="icon-indicator">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span class="btn-text">Done</span>
            </button>

            <!-- 2. NA Checkbox (Blue Dash when clicked) -->
            <button type="button" class="btn-check btn-na" data-action="na" title="Mark as Not Applicable" aria-label="Mark as Not Applicable">
              <span class="icon-indicator">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </span>
              <span class="btn-text">N/A</span>
            </button>
          </div>

          <div class="item-details">
            <div class="item-header-line">
              <span class="item-tag">#${item.id}</span>
              <h4 class="item-title">${escapeHtml(item.title)}</h4>
            </div>
            <p class="item-desc">${escapeHtml(item.desc)}</p>
            ${codeHtml}
          </div>
        </div>
      `;
    });

    sectionsHtml += `
      <!-- =================================================================
           SECTION ${sIdx + 1}: ${section.title}
           To add a new point, copy and paste a <div class="check-item"> block inside this section.
           ================================================================= -->
      <section class="runbook-section">
        <div class="section-banner">
          <div class="section-title-wrap">
            <span class="section-step-num">${sIdx + 1}</span>
            <div class="section-titles">
              <h3 class="section-heading">${escapeHtml(section.title)}</h3>
              <p class="section-subtext">${escapeHtml(section.description)}</p>
            </div>
          </div>
          <span class="section-badge">${section.items.length} Checks</span>
        </div>

        <div class="items-list">
          ${itemsHtml}
        </div>
      </section>
    `;
  });

  const metaHtml = rb.meta.map(m => `
    <div class="meta-field">
      <label class="meta-label">${escapeHtml(m.label)}</label>
      <input type="text" class="meta-input" placeholder="${escapeHtml(m.placeholder)}" data-meta-key="${escapeHtml(m.label)}">
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(rb.title)} | DevOps Runbooks</title>
  <meta name="description" content="${escapeHtml(rb.intro)}">
  <style>
    /* =====================================================================
       STANDALONE MODERN DEVOPS RUNBOOK STYLESHEET
       Offline-first: Zero external CSS, fonts, or network requests required.
       ===================================================================== */
    :root {
      --bg-page: #0b0f19;
      --bg-surface: #111827;
      --bg-card: #1f2937;
      --bg-card-hover: #263346;
      --bg-input: #0e1526;
      --border-subtle: #374151;
      --border-focus: #6366f1;

      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;

      /* Colors for Checkbox States */
      --done-color: #10b981;
      --done-bg: rgba(16, 185, 129, 0.12);
      --done-border: #059669;
      --done-glow: rgba(16, 185, 129, 0.3);

      --na-color: #0ea5e9;
      --na-bg: rgba(14, 165, 233, 0.12);
      --na-border: #0284c7;
      --na-glow: rgba(14, 165, 233, 0.3);

      --brand-indigo: #6366f1;
      --brand-indigo-light: #818cf8;
      --amber-alert: #f59e0b;
      --danger-red: #ef4444;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-card: 0 4px 14px rgba(0, 0, 0, 0.4);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-page);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      padding: 24px 16px 80px 16px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Top Navigation Bar */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .nav-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--brand-indigo-light);
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: color 0.2s ease;
    }

    .nav-brand:hover {
      color: #fff;
    }

    .nav-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .nav-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .nav-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-main);
      border-color: #4b5563;
    }

    /* Header Box */
    .header-card {
      background: linear-gradient(180deg, #161f30 0%, #111827 100%);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-card);
      position: relative;
    }

    .header-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    .badge-primary {
      background: rgba(99, 102, 241, 0.2);
      color: var(--brand-indigo-light);
      border: 1px solid rgba(99, 102, 241, 0.4);
    }

    .badge-priority {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-version {
      background: rgba(156, 163, 175, 0.15);
      color: #d1d5db;
      border: 1px solid var(--border-subtle);
    }

    .runbook-title {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }

    .runbook-desc {
      font-size: 15px;
      color: #d1d5db;
      line-height: 1.6;
      max-width: 880px;
      margin-bottom: 20px;
    }

    /* Metadata Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      padding-top: 18px;
      border-top: 1px solid var(--border-subtle);
    }

    .meta-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .meta-input {
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      padding: 7px 10px;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .meta-input:focus {
      border-color: var(--border-focus);
    }

    /* Sticky Progress & Filter Bar */
    .control-bar {
      position: sticky;
      top: 12px;
      z-index: 50;
      background: rgba(17, 24, 39, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .progress-stats-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .progress-labels {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
    }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .stat-badge.stat-done { color: var(--done-color); }
    .stat-badge.stat-na { color: var(--na-color); }
    .stat-badge.stat-pending { color: var(--text-muted); }

    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .progress-percent {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }

    .progress-bar-track {
      width: 100%;
      height: 8px;
      background: #232d3f;
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
      margin-bottom: 12px;
    }

    .progress-fill-done {
      background: linear-gradient(90deg, #10b981, #059669);
      height: 100%;
      width: 0%;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-fill-na {
      background: linear-gradient(90deg, #38bdf8, #0284c7);
      height: 100%;
      width: 0%;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .filter-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
    }

    .btn-filter {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 4px 10px;
      font-size: 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-filter.active, .btn-filter:hover {
      background: var(--bg-card);
      color: var(--text-main);
      border-color: #6b7280;
    }

    .search-input {
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      padding: 5px 10px;
      font-size: 12px;
      outline: none;
      width: 180px;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      width: 240px;
      border-color: var(--border-focus);
    }

    /* Section Styling */
    .runbook-section {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 20px;
      overflow: hidden;
    }

    .section-banner {
      background: #141c2c;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title-wrap {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .section-step-num {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--brand-indigo-light);
      font-weight: 800;
      font-size: 13px;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .section-heading {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }

    .section-subtext {
      font-size: 13px;
      color: var(--text-muted);
    }

    .section-badge {
      font-size: 11px;
      background: var(--bg-card);
      color: var(--text-dim);
      border: 1px solid var(--border-subtle);
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .items-list {
      display: flex;
      flex-direction: column;
    }

    /* Checklist Item Component */
    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 18px 20px;
      border-bottom: 1px solid #1f293d;
      background: var(--bg-surface);
      transition: background 0.15s ease, border-color 0.15s ease;
      position: relative;
    }

    .check-item:last-child {
      border-bottom: none;
    }

    .check-item:hover {
      background: #131d2e;
    }

    /* Front Dual Controls */
    .check-controls {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .btn-check {
      background: #1f293d;
      border: 1px solid #374151;
      border-radius: var(--radius-sm);
      color: var(--text-dim);
      padding: 6px 9px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      user-select: none;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-check:hover {
      border-color: #6b7280;
      color: var(--text-main);
    }

    .btn-check .icon-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
    }

    /* Done Active State (Green Tick) */
    .btn-done.is-active {
      background: var(--done-color);
      border-color: var(--done-border);
      color: #ffffff;
      box-shadow: 0 0 10px var(--done-glow);
    }

    /* NA Active State (Blue Dash) */
    .btn-na.is-active {
      background: var(--na-color);
      border-color: var(--na-border);
      color: #ffffff;
      box-shadow: 0 0 10px var(--na-glow);
    }

    /* Item Card States */
    .check-item.status-done {
      border-left: 4px solid var(--done-color);
      background: rgba(16, 185, 129, 0.04);
    }

    .check-item.status-done .item-title {
      color: #34d399;
    }

    .check-item.status-na {
      border-left: 4px solid var(--na-color);
      background: rgba(14, 165, 233, 0.04);
      opacity: 0.72;
    }

    .check-item.status-na .item-title {
      color: #7dd3fc;
      text-decoration: line-through;
    }

    .check-item.status-na .item-desc {
      font-style: italic;
    }

    /* Item Content */
    .item-details {
      flex: 1;
      min-width: 0;
    }

    .item-header-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .item-tag {
      font-size: 11px;
      color: var(--text-dim);
      font-family: monospace;
      font-weight: 600;
    }

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.35;
    }

    .item-desc {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 8px;
    }

    /* Code Snippet Box */
    .code-preview {
      background: #080d1a;
      border: 1px solid #1e293b;
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-top: 8px;
    }

    .code-header {
      background: #0d1527;
      padding: 4px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
    }

    .code-label {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
      font-family: monospace;
      font-weight: 600;
    }

    .btn-copy-code {
      background: transparent;
      border: none;
      color: #818cf8;
      font-size: 11px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .btn-copy-code:hover {
      background: #1e293b;
      color: #fff;
    }

    .code-preview pre {
      padding: 10px 12px;
      margin: 0;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12.5px;
      color: #e2e8f0;
      line-height: 1.45;
    }

    /* Bottom Action Controls */
    .footer-actions-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 22px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .auto-save-pill {
      font-size: 12px;
      color: #34d399;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .auto-save-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
    }

    .footer-note {
      font-size: 12px;
      color: var(--text-dim);
    }

    .footer-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-action {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-reset {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #f87171;
    }

    .btn-reset:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #ffffff;
      border-color: var(--danger-red);
    }

    .btn-copy-summary {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: var(--brand-indigo-light);
    }

    .btn-copy-summary:hover {
      background: rgba(99, 102, 241, 0.3);
      color: #ffffff;
    }

    .btn-print {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
    }

    .btn-print:hover {
      background: var(--bg-card-hover);
      border-color: #6b7280;
    }

    /* Toast Notification */
    .toast-notice {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1f2937;
      color: #ffffff;
      border: 1px solid #4b5563;
      border-radius: var(--radius-sm);
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      pointer-events: none;
      z-index: 100;
    }

    .toast-notice.show {
      opacity: 1;
      transform: translateY(0);
    }

    /* Print Stylesheet */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
      }
      .top-nav, .control-bar, .footer-actions-card, .btn-copy-code, .search-input {
        display: none !important;
      }
      .header-card, .runbook-section, .check-item, .code-preview {
        border-color: #cccccc !important;
        background: #ffffff !important;
        box-shadow: none !important;
      }
      .runbook-title, .section-heading, .item-title {
        color: #000000 !important;
      }
      .item-desc, .section-subtext, .runbook-desc {
        color: #444444 !important;
      }
      .code-preview pre {
        color: #000000 !important;
        background: #f8f8f8 !important;
      }
      .check-item.status-done {
        border-left: 4px solid #10b981 !important;
      }
      .check-item.status-na {
        border-left: 4px solid #0284c7 !important;
      }
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Top Navigation Bar -->
    <header class="top-nav">
      <a href="${homePath}" class="nav-brand" title="Back to All Runbooks">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>All DevOps Runbooks</span>
      </a>

      <div class="nav-actions">
        <button type="button" class="nav-btn" onclick="copyMarkdownReport()" title="Copy Markdown Checklist for Slack/Jira">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy Markdown</span>
        </button>
        <button type="button" class="nav-btn" onclick="window.print()" title="Print Runbook or Save as PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span>Print / PDF</span>
        </button>
      </div>
    </header>

    <!-- Runbook Header & Intro -->
    <header class="header-card">
      <div class="header-badges">
        <span class="badge badge-primary">${escapeHtml(rb.category)}</span>
        <span class="badge badge-priority">${escapeHtml(rb.priority)}</span>
        <span class="badge badge-version">${escapeHtml(rb.badge)}</span>
      </div>
      <h1 class="runbook-title">${escapeHtml(rb.title)}</h1>
      <p class="runbook-desc">${escapeHtml(rb.intro)}</p>

      <!-- Metadata Fields (Auto-saved) -->
      <div class="meta-grid">
        ${metaHtml}
      </div>
    </header>

    <!-- Interactive Sticky Progress & Filter Control Bar -->
    <div class="control-bar" id="sticky-control-bar">
      <div class="progress-stats-row">
        <div class="progress-labels">
          <span class="stat-badge stat-done">
            <span class="stat-dot"></span>
            <span id="count-done">0</span> Done
          </span>
          <span class="stat-badge stat-na">
            <span class="stat-dot"></span>
            <span id="count-na">0</span> N/A
          </span>
          <span class="stat-badge stat-pending">
            <span class="stat-dot"></span>
            <span id="count-pending">${totalItemsCount}</span> Pending
          </span>
        </div>
        <div class="progress-percent" id="progress-percent-label">0% Completed</div>
      </div>

      <div class="progress-bar-track" aria-label="Completion progress">
        <div class="progress-fill-done" id="progress-done-bar" style="width: 0%;"></div>
        <div class="progress-fill-na" id="progress-na-bar" style="width: 0%;"></div>
      </div>

      <div class="filter-actions-row">
        <div class="filter-pills">
          <button type="button" class="btn-filter active" data-filter="all" onclick="setFilter('all')">All (<span id="filter-all-count">${totalItemsCount}</span>)</button>
          <button type="button" class="btn-filter" data-filter="pending" onclick="setFilter('pending')">Pending</button>
          <button type="button" class="btn-filter" data-filter="done" onclick="setFilter('done')">Done</button>
          <button type="button" class="btn-filter" data-filter="na" onclick="setFilter('na')">N/A</button>
        </div>

        <input type="text" class="search-input" id="item-search" placeholder="Search checks..." oninput="handleSearch(this.value)">
      </div>
    </div>

    <!-- Main Checklist Sections Container -->
    <!-- 
      ========================================================================
      EASY CUSTOMIZATION NOTICE:
      To edit or add any check point, simply modify or duplicate any 
      <div class="check-item" data-id="..."> block below.
      The counters, storage, and filters automatically handle all changes!
      ========================================================================
    -->
    <main class="checklist-main" id="checklist-container">
      ${sectionsHtml}
    </main>

    <!-- Bottom Action Bar with Reset Button -->
    <footer class="footer-actions-card">
      <div class="footer-left">
        <div class="auto-save-pill">
          <span class="auto-save-dot"></span>
          <span>State auto-saved locally in browser</span>
        </div>
        <p class="footer-note">Single standalone file. Works completely offline without server or internet connection.</p>
      </div>

      <div class="footer-buttons">
        <button type="button" class="btn-action btn-copy-summary" onclick="copyMarkdownReport()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Copy Summary</span>
        </button>

        <!-- Reset Button at bottom as requested -->
        <button type="button" class="btn-action btn-reset" onclick="resetAllCheckboxes()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>Reset All Checkboxes</span>
        </button>
      </div>
    </footer>
  </div>

  <!-- Toast Notification element -->
  <div class="toast-notice" id="toast-message">Action completed</div>

  <!-- =====================================================================
       EMBEDDED CLIENT SCRIPT
       Offline-first state engine with LocalStorage persistence and search.
       ===================================================================== -->
  <script>
    const STORAGE_KEY = 'runbook_state_${rb.id}';
    let currentFilter = 'all';
    let searchQuery = '';

    // Initialize Runbook on DOM load
    document.addEventListener('DOMContentLoaded', () => {
      loadSavedState();
      bindCheckboxEvents();
      bindMetadataEvents();
      updateProgress();
    });

    // Bind click events on Done and NA buttons
    function bindCheckboxEvents() {
      const items = document.querySelectorAll('.check-item');
      items.forEach(item => {
        const id = item.getAttribute('data-id');
        const doneBtn = item.querySelector('.btn-done');
        const naBtn = item.querySelector('.btn-na');

        if (doneBtn) {
          doneBtn.addEventListener('click', () => toggleState(item, id, 'done'));
        }
        if (naBtn) {
          naBtn.addEventListener('click', () => toggleState(item, id, 'na'));
        }
      });
    }

    // Toggle Done or NA status
    function toggleState(item, id, targetAction) {
      const doneBtn = item.querySelector('.btn-done');
      const naBtn = item.querySelector('.btn-na');
      
      const isCurrentlyDone = item.classList.contains('status-done');
      const isCurrentlyNa = item.classList.contains('status-na');

      if (targetAction === 'done') {
        if (isCurrentlyDone) {
          // Uncheck
          item.classList.remove('status-done');
          doneBtn.classList.remove('is-active');
        } else {
          // Check done, uncheck NA
          item.classList.add('status-done');
          item.classList.remove('status-na');
          doneBtn.classList.add('is-active');
          naBtn.classList.remove('is-active');
        }
      } else if (targetAction === 'na') {
        if (isCurrentlyNa) {
          // Uncheck
          item.classList.remove('status-na');
          naBtn.classList.remove('is-active');
        } else {
          // Check NA, uncheck done
          item.classList.add('status-na');
          item.classList.remove('status-done');
          naBtn.classList.add('is-active');
          doneBtn.classList.remove('is-active');
        }
      }

      saveState();
      updateProgress();
      applyFilters();
    }

    // Update Progress Bar & Counter Badges
    function updateProgress() {
      const items = Array.from(document.querySelectorAll('.check-item'));
      const total = items.length;
      let done = 0;
      let na = 0;

      items.forEach(item => {
        if (item.classList.contains('status-done')) done++;
        else if (item.classList.contains('status-na')) na++;
      });

      const pending = total - done - na;
      const donePercent = total > 0 ? (done / total) * 100 : 0;
      const naPercent = total > 0 ? (na / total) * 100 : 0;
      const completedPercent = Math.round(donePercent + naPercent);

      // Update counters
      const countDoneEl = document.getElementById('count-done');
      const countNaEl = document.getElementById('count-na');
      const countPendingEl = document.getElementById('count-pending');
      const filterAllCountEl = document.getElementById('filter-all-count');
      const percentLabelEl = document.getElementById('progress-percent-label');
      const doneBarEl = document.getElementById('progress-done-bar');
      const naBarEl = document.getElementById('progress-na-bar');

      if (countDoneEl) countDoneEl.textContent = done;
      if (countNaEl) countNaEl.textContent = na;
      if (countPendingEl) countPendingEl.textContent = pending;
      if (filterAllCountEl) filterAllCountEl.textContent = total;
      if (percentLabelEl) percentLabelEl.textContent = completedPercent + '% Completed';

      if (doneBarEl) doneBarEl.style.width = donePercent + '%';
      if (naBarEl) naBarEl.style.width = naPercent + '%';
    }

    // Save State to LocalStorage
    function saveState() {
      try {
        const state = {
          items: {},
          meta: {}
        };

        document.querySelectorAll('.check-item').forEach(item => {
          const id = item.getAttribute('data-id');
          if (item.classList.contains('status-done')) {
            state.items[id] = 'done';
          } else if (item.classList.contains('status-na')) {
            state.items[id] = 'na';
          }
        });

        document.querySelectorAll('.meta-input').forEach(input => {
          const key = input.getAttribute('data-meta-key');
          if (key && input.value.trim()) {
            state.meta[key] = input.value.trim();
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }

    // Load State from LocalStorage
    function loadSavedState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);

        if (state.items) {
          Object.keys(state.items).forEach(id => {
            const item = document.querySelector(\`.check-item[data-id="\${id}"]\`);
            if (!item) return;

            const val = state.items[id];
            const doneBtn = item.querySelector('.btn-done');
            const naBtn = item.querySelector('.btn-na');

            if (val === 'done') {
              item.classList.add('status-done');
              if (doneBtn) doneBtn.classList.add('is-active');
            } else if (val === 'na') {
              item.classList.add('status-na');
              if (naBtn) naBtn.classList.add('is-active');
            }
          });
        }

        if (state.meta) {
          document.querySelectorAll('.meta-input').forEach(input => {
            const key = input.getAttribute('data-meta-key');
            if (key && state.meta[key]) {
              input.value = state.meta[key];
            }
          });
        }
      } catch (e) {
        console.warn('Failed to parse saved state:', e);
      }
    }

    // Bind metadata input saving
    function bindMetadataEvents() {
      document.querySelectorAll('.meta-input').forEach(input => {
        input.addEventListener('input', () => {
          saveState();
        });
      });
    }

    // Reset All Checkboxes Function
    function resetAllCheckboxes() {
      const confirmReset = window.confirm('Are you sure you want to reset all checkboxes in this runbook? This cannot be undone.');
      if (!confirmReset) return;

      document.querySelectorAll('.check-item').forEach(item => {
        item.classList.remove('status-done', 'status-na');
        const doneBtn = item.querySelector('.btn-done');
        const naBtn = item.querySelector('.btn-na');
        if (doneBtn) doneBtn.classList.remove('is-active');
        if (naBtn) naBtn.classList.remove('is-active');
      });

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      updateProgress();
      applyFilters();
      showToast('All checklist items have been reset');
    }

    // Filtering logic
    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.btn-filter').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      applyFilters();
    }

    // Search query logic
    function handleSearch(val) {
      searchQuery = (val || '').toLowerCase().trim();
      applyFilters();
    }

    function applyFilters() {
      const items = document.querySelectorAll('.check-item');
      items.forEach(item => {
        const isDone = item.classList.contains('status-done');
        const isNa = item.classList.contains('status-na');
        const isPending = !isDone && !isNa;

        let matchesFilter = true;
        if (currentFilter === 'done' && !isDone) matchesFilter = false;
        if (currentFilter === 'na' && !isNa) matchesFilter = false;
        if (currentFilter === 'pending' && !isPending) matchesFilter = false;

        let matchesSearch = true;
        if (searchQuery) {
          const text = item.textContent.toLowerCase();
          if (!text.includes(searchQuery)) matchesSearch = false;
        }

        if (matchesFilter && matchesSearch) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    }

    // Copy single code snippet
    function copySnippet(btn) {
      const pre = btn.closest('.code-preview').querySelector('pre code');
      if (!pre) return;
      navigator.clipboard.writeText(pre.textContent).then(() => {
        showToast('Command copied to clipboard');
      });
    }

    // Copy formatted Markdown summary
    function copyMarkdownReport() {
      const title = document.querySelector('.runbook-title').textContent.trim();
      let md = \`## \${title} Summary\\n\\n\`;
      
      // Add metadata if filled
      document.querySelectorAll('.meta-input').forEach(input => {
        const val = input.value.trim();
        if (val) {
          md += \`**\${input.getAttribute('data-meta-key')}:** \${val}  \\n\`;
        }
      });
      md += \`\\n\`;

      document.querySelectorAll('.runbook-section').forEach(sec => {
        const heading = sec.querySelector('.section-heading').textContent.trim();
        md += \`### \${heading}\\n\`;

        sec.querySelectorAll('.check-item').forEach(item => {
          const itemTitle = item.querySelector('.item-title').textContent.trim();
          let mark = '[ ]';
          if (item.classList.contains('status-done')) mark = '[x]';
          else if (item.classList.contains('status-na')) mark = '[-]';

          md += \`- \${mark} \${itemTitle}\\n\`;
        });
        md += \`\\n\`;
      });

      navigator.clipboard.writeText(md).then(() => {
        showToast('Markdown summary copied to clipboard!');
      }).catch(() => {
        showToast('Unable to copy to clipboard');
      });
    }

    // Show temporary toast message
    function showToast(msg) {
      const toast = document.getElementById('toast-message');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }
  </script>
</body>
</html>`;
}

// Generate Central Index Dashboard
function generateIndexHtml(runbooks) {
  const categories = {};
  runbooks.forEach(rb => {
    if (!categories[rb.category]) categories[rb.category] = [];
    categories[rb.category].push(rb);
  });

  let cardsHtml = '';
  runbooks.forEach(rb => {
    const isMustHave = rb.priority === 'Must-Have';
    const priorityClass = isMustHave ? 'badge-must-have' : (rb.priority === 'High Priority' ? 'badge-high-pri' : 'badge-supporting');
    const totalChecks = rb.sections.reduce((acc, s) => acc + s.items.length, 0);

    cardsHtml += `
      <div class="runbook-card" data-category="${rb.category}" data-priority="${rb.priority}" data-id="${rb.id}">
        <div class="card-header">
          <div class="card-badges">
            <span class="badge ${priorityClass}">${rb.priority}</span>
            <span class="badge badge-cat">${rb.category}</span>
          </div>
          <span class="check-count">${totalChecks} Checks</span>
        </div>

        <h3 class="card-title">
          <a href="${rb.filename}" class="card-link">${escapeHtml(rb.title)}</a>
        </h3>

        <p class="card-desc">${escapeHtml(rb.intro.substring(0, 160))}...</p>

        <div class="card-footer">
          <div class="live-progress-tag" data-rb-id="${rb.id}">
            <span class="dot-status"></span>
            <span class="progress-text">Not started</span>
          </div>
          <a href="${rb.filename}" class="btn-launch">
            <span>Open Runbook</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevOps Runbooks & Operational Checklists Portal</title>
  <meta name="description" content="Production-ready, offline-first interactive DevOps runbooks and checklists for incident response, deployments, disaster recovery, and operations.">
  <style>
    :root {
      --bg-page: #0b0f19;
      --bg-card: #131c2e;
      --bg-card-hover: #19253d;
      --border: #232f48;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --indigo: #6366f1;
      --emerald: #10b981;
      --sky: #38bdf8;
      --amber: #f59e0b;
      --radius: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-page);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
      padding: 36px 20px 80px 20px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Hero Banner */
    .hero-banner {
      background: linear-gradient(180deg, #18233c 0%, #111827 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 36px 32px;
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
    }

    .hero-title {
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      font-size: 16px;
      color: var(--text-muted);
      max-width: 820px;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .hero-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .hero-stat-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
    }

    .hero-stat-num {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
    }

    .hero-stat-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Filter & Search Bar */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-filter-pill {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-filter-pill.active, .btn-filter-pill:hover {
      background: var(--indigo);
      color: #fff;
      border-color: var(--indigo);
    }

    .search-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #fff;
      padding: 8px 14px;
      font-size: 13px;
      width: 260px;
      outline: none;
    }

    .search-box:focus {
      border-color: var(--indigo);
    }

    /* Grid of Runbooks */
    .runbooks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .runbook-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .runbook-card:hover {
      transform: translateY(-2px);
      border-color: #3b82f6;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .card-badges {
      display: flex;
      gap: 6px;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .badge-must-have {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-high-pri {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-supporting {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .badge-cat {
      background: rgba(148, 163, 184, 0.1);
      color: #cbd5e1;
      border: 1px solid var(--border);
    }

    .check-count {
      font-size: 11px;
      color: var(--text-muted);
      font-family: monospace;
    }

    .card-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .card-link {
      color: #fff;
      text-decoration: none;
    }

    .card-link:hover {
      color: var(--sky);
    }

    .card-desc {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-bottom: 20px;
      line-height: 1.5;
      flex-grow: 1;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }

    .live-progress-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .dot-status {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4b5563;
    }

    .btn-launch {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: #fff;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .btn-launch:hover {
      background: var(--indigo);
      border-color: var(--indigo);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Hero Banner -->
    <header class="hero-banner">
      <h1 class="hero-title">DevOps Runbooks & Operational Checklists</h1>
      <p class="hero-subtitle">
        Production-grade, offline-first interactive runbooks covering deployment safety, zero-downtime recovery, 3 AM incident triage, disaster recovery failover, and compliance audits. Each runbook is 100% self-contained and operates standalone in any browser.
      </p>

      <div class="hero-stats">
        <div class="hero-stat-card">
          <span class="hero-stat-num">${runbooks.length}</span>
          <span class="hero-stat-label">Total Runbooks</span>
        </div>
        <div class="hero-stat-card">
          <span class="hero-stat-num">5</span>
          <span class="hero-stat-label">Must-Have P0</span>
        </div>
        <div class="hero-stat-card">
          <span class="hero-stat-num">5</span>
          <span class="hero-stat-label">High Priority</span>
        </div>
        <div class="hero-stat-card">
          <span class="hero-stat-num">8</span>
          <span class="hero-stat-label">Supporting & Standards</span>
        </div>
      </div>
    </header>

    <!-- Filters & Search -->
    <div class="filter-bar">
      <div class="filter-pills">
        <button type="button" class="btn-filter-pill active" onclick="filterCards('all')">All Runbooks</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('Must-Have')">Must-Have (P0)</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('High Priority')">High Priority</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('Supporting')">Supporting</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('Deployment')">Deployment</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('Incident Response')">Incident Response</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('Disaster Recovery')">Disaster Recovery</button>
        <button type="button" class="btn-filter-pill" onclick="filterCards('Security')">Security</button>
      </div>

      <input type="text" class="search-box" placeholder="Search runbooks..." oninput="searchRunbooks(this.value)">
    </div>

    <!-- Cards Grid -->
    <main class="runbooks-grid" id="cards-container">
      ${cardsHtml}
    </main>
  </div>

  <script>
    let activeFilter = 'all';
    let searchTxt = '';

    // Check LocalStorage progress for each card
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.runbook-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const tag = card.querySelector('.live-progress-tag');
        const dot = tag.querySelector('.dot-status');
        const txt = tag.querySelector('.progress-text');

        try {
          const raw = localStorage.getItem('runbook_state_' + id);
          if (raw) {
            const data = JSON.parse(raw);
            const items = data.items || {};
            const doneCount = Object.values(items).filter(v => v === 'done').length;
            const naCount = Object.values(items).filter(v => v === 'na').length;
            const total = doneCount + naCount;

            if (total > 0) {
              txt.textContent = \`\${doneCount} Done, \${naCount} N/A\`;
              dot.style.background = '#10b981';
              dot.style.boxShadow = '0 0 6px #10b981';
            }
          }
        } catch (e) {}
      });
    });

    function filterCards(filter) {
      activeFilter = filter;
      document.querySelectorAll('.btn-filter-pill').forEach(btn => {
        if (btn.textContent.includes(filter) || (filter === 'all' && btn.textContent.includes('All'))) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      applyCardFilters();
    }

    function searchRunbooks(val) {
      searchTxt = (val || '').toLowerCase().trim();
      applyCardFilters();
    }

    function applyCardFilters() {
      const cards = document.querySelectorAll('.runbook-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const pri = card.getAttribute('data-priority');
        const cat = card.getAttribute('data-category');
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const desc = card.querySelector('.card-desc').textContent.toLowerCase();

        let matchesCat = (activeFilter === 'all') || (pri === activeFilter) || (cat === activeFilter);
        let matchesSearch = !searchTxt || title.includes(searchTxt) || desc.includes(searchTxt);

        if (matchesCat && matchesSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

// Generate comprehensive README.md
function generateReadme(runbooks) {
  let listMd = '';
  runbooks.forEach((rb, idx) => {
    listMd += `${idx + 1}. [${rb.title}](${rb.filename}) - *${rb.category} (${rb.priority})*\n`;
  });

  return `# DevOps Runbooks & Operational Checklists

A production-grade, standalone collection of interactive HTML checklists and runbooks for DevOps, Site Reliability Engineering (SRE), and Cloud Operations.

---

## 🚀 Key Features

- **Dual Front Controls:**
  - **Done Button:** Vibrant green tick (\`✓\`) when active.
  - **N/A Button:** Vibrant blue dash (\`—\`) when active.
  - Mutual exclusivity: selecting Done unselects N/A, and vice-versa.
- **Offline & Standalone:** Each HTML file is 100% self-contained. Anyone can download a single checklist file and open it locally in any browser with **zero internet or external dependencies**.
- **Auto-Saved Progress:** Seamlessly preserves checkbox and metadata state in your browser's \`localStorage\` across page reloads.
- **Reset Button:** Instant reset button at the bottom of every runbook to wipe all checkboxes and clear saved state.
- **Export & Share:**
  - **Copy Markdown Summary:** Formats the completed checklist into GitHub/Slack/Jira markdown with \`[x]\`, \`[-]\`, and \`[ ]\`.
  - **Print / PDF Ready:** Clean \`@media print\` stylesheet optimized for compliance audits and documentation.
- **Easy Code Customization:** Adding or editing checks is as simple as copying/pasting a \`<div class="check-item">\` block. The JavaScript dynamically binds all items automatically.

---

## 📂 Repository Structure

\`\`\`text
devops-runbooks/
├── index.html                           # Central Interactive Portal Dashboard
├── README.md                            # Documentation & Usage Guide
├── deployment/
│   ├── production-deployment.html       # 1. Production Deployment Checklist
│   ├── rollback.html                    # 2. Rollback & Failure Recovery Runbook
│   ├── database-migration.html          # 7. Database Migration / Schema Change
│   ├── canary-deployment.html           # 13. Blue-Green / Canary / Progressive Delivery
│   └── environment-promotion.html       # 15. Environment Promotion (Dev → Staging → Prod)
├── incident-response/
│   ├── 3am-outage.html                  # 3. Incident Response / 3 AM Outage Runbook
│   ├── severity-levels.html             # Incident Severity & Escalation Matrix
│   └── post-mortem-template.html        # 14. Post-Incident / Post-Mortem Process
├── disaster-recovery/
│   ├── dr-runbook.html                  # 4. Disaster Recovery (DR) Runbook
│   └── backup-restore.html              # 5. Backup & Restore Verification
├── security/
│   ├── secrets-rotation.html            # 8. Secrets & Certificate Rotation
│   ├── access-review.html               # 17. Access Review & Offboarding
│   └── security-compliance.html         # 11. Security / Compliance Baseline
├── onboarding/
│   └── new-service-checklist.html       # 9. New Service / Microservice Onboarding
├── on-call/
│   ├── oncall-handover.html             # 6. On-Call Handover & Alert Hygiene
│   └── observability-standards.html     # 16. Observability & Alerting Standards
└── operations/
    ├── capacity-scaling.html            # 10. Capacity & Scaling Runbook
    └── change-management-cab.html       # 12. Change Management / CAB Checklist
\`\`\`

---

## 📋 Included Runbooks

${listMd}

---

## 🛠️ How to Add or Edit Checks in Code

Every HTML file is designed to be easily modified directly in your text editor:

1. Open any \`.html\` file in your code editor (e.g. VS Code, Notepad).
2. Locate the section where you want to add an item.
3. Duplicate an existing \`<div class="check-item">\` block:

\`\`\`html
<div class="check-item" data-id="custom-check-1">
  <div class="check-controls">
    <button type="button" class="btn-check btn-done" data-action="done">
      <span class="icon-indicator"><svg ...></svg></span>
      <span class="btn-text">Done</span>
    </button>
    <button type="button" class="btn-check btn-na" data-action="na">
      <span class="icon-indicator"><svg ...></svg></span>
      <span class="btn-text">N/A</span>
    </button>
  </div>
  <div class="item-details">
    <div class="item-header-line">
      <span class="item-tag">#custom-check-1</span>
      <h4 class="item-title">Your Custom Step Title</h4>
    </div>
    <p class="item-desc">Explanation of what to do and how to verify it.</p>
    <div class="code-preview">
      <pre><code>kubectl get pods -n production</code></pre>
    </div>
  </div>
</div>
\`\`\`

4. Save the file. The progress bar, filters, counters, and reset button will recognize the new item automatically!

---

## 💡 Standalone Distribution

To distribute any runbook to team members:
Simply send them the single \`.html\` file. They can double click to open it directly in Chrome, Firefox, Safari, or Edge without any web server or network connection required.
`;
}

// Build all files
function buildAll() {
  console.log('Building DevOps Runbooks...');

  // 1. Build all individual runbooks
  runbooks.forEach(rb => {
    const destPath = path.join(ROOT_DIR, rb.filename);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const html = generateRunbookHtml(rb);
    fs.writeFileSync(destPath, html, 'utf-8');
    console.log(`✓ Built ${rb.filename}`);
  });

  // 2. Build index.html
  const indexPath = path.join(ROOT_DIR, 'index.html');
  fs.writeFileSync(indexPath, generateIndexHtml(runbooks), 'utf-8');
  console.log(`✓ Built index.html`);

  // 3. Build README.md
  const readmePath = path.join(ROOT_DIR, 'README.md');
  fs.writeFileSync(readmePath, generateReadme(runbooks), 'utf-8');
  console.log(`✓ Built README.md`);

  console.log('\\nAll runbooks successfully generated!');
}

buildAll();
