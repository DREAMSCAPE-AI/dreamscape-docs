# CI/CD Refactor - Verification Checklist

Use this checklist to verify that the new CI/CD pipeline has been correctly deployed and configured.

## Pre-Deployment Verification

### Files Created

- [ ] `dreamscape-infra/.github/workflows/unified-cicd.yml` exists
- [ ] `dreamscape-services/.github/workflows/ci-trigger.yml` exists
- [ ] `dreamscape-frontend/.github/workflows/ci-trigger.yml` exists
- [ ] `dreamscape-infra/docs/CICD_SETUP.md` exists
- [ ] `dreamscape-infra/docs/MIGRATION_GUIDE.md` exists
- [ ] `dreamscape-infra/CICD_README.md` exists
- [ ] `CICD_REFACTOR_SUMMARY.md` exists
- [ ] `QUICK_DEPLOY_COMMANDS.sh` exists and is executable
- [ ] `COMMIT_MESSAGE.txt` exists

### Old Workflows Backed Up

- [ ] Old workflows copied to `.github-workflows-backup/`
- [ ] `central-cicd.yml` backed up
- [ ] `central-dispatch.yml` backed up
- [ ] `deploy.yml` backed up
- [ ] `bigpods-*.yml` backed up

## GitHub Configuration

### Repository: dreamscape-infra

#### Environments Created
- [ ] `dev` environment created
- [ ] `staging` environment created
- [ ] `production` environment created

#### Environment: dev
- [ ] No protection rules configured
- [ ] Secret `K3S_HOST` added
- [ ] Secret `K3S_SSH_KEY` added

#### Environment: staging
- [ ] Protection rule: 1 required reviewer
- [ ] Protection rule: Deployment branches = `main`, `develop`
- [ ] Secret `K3S_HOST` added
- [ ] Secret `K3S_SSH_KEY` added

#### Environment: production
- [ ] Protection rule: 2 required reviewers
- [ ] Protection rule: Wait timer = 5 minutes
- [ ] Protection rule: Deployment branches = `main` only
- [ ] Secret `K3S_HOST` added
- [ ] Secret `K3S_SSH_KEY` added

#### Repository Secrets
- [ ] `DISPATCH_TOKEN` added (GitHub PAT with repo + workflow scopes)
- [ ] `GITHUB_TOKEN` available (automatic)

---

### Repository: dreamscape-services

#### Environments Created
- [ ] `dev` environment created
- [ ] `staging` environment created
- [ ] `production` environment created

#### Environment Secrets (same as infra)
- [ ] dev: `K3S_HOST` and `K3S_SSH_KEY` added
- [ ] staging: `K3S_HOST` and `K3S_SSH_KEY` added
- [ ] production: `K3S_HOST` and `K3S_SSH_KEY` added

#### Repository Secrets
- [ ] `DISPATCH_TOKEN` added

---

### Repository: dreamscape-frontend

#### Environments Created
- [ ] `dev` environment created
- [ ] `staging` environment created
- [ ] `production` environment created

#### Environment Secrets (same as infra)
- [ ] dev: `K3S_HOST` and `K3S_SSH_KEY` added
- [ ] staging: `K3S_HOST` and `K3S_SSH_KEY` added
- [ ] production: `K3S_HOST` and `K3S_SSH_KEY` added

#### Repository Secrets
- [ ] `DISPATCH_TOKEN` added

---

### Repository: dreamscape-tests

#### Environments Created
- [ ] `dev` environment created
- [ ] `staging` environment created
- [ ] `production` environment created

#### Repository Secrets
- [ ] `DISPATCH_TOKEN` added

---

### Repository: dreamscape-docs

#### Environments Created
- [ ] `dev` environment created
- [ ] `staging` environment created
- [ ] `production` environment created

#### Repository Secrets
- [ ] `DISPATCH_TOKEN` added

## Jira Configuration

### GitHub for Jira App
- [ ] GitHub for Jira app installed in Jira workspace
- [ ] DREAMSCAPE-AI organization connected
- [ ] All repositories selected:
  - [ ] dreamscape-services
  - [ ] dreamscape-frontend
  - [ ] dreamscape-tests
  - [ ] dreamscape-docs
  - [ ] dreamscape-infra
- [ ] Deployments feature enabled in app settings

### Webhook Verification
- [ ] GitHub → Settings → Webhooks shows Jira webhook
- [ ] Webhook is active (green checkmark)
- [ ] Recent deliveries show successful responses

## Testing Phase

### Test 1: Dev Deployment

#### Setup
- [ ] Created test branch: `feature/test-unified-cicd`
- [ ] Made test commit with Jira issue key (e.g., DR-TEST)
- [ ] Pushed to feature branch

#### Expected Results
- [ ] Local CI ran in source repository
- [ ] `unified-cicd.yml` triggered in dreamscape-infra
- [ ] GitHub Deployment created for `dev` environment
- [ ] Tests passed (or skipped if none)
- [ ] Docker image built successfully
- [ ] K3s deployment successful
- [ ] Deployment status = `success` in GitHub
- [ ] Jira issue shows deployment to `dev`

#### Verification Commands
```bash
# Check workflow run
gh run list --repo DREAMSCAPE-AI/dreamscape-infra --limit 1

# Check deployment
gh api repos/DREAMSCAPE-AI/dreamscape-services/deployments

# Check Jira (manual)
# Open issue DR-TEST → Scroll to Deployments section
```

#### Results
- [ ] ✅ All checks passed
- [ ] ❌ Issues found (describe below)

**Issues**: _______________________________________________________

---

### Test 2: Staging Deployment (with Approval)

#### Setup
- [ ] Merged feature branch to `develop`
- [ ] Pushed to `develop` branch

#### Expected Results
- [ ] Workflow triggered
- [ ] Approval requested from 1 reviewer
- [ ] After approval, deployment started
- [ ] Deployment completed successfully
- [ ] Jira issue shows deployment to `staging`

#### Verification
- [ ] Deployment requires approval (workflow paused)
- [ ] Reviewer received notification
- [ ] Approval granted via GitHub UI
- [ ] Deployment resumed after approval
- [ ] Deployment status = `success`

#### Results
- [ ] ✅ All checks passed
- [ ] ❌ Issues found (describe below)

**Issues**: _______________________________________________________

---

### Test 3: Production Deployment (with Approval + Wait)

#### Setup
- [ ] Merged `develop` to `main`
- [ ] Pushed to `main` branch

#### Expected Results
- [ ] Workflow triggered
- [ ] Approval requested from 2 reviewers
- [ ] After approvals, 5-minute wait timer started
- [ ] After timer, deployment started
- [ ] Deployment completed successfully
- [ ] Jira issue shows deployment to `production`

#### Verification
- [ ] Deployment requires 2 approvals (workflow paused)
- [ ] 2 reviewers received notifications
- [ ] Both approvals granted
- [ ] 5-minute wait timer activated
- [ ] Deployment started after timer
- [ ] Deployment status = `success`

#### Results
- [ ] ✅ All checks passed
- [ ] ❌ Issues found (describe below)

**Issues**: _______________________________________________________

## Jira Integration Verification

### Issue View
- [ ] Open test issue (DR-TEST or equivalent)
- [ ] "Deployments" section is visible
- [ ] Shows deployment to `dev` environment
- [ ] Shows deployment time and date
- [ ] Shows deployment status (success/failure)
- [ ] Link to GitHub Actions run works
- [ ] Environment URL displayed (if configured)

### Multiple Environments
- [ ] Same issue shows deployments to multiple environments
- [ ] Can distinguish between dev/staging/production
- [ ] Can see deployment history

### Failed Deployment
- [ ] Trigger a failing deployment (break tests intentionally)
- [ ] Jira shows deployment with `failed` status
- [ ] Link to failed workflow run works

## Performance Verification

### Pipeline Duration
- [ ] Dev deployment: < 10 minutes
- [ ] Staging deployment: < 15 minutes (including approval time)
- [ ] Production deployment: < 20 minutes (including approvals + wait)

### Build Cache
- [ ] Docker build cache working (check layer reuse)
- [ ] npm cache working (faster dependency install)

## Security Verification

### Secrets Protection
- [ ] Secrets not visible in workflow logs
- [ ] Environment secrets only accessible in correct environment
- [ ] DISPATCH_TOKEN works across repositories

### Branch Protection
- [ ] Cannot push directly to `main` without PR
- [ ] Cannot deploy to production from feature branch
- [ ] Deployment branch rules enforced

### Approval Workflow
- [ ] Cannot bypass approval for staging
- [ ] Cannot bypass approval for production
- [ ] Wait timer cannot be skipped

## Documentation Verification

### README Files
- [ ] `CICD_README.md` is clear and understandable
- [ ] Quick start section is accurate
- [ ] Examples work as described

### Setup Guide
- [ ] `docs/CICD_SETUP.md` is comprehensive
- [ ] All steps are accurate
- [ ] Screenshots/diagrams are helpful (if added)

### Migration Guide
- [ ] `docs/MIGRATION_GUIDE.md` is complete
- [ ] Rollback plan is tested and works
- [ ] Checklist is accurate

## Old Workflows

### Disabled Workflows
- [ ] Old workflows renamed to `.disabled`
- [ ] Old workflows not triggering on push
- [ ] No conflicts with new workflows

### Backup
- [ ] Old workflows backed up safely
- [ ] Can restore if needed

## Post-Deployment Tasks

### Team Communication
- [ ] Team notified of new CI/CD pipeline
- [ ] Documentation links shared
- [ ] Training session scheduled (if needed)

### Monitoring Setup
- [ ] GitHub Actions notifications configured
- [ ] Slack notifications configured (if applicable)
- [ ] Email notifications for deployment failures

### Cleanup (After 1 Week)
- [ ] Monitoring shows stable pipeline
- [ ] No issues reported by team
- [ ] Ready to delete old workflows
- [ ] Old workflows deleted from repositories

## Final Verification

### Overall Status
- [ ] All repositories configured correctly
- [ ] All environments working
- [ ] Jira integration functional
- [ ] Team trained and comfortable with new workflow
- [ ] Documentation up to date
- [ ] Old workflows removed (after validation period)

### Sign-Off

**Verified by**: _______________________

**Date**: _______________________

**Notes**:
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

## Issues Log

Use this section to track any issues found during verification:

| # | Issue | Severity | Status | Resolution |
|---|-------|----------|--------|------------|
| 1 |       |          |        |            |
| 2 |       |          |        |            |
| 3 |       |          |        |            |

## Next Actions

Based on verification results:

1. [ ] Fix any critical issues found
2. [ ] Document workarounds for minor issues
3. [ ] Schedule follow-up review in 1 week
4. [ ] Plan deletion of old workflows
5. [ ] Gather team feedback
6. [ ] Update documentation based on learnings

---

**Checklist Version**: 1.0.0
**Last Updated**: 2025-11-27
