import { join } from "node:path";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { green, red, underline } from "colorette";
import { format } from "prettier";

const PACKAGES_PATH = join(process.cwd(), "packages");
const APPS_PATH = join(process.cwd(), "apps");
const [, , version] = process.argv;

const packages = readdirSync(PACKAGES_PATH).filter((v) => !v.endsWith(".md"));
const apps = readdirSync(APPS_PATH).filter((v) => !v.endsWith(".md"));
const allPackages = [...packages, ...apps];

for (const pkg of allPackages) {
  const isApp = apps.includes(pkg);
  const packageJsonPath = join(isApp ? APPS_PATH : PACKAGES_PATH, pkg, "package.json");

  const packageJson = getJson(packageJsonPath);
  if (!packageJson) continue;

  packageJson.version = version;

  for (const depPkg of packages) {
    const depName = findMatchingDepName(packageJson, depPkg);

    if (depName) {
      const current = packageJson.dependencies?.[depName] || packageJson.devDependencies?.[depName];
      const isWorkspace = current?.startsWith("workspace:");
      const newVersion = isWorkspace ? "workspace:*" : `^${version}`;

      if (packageJson.dependencies?.[depName]) {
        packageJson.dependencies[depName] = newVersion;
      } else if (packageJson.devDependencies?.[depName]) {
        packageJson.devDependencies[depName] = newVersion;
      }
    }
  }

  writeFileSync(packageJsonPath, await stringifyAndFormat(packageJson));
  console.log(`${green("INFO:")} Set version ${underline(version)} for ${underline(pkg)}`);
}

await updateRootVersion();

function getJson(path) {
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findMatchingDepName(pkgJson, target) {
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  return Object.keys(deps).find((dep) => dep.endsWith(`/${target}`) || dep === target);
}

async function stringifyAndFormat(json) {
  return format(JSON.stringify(json, null, 2), { parser: "json" });
}

async function updateRootVersion() {
  const path = join(process.cwd(), "package.json");
  const rootJson = getJson(path);
  rootJson.version = version;

  writeFileSync(path, await stringifyAndFormat(rootJson));
  console.log(`${green("INFO:")} Set root version to ${underline(version)}\n`);
}
