<p align="right">
  <a href="./README.en.md"><b>English</b></a> | <a href="./README.md">中文</a>
</p>

# DSH with ChatGPT

> **Let ChatGPT in your browser understand and operate your local development environment directly, and direct DSH to carry out longer-running tasks when needed.**

**DSH with ChatGPT is a DeepSeek Harness (DSH) Plugin.**

It lets ChatGPT work directly against the real projects on your computer: understanding code, analyzing problems, editing files, running commands, and verifying results, without repeatedly copying code, errors, and project context into the conversation.

For tasks that require substantial editing, building, testing, or continued execution, ChatGPT can first understand the problem and decide on the implementation direction, then direct a native DSH Session to carry out the work.

At the same time, you can use DSH to view and manage ChatGPT's local work: which project it is using, what it has done, the current progress, and any associated DSH Session.

```text
                    ChatGPT in the browser
                              │
                    Understand and operate
                       the local project
                              │
                 ┌────────────┴────────────┐
                 │                         │
              Do it directly            Direct DSH
                 │                         │
                 │                         ▼
                 │                    DSH Session
                 │                         │
                 └────────────┬────────────┘
                              ▼
                       Review actual results
```

<img width="2164" height="1666" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

## Quick Start

Install the Plugin:

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

Start DSH:

```bash
dsh web
```

On first launch, DSH with ChatGPT checks your environment and uses the built-in **Setup Guide** to walk you through any required installation, connection, and authorization steps.

<img width="2164" height="1666" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

Once setup is complete, you can start working directly from ChatGPT in your browser.

If you prefer to manage Agent Helm directly from the browser, you can also use the [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions).

## View and Manage Work in DSH

DSH with ChatGPT brings the ChatGPT Conversation, local project, ChatGPT's local operations, and DSH Sessions together as one piece of work.

You can directly see:

* The project / Worktree ChatGPT is currently using
* The corresponding ChatGPT Conversation
* What ChatGPT has done locally
* The current work status and recent activity
* The associated DSH Session

<img width="2164" height="1666" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

If a task is currently running in DSH, you can open the corresponding Session to inspect progress, continue the conversation, or take over execution directly.

<img width="906" height="1078" alt="DSH Session" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

Previous work is also retained in Work History, so you can find it again later and continue from where you left off.

## Local Projects and Security

Your projects and actual execution environment remain on your computer.

ChatGPT receives the local information required for the current task, including relevant files, code structure, diagnostics, Git state, command output, and test results.

What ChatGPT can access and execute is determined by the currently authorized Workspace, capabilities, and permissions.

When ChatGPT performs local operations directly, [Agent Helm](https://github.com/BeforeWave/agent-helm) provides the local capabilities and Sandbox boundaries. When a task is executed by DSH, it runs under the permissions and Sandbox configuration of the corresponding DSH Session.

## Related Projects

| Project                                                                      | Purpose                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | Connect ChatGPT to and let it operate your local development environment |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Chrome Extension and other Agent Helm user interfaces                    |

## Project Status

DSH with ChatGPT is under active development.
