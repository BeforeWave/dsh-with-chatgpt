<p align="right">
  <a href="./README.md"><b>English</b></a> | <a href="./README.zh-CN.md">中文</a>
</p>

# DSH with ChatGPT

> **Bring ChatGPT's reasoning into your local codebase: resolve small tasks instantly, delegate large executions to DSH.**

**DSH with ChatGPT** bridges ChatGPT directly to your local workspace and native DeepSeek Harness (DSH) execution sessions.

Instead of pasting raw snippets into chat boxes, ChatGPT gains full awareness of your actual project context—reading repository structures, tracing symbols and references, inspecting diagnostics, and performing deep architectural reasoning.

For targeted, scoped modifications, ChatGPT acts directly. For heavy, iteration-dense workflows, ChatGPT analyzes the context, Formulates an execution plan, hands off implementation to DSH, and independently reviews the results upon completion.

```text
                         ChatGPT
               Understand · Reason · Review
                            │
                  Secure MCP Tunnel
                            │
                            ▼
                        Agent Helm
                       /          \
                      /            \
            Work Directly       Delegate
                 │                 │
                 ▼                 ▼
           Local Codebase          DSH
                 ▲          Edit · Run · Test
                 │          (Take over anytime)
                 └─────────────────┘

```

---

## Key Features

* **Deep Codebase Understanding:** Reads actual repository structures, symbols, cross-file references, and build diagnostics directly without manual code copying.
* **Direct Scoped Execution:** Handles quick fixes, refactoring, and code validation directly without overhead.
* **Smart Delegation & Instant Takeover:** Offloads build, test, and multi-file editing loops to native DSH sessions—**which you can jump in, steering, or fully take over at any second**.
* **Independent Code Review:** Performs post-execution reviews against raw git diffs and edited files to detect missing edge cases, regressions, or test gaps.

---

## DSH-plugin as UI

<img width="1080" height="852" alt="d78eaebd68e6ff738a5fb769fc6f167b" src="https://github.com/user-attachments/assets/699b97c1-ea84-4f97-815d-3a00441dadad" />

<img width="877" height="621" alt="74bfadbdf7f558489bd2a00a6cee273b" src="https://github.com/user-attachments/assets/0265b053-5202-4fa4-9b52-94a7ca3b82d5" />

<img width="893" height="635" alt="9a4fe613a737fdd130c0f7200a67e38f" src="https://github.com/user-attachments/assets/e80b3a50-c68c-41c5-a80f-afec2b13fa1b" />

---

## How It Works

**Focused & Scoped Tasks:**

```text
ChatGPT ──► Agent Helm ──► Inspect · Reason · Edit · Verify

```

**Complex & Sustained Tasks:**

```text
ChatGPT ──► Inspect & Plan ──► Delegate to DSH ──► Native DSH Session ──► ChatGPT Review
                                                        ▲
                                              (You can take over anytime)

```

---

## Prerequisites

DSH with ChatGPT relies on the following runtime components:

* **Node.js**: v22+
* **DeepSeek Harness**: (`dsh`)
* **Serena**: Code intelligence provider
* **OpenAI Tunnel Client**: `tunnel-client`

> **Note:** Manual installation of these dependencies is not required up front. DSH with ChatGPT automatically inspects your environment, prompts for missing dependencies, and offers one-click setup where supported. For manual configuration details, refer to the [Setup Guide](https://gist.github.com/tonyzhu/d7ad8c84a90ea04e5c853a3cfe4df099#file-readme-zh-cn-md).

---

## Installation

Install the plugin into your DSH Web profile:

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt

```

*The underlying `@beforewave/agent-helm` service will be installed automatically.*

Start DSH:

```bash
dsh web

```

Upon launch, the plugin will verify your environment and guide you through remaining initializations.

---

## Connecting ChatGPT

The plugin uses **OpenAI Secure MCP Tunnel** to connect ChatGPT securely to your local `Agent Helm` runtime.

```text
ChatGPT ──► Secure MCP Tunnel ──► tunnel-client ──► Agent Helm ──► Local Workspace / DSH

```

### Configuration Steps

1. Obtain your OpenAI Secure MCP Tunnel details:
* **Tunnel ID**
* **Runtime API Key** (with `Tunnels Read` and `Tunnels Use` permissions)


2. Set credentials in your environment:
```bash
export CONTROL_PLANE_TUNNEL_ID="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CONTROL_PLANE_API_KEY="sk-..."

```


3. Configure ChatGPT:
* Enable **Developer Mode** in ChatGPT.
* Navigate to **Settings** -> **Apps / Connectors** -> **Add Custom Connector**.
* Select **Tunnel** as the connection type.
* Choose the corresponding Secure MCP Tunnel instance.



---

## Usage Examples

### 1. Direct Troubleshooting & Quick Fixes

```text
Investigate why this authentication flow occasionally refreshes twice.
Trace the relevant execution paths in the real codebase, explain the root cause,
and then directly fix and verify it.

```

### 2. Delegating Complex Features to DSH

```text
Read the current implementation and analyze how to integrate this feature.
Once you understand the architecture, hand off the implementation to DSH.
Perform an independent review after DSH completes the task.

```

### 3. Post-Execution Review

```text
Review the changes DSH just completed.
Inspect the actual modified files and git diff independently to check for
correctness, regressions, missing edge cases, and test coverage.

```

---

## Native DSH Integration: Full Control & Instant Takeover

Delegating tasks to DSH never means losing visibility or control. Every delegated task runs inside a **first-class, native DeepSeek Harness session**.

> **⚡ Take Over Anytime:** DSH is not a hidden background black box. You can jump into the DSH Web UI at any second to watch live execution, edit code manually, steer the agent, or take full manual control of the session without breaking context.

Through the DSH Web UI, you can:

* **Live Monitoring & Steering:** Track real-time agent logs and interrupt or redirect execution whenever necessary.
* **Instant Manual Takeover:** Jump directly into the interactive terminal/session and take control at any point.
* **Preserve Full Context:** Retain complete DSH state, session history, and workspace modifications seamlessly.

---

## Underlying Architecture: Agent Helm

[`@beforewave/agent-helm`](https://www.npmjs.com/package/@beforewave/agent-helm) serves as the local capability layer powering the plugin. It exposes the following tools to ChatGPT:

* File system and repository inspection
* Symbol and reference navigation
* Code intelligence and diagnostics (powered by **Serena**)
* Scoped file editing and command execution
* Local agent session delegation

*Agent Helm can run as a standalone local capability layer or be managed automatically by the DSH plugin.*

---

## Packages

| Package | Role |
| --- | --- |
| **`@beforewave/dsh-with-chatgpt`** | DSH plugin integration and user experience layer |
| **`@beforewave/agent-helm`** | Core local capability engine for code navigation, execution, and agent bridge |

---

## Project Status

DSH with ChatGPT and Agent Helm are under active development.

> **Let ChatGPT understand the real project, work directly when appropriate, and bring that reasoning to DSH when larger execution is needed.**
