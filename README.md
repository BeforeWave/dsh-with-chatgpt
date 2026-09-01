<p align="right">
  <a href="./README.en.md">English</a> | <a href="./README.md"><b>中文</b></a>
</p>

# DSH with ChatGPT

> **把 ChatGPT 的推理能力带进本地工作区：小任务直接修复，大任务交给 DSH。**

我们把 ChatGPT 从云端请到了本地，也把它放进了沙盒。

**DSH with ChatGPT** 将 ChatGPT 深度接入你的真实本地工作区与 DeepSeek Harness（DSH）原生执行 Session。

ChatGPT 不再局限于被动接收复制粘贴的代码片段，而是可以直接理解工作区中的代码、配置、测试、文档、Git 状态和工程工具，追踪符号与引用、分析诊断信息，并基于真实项目上下文进行推理和工作。

对于明确而集中的修改，ChatGPT 可以直接完成；对于范围更大、需要反复编辑、构建和测试的任务，ChatGPT 先理解问题和工程，再把具体执行交给 DSH。任务完成后，ChatGPT 重新读取真实代码和 Git Diff，独立 Review 结果。

```text
                         ChatGPT
                   理解 · 推理 · Review
                            │
                            ▼
                        Agent Helm
                       /          \
                      /            \
                 直接处理           委派
                   │                │
                   ▼                ▼
                本地工作区           DSH
                   ▲          Edit · Run · Test
                   │          随时人工接管
                   └────────────────┘
```

## 核心体验

### 真实工作区感知

ChatGPT 直接面对真实工作区，而不是聊天窗口里的代码片段。

它可以理解：

- 源代码
- 配置与脚本
- 测试
- 文档
- Git / Worktree 状态
- 工程诊断
- 本地工具链
- 项目运行上下文

这意味着你不再需要不断复制代码、日志和项目背景到 ChatGPT。

### 小任务直接处理

Bug 排查、局部修改、小范围重构、代码理解、验证和 Review，不需要为了每一个任务都启动完整 Coding Agent。

**ChatGPT 可以通过 Agent Helm 直接完成这些工作。**

```text
ChatGPT ──► Agent Helm ──► 读取 · 推理 · 修改 · 验证
```

### 大任务交给 DSH

当任务需要大量文件修改、持续构建测试或者多轮执行时，ChatGPT 可以先完成理解和规划，再把具体执行交给原生 DSH Session。

```text
ChatGPT
   │
   ├── 理解真实工作区
   ├── 分析问题
   └── 明确执行方向
              │
              ▼
          DSH Session
              │
        Edit · Run · Test
              │
              ▼
        ChatGPT Review
```

### 随时人工接管

DSH 不是隐藏在后台的黑盒执行器。

每一次委派都会创建一个真正的原生 DSH Session。你可以随时打开 DSH Web：

- 查看实时执行进度
- 追加指令
- 调整 Agent 方向
- 手工修改代码
- 完全接管当前 Session

> **AI 可以持续执行，但最终控制权始终属于你。**

### ChatGPT 独立 Review

执行和判断是两件不同的事情。

DSH 完成工作以后，ChatGPT 会重新读取真实代码和 Git Diff，而不是单纯相信 Agent 的完成报告。

它可以继续检查：

- 实现是否正确
- 是否遗漏边界情况
- 是否引入潜在回归
- 测试是否充分
- 实际修改是否符合原始目标

这样形成的是完整闭环：

```text
理解 → 直接处理 / 委派执行 → 验证 → 独立 Review
```

## 安全地让 ChatGPT 真正动手

把 ChatGPT 接进本地工作区，不应该等于把整台电脑交给它。

DSH with ChatGPT 的所有本地工程能力都通过 **Agent Helm** 提供。

目前，Agent Helm 使用 **Serena** 提供基于 LSP 的语义代码理解，使用 **Anthropic Sandbox Runtime** 作为本地执行的 sandbox enforcement backend，并默认使用 **OpenAI tunnel-client** 建立与 ChatGPT 的 Secure MCP Tunnel。具体能力边界与安全模型由 Agent Helm 定义。

