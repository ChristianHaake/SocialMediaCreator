const baseUrl = new URL(
  process.argv[2] ?? process.env.SMC_BASE_URL ?? "https://smc.haak3.de",
);

const failures = [];

function check(condition, message) {
  if (condition) {
    console.log(`PASS  ${message}`);
  } else {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  }
}

async function request(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "follow",
  });
  const body = await response.text();
  return { response, body };
}

console.log(`Smoke-Test: ${baseUrl.origin}`);

const root = await request("/");
check(root.response.status === 200, "Startseite liefert HTTP 200");
check(
  root.body.includes("<title>SocialMediaCreator</title>"),
  "Dokumenttitel vorhanden",
);
check(!root.body.includes("/cdn-cgi/challenge-platform/"), "Keine Cloudflare-JavaScript-Detection injiziert");

const expectedHeaders = {
  "content-security-policy": "default-src 'self'",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
  "x-frame-options": "DENY",
};

for (const [name, expectedValue] of Object.entries(expectedHeaders)) {
  const actualValue = root.response.headers.get(name) ?? "";
  check(
    actualValue.includes(expectedValue),
    `${name} enthält ${expectedValue}`,
  );
}

check(
  (root.response.headers.get("cache-control") ?? "").includes("no-transform"),
  "HTML verhindert nachträgliche CDN-Script-Injektion",
);

const publicRoutes = [
  "/hilfe",
  "/ueber",
  "/lehrkraefte",
  "/verantwortungsvoll",
  "/nutzungsbedingungen",
  "/verifizieren",
  "/datenschutz",
  "/impressum",
];

for (const pathname of publicRoutes) {
  const page = await request(pathname);
  check(page.response.status === 200, `${pathname} liefert HTTP 200`);
  check(page.body.includes('id="root"'), `${pathname} liefert den SPA-Einstiegspunkt`);
}

const unknownRoute = await request("/smoke-test-unbekannt");
check(unknownRoute.response.status === 200, "SPA-Fallback liefert bei unbekannter Route HTTP 200");
check(
  unknownRoute.body.includes('id="root"'),
  "SPA-Fallback liefert den Anwendungseinstiegspunkt",
);

const favicon = await fetch(new URL("/favicon.svg", baseUrl));
check(favicon.status === 200, "Favicon ist erreichbar");
check(
  (favicon.headers.get("content-type") ?? "").includes("image/svg+xml"),
  "Favicon hat den korrekten MIME-Typ",
);

const assetPaths = [
  ...root.body.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
].map((match) => match[1]);

check(assetPaths.length >= 2, "Gebündelte JS- und CSS-Assets wurden gefunden");

for (const assetPath of assetPaths) {
  const asset = await fetch(new URL(assetPath, baseUrl));
  check(asset.status === 200, `${assetPath} ist erreichbar`);
  check(
    (asset.headers.get("cache-control") ?? "").includes("immutable"),
    `${assetPath} wird unveränderlich gecacht`,
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} Produktionsprüfung(en) fehlgeschlagen.`);
  process.exitCode = 1;
} else {
  console.log("\nAlle Produktionsprüfungen bestanden.");
}
