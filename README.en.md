<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

# DSH with ChatGPT

> **Bring ChatGPT directly into your local development environment: understand the real project, make changes directly, and hand larger tasks that need sustained execution off to DSH.**

**DSH with ChatGPT** takes ChatGPT beyond the chat window and lets it participate directly in your real local development work.

You can describe problems, request changes, discuss solutions, and review results in ChatGPT just as you normally would. ChatGPT can work directly from your authorized local project to understand the problem and get the work done.

When a task becomes larger or needs sustained execution, you can have ChatGPT hand it off to **DeepSeek Harness (DSH)**. You can check progress at any time, add new instructions, or take over directly. ChatGPT can also step back in and continue the work when needed.

These local operations run within explicit permission boundaries and a **Sandbox**, so ChatGPT and DSH can actually get work done without gaining unrestricted access to your entire machine.

> If you prefer not to rely on the DSH Plugin to view and manage this work, you can also use the [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions).  
> It provides an independent browser interface alongside ChatGPT, where you can view and manage local work and move between different Work records and Agent Sessions.

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

```text
                         ChatGPT
                  Understand · Reason · Review
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
               Direct Work       Hand off to DSH
                   │                 │
                   ▼                 ▼
              Local Project      DSH Session
                   ▲                 │
                   │        Keep Working · Take Over
                   └─────────────────┘
```

## Core Experience

### Let ChatGPT work on the real local project

A task may start in a ChatGPT Conversation, but the real project stays on your machine.

You no longer need to keep copying code, logs, errors, and project context into the chat. ChatGPT can work directly from your authorized local project to understand the problem, make changes, and inspect the actual result.

From a user's perspective, the workflow stays simple:

* Describe what you want in ChatGPT
* Let ChatGPT understand the current project
* Let it handle focused changes directly
* Return to the same Conversation to continue discussing and reviewing the work

### Small tasks directly, larger tasks through DSH

Not every task needs a full Coding Agent.

For focused and well-defined work, ChatGPT can handle the task directly.

When a task needs sustained execution, involves more extensive changes, or requires multiple rounds of work, ChatGPT can first understand the problem and goal, then hand the remaining execution off to DSH.

```text
ChatGPT
   │
   ├── Understand the project
   ├── Clarify the goal
   └── Decide the next step
              │
              ▼
          DSH Session
              │
       Continue the work
              │
              ▼
        ChatGPT Review
```

You do not need to decide at the beginning whether a task should stay with ChatGPT or immediately become an Agent task.

Start with ChatGPT, and hand the work off to DSH when it makes sense.

### Take over at any time

DSH is not a black-box executor hidden in the background.

When ChatGPT hands work off to DSH, it creates a real DSH Session.

You can open DSH Web at any time to:

* See current progress
* Add new instructions
* Adjust the Agent's direction
* Participate directly in the work
* Take over the Session completely

> **The Agent can keep working, but you always retain final control.**

### Independent ChatGPT Review

Execution finishing does not mean the work is finished.

After DSH completes a task, ChatGPT can return to the real project and inspect the actual result instead of relying only on the Agent's completion report.

It can continue evaluating:

* Whether the final result matches the original request
* Whether anything important was missed
* Whether the changes introduced new problems
* Whether further adjustments are needed

This creates a complete workflow:

```text
Understand → Direct Work / Hand off to DSH → Execute → ChatGPT Review
```

## Let ChatGPT and DSH actually work — safely

Letting AI work on a local project should not mean handing over your entire computer.

DSH with ChatGPT works only within the local environment you authorize. What ChatGPT and DSH can access, where they can work, and what local operations they can perform are all constrained by explicit permission boundaries.

Local execution is further constrained by a **Sandbox**.

```text
ChatGPT
   │
   ▼
DSH with ChatGPT
   │
   ▼
Agent Helm
   │
   ├── Authorized Workspace
   ├── Permission Boundary
   └── Sandbox
            │
            ▼
       Local Project
```

This does not simply rely on telling the AI through a Prompt not to access anything else.

The actual restrictions are enforced at the local execution layer.

> **ChatGPT and DSH can actually enter the project and work, while what they can access and execute remains controlled by explicit local permissions and Sandbox boundaries.**

These local capabilities and security boundaries are provided by **Agent Helm**:

https://github.com/BeforeWave/agent-helm

You do not need to understand or configure Agent Helm separately before using DSH with ChatGPT. The installation and Setup flow prepares the required environment for you.

## DSH Plugin UI

DSH with ChatGPT integrates directly into DSH Web.

You can see ChatGPT-related work, Sessions, and runtime status in the existing DSH interface, and open the corresponding DSH Session whenever needed.

<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

## Quick Start

### 1. Install the DSH Plugin

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

### 2. Start DSH

```bash
dsh web
```

On first run, DSH with ChatGPT checks the current environment and guides you through the required installation, connection, and authorization steps directly in the product.

<img width="2164" height="1666" alt="dsh-config" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

**You do not need to leave the product to search installation docs, assemble environment variables, or figure out how each component should be configured.**

The required local capabilities and secure execution environment are prepared as part of the Setup flow.

> **Note**
>
> Local dependencies, Tunnel configuration, and ChatGPT connection details may change across versions and environments.
>
> The in-product **Setup Guide** is the authoritative source for the current setup flow.

## Work History

Real development work often extends beyond a single ChatGPT Conversation or a single DSH Session.

ChatGPT may complete part of the work directly and hand the rest off to DSH. You may also leave the Conversation, switch Workspaces, and return later to continue.

Work History brings all of that work back together.

You can always find:

* Which ChatGPT Conversation started the work
* Which Workspace / Worktree was used
* What ChatGPT has already completed
* Whether the task was handed off to DSH
* Which DSH Session belongs to the work
* What happened most recently

<img width="2164" height="1666" alt="dsh-history" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

Work History is not another copy of the chat transcript, and it is not just a list of Agent Sessions.

It connects:

**Conversation → Workspace → Direct Work → DSH Session → Actual Work History**

That means a piece of work can be found again, continued, and reviewed later. You can also return to the DSH Session and take over manually whenever needed.

## Related Projects

These projects can all be used independently. You do not need to understand the entire product family first.

| Project                   | Description                                                                                             | Link                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Agent Helm**            | Gives ChatGPT controlled capabilities to work locally.                                                  | https://github.com/BeforeWave/agent-helm            |
| **Agent Helm Extensions** | Lets ChatGPT in the browser enter the local development environment and work directly on real projects. | https://github.com/BeforeWave/agent-helm-extensions |

## Project Status

DSH with ChatGPT is under active development.

The core idea is simple:

> **Start with ChatGPT and let it understand and work on the real project directly. When a task needs more sustained execution, hand it off to DSH. When execution is complete, bring ChatGPT back to the actual result for another round of review.**

Throughout the entire workflow, AI can actually get work done while local permissions, Sandbox boundaries, and final control remain in your hands.
