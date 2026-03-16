# Hackathon AI Solver

A VS Code extension that turns a hackathon problem statement into a practical solution package.

## What This Extension Does

You paste a problem statement, choose context options, and click Generate Solution.

The extension generates:

- Project plan
- Suggested file structure
- Frontend code
- Backend code
- Review feedback with score and pitch
- Auto-generated README output

## How It Works

This extension uses only the VS Code Language Model API with GitHub Copilot.

No external AI SDK, no `fetch`, no Axios, no API key setup.

It simulates multiple agents by changing prompts only:

1. Planner (Claude role)
2. Frontend generator (Gemini role)
3. Backend generator (Codex role)
4. Reviewer (Claude role)

All steps use the same Copilot model endpoint and stream output to the webview.

## Architecture

Main files:

- `src/extension.ts`: command registration and activation
- `src/panel.ts`: webview panel + pipeline orchestration
- `src/agents/*.ts`: each agent call to Copilot API
- `src/prompts/*.ts`: role-specific prompt builders
- `src/webview/index.html`: panel UI
- `src/webview/main.js`: UI message handling and copy actions

## Requirements

You need:

1. VS Code
2. Node.js 18+
3. npm
4. GitHub Copilot extension installed
5. Copilot signed in

## Setup (First Time)

From project root:

```powershell
npm install
npm run compile
```

Optional development watch:

```powershell
npm run watch
```

## Run the Extension

1. Open this project folder in VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, open Command Palette (`Ctrl+Shift+P`)
4. Run `Hackathon AI Solver: Open`

## How To Use

Inside the webview:

1. Paste problem statement
2. Select Tech Stack
3. Select Theme
4. Select Time Mode (6hr/24hr/48hr)
5. Click Generate Solution

You will see step-by-step status while agents run.
Output appears progressively and can be copied with Copy buttons.

## What Each Step Produces

1. Planner:
   - 3-5 point project plan
   - file structure
   - frontend tasks
   - backend tasks
2. Frontend agent:
   - React + Tailwind code
3. Backend agent:
   - Node.js + Express API code
4. Reviewer:
   - strengths
   - improvements
   - score out of 10
   - one-line pitch

## Troubleshooting

### Command not found: `hackathonSolver.open`

- Make sure you are running in Extension Development Host (started via `F5`)
- Reload VS Code window and run again
- Rebuild with `npm run compile`

### GitHub Copilot not showing in Extension Host

- Install Copilot in main VS Code profile first
- Sign in to GitHub from VS Code
- Restart debug session (`F5` again)

### Debug shows JSON debugger selection

- Use Run and Debug profile: `Run Extension`
- Do not debug `package.json` file directly

### Webview opens but no generation

- Check Copilot sign-in
- Check status/error text in panel
- Re-run compile and restart extension host

## Notes

- Designed for hackathon speed, not production hardening
- Always review generated code before final use
- Review security, validation, and deployment config before shipping