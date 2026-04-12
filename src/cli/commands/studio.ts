import { Command } from "commander";
import chalk from "chalk";
import { resolve } from "node:path";
import { execFile, spawn } from "node:child_process";
import { createApiServer } from "../../server/server.js";

export const studioCommand = new Command("studio")
  .description("Launch the WYSIWYG Web UI studio")
  .argument("[file]", "Optional card or deck JSON file to load on startup")
  .option("-p, --port <n>", "Port", "4242")
  .option("--no-open", "Don't auto-open browser")
  .action(async (file: string | undefined, opts: { port: string; open: boolean }) => {
    const port = parseInt(opts.port, 10);
    const apiPort = port + 1;

    createApiServer(apiPort);
    console.log(chalk.dim(`  API server running on port ${apiPort}`));

    const viteProcess = spawn(
      "bun",
      ["vite", "--port", String(port), "--strictPort"],
      {
        cwd: resolve("studio"),
        stdio: "pipe",
        env: {
          ...process.env,
          VITE_API_PORT: String(apiPort),
          VITE_INITIAL_FILE: file ? resolve(file) : "",
        },
      },
    );

    viteProcess.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(chalk.dim(`  [vite] ${line}`));
    });

    viteProcess.stderr?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.error(chalk.yellow(`  [vite] ${line}`));
    });

    console.log(chalk.green(`\n✓ QuoteForge Studio starting at`), chalk.bold(`http://localhost:${port}`));
    if (file) {
      console.log(chalk.dim(`  Loading: ${file}`));
    }
    console.log(chalk.dim("  Press Ctrl+C to stop.\n"));

    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    if (opts.open) {
      const url = file
        ? `http://localhost:${port}?file=${encodeURIComponent(resolve(file))}`
        : `http://localhost:${port}`;
      execFile("open", [url]);
    }

    process.on("SIGINT", () => {
      viteProcess.kill();
      process.exit(0);
    });
  });
