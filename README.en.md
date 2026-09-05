<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

<div align="center">

# DSH with ChatGPT

**Say goodbye to copy-pasting and DSH Token anxiety. Let ChatGPT on the web connect directly to your local project, code on its own, and hand complex tasks to DSH for sustained execution.**

[![npm](https://img.shields.io/npm/v/@beforewave/dsh-with-chatgpt?color=blue\&style=flat-square)](https://www.npmjs.com/package/@beforewave/dsh-with-chatgpt)
[![DSH](https://img.shields.io/badge/DeepSeek-Harness-blue?style=flat-square)](#-quick-start)
[![License](https://img.shields.io/github/license/BeforeWave/dsh-with-chatgpt?style=flat-square)](./LICENSE)

</div>

<br />
<p align="center">
  <sub>
    Try
    <a href="https://github.com/BeforeWave/agent-helm-extensions"><b>Agent Helm Extensions</b></a> · ChatGPT + local agents
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="https://github.com/BeforeWave/agent-helm"><b>Agent Helm</b></a> · local runtime
  </sub>
</p>
<p align="center">
  <img width="1000" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />
</p>

---

## 💡 Why DSH with ChatGPT?

ChatGPT on the web has strong models, but it normally cannot access your local project, files, or terminal.

DSH can operate directly on your codebase, but a large amount of Token usage can go into reading the project, understanding context, analyzing the problem, and repeatedly confirming details.

**DSH with ChatGPT** connects both sides:

* **Let ChatGPT code directly:** Read and modify local files, run terminal commands, inspect Diagnostics and Git state, and execute builds and tests.
* **Reduce DSH Token usage:** Let ChatGPT handle project understanding, problem analysis, small changes, and result review, leaving DSH Tokens for tasks that truly need sustained execution.
* **Hand complex tasks directly to DSH:** ChatGPT can send an already-understood task directly into a native DSH Session, without making DSH start from the beginning.
* **Review after execution:** When DSH finishes, ChatGPT can inspect the real code, Diff, and test results again.
* **Native Sessions, ready for takeover:** Tasks created by ChatGPT are normal DSH Sessions that you can inspect, continue, or take over directly in DSH Web.

---

## ⚡ Quick Start

### 1. Install the Plugin

**Stable npm release:**

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt
```

> Install a specific version:
> `dsh plugin --profile web add @beforewave/dsh-with-chatgpt@0.1.4`

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh
```

> Install a specific version:
> `curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh -s -- 0.1.4`

**Windows x64:**

```powershell
irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1 | iex
```

> Install a specific version:
> `& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1))) -Version 0.1.4`

The GitHub installer checks for DSH, downloads and verifies the matching Release Plugin package, then installs it through `dsh plugin add`.

---

### 2. Start DSH

```bash
dsh web
```

---

### 3. Complete Setup

On first run, DSH with ChatGPT checks the current environment and uses the **Setup Guide** to walk you through the required installation, ChatGPT Tunnel, and permission setup.

<p align="center">
  <img width="900" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />
</p>

Once setup is complete, return to `chatgpt.com` and start working directly with your local project.

---

## 🛠️ Workflow & Core Features

### 1. Let ChatGPT Work Directly on Local Projects

Through Agent Helm, ChatGPT can directly:

* Understand the project structure
* Find and read code
* Modify local files
* Run terminal commands and development tools
* Inspect Diagnostics and Git state
* Run builds and tests
* Check real execution results

Small changes, bug investigation, code understanding, and verification can be handled directly by ChatGPT.

### 2. Hand Heavy Tasks to DSH

When a task requires extensive edits, builds, tests, or sustained execution, ChatGPT can create a native DSH Session directly.

```text
ChatGPT
   │
   ├── Understand Project
   ├── Analyze Problem
   ├── Edit & Verify Directly
   │
   └── Complex Task ──► DSH Session
                             │
                        Edit · Run · Test
                             │
                             ▼
                        ChatGPT Review
```

DSH receives a task and working context that have already been clarified, leaving more Tokens for actual execution.

### 3. Native DSH Sessions, Ready for Takeover

Tasks created through ChatGPT remain full DSH Sessions.

From DSH Web, you can directly:

* Inspect the Agent's current execution status
* Review activity and results
* Continue interacting with DSH
* Edit code manually
* Take over the Session at any time

ChatGPT and DSH stay connected to the same real piece of work.

---

## 👀 View ChatGPT Work Inside DSH

DSH with ChatGPT adds a lightweight entry inside DSH for viewing the local work associated with ChatGPT:

* ChatGPT Conversation
* Project / Worktree
* Local actions performed by ChatGPT
* Current work status
* Recent execution activity
* Associated DSH Session

<p align="center">
  <img width="700" alt="DSH with ChatGPT Work" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />
</p>

This entry is used to view and manage ChatGPT's local work without changing how native DSH Sessions work.

---

## 📚 Work History

Work performed by ChatGPT and DSH is retained in Work History:

* Associated ChatGPT Conversation
* Project / Worktree
* Local actions performed by ChatGPT
* DSH Session
* Current or final status
* Recent execution activity

<p align="center">
  <img width="1000" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />
</p>

Even after leaving the original Conversation, you can return later and find the work again.

---

## 🔒 Local Projects & Security

Your projects and actual execution environment remain on your local machine:

* **Permission control:** Which projects ChatGPT can access and which operations it can perform are determined by the permissions and capabilities granted to the current Workspace.
* **Sandbox:** When ChatGPT performs local operations directly, it runs under Agent Helm permissions and Sandbox protection.
* **Native DSH permissions:** Once a task is handed to DSH, it runs under the permissions and Sandbox configuration of the corresponding DSH Session.

---

## 🔗 Related Projects

| Project                                                                      | Relationship to this project                                                                                                                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | The local runtime used by this project, providing ChatGPT with code intelligence, file and command operations, Sandbox protection, and DSH Session collaboration. |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Agent Helm's Chrome Extension, letting ChatGPT use local projects and Coding Agents directly from the browser.                                                    |

---

## 📌 Project Status

DSH with ChatGPT is under active development and iteration. Issues and Pull Requests are welcome.
