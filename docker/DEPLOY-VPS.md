# Deploy VPS

Single host, Docker Compose (`compose.yaml` + `compose.prod.yaml`). Caddy terminates TLS (ACME HTTP-01); no other port
is published publicly.

```
:443 caddy ─┬─ ${SGN_DOMAIN}/                                  → portal:80   (/api/iam → iam:8081, /api/hr → hr:8082)
            ├─ ${SGN_DOMAIN}/{lms,api/lms,lms-files}/*         → lms-fe:80   (/api/iam → iam, /api/lms → lms:8083, /lms-files → s3:9000)
            ├─ ${DIRECTORY_DOMAIN}/api/* (prefix stripped)     → directory:8080
            └─ ${DIRECTORY_DOMAIN}/*                           → directory-fe:80
internal: postgres:5432 (db_iam, db_hr, db_lms, db_directory), s3 (RustFS), hr-worker, lms-worker, *-migrate
loopback: lms-fe 127.0.0.1:3003 (seed), postgres 127.0.0.1:55432
```

Portal and LMS share one origin on purpose: IAM's refresh cookie is `SameSite=Strict`, `Path=/api/iam/v1/auth`.

## Requirements

- Ubuntu 22.04/24.04, x86_64, ≥ 2 vCPU / 4 GB RAM (8 GB recommended; builds of Go + Vite peak around 4 GB), ≥ 60 GB disk.
- A records for `SGN_DOMAIN` and `DIRECTORY_DOMAIN` → the host; 80/443 open in the provider firewall.
- Read access from the host to `yogaro/*` (SSH key or HTTPS credential helper).

## Files

| File | Purpose |
| --- | --- |
| `compose.prod.yaml` | `caddy` service; `ports: !reset` on app services; `ALLOWED_ORIGIN`/`S3_PUBLIC_URL` = `https://${SGN_DOMAIN}`; `COOKIE_SECURE=true`; `VITE_DIRECTORY_SERVICE_URL=https://${DIRECTORY_DOMAIN}/api` (build arg). Needs Compose ≥ 2.24.4. |
| `docker/caddy/Caddyfile` | Routes above; 600 MB body limit and unbuffered proxy for LMS media. |
| `docker/vps-setup.sh` | Docker (get.docker.com), Node 22 (NodeSource), 4 GB swap when RAM < 8 GB, ufw 22/80/443. |
| `docker/clone-repos.sh` | Clones/pulls the 11 app repos into the folder names compose expects. `GIT_BASE`, `BRANCH`. |
| `docker/vps-bootstrap.sh` | Writes `.env`, signing key, builds, creates service clients, starts everything. Idempotent. |
| `docker/backup.sh` | `pg_dump -Fc` ×4, tar of `sgn_s3-data`, `.env`, signing key → `backups/<date>/`, keeps `KEEP_DAYS` (14). |

## Install

```bash
git clone git@github.com:yogaro/sgn-deploy.git /opt/sgn && cd /opt/sgn
sudo bash docker/vps-setup.sh
docker/clone-repos.sh
SGN_DOMAIN=sgn.example.co.id DIRECTORY_DOMAIN=directory.example.co.id docker/vps-bootstrap.sh
docker compose run --rm iam createadmin          # IAM SUPERADMIN (Portal + LMS)
docker compose run --rm directory createuser     # Directory FE login
```

`vps-bootstrap.sh` sets in `.env`:
- `COMPOSE_FILE=compose.yaml:compose.prod.yaml`, so plain `docker compose` uses the overlay;
- `COOKIE_SECURE=true` and `LMS_PUBLIC_URL`;
- random `POSTGRES_PASSWORD`, `S3_ACCESS_KEY`/`S3_SECRET_KEY`, and `GRAFANA_ADMIN_PASSWORD`, only where empty;
- the service-client credentials, by piping the prompts of `createserviceclient`:
  - `DIRECTORY_SERVICE_KEY` (IAM → Directory);
  - `HR_IAM_CLIENT_ID`/`SECRET` and `LMS_IAM_CLIENT_ID`/`SECRET` (scope `iam.employees.read,iam.org.read`).

It also writes `docker/secrets/iam-signing-key.txt` (`genkey`) when that file is missing. Existing values are kept.

## Seed (FORMASI + pilot modules)

Not in git; copy from a machine that has them:

```bash
rsync -az seed/data/private/ HOST:/opt/sgn/seed/data/private/   # formasi.json, people.json, positions.json
rsync -az seed/assets/       HOST:/opt/sgn/seed/assets/         # ~275 MB, includes media.json and piloting PDFs
scp "Trailer Sugartime.mp4"  HOST:/opt/sgn/                     # login banner video
```

```bash
SEED_PASSWORD='…' SEED_MUST_CHANGE=1 seed/run.sh --formasi
```

- Every FORMASI employee and `DEMO-*-01` gets `SEED_PASSWORD` with `must_change_password=true`.
- `ADMIN-LMS` gets the same password with `must_change_password=false`, because the seed signs in with it.
- The bcrypt hash comes from pgcrypto in the postgres container.
- `SEED_MUST_CHANGE` without `SEED_PASSWORD` is refused, because the default `Demo#Sgn2026` is in the repo.
- `--formasi` rebuilds the LMS domain tables (`01_reset_lms_domain.sql`). Do not rerun it once the pilot has data.

## Update

```bash
git pull && docker/clone-repos.sh
docker compose up -d --build        # *-migrate run before their services (depends_on: service_completed_successfully)
docker image prune -f
```

## Backup / restore

```bash
0 2 * * * cd /opt/sgn && docker/backup.sh >> backups/backup.log 2>&1      # crontab
docker compose exec -T postgres pg_restore -U sgn -d db_lms --clean < backups/<date>/db_lms.dump
docker run --rm -v sgn_s3-data:/data -v "$PWD/backups/<date>":/in alpine tar xzf /in/s3-data.tar.gz -C /data
```

`backups/` is local to the host; ship it off-host.

## Monitoring

`docker compose --profile monitoring up -d`. Grafana listens on `127.0.0.1:3002` (use an SSH tunnel); the user is `admin`
and the password is `GRAFANA_ADMIN_PASSWORD`.

## Notes

- Docker-published ports bypass ufw. Only `caddy` publishes on `0.0.0.0`; keep it that way.
- `rustfs/rustfs:latest` is unpinned; pin a tag before production.
- Presigned media URLs are signed for `S3_PUBLIC_URL`'s host. Caddy and the `lms-fe` nginx both pass `Host` through
  unchanged; a proxy that rewrites `Host` breaks media.
- Untested on a real host as of 2026-11-24: Caddyfile, `vps-bootstrap.sh` end to end, and the seed with
  `SEED_PASSWORD`. `docker compose config` with the overlay passes.
