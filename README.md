<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

# DSH with ChatGPT

> **Bring ChatGPT’s reasoning to your local codebase. Work directly, or delegate larger tasks to DSH.**

**DSH with ChatGPT** connects ChatGPT to your local codebase and native DeepSeek Harness execution sessions.

ChatGPT can inspect the real project, understand code structure, diagnose issues, and reason from actual repository context instead of pasted snippets.

For focused changes, ChatGPT can work directly. For larger or execution-heavy tasks, it can delegate implementation to DSH and independently review the result afterward.

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
            Work directly       Delegate
                 │                 │
                 ▼                 ▼
           Local Codebase          DSH
                 ▲           Edit · Run · Test
                 │                 │
                 └─────────────────┘
```

---

## Why DSH with ChatGPT

### Reason over real code

Let ChatGPT inspect your actual repository, code structure, symbols, references, and diagnostics instead of manually copying code into a conversation.

### Work directly when it makes sense

For focused changes, ChatGPT can inspect, modify, and verify the code itself without starting another coding agent.

### Delegate larger tasks to DSH

For longer edit / build / test loops, ChatGPT can first understand the problem and implementation direction, then hand execution to a native DSH session.

### Review independently

After DSH finishes, ChatGPT can inspect the resulting code and diff independently to catch incomplete implementations, regressions, missing edge cases, and test gaps.

---

## How It Works

For smaller tasks:

```text
ChatGPT
   ↓
Agent Helm
   ↓
Inspect · Reason · Edit · Verify
```

For larger tasks:

```text
ChatGPT
   ↓
Inspect · Understand · Plan
   ↓
Delegate to DSH
   ↓
Native DSH Session
   ↓
Edit · Run · Test · Iterate
   ↓
ChatGPT Review
```

ChatGPT can reason directly against the real project, handle focused work itself, and bring that understanding to DSH when a task needs sustained local execution.

---

## Requirements

DSH with ChatGPT currently depends on:

* **Node.js 22+**
* **DeepSeek Harness (`dsh`)**
* **Serena**
* **OpenAI `tunnel-client`**

You do not need to manually install and configure every dependency before getting started.

**DSH with ChatGPT checks the local environment and guides you through missing dependencies, including one-click installation where supported.**

If you want to understand or reproduce the underlying setup manually, see the [manual setup guide](https://gist.github.com/tonyzhu/d7ad8c84a90ea04e5c853a3cfe4df099).

---

## Installation

Install the plugin into your DSH Web profile:

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt
```

`@beforewave/agent-helm` is installed automatically as the underlying local capability service.

Start DSH normally:

```bash
dsh web
```

DSH with ChatGPT will check the local environment and guide you through the remaining setup.

---

## Connect ChatGPT

DSH with ChatGPT uses **OpenAI Secure MCP Tunnel** to connect ChatGPT to Agent Helm running on your local machine.

```text
ChatGPT
   ↓
OpenAI Secure MCP Tunnel
   ↓
tunnel-client
   ↓
Agent Helm
   ↓
Local Codebase / DSH
```

You will need:

* an OpenAI Secure MCP Tunnel;
* its Tunnel ID;
* a Runtime API key with:

  * `Tunnels Read`
  * `Tunnels Use`

Provide the credentials to the runtime:

```bash
export CONTROL_PLANE_TUNNEL_ID="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CONTROL_PLANE_API_KEY="sk-..."
```

Then in ChatGPT:

1. Enable **Developer Mode**.
2. Open **Settings** and add a custom App / Connector.
3. Choose **Tunnel** as the connection type.
4. Select the same Secure MCP Tunnel.

Once connected, ChatGPT can access the capabilities exposed by Agent Helm.

For the complete manual setup process, see the [setup guide](https://gist.github.com/tonyzhu/d7ad8c84a90ea04e5c853a3cfe4df099).

---

## Usage

Use ChatGPT normally against the project where DSH is running.

For a focused task:

```text
Investigate why this authentication flow occasionally refreshes twice.

Read the relevant implementation first, trace the important code paths,
explain the root cause, then fix it and verify the change.
```

For a larger task:

```text
Read the current implementation and work out how this feature should be added.

Once you understand the affected architecture, delegate the implementation
to DSH and review the completed changes afterward.
```

For an independent review:

```text
Review the changes DSH just made.

Inspect the actual modified code and diff independently.
Check for correctness issues, regressions, missing edge cases,
and incomplete tests.
```

Not every task needs to go through DSH.

ChatGPT can work directly when that is the simpler path and delegate when sustained execution is more appropriate.

---

## Native DSH Sessions

Tasks delegated from ChatGPT run as native DeepSeek Harness sessions.

You can open them in DSH Web at any time to:

* inspect progress;
* continue the session yourself;
* take over when necessary;
* review what the agent did;
* preserve the normal DSH workflow and session history.

DSH remains a first-class coding environment rather than a hidden background executor.

---

## Agent Helm

[`@beforewave/agent-helm`](https://www.npmjs.com/package/@beforewave/agent-helm) is the local capability layer behind DSH with ChatGPT.

It gives ChatGPT access to capabilities such as:

* repository and file inspection;
* code search;
* symbol and reference navigation;
* diagnostics;
* focused code modification;
* controlled local command execution;
* local coding-agent integration.

Serena is currently the primary code-intelligence provider behind Agent Helm.

Agent Helm can also run independently as a shared local capability layer. When used through DSH with ChatGPT, the plugin manages it automatically.

---

## Packages

### `@beforewave/dsh-with-chatgpt`

The DSH integration and user-facing experience.

### `@beforewave/agent-helm`

The underlying local capability layer connecting ChatGPT to code intelligence, local execution, and coding agents.

---

## Status

DSH with ChatGPT and Agent Helm are under active development.

The current goal is simple:

> **Let ChatGPT understand the real project, work directly when appropriate, and bring that reasoning to DSH when larger execution is needed.**

---

## Source Status

The npm packages are publicly available.

The implementation source will be opened progressively as the project matures.
