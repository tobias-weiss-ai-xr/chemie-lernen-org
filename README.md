# Hugo Docker Image

[![Docker Automated build](https://img.shields.io/docker/automated/jguyomard/hugo-builder.svg)](https://store.docker.com/community/images/jguyomard/hugo-builder)
[![Docker Build Status](https://img.shields.io/docker/build/jguyomard/hugo-builder.svg)](https://store.docker.com/community/images/jguyomard/hugo-builder/builds)
[![Docker Pulls](https://img.shields.io/docker/pulls/jguyomard/hugo-builder.svg)](https://store.docker.com/community/images/jguyomard/hugo-builder)
[![Image Info](https://images.microbadger.com/badges/image/jguyomard/hugo-builder.svg)](https://microbadger.com/images/jguyomard/hugo-builder)

[Hugo](https://gohugo.io/) is a fast and flexible static site generator, written in Go.
Hugo flexibly works with many formats and is ideal for blogs, docs, portfolios and much more.
Hugo’s speed fosters creativity and makes building a website fun again.

This Lightweight Docker Image is based on Alpine, and comes with rsync for Continuous Deployment.

## Get Started

Print Hugo Help:

```bash
docker run --rm -it jguyomard/hugo-builder hugo help
```

Create a new Hugo managed website:

```bash
docker run --rm -it -v $PWD:/src -u hugo jguyomard/hugo-builder hugo new site mysite
cd mysite

# Now, you probably want to add a theme (see https://themes.gohugo.io/):
git init
git submodule add https://github.com/budparr/gohugo-theme-ananke.git themes/ananke;
echo 'theme = "ananke"' >> config.toml
```

Add some content:

```bash
docker run --rm -it -v $PWD:/src -u hugo jguyomard/hugo-builder hugo new posts/my-first-post.md

# Now, you can edit this post, add your content and remove "draft" flag:
xdg-open content/posts/my-first-post.md
```

Build your site:

```bash
docker run --rm -it -v $PWD:/src -u hugo jguyomard/hugo-builder hugo
```

Serve your site locally:

```bash
docker run --rm -it -v $PWD:/src -p 1313:1313 -u hugo jguyomard/hugo-builder hugo server -w --bind=0.0.0.0
```

Then open [`http://localhost:1313/`](http://localhost:1313/) in your browser.

### Serving with HAProxy and HTTPS (Let's Encrypt)

To serve your Hugo site via HTTPS using HAProxy and obtain SSL certificates with Let's Encrypt:

**1. Prerequisites:**

*   Ensure that your domain (`chemie-lernen.org` and optionally `www.chemie-lernen.org`) is pointing to the public IP address of your server.
*   Make sure ports 80 and 443 are open on your server's firewall.

**2. Setup Docker Compose:**

First, stop and remove any previously running Hugo or HAProxy containers:
```bash
docker-compose down --volumes --remove-orphans || true
```

Then, create the necessary directories for Certbot:
```bash
mkdir -p ./data/certbot/www
```

**3. Build and Run Services:**

Build the Docker images and start the services using `docker-compose`:
```bash
docker-compose build
docker-compose up -d
```

**4. Obtain Let's Encrypt Certificates:**

Before HAProxy can use HTTPS, you need to obtain the certificates. Run the Certbot container to get them. **Replace `your-email@example.com` with your actual email address and `chemie-lernen.org` with your domain.** If you have multiple domains (e.g., `www.chemie-lernen.org`), add them with `-d` flags.

```bash
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d chemie-lernen.org --email your-email@example.com --agree-tos --no-eff-email
```

Certbot will store the certificates in the `data/certbot/conf/live/chemie-lernen.org/` directory (mounted to `/etc/letsencrypt/live/chemie-lernen.org/` in the `certs` volume).

**5. Prepare Certificates for HAProxy:**

HAProxy requires the full chain and private key to be in a single `.pem` file. You need to combine `fullchain.pem` and `privkey.pem`.

```bash
DOMAIN="chemie-lernen.org" # Replace with your domain
cat "./data/certbot/conf/live/${DOMAIN}/fullchain.pem" "./data/certbot/conf/live/${DOMAIN}/privkey.pem" > "./data/certbot/conf/live/${DOMAIN}/${DOMAIN}.pem"
# Copy it to the location HAProxy expects (which is mounted to certs volume)
cp "./data/certbot/conf/live/${DOMAIN}/${DOMAIN}.pem" "./data/certbot/conf/live/${DOMAIN}/../../certs/${DOMAIN}.pem"
```

**6. Restart HAProxy:**

HAProxy needs to be restarted to load the new certificates.

```bash
docker-compose restart haproxy
```

Your Hugo site should now be accessible via `https://chemie-lernen.org/`. All HTTP traffic will be redirected to HTTPS.

**7. Automatic Certificate Renewal:**

Certificates are valid for 90 days. You should set up a cron job or a Docker-native mechanism to renew them automatically. You can test renewal with:

```bash
docker-compose run --rm certbot renew --dry-run
```

To run a real renewal, use:

```bash
docker-compose run --rm certbot renew
```

After renewal, you will need to restart HAProxy again for the new certificates to be loaded. You could automate this by adding a post-renewal hook in Certbot or a cron job that checks for renewed certificates and restarts HAProxy.

To go further, read the [Hugo documentation](https://gohugo.io/documentation/).

## Bash Alias

For ease of use, you can create a bash alias:

```bash
alias hugo='docker run --rm -it -v $PWD:/src -u hugo jguyomard/hugo-builder hugo'
alias hugo-server='docker run --rm -it -v $PWD:/src -p 1313:1313 -u hugo jguyomard/hugo-builder hugo server --bind 0.0.0.0'
```

Now, you can use `hugo help`, `hugo new foo/bar.md`, `hugo-server -w`, etc.

## Supported tags

The latest builds are:

- [`latest`](https://github.com/jguyomard/docker-hugo/blob/master/Dockerfile)
- [`extras`](https://github.com/jguyomard/docker-hugo/blob/master/extras/Dockerfile)
- [`0.55`](https://github.com/jguyomard/docker-hugo/blob/v0.55/Dockerfile)
- [`0.55-extras`](https://github.com/jguyomard/docker-hugo/blob/v0.55/extras/Dockerfile)

A complete list of available tags can be found on the [docker store page](https://store.docker.com/community/images/jguyomard/hugo-builder/tags).

## Users

By default, this docker image run as the root user. This makes it easy to use as base image for other Dockerfiles (switching back and forth adds extra layers and is against the current [best practices](https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/#user) advised by Docker). Most (all official?) base images leave the default user as root.

However, this docker image also define a non-root user `hugo` (UID 1000, GID 1000) which can be switched on at run time using the `--user` flag to `docker run`.

```bash
docker run --rm -it -v $PWD:/src --user hugo jguyomard/hugo-builder hugo
```

You can also change this according your needs, by setting another UID/GID. For instance, to run hugo with user `www-data:www-data` (UID 33, GID 33) :

```bash
docker run --rm -it -v $PWD:/src -u 33:33 jguyomard/hugo-builder hugo
```

## Extras

The [`extras`](https://github.com/jguyomard/docker-hugo/blob/master/extras/Dockerfile) tag adds additional tools and packages:

- py-pygments

To use this version:

```bash
docker run --rm -it -v $PWD:/src -u hugo jguyomard/hugo-builder:extras hugo
```

## Continuous Deployment

I use this Docker image for Continuous Deployment. You can find some CI config examples in the [`ci-deploy`](https://github.com/jguyomard/docker-hugo/tree/master/ci-deploy) directory.

This Docker image also comes with:

- rsync
- git
- openssh-client
- [minify](https://github.com/tdewolff/minify)

## Issues

If you have any problems with or questions about this docker image, please contact me through a [GitHub issue](https://github.com/jguyomard/docker-hugo/issues).
If the issue is related to Hugo itself, please leave an issue on the [Hugo official repository](https://github.com/spf13/hugo).

## Contributing

You are invited to contribute new features, fixes or updates to this container, through a [Github Pull Request](https://github.com/jguyomard/docker-hugo/pulls).

## Systemd Service for Automatic Startup

To automatically start your Docker Compose services on system boot, you can set up a systemd service.

1.  **Copy the service file:**
    Copy the `docker-hugo.service` file to your systemd configuration directory:

    ```bash
    sudo cp docker-hugo.service /etc/systemd/system/
    ```

2.  **Enable the service:**
    Enable the service to start on boot:

    ```bash
    sudo systemctl enable docker-hugo.service
    ```

3.  **Start the service:**
    Start the service immediately:

    ```bash
    sudo systemctl start docker-hugo.service
    ```

4.  **Check the service status:**
    You can check the status of your service with:

    ```bash
    sudo systemctl status docker-hugo.service
    ```

5.  **Stop the service:**
    To stop the service:

    ```bash
    sudo systemctl stop docker-hugo.service
    ```

6.  **Disable the service:**
    To prevent the service from starting on boot:

    ```bash
    sudo systemctl disable docker-hugo.service
    ```

**Important:** Ensure that the `WorkingDirectory` in `docker-hugo.service` (`/root/git/docker-hugo`) correctly points to the directory where your `docker-compose.yml` file is located. Also, verify that `docker-compose` is in your system's PATH (e.g., `/usr/local/bin/docker-compose`).
