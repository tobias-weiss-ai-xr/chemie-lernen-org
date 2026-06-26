# Hubs-Stack Deployment Plan

**Date:** 2026-06-26
**Goal:** Bring `https://hubs.tobias-weiss.org/` online as a working
Mozilla Hubs instance, integrated with chemie-lernen.org.

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
