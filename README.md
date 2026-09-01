<p align="right">
  <a href="./README.en.md">English</a> | <a href="./README.md"><b>中文</b></a>
</p>

# DSH with ChatGPT

> **从 ChatGPT 开始工作。明确的任务直接完成，需要持续执行时交给 DSH，完成后再回到 ChatGPT 检查结果并继续。**

**DSH with ChatGPT** 把 ChatGPT、你的本地项目和 **DeepSeek Harness（DSH）** 连接成一套连续的工作流。

你仍然在 ChatGPT 里描述问题、讨论方案和检查结果。ChatGPT 可以直接了解当前项目并完成工作；当任务更大、耗时更长或者需要持续执行时，可以把后续工作交给 DSH。

DSH 执行过程中，你可以随时查看进度、追加要求或者直接接管。完成以后，ChatGPT 可以重新检查项目中的实际结果并继续处理。

```text
                         ChatGPT
                   理解 · 推理 · 工作 · Review
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
               直接完成工作         交给 DSH
                   │                 │
                   │                 ▼
                   │             DSH Session
                   │                 │
                   │        持续执行 · 随时接管
                   │                 │
                   └────────┬────────┘
                            ▼
                      ChatGPT Review
```

**项目和实际执行环境在你的电脑上。**

ChatGPT 工作时，会收到完成当前任务所需的信息，例如相关文件内容、错误信息、项目状态和命令输出。

本地操作基于你授权的项目和权限执行，并受到 Sandbox 保护。需要的安全保护不可用时，相关操作会被拒绝。

<img width="2164" height="1666" alt="dsh-pure" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

## 快速开始

安装 DSH Plugin：

```bash
dsh plugin --profile web add dsh-with-chatgpt
```

启动 DSH：

```bash
dsh web
```

首次运行时，DSH with ChatGPT 会检查当前环境，并在产品界面中引导你完成需要的安装、连接和授权。

<img width="2164" height="1666" alt="dsh-config" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

当前配置流程以产品内的 **Setup Guide** 为准。

如果你更习惯直接从浏览器里的 ChatGPT 查看和管理工作，也可以使用 [**Agent Helm Chrome Extension**](https://github.com/BeforeWave/agent-helm-extensions)。

## ChatGPT 直接工作

对于明确的任务，ChatGPT 可以直接：

- 理解当前项目
- 查找和读取文件
- 修改内容
- 运行工具和命令
- 检查错误和运行结果
- 验证任务结果

不需要一开始就决定是否启动 DSH Session。

## 交给 DSH 持续执行

较大、耗时或者需要多轮处理的任务，可以在 ChatGPT 明确目标后交给 DSH。

```text
ChatGPT
   │
   ├── 理解项目
   ├── 明确目标
   └── 交给 DSH
              │
              ▼
          DSH Session
              │
          持续执行
              │
              ▼
        ChatGPT Review
```

任务可以自然地在：

**ChatGPT 直接处理 → DSH 持续执行 → ChatGPT 检查并继续**

之间切换。

## 随时查看和接管

每次交给 DSH 的工作都会对应一个 DSH Session。

你可以随时在 DSH Web 中：

- 查看当前进度
- 追加新的要求
- 调整执行方向
- 直接参与当前工作
- 接管 Session

<img width="906" height="1078" alt="dsh-plugin-only" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

## 本地项目与 ChatGPT 之间会传递什么

项目文件、Git 状态、工具和命令都以你的本地环境为准。

ChatGPT 工作时，会收到完成当前任务所需要的信息，包括：

- 相关文件内容
- 错误和诊断信息
- 项目状态
- Git 信息
- 命令输出
- 完成当前任务需要的其他内容

## 安全边界

ChatGPT 直接执行的本地操作由 [**Agent Helm**](https://github.com/BeforeWave/agent-helm) 的权限和 Sandbox 边界控制。

交给 DSH 后，DSH Session 按 DSH 自身配置的权限和 Sandbox 模型执行。

## Work History

Work History 会把一次工作中的 ChatGPT Conversation、本地项目、直接操作和 DSH Session 关联起来。

你可以查看：

- 这项工作来自哪个 ChatGPT Conversation
- 使用的是哪个项目 / Worktree
- ChatGPT 已经完成了什么
- 是否把任务交给了 DSH
- 对应的 DSH Session
- 最近发生了什么

<img width="2164" height="1666" alt="dsh-history" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

这样，一项持续较久的工作可以随时重新找到、继续处理，也可以重新进入对应的 DSH Session。

## 相关项目

| 项目 | 用途 | 链接 |
| --- | --- | --- |
| **Agent Helm** | 让 ChatGPT 连接本地项目并完成工作 | [Agent Helm](https://github.com/BeforeWave/agent-helm) |
| **Agent Helm Extensions** | Chrome Extension 和其他 Agent Helm 使用界面 | [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) |

## 项目状态

DSH with ChatGPT 正在持续开发中。
