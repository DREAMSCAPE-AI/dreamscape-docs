---
title: Dreamscape CI/CD Setup Guide
description: Current setup guide for the Big Pods deployment flow and cross-repository CI/CD triggers.
---

# Dreamscape CI/CD Setup Guide

This guide describes the current CI/CD setup used by the Dreamscape repositories.
It replaces the old centralized `repository_dispatch` plus `unified-cicd.yml` model.

For the detailed operating reference, use:

- `infrastructure/cicd/bigpods-cicd.md`

## Current model

- CI stays in each source repository
- deployment orchestration stays in `dreamscape-infra`
- `dreamscape-frontend` and `dreamscape-services` can trigger staging deployment on `push` to `main`
- `dreamscape-tests` runs tests only and does not deploy infrastructure

## Active repositories

| Repository | Main responsibility |
|---|---|
| `dreamscape-frontend` | frontend CI and staging deploy trigger |
| `dreamscape-services` | backend CI, test fan-out, and staging deploy trigger |
| `dreamscape-tests` | multi-repo test orchestration |
| `dreamscape-infra` | build, push, and deploy Big Pods |

## Trigger behavior

### Frontend and services

- `push` to `main`
  - local CI runs first
  - if dispatch credentials are present, the repo triggers `dreamscape-infra/.github/workflows/bigpods-cd.yml`
  - target environment is `staging`
- `push` to non-main branches
  - local CI only
- pull request
  - local CI only

### Tests

- `push` to `main`, `dev`, or `develop`
  - tests CI runs
- pull request to `main`, `dev`, or `develop`
  - tests CI runs
- `repository_dispatch` with `event_type: test-request`
  - tests CI runs
- no test workflow triggers infrastructure deployment

## Required secrets

### Source repositories

Required in:

- `dreamscape-frontend`
- `dreamscape-services`

Secret:

- `DISPATCH_TOKEN`

Purpose:

- allows `actions.createWorkflowDispatch` on `dreamscape-infra`

### Infrastructure repository

Referenced by `dreamscape-infra/.github/workflows/bigpods-cd.yml`:

- `K3S_HOST`
- `K3S_SSH_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `SLACK_WEBHOOK_URL`

## Setup checklist

### 1. Verify workflow layout

Confirm the active workflows exist:

- `dreamscape-frontend/.github/workflows/ci-trigger.yml`
- `dreamscape-services/.github/workflows/ci-trigger.yml`
- `dreamscape-services/.github/workflows/ci.yml`
- `dreamscape-tests/.github/workflows/branch-testing.yml`
- `dreamscape-infra/.github/workflows/bigpods-cd.yml`

### 2. Configure dispatch permissions

Add `DISPATCH_TOKEN` in:

- `dreamscape-frontend`
- `dreamscape-services`

The token must be allowed to trigger workflows in `dreamscape-infra`.

### 3. Validate the infra helper scripts

From `dreamscape-infra`:

```bash
./scripts/QUICK_DEPLOY_COMMANDS.sh check
./scripts/setup-dispatch-architecture.sh validate
```

### 4. Trigger a manual staging deployment

From `dreamscape-infra`:

```bash
./scripts/QUICK_DEPLOY_COMMANDS.sh trigger-staging
```

or

```bash
./scripts/setup-dispatch-architecture.sh test-dispatch manual-20260306
```

## Verification after a push

### Frontend or services push to `main`

Expected sequence:

1. local CI succeeds in the source repository
2. the dispatch step runs
3. `dreamscape-infra/.github/workflows/bigpods-cd.yml` starts
4. Big Pods images build and push
5. staging deploy runs

### Push or PR in tests

Expected sequence:

1. `dreamscape-tests/.github/workflows/branch-testing.yml` starts
2. unit, integration, cross-service, and e2e jobs run as applicable
3. no infra workflow starts from the tests repository

## Known limitations

- The `version` sent by frontend or services is currently used as a deployment label.
- `bigpods-cd.yml` still clones frontend and services from the remote repository default branch at build time.
- If strict source-to-image pinning is required, `bigpods-cd.yml` still needs a follow-up change.

## Legacy model removed

The following elements are not part of the active CI/CD path anymore:

- `repository_dispatch` based deployment orchestration in infra
- `dreamscape-infra/.github/workflows/unified-cicd.yml`
- duplicate central deploy workflows that overlapped with Big Pods CD

Use `infrastructure/cicd/bigpods-cicd.md` for the detailed runtime reference.
