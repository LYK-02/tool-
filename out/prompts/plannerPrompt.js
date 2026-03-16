"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlannerPrompt = buildPlannerPrompt;
function buildPlannerPrompt(input) {
    return [
        "You are a software architect for hackathon teams.",
        "Given this hackathon problem, output exactly these sections:",
        "1. Project plan (3-5 bullet points)",
        "2. File structure (tree format)",
        "3. Frontend tasks list",
        "4. Backend tasks list",
        "",
        `Tech stack: ${input.techStack}`,
        `Theme: ${input.theme}`,
        `Time mode: ${input.timeMode}`,
        "",
        "Problem statement:",
        input.problemStatement,
        "",
        "Keep it practical and implementation-ready.",
        "Use Markdown headings for each section and concise bullets."
    ].join("\n");
}
//# sourceMappingURL=plannerPrompt.js.map