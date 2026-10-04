# DevOps Runbooks & Operational Checklists

A production-grade, standalone collection of interactive HTML checklists and runbooks for DevOps, Site Reliability Engineering (SRE), and Cloud Operations.

---

## 🚀 Key Features

- **Dual Front Controls:**
  - **Done Button:** Vibrant green tick (`✓`) when active.
  - **N/A Button:** Vibrant blue dash (`—`) when active.
  - Mutual exclusivity: selecting Done unselects N/A, and vice-versa.
- **Offline & Standalone:** Each HTML file is 100% self-contained. Anyone can download a single checklist file and open it locally in any browser with **zero internet or external dependencies**.
- **Auto-Saved Progress:** Seamlessly preserves checkbox and metadata state in your browser's `localStorage` across page reloads.
- **Reset Button:** Instant reset button at the bottom of every runbook to wipe all checkboxes and clear saved state.
- **Export & Share:**
  - **Copy Markdown Summary:** Formats the completed checklist into GitHub/Slack/Jira markdown with `[x]`, `[-]`, and `[ ]`.
  - **Print / PDF Ready:** Clean `@media print` stylesheet optimized for compliance audits and documentation.
- **Easy Code Customization:** Adding or editing checks is as simple as copying/pasting a `<div class="check-item">` block. The JavaScript dynamically binds all items automatically.

---

## 📂 Repository Structure

```text
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
```

---

## 📋 Included Runbooks

1. [Production Deployment Checklist](deployment/production-deployment.html) - *Deployment (Must-Have)*
2. [Rollback & Failure Recovery Runbook](deployment/rollback.html) - *Deployment (Must-Have)*
3. [Incident Response / 3 AM Outage Runbook](incident-response/3am-outage.html) - *Incident Response (Must-Have)*
4. [Disaster Recovery (DR) Runbook](disaster-recovery/dr-runbook.html) - *Disaster Recovery (Must-Have)*
5. [Backup & Restore Verification Runbook](disaster-recovery/backup-restore.html) - *Disaster Recovery (Must-Have)*
6. [On-Call Handover & Alert Hygiene Runbook](on-call/oncall-handover.html) - *On-Call (High Priority)*
7. [Database Migration / Schema Change Runbook](deployment/database-migration.html) - *Deployment (High Priority)*
8. [Secrets & Certificate Rotation Runbook](security/secrets-rotation.html) - *Security (High Priority)*
9. [New Service / Microservice Onboarding Runbook](onboarding/new-service-checklist.html) - *Onboarding (High Priority)*
10. [Capacity & Scaling Runbook](operations/capacity-scaling.html) - *Operations (High Priority)*
11. [Security & Compliance Baseline Runbook](security/security-compliance.html) - *Security (Supporting)*
12. [Change Management / CAB Checklist Runbook](operations/change-management-cab.html) - *Operations (Supporting)*
13. [Blue-Green / Canary / Progressive Delivery Runbook](deployment/canary-deployment.html) - *Deployment (Supporting)*
14. [Post-Incident / Post-Mortem Process Runbook](incident-response/post-mortem-template.html) - *Incident Response (Supporting)*
15. [Environment Promotion (Dev → Staging → Prod) Runbook](deployment/environment-promotion.html) - *Deployment (Supporting)*
16. [Observability & Alerting Standards Runbook](on-call/observability-standards.html) - *On-Call (Supporting)*
17. [Access Review & Offboarding Runbook](security/access-review.html) - *Security (Supporting)*
18. [Incident Severity Levels & Escalation Matrix](incident-response/severity-levels.html) - *Incident Response (Supporting)*


---

## 🛠️ How to Add or Edit Checks in Code

Every HTML file is designed to be easily modified directly in your text editor:

1. Open any `.html` file in your code editor (e.g. VS Code, Notepad).
2. Locate the section where you want to add an item.
3. Duplicate an existing `<div class="check-item">` block:

```html
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
```

4. Save the file. The progress bar, filters, counters, and reset button will recognize the new item automatically!

---

## 💡 Standalone Distribution

To distribute any runbook to team members:
Simply send them the single `.html` file. They can double click to open it directly in Chrome, Firefox, Safari, or Edge without any web server or network connection required.
