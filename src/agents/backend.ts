import * as vscode from "vscode";
import { buildBackendPrompt } from "../prompts/backendPrompt";
import { GenerationInput } from "../prompts/plannerPrompt";

function buildMessages(systemPrompt: string, userPrompt: string): vscode.LanguageModelChatMessage[] {
  const messageFactory = vscode.LanguageModelChatMessage as unknown as {
    System?: (content: string) => vscode.LanguageModelChatMessage;
    User: (content: string) => vscode.LanguageModelChatMessage;
  };

  const systemMessage = messageFactory.System
    ? messageFactory.System(systemPrompt)
    : messageFactory.User(`System: ${systemPrompt}`);

  return [systemMessage, messageFactory.User(userPrompt)];
}

function toChunkText(fragment: unknown): string {
  if (typeof fragment === "string") {
    return fragment;
  }

  if (
    typeof fragment === "object" &&
    fragment !== null &&
    "value" in fragment &&
    typeof (fragment as { value: unknown }).value === "string"
  ) {
    return (fragment as { value: string }).value;
  }

  return String(fragment);
}

// CODEX role: backend engineer focused on Node.js + Express API implementation.
export async function runBackendAgent(
  input: GenerationInput,
  plannerOutput: string,
  onToken: (chunk: string) => void,
  token: vscode.CancellationToken,
  modelId?: string
): Promise<string> {
  let model: vscode.LanguageModelChat | undefined;
  
  if (modelId) {
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    model = models.find((m) => m.id === modelId);
  } else {
    const [selectedModel] = await vscode.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
    model = selectedModel;
  }

  if (!model) {
    throw new Error("No GitHub Copilot model available. Ensure Copilot is installed and signed in.");
  }

  const systemPrompt =
    "You are CODEX role: a production-minded backend engineer delivering clean Node.js + Express services.";
  const userPrompt = buildBackendPrompt(input, plannerOutput);

  const response = await model.sendRequest(buildMessages(systemPrompt, userPrompt), {}, token);

  let output = "";
  for await (const fragment of response.text) {
    const chunk = toChunkText(fragment);
    output += chunk;
    onToken(chunk);
  }

  return output;
}
