import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type WarningRecord = {
  id: string;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: string;
};

type WarningFile = Record<string, WarningRecord[]>;

const warningPath = path.join(process.cwd(), "data", "warnings.json");

async function readWarnings(): Promise<WarningFile> {
  try {
    const raw = await readFile(warningPath, "utf8");
    return JSON.parse(raw) as WarningFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeWarnings(warnings: WarningFile): Promise<void> {
  await mkdir(path.dirname(warningPath), { recursive: true });
  await writeFile(warningPath, `${JSON.stringify(warnings, null, 2)}\n`, "utf8");
}

export async function addWarning(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string
): Promise<WarningRecord> {
  const warnings = await readWarnings();
  const guildWarnings = warnings[guildId] ?? [];
  const record: WarningRecord = {
    id: crypto.randomUUID(),
    guildId,
    userId,
    moderatorId,
    reason,
    createdAt: new Date().toISOString()
  };

  guildWarnings.push(record);
  warnings[guildId] = guildWarnings;
  await writeWarnings(warnings);

  return record;
}
