import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { HealthResponseSchema } from "@devtools/core";
import { createProgram, runWebCommand } from "../src/cli";

const binPath = resolve(__dirname, "../bin/devtools.js");

function getFreePort(): number {
  const temp = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch() {
      return new Response();
    },
  });
  const port = temp.port ?? 0;
  temp.stop(true);
  if (port === 0) {
    throw new Error("Failed to allocate ephemeral port");
  }
  return port;
}

async function waitForServer(
  port: number,
  host = "127.0.0.1",
  maxRetries = 40,
  intervalMs = 50,
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://${host}:${port}/api/health`);
      if (res.status === 200) {
        return true;
      }
    } catch {
      await Bun.sleep(intervalMs);
    }
  }
  return false;
}

describe("CLI Subprocess Integration Tests", () => {
  test("boots daemon via 'devtools web --port <port> --host 127.0.0.1', serves routes, and exits code 0 on SIGTERM", async () => {
    const port = getFreePort();
    const proc = Bun.spawn(
      ["bun", binPath, "web", "--port", String(port), "--host", "127.0.0.1"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    try {
      const ready = await waitForServer(port, "127.0.0.1");
      expect(ready).toBe(true);

      // Verify static root route
      const indexRes = await fetch(`http://127.0.0.1:${port}/`);
      expect(indexRes.status).toBe(200);
      const html = await indexRes.text();
      expect(html).toContain("<!DOCTYPE html>");

      // Verify api health route
      const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
      expect(healthRes.status).toBe(200);
      const json = await healthRes.json();
      expect(HealthResponseSchema.parse(json).status).toBe("ok");

      // Verify clean termination on SIGTERM
      proc.kill("SIGTERM");
      const exitCode = await proc.exited;
      expect(exitCode).toBe(0);

      const stdout = await new Response(proc.stdout).text();
      expect(stdout).toContain(
        `DevTools daemon listening on http://127.0.0.1:${port}`,
      );
      expect(stdout).toContain("Received SIGTERM. Shutting down");
    } finally {
      proc.kill();
    }
  });

  test("exits code 0 on SIGINT", async () => {
    const port = getFreePort();
    const proc = Bun.spawn(
      ["bun", binPath, "web", "-p", String(port), "-H", "127.0.0.1"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    try {
      const ready = await waitForServer(port, "127.0.0.1");
      expect(ready).toBe(true);

      proc.kill("SIGINT");
      const exitCode = await proc.exited;
      expect(exitCode).toBe(0);

      const stdout = await new Response(proc.stdout).text();
      expect(stdout).toContain("Received SIGINT. Shutting down");
    } finally {
      proc.kill();
    }
  });

  test("fails fast with exit code 1 on port conflict in non-interactive mode", async () => {
    // Occupy a port
    const blocker = Bun.serve({
      port: 0,
      hostname: "127.0.0.1",
      fetch() {
        return new Response("blocking");
      },
    });
    const occupiedPort = blocker.port ?? 0;

    try {
      const proc = Bun.spawn(
        [
          "bun",
          binPath,
          "web",
          "--port",
          String(occupiedPort),
          "--host",
          "127.0.0.1",
        ],
        {
          stdout: "pipe",
          stderr: "pipe",
        },
      );

      const exitCode = await proc.exited;
      expect(exitCode).toBe(1);

      const stderr = await new Response(proc.stderr).text();
      expect(stderr).toContain(`Port ${occupiedPort} is already in use`);
      expect(stderr).toContain(`Use --port <port> or set PORT=<port>`);
    } finally {
      blocker.stop(true);
    }
  });

  test("fails fast with exit code 1 when static directory does not exist", async () => {
    const port = getFreePort();
    const proc = Bun.spawn(
      [
        "bun",
        binPath,
        "web",
        "-p",
        String(port),
        "--static-dir",
        "/invalid/dir/that/does/not/exist",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;
    expect(exitCode).toBe(1);

    const stderr = await new Response(proc.stderr).text();
    expect(stderr).toContain("Static assets directory not found");
    expect(stderr).toContain("bun run build");
  });

  test("respects PORT environment variable when --port is omitted", async () => {
    const port = getFreePort();
    const proc = Bun.spawn(["bun", binPath, "web", "-H", "127.0.0.1"], {
      env: {
        ...process.env,
        PORT: String(port),
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    try {
      const ready = await waitForServer(port, "127.0.0.1");
      expect(ready).toBe(true);

      const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
      expect(healthRes.status).toBe(200);

      proc.kill("SIGTERM");
      const exitCode = await proc.exited;
      expect(exitCode).toBe(0);
    } finally {
      proc.kill();
    }
  });
});

describe("CLI Command Structure & Parser Unit Tests", () => {
  test("createProgram initializes command options and metadata", () => {
    const program = createProgram();
    expect(program.name()).toBe("devtools");
    expect(program.version()).toBe("0.1.0");

    const webCommand = program.commands.find((cmd) => cmd.name() === "web");
    expect(webCommand).toBeDefined();

    const optionNames = webCommand?.options.map((opt) => opt.name());
    expect(optionNames).toContain("port");
    expect(optionNames).toContain("host");
    expect(optionNames).toContain("static-dir");
  });

  test("createProgram parses web options accurately", () => {
    const program = createProgram();
    program.parse(["web", "--port", "5000", "--host", "0.0.0.0"], {
      from: "user",
    });
    const webCommand = program.commands.find((cmd) => cmd.name() === "web");
    expect(webCommand?.opts().port).toBe(5000);
    expect(webCommand?.opts().host).toBe("0.0.0.0");
  });

  test("runWebCommand exports correctly as a callable async function", () => {
    expect(typeof runWebCommand).toBe("function");
  });
});
