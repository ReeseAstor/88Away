# Production Runbook

This runbook expands on the high-level deployment overview and walks through the
post-provisioning tasks that keep the Romance Platform healthy in production.

## 1. Verify the stack came up cleanly
1. Confirm every container is running:
   ```bash
   docker compose -f docker-compose.production.yml ps
   ```
2. Tail the main app logs during the first boot to ensure Drizzle migrations and
   the build step complete successfully:
   ```bash
   docker compose -f docker-compose.production.yml logs -f romance-platform
   ```
3. Repeat for the job queue, analytics, and AI services so you can spot missing
   environment variables early:
   ```bash
   for service in romance-job-queue romance-analytics romance-ai-service; do
     docker compose -f docker-compose.production.yml logs -f "$service"
   done
   ```

## 2. Run database migrations (Drizzle)
The production image does not run migrations automatically. After the containers
are online, apply schema changes with Drizzle Kit:
```bash
docker compose -f docker-compose.production.yml exec romance-platform npm run db:push
```

If you maintain a separate migrations runner, point it at the same `DATABASE_URL`
value that the Compose stack uses and run `drizzle-kit push` from the source tree.

## 3. Seed or import essential data
- **Bootstrap accounts:** Use the application UI to create the first admin
  account or run a one-off script in the container:
  ```bash
  docker compose -f docker-compose.production.yml exec romance-platform node scripts/create-admin.js
  ```
- **Import legacy assets:** Copy existing covers/uploads into the bind-mounted
  volumes so Nginx can serve them immediately:
  ```bash
  docker cp ./backups/uploads/. $(docker compose -f docker-compose.production.yml ps -q romance-platform):/app/uploads
  ```

## 4. Validate external integrations
- **Stripe:** Verify the webhook secret and API key by creating a $1 test
  payment from the staging environment that points to production Stripe keys.
- **KDP integration:** Trigger a small export through the UI and confirm the job
  shows up in the `romance-job-queue` logs.
- **OpenAI:** Run an AI scene generation to ensure the `OPENAI_API_KEY` is
  accepted and rate limits are respected.

## 5. Harden TLS and DNS
1. Point your DNS A record to the host running this stack.
2. Run Certbot once the DNS change propagates:
   ```bash
   docker compose -f docker-compose.production.yml run --rm certbot
   ```
3. Reload Nginx to pick up the certificates:
   ```bash
   docker compose -f docker-compose.production.yml exec romance-nginx nginx -s reload
   ```
4. Schedule a cron job for renewal (Certbot container shares volumes with
   Nginx, so re-running the command monthly is sufficient).

## 6. Schedule backups
Back up the persistent volumes regularly. Example using `tar` and a temporary
container:
```bash
docker run --rm \
  -v 88away_romance_db_data:/source \
  -v $(pwd)/backups:/backups \
  alpine tar czf /backups/romance-db-$(date +%Y%m%d).tar.gz -C /source .
```
Repeat for `romance_uploads`, `romance_exports`, `romance_covers`, and
`romance_analytics_data`.

## 7. Monitor health and performance
- Access Prometheus (`:9090`) and Grafana (`:3000`) using the host IP or a VPN.
- Create dashboards for API latency, queue depth, Stripe errors, and AI request
  volume.
- Configure alerts that notify your on-call channel when response times or error
  rates cross agreed thresholds.

## 8. Scale workload-specific services
The AI processor and job queue define `deploy.replicas` hints. To scale them on a
single host use Compose overrides:
```bash
docker compose -f docker-compose.production.yml up -d \
  --scale romance-ai-service=4 \
  --scale romance-job-queue=5
```
For multi-host scaling, migrate to Swarm or Kubernetes and mirror the same
service definitions and environment variables.

## 9. Plan for disaster recovery
- Keep encrypted copies of `.env.production` and OAuth/API secrets in your
  password manager or secret store.
- Document the steps to restore from volume backups and rehearse them quarterly.
- Export Grafana dashboards and Prometheus alert rules so they can be reloaded
  quickly after a rebuild.

## 10. Maintain change management hygiene
- Every deployment should pass `npm run build` locally before pushing.
- Tag Docker images with the git SHA and push them to your registry if you need
  reproducible rollbacks.
- Store compose overrides (for example, different domain names or scaling
  factors) in source control so the team can reproduce the production setup.

Following this runbook gives you a repeatable, auditable path for operating the
Romance Platform beyond the initial `docker compose up` command.
