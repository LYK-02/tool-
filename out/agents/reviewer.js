"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReviewerAgent = runReviewerAgent;
const vscode = __importStar(require("vscode"));
const reviewerPrompt_1 = require("../prompts/reviewerPrompt");
function buildMessages(systemPrompt, userPrompt) {
    const messageFactory = vscode.LanguageModelChatMessage;
    const systemMessage = messageFactory.System
        ? messageFactory.System(systemPrompt)
        : messageFactory.User(`System: ${systemPrompt}`);
    return [systemMessage, messageFactory.User(userPrompt)];
}
function toChunkText(fragment) {
    if (typeof fragment === "string") {
        return fragment;
    }
    if (typeof fragment === "object" &&
        fragment !== null &&
        "value" in fragment &&
        typeof fragment.value === "string") {
        return fragment.value;
    }
    return String(fragment);
}
// CLAUDE role again: final reviewer scoring quality and highlighting improvements.
async function runReviewerAgent(input, plannerOutput, frontendOutput, backendOutput, onToken, token, modelId) {
    let model;
    if (modelId) {
        const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
        model = models.find((m) => m.id === modelId);
    }
    else {
        const [selectedModel] = await vscode.lm.selectChatModels({ vendor: "copilot", family: "gpt-4o" });
        model = selectedModel;
    }
    if (!model) {
        throw new Error("No GitHub Copilot model available. Ensure Copilot is installed and signed in.");
    }
    const systemPrompt = "You are CLAUDE role: a senior final reviewer for hackathon submissions who gives direct, actionable feedback.";
    const userPrompt = (0, reviewerPrompt_1.buildReviewerPrompt)(input, plannerOutput, frontendOutput, backendOutput);
    const response = await model.sendRequest(buildMessages(systemPrompt, userPrompt), {}, token);
    let output = "";
    for await (const fragment of response.text) {
        const chunk = toChunkText(fragment);
        output += chunk;
        onToken(chunk);
    }
    return output;
}
//# sourceMappingURL=reviewer.js.map