import * as https from "https";
import * as fs from "fs";
import * as path from "path";

export interface UpdateInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
}

export const getCurrentVersion = (): string => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8")
  );
  return packageJson.version as string;
};

export const isNewerVersion = (latest: string, current: string): boolean => {
  const latestParts = latest.split(".").map(Number);
  const currentParts = current.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
};

export const checkForUpdate = (): Promise<UpdateInfo | null> => {
  return new Promise((resolve) => {
    try {
      const current = getCurrentVersion();

      const req = https.get(
        "https://registry.npmjs.org/coding-agent-benchmarks/latest",
        (res) => {
          let data = "";

          res.on("data", (chunk: Buffer) => {
            data += chunk.toString();
          });

          res.on("end", () => {
            try {
              const parsed: { version: string } = JSON.parse(data);
              const latest = parsed.version;
              resolve({
                current,
                latest,
                updateAvailable: isNewerVersion(latest, current),
              });
            } catch {
              resolve(null);
            }
          });

          res.on("error", () => {
            resolve(null);
          });
        }
      );

      req.on("error", () => {
        resolve(null);
      });

      req.setTimeout(3000, () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
};
