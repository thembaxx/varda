import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, basename } from "node:path";

export default function teardown() {
  const directory = process.env.VARDA_E2E_DIR;
  if (
    directory &&
    dirname(directory) === tmpdir() &&
    basename(directory).startsWith("varda-e2e-")
  ) {
    rmSync(directory, { recursive: true, force: true });
  }
}
