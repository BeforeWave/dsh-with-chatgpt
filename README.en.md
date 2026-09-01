<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

# DSH with ChatGPT

> **Start in ChatGPT. Handle focused tasks directly, hand sustained work off to DSH, then return to ChatGPT to inspect the result and continue.**

**DSH with ChatGPT** connects ChatGPT, your local project, and **DeepSeek Harness (DSH)** into one continuous workflow.

You still describe problems, discuss approaches, and inspect results in ChatGPT. ChatGPT can understand the current project and handle work directly; when a task becomes larger, takes longer, or needs sustained execution, the remaining work can be handed off to DSH.

While DSH is working, you can check progress, add instructions, or take over at any time. When it finishes, ChatGPT can inspect the actual result in the project and continue from there.

```text
                         ChatGPT
                Understand · Reason · Work · Review
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
               Direct Work      Hand off to DSH
                   │                 │
                   │                 ▼
                   │             DSH Session
                   │                 │
                   │       Keep Working · Take Over
                   │                 │
                   └────────┬────────┘
                            ▼
                      ChatGPT Review
```

**Your project and the actual execution environment stay on your machine.**

While ChatGPT is working, it receives the information needed for the current task, such as relevant file contents, errors, project state, and command output.

Local operations run within the project and permissions you authorize and are protected by a Sandbox. If required security protection is unavailable, the related operation is rejected.

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

## Quick Start

Install the DSH Plugin:

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

Start DSH:

```bash
dsh web
```

On first run, DSH with ChatGPT checks the current environment and guides you through the required installation, connection, and authorization steps in the product UI.

<img width="2164" height="1666" alt="dsh-config" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

Use the in-product **Setup Guide** as the current source for setup instructions.

If you prefer to view and manage work directly alongside ChatGPT in the browser, you can also use the [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions).

## Let ChatGPT Work Directly

For focused tasks, ChatGPT can directly:

- Understand the current project
- Find and read files
- Make changes
- Run tools and commands
- Inspect errors and runtime results
- Verify the result

You do not need to decide up front whether to start a DSH Session.

## Hand Sustained Work Off to DSH

Larger, time-consuming tasks or work that needs multiple rounds can be handed to DSH after ChatGPT has clarified the goal.

```text
ChatGPT
   │
   ├── Understand the project
   ├── Clarify the goal
   └── Hand off to DSH
              │
              ▼
          DSH Session
              │
       Sustained Execution
              │
              ▼
        ChatGPT Review
```

A task can move naturally between:

**ChatGPT Direct Work → DSH Sustained Execution → ChatGPT Review and Continuation**

## View Progress and Take Over at Any Time

Every piece of work handed to DSH has a corresponding DSH Session.

In DSH Web, you can:

- Check current progress
- Add new instructions
- Adjust direction
- Participate directly in the work
- Take over the Session

<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

## What Passes Between Your Local Project and ChatGPT

Project files, Git state, tools, and commands use your local environment as their current state.

While ChatGPT is working, it receives the information needed to complete the current task, including:

- Relevant file contents
- Errors and diagnostics
- Project state
- Git information
- Command output
- Other information needed for the current task

## Security Boundaries

Local operations executed directly by ChatGPT are controlled by the permissions and Sandbox boundaries provided by [**Agent Helm**](https://github.com/BeforeWave/agent-helm).

After work is handed off to DSH, the DSH Session runs according to DSH's own configured permissions and Sandbox model.

## Work History

Work History connects the ChatGPT Conversation, local project, direct operations, and DSH Session that belong to the same work.

You can see:

- Which ChatGPT Conversation started the work
- Which project / Worktree was used
- What ChatGPT has completed
- Whether the task was handed off to DSH
- The related DSH Session
- What happened most recently

<img width="2164" height="1666" alt="dsh-history" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

Long-running work can be found again and continued at any time, and you can reopen the corresponding DSH Session when needed.

## Related Projects

| Project | Purpose | Link |
| --- | --- | --- |
| **Agent Helm** | Connects ChatGPT to local projects so it can get work done | [Agent Helm](https://github.com/BeforeWave/agent-helm) |
| **Agent Helm Extensions** | Chrome Extension and other Agent Helm interfaces | [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) |

## Project Status

DSH with ChatGPT is under active development.
