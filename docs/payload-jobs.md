# Payload jobs

Background work runs as Payload jobs in the CMS process: `translate`,
`translateTopics`, `warmCache` (daily at midnight UTC) and
`deliverScheduledPdfs` (hourly, see
[scheduled-pdf-delivery.md](/docs/scheduled-pdf-delivery.md)). Tasks live in
`src/payload/jobs/`; the queues, crons and runner gate are in the `jobs` block
of `src/payload/payload-config.ts`.

## One runner per database

Production runs several CMS instances against one database. Payload's runner
is not safe for that:

- **Claiming** a job is a select followed by an update, not
  `FOR UPDATE SKIP LOCKED`, so two instances that tick on the same minute can
  both pick up and run the same job. When one finishes it deletes the job
  (`deleteJobOnComplete`), and the other fails marking it complete with
  `TypeError: Cannot use 'in' operator to search for '_rels' in undefined`
  ("Error in job queue cron job handler").
- **Scheduling** checks for an existing queued job, then inserts one, so each
  instance can queue its own copy of a scheduled job.

So only one instance schedules and runs jobs: the one holding a Postgres
session-level advisory lock (`src/payload/jobs/jobRunnerLock.ts`). Each
instance keeps one extra connection (`norse-cms-jobs-lock` in
`pg_stat_activity`) and tries the lock every minute from
`jobs.shouldAutoRun`. The holder then calls `payload.jobs.handleSchedules`
for all queues and runs jobs; the others do nothing. Every `autoRun` entry
sets `disableScheduling: true`, because Payload schedules before it calls
`shouldAutoRun`.

If the holder stops or loses its connection, Postgres releases the lock and
another instance takes over within a minute. The public app
(`NORSE_ROLE=app`) never runs jobs.

## Operating

- Which instance runs jobs: the log line `Acquired the job runner lock`
  (module `jobRunnerLock`), or
  `select pid, application_name from pg_locks join pg_stat_activity using (pid) where locktype = 'advisory' and objid = 211001;`
- Jobs left with `processing = true` from a crashed run are never picked up
  again; clear them in the `payload_jobs` table (super admins also see the
  Jobs collection in the admin).
