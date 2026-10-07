import { describe, expect, it } from "bun:test";
import {
  scanContentForSecrets,
  maskSecret,
  isIgnoredLine,
} from "./verify-staged-secrets";

describe("isIgnoredLine", () => {
  it("detects trufflehog:ignore in various comment styles", () => {
    expect(
      isIgnoredLine("const key = 'AKIA1234567890123456'; // trufflehog:ignore"),
    ).toBe(true);
    expect(
      isIgnoredLine("AWS_KEY: AKIA1234567890123456 # trufflehog:ignore"),
    ).toBe(true);
    expect(isIgnoredLine("/* trufflehog:ignore */ const key = '...';")).toBe(
      true,
    );
    expect(isIgnoredLine("<!-- trufflehog:ignore -->")).toBe(true);
    expect(
      isIgnoredLine(["const key = 'AKIA", "1234567890123456';"].join("")),
    ).toBe(false);
  });
});

describe("maskSecret", () => {
  it("masks secret while keeping prefix visible", () => {
    expect(maskSecret(["AKIA", "IOSFODNN7EXAMPLE"].join(""))).toBe(
      "AKIAIO**************",
    );
    expect(
      maskSecret(["ghp_", "123456789012345678901234567890123456"].join("")),
    ).toBe("ghp_12**********************************");
    expect(maskSecret("short")).toBe("*****");
  });
});

describe("scanContentForSecrets", () => {
  it("detects unsuppressed AWS access key IDs", () => {
    const awsKey = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
    const content = `\nconst awsKey = "${awsKey}";\nconsole.log(awsKey);\n`;
    const findings = scanContentForSecrets(content, "test.ts");
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe("AWS Access Key ID");
    expect(findings[0].line).toBe(2);
  });

  it("suppresses AWS access key IDs with trufflehog:ignore", () => {
    const awsKey = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
    const content = `\nconst awsKey = "${awsKey}"; // trufflehog:ignore\nconsole.log(awsKey);\n`;
    const findings = scanContentForSecrets(content, "test.ts");
    expect(findings).toHaveLength(0);
  });

  it("detects GitHub personal access tokens", () => {
    const fakeToken = ["ghp_", "A".repeat(36)].join("");
    const content = `GITHUB_TOKEN=${fakeToken}`;
    const findings = scanContentForSecrets(content, ".env.example");
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe("GitHub Personal Access Token");
  });

  it("suppresses GitHub token with hash comment trufflehog:ignore", () => {
    const fakeToken = ["ghp_", "A".repeat(36)].join("");
    const content = `GITHUB_TOKEN=${fakeToken} # trufflehog:ignore`;
    const findings = scanContentForSecrets(content, ".env.example");
    expect(findings).toHaveLength(0);
  });

  it("detects Slack bot/user tokens", () => {
    const slackToken = [
      "xoxb-",
      "123456789012-1234567890123-abcdefghijklmnopqrstuv",
    ].join("");
    const content = `const slack = "${slackToken}";`;
    const findings = scanContentForSecrets(content, "slack.ts");
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe("Slack Token");
  });

  it("detects OpenAI API keys", () => {
    const openAiKey = [
      "sk-",
      "proj-abcdefghijklmnopqrstuvwxyz01234567890123456789",
    ].join("");
    const content = `const openAi = "${openAiKey}";`;
    const findings = scanContentForSecrets(content, "ai.ts");
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe("OpenAI API Key");
  });

  it("detects Stripe secret keys", () => {
    const stripeKey = ["sk_live_", "51Abcdefghijklmnopqrstuvwx"].join("");
    const content = `const stripe = "${stripeKey}";`;
    const findings = scanContentForSecrets(content, "stripe.ts");
    expect(findings).toHaveLength(1);
    expect(findings[0].rule).toBe("Stripe API Key");
  });

  it("detects private keys", () => {
    const privateKey = [
      "-----BEGIN ",
      "RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END ",
      "RSA PRIVATE KEY-----",
    ].join("");
    const findings = scanContentForSecrets(privateKey, "key.pem");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].rule).toBe("Private Key");
  });

  it("allows synthetic mock credentials with mock_ prefix or zeros", () => {
    const content = `
const mockKey = "mock_sk_test_123456789012345678901234567890";
const dummy = "AKIA0000000000000000"; // trufflehog:ignore
const zeros = "00000000000000000000000000000000";
`;
    const findings = scanContentForSecrets(content, "mock.ts");
    expect(findings).toHaveLength(0);
  });
});
