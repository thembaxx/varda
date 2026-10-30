// A loopback-only HTTPS front end for production browser tests. Production TLS
// and origin checks remain enabled; certificates exist only in the test directory.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { request } from "node:http";
import { createServer } from "node:https";
import { join } from "node:path";

const directory = process.env.VARDA_E2E_DIR;
if (!directory) throw new Error("Run this proxy through the Playwright configuration.");
const port = Number(process.env.VARDA_TEST_PORT || 3215);
const key = join(directory, "localhost.key");
const certificate = join(directory, "localhost.crt");
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-days",
    "1",
    "-keyout",
    key,
    "-out",
    certificate,
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ],
  { stdio: "ignore" },
);
const server = createServer(
  { key: readFileSync(key), cert: readFileSync(certificate) },
  (incoming, response) => {
    const upstream = request(
      {
        hostname: "127.0.0.1",
        port: port + 1,
        path: incoming.url,
        method: incoming.method,
        headers: { ...incoming.headers, "x-forwarded-proto": "https" },
      },
      (result) => {
        response.writeHead(result.statusCode || 502, result.headers);
        result.pipe(response);
      },
    );
    upstream.on("error", () => {
      response.writeHead(502);
      response.end("Test server unavailable.");
    });
    incoming.on("aborted", () => upstream.destroy());
    incoming.pipe(upstream);
  },
);
server.listen(port, "127.0.0.1");
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => server.close(() => process.exit(0)));
