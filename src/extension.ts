import * as vscode from "vscode";
import { HackathonSolverPanel } from "./panel";

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand("hackathonSolver.open", () => {
    HackathonSolverPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  // No resources to tear down.
}
