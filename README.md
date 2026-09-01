<p align="right">
  <a href="./README.en.md">English</a> | <a href="./README.md"><b>中文</b></a>
</p>

# DSH with ChatGPT

> **让 ChatGPT 直接进入你的本地开发环境：理解真实项目、直接完成修改，并把需要持续执行的更大任务交给 DSH。**

**DSH with ChatGPT** 让 ChatGPT 不再只停留在聊天窗口里，而是真正参与到你的本地开发工作中。

你可以像平时一样在 ChatGPT 里描述问题、提出修改要求、讨论方案和 Review 结果。ChatGPT 可以直接基于你授权的本地项目理解问题并完成工作。

当任务更大、需要持续执行时，你可以让 ChatGPT 把任务继续交给 DeepSeek Harness（DSH）。你可以随时查看进度、追加指令，或者直接接管；ChatGPT 也可以随时重新接手并继续工作。

这些本地操作在明确的权限范围和 **Sandbox** 中执行，让 ChatGPT 和 DSH 能真正动手，同时不会获得对整台电脑的无限制访问。

> 如果你不想依赖 DSH Plugin 来查看和管理这些工作，也可以使用 [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions)。

> 它提供独立的浏览器入口，让你直接在 ChatGPT 旁查看和管理本地工作，并在不同 Work 和 Agent Session 之间切换。

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

```text
                         ChatGPT
                   理解 · 推理 · Review
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
              直接完成工作         交给 DSH
                   │                 │
                   ▼                 ▼
               本地项目          DSH Session
                   ▲                 │
                   │          持续执行 · 随时接管
                   └─────────────────┘
```

## 核心体验

### 让 ChatGPT 操作真实的本地项目

一个任务可以从 ChatGPT Conversation 开始，但真正的项目始终在你的电脑上。

你不需要不断把代码、日志、错误信息和项目背景复制进聊天窗口。ChatGPT 可以直接基于你授权的本地项目理解问题、完成修改，并继续检查实际结果。

对于用户来说，体验很简单：

* 在 ChatGPT 里描述你想做什么
* 让 ChatGPT 理解当前项目
* 让它直接完成明确的修改
* 回到同一个 Conversation 继续讨论和 Review

### 小任务直接做，大任务交给 DSH

并不是每一个任务都需要启动一个完整的 Coding Agent。

对于明确而集中的工作，ChatGPT 可以直接完成。

当任务需要持续执行、涉及更多修改，或者需要经过多轮工作以后，ChatGPT 可以在理解问题和目标之后，把后续执行交给 DSH。

```text
ChatGPT
   │
   ├── 理解项目
   ├── 明确目标
   └── 决定下一步
              │
              ▼
          DSH Session
              │
        持续完成任务
              │
              ▼
        ChatGPT Review
```

这样，你不需要在一开始就决定“这个任务到底应该自己和 ChatGPT 做，还是启动 Agent”。

可以先从 ChatGPT 开始，需要的时候再继续交给 DSH。

### 随时人工接管

DSH 不是隐藏在后台的黑盒执行器。

当 ChatGPT 把任务交给 DSH 时，会创建一个真实的 DSH Session。

你可以随时打开 DSH Web：

* 查看当前执行进度
* 追加新的要求
* 调整 Agent 的方向
* 直接参与当前工作
* 完全接管 Session

> **Agent 可以持续执行，但最终控制权始终属于你。**

### ChatGPT 独立 Review

执行完成不代表工作就结束了。

DSH 完成任务以后，ChatGPT 可以重新回到真实项目中检查实际结果，而不是只读取 Agent 的完成说明。

它可以继续判断：

* 最终结果是否符合原来的要求
* 有没有遗漏重要情况
* 修改是否带来了新的问题
* 是否还需要继续调整

形成完整的工作闭环：

```text
理解 → 直接处理 / 交给 DSH → 完成执行 → ChatGPT Review
```

## 安全地让 ChatGPT 和 DSH 真正动手

让 AI 操作本地项目，不应该等于把整台电脑交给它。

DSH with ChatGPT 只在你授权的本地工作环境中工作。ChatGPT 和 DSH 能够访问什么、能够在哪里工作，以及本地操作可以做到什么，都受到明确的权限范围限制。

本地执行进一步受到 **Sandbox** 约束。

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
        本地项目
```

这不是简单依赖 Prompt 告诉 AI“不要访问其他地方”。

真正的限制发生在本地执行层。

> **ChatGPT 和 DSH 可以真正进入项目工作，但它们能够访问什么、执行什么，仍然由明确的本地权限和 Sandbox 边界决定。**

这些本地能力和安全边界由 **Agent Helm** 提供：

https://github.com/BeforeWave/agent-helm

你不需要为了使用 DSH with ChatGPT，先单独理解或配置 Agent Helm；安装和 Setup 流程会一起处理所需环境。

## DSH Plugin UI

DSH with ChatGPT 直接集成在 DSH Web 中。

你可以在原本的 DSH 界面里看到 ChatGPT 相关的工作、Session 和运行状态，并在需要时直接进入对应的 DSH Session。

<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

## 快速开始

### 1. 安装 DSH Plugin

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

### 2. 启动 DSH

```bash
dsh web
```

首次运行时，DSH with ChatGPT 会检查当前环境，并通过产品界面引导你完成需要的安装、连接和授权。

<img width="2164" height="1666" alt="dsh-config" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

**你不需要离开产品自己查安装文档、拼环境变量，或者研究各个组件应该怎么配置。**

需要的本地能力和安全执行环境会随 Setup 流程一起准备。

> **注意**
>
> 本地依赖、Tunnel 和 ChatGPT 连接方式可能随着版本和环境变化。
>
> 产品内的 **Setup Guide** 是当前配置流程的权威入口。

## Work History

一次真实的开发工作，往往不只发生在一个 ChatGPT Conversation 或一个 DSH Session 中。

ChatGPT 可能直接完成一部分，也可能把后续工作交给 DSH；你也可能在过程中离开 Conversation、切换 Workspace，之后再回来继续。

Work History 把这些工作重新组织到一起。

你可以随时重新找到：

* 这项工作来自哪个 ChatGPT Conversation
* 使用的是哪个 Workspace / Worktree
* ChatGPT 已经完成了什么
* 是否把任务交给了 DSH
* 对应的是哪个 DSH Session
* 最近又发生了什么

<img width="2164" height="1666" alt="dsh-history" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

Work History 不是另一份聊天记录，也不只是 Agent Session 列表。

它连接的是：

**Conversation → Workspace → Direct Work → DSH Session → 实际工作历史**

这样，一项工作可以被重新找到、继续、Review，也可以在需要时重新进入 DSH Session 人工接管。

## 相关项目

这几个项目都可以独立使用，不要求你提前了解整个产品体系。

| 项目                        | 说明                            | 链接                                                  |
| ------------------------- | ----------------------------- | --------------------------------------------------- |
| **Agent Helm**            | 让 ChatGPT 获得受控的本地工作能力。        | https://github.com/BeforeWave/agent-helm            |
| **Agent Helm Extensions** | 让浏览器里的 ChatGPT 直接进入本地开发环境并工作。 | https://github.com/BeforeWave/agent-helm-extensions |

## 项目状态

DSH with ChatGPT 正在持续开发中。

这个产品解决的核心问题很简单：

> **从 ChatGPT 开始，让它直接理解和处理真实项目；需要更持续的执行时，把任务交给 DSH；完成以后再由 ChatGPT 回到真实结果上继续 Review。**

整个过程中，AI 可以真正动手，同时本地权限、Sandbox 边界和最终控制权始终掌握在用户手里。
