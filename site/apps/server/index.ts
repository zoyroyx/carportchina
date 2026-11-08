import { preloaderHead } from "./preloader";
import { buildSeo, robotsTxt, sitemap, SITE_ORIGIN } from "./seo";
import { CompanySchema } from "../../packages/contracts/company";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import compress from "@fastify/compress";
import Fastify, { type RouteHandlerMethod } from "fastify";
import middie from "@fastify/middie";
import staticFiles from "@fastify/static";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { AppProps } from "../web/App";
import {
  OfferSchema,
  catalogQuery,
  visibleOffers,
  counts,
  type Offer,
} from "../../packages/contracts/offers";

const production = process.argv.includes("--production");
const root = process.cwd();
const publicSite = production && process.env.CARPORT_PUBLIC_SITE === "true";
const app = Fastify({ logger: true, bodyLimit: 32768 });
await app.register(compress, { global: true });
// File-backed catalogue; replace through the CMS repository in D03.
const inventory = JSON.parse(
  await readFile(
    process.env.CARPORT_INVENTORY_FILE ?? path.join(root, "data/offers.json"),
    "utf8",
  ),
);
if (!Value.Check(Type.Array(OfferSchema), inventory))
  throw new Error("Invalid data/offers.json: inventory must match OfferSchema");
const records: Offer[] = inventory;
if (
  new Set(records.map((o) => o.slug)).size !== records.length ||
  new Set(records.map((o) => o.id)).size !== records.length
)
  throw new Error("Duplicate offer ID or slug");
const published = () => visibleOffers(records);
const company = JSON.parse(
  await readFile(path.join(root, "data/company.json"), "utf8"),
);
if (!Value.Check(CompanySchema, company))
  throw new Error("Invalid data/company.json");
company.stories = company.stories.filter(
  (s: { approved: boolean }) => s.approved,
);

app.addHook("onRequest", async (req, reply) => {
  if (
    publicSite &&
    req.headers.host?.split(":")[0].toLowerCase() === "www.carportchina.ru"
  )
    return reply.redirect(SITE_ORIGIN + req.url, 301);
  if (!publicSite || req.url.startsWith("/api/") || req.url === "/health")
    reply.header("X-Robots-Tag", "noindex, nofollow");
  reply
    .header("Cache-Control", "no-store")
    .header("X-Content-Type-Options", "nosniff")
    .header("Referrer-Policy", "strict-origin-when-cross-origin");
});
app.get("/health", async () => ({
  status: "ok",
  mode: publicSite ? "public-site" : "local-preview",
  leadsEnabled: false,
}));
app.get("/robots.txt", async (_req, reply) =>
  reply.type("text/plain; charset=utf-8").send(robotsTxt(publicSite)),
);
app.get("/sitemap.xml", async (_req, reply) =>
  reply
    .type("application/xml; charset=utf-8")
    .send(sitemap({ url: "/", offers: published(), company, now: Date.now() })),
);
app.get("/api/v1/public/offers", async (req) => {
  const items = catalogQuery(
    published(),
    new URL(req.url, "http://local").searchParams,
    Date.now(),
  );
  return { items, total: items.length, asOf: new Date().toISOString() };
});
app.get<{ Params: { slug: string } }>(
  "/api/v1/public/offers/:slug",
  async (req, reply) => {
    const item = published().find((o) => o.slug === req.params.slug);
    return item ? { item } : reply.code(404).send({ code: "OFFER_NOT_FOUND" });
  },
);
app.get("/api/v1/public/counts", async () => ({
  ...counts(published()),
  asOf: new Date().toISOString(),
}));
app.get("/api/v1/public/settings", async () => ({
  contacts: company.contacts,
  channels: [],
  leadsEnabled: false,
}));
app.all("/api/*", async (_req, reply) =>
  reply.code(503).send({
    code: "PREVIEW_ONLY",
    message: "Этот API ещё не подключён. Данные не приняты.",
  }),
);
let vite:
  Awaited<ReturnType<(typeof import("vite"))["createServer"]>> | undefined;
if (production) {
  await app.register(staticFiles, {
    root: path.join(root, "dist/client"),
    prefix: "/",
    index: false,
    wildcard: false,
    setHeaders(res, filePath) {
      res.header(
        "Cache-Control",
        filePath.includes(`${path.sep}assets${path.sep}`)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=0, must-revalidate",
      );
    },
  });
} else {
  await app.register(middie);
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
}
const renderPage: RouteHandlerMethod = async (req, reply) => {
  if (req.method !== "GET" && req.method !== "HEAD")
    return reply.code(405).send({ code: "METHOD_NOT_ALLOWED" });
  const url = new URL(req.url, "http://local");
  if (
    !url.pathname.endsWith("/") &&
    !url.pathname.split("/").pop()?.includes(".")
  )
    return reply.redirect(url.pathname + "/" + url.search, 301);
  if (url.pathname === "/deliveries/") return reply.redirect("/reviews/" + url.search, 301);
  if (
    url.pathname === "/order/" ||
    (url.pathname === "/cars/" && url.searchParams.has("status"))
  ) {
    url.searchParams.delete("status");
    return reply.redirect("/cars/" + url.search, 301);
  }
  try {
    let template = await readFile(
      path.join(root, production ? "dist/client/index.html" : "index.html"),
      "utf8",
    );
    if (vite) template = await vite.transformIndexHtml(req.url, template);
    const mod = production
      ? await import(
          pathToFileURL(path.join(root, "dist/server/entry-server.js")).href
        )
      : await vite!.ssrLoadModule("/apps/web/entry-server.tsx");
    const props: AppProps = {
      url: req.url,
      offers: published(),
      company,
      now: Date.now(),
    };
    const result = mod.render(props) as {
      html: string;
      title: string;
      status: number;
    };
    const data = JSON.stringify(props).replace(/</g, "\\u003c");
    const seo = buildSeo(props, publicSite);
    reply.header("X-Robots-Tag", seo.robots);
    const html = template
      .replace("<!--head-->", seo.head)
      .replace("<!--preloader-head-->", result.status === 200 ? preloaderHead : "")
      .replace("<!--app-->", result.html)
      .replace(
        "<!--data-->",
        `<script id="page-data" type="application/json">${data}</script>`,
      );
    return reply
      .code(result.status)
      .type("text/html; charset=utf-8")
      .send(html);
  } catch (error) {
    app.log.error(error);
    reply.header("X-Robots-Tag", "noindex, nofollow");
    return reply
      .code(503)
      .type("text/html; charset=utf-8")
      .send(
        "<h1>Страница временно недоступна</h1><p>Попробуйте обновить страницу позже.</p>",
      );
  }
};
// Register SSR as a route so compression hooks also apply to HTML.
app.get("/*", renderPage);
app.setNotFoundHandler(renderPage);
await app.listen({
  port: Number(process.env.PORT ?? 4173),
  host: process.env.HOST ?? "127.0.0.1",
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, async () => {
    await vite?.close();
    await app.close();
    process.exit(0);
  });
