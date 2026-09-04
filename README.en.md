<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

# DSH with ChatGPT

> **Let ChatGPT in your browser work directly with your local project — and hand work off to DSH when needed.**

**DSH with ChatGPT** is a plugin for DeepSeek Harness (DSH).

You keep working in ChatGPT as usual.

The difference is that ChatGPT can now understand your real project, edit files, run commands, and inspect actual results without you constantly copying code, errors, and project context into the conversation.

DSH also gets a lightweight view for tracking the local work ChatGPT has done, including the project it is using, recent actions, and work history.

When a task is better suited for a coding agent to keep working on, ChatGPT can create a native DSH Session and hand the task over.

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

GitHub install on macOS / Linux:

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

The GitHub installer checks for `dsh` first. If DSH is missing, it exits without installing anything. If DSH is available, it downloads and verifies the selected GitHub Release tgz and installs that local artifact with `dsh plugin add`. The GitHub path never switches to npm.

### 2. Start DSH

```bash
dsh web
```

### 3. Complete Setup and Verify

On first run, DSH with ChatGPT checks your environment and walks you through the required installation, connection, and permission steps in the **Setup Guide**.

<img width="900" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

Once setup is complete, go back to ChatGPT in your browser and start working directly with your local project.

## Let ChatGPT Work with Your Local Project

Through Agent Helm, ChatGPT in your browser can work directly against the real project on your machine, including:

* Understanding the project structure and relevant context
* Finding and reading files
* Editing files
* Running commands and development tools
* Inspecting diagnostics and Git state
* Checking build, test, and execution results

You no longer need to repeatedly paste code, errors, and project context into the conversation just to give ChatGPT enough information to work.

For focused tasks, ChatGPT can handle the work directly. For longer-running or more involved tasks, it can hand the work off to DSH.

## Hand Work Off to DSH When Needed

When a task involves substantial changes, builds, tests, or longer-running execution, ChatGPT can create a native DSH Session after it already understands the project and the task.

DSH can then continue the execution without requiring you to restate the context or rewrite the task from scratch.

Afterward, ChatGPT can inspect the real project again — including the code, diff, tests, and other execution results — and decide what to do next.

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

## View ChatGPT's Local Work in DSH

DSH with ChatGPT adds a lightweight view inside DSH for seeing the local work ChatGPT has performed.

You can see:

* The associated ChatGPT Conversation
* The project / Worktree in use
* Local actions performed by ChatGPT
* Current work status and recent activity
* Whether a DSH Session is associated
* The related DSH Session information

<img width="700" alt="DSH with ChatGPT Work" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

This view is primarily for inspecting and managing ChatGPT's local work history. It does not change how native DSH Sessions themselves are used.

## Work History

ChatGPT's local work is kept in Work History.

You can come back later and see:

* The original ChatGPT Conversation
* The project and Worktree used
* What ChatGPT did locally
* The current or final status
* Whether the work was handed off to DSH
* Any associated DSH Session

<img width="1000" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

Even after leaving the original conversation, you can still see what happened locally and where the work ended up.

## Local Projects and Security

Your projects and execution environment remain on your machine.

ChatGPT receives the local information needed for the current task, such as relevant files, project structure, diagnostics, Git state, command output, and test results.

What ChatGPT can access and execute depends on the currently authorized Workspace, capabilities, and permissions.

When ChatGPT performs local operations directly, Agent Helm provides the local capabilities and sandbox boundary. When a task is executed by DSH, it runs under the permissions and sandbox configuration of the corresponding DSH Session.

## Related Projects

| Project                                                                      | Purpose                                                                                                                    |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | Lets ChatGPT in your browser work directly with local projects and use local coding agents when needed                     |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Installs and manages Agent Helm from the browser and shows the local work associated with the current ChatGPT conversation |

## Project Status

DSH with ChatGPT is under active development.
