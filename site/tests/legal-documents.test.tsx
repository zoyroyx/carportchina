import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { DataNotice } from "../apps/web/DataNotice";
import { Request } from "../apps/web/Request";
import { consentVersion, legalOperator } from "../apps/web/legal-content";

describe("personal data documents and explicit consent", () => {
  it("identifies the same operator and version in each document", () => {
    for (const consent of [false, true]) {
      const html = renderToStaticMarkup(<DataNotice consent={consent} />);
      expect(html).toContain(legalOperator.inn);
      expect(html).toContain(legalOperator.name);
      expect(legalOperator.address).not.toBe("");
      expect(html).toContain(legalOperator.address);
      expect(html).toContain(consentVersion);
      expect(html).not.toContain("реквизиты оператора и условия хранения данных уточняются");
    }
  });
  it("separates consent from the policy and never preselects it", () => {
    const html = renderToStaticMarkup(<Request />);
    const label = html.match(/<label class="request-consent">(.*?)<\/label>/s)![1];
    expect(label).toContain('/consent/');
    expect(label).not.toContain('/privacy/');
    expect(label).not.toMatch(/checked(?:=|\s|>)/);
    expect(html).toContain('class="request-policy"');
    expect(html).toContain('/privacy/');
  });
  it("matches the version enforced by PHP with the client", () => {
    const php = readFileSync('backend/request-core.php', 'utf8');
    expect(php).toContain(`const REQUEST_CONSENT_VERSION = '${consentVersion}'`);
    expect(php).toContain("'consentVersion' => $data['consentVersion']");
  });
});
