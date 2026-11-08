"""Check generated JSON-LD against a downloaded official Schema.org vocabulary.

This is a local vocabulary/graph consistency check, NOT the Schema.org online
validator, a complete JSON-LD processor, or Google rich-results validation.
It checks types, properties, domainIncludes (including class inheritance),
duplicate node definitions and unresolved same-site @id references per page.
External @id references are reported, not assumed to require local definitions.
It deliberately does not validate rangeIncludes, dates or Google eligibility.
"""
import argparse
from datetime import datetime, timezone
from functools import lru_cache
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit


def values(value):
    return value if isinstance(value, list) else ([] if value is None else [value])


def term(value):
    for prefix in ("https://schema.org/", "http://schema.org/", "schema:"):
        if value.startswith(prefix):
            return value[len(prefix):]
    return value


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.scripts = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("type", "").lower() == "application/ld+json":
            self.current = []

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.current is not None:
            self.scripts.append("".join(self.current))
            self.current = None


class Validator:
    def __init__(self, vocabulary, origin):
        self.nodes = {term(n["@id"]): n for n in vocabulary["@graph"]}
        self.origin = origin.rstrip("/")
        self.classes = {k for k, n in self.nodes.items() if "rdfs:Class" in values(n.get("@type"))}
        self.properties = {k for k, n in self.nodes.items() if "rdf:Property" in values(n.get("@type"))}

    @lru_cache(maxsize=None)
    def ancestors(self, name):
        found, pending = set(), [name]
        while pending:
            current = pending.pop()
            if current in found:
                continue
            found.add(current)
            pending.extend(term(n["@id"]) for n in values(self.nodes.get(current, {}).get("rdfs:subClassOf")))
        return frozenset(found)

    def domains(self, name, visited=None):
        visited = set() if visited is None else visited
        if name in visited:
            return set()
        visited.add(name)
        node = self.nodes.get(name, {})
        direct = {term(n["@id"]) for n in values(node.get("schema:domainIncludes"))}
        if direct:
            return direct
        for parent in values(node.get("rdfs:subPropertyOf")):
            direct.update(self.domains(term(parent["@id"]), visited))
        return direct

    def check(self, documents, page_url):
        errors, external, definitions, references = [], set(), {}, []
        counts = {"typedNodes": 0, "propertyChecks": 0, "referenceChecks": 0}

        def fail(code, location, **details):
            errors.append({"code": code, "location": location, **details})

        def visit(node, location):
            if isinstance(node, list):
                for index, value in enumerate(node):
                    visit(value, f"{location}[{index}]")
                return
            if not isinstance(node, dict):
                return
            if "@context" in node and node["@context"] not in ("https://schema.org", "https://schema.org/", "http://schema.org", "http://schema.org/"):
                fail("unsupported_context", location)
            types = [term(t) for t in values(node.get("@type"))]
            if types:
                counts["typedNodes"] += 1
            ancestors = set()
            for name in types:
                if name not in self.classes:
                    fail("unknown_type", location, type=name)
                ancestors.update(self.ancestors(name))
            if "@id" in node:
                identity = urljoin(page_url, node["@id"])
                if set(node) == {"@id"}:
                    references.append((identity, location))
                else:
                    if identity in definitions:
                        fail("duplicate_id_definition", location, identity=identity, first=definitions[identity])
                    definitions[identity] = location
            for key, value in node.items():
                if not key.startswith("@"):
                    prop = term(key)
                    counts["propertyChecks"] += 1
                    if prop not in self.properties:
                        fail("unknown_property", location, property=key)
                    elif types:
                        allowed = self.domains(prop)
                        if allowed and not allowed.intersection(ancestors):
                            fail("domain_mismatch", location, property=key, types=types, allowedDomains=sorted(allowed))
                if key != "@context":
                    visit(value, location + "." + key)

        for index, document in enumerate(documents):
            visit(document, f"script[{index}]")
        for identity, location in references:
            counts["referenceChecks"] += 1
            if identity not in definitions:
                if urlsplit(identity).netloc == urlsplit(self.origin).netloc:
                    fail("unresolved_internal_reference", location, identity=identity)
                else:
                    external.add(identity)
        return {**counts, "definitions": len(definitions), "externalReferences": sorted(external), "errors": errors}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html-dir", default="dist/static")
    parser.add_argument("--vocabulary", default="output/seo-audit-2026-11-08/schemaorg-vocabulary.jsonld")
    parser.add_argument("--output", default="output/seo-audit-2026-11-08/schema-validation.json")
    parser.add_argument("--origin", default="https://carportchina.ru")
    args = parser.parse_args()
    vocabulary_bytes = Path(args.vocabulary).read_bytes()
    validator = Validator(json.loads(vocabulary_bytes), args.origin)
    # A small negative control prevents an accidentally vacuous domain/ref check.
    control = validator.check([{"@type": "Organization", "video": {"@id": args.origin + "/#missing"}}], args.origin + "/")
    assert {e["code"] for e in control["errors"]} == {"domain_mismatch", "unresolved_internal_reference"}
    assert not validator.check([{"@type": "CollectionPage", "name": "Inherited CreativeWork and Thing properties", "video": {"@type": "VideoObject", "name": "Video"}}], args.origin + "/")["errors"]
    root, pages = Path(args.html_dir), []
    for file in sorted(root.rglob("*.html")):
        relative = file.relative_to(root).as_posix()
        url = args.origin.rstrip("/") + "/" + relative.removesuffix("index.html")
        html = Scripts()
        html.feed(file.read_text(encoding="utf-8"))
        documents, parse_errors = [], []
        for index, source in enumerate(html.scripts):
            try:
                documents.append(json.loads(source))
            except json.JSONDecodeError as error:
                parse_errors.append({"code": "invalid_json", "location": f"script[{index}]", "message": str(error)})
        result = validator.check(documents, url)
        result["errors"] = parse_errors + result["errors"]
        pages.append({"file": relative, "scripts": len(html.scripts), **result})
    report = {
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "validationKind": "local-official-vocabulary-and-graph-check",
        "limitations": ["Not the online Schema.org validator", "Not Google Rich Results validation", "No rangeIncludes, date-format or eligibility validation", "Restricted to the site's simple schema.org JSON-LD context"],
        "vocabularyFile": args.vocabulary,
        "vocabularySha256": sha256(vocabulary_bytes).hexdigest(),
        "vocabularyTerms": len(validator.nodes),
        "htmlFiles": len(pages),
        "pagesWithMarkup": sum(bool(p["scripts"]) for p in pages),
        "errorCount": sum(len(p["errors"]) for p in pages),
        "negativeAndInheritanceControlsPassed": True,
        "pages": pages,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Checked {len(pages)} HTML files; {report['pagesWithMarkup']} with JSON-LD; {report['errorCount']} errors. Report: {output}")
    for page in pages:
        for error in page["errors"]:
            print(page["file"], json.dumps(error, ensure_ascii=True))
    return 1 if report["errorCount"] or not pages else 0


if __name__ == "__main__":
    raise SystemExit(main())
