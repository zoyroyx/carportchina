# CarPort China

Production: https://carportchina.ru/

Full React/Vite source is in `site/`. The root `index.html` preserves the older GitHub Pages preview.

GitHub Actions builds all pages with `pnpm build:static` and deploys only `site/dist/static/` to FTP directory `/carportchina.ru`. Run the **Build and deploy carportchina.ru** workflow manually, or push changes under `site/` to `main`.

Credentials are repository Actions Secrets: FTP_HOST, FTP_PORT, FTP_USERNAME, FTP_PASSWORD. No credentials are committed. Uploads replace files individually via temporary names, upload assets before pages, keep prior entry files in a 14-day workflow artifact and do not delete remote files.

The shared hosting receives pre-rendered HTML, assets, robots.txt, sitemap.xml and Apache redirect/404 rules. Client filtering restores query parameters after hydration. Node.js is used during the Actions build, not required on the hosting server.

Lead submission and CMS remain unimplemented; forms retain their existing preview behavior.
