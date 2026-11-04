// Builds the document-processor Lambda deployment package.
//
//   npm run build:lambda   ->  .build/document-processor.zip
//
// Everything is bundled into index.js except pdf-parse, which ships pdfjs
// assets and a native canvas binary. It is installed into the package for the
// Lambda platform (Linux arm64, glibc), not for the machine running the build.

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, ".build", "lambda");
const zipPath = path.join(root, ".build", "document-processor.zip");
const external = ["pdf-parse"];

rmSync(outDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(outDir, { recursive: true });

await build({
    entryPoints: [path.join(root, "src/workers/lambda.ts")],
    outfile: path.join(outDir, "index.js"),
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    external,
    minify: true,
    keepNames: true,
    sourcemap: true,
    legalComments: "none",
    logLevel: "info",
});

const lock = JSON.parse(readFileSync(path.join(root, "package-lock.json"), "utf8"));
const dependencies = Object.fromEntries(
    external.map((name) => [name, lock.packages[`node_modules/${name}`].version])
);
writeFileSync(
    path.join(outDir, "package.json"),
    JSON.stringify({ name: "document-processor", private: true, dependencies }, null, 2)
);

execFileSync(
    "npm",
    ["install", "--omit=dev", "--no-audit", "--no-fund", "--os=linux", "--cpu=arm64", "--libc=glibc"],
    { cwd: outDir, stdio: "inherit" }
);

execFileSync("zip", ["-qr", zipPath, "."], { cwd: outDir, stdio: "inherit" });
console.log(`\nLambda package: ${path.relative(root, zipPath)}`);
