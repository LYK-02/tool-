import { GenerationInput } from "./plannerPrompt";

export function buildBackendPrompt(input: GenerationInput, plannerOutput: string): string {
  return [
    "You are a Node.js + Express backend developer.",
    "Build the complete backend API for this hackathon project.",
    "Output clean, copy-ready Express route and controller code.",
    "",
    `Tech stack: ${input.techStack}`,
    `Theme: ${input.theme}`,
    `Time mode: ${input.timeMode}`,
    "",
    "Planning context:",
    plannerOutput,
    "",
    "Return Markdown with these sections:",
    "- Backend Overview (short)",
    "- Express code (single code block)",
    "- API endpoints list",
    "- Setup notes (short)",
    "Focus on practical hackathon speed and clarity."
  ].join("\n");
}
