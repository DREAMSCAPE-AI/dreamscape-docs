---
title: Big Pods CI/CD Reference
description: Detailed reference for the current Dreamscape multi-repository CI/CD and Big Pods deployment flow.
---

# Big Pods CI/CD Reference

This document is the current source of truth for the Dreamscape CI/CD runtime model.

It documents the active flow used across:

- `dreamscape-frontend`
- `dreamscape-services`
- `dreamscape-tests`
- `dreamscape-infra`

## Why this model exists

The project used to rely on a central deployment workflow triggered through `repository_dispatch`.
That model had two structural issues:

- overlapping infra workflows triggered similar build and deploy paths
- documentation and execution flow diverged over time

The current model keeps responsibilities separate:

- source repositories own CI
- `dreamscape-infra` owns deployment orchestration
- `dreamscape-tests` owns test orchestration

## Active workflow map

| Repository | Workflow | Role | Trigger |
|---|---|---|---|
| `dreamscape-frontend` | `.github/workflows/ci-trigger.yml` | local frontend CI and staging dispatch | `push`, `pull_request` |
| `dreamscape-services` | `.github/workflows/ci-trigger.yml` | local services CI and staging dispatch | `push`, `pull_request` |
| `dreamscape-services` | `.github/workflows/ci.yml` | service CI and tests fan-out | `push`, `pull_request` |
| `dreamscape-tests` | `.github/workflows/branch-testing.yml` | multi-repo tests | `push`, `pull_request`, `repository_dispatch` |
| `dreamscape-infra` | `.github/workflows/bigpods-cd.yml` | build, push, and deploy Big Pods | `push` on `main`, `workflow_dispatch` |
| `dreamscape-infra` | `.github/workflows/bigpods-ci.yml` | validate infra config and scripts | infra `push`, `pull_request` |
| `dreamscape-infra` | `.github/workflows/bigpods-release.yml` | release management | release events, manual |
| `dreamscape-infra` | `.github/workflows/ci.yml` | infra repository checks | infra `push`, `pull_request`, manual |

## End-to-end flow

### Flow A - frontend or services push to `main`

```text
push main on source repo
        |
        v
local CI in source repository
        |
        v
actions.createWorkflowDispatch(bigpods-cd.yml)
        |
        v
dreamscape-infra / bigpods-cd.yml
  1. validate deploy inputs
  2. build and push Big Pods images
  3. deploy staging
  4. run post-deploy validation
```

Dispatch conditions:

- event is `push`
- branch is `main`
- `DISPATCH_TOKEN` exists

Dispatch payload includes:

- `environment: staging`
- `version: <short source sha>`
- `deployment_strategy: rolling`
- `force_deployment: false`

### Flow B - frontend or services pull request

```text
pull request on source repo
        |
        v
local CI only
```

No infra deployment should start from a PR.

### Flow C - tests push or pull request

```text
push or PR on tests repo
        |
        v
branch-testing.yml
  1. parse context
  2. prepare test environment
  3. clone services and frontend if needed
  4. run unit, integration, cross-service, and e2e checks
  5. publish summary
```

The tests repository does not deploy infrastructure.

### Flow D - services fan-out to tests

`dreamscape-services/.github/workflows/ci.yml` can still emit:

```text
repository_dispatch
event_type: test-request
```

That event is consumed by:

- `dreamscape-tests/.github/workflows/branch-testing.yml`

This is test orchestration only.

## Big Pods CD job structure

`dreamscape-infra/.github/workflows/bigpods-cd.yml` is the active deployment entrypoint.

High-level job sequence:

1. `pre-deployment`
   - resolve environment
   - resolve version
   - validate deploy prerequisites
2. `build-and-push`
   - checkout infra
   - clone source dependencies
   - build and push pod images to GHCR
3. `deploy-staging` or `deploy-production`
   - prepare runtime environment
   - configure cluster access
   - update image tags in manifests
   - apply bootstrap resources
4. `post-deployment-validation`
   - summarize deployment
   - notify
   - cleanup

## Operational checks

From `dreamscape-infra`:

```bash
./scripts/QUICK_DEPLOY_COMMANDS.sh check
./scripts/setup-dispatch-architecture.sh validate
```

Manual staging trigger:

```bash
./scripts/QUICK_DEPLOY_COMMANDS.sh trigger-staging
```

or

```bash
./scripts/setup-dispatch-architecture.sh test-dispatch manual-20260306
```

## Secrets and credentials

### Needed in source repositories

Required in:

- `dreamscape-frontend`
- `dreamscape-services`

Secret:

- `DISPATCH_TOKEN`

Purpose:

- authorize `actions.createWorkflowDispatch` on `dreamscape-infra`

### Needed in infra

Typical secrets referenced by `bigpods-cd.yml`:

- `K3S_HOST`
- `K3S_SSH_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `SLACK_WEBHOOK_URL`

## What changed from the legacy model

Removed from the active deployment path:

- `repository_dispatch` based deployment orchestration in infra
- `dreamscape-infra/.github/workflows/unified-cicd.yml`
- overlapping central deploy workflows that duplicated Big Pods deployment responsibility

Still valid:

- tests fan-out from `dreamscape-services` to `dreamscape-tests`
- local CI inside each source repository
- Big Pods deployment managed centrally by infra

## Known limitation

The `version` input sent by frontend or services is currently a deployment label, not a strict source checkout pin.

At build time, `bigpods-cd.yml` still clones frontend and services from the remote repository default branch with shallow clone behavior.
That means:

- the deployment is tagged with the source repo short SHA
- the actual build input is the latest remote default branch at build time

If strict traceability from source commit to image digest is required, `bigpods-cd.yml` still needs a follow-up change.

## Troubleshooting

### Push to `main` did not deploy staging

Check:

1. source repo CI completed successfully
2. `DISPATCH_TOKEN` exists in the source repo
3. the dispatch step targeted `bigpods-cd.yml`
4. the infra run started with `workflow_dispatch`

### Tests are green but look suspicious

Review the logs in `dreamscape-tests/.github/workflows/branch-testing.yml` and confirm:

- unit or integration commands actually executed
- the run did not only skip optional commands
- coverage and summary artifacts were produced

### Infra build used the wrong source revision

This is currently possible because `bigpods-cd.yml` clones the remote default branch during build.
Treat this as a known architecture gap until the workflow is updated to pin source revisions explicitly.
