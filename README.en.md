<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

# DSH with ChatGPT

> **Let ChatGPT in your browser work directly with your local project — and hand work off to DSH when needed.**

**DSH with ChatGPT** is a plugin for DeepSeek Harness (DSH).

You keep working in ChatGPT in your browser as usual.

The difference is that ChatGPT can now understand your real project, edit files, run commands, and inspect results without you repeatedly copying code, errors, and project context into the conversation.

Inside DSH, you also get a lightweight view for seeing the project currently associated with ChatGPT, the local actions it has performed, and its work history.

When a task is better suited for a coding agent to continue executing, ChatGPT can create a native DSH Session and hand the work over directly.

<img width="1000" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

## Quick Start

### 1. Install

Stable npm release:

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt
```

Install a specific npm version:

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt@0.1.4
```

GitHub release, macOS / Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh
```

Install a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh -s -- 0.1.4
```

Windows x64:

```powershell
irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1 | iex
```

Install a specific version:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1))) -Version 0.1.4
```

The GitHub installer checks for `dsh` first. If DSH is not installed, it exits immediately. If DSH is available, it downloads and verifies the selected GitHub Release tgz, then installs that artifact with `dsh plugin add`. The GitHub install path never switches to npm.

### 2. Start DSH

```bash
dsh web
```

### 3. Complete Setup and Verify

On first run, DSH with ChatGPT checks the current environment and uses the **Setup Guide** to walk you through the required installation, connection, and permission steps.

<img width="900" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

Once setup is complete, return to ChatGPT in your browser and start working directly with the local project.

## Start from the ChatGPT You Already Use

Open a conversation on `chatgpt.com`. Through Agent Helm, ChatGPT can start working directly with the local project.

It can:

* Understand the current project
* Find and read relevant files
* Edit files
* Run commands and development tools
* Inspect Diagnostics and Git state
* Check build, test, and execution results
* Hand work off to DSH when needed
* Inspect the real results again after DSH finishes

You no longer need to repeatedly paste code, errors, and project context into the conversation, or reorganize the task before handing it off to DSH.

### Hand Work Off to DSH When Needed

When a task requires substantial changes, builds, tests, or continued execution, ChatGPT can create a native DSH Session after it already understands the project and the task.

DSH can continue the execution without requiring you to restate the background or task requirements.

Afterward, ChatGPT can inspect the real project again — including code, diff, test results, and other execution results — and decide what to do next.

In short:

```text
ChatGPT in your browser
        │
 Understands the project
        │
   ┌────┴────┐
   │         │
Works directly  Hands off to DSH
                  │
             DSH Session
                  │
             Keeps working
```

### View ChatGPT's Local Work in DSH

DSH with ChatGPT adds a lightweight view inside DSH for seeing the local work ChatGPT has performed.

You can see:

* The associated ChatGPT Conversation
* The project / Worktree in use
* Local actions performed by ChatGPT
* Current work status and recent activity
* Whether a DSH Session is associated
* The related DSH Session information

<img width="700" alt="DSH with ChatGPT Work" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

This view is mainly for inspecting and managing ChatGPT's local work history. It does not change how native DSH Sessions are used.

### Work History

ChatGPT's local work is kept in Work History.

You can come back later and find:

* The corresponding ChatGPT Conversation
* The project and Worktree used
* What ChatGPT did locally
* The current or final status
* Whether the work was handed off to DSH
* The associated DSH Session

<img width="1000" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

Even after leaving the original Conversation, you can still see what happened locally during that piece of work.

## Local Projects and Security

Your projects and execution environment remain on your machine.

ChatGPT receives the local information needed for the current task, including relevant files, project structure, Diagnostics, Git state, command output, and test results.

What it can access and execute depends on the currently authorized Workspace, capabilities, and permissions.

When ChatGPT performs local operations directly, Agent Helm provides the local capabilities and Sandbox boundary. When a task is executed by DSH, it runs under the permissions and Sandbox configuration of the corresponding DSH Session.

## Related Projects

| Project                                                                      | Purpose                                                                                                                    |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | Lets ChatGPT in your browser work directly with local projects and use local coding agents when needed                     |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Installs and manages Agent Helm from the browser and shows the local work associated with the current ChatGPT Conversation |

## Project Status

DSH with ChatGPT is under active development.
