import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { withMetrika } from "../apps/server/metrika";
import { Request } from "../apps/web/Request";

describe("public site analytics", () => {
  const template = readFileSync("index.html", "utf8");

  it("queues one initialization and loads the supplied counter asynchronously", () => {
    const html = withMetrika(template, true);
    const source = html.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/)![1];
    const inserted: Array<Record<string, unknown>> = [];
    const document = {
      scripts: [], referrer: "https://example.com/",
      createElement: () => ({}),
      getElementsByTagName: () => [{ parentNode: { insertBefore: (node: Record<string, unknown>) => inserted.push(node) } }],
    };
    const context = { document, location: { href: "https://carportchina.ru/reviews/" } };
    const sandbox = { ...context, window: null as unknown };
    sandbox.window = sandbox;
    runInNewContext(source + "; window.calls = Array.from(ym.a, args => Array.from(args));", sandbox);
    const calls = (sandbox as unknown as { calls: unknown[][] }).calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([114134772, "init", expect.objectContaining({ ssr: true, webvisor: true, url: context.location.href })]);
    expect(inserted).toEqual([{ async: 1, src: "https://mc.yandex.ru/metrika/tag.js?id=114134772" }]);
    expect(html.indexOf("watch/114134772")).toBeLessThan(html.indexOf('id="root"'));
    expect(withMetrika(html, true)).toBe(html);
  });

  it("excludes the counter and fallback pixel from local previews", () => {
    const html = withMetrika(template, false);
    expect(html).not.toContain("mc.yandex.ru");
    expect(html).not.toContain("<!--analytics-");
  });

  it("masks every free-text lead field in Webvisor", () => {
    const html = renderToStaticMarkup(<Request />);
    const fields = html.match(/<(?:input|textarea)\b[^>]*>/g)!.filter(tag => !tag.includes('type="checkbox"'));
    expect(fields.length).toBeGreaterThan(4);
    for (const field of fields) expect(field).toContain('class="ym-disable-keys"');
  });
});
