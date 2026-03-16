"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReviewerPrompt = buildReviewerPrompt;
function buildReviewerPrompt(input, plannerOutput, frontendOutput, backendOutput) {
    return [
        "You are a senior engineer reviewing a hackathon submission.",
        "Review the frontend and backend code above.",
        "Give: improvement suggestions + a score out of 10 + a one-line pitch.",
        "",
        `Tech stack: ${input.techStack}`,
        `Theme: ${input.theme}`,
        `Time mode: ${input.timeMode}`,
        "",
        "Plan:",
        plannerOutput,
        "",
        "Frontend code:",
        frontendOutput,
        "",
        "Backend code:",
        backendOutput,
        "",
        "Return Markdown with these sections:",
        "- Strengths",
        "- Improvements",
        "- Score (x/10 with one-line reason)",
        "- One-line pitch"
    ].join("\n");
}
//# sourceMappingURL=reviewerPrompt.js.map