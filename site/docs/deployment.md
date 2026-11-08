# Production deployment

Repository: https://github.com/zoyroyx/carportchina
Production: https://carportchina.ru/
Workflow: `.github/workflows/deploy-ftp.yml` in the repository root.

The full source snapshot is in the repository `site/` directory. The working workspace keeps the same source at its root; `.deploy-repo/` is the deployment checkout. Update the corresponding `site/` files when publishing subsequent changes. The repository root index.html preserves the older GitHub Pages preview.

## Build and publish

Actions uses Node 24 and pnpm 11.25.0, frozen install, typecheck, tests, and `pnpm build:static`. React server rendering generates 36 pages plus a 404 page; browser hydration retains interactive filtering, menus and video controls. The existing Node/Fastify dev runtime remains available locally. Hosting does not need a running Node process.

Actions Secrets: FTP_HOST, FTP_PORT, FTP_USERNAME, FTP_PASSWORD. Credentials are not committed or stored in project notes. The upload script accepts secrets from its environment and limits all writes to `/carportchina.ru`. It does not delete remote files. New assets are uploaded before entry pages, each file via a temporary name and rename. A SHA256 manifest supports incremental uploads. The current FTP host is shared with other projects; they are outside the deployment target.

Workflow artifact `carportchina-static` holds the release. `carportchina-previous-pages` retains overwritten entry HTML, robots, sitemap and .htaccess for 14 days. The initial index.html/robots.txt are also saved locally in output/deployment-2026-11-08/before/. To roll back, restore previous entry files from the artifact through the same scoped FTP workflow; previous hashed assets remain available because uploads never delete them.

Apache .htaccess supplies old URL redirects and an actual 404 response, and marks filtered catalogue URLs noindex. Main commercial pages are indexable; placeholder contacts/legal pages remain noindex according to existing policy. robots and sitemap are generated from the same SEO rules as local SSR.

## Boundaries

Publication does not implement CMS, database or lead delivery. Existing forms remain explicitly marked as previews. Content and inventory refresh on each deployment; there is no background source synchronization. Changes under site/ on main trigger deployment; workflow_dispatch supports a manual run.

## Verification

Use `python scripts/verify-deployment.py` from the original workspace after building locally. It checks every page, graph IDs, video placement, redirects, real 404, robots/sitemap, filtered noindex, MP4 Range support, and the published commit manifest. Browser checks additionally verify hydration and query restoration.

## Verified release — 8 November 2026

Actions run: https://github.com/zoyroyx/carportchina/actions/runs/42482215174 (success). Deployed source commit: `75c465d9707ba14b7c655103f93371e2ab7d21d8`. 490 files uploaded, no remote files deleted. Typecheck, 62 tests and static build passed in Actions. Live HTTP verification passed for all 36 pages, redirects, 404, filtered catalogue noindex, robots/sitemap, MP4 Range 206 and the commit manifest. Browser query restoration and live filtering passed; homepage has two preview links and no players, reviews has two video players. Results: `output/deployment-2026-11-08/` in the original workspace.
