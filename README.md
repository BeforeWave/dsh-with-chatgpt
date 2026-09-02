<p align="right">
  <a href="./README.en.md">English</a> | <a href="./README.md"><b>中文</b></a>
</p>

# DSH with ChatGPT

> **让浏览器里的 ChatGPT 直接理解和操作你的本地开发环境，并在需要时指挥 DSH 持续执行任务。**

**DSH with ChatGPT 是一个 DeepSeek Harness（DSH）Plugin。**

它让 ChatGPT 直接基于你电脑上的真实项目工作：理解代码、分析问题、修改文件、运行命令并验证结果，而不需要反复把代码、错误信息和项目上下文复制到对话里。

对于需要大量修改、构建、测试或持续执行的任务，ChatGPT 可以先理解问题和修改方向，再指挥原生 DSH Session 执行。

同时，你可以直接在 DSH 中查看和管理 ChatGPT 的本地工作：它使用了哪个项目、做过什么、当前进展如何，以及关联的 DSH Session。

```text
                 浏览器里的 ChatGPT
                        │
                 理解并操作本地项目
                        │
              ┌─────────┴─────────┐
              │                   │
           直接完成            指挥 DSH
              │                   │
              │                   ▼
              │              DSH Session
              │                   │
              └─────────┬─────────┘
                        ▼
                   检查实际结果
```

<img width="2164" height="1666" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

## 快速开始

安装 Plugin：

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

启动 DSH：

```bash
dsh web
```

首次运行时，DSH with ChatGPT 会检查当前环境，并通过产品内的 **Setup Guide** 引导你完成需要的安装、连接和授权。

<img width="2164" height="1666" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

配置完成后，就可以直接在浏览器里的 ChatGPT 中开始工作。

如果你更习惯直接从浏览器管理 Agent Helm，也可以使用 [Agent Helm Chrome Extension](https://github.com/BeforeWave/agent-helm-extensions)。

## 在 DSH 中查看和管理工作

DSH with ChatGPT 会把 ChatGPT Conversation、本地项目、ChatGPT 的本地操作和 DSH Session 组织到同一项工作中。

你可以直接看到：

* ChatGPT 当前使用的项目 / Worktree
* 对应的 ChatGPT Conversation
* ChatGPT 在本地做过什么
* 当前工作状态和最近的执行活动
* 关联的 DSH Session

<img width="2164" height="1666" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

如果任务正在 DSH 中执行，可以直接进入对应的 Session 查看进度、继续对话或接管执行。

<img width="906" height="1078" alt="DSH Session" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

过去的工作也会保留在 Work History 中，方便之后重新找到并继续。

## 本地项目与安全

项目和实际执行环境仍然在你的电脑上。

ChatGPT 会根据当前任务获得必要的本地信息，包括相关文件、代码结构、诊断、Git 状态、命令输出和测试结果。

实际能够访问和执行什么，由当前授权的 Workspace、能力和权限决定。

ChatGPT 直接执行本地操作时，由 [Agent Helm](https://github.com/BeforeWave/agent-helm) 提供本地能力和 Sandbox 边界；任务由 DSH 执行时，则使用对应 DSH Session 自身的权限和 Sandbox 配置。

## 相关项目

| 项目                                                                           | 用途                                   |
| ---------------------------------------------------------------------------- | ------------------------------------ |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | 让 ChatGPT 连接并操作本地开发环境                |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Chrome Extension 和其他 Agent Helm 用户界面 |

## 项目状态

DSH with ChatGPT 正在持续开发中。
