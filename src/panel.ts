import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { runBackendAgent } from "./agents/backend";
import { runFrontendAgent } from "./agents/frontend";
import { runPlannerAgent } from "./agents/planner";
import { runReviewerAgent } from "./agents/reviewer";
import { GenerationInput } from "./prompts/plannerPrompt";

type AgentKey = "planner" | "frontend" | "backend" | "reviewer";

interface GenerateMessage {
  type: "generate" | "request-models";
  payload?: GenerationInput;
}

interface WebviewOutboundMessage {
  type:
    | "reset-output"
    | "generation-started"
    | "generation-finished"
    | "status"
    | "agent-chunk"
    | "readme"
    | "error"
    | "available-models";
  agent?: AgentKey;
  chunk?: string;
  text?: string;
  models?: Array<{ id: string; label: string }>;
}

export class HackathonSolverPanel {
  public static currentPanel: HackathonSolverPanel | undefined;
  public static readonly viewType = "hackathonSolver.panel";

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private running = false;

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (HackathonSolverPanel.currentPanel) {
      HackathonSolverPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      HackathonSolverPanel.viewType,
      "Hackathon AI Solver",
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "src", "webview")]
      }
    );

    HackathonSolverPanel.currentPanel = new HackathonSolverPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.onDidDispose(() => {
      HackathonSolverPanel.currentPanel = undefined;
    });

    this.panel.webview.onDidReceiveMessage(async (message: GenerateMessage) => {
      if (message.type === "request-models") {
        await this.handleRequestModels();
      } else if (message.type === "generate" && message.payload) {
        await this.handleGenerate(message.payload);
      }
    });

    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);
  }

  private postMessage(message: WebviewOutboundMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private async handleRequestModels(): Promise<void> {
    try {
      const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
      const modelList = models.map((model) => ({
        id: model.id,
        label: `${model.vendor} ${model.family}`
      }));

      this.postMessage({
        type: "available-models",
        models: modelList
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      this.postMessage({
        type: "available-models",
        models: [],
        text: `Failed to load models: ${text}`
      });
    }
  }

  private async handleGenerate(input: GenerationInput): Promise<void> {
    if (this.running) {
      this.postMessage({ type: "error", text: "A generation is already running." });
      return;
    }

    this.running = true;
    const cts = new vscode.CancellationTokenSource();

    this.postMessage({ type: "reset-output" });
    this.postMessage({ type: "generation-started" });

    try {
      if (!input.problemStatement || !input.problemStatement.trim()) {
        throw new Error("Problem statement is required. Please enter a valid problem statement.");
      }

      if (!input.model) {
        throw new Error("AI model selection is required. Please select a model before generating.");
      }

      if (!input.techStack) {
        throw new Error("Tech stack is required.");
      }

      if (!input.theme) {
        throw new Error("Theme is required.");
      }

      if (!input.timeMode) {
        throw new Error("Time mode is required.");
      }

      this.postMessage({ type: "status", text: "🧠 Planner thinking..." });
      const plannerOutput = await runPlannerAgent(
        input,
        (chunk) => this.postMessage({ type: "agent-chunk", agent: "planner", chunk }),
        cts.token,
        input.model
      );

      this.postMessage({ type: "status", text: "🎨 Frontend agent generating UI..." });
      const frontendOutput = await runFrontendAgent(
        input,
        plannerOutput,
        (chunk) => this.postMessage({ type: "agent-chunk", agent: "frontend", chunk }),
        cts.token,
        input.model
      );

      this.postMessage({ type: "status", text: "⚙️ Backend agent generating API..." });
      const backendOutput = await runBackendAgent(
        input,
        plannerOutput,
        (chunk) => this.postMessage({ type: "agent-chunk", agent: "backend", chunk }),
        cts.token,
        input.model
      );

      this.postMessage({ type: "status", text: "✅ Reviewer analyzing submission..." });
      const reviewerOutput = await runReviewerAgent(
        input,
        plannerOutput,
        frontendOutput,
        backendOutput,
        (chunk) => this.postMessage({ type: "agent-chunk", agent: "reviewer", chunk }),
        cts.token,
        input.model
      );

      this.postMessage({
        type: "readme",
        text: this.buildReadme(input, plannerOutput, frontendOutput, backendOutput, reviewerOutput)
      });
      
      // Create files and folders
      await this.createProjectFiles(input, plannerOutput, frontendOutput, backendOutput, reviewerOutput);
      
      this.postMessage({ type: "status", text: "🚀 Solution generated and saved successfully!" });
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      this.postMessage({ type: "error", text });
      this.postMessage({ type: "status", text: "Generation failed. See error message above." });
    } finally {
      cts.dispose();
      this.running = false;
      this.postMessage({ type: "generation-finished" });
    }
  }

  private buildReadme(
    input: GenerationInput,
    plannerOutput: string,
    frontendOutput: string,
    backendOutput: string,
    reviewerOutput: string
  ): string {
    return [
      "# Hackathon AI Solver Submission Pack",
      "",
      "## Context",
      `- Tech Stack: ${input.techStack}`,
      `- Theme: ${input.theme}`,
      `- Time Mode: ${input.timeMode}`,
      "",
      "## Problem Statement",
      input.problemStatement,
      "",
      "## Project Plan",
      plannerOutput,
      "",
      "## Frontend",
      "```tsx",
      frontendOutput,
      "```",
      "",
      "## Backend",
      "```ts",
      backendOutput,
      "```",
      "",
      "## Review",
      reviewerOutput,
      "",
      "## Quick Start",
      "1. Create frontend and backend projects based on the generated file structure.",
      "2. Paste generated frontend/backend code into the mapped files.",
      "3. Wire API URLs and env vars.",
      "4. Demo flow: problem -> solution -> review notes."
    ].join("\n");
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    try {
      const htmlPath = vscode.Uri.joinPath(this.extensionUri, "src", "webview", "index.html");
      const scriptPath = vscode.Uri.joinPath(this.extensionUri, "src", "webview", "main.js");

      const scriptUri = webview.asWebviewUri(scriptPath);
      const nonce = this.getNonce();
      const htmlTemplate = fs.readFileSync(htmlPath.fsPath, "utf8");

      return htmlTemplate
        .replace(/__CSP_SOURCE__/g, webview.cspSource)
        .replace(/__SCRIPT_URI__/g, scriptUri.toString())
        .replace(/__NONCE__/g, nonce);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-unsafe-inline';">
            <title>Error</title>
            <style>
              body { background: #1e1e1e; color: #fff; font-family: monospace; padding: 20px; }
              .error { background: #3d1111; border: 1px solid #c00; padding: 10px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Extension Error</h1>
            <div class="error">
              <p>Failed to load webview HTML:</p>
              <p><strong>${errorMsg}</strong></p>
              <p>Extension URI: ${this.extensionUri.fsPath}</p>
            </div>
          </body>
        </html>
      `;
    }
  }

  private getNonce(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let value = "";
    for (let i = 0; i < 32; i += 1) {
      value += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return value;
  }

  private async createProjectFiles(
    input: GenerationInput,
    plannerOutput: string,
    frontendOutput: string,
    backendOutput: string,
    reviewerOutput: string
  ): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        this.postMessage({ type: "status", text: "⚠️ No workspace folder open. Cannot create files." });
        return;
      }

      const baseDir = workspaceFolders[0].uri.fsPath;
      const projectName = "hackathon-solution";
      const projectDir = path.join(baseDir, projectName);

      // Create project directory
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // Create subdirectories
      const frontendDir = path.join(projectDir, "frontend");
      const backendDir = path.join(projectDir, "backend");

      if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
      }
      if (!fs.existsSync(backendDir)) {
        fs.mkdirSync(backendDir, { recursive: true });
      }

      // Save files
      const readmeContent = this.buildReadme(input, plannerOutput, frontendOutput, backendOutput, reviewerOutput);
      fs.writeFileSync(path.join(projectDir, "README.md"), readmeContent);

      // Determine file extensions based on tech stack
      const isTsx = input.techStack.includes("React") || input.techStack.includes("Next");
      const frontendExt = isTsx ? "tsx" : "jsx";
      const frontendFileName = `App.${frontendExt}`;

      fs.writeFileSync(path.join(frontendDir, frontendFileName), frontendOutput);
      fs.writeFileSync(path.join(backendDir, "server.ts"), backendOutput);

      // Create planner output file
      fs.writeFileSync(path.join(projectDir, "PLAN.md"), plannerOutput);
      fs.writeFileSync(path.join(projectDir, "REVIEW.md"), reviewerOutput);

      this.postMessage({ type: "status", text: `✅ Files created in: ${projectDir}` });

      // Open the project in VS Code
      const projectUri = vscode.Uri.file(projectDir);
      await vscode.commands.executeCommand("vscode.openFolder", projectUri, true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.postMessage({ type: "status", text: `⚠️ Could not create files: ${errorMsg}` });
    }
  }
}