Agent Helm 为每一次工作建立明确的 Execution Context，并控制真实的资源权限，包括：

- Workspace / Worktree
- 文件系统读写
- 命令执行
- 环境变量
- 网络访问
- Local TCP Binding
- Semantic 能力
- Coding Agent 委派

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
       授权的本地工作区
```

在支持的环境中，本地命令进一步运行在 enforcing sandbox 中。

这不是依赖 Prompt 告诉模型“不要访问其他地方”，而是由实际执行层限制资源边界。

对于无法在执行前静态判断的动态行为，Agent Helm 会让 enforcing sandbox 承担最终的资源约束。

如果无法安全执行，同时又没有可用的 enforcing sandbox，则默认 **fail closed**，而不是静默退化为无限制执行。

> **ChatGPT 可以真正动手，但它能访问什么、执行什么，仍然由明确的本地权限边界决定。**

完整的安全模型以及可复现的 Security / Conformance Tests 由 [Agent Helm](https://github.com/BeforeWave/agent-helm) 项目统一维护。

## DSH Plugin UI

DSH with ChatGPT 直接集成在 DSH Web 中。


<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />



## 快速开始

### 1. 安装 DSH Plugin

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

### 2. 启动 DSH

```bash
dsh web
```

Agent Helm 会作为底层本地能力与安全执行层一起安装。

首次运行时可能仍需要完成一些本地依赖、Tunnel 或 ChatGPT 连接配置。DSH with ChatGPT 会检查当前环境，并通过产品界面一步步引导你完成需要的安装、连接和授权步骤。
<img width="2164" height="1666" alt="dsh-config" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

**你不需要离开产品自己查安装文档、拼环境变量，或者研究第三方组件应该怎么配置。**

> **注意**
>
> Serena、Tunnel、浏览器连接等第三方组件的具体配置不再维护在 README 中。
>
> 这些配置会随着环境和版本变化，产品内的 **Setup Guide** 是权威入口。

## Work History

一次 AI 开发工作不只是几条命令，也不只是一个 Agent Session。

DSH with ChatGPT 通过 **Agent Helm Work History**，把 ChatGPT Conversation、真实 Workspace、直接执行和委派 Session 组织到同一项 Work 下面。

```text
ChatGPT Conversation
        │
        ▼
       Work
     /      \
    /        \
Direct Work  DSH / Subagent Session
```

你可以重新找到：

- 这项工作来自哪个 ChatGPT Conversation
- 使用的是哪个 Workspace / Worktree
- ChatGPT 做过哪些直接工作
- 是否委派给 DSH
- 对应的原生 DSH Session
- 最近的活动和执行状态

<img width="2164" height="1666" alt="dsh-history" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

这样一项工作可以被重新理解、继续、Review，也可以被人工接管，而不是散落在不同工具的日志里。

## Agent Helm 产品家族

DSH with ChatGPT 是 Agent Helm 产品家族的一部分。

| 项目 | 角色与定位 |
| --- | --- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm) | ChatGPT 的本地工程能力、安全边界与执行控制层 |
| **DSH with ChatGPT** | ChatGPT + DSH 的完整开发工作流 |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | 浏览器及其他用户入口扩展 |

如果你只需要让 ChatGPT 直接、安全地操作本地工作区，而不需要 DSH，可以单独使用 **Agent Helm**。

如果你主要从 ChatGPT 浏览器界面工作，可以配合 **Agent Helm Extensions** 使用。

## 项目状态

DSH with ChatGPT 正在持续开发中。

我们的目标不是让一个 Coding Agent 无限制地接管你的电脑，而是建立一套更自然的协作方式：

> **ChatGPT 负责理解、推理和 Review；合适的事情直接做，更大的执行任务交给 DSH；AI 可以真正进入本地工作区，而权限边界和最终控制权始终掌握在用户手里。**
