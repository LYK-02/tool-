"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFrontendPrompt = buildFrontendPrompt;
function buildFrontendPrompt(input, plannerOutput) {
    return [
        "You are a React + Tailwind frontend developer.",
        "Build the complete frontend for this hackathon project.",
        "Output clean, copy-ready React component code.",
        "",
        `Tech stack: ${input.techStack}`,
        `Theme: ${input.theme}`,
        `Time mode: ${input.timeMode}`,
        "",
        "Planning context:",
        plannerOutput,
        "",
        "Return Markdown with these sections:",
        "- Frontend Overview (short)",
        "- React + Tailwind code (single code block)",
        "- Setup notes (short)",
        "Focus on practical hackathon speed and clarity."
    ].join("\n");
}
//# sourceMappingURL=frontendPrompt.js.map