<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

# DSH with ChatGPT

> **Bring ChatGPT's reasoning into your local workspace: fix smaller tasks directly, delegate larger ones to DSH.**

We brought ChatGPT down from the cloud into your local workspace — and put it inside a sandbox.

**DSH with ChatGPT** deeply connects ChatGPT with your real local workspace and native DeepSeek Harness (DSH) execution sessions.

ChatGPT is no longer limited to code snippets copied into a chat window. It can understand the code, configuration, tests, documentation, Git state, and engineering tools inside your workspace, trace symbols and references, inspect diagnostics, and reason against the real project context.

For focused changes, ChatGPT can work directly. For larger tasks that require repeated editing, building, and testing, ChatGPT first understands the problem and the project, then hands the execution to DSH. When the work is complete, ChatGPT reads the actual code and Git Diff again and independently reviews the result.

```text
                         ChatGPT
               Understand · Reason · Review
                            │
                            ▼
                        Agent Helm
                       /          \
                      /            \
                Work Directly     Delegate
                   │                │
                   ▼                ▼
             Local Workspace        DSH
                   ▲          Edit · Run · Test
                   │          Take over anytime
                   └────────────────┘
```

## Core Experience

### Understand the real workspace

ChatGPT works against your real workspace, not an isolated code snippet inside a conversation.

It can understand:

- source code
- configuration and scripts
- tests
- documentation
- Git / Worktree state
- engineering diagnostics
- local toolchains
- project runtime context

You no longer need to continuously copy code, logs, and project context into ChatGPT.

### Handle smaller tasks directly

Bug investigation, focused changes, small refactors, code understanding, verification, and review do not require launching a full Coding Agent every time.

**ChatGPT can perform this work directly through Agent Helm.**

```text
ChatGPT ──► Agent Helm ──► Inspect · Reason · Edit · Verify
```

### Delegate larger tasks to DSH

When a task requires broad file changes, sustained build and test loops, or multiple rounds of execution, ChatGPT can first understand and plan the work, then hand the concrete execution to a native DSH Session.

```text
ChatGPT
   │
   ├── Understand the real workspace
   ├── Analyze the problem
   └── Define the execution direction
              │
              ▼
          DSH Session
              │
        Edit · Run · Test
              │
              ▼
        ChatGPT Review
```

### Take over at any time

DSH is not a hidden background executor.

Every delegated task creates a real native DSH Session. At any point, you can open DSH Web to:

- watch execution progress
- add instructions
- redirect the Agent
- edit code manually
- take over the Session completely

> **AI can keep working, but final control always remains with you.**

### Independent ChatGPT Review

Execution and judgment are two different things.

After DSH finishes, ChatGPT reads the actual code and Git Diff again instead of simply trusting the Agent's completion report.

It can independently check:

- whether the implementation is correct
- whether edge cases were missed
- whether regressions were introduced
- whether the tests are sufficient
- whether the actual changes still match the original goal

This creates a complete loop:

```text
Understand → Work directly / Delegate → Verify → Independent Review
```

## Let ChatGPT work locally — safely

Connecting ChatGPT to your local workspace should not mean handing over unrestricted access to your computer.

All local engineering capabilities in DSH with ChatGPT are provided through **Agent Helm**.

Agent Helm currently uses **Serena** for LSP-backed semantic code intelligence, **Anthropic Sandbox Runtime** as the local sandbox enforcement backend, and **OpenAI tunnel-client** as the default Secure MCP Tunnel backend for connecting with ChatGPT. Agent Helm itself defines the capability boundaries and security model around those backends.

Agent Helm establishes an explicit Execution Context for each piece of work and controls real resource authority, including:

- Workspace / Worktree
- filesystem reads and writes
- command execution
- environment variables
- network access
- local TCP binding
- semantic capabilities
- Coding Agent delegation

```text
ChatGPT
   │
   ▼
Agent Helm
   │
   ├── Execution Context
   ├── Capability Policy
   ├── Filesystem Authority
   ├── Environment Authority
   ├── Network Authority
   └── Sandbox
            │
            ▼
     Authorized Local Workspace
```

On supported environments, local commands run inside an enforcing sandbox.

This does not rely on prompting the model to "avoid accessing other files." The execution layer itself constrains resource access.

For dynamic behavior that cannot be determined safely before execution, Agent Helm lets the enforcing sandbox apply the final resource boundary.

If the operation cannot be executed safely and no enforcing sandbox is available, Agent Helm defaults to **fail closed** rather than silently falling back to unrestricted execution.

> **ChatGPT can really take action, but what it can access and execute is still bounded by explicit local authority.**

The complete security model and reproducible Security / Conformance Tests are maintained in [Agent Helm](https://github.com/BeforeWave/agent-helm).

## DSH Plugin UI

DSH with ChatGPT integrates directly into DSH Web.

<img width="2140" height="1432" alt="20260831230950" src="https://github.com/user-attachments/assets/be286d62-3a67-4e5f-b3be-935495c89ac4" />

<img width="2878" height="1920" alt="20260831230933" src="https://github.com/user-attachments/assets/3ae6da99-3c69-4c4f-b91e-94ddd6a1e7a3" />

<img width="1080" height="852" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/dc6b91fa-c4c0-49ec-aabe-8ce3ea92b0db" />


## Quick Start

### 1. Install the DSH Plugin

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

### 2. Start DSH

```bash
dsh web
```

Agent Helm is installed alongside the plugin as its local capability and secure execution layer.

First run may still require a few local dependencies, Tunnel settings, or ChatGPT connection steps. DSH with ChatGPT checks the current environment and walks you through the required installation, connection, and authorization flow.

<img width="2776" height="1984" alt="20260831230831" src="https://github.com/user-attachments/assets/9d2c246a-a960-4c12-a019-39174db7a52f" />

**You do not need to leave the product to hunt through installation docs, piece together environment variables, or figure out third-party configuration on your own.**

> **Note**
>
> Detailed third-party configuration for Serena, Tunnel, browser connectivity, and related components is no longer maintained in this README.
>
> These details vary with environment and version. The in-product **Setup Guide** is the authoritative entry point.

## Work History

An AI development task is more than a few commands or a single Agent Session.

Through **Agent Helm Work History**, DSH with ChatGPT connects the ChatGPT Conversation, real Workspace, direct execution, and delegated Sessions under the same piece of Work.

```text
ChatGPT Conversation
        │
        ▼
       Work
     /      \
    /        \
Direct Work  DSH / Subagent Session
```

You can return to:

- the ChatGPT Conversation that started the work
- the Workspace / Worktree that was used
- work performed directly by ChatGPT
- whether the task was delegated to DSH
- the corresponding native DSH Session
- recent activity and execution state

A piece of work can therefore be understood again, continued, reviewed, or taken over instead of being scattered across unrelated logs and tools.

## Agent Helm Family

DSH with ChatGPT is part of the Agent Helm family.

| Project | Role |
| --- | --- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm) | Local engineering capabilities, security boundary, and execution control plane for ChatGPT |
| **DSH with ChatGPT** | Complete ChatGPT + DSH development workflow |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Browser and other user-facing integrations |

If you only need ChatGPT to work directly and safely inside a local workspace without DSH, you can use **Agent Helm** on its own.

If ChatGPT in the browser is your primary entry point, use **Agent Helm Extensions** alongside it.

## Project Status

DSH with ChatGPT is under active development.

Our goal is not to let a Coding Agent take unrestricted control of your computer. It is to build a more natural way for humans, ChatGPT, and local agents to work together:

> **ChatGPT understands, reasons, and reviews. Suitable tasks are handled directly; larger execution work goes to DSH. AI can truly enter the local workspace, while permission boundaries and final control remain with the user.**
