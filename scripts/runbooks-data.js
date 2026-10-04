// scripts/generate.js
// High-fidelity generator for DevOps Standalone HTML Runbooks

const fs = require('fs');
const path = require('path');

const runbooks = [
  // ==========================================
  // MUST-HAVE (1 - 5)
  // ==========================================
  {
    id: 'prod-deploy',
    filename: 'deployment/production-deployment.html',
    title: 'Production Deployment Checklist',
    category: 'Deployment',
    priority: 'Must-Have',
    badge: 'Production Release',
    intro: 'Comprehensive operational checklist for deploying code and infrastructure changes into production environments. Use before initiating a deployment window, during traffic rollout, and during post-release verification to ensure zero unexpected outages, full stakeholder visibility, and strict compliance sign-off.',
    meta: [
      { label: 'Target Service', placeholder: 'e.g. auth-service, checkout-api' },
      { label: 'Release Version', placeholder: 'e.g. v2.14.0 or commit SHA' },
      { label: 'Deploy Lead', placeholder: 'Engineer name' },
      { label: 'Change Ticket', placeholder: 'e.g. JIRA-4029 / RFC-108' }
    ],
    sections: [
      {
        title: 'Phase 1: Pre-Flight Checks & Approvals',
        description: 'Verify all operational prerequisites, stakeholder sign-offs, and environmental health before touching production.',
        items: [
          {
            id: 'pd-1',
            title: 'Change Approval Board (CAB) & Ticket Status',
            desc: 'Verify that the Change Ticket is formally approved by CAB or authorized peer reviewer, and the scheduled deployment window is active.',
            code: 'jira issue view PROD-DEPLOY-4421 --output json | jq .fields.status.name'
          },
          {
            id: 'pd-2',
            title: 'Code Freeze & Release Branch Parity',
            desc: 'Confirm the release branch has passed all CI unit, integration, and security scans with no merge conflicts or untested commits.',
            code: 'git diff origin/main...origin/release-v2.14.0 --stat'
          },
          {
            id: 'pd-3',
            title: 'Staging Environment Acceptance Sign-Off',
            desc: 'Confirm QA, product owner, and automated E2E tests have passed 100% in the Staging/Pre-production environment.',
            code: 'curl -s https://staging.internal.net/health | jq .status'
          },
          {
            id: 'pd-4',
            title: 'On-Call & Stakeholder Notification',
            desc: 'Post deployment announcement in #engineering-releases and #on-call Slack channels, listing primary operator, target services, and war room link.',
            code: '# Format: "[DEPLOY STARTING] Service: payments-api v2.14.0 | Owner: @oncall-eng"'
          },
          {
            id: 'pd-5',
            title: 'Production Telemetry Baseline Verification',
            desc: 'Check Datadog/Grafana dashboards to ensure production cluster is healthy, error rates are < 0.05%, and no active Sev1/Sev2 alerts are firing.',
            code: 'kubectl get nodes && kubectl top nodes'
          }
        ]
      },
      {
        title: 'Phase 2: Database, Migrations & Feature Flags',
        description: 'Safely handle database schema transformations, backwards compatibility, and feature toggle states.',
        items: [
          {
            id: 'pd-6',
            title: 'Production Database Backup / Snapshot',
            desc: 'Take or verify a fresh Point-in-Time (PITR) backup snapshot of production databases before applying any schema changes.',
            code: 'aws rds create-db-snapshot --db-instance-identifier prod-postgres --db-snapshot-identifier pre-deploy-v2-14-0'
          },
          {
            id: 'pd-7',
            title: 'Execute Backward-Compatible Migrations (Expand Phase)',
            desc: 'Run database schema migration scripts ensuring non-blocking operations (e.g. ADD COLUMN nullable, CONCURRENT index creation).',
            code: 'flyway migrate -url="jdbc:postgresql://prod-db:5432/app" -locations="filesystem:./migrations"'
          },
          {
            id: 'pd-8',
            title: 'Feature Flags Configured in Dark / Default-Off State',
            desc: 'Verify in LaunchDarkly / Unleash that all newly introduced features are disabled for general traffic and scoped to internal canary users only.',
            code: 'curl -s -H "Authorization: $LD_API_KEY" https://app.launchdarkly.com/api/v2/flags/default/new-checkout-flow'
          },
          {
            id: 'pd-9',
            title: 'Secrets & Environment Variables Synchronized',
            desc: 'Confirm HashiCorp Vault / AWS Secrets Manager / K8s Secrets contain all new keys required by the upcoming version before rollout.',
            code: 'vault kv get -mount=secret prod/payments-api'
          }
        ]
      },
      {
        title: 'Phase 3: Rollout Execution & Traffic Shift',
        description: 'Execute progressive release strategy (Canary or Rolling) with automated canary health monitoring.',
        items: [
          {
            id: 'pd-10',
            title: 'Deploy to Canary / Staged Replicas (5% Traffic)',
            desc: 'Trigger deployment of new container image to canary workload or update Argo Rollouts / Kubernetes Deployment.',
            code: 'kubectl set image deployment/payments-api payments-api=registry.company.com/payments-api:v2.14.0 --record'
          },
          {
            id: 'pd-11',
            title: 'Canary Metric Soak & Error Rate Verification (10 min)',
            desc: 'Observe HTTP 5xx error rate, p99 latency, and container CPU/memory usage on the canary pods compared to stable baseline.',
            code: 'kubectl logs -l app=payments-api,version=v2.14.0 --tail=100 -f'
          },
          {
            id: 'pd-12',
            title: 'Promote Traffic to 50% and 100%',
            desc: 'Gradually increase traffic percentage to 50%, then promote to 100% full production traffic once canary metrics match SLA.',
            code: 'kubectl argo rollouts promote payments-api || kubectl rollout status deployment/payments-api'
          },
          {
            id: 'pd-13',
            title: 'Verify Pod Health & Zero CrashLoopBackOffs',
            desc: 'Confirm all pods are in Ready state (1/1), zero restarts occurred during rolling replacement, and replica count matches target.',
            code: 'kubectl get pods -l app=payments-api -o wide'
          }
        ]
      },
      {
        title: 'Phase 4: Post-Deployment Smoke Tests & Sign-Off',
        description: 'Validate critical customer journeys, synthetic monitors, and formally close the change window.',
        items: [
          {
            id: 'pd-14',
            title: 'Execute Automated Production Smoke Test Suite',
            desc: 'Run end-to-end synthetic health checks targeting critical paths: authentication, payment processing, data retrieval, and logout.',
            code: 'npm run test:smoke:production'
          },
          {
            id: 'pd-15',
            title: 'Monitor APM & Error Tracking (Sentry / Datadog)',
            desc: 'Actively monitor Sentry for any new unhandled exception signatures or sudden spikes in error budgets for 15 minutes post-deploy.',
            code: '# Monitor Sentry Issues dashboard filtered by release: v2.14.0'
          },
          {
            id: 'pd-16',
            title: 'Clean Up Stale Resources & Invalidate CDN Caches',
            desc: 'If frontend or static assets were updated, purge CDN edge caches (Cloudflare / CloudFront) to prevent cached script mismatches.',
            code: 'aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"'
          },
          {
            id: 'pd-17',
            title: 'Post Deployment Success Announcement & Close Ticket',
            desc: 'Update #engineering-releases with final deploy status, link to changelog, and transition CAB change ticket to "Completed".',
            code: 'jira issue transition PROD-DEPLOY-4421 --transition "Closed"'
          }
        ]
      }
    ]
  },

  {
    id: 'rollback-recovery',
    filename: 'deployment/rollback.html',
    title: 'Rollback & Failure Recovery Runbook',
    category: 'Deployment',
    priority: 'Must-Have',
    badge: 'Failure Recovery',
    intro: 'Fast, deterministic procedure for reversing a destabilizing production deployment. Use immediately when automated health checks fail, error rates exceed defined rollback thresholds, or critical business workflows break post-release.',
    meta: [
      { label: 'Impacted Service', placeholder: 'e.g. auth-service' },
      { label: 'Failed Release', placeholder: 'e.g. v2.14.0' },
      { label: 'Target Rollback Version', placeholder: 'e.g. v2.13.9 (Last Known Good)' },
      { label: 'Recovery Lead', placeholder: 'Incident Commander / SRE' }
    ],
    sections: [
      {
        title: 'Phase 1: Rollback Decision & War Room Mobilization',
        description: 'Evaluate criteria, declare rollback, and halt any ongoing CI/CD deployment pipelines immediately.',
        items: [
          {
            id: 'rb-1',
            title: 'Evaluate Rollback Thresholds',
            desc: 'Verify if any rollback criteria are met: HTTP 5xx error rate > 1%, p99 latency spike > 3x, core transaction failures, or pod crash loops.',
            code: '# Criteria: Error rate > 1% for 3+ consecutive minutes OR critical flow down'
          },
          {
            id: 'rb-2',
            title: 'Declare Rollback & Freeze Deployment Pipeline',
            desc: 'Announce rollback in #engineering-releases and incident channel. Immediately lock CI/CD pipelines to prevent concurrent deploy jobs.',
            code: '# Post: "🚨 INITIATING ROLLBACK for payments-api from v2.14.0 -> v2.13.9"'
          },
          {
            id: 'rb-3',
            title: 'Capture Diagnostic State (Logs, Core Dumps, Metrics)',
            desc: 'Snapshot current error logs, failing request samples, and container logs before rolling back so engineering can debug later.',
            code: 'kubectl logs -l app=payments-api --tail=1000 > failed-deploy-v2-14-0.log'
          }
        ]
      },
      {
        title: 'Phase 2: Workload & Ingress Traffic Reversion',
        description: 'Revert container workloads to the last known good version and shift ingress traffic.',
        items: [
          {
            id: 'rb-4',
            title: 'Rollback Kubernetes / Container Deployment',
            desc: 'Execute immediate Kubernetes rollout undo or redeploy the previous stable Docker image tag.',
            code: 'kubectl rollout undo deployment/payments-api --to-revision=0'
          },
          {
            id: 'rb-5',
            title: 'Revert Traffic Router / Service Mesh / Ingress',
            desc: 'If using Blue-Green or Canary (Argo/Istio), immediately route 100% of ingress traffic back to the stable blue service pool.',
            code: 'kubectl argo rollouts abort payments-api && kubectl argo rollouts set-weight payments-api 0'
          },
          {
            id: 'rb-6',
            title: 'Verify Stable Pods are Ready & Healthy',
            desc: 'Monitor pod replacement in real time. Ensure old pods terminate gracefully and previous stable pods pass readiness probes.',
            code: 'kubectl rollout status deployment/payments-api --timeout=120s'
          }
        ]
      },
      {
        title: 'Phase 3: Database & State Reversion',
        description: 'Handle data layer implications, schema rollbacks, and message queues safely.',
        items: [
          {
            id: 'rb-7',
            title: 'Assess Database Compatibility with Previous Code',
            desc: 'Determine whether database changes are backward-compatible. If expand-contract was followed, DO NOT rollback DB immediately as it supports old code.',
            code: '# Rule: If new columns/tables were added additively, leave them in place.'
          },
          {
            id: 'rb-8',
            title: 'Execute Down-Migration Script (If Strictly Required)',
            desc: 'If destructive or non-compatible schema changes were executed, run verified down-migration scripts or restore point-in-time snapshot.',
            code: 'flyway undo || npm run migrate:down'
          },
          {
            id: 'rb-9',
            title: 'Purge / Invalidate Caching Layer',
            desc: 'Clear Redis/Memcached keys and CDN caches that might have stored corrupted payloads or incompatible schema responses.',
            code: 'redis-cli -h prod-cache.internal FLUSHDB || redis-cli KEYS "cache:user:*" | xargs redis-cli DEL'
          },
          {
            id: 'rb-10',
            title: 'Drain & Replay Poison Messages in Dead Letter Queue (DLQ)',
            desc: 'Inspect RabbitMQ/Kafka/SQS dead letter queues for failed messages ingested during bad deploy; pause consumers if needed.',
            code: 'aws sqs get-queue-attributes --queue-url $DLQ_URL --attribute-names ApproximateNumberOfMessages'
          }
        ]
      },
      {
        title: 'Phase 4: Post-Rollback Health & Communication',
        description: 'Confirm production stability has returned to normal and initiate incident post-mortem.',
        items: [
          {
            id: 'rb-11',
            title: 'Run End-to-End Smoke Tests on Restored Version',
            desc: 'Execute synthetic integration tests against the rolled-back service to verify all core customer flows work as expected.',
            code: 'npm run test:smoke:production'
          },
          {
            id: 'rb-12',
            title: 'Confirm Telemetry & Error Rates Return to Baseline',
            desc: 'Verify Datadog/Grafana error rate is back below 0.05%, p99 latency returned to nominal, and no new Sentry issues appear.',
            code: '# Check APM dashboard for 10 consecutive minutes of stable green metrics'
          },
          {
            id: 'rb-13',
            title: 'Publish All-Clear Communication',
            desc: 'Notify stakeholders in #engineering-releases and #on-call that rollback is complete and service is fully restored.',
            code: '# Post: "✅ ROLLBACK COMPLETE: payments-api restored to v2.13.9. Telemetry nominal."'
          },
          {
            id: 'rb-14',
            title: 'Schedule Post-Mortem & Preserve Diagnostics',
            desc: 'Tag failed build, ensure logs/traces are preserved, and create a Post-Mortem Jira ticket for review within 48 hours.',
            code: 'jira issue create --project INCIDENT --summary "Failed release v2.14.0 Post-Mortem" --type Task'
          }
        ]
      }
    ]
  },

  {
    id: '3am-outage',
    filename: 'incident-response/3am-outage.html',
    title: 'Incident Response / 3 AM Outage Runbook',
    category: 'Incident Response',
    priority: 'Must-Have',
    badge: '3 AM Outage / P1',
    intro: 'Standard emergency procedure for triaging and resolving critical off-hours production outages. Use when woken up by high-severity PagerDuty alerts, major infrastructure failures, or customer-impacting downtime during night shifts.',
    meta: [
      { label: 'Incident Title', placeholder: 'e.g. Core API 500 Outage' },
      { label: 'Incident Commander', placeholder: 'Your Name' },
      { label: 'Severity Level', placeholder: 'Sev1 / Sev2 / Sev3' },
      { label: 'Incident Slack Channel', placeholder: 'e.g. #inc-20261004-api-outage' }
    ],
    sections: [
      {
        title: 'Step 1: First 5 Minutes (Triage & Verification)',
        description: 'Wake up, confirm the alert is authentic, and claim incident ownership without panic.',
        items: [
          {
            id: 'ir-1',
            title: 'Acknowledge Alert in PagerDuty / Opsgenie',
            desc: 'Acknowledge the alert within 5 minutes to prevent automatic escalation to secondary on-call and engineering management.',
            code: '# Press ACK on PagerDuty mobile app or respond to phone page'
          },
          {
            id: 'ir-2',
            title: 'Validate Customer Impact (Is it Real?)',
            desc: 'Check live health endpoints, synthetic monitors, and Datadog APM to confirm active degradation vs a false-positive telemetry blip.',
            code: 'curl -Iv https://api.yourdomain.com/healthz'
          },
          {
            id: 'ir-3',
            title: 'Assume Incident Commander (IC) Role',
            desc: 'Explicitly declare yourself as Incident Commander in Slack to provide clear leadership and prevent duplicated efforts.',
            code: '# Post in #incident-response: "Taking IC role for alert: Payments API Latency. Investigating now."'
          }
        ]
      },
      {
        title: 'Step 2: War Room & Communication Setup',
        description: 'Establish dedicated communication lines and classify the incident severity.',
        items: [
          {
            id: 'ir-4',
            title: 'Spin Up Incident War Room & Channel',
            desc: 'Create dedicated Slack channel #inc-YYYYMMDD-<name> and start a Google Meet / Zoom bridge for real-time collaboration.',
            code: '# Slack slash command: /incident start "Payments API 500 Spike"'
          },
          {
            id: 'ir-5',
            title: 'Classify Incident Severity (Sev1 vs Sev2)',
            desc: 'Sev1: Complete customer outage or revenue halt. Sev2: Significant feature degradation with workaround. Sev3: Minor issue.',
            code: '# If revenue/customers affected > 25% -> SEV-1. Page Engineering VP & SRE leads.'
          },
          {
            id: 'ir-6',
            title: 'Assign Communications Lead & Update Status Page',
            desc: 'Assign a secondary engineer or comms lead to draft internal updates and post initial advisory on status.company.com.',
            code: '# Status: "Investigating - We are currently experiencing elevated error rates across Core API."'
          },
          {
            id: 'ir-7',
            title: 'Page Subject Matter Experts (SMEs)',
            desc: 'If root cause is outside primary domain (e.g. Postgres DB lock, AWS region outage), page the dedicated secondary database/infra SME.',
            code: '# Use PagerDuty: Escalate to Policy "Database-OnCall" or "Infrastructure-OnCall"'
          }
        ]
      },
      {
        title: 'Step 3: Rapid Diagnosis & Stop-the-Bleeding',
        description: 'Focus exclusively on restoring customer service. Do not troubleshoot root cause if mitigation is available.',
        items: [
          {
            id: 'ir-8',
            title: 'Check Recent Deployments & Infrastructure Changes',
            desc: '90% of outages follow recent code deployments or config changes. Check git log, ArgoCD syncs, and AWS CloudTrail.',
            code: 'kubectl get deployments -A -o json | jq -r \'.items[] | "\\(.metadata.namespace)/\\(.metadata.name) \\(.metadata.creationTimestamp)"\''
          },
          {
            id: 'ir-9',
            title: 'Inspect Kubernetes Pod Status & Node Health',
            desc: 'Check for OOMKilled pods, CrashLoopBackOffs, eviction storms, or disk pressure across worker nodes.',
            code: 'kubectl get pods -A --field-selector=status.phase!=Running'
          },
          {
            id: 'ir-10',
            title: 'Inspect Database Locks & Active Connections',
            desc: 'Check if PostgreSQL/MySQL connection pools are saturated or long-running queries are holding exclusive table locks.',
            code: 'SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != \'idle\' ORDER BY 2 DESC LIMIT 10;'
          },
          {
            id: 'ir-11',
            title: 'Apply Circuit Breaker or Emergency Rate Limiting',
            desc: 'If suffering from traffic surge or DDoS, enable Cloudflare Under Attack mode or adjust ingress rate-limiting rules.',
            code: 'kubectl scale deployment/ingress-nginx-controller --replicas=10'
          },
          {
            id: 'ir-12',
            title: 'Execute Immediate Mitigation (Rollback, Restart, or Failover)',
            desc: 'Choose fastest path to restore service: 1) Rollback recent deployment, 2) Restart crashing pods, or 3) Failover DB to replica.',
            code: 'kubectl rollout undo deployment/<service-name> || kubectl rollout restart deployment/<service-name>'
          }
        ]
      },
      {
        title: 'Step 4: Verification, Stand-Down & Next Steps',
        description: 'Confirm telemetry stability, stand down the war room, and schedule the blameless post-mortem.',
        items: [
          {
            id: 'ir-13',
            title: 'Soak Telemetry for 15 Consecutive Minutes',
            desc: 'Ensure HTTP 5xx error rate drops back to zero, p95 latency stabilizes, and queue depths drain completely before declaring resolution.',
            code: '# Monitor Grafana Golden Signals dashboard'
          },
          {
            id: 'ir-14',
            title: 'Update Public Status Page to "Resolved"',
            desc: 'Publish resolution notice: "Service has been fully restored. All systems are operating normally. Monitoring recovery."',
            code: '# Update status.company.com to Operational'
          },
          {
            id: 'ir-15',
            title: 'Archive War Room Logs & Chat History',
            desc: 'Export Slack channel messages, thread notes, and incident timeline entries into an incident document for the post-mortem.',
            code: '# Save Slack canvas or incident thread links into Jira ticket'
          },
          {
            id: 'ir-16',
            title: 'Schedule Blameless Post-Mortem Meeting',
            desc: 'Schedule meeting with incident participants within 48 hours. Ensure on-call engineer takes rest before standard working hours.',
            code: '# Rule: On-call engineer woken up at 3 AM gets mandatory rest offset the following day.'
          }
        ]
      }
    ]
  },

  {
    id: 'dr-runbook',
    filename: 'disaster-recovery/dr-runbook.html',
    title: 'Disaster Recovery (DR) Runbook',
    category: 'Disaster Recovery',
    priority: 'Must-Have',
    badge: 'Regional Failover / DR',
    intro: 'Disaster recovery execution guide for recovering mission-critical workloads in the event of an unrecoverable primary region or data center failure. Use when cloud provider regional outages occur, catastrophic data corruption takes place, or official executive leadership declares a DR event.',
    meta: [
      { label: 'Primary Region', placeholder: 'e.g. us-east-1 (N. Virginia)' },
      { label: 'DR / Secondary Region', placeholder: 'e.g. us-west-2 (Oregon)' },
      { label: 'Target RTO / RPO', placeholder: 'RTO: < 60 min | RPO: < 15 min' },
      { label: 'DR Incident Lead', placeholder: 'Lead SRE / VP Eng' }
    ],
    sections: [
      {
        title: 'Phase 1: Disaster Declaration & RTO/RPO Targets',
        description: 'Validate failure severity, formally declare DR, and track execution against recovery targets.',
        items: [
          {
            id: 'dr-1',
            title: 'Validate Regional Failure & Cloud Health Status',
            desc: 'Confirm unrecoverable outage with cloud provider status dashboard (AWS Health / Azure Status), checking multi-AZ infrastructure loss.',
            code: 'aws health describe-events --filter "services=EC2,RDS,regions=us-east-1"'
          },
          {
            id: 'dr-2',
            title: 'Formal Disaster Declaration & Exec Sign-Off',
            desc: 'Disaster declaration must be authorized by VP of Engineering / CTO based on RTO threshold (primary downtime expected > 45 mins).',
            code: '# Record Timestamp: RTO clock begins NOW. Target: Full recovery within 60 minutes.'
          },
          {
            id: 'dr-3',
            title: 'Establish DR War Room & Leadership Briefings',
            desc: 'Open dedicated voice conference for DR team; assign dedicated scribe to record all commands, timestamps, and outcomes.',
            code: '# Slack: #dr-emergency-failover | Conference: Bridge #1'
          }
        ]
      },
      {
        title: 'Phase 2: Data Tier Failover & Replication Sync',
        description: 'Promote cross-region database replicas and verify transaction consistency.',
        items: [
          {
            id: 'dr-4',
            title: 'Check Cross-Region Replication Lag (Measure RPO)',
            desc: 'Inspect replication lag on secondary database read replica in us-west-2 to determine exact data delta / RPO loss.',
            code: 'aws rds describe-db-instances --db-instance-identifier prod-db-us-west-2 --query "DBInstances[0].StatusInfos"'
          },
          {
            id: 'dr-5',
            title: 'Promote Secondary Database Replica to Standalone Primary',
            desc: 'Execute RDS/Aurora/PostgreSQL cross-region read replica promotion to transform secondary instance into writeable master.',
            code: 'aws rds promote-read-replica --db-instance-identifier prod-db-us-west-2'
          },
          {
            id: 'dr-6',
            title: 'Verify Database Promotion Status & Connection Endpoint',
            desc: 'Wait for database status to transition to "available" and retrieve the new writeable database connection string.',
            code: 'aws rds wait db-instance-available --db-instance-identifier prod-db-us-west-2'
          },
          {
            id: 'dr-7',
            title: 'Point Secondary Redis / Elasticache Cluster to Master',
            desc: 'If multi-region replication is configured for Redis/Memcached, promote secondary cache cluster to primary or initialize clean cluster.',
            code: 'aws elasticache modify-replication-group --replication-group-id prod-cache-dr --primary-cluster-id prod-cache-dr-001'
          }
        ]
      },
      {
        title: 'Phase 3: Workload Scaling & Infrastructure Activation',
        description: 'Scale up standby compute clusters and ensure microservice workloads are operational.',
        items: [
          {
            id: 'dr-8',
            title: 'Scale Secondary Kubernetes Node Pools (EKS / GKE)',
            desc: 'Scale up node group autoscalers in the DR region from warm standby capacity to full production scale.',
            code: 'aws autoscaling set-desired-capacity --auto-scaling-group-name eks-dr-nodepool --desired-capacity 24'
          },
          {
            id: 'dr-9',
            title: 'Synchronize Secrets & Vault in DR Region',
            desc: 'Confirm HashiCorp Vault / AWS Secrets Manager in secondary region is unsealed and contains active application credentials.',
            code: 'vault status -address=https://vault.us-west-2.internal:8200'
          },
          {
            id: 'dr-10',
            title: 'Scale Kubernetes Deployments & Workloads',
            desc: 'Scale application deployments in DR cluster to target replica count or trigger ArgoCD sync for DR cluster profile.',
            code: 'kubectl --context=dr-cluster scale deployment --all --replicas=6 -n production'
          },
          {
            id: 'dr-11',
            title: 'Verify Microservice Health Checks in DR Region',
            desc: 'Execute regional curl tests against internal load balancers to confirm all pods are 200 OK and connected to the newly promoted database.',
            code: 'curl -k https://internal-nlb.us-west-2.internal/healthz'
          }
        ]
      },
      {
        title: 'Phase 4: Traffic Cutover & Post-Failover Validation',
        description: 'Reroute global public DNS, validate customer journeys, and prepare reverse sync.',
        items: [
          {
            id: 'dr-12',
            title: 'Execute Global DNS Cutover (Route 53 / Cloudflare)',
            desc: 'Update DNS failover records or switch Cloudflare Origin Pool to point to the secondary region load balancer.',
            code: 'aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch file://dns-failover-dr.json'
          },
          {
            id: 'dr-13',
            title: 'Flush Public DNS & CDN Cache',
            desc: 'Purge Cloudflare/Fastly edge caches to ensure immediate DNS propagation across global edge locations.',
            code: 'curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" -H "Authorization: Bearer $CF_TOKEN" --data \'{"purge_everything":true}\''
          },
          {
            id: 'dr-14',
            title: 'Execute Comprehensive Smoke & Transaction Tests',
            desc: 'Execute real transaction tests (create account, login, checkout) to confirm end-to-end functionality in DR environment.',
            code: 'npm run test:dr:smoke'
          },
          {
            id: 'dr-15',
            title: 'Verify RTO / RPO Metrics & Publish Executive Update',
            desc: 'Calculate total recovery time against RTO target (< 60m) and data delta against RPO target (< 15m). Notify leadership.',
            code: '# Document: "DR Failover to us-west-2 successful in 41 minutes (RTO target met). Data loss: 0 seconds (RPO target met)."'
          },
          {
            id: 'dr-16',
            title: 'Initiate Reverse Replication Safeguards',
            desc: 'Configure reverse database backup snapshots and replication planning so data created in DR region can be safely synced back later.',
            code: 'aws rds create-db-snapshot --db-instance-identifier prod-db-us-west-2 --db-snapshot-identifier dr-active-baseline-01'
          }
        ]
      }
    ]
  },

  {
    id: 'backup-restore',
    filename: 'disaster-recovery/backup-restore.html',
    title: 'Backup & Restore Verification Runbook',
    category: 'Disaster Recovery',
    priority: 'Must-Have',
    badge: 'Backup Audit',
    intro: 'Operational verification checklist for proving that system backups are not just being taken, but can be restored and validated successfully. Use for monthly restore drills, SOC2/ISO compliance audits, and pre-major database maintenance dry runs.',
    meta: [
      { label: 'Database System', placeholder: 'e.g. Postgres RDS / MongoDB Atlas' },
      { label: 'Snapshot ID / Date', placeholder: 'e.g. rds:prod-db-2026-10-04-03-00' },
      { label: 'Restore Target Sandbox', placeholder: 'e.g. restore-sandbox-test-instance' },
      { label: 'Auditing Engineer', placeholder: 'Your Name' }
    ],
    sections: [
      {
        title: 'Phase 1: Backup Generation & Snapshot Inventory',
        description: 'Verify automated backup routines, immutability, and cross-region replication status.',
        items: [
          {
            id: 'br-1',
            title: 'Verify Daily Snapshot Creation & Retention Compliance',
            desc: 'Confirm automated database snapshots ran on schedule within the last 24 hours and meet the 30-day retention policy.',
            code: 'aws rds describe-db-snapshots --db-instance-identifier prod-postgres --snapshot-type automated --query "reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[0]"'
          },
          {
            id: 'br-2',
            title: 'Verify WAL / Binlog Archival Streaming',
            desc: 'Confirm Write-Ahead Logs (WAL) or binary logs are continuously uploading to S3/GCS without gaps for Point-In-Time Recovery (PITR).',
            code: 'aws s3 ls s3://company-prod-wal-backups/postgres/ --recursive | tail -n 10'
          },
          {
            id: 'br-3',
            title: 'Confirm Cross-Region / Cross-Account Snapshot Copy',
            desc: 'Verify that production snapshots are automatically replicated to a secondary disaster recovery account for ransomware protection.',
            code: 'aws rds describe-db-snapshots --region us-west-2 --include-shared'
          },
          {
            id: 'br-4',
            title: 'Verify Object Storage Versioning & S3 Object Lock',
            desc: 'Confirm critical backup buckets have object versioning and WORM (Write Once Read Many) immutability enabled.',
            code: 'aws s3api get-object-lock-configuration --bucket company-db-backups'
          }
        ]
      },
      {
        title: 'Phase 2: Restore to Isolated Sandbox Environment',
        description: 'Perform actual restore into an isolated non-production network and benchmark restore duration.',
        items: [
          {
            id: 'br-5',
            title: 'Create Ephemeral Sandbox Security Group & Subnet',
            desc: 'Ensure sandbox restore target is strictly isolated in a private subnet with zero external internet routing.',
            code: 'export SUBNET_GROUP="sandbox-db-subnets" && export SG_ID="sg-isolated-restore"'
          },
          {
            id: 'br-6',
            title: 'Trigger Snapshot Restore to Sandbox Instance',
            desc: 'Initiate database restore from the latest snapshot into a new standalone test instance, starting a timer to measure RTO.',
            code: 'aws rds restore-db-instance-from-db-snapshot --db-instance-identifier test-restore-db --db-snapshot-identifier rds:prod-db-snapshot-latest --db-subnet-group-name $SUBNET_GROUP'
          },
          {
            id: 'br-7',
            title: 'Benchmark Restore Duration vs SLA Target',
            desc: 'Record elapsed time until restored instance reaches "available" state. Compare against agreed service RTO target.',
            code: 'time aws rds wait db-instance-available --db-instance-identifier test-restore-db'
          }
        ]
      },
      {
        title: 'Phase 3: Data Integrity & Checksum Verification',
        description: 'Prove that the restored database is structurally sound, uncorrupted, and contains valid records.',
        items: [
          {
            id: 'br-8',
            title: 'Execute Table Row Count & Checksum Audits',
            desc: 'Run validation script comparing row counts across core business tables against known production metrics at snapshot time.',
            code: 'SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 15;'
          },
          {
            id: 'br-9',
            title: 'Verify Foreign Key Constraints & Index Validity',
            desc: 'Check that database indexes and foreign keys are valid and not marked as corrupted or invalid post-restore.',
            code: 'SELECT indexrelid::regclass, indisvalid FROM pg_index WHERE indisvalid = false;'
          },
          {
            id: 'br-10',
            title: 'Test Sample Point-In-Time Recovery (PITR) Accuracy',
            desc: 'Perform test query verifying data exists precisely up to the target timestamp of the point-in-time recovery window.',
            code: 'SELECT MAX(created_at) FROM orders; -- Must match PITR target timestamp within 5 minutes'
          }
        ]
      },
      {
        title: 'Phase 4: Cleanup & Compliance Certification',
        description: 'Tear down ephemeral sandbox resources and log verification proof for audits.',
        items: [
          {
            id: 'br-11',
            title: 'Tear Down Ephemeral Sandbox Instance',
            desc: 'Terminate test restored database instance immediately to avoid cloud cost waste and sensitive data exposure.',
            code: 'aws rds delete-db-instance --db-instance-identifier test-restore-db --skip-final-snapshot'
          },
          {
            id: 'br-12',
            title: 'Log Verification Record in SOC2 Compliance Register',
            desc: 'Record test date, snapshot ID, restore duration (RTO), data completeness (RPO), and operator signature in compliance wiki.',
            code: '# Add entry to wiki: "Monthly Restore Drill: 2026-10-04 | RTO: 34m | RPO: 0 data loss | PASS"'
          }
        ]
      }
    ]
  },

  // ==========================================
  // HIGH PRIORITY (6 - 10)
  // ==========================================
  {
    id: 'oncall-handover',
    filename: 'on-call/oncall-handover.html',
    title: 'On-Call Handover & Alert Hygiene Runbook',
    category: 'On-Call',
    priority: 'High Priority',
    badge: 'Shift Handover',
    intro: 'Standardized operational handover protocol between outgoing and incoming on-call engineers. Use at every weekly shift rotation to prevent missed alerts, review recurring incidents, eliminate alarm fatigue, and verify escalation readiness.',
    meta: [
      { label: 'Outgoing Engineer', placeholder: 'Engineer completing shift' },
      { label: 'Incoming Engineer', placeholder: 'Engineer taking over shift' },
      { label: 'Rotation Week', placeholder: 'e.g. 2026-W40' },
      { label: 'On-Call Service Tier', placeholder: 'Tier-1 Platform / Core API' }
    ],
    sections: [
      {
        title: 'Phase 1: Shift Incident Review & Open Issues',
        description: 'Review everything that paged or broke over the last 7 days.',
        items: [
          {
            id: 'oh-1',
            title: 'Review Past Week PagerDuty Incidents & Pages',
            desc: 'Review all triggered incidents, false alarms, and off-hours pages. Discuss any incidents that required manual mitigation.',
            code: '# PagerDuty Analytics: Review incident count, MTTA (Mean Time to Ack), and MTTR'
          },
          {
            id: 'oh-2',
            title: 'Check Outstanding Sev3/Sev4 Tickets & Workarounds',
            desc: 'Review any open non-critical bug tickets or temporary mitigations currently active in production (e.g. temporary increased pod counts).',
            code: 'jira search "project = SRE AND status in (\'In Progress\', \'Open\') AND priority in (\'High\', \'Medium\')"'
          },
          {
            id: 'oh-3',
            title: 'Review Scheduled Changes & Maintenance Windows',
            desc: 'Brief incoming on-call on scheduled database migrations, CAB approvals, third-party vendor maintenance, or expected traffic surges.',
            code: '# Review Google Calendar: "Engineering Maintenance & Deploy Windows"'
          }
        ]
      },
      {
        title: 'Phase 2: Alert Hygiene & Noise Cleanup',
        description: 'Eliminate flapping alarms, adjust thresholds, and combat engineer alert fatigue.',
        items: [
          {
            id: 'oh-4',
            title: 'Identify & Fix Flapping or Non-Actionable Alerts',
            desc: 'Find any monitor that paged more than twice without requiring engineering action. Silence, recalibrate threshold, or convert to ticket.',
            code: '# Rule: If an alert does not require immediate human intervention, it must NOT wake someone up.'
          },
          {
            id: 'oh-5',
            title: 'Audit Runbook Links in All PagerDuty Alerts',
            desc: 'Verify that every active alert rule includes a direct, functioning link to its corresponding runbook in the alert description.',
            code: '# Datadog: Inspect alert template variables {{#is_alert}} Runbook: https://runbooks.internal/... {{/is_alert}}'
          },
          {
            id: 'oh-6',
            title: 'Verify Escalation Policies & Contact Info',
            desc: 'Ensure phone numbers, SMS notification rules, and push notification settings for the incoming engineer are up to date and verified.',
            code: 'pagerduty user contact-methods --user-id $USER_ID'
          }
        ]
      },
      {
        title: 'Phase 3: Tooling & Production Access Verification',
        description: 'Ensure incoming engineer has working credentials and access to all critical tools.',
        items: [
          {
            id: 'oh-7',
            title: 'Test Production Kubernetes & Bastion Access',
            desc: 'Incoming engineer must verify `kubectl` access, Teleport/SSH credentials, and cloud console permissions before taking shift.',
            code: 'kubectl get nodes --request-timeout=\'5s\' && teleport status'
          },
          {
            id: 'oh-8',
            title: 'Verify Mobile Triage Capability & Hotspot Backup',
            desc: 'Confirm PagerDuty mobile app, Slack notifications, and cellular phone hotspot are ready in case of home internet disruption.',
            code: '# Test mobile notification acknowledgement'
          },
          {
            id: 'oh-9',
            title: 'Formal Shift Transfer in PagerDuty & Slack',
            desc: 'Execute formal shift takeover in PagerDuty, post handover summary in #on-call Slack channel, and sign off.',
            code: '# Post: "🤝 On-Call Handover complete: @outgoing -> @incoming. All systems green."'
          }
        ]
      }
    ]
  },

  {
    id: 'database-migration',
    filename: 'deployment/database-migration.html',
    title: 'Database Migration / Schema Change Runbook',
    category: 'Deployment',
    priority: 'High Priority',
    badge: 'Zero-Downtime DB',
    intro: 'Zero-downtime operational runbook for executing production database schema changes and data migrations. Use whenever altering relational tables (PostgreSQL/MySQL), introducing new columns, adding indexes, or transforming large data sets in high-throughput environments.',
    meta: [
      { label: 'Target Database', placeholder: 'e.g. users-db-primary' },
      { label: 'Migration Version', placeholder: 'e.g. V42__add_org_id_to_accounts.sql' },
      { label: 'Migration Lead', placeholder: 'DBA / Backend Lead' },
      { label: 'Estimated Lock Duration', placeholder: '< 2 seconds' }
    ],
    sections: [
      {
        title: 'Phase 1: Pre-Migration Safety & Lock Analysis',
        description: 'Analyze table locking risks, set protective timeouts, and create snapshots.',
        items: [
          {
            id: 'dbm-1',
            title: 'Verify Zero-Downtime Expand-Contract Pattern',
            desc: 'Ensure migration follows expand-contract: never drop or rename a column in the same release where code expects it.',
            code: '# Rule: Phase 1: Add new column (nullable). Phase 2: Dual write. Phase 3: Backfill. Phase 4: Drop old.'
          },
          {
            id: 'dbm-2',
            title: 'Enforce Explicit Lock and Statement Timeouts',
            desc: 'Every production DDL script MUST set strict lock_timeout and statement_timeout to fail fast instead of queueing behind queries.',
            code: 'SET lock_timeout = \'2s\';\nSET statement_timeout = \'10s\';'
          },
          {
            id: 'dbm-3',
            title: 'Capture Manual Pre-Migration Snapshot',
            desc: 'Create an instant storage snapshot of the primary database cluster prior to running DDL commands.',
            code: 'aws rds create-db-snapshot --db-instance-identifier prod-postgres --db-snapshot-identifier pre-mig-v42'
          },
          {
            id: 'dbm-4',
            title: 'Test Rollback / Down Migration Script in Staging',
            desc: 'Confirm the corresponding down-migration SQL script was executed and validated against real staging data.',
            code: 'psql -f migrations/U42__undo_add_org_id.sql --dry-run'
          }
        ]
      },
      {
        title: 'Phase 2: Execution & Non-Blocking DDL',
        description: 'Execute DDL safely using non-blocking primitives and concurrent indexing.',
        items: [
          {
            id: 'dbm-5',
            title: 'Use CONCURRENTLY for Index Creation',
            desc: 'In PostgreSQL, ALWAYS use `CREATE INDEX CONCURRENTLY` (or pt-online-schema-change / gh-ost in MySQL) to avoid read/write locks.',
            code: 'CREATE INDEX CONCURRENTLY idx_accounts_org_id ON accounts (org_id);'
          },
          {
            id: 'dbm-6',
            title: 'Add Columns as Nullable Without Heavy Defaults',
            desc: 'Add new columns as NULLABLE or with runtime defaults (Postgres 11+) to prevent rewriting entire table on disk.',
            code: 'ALTER TABLE accounts ADD COLUMN org_id UUID;'
          },
          {
            id: 'dbm-7',
            title: 'Monitor Active Connections & Replica Lag During DDL',
            desc: 'Watch for replication lag spikes across read replicas and check for blocked queries in pg_stat_activity.',
            code: 'SELECT pid, query, state, wait_event_type, wait_event FROM pg_stat_activity WHERE wait_event IS NOT NULL;'
          }
        ]
      },
      {
        title: 'Phase 3: Chunked Data Backfill',
        description: 'Backfill historical data in small batches to prevent table bloat and CPU spikes.',
        items: [
          {
            id: 'dbm-8',
            title: 'Execute Backfills in Micro-Batches with Sleep Intervals',
            desc: 'Update legacy records in batches of 2,000–5,000 rows with 200ms sleep delays between iterations to prevent replication lag.',
            code: 'UPDATE accounts SET org_id = default_org() WHERE id IN (SELECT id FROM accounts WHERE org_id IS NULL LIMIT 2000);'
          },
          {
            id: 'dbm-9',
            title: 'Run Post-Migration VACUUM ANALYZE',
            desc: 'Update database query planner statistics after heavy index creation or backfills to maintain optimal query plans.',
            code: 'ANALYZE accounts;'
          },
          {
            id: 'dbm-10',
            title: 'Sign Off on Migration Success & Update Schema Ledger',
            desc: 'Record applied migration version in schema tracking table and notify engineering team that DDL is active.',
            code: 'SELECT version, description, installed_on, execution_time FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;'
          }
        ]
      }
    ]
  },

  {
    id: 'secrets-rotation',
    filename: 'security/secrets-rotation.html',
    title: 'Secrets & Certificate Rotation Runbook',
    category: 'Security',
    priority: 'High Priority',
    badge: 'Security / Rotation',
    intro: 'Comprehensive operational procedure for rotating TLS/SSL certificates, database credentials, API keys, and HashiCorp Vault secrets without service downtime. Use during scheduled credential rotation windows, before certificate expirations, or immediately following an authorized credential compromise incident.',
    meta: [
      { label: 'Secret / Cert Type', placeholder: 'e.g. *.api.company.com TLS or RDS App Password' },
      { label: 'Secret Store', placeholder: 'HashiCorp Vault / AWS Secrets Manager' },
      { label: 'Target Services', placeholder: 'e.g. gateway, auth-service, worker' },
      { label: 'Security Lead', placeholder: 'SecOps Engineer' }
    ],
    sections: [
      {
        title: 'Phase 1: Pre-Rotation Inventory & Expiry Audit',
        description: 'Map secret dependencies and ensure zero downtime dual-credential windows.',
        items: [
          {
            id: 'sr-1',
            title: 'Audit Current Expiration Date & Active Usages',
            desc: 'Verify expiration timestamp of the target certificate or credential and identify all client services consuming it.',
            code: 'echo | openssl s_client -servername api.company.com -connect api.company.com:443 2>/dev/null | openssl x509 -noout -dates'
          },
          {
            id: 'sr-2',
            title: 'Establish Dual-Credential Window (Zero-Downtime Rule)',
            desc: 'Always support both old and new credentials simultaneously before updating applications (e.g. dual API keys or secondary DB role).',
            code: '# Postgres: CREATE USER app_v2 WITH PASSWORD \'new_pass\'; GRANT app_role TO app_v2;'
          }
        ]
      },
      {
        title: 'Phase 2: Generation & Vault Ingestion',
        description: 'Generate high-entropy credentials or validated certificates and store securely.',
        items: [
          {
            id: 'sr-3',
            title: 'Issue New TLS Certificate (ACME / Let\'s Encrypt / CA)',
            desc: 'Generate new 2048-bit or 4096-bit RSA / ECDSA certificate with validated Subject Alternative Names (SANs).',
            code: 'certbot certonly --dns-route53 -d api.company.com -d *.api.company.com'
          },
          {
            id: 'sr-4',
            title: 'Upload Secret to Vault / Secrets Manager',
            desc: 'Store the newly minted credential or certificate in the centralized vault with version tagging.',
            code: 'vault kv put secret/production/database password="super_secret_high_entropy_token" version="2"'
          },
          {
            id: 'sr-5',
            title: 'Update Kubernetes Secret Store CSI / Sealed Secrets',
            desc: 'Synchronize the updated secret from Vault into Kubernetes cluster namespaces via External Secrets Operator or CSI Driver.',
            code: 'kubectl get externalsecrets -A'
          }
        ]
      },
      {
        title: 'Phase 3: Rolling Service Reload & Verification',
        description: 'Reload applications gracefully to adopt the new credentials and monitor error rates.',
        items: [
          {
            id: 'sr-6',
            title: 'Trigger Graceful Rolling Restart of Dependent Workloads',
            desc: 'Perform rolling restart of application deployments or reload Nginx/Ingress pods to load new certificates into memory.',
            code: 'kubectl rollout restart deployment/auth-service && kubectl rollout restart deployment/ingress-nginx'
          },
          {
            id: 'sr-7',
            title: 'Verify Live TLS Handshake & Expiry via OpenSSL',
            desc: 'Run validation probe from outside the network to ensure the new certificate is served correctly without chain errors.',
            code: 'openssl s_client -connect api.company.com:443 -servername api.company.com | grep -E "Verify return code|issuer"'
          },
          {
            id: 'sr-8',
            title: 'Inspect Application Logs for Authentication Failures',
            desc: 'Search for HTTP 401/403 errors or database authentication failures across newly restarted pods.',
            code: 'kubectl logs -l app=auth-service --tail=200 | grep -iE "unauthorized|auth|handshake"'
          }
        ]
      },
      {
        title: 'Phase 4: Decommissioning & Audit Trail',
        description: 'Revoke old credentials after soak period and record compliance evidence.',
        items: [
          {
            id: 'sr-9',
            title: 'Revoke / Delete Legacy Credential After Soak Period (24h)',
            desc: 'After 24 hours of zero connections hitting the old credential, formally drop the old database user or revoke the previous API key.',
            code: 'DROP USER app_v1;'
          },
          {
            id: 'sr-10',
            title: 'Log Rotation Event in Security Compliance Ledger',
            desc: 'Record rotation date, cert fingerprint, target services, and next scheduled rotation date in compliance registry.',
            code: '# Update Security Vault audit log'
          }
        ]
      }
    ]
  },

  {
    id: 'new-service-onboarding',
    filename: 'onboarding/new-service-checklist.html',
    title: 'New Service / Microservice Onboarding Runbook',
    category: 'Onboarding',
    priority: 'High Priority',
    badge: 'Production Readiness',
    intro: 'Production Readiness Review (PRR) checklist for launching a new microservice or API into the production cluster. Use before approving any new service for live customer traffic to ensure complete operational maturity, observability, security hardening, and disaster recoverability.',
    meta: [
      { label: 'Service Name', placeholder: 'e.g. notifications-service' },
      { label: 'Owning Team / Squad', placeholder: 'e.g. Platform / Core Comm Squad' },
      { label: 'Primary Language / Stack', placeholder: 'e.g. Go 1.22 / Node.js 22' },
      { label: 'Target Launch Date', placeholder: 'YYYY-MM-DD' }
    ],
    sections: [
      {
        title: 'Phase 1: Ownership, Architecture & Service Catalog',
        description: 'Establish clear ownership, documentation, and service identity.',
        items: [
          {
            id: 'so-1',
            title: 'Service Catalog Registration (Backstage / OpsLevel)',
            desc: 'Register service in Backstage or company service catalog with repository link, tech stack, and Tier classification (Tier 1/2/3).',
            code: '# backstage-catalog-info.yaml committed in service root'
          },
          {
            id: 'so-2',
            title: 'Dedicated Slack Channel & PagerDuty Escalation Service',
            desc: 'Create team alert channel #service-<name>-alerts and configure PagerDuty escalation policy with designated on-call rotation.',
            code: '# PagerDuty: Create Service "notifications-service" linked to Slack'
          },
          {
            id: 'so-3',
            title: 'Publish Service Architecture & On-Call Runbook',
            desc: 'Publish core documentation including architecture diagram, external API dependencies, data stores, and emergency restart runbook.',
            code: '# Docs: /docs/runbooks/notifications-service-runbook.md'
          }
        ]
      },
      {
        title: 'Phase 2: CI/CD, Containerization & Infrastructure',
        description: 'Standardize build automation, artifact signing, and deployment pipelines.',
        items: [
          {
            id: 'so-4',
            title: 'Standardized Multi-Stage Dockerfile (Non-Root User)',
            desc: 'Container must build with multi-stage build, minimal distroless/alpine base, and execute as a non-root UID (e.g. USER 1001).',
            code: 'docker build --check . && trivy image <image-tag> --severity HIGH,CRITICAL'
          },
          {
            id: 'so-5',
            title: 'Automated CI Pipeline with Linting & SAST Scanning',
            desc: 'Configure GitHub Actions/GitLab CI running unit tests (>80% coverage), linter, static code security scanning (SonarQube/Semgrep).',
            code: 'git push origin main -> triggers automated CI checks'
          },
          {
            id: 'so-6',
            title: 'Kubernetes Resource Requests & Limits Configured',
            desc: 'Explicitly define CPU and memory requests and limits to prevent noisy neighbor evictions and enable cluster autoscaling.',
            code: 'resources:\n  requests: { cpu: "200m", memory: "256Mi" }\n  limits: { cpu: "1000m", memory: "1Gi" }'
          },
          {
            id: 'so-7',
            title: 'Liveness, Readiness & Startup Probes Defined',
            desc: 'Implement separate `/healthz` (liveness: is process dead?) and `/ready` (readiness: are DB/cache connections established?) endpoints.',
            code: 'curl -i http://localhost:8080/ready'
          }
        ]
      },
      {
        title: 'Phase 3: Observability, Metrics & SLOs',
        description: 'Instrument full telemetry stack for logs, metrics, traces, and alert thresholds.',
        items: [
          {
            id: 'so-8',
            title: 'Prometheus Metrics & Golden Signals (/metrics)',
            desc: 'Expose Prometheus endpoint tracking RED metrics: HTTP Request Rate, Error Count (by status code), and Duration histograms.',
            code: 'curl -s http://localhost:8080/metrics | grep http_requests_total'
          },
          {
            id: 'so-9',
            title: 'Structured JSON Logging with Trace Correlation',
            desc: 'Format application logs as JSON containing `timestamp`, `level`, `service`, `trace_id`, and `span_id` for OpenTelemetry tracing.',
            code: '{"level":"info","service":"notifications","trace_id":"4bf92f3577b34da6","msg":"Dispatching notification"}'
          },
          {
            id: 'so-10',
            title: 'Define Availability & Latency SLOs / SLIs',
            desc: 'Agree on Service Level Objectives with product team (e.g. 99.9% availability, p95 latency < 200ms) and configure burn-rate alerts.',
            code: '# SLO: 99.9% success rate over rolling 30 days'
          },
          {
            id: 'so-11',
            title: 'Grafana Dashboard Standard Template Deployed',
            desc: 'Deploy standardized Grafana service dashboard displaying RPS, error rate %, latency percentiles (p50/p95/p99), and JVM/runtime stats.',
            code: '# Grafana Dashboard ID imported from corporate template'
          }
        ]
      },
      {
        title: 'Phase 4: Security, Network & Resilience Hardening',
        description: 'Enforce network boundaries, secret injection, and failure testing.',
        items: [
          {
            id: 'so-12',
            title: 'Kubernetes NetworkPolicy Configured (Egress/Ingress Isolation)',
            desc: 'Enforce default-deny NetworkPolicy allowing inbound traffic only from approved ingress controllers and egress only to target DBs.',
            code: 'kubectl apply -f network-policy.yaml'
          },
          {
            id: 'so-13',
            title: 'Zero Secrets in Git / Secrets Sourced from Vault',
            desc: 'Verify repo scan with Gitleaks returns zero findings; all runtime secrets mounted securely via Vault or K8s Secret Store.',
            code: 'gitleaks detect --source . --verbose'
          },
          {
            id: 'so-14',
            title: 'Graceful Termination & SIGTERM Handling Implemented',
            desc: 'Ensure application listens for SIGTERM, stops accepting new requests, drains active HTTP connections within 30s, and shuts down cleanly.',
            code: '# Test: kill -SIGTERM <pid> -> verify connection draining'
          },
          {
            id: 'so-15',
            title: 'Synthetic Load Testing & PRR Sign-Off',
            desc: 'Execute k6 load test simulating 2x projected peak traffic; verify autoscaling triggers, and obtain DevOps sign-off.',
            code: 'k6 run load-test.js --vus 100 --duration 10m'
          }
        ]
      }
    ]
  },

  {
    id: 'capacity-scaling',
    filename: 'operations/capacity-scaling.html',
    title: 'Capacity & Scaling Runbook',
    category: 'Operations',
    priority: 'High Priority',
    badge: 'Scale Readiness',
    intro: 'Infrastructure capacity planning and scalability verification checklist ahead of expected traffic surges, high-volume marketing campaigns, product launches, or seasonal shopping events. Use 2 to 4 weeks prior to peak traffic events.',
    meta: [
      { label: 'Event / Surge Name', placeholder: 'e.g. Black Friday / Cyber Monday' },
      { label: 'Projected Peak RPS', placeholder: 'e.g. 25,000 RPS (3.5x normal)' },
      { label: 'Campaign Window', placeholder: 'Start Date - End Date' },
      { label: 'Lead Infrastructure Eng', placeholder: 'Your Name' }
    ],
    sections: [
      {
        title: 'Phase 1: Traffic Modeling & Headroom Assessment',
        description: 'Forecast peak loads and calculate infrastructure compute, storage, and networking requirements.',
        items: [
          {
            id: 'cs-1',
            title: 'Establish Peak RPS & Concurrent User Projections',
            desc: 'Collaborate with marketing, product, and data science to estimate peak requests-per-second, read/write ratios, and geo distribution.',
            code: '# Baseline: 7,000 RPS | Target Peak: 25,000 RPS | Headroom buffer required: 1.5x (37,500 RPS)'
          },
          {
            id: 'cs-2',
            title: 'Audit Cloud Provider Service Quotas & Limits',
            desc: 'Check cloud quotas (AWS EC2 vCPUs, Elastic IPs, NAT Gateways, Load Balancers) and request limit increases 2 weeks in advance.',
            code: 'aws service-quotas get-service-quota --service-code ec2 --quota-code L-1216C47A'
          }
        ]
      },
      {
        title: 'Phase 2: Compute & Kubernetes Autoscaling Tuning',
        description: 'Tune Horizontal Pod Autoscalers and cluster node provisioning for fast spin-up.',
        items: [
          {
            id: 'cs-3',
            title: 'Configure HPA (Horizontal Pod Autoscaler) Min/Max Limits',
            desc: 'Raise HPA minReplicas so services do not scramble to scale from cold state when traffic hits; set maxReplicas with safety margin.',
            code: 'kubectl patch hpa api-gateway -p \'{"spec":{"minReplicas":20,"maxReplicas":100}}\''
          },
          {
            id: 'cs-4',
            title: 'Configure Cluster Autoscaler & Pre-Warmed Node Headroom',
            desc: 'Deploy low-priority "balloon" placeholder pods in Kubernetes that can be evicted instantly by real workloads during sudden traffic spikes.',
            code: 'kubectl apply -f overprovisioning-headroom-pause-pods.yaml'
          },
          {
            id: 'cs-5',
            title: 'Tune Ingress Controller & Connection Concurrency',
            desc: 'Increase Nginx / Envoy worker processes, buffer sizes, and file descriptor limits (`worker_rlimit_nofile 100000`).',
            code: 'kubectl get configmap ingress-nginx-controller -o yaml'
          }
        ]
      },
      {
        title: 'Phase 3: Database, Caching & Connection Pools',
        description: 'Prevent database saturation, connection starvation, and cache eviction storms.',
        items: [
          {
            id: 'cs-6',
            title: 'Scale Database Instance Class / Vertical Upscale',
            desc: 'Pre-scale RDS/Aurora primary and read replica compute classes (e.g. db.r6g.2xlarge -> db.r6g.8xlarge) prior to traffic surge.',
            code: 'aws rds modify-db-instance --db-instance-identifier prod-postgres --db-instance-class db.r6g.8xlarge --apply-immediately'
          },
          {
            id: 'cs-7',
            title: 'Tune RDS Proxy & App Connection Pools',
            desc: 'Verify RDS Proxy connection pooling prevents pool exhaustion when pod replicas scale to maximum capacity.',
            code: 'aws rds describe-db-proxies'
          },
          {
            id: 'cs-8',
            title: 'Redis / ElastiCache Cluster Sizing & Eviction Policy',
            desc: 'Scale Redis cluster memory and verify eviction policy (`allkeys-lru`) to prevent OOM errors during cache bursts.',
            code: 'redis-cli -h prod-redis.internal info memory'
          },
          {
            id: 'cs-9',
            title: 'Third-Party Vendor Quota Verification (Stripe, Twilio, SendGrid)',
            desc: 'Notify third-party payment gateways and transactional email/SMS vendors of projected spike to avoid upstream rate limiting.',
            code: '# Submit quota increase ticket to Stripe / SendGrid account managers'
          }
        ]
      },
      {
        title: 'Phase 4: Load Testing, Cost Controls & Post-Surge Plan',
        description: 'Validate with distributed load tests, set billing alerts, and plan downscaling.',
        items: [
          {
            id: 'cs-10',
            title: 'Execute Distributed Load Test at 150% Peak Scale',
            desc: 'Run distributed k6 or Locust load test simulating peak load + 50% headroom. Verify latency p99 remains within SLA limits.',
            code: 'k6 run --vus 5000 --duration 30m distributed-peak-test.js'
          },
          {
            id: 'cs-11',
            title: 'Configure Cloud Budget & Anomaly Detection Alerts',
            desc: 'Set real-time billing threshold alerts in AWS/GCP to prevent runaway costs from unexpected auto-scaling loops.',
            code: 'aws budgets create-budget --account-id $ACCOUNT_ID --budget file://peak-budget.json'
          },
          {
            id: 'cs-12',
            title: 'Schedule Post-Event Downscaling & De-escalation',
            desc: 'Schedule automated or manual rollback of oversized node pools and database tiers 24 hours after campaign concludes.',
            code: '# Calendar event: Downscale RDS and HPA minReplicas back to standard baselines'
          }
        ]
      }
    ]
  },

  // ==========================================
  // IMPORTANT SUPPORTING CHECKLISTS (11 - 17)
  // ==========================================
  {
    id: 'security-compliance',
    filename: 'security/security-compliance.html',
    title: 'Security & Compliance Baseline Runbook',
    category: 'Security',
    priority: 'Supporting',
    badge: 'Security Baseline',
    intro: 'Comprehensive infrastructure hardening and compliance audit checklist covering CIS benchmarks, SOC2 Type II, and ISO 27001 requirements. Use during quarterly security reviews, new environment buildouts, or pre-audit compliance assessments.',
    meta: [
      { label: 'Environment Audited', placeholder: 'e.g. AWS Production Account / EKS Cluster' },
      { label: 'Compliance Framework', placeholder: 'SOC2 Type II / CIS Kubernetes / ISO 27001' },
      { label: 'Auditor / SecOps Lead', placeholder: 'Security Engineer' },
      { label: 'Audit Quarter', placeholder: 'e.g. 2026-Q4' }
    ],
    sections: [
      {
        title: 'Phase 1: IAM, Identity & Access Controls',
        description: 'Enforce MFA, eliminate permanent root credentials, and enforce least privilege.',
        items: [
          {
            id: 'sc-1',
            title: 'Enforce Multi-Factor Authentication (MFA) on All Accounts',
            desc: 'Verify 100% MFA compliance across AWS/GCP IAM, Google Workspace/Okta SSO, and GitHub organization members.',
            code: 'aws iam get-account-summary | jq .SummaryMap.AccountMFAEnabled'
          },
          {
            id: 'sc-2',
            title: 'Zero Root API Access Keys & Active Root Logins',
            desc: 'Verify root account has no active access keys generated, hardware MFA is active, and root logins trigger immediate alerts.',
            code: 'aws iam get-account-password-policy'
          },
          {
            id: 'sc-3',
            title: 'Audit Wildcard `*` IAM Permissions & Role Separation',
            desc: 'Scan for over-permissive IAM policies using AWS Access Analyzer or IAM policy linters; revoke wildcard administrative rights.',
            code: 'aws accessanalyzer list-analyzers'
          }
        ]
      },
      {
        title: 'Phase 2: Network Hardening & Perimeter Defense',
        description: 'Isolate database subnets, restrict public ports, and deploy WAF protections.',
        items: [
          {
            id: 'sc-4',
            title: 'Zero Public SSH / RDP Access (Port 22/3389 Disabled)',
            desc: 'Confirm no EC2/VM instances expose port 22 or 3389 to 0.0.0.0/0. Enforce AWS Systems Manager Session Manager or Teleport.',
            code: 'aws ec2 describe-security-groups --filters "Name=ip-permission.from-port,Values=22" --query "SecurityGroups[?IpPermissions[?contains(IpRanges[].CidrIp, \'0.0.0.0/0\')]].GroupId"'
          },
          {
            id: 'sc-5',
            title: 'Isolate Database Subnets into Private-Only VPCs',
            desc: 'Confirm all database instances (RDS, Redis, Mongo) reside in non-routable private subnets without public IP attachments.',
            code: 'aws rds describe-db-instances --query "DBInstances[*].[DBInstanceIdentifier, PubliclyAccessible]"'
          },
          {
            id: 'sc-6',
            title: 'WAF & DDoS Mitigation Active on All Public Ingresses',
            desc: 'Verify Cloudflare WAF or AWS WAF is active with SQL injection (SQLi), Cross-Site Scripting (XSS), and rate limiting rules enabled.',
            code: 'aws wafv2 list-web-acls --scope CLOUDFRONT'
          }
        ]
      },
      {
        title: 'Phase 3: Workload & Container Hardening',
        description: 'Enforce Kubernetes pod security standards and container runtime immutability.',
        items: [
          {
            id: 'sc-7',
            title: 'Enforce Kubernetes Pod Security Standards (Restricted Profile)',
            desc: 'Enforce Pod Security Admission (PSA) requiring containers to run as non-root, drop ALL Linux capabilities, and disable privilege escalation.',
            code: 'kubectl get ns -o custom-columns=NAME:.metadata.name,ENFORCE:.metadata.labels.\'pod-security\\.kubernetes\\.io/enforce\''
          },
          {
            id: 'sc-8',
            title: 'Vulnerability Scanning in CI/CD (Zero High/Critical CVEs)',
            desc: 'Enforce Trivy / Snyk image scanning in deployment pipeline. Automatically block deployment if unpatched High/Critical CVEs exist.',
            code: 'trivy image --exit-code 1 --severity CRITICAL,HIGH registry.company.com/app:latest'
          },
          {
            id: 'sc-9',
            title: 'Secrets Encryption at Rest via KMS Envelope Encryption',
            desc: 'Verify Kubernetes secrets are encrypted at rest using AWS KMS / HashiCorp Vault provider rather than plain base64 in etcd.',
            code: 'kubectl get secrets -n production -o yaml | head -n 20'
          }
        ]
      },
      {
        title: 'Phase 4: Centralized Audit Logging & SIEM Integration',
        description: 'Stream immutable audit trails into central log analytics and configure alerting.',
        items: [
          {
            id: 'sc-10',
            title: 'AWS CloudTrail & VPC Flow Logs Enabled Multi-Region',
            desc: 'Verify multi-region CloudTrail is streaming into an S3 bucket with Object Lock enabled and KMS encryption enforced.',
            code: 'aws cloudtrail describe-trails'
          },
          {
            id: 'sc-11',
            title: 'Kubernetes API Audit Logging Ingested into SIEM',
            desc: 'Confirm Kubernetes API server audit logs are flowing into Datadog, Splunk, or Elastic SIEM for threat detection.',
            code: '# Verify Datadog index: source:kubernetes.audit'
          },
          {
            id: 'sc-12',
            title: 'Execute Automated Compliance Scan (Prowler / Checkov)',
            desc: 'Run Prowler for AWS or Checkov against Terraform IaC repositories to produce compliance audit scorecard.',
            code: 'prowler aws --compliance soc2_aws'
          }
        ]
      }
    ]
  },

  {
    id: 'change-management-cab',
    filename: 'operations/change-management-cab.html',
    title: 'Change Management / CAB Checklist Runbook',
    category: 'Operations',
    priority: 'Supporting',
    badge: 'CAB Approval',
    intro: 'Formal Change Advisory Board (CAB) review and governance checklist. Use when submitting Normal or Emergency changes to production infrastructure, shared network backbones, or core database architectures to ensure peer evaluation and risk mitigation.',
    meta: [
      { label: 'RFC / Change Ticket', placeholder: 'e.g. RFC-8831' },
      { label: 'Change Classification', placeholder: 'Standard / Normal / Emergency' },
      { label: 'Change Owner', placeholder: 'Engineer Name' },
      { label: 'Scheduled Maintenance Window', placeholder: 'YYYY-MM-DD HH:MM - HH:MM UTC' }
    ],
    sections: [
      {
        title: 'Phase 1: Change Classification & Risk Assessment',
        description: 'Categorize change type and assess impact on user transactions and SLAs.',
        items: [
          {
            id: 'cm-1',
            title: 'Determine Change Category (Standard vs Normal vs Emergency)',
            desc: 'Standard: Pre-approved, automated, low-risk. Normal: Requires CAB approval and scheduled window. Emergency: Unscheduled fix for active Sev1.',
            code: '# Policy: All multi-service schema changes and routing updates qualify as Normal Changes.'
          },
          {
            id: 'cm-2',
            title: 'Quantify Business & Customer Impact',
            desc: 'Identify affected customer segments, expected downtime (if any), and impact on transaction throughput or SLA commitments.',
            code: '# Document: Max downtime expected: 0 minutes. Affected services: Billing, Auth.'
          }
        ]
      },
      {
        title: 'Phase 2: Technical Justification & Staging Proof',
        description: 'Provide detailed architectural reasoning and reproducible staging test proofs.',
        items: [
          {
            id: 'cm-3',
            title: 'Attach Step-by-Step Implementation Commands',
            desc: 'RFC must include exact terminal commands, scripts, and parameters to be executed during the change window.',
            code: '# Detail step-by-step shell commands in RFC description'
          },
          {
            id: 'cm-4',
            title: 'Attach Staging Environment Validation Evidence',
            desc: 'Provide timestamped logs, screenshots, and automated test output confirming successful execution in staging environment.',
            code: '# Link: Staging test execution report #8831-stage-pass'
          },
          {
            id: 'cm-5',
            title: 'Document Concrete Rollback Plan & Trigger Criteria',
            desc: 'Specify exact conditions that trigger an immediate rollback (e.g. error rate > 0.5% for 3 mins) and detailed rollback instructions.',
            code: '# Trigger: If p99 latency > 400ms after step 3, execute rollback script within 5 minutes.'
          }
        ]
      },
      {
        title: 'Phase 3: Stakeholder Notifications & Window Scheduling',
        description: 'Ensure cross-functional awareness and active support coverage.',
        items: [
          {
            id: 'cm-6',
            title: 'Customer Support & Customer Success Briefing',
            desc: 'Inform customer support lead 24 hours prior so customer-facing teams have context if inquiries spike during the window.',
            code: '# Notify #support-leads Slack channel'
          },
          {
            id: 'cm-7',
            title: 'Verify On-Call Engineer Availability During Window',
            desc: 'Confirm the on-call engineer and database SME are aware and present on standby during the scheduled window.',
            code: '# Confirm attendance on calendar invite'
          }
        ]
      },
      {
        title: 'Phase 4: Formal Approval & Post-Implementation Review (PIR)',
        description: 'Secure CAB approvals, execute change, and conduct PIR.',
        items: [
          {
            id: 'cm-8',
            title: 'Secure Minimum Two Peer & Manager Approvals in Ticket',
            desc: 'Verify required electronic signatures from Staff Engineer and Infrastructure Manager are recorded in change management system.',
            code: 'jira issue view RFC-8831 | jq .fields.customfield_approvers'
          },
          {
            id: 'cm-9',
            title: 'Execute Change & Conduct 30-Minute Soak Validation',
            desc: 'Perform change steps according to plan; monitor telemetry for 30 minutes following completion.',
            code: '# Execute approved change script'
          },
          {
            id: 'cm-10',
            title: 'Complete Post-Implementation Review (PIR) & Close Ticket',
            desc: 'Record actual start/end time, any deviations from plan, telemetry results, and mark ticket "Successfully Implemented".',
            code: 'jira issue transition RFC-8831 --transition "Completed"'
          }
        ]
      }
    ]
  },

  {
    id: 'canary-deployment',
    filename: 'deployment/canary-deployment.html',
    title: 'Blue-Green / Canary / Progressive Delivery Runbook',
    category: 'Deployment',
    priority: 'Supporting',
    badge: 'Progressive Delivery',
    intro: 'Comprehensive operational procedure for rolling out services using Blue-Green switching and Canary progressive traffic shifts (Argo Rollouts / Flagger / Istio). Use for high-risk core releases, critical API updates, or complex multi-tier microservice migrations.',
    meta: [
      { label: 'Workload Name', placeholder: 'e.g. checkout-service' },
      { label: 'Target Canary Version', placeholder: 'e.g. v3.0.0-rc2' },
      { label: 'Traffic Director', placeholder: 'Argo Rollouts / Istio VirtualService' },
      { label: 'Release Engineer', placeholder: 'Your Name' }
    ],
    sections: [
      {
        title: 'Phase 1: Baseline Telemetry & Canary Deployment',
        description: 'Snapshot stable metrics and launch isolated canary pods.',
        items: [
          {
            id: 'cd-1',
            title: 'Capture Stable (Blue) Baseline Metrics',
            desc: 'Record baseline HTTP 5xx error percentage (< 0.02%), p50/p95/p99 latency (p95 < 120ms), and pod memory footprint.',
            code: 'curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\",app=\"checkout\"}[5m]))"'
          },
          {
            id: 'cd-2',
            title: 'Deploy Green Workload / Canary Pods (0% Public Traffic)',
            desc: 'Spin up new revision pods in parallel without routing public traffic. Verify internal container startup and database connections.',
            code: 'kubectl apply -f canary-rollout.yaml && kubectl argo rollouts get rollout checkout-service'
          },
          {
            id: 'cd-3',
            title: 'Execute Internal Synthetics Against Canary Pod Directly',
            desc: 'Route synthetic internal test traffic using custom header (e.g. `X-Canary: true`) to validate canary before public exposure.',
            code: 'curl -H "X-Canary: true" https://api.company.com/checkout/healthz'
          }
        ]
      },
      {
        title: 'Phase 2: Progressive Traffic Shift & Metric Analysis',
        description: 'Shift traffic progressively (5% -> 25% -> 50%) while evaluating real-time error budgets.',
        items: [
          {
            id: 'cd-4',
            title: 'Shift 5% Public Traffic to Canary (Phase 1 Soak)',
            desc: 'Direct 5% of incoming user traffic to the canary revision. Soak for 10 minutes while monitoring error rates.',
            code: 'kubectl argo rollouts set-weight checkout-service 5'
          },
          {
            id: 'cd-5',
            title: 'Analyze Automated Analysis Metrics (Prometheus / Datadog)',
            desc: 'Confirm error rate delta between canary and baseline is < 0.05% and p95 latency has not degraded by > 10%.',
            code: '# Metric: sum(rate(http_requests_total{version="canary",status=~"5.."}[5m])) / sum(rate(http_requests_total{version="canary"}[5m]))'
          },
          {
            id: 'cd-6',
            title: 'Promote Traffic to 25% and 50%',
            desc: 'Step traffic up to 25% for 10 minutes, followed by 50% for 10 minutes. Watch database connection pool saturation.',
            code: 'kubectl argo rollouts set-weight checkout-service 25\n# Wait 10m\nkubectl argo rollouts set-weight checkout-service 50'
          }
        ]
      },
      {
        title: 'Phase 3: 100% Full Cutover & Old Workload Drainage',
        description: 'Complete full cutover and gracefully drain connections from the previous version.',
        items: [
          {
            id: 'cd-7',
            title: 'Promote to 100% Production Traffic',
            desc: 'Switch all remaining ingress traffic to the new revision. Ensure traffic distributes evenly across scaled pods.',
            code: 'kubectl argo rollouts promote checkout-service --full'
          },
          {
            id: 'cd-8',
            title: 'Drain & Terminate Legacy (Blue) Replicas Gracefully',
            desc: 'Allow active in-flight HTTP requests and WebSocket connections on old pods to complete gracefully over a 300s termination grace period.',
            code: 'kubectl rollout status rollout/checkout-service'
          },
          {
            id: 'cd-9',
            title: 'Final Observability Sign-Off',
            desc: 'Confirm zero unhandled error spikes, verify business transaction volume matches expected daily trajectory, and notify team.',
            code: '# Post in #releases: "Canary rollout of checkout-service v3.0.0 completed successfully to 100%."'
          }
        ]
      }
    ]
  },

  {
    id: 'post-mortem-template',
    filename: 'incident-response/post-mortem-template.html',
    title: 'Post-Incident / Post-Mortem Process Runbook',
    category: 'Incident Response',
    priority: 'Supporting',
    badge: 'Post-Mortem',
    intro: 'Blameless post-mortem framework and action item tracking protocol. Use within 48 to 72 hours following the resolution of any Sev1 or Sev2 production incident to analyze systemic failures, reconstruct accurate timelines, and implement preventative engineering fixes.',
    meta: [
      { label: 'Incident Identifier', placeholder: 'e.g. INC-2026-10-04-DB-OUTAGE' },
      { label: 'Incident Date', placeholder: 'YYYY-MM-DD' },
      { label: 'Post-Mortem Facilitator', placeholder: 'SRE / Quality Lead' },
      { label: 'Total Customer Downtime', placeholder: 'e.g. 42 minutes' }
    ],
    sections: [
      {
        title: 'Phase 1: Blameless Foundations & Data Gathering',
        description: 'Establish psychological safety and gather unfiltered logs, transcripts, and telemetry.',
        items: [
          {
            id: 'pm-1',
            title: 'Enforce Blameless Culture Ground Rules',
            desc: 'Explicitly remind participants: we assume everyone acted in good faith with the information available. Focus on systems, tooling, and alerting.',
            code: '# Rule: "You cannot fire your way into reliable software. Focus on systemic vulnerabilities."'
          },
          {
            id: 'pm-2',
            title: 'Export Slack Incident Transcripts & War Room Audio Notes',
            desc: 'Archive the exact communication thread, timestamps of shared diagnostic commands, and decision points from the incident channel.',
            code: '# Export #inc-20261004-outage chat log to incident artifact directory'
          },
          {
            id: 'pm-3',
            title: 'Calculate Core Reliability Metrics (MTTD, MTTA, MTTR)',
            desc: 'Document exact Mean Time to Detect (alert time minus start time), Mean Time to Acknowledge, and Mean Time to Restore.',
            code: '# MTTD: 4 mins | MTTA: 2 mins | MTTR: 38 mins | Total Impact: 44 mins'
          }
        ]
      },
      {
        title: 'Phase 2: Timeline Reconstruction & Root Cause Analysis',
        description: 'Reconstruct a chronological sequence and perform the 5 Whys analysis.',
        items: [
          {
            id: 'pm-4',
            title: 'Construct Precise Chronological Timeline (UTC)',
            desc: 'Build minute-by-minute timeline covering: event trigger, alert fired, engineer acknowledged, triage actions, mitigation applied, recovery confirmed.',
            code: '# Example:\n# 03:14 UTC - Deploy initiated\n# 03:18 UTC - Error rate spiked to 14%\n# 03:22 UTC - PagerDuty alerted on-call'
          },
          {
            id: 'pm-5',
            title: 'Conduct the "5 Whys" Root Cause Investigation',
            desc: 'Drill down from surface symptoms to underlying architectural or process gaps by asking "Why?" five consecutive times.',
            code: '# 1. Why did API fail? DB connection pool exhausted.\n# 2. Why? Query took 45s.\n# 3. Why? Missing index on accounts table.\n# 4. Why? Migration skipped index check.\n# 5. Why? CI DDL linter was not required.'
          },
          {
            id: 'pm-6',
            title: 'Analyze Contributing Factors (What Failed vs What Helped)',
            desc: 'Document: 1) What went well (e.g. fast rollback script), 2) What went poorly (e.g. runbook link 404), 3) Where we got lucky.',
            code: '# Fill out "What Went Well" / "What Went Poorly" matrices'
          }
        ]
      },
      {
        title: 'Phase 3: Preventative Action Items & Accountability',
        description: 'Assign preventative engineering tasks with strict deadlines and single-owner accountability.',
        items: [
          {
            id: 'pm-7',
            title: 'Create Action Items with Single Assignees and Target Dates',
            desc: 'Every action item MUST have one single accountable engineer, an approved Jira ticket, and a due date within 30 days.',
            code: 'jira issue create --project SRE --summary "Add DDL lock_timeout validation to CI pipeline" --assignee "alice"'
          },
          {
            id: 'pm-8',
            title: 'Distribute Executive Summary to Leadership',
            desc: 'Draft non-technical executive summary explaining customer impact, root cause, and remediation investment for leadership.',
            code: '# Email to engineering-leads@company.com'
          },
          {
            id: 'pm-9',
            title: 'Archive Post-Mortem in Knowledge Base & Review 30 Days Later',
            desc: 'Publish post-mortem in company wiki and schedule a 30-day review to verify all preventative action items were completed.',
            code: '# Add to Knowledge Base: /sre/post-mortems/2026-10-04-db-outage.md'
          }
        ]
      }
    ]
  },

  {
    id: 'environment-promotion',
    filename: 'deployment/environment-promotion.html',
    title: 'Environment Promotion (Dev → Staging → Prod) Runbook',
    category: 'Deployment',
    priority: 'Supporting',
    badge: 'Environment Parity',
    intro: 'Structured gatekeeping checklist for promoting application releases and infrastructure code between environments (Development → Staging → Production). Use before promoting any release candidate to guarantee configuration parity, immutable artifacts, and zero regression surprises.',
    meta: [
      { label: 'Release Candidate Tag', placeholder: 'e.g. v2.14.0-rc.3' },
      { label: 'Source Environment', placeholder: 'Staging' },
      { label: 'Target Environment', placeholder: 'Production' },
      { label: 'Release Gatekeeper', placeholder: 'Lead QA / Release Manager' }
    ],
    sections: [
      {
        title: 'Phase 1: Artifact Immutability & Version Integrity',
        description: 'Verify identical build artifacts are promoted without recompiling.',
        items: [
          {
            id: 'ep-1',
            title: 'Verify Container Image Digest Immutability',
            desc: 'Ensure the exact SHA256 image digest that passed tests in Staging is promoted to Production—never rebuild the Docker image.',
            code: 'docker inspect --format=\'{{index .RepoDigests 0}}\' registry.company.com/api:v2.14.0-rc.3'
          },
          {
            id: 'ep-2',
            title: 'Verify Signed Release Tag & Changelog Generation',
            desc: 'Confirm Git commit tag is cryptographically signed and release notes detail all PRs, dependency updates, and bug fixes included.',
            code: 'git tag -v v2.14.0 && git log --pretty=format:"* %s (%an)" v2.13.9..v2.14.0'
          }
        ]
      },
      {
        title: 'Phase 2: Configuration & Secret Drift Verification',
        description: 'Audit configuration differences between Staging and Production.',
        items: [
          {
            id: 'ep-3',
            title: 'Execute Configuration Drift & Environment Variable Audit',
            desc: 'Verify that every new environment variable required by the release candidate has a corresponding entry defined in Production Vault.',
            code: 'diff <(kubectl get configmap api-config -n staging -o json | jq .data | jq -S) <(kubectl get configmap api-config -n prod -o json | jq .data | jq -S)'
          },
          {
            id: 'ep-4',
            title: 'Third-Party Webhook & Endpoint URL Audit',
            desc: 'Confirm mock/sandbox third-party URLs (e.g. sandbox.stripe.com) used in staging are correctly mapped to live endpoints for production.',
            code: '# Verify PRODUCTION_PAYMENT_GATEWAY_URL != "sandbox"'
          }
        ]
      },
      {
        title: 'Phase 3: Database & Integration Verification Gates',
        description: 'Validate database compatibility and automated test results.',
        items: [
          {
            id: 'ep-5',
            title: 'Staging Database Migration Dry-Run Pass',
            desc: 'Verify schema migrations were executed on staging without lock contention, and regression queries match performance baselines.',
            code: 'flyway validate -url="jdbc:postgresql://prod-db:5432/app"'
          },
          {
            id: 'ep-6',
            title: '100% Pass Rate on Automated Staging E2E Suite',
            desc: 'Confirm full Cypress / Playwright automated end-to-end integration suite passed with zero flaky test overrides.',
            code: '# GitHub Actions: Workflow "Staging E2E Test Suite" Status: Passed'
          },
          {
            id: 'ep-7',
            title: 'Final Promotion Gate Sign-Off',
            desc: 'Obtain formal sign-off from QA Lead and Engineering Lead before promoting the container image tag to production Helm values.',
            code: 'git commit -m "chore(release): promote api to v2.14.0 in prod values" && git push origin main'
          }
        ]
      }
    ]
  },

  {
    id: 'observability-standards',
    filename: 'on-call/observability-standards.html',
    title: 'Observability & Alerting Standards Runbook',
    category: 'On-Call',
    priority: 'Supporting',
    badge: 'Telemetry Standards',
    intro: 'Engineering standard and audit checklist for service observability and alerting hygiene. Use when designing new microservices, auditing legacy services, or recalibrating alerts to eliminate monitoring blind spots, prevent silent outages, and avoid on-call alarm fatigue.',
    meta: [
      { label: 'Service Audited', placeholder: 'e.g. billing-service' },
      { label: 'APM Platform', placeholder: 'Datadog / Prometheus + Grafana' },
      { label: 'Logging Aggregator', placeholder: 'Elasticsearch / OpenSearch / Loki' },
      { label: 'Observability Auditor', placeholder: 'SRE Lead' }
    ],
    sections: [
      {
        title: 'Phase 1: Metrics & Four Golden Signals (RED Method)',
        description: 'Audit service instrumentation for Rate, Errors, Duration, and Saturation.',
        items: [
          {
            id: 'os-1',
            title: 'Instrument Rate (Requests Per Second)',
            desc: 'Track incoming request throughput segmented by endpoint, HTTP method, and response status category.',
            code: 'http_requests_total{service="billing", method="POST", handler="/checkout"}'
          },
          {
            id: 'os-2',
            title: 'Instrument Errors (HTTP 5xx & Unhandled Exceptions)',
            desc: 'Measure exact failure count and error percentage over time; alert if error ratio exceeds 0.5% over 5-minute rolling window.',
            code: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100'
          },
          {
            id: 'os-3',
            title: 'Instrument Duration (Latency Histograms with Percentiles)',
            desc: 'Record request durations using Prometheus histograms to accurately calculate p50, p95, and p99 response times.',
            code: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
          },
          {
            id: 'os-4',
            title: 'Instrument Saturation (CPU, Memory, Connection Pools)',
            desc: 'Expose resource utilization metrics: thread pool capacity, DB connection pool active vs max, and container memory limits.',
            code: 'container_memory_working_set_bytes{pod=~"billing-.*"} / container_spec_memory_limit_bytes'
          }
        ]
      },
      {
        title: 'Phase 2: Structured Logging & Distributed Tracing',
        description: 'Standardize log structures and propagate trace contexts across network calls.',
        items: [
          {
            id: 'os-5',
            title: 'Enforce JSON Structured Logs with Standard Fields',
            desc: 'All logs must output as valid JSON containing: `timestamp`, `level`, `service`, `trace_id`, `span_id`, and `environment`.',
            code: '{"timestamp":"2026-10-04T14:00:00Z","level":"ERROR","service":"billing","trace_id":"8a9f...","msg":"Payment timeout"}'
          },
          {
            id: 'os-6',
            title: 'Zero Personally Identifiable Information (PII) in Logs',
            desc: 'Verify log sanitizers mask credit cards, passwords, authorization tokens, and personal identifying information.',
            code: '# Audit log samples for regex patterns: SSN, Credit Card, Authorization: Bearer'
          },
          {
            id: 'os-7',
            title: 'Distributed Tracing & Context Propagation (OpenTelemetry)',
            desc: 'Inject W3C `traceparent` headers into all outgoing HTTP and gRPC client calls to maintain end-to-end distributed traces.',
            code: 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
          }
        ]
      },
      {
        title: 'Phase 3: Alert Actionability & Dashboard Standards',
        description: 'Enforce high-signal alerting and standardized dashboard layouts.',
        items: [
          {
            id: 'os-8',
            title: 'Every Paging Alert Must Have a Direct Runbook Link',
            desc: 'Alert definitions must contain a verified link to an actionable runbook; never page an engineer without documented triage steps.',
            code: 'annotations:\n  runbook_url: "https://runbooks.internal/deployment/rollback.html"'
          },
          {
            id: 'os-9',
            title: 'Enforce Symptom-Based Over Cause-Based Paging',
            desc: 'Page on user-visible symptoms (high error rate, elevated latency, failed payments) rather than internal causes (e.g. CPU > 80%).',
            code: '# Good: "Customer checkout failing". Bad: "Node 12 CPU is 85%"'
          },
          {
            id: 'os-10',
            title: 'Standardize Team Grafana Dashboard Layout',
            desc: 'Structure dashboard logically: Top row: High-level KPIs & SLOs. Middle row: Downstream dependencies. Bottom: Host infrastructure.',
            code: '# Apply company standard Grafana JSON template'
          }
        ]
      }
    ]
  },

  {
    id: 'access-review',
    filename: 'security/access-review.html',
    title: 'Access Review & Offboarding Runbook',
    category: 'Security',
    priority: 'Supporting',
    badge: 'Access Governance',
    intro: 'Privileged access audit and employee leaver offboarding protocol. Use for quarterly SOC2/ISO user access reviews and immediately upon notification of any team member or contractor departure to enforce zero leftover credentials and strict auditability.',
    meta: [
      { label: 'Review Type', placeholder: 'Quarterly Access Audit / Offboarding Leaver' },
      { label: 'Target User / Team', placeholder: 'e.g. John Doe (Departed) or All Engineering' },
      { label: 'Auditing Officer', placeholder: 'Security / IT Admin' },
      { label: 'Date Completed', placeholder: 'YYYY-MM-DD' }
    ],
    sections: [
      {
        title: 'Phase 1: Quarterly Access Audit & Stale Account Cleanup',
        description: 'Audit privileged access across cloud, code, and infrastructure systems.',
        items: [
          {
            id: 'ar-1',
            title: 'Export & Audit Cloud Provider IAM Users (AWS / GCP)',
            desc: 'Export all IAM users and SSO assignments; verify every account corresponds to an active employee and has logged in within 45 days.',
            code: 'aws iam generate-credential-report && aws iam get-credential-report --output text --query "Content" | base64 -d'
          },
          {
            id: 'ar-2',
            title: 'Review Kubernetes RBAC ClusterRoleBindings',
            desc: 'Audit all users bound to `cluster-admin` in production Kubernetes; downgrade non-infrastructure engineers to read-only roles.',
            code: 'kubectl get clusterrolebindings -o json | jq -r \'.items[] | select(.roleRef.name=="cluster-admin") | .metadata.name\''
          },
          {
            id: 'ar-3',
            title: 'Audit GitHub / GitLab Organization Membership & Keys',
            desc: 'Remove inactive outside collaborators, revoke stale SSH deploy keys, and verify all members have hardware MFA enabled.',
            code: 'gh api orgs/company/members --paginate | jq \'.[] | .login\''
          },
          {
            id: 'ar-4',
            title: 'Review Bastion / Teleport / VPN Privileged Access',
            desc: 'Audit certificate issuance logs and SSH access groups; verify production bastion access is restricted exclusively to active on-call staff.',
            code: 'tsh users ls'
          }
        ]
      },
      {
        title: 'Phase 2: Immediate Employee Offboarding Protocol (Leaver)',
        description: 'Complete immediate revocation of identity and access credentials within 1 hour of departure.',
        items: [
          {
            id: 'ar-5',
            title: 'Suspend Primary Identity Provider (Okta / Google Workspace)',
            desc: 'Instantly suspend primary SSO directory account within 1 hour of departure notice; terminate all active web and SAML sessions.',
            code: '# Okta Admin: Suspend User -> Clear Active User Sessions'
          },
          {
            id: 'ar-6',
            title: 'Revoke AWS / Cloud Provider Access & Invalidate Tokens',
            desc: 'Delete IAM user credentials, deactivate access keys, and revoke active STS assumed-role sessions.',
            code: 'aws iam list-access-keys --user-name $USER && aws iam update-access-key --access-key-id $KEY_ID --status Inactive'
          },
          {
            id: 'ar-7',
            title: 'Revoke VPN Profiles & Bastion SSH Certificates',
            desc: 'Revoke OpenVPN / Wireguard / Tailscale device registration and delete Teleport certificates for the target user.',
            code: 'tailscale status --peers | grep $USER && tailscale lock revoke'
          },
          {
            id: 'ar-8',
            title: 'Remove from GitHub Org, PagerDuty, Datadog & Slack',
            desc: 'Remove user from corporate GitHub organization, cancel PagerDuty on-call shifts, and convert Slack account to deactivated.',
            code: 'gh api -X DELETE /orgs/company/members/$GITHUB_USER'
          },
          {
            id: 'ar-9',
            title: 'Remote Wipe & Lock Corporate Hardware via MDM',
            desc: 'Issue remote enterprise wipe or lock via Jamf / Intune MDM for company-issued laptops and mobile devices.',
            code: '# Jamf / Intune: Issue Remote Wipe / Lock command'
          },
          {
            id: 'ar-10',
            title: 'Sign Off Offboarding Ticket in HR & Security System',
            desc: 'Attach timestamped revocation screenshots and command logs to the HR leaver ticket and mark offboarding fully complete.',
            code: '# Transition Jira ticket OFFBOARD-9021 to "Verified & Closed"'
          }
        ]
      }
    ]
  },

  // Complementary High-Value Incident Matrix Runbook
  {
    id: 'severity-levels',
    filename: 'incident-response/severity-levels.html',
    title: 'Incident Severity Levels & Escalation Matrix',
    category: 'Incident Response',
    priority: 'Supporting',
    badge: 'Severity Matrix',
    intro: 'Authoritative classification framework and escalation protocol for defining incident severity (Sev0 through Sev4). Use during the first 5 minutes of any production incident to classify customer impact, trigger proper war-room protocols, and assign response SLAs.',
    meta: [
      { label: 'Incident Name', placeholder: 'e.g. Ingress Gateway SSL Expiry' },
      { label: 'Current Assessed Severity', placeholder: 'Sev1 / Sev2 / Sev3 / Sev4' },
      { label: 'Assessing Lead', placeholder: 'Triage Engineer' },
      { label: 'Customer Impact Assessment', placeholder: '> 25% of active users' }
    ],
    sections: [
      {
        title: 'Phase 1: Severity Level Classification Matrix',
        description: 'Categorize the incident by matching observable business and technical impacts.',
        items: [
          {
            id: 'sl-1',
            title: 'SEV-0: Catastrophic / Company-Wide Outage',
            desc: 'Complete global failure of all systems or major security breach. RTO: < 30 mins. Immediate page to CTO, VP Eng, and all engineering leads.',
            code: '# Impact: 100% of customers down. War room: Continuous executive bridge.'
          },
          {
            id: 'sl-2',
            title: 'SEV-1: Critical / Core Functionality Down',
            desc: 'Primary business flow broken (e.g. checkout, login, data ingestion) with no workaround. Page primary + secondary on-call. SLA: 5m ack, 30m mitigation.',
            code: '# Impact: > 20% of customer transactions failing. Public status page update required.'
          },
          {
            id: 'sl-3',
            title: 'SEV-2: Major Degradation with Partial Workaround',
            desc: 'Significant feature down (e.g. exports, reports, search) or severe latency, but core purchasing works. SLA: 15m ack, 2h mitigation.',
            code: '# Impact: Significant customer inconvenience with workaround available.'
          },
          {
            id: 'sl-4',
            title: 'SEV-3: Minor Degradation / Internal Tooling',
            desc: 'Minor bug affecting < 5% of users, internal dashboard down, or non-paging metric anomaly. SLA: Handled during normal business hours.',
            code: '# Impact: Low. Handled by ticket during daytime hours.'
          }
        ]
      },
      {
        title: 'Phase 2: Escalation Paths & Communication Intervals',
        description: 'Enforce notification cadences and stakeholder communication intervals.',
        items: [
          {
            id: 'sl-5',
            title: 'Sev-1 Communication Cadence: Updates Every 15–20 Minutes',
            desc: 'Incident Commander must publish written internal updates in #incident-alerts and public status page every 20 minutes regardless of progress.',
            code: '# Format: "Current Status | Mitigation Attempted | Next Step | ETA for Next Update"'
          },
          {
            id: 'sl-6',
            title: 'Executive Escalation Trigger (30-Minute Rule)',
            desc: 'If a Sev-1 incident is not mitigated within 30 minutes of triage, automatically escalate notification to VP of Engineering and Head of Product.',
            code: '# Trigger PagerDuty escalation rule: Executive Escalation Policy'
          },
          {
            id: 'sl-7',
            title: 'Verify Incident Commander Handover if Shift Extends > 4 Hours',
            desc: 'If incident war room exceeds 4 hours, formally transfer Incident Commander role to fresh engineer to maintain operational vigilance.',
            code: '# Transition IC role: Record new IC name in Slack topic and meeting notes'
          }
        ]
      }
    ]
  }
];

// Export runbooks data for build
module.exports = { runbooks };
