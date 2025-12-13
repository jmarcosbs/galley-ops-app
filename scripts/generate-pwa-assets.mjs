#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, "..");
const publicDir = path.join(projectRoot, "public");
const manifestPath = path.join(publicDir, "manifest.json");
const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error(
    "Usage: npm run generate:pwa-assets -- <path-to-base-image.png|.svg>"
  );
  process.exit(1);
}

const sourceFile = path.resolve(projectRoot, sourceArg);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureFileExists(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    console.error(`Could not find source file: ${filePath}`);
    process.exit(1);
  }
}

async function cleanDirectories() {
  const targets = ["android", "icons", "ios", "windows11"];
  await Promise.all(
    targets.map((dir) =>
      fs.rm(path.join(publicDir, dir), { recursive: true, force: true })
    )
  );

  const rootFiles = await fs.readdir(publicDir);
  await Promise.all(
    rootFiles.map(async (entry) => {
      if (
        /^apple-splash-.*\.jpg$/i.test(entry) ||
        /^apple-icon-.*\.png$/i.test(entry) ||
        /^manifest-icon-.*\.png$/i.test(entry)
      ) {
        await fs.rm(path.join(publicDir, entry), { force: true });
      }
    })
  );
}

async function runGenerator() {
  await new Promise((resolve, reject) => {
    const subprocess = spawn(
      "npx",
      [
        "pwa-asset-generator",
        sourceFile,
        "./public",
        "--manifest",
        "./public/manifest.json",
        "--path",
        "/",
        "--log",
        "true",
      ],
      {
        cwd: projectRoot,
        stdio: "inherit",
      }
    );

    subprocess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pwa-asset-generator exited with code ${code}`));
      }
    });
  });
}

async function moveFile(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.rm(destination, { force: true });
  await fs.rename(source, destination);
}

async function reorganizeOutputs() {
  const entries = await fs.readdir(publicDir);

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(publicDir, entry);
      if (/^apple-splash-.*\.jpg$/i.test(entry)) {
        await moveFile(fullPath, path.join(publicDir, "ios", "splash", entry));
      } else if (/^apple-icon-.*\.png$/i.test(entry)) {
        await moveFile(fullPath, path.join(publicDir, "ios", entry));
      } else if (/^manifest-icon-.*\.png$/i.test(entry)) {
        await moveFile(fullPath, path.join(publicDir, "icons", entry));
      }
    })
  );
}

async function normalizeManifest() {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  const normalizedIcons = [];
  const iconSet = new Set();
  const addIcon = (icon) => {
    const key = `${icon.src}|${icon.purpose ?? "default"}`;
    if (!iconSet.has(key)) {
      iconSet.add(key);
      normalizedIcons.push(icon);
    }
  };

  for (const icon of manifest.icons ?? []) {
    if (typeof icon.src !== "string") continue;
    const withLeadingSlash = icon.src.startsWith("/")
      ? icon.src
      : `/${icon.src}`;
    const fileName = path.basename(withLeadingSlash);
    let resolvedPath = path.join(
      publicDir,
      withLeadingSlash.replace(/^\//, "")
    );

    if (!(await fileExists(resolvedPath))) {
      continue;
    }

    let nextSrc = withLeadingSlash;
    if (/^manifest-icon-/.test(fileName)) {
      nextSrc = `/icons/${fileName}`;
      resolvedPath = path.join(publicDir, nextSrc.replace(/^\//, ""));
    }

    if (!(await fileExists(resolvedPath))) {
      continue;
    }

    addIcon({
      ...icon,
      src: nextSrc,
    });
  }

  const ensureManifestIcon = async (fileName) => {
    const filePath = path.join(publicDir, "icons", fileName);
    if (!(await fileExists(filePath))) return;
    const sizeMatch = fileName.match(/(\d+)(?=\.|$)/);
    const size = sizeMatch ? Number(sizeMatch[1]) : null;
    const sizes = size ? `${size}x${size}` : undefined;

    addIcon({
      src: `/icons/${fileName}`,
      sizes,
      type: "image/png",
      purpose: "any",
    });

    addIcon({
      src: `/icons/${fileName}`,
      sizes,
      type: "image/png",
      purpose: "maskable",
    });
  };

  await ensureManifestIcon("manifest-icon-192.maskable.png");
  await ensureManifestIcon("manifest-icon-512.maskable.png");

  manifest.icons = normalizedIcons;

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

async function main() {
  await ensureFileExists(sourceFile);
  console.log("Cleaning previous assets…");
  await cleanDirectories();
  console.log("Generating new PWA assets…");
  await runGenerator();
  console.log("Organizing generated files…");
  await reorganizeOutputs();
  console.log("Normalizing manifest.json entries…");
  await normalizeManifest();
  console.log("Done! Assets regenerated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
