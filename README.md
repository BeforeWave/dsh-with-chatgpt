<p align="right">
  <a href="./README.en.md">English</a> | <a href="./README.md"><b>中文</b></a>
</p>

# DSH with ChatGPT

> **让浏览器里的 ChatGPT 直接使用你的本地项目，也能在需要时把任务交给 DSH。**

**DSH with ChatGPT** 是一个 DeepSeek Harness（DSH）Plugin。

你还是在浏览器里的 ChatGPT 里工作。

区别是，现在它可以直接理解真实项目、修改文件、运行命令、检查结果，而不需要你反复复制代码、报错和项目上下文。

在 DSH 里，你也会得到一个轻量入口，用来查看 ChatGPT 当前关联的项目、做过的本地操作和工作记录。

当任务更适合交给 Coding Agent 持续执行时，ChatGPT 可以直接创建原生 DSH Session 继续完成。

<img width="2164" height="1666" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/48103763-2897-4df3-94a9-af36df672448" />

## 快速开始

npm 稳定版：

\`\`\`bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt
\`\`\`

指定 npm 版本：

\`\`\`bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt@0.1.4
\`\`\`

GitHub 版本，macOS / Linux：

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh
\`\`\`

指定版本：

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh -s -- 0.1.4
\`\`\`

Windows x64：

\`\`\`powershell
irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1 | iex
\`\`\`

指定版本：

\`\`\`powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1))) -Version 0.1.4
\`\`\`

GitHub 安装入口会先检查 \`dsh\`。如果没有安装 DSH，会直接退出；如果已经存在，则下载并校验指定 GitHub Release 的 tgz，再通过 \`dsh plugin add\` 安装。GitHub 安装入口不会切换到 npm。

启动 DSH：

\`\`\`bash
dsh web
\`\`\`

首次运行时，DSH with ChatGPT 会检查当前环境，并通过 **Setup Guide** 引导你完成需要的安装、连接和授权。

<img width="2164" height="1666" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/a15c4cfe-c27a-4450-8ba3-5f03e2c3ea6d" />

配置完成后，回到浏览器里的 ChatGPT，就可以直接基于本地项目开始工作。

## 直接让 ChatGPT 使用本地项目

通过 Agent Helm，浏览器里的 ChatGPT 可以直接基于你电脑上的真实项目工作，包括：

* 理解项目结构和相关内容
* 查找和读取文件
* 修改文件
* 运行命令和工程工具
* 查看 Diagnostics 和 Git 状态
* 检查构建、测试和实际执行结果

不需要为了让 ChatGPT 理解问题，反复把代码、报错和项目上下文复制到对话里。

对于明确的任务，ChatGPT 可以直接完成；需要更长时间或者更多轮执行时，再交给 DSH。

## 需要时交给 DSH

当任务需要大量修改、构建、测试或者持续执行时，ChatGPT 可以在已经理解项目和任务的基础上，直接创建原生 DSH Session。

DSH 继续完成后续执行，不需要你重新整理背景和任务要求。

ChatGPT 之后仍然可以重新检查真实项目中的代码、Diff、测试结果和其他执行结果，再决定下一步。

简单来说：

```text
浏览器里的 ChatGPT
        │
     理解项目
        │
   ┌────┴────┐
   │         │
直接完成    交给 DSH
             │
        DSH Session
             │
          持续执行
```

## 在 DSH 里查看 ChatGPT 的本地工作

DSH with ChatGPT 会在 DSH 里增加一个轻量入口，用来查看 ChatGPT 在本地做过的工作。

你可以看到：

* 当前关联的 ChatGPT Conversation
* 使用的项目 / Worktree
* ChatGPT 做过的本地操作
* 当前工作的状态和最近活动
* 是否关联了 DSH Session
* 对应的 DSH Session 信息

<img width="906" height="1078" alt="DSH with ChatGPT Work" src="https://github.com/user-attachments/assets/44db8e14-202e-4fca-bdfb-bf6ef4c5dbc1" />

这个入口主要用于查看和管理 ChatGPT 的本地工作记录，不会改变原生 DSH Session 的使用方式。

## Work History

ChatGPT 在本地做过的工作会保留在 Work History 中。

你可以之后重新找到：

* 对应的 ChatGPT Conversation
* 使用的项目和 Worktree
* ChatGPT 做过什么
* 当前或最终状态
* 是否交给过 DSH
* 关联的 DSH Session

<img width="2164" height="1666" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />

这样，即使已经离开原来的 Conversation，也可以知道之前这项工作在本地发生了什么。

## 本地项目与安全

项目和实际执行环境仍然在你的电脑上。

ChatGPT 会根据当前任务获得必要的本地信息，包括相关文件、项目结构、Diagnostics、Git 状态、命令输出和测试结果。

实际能够访问和执行什么，由当前授权的 Workspace、能力和权限决定。

ChatGPT 直接执行本地操作时，由 Agent Helm 提供本地能力和 Sandbox 边界；任务由 DSH 执行时，则使用对应 DSH Session 自身的权限和 Sandbox 配置。

## 相关项目

| 项目                                                                           | 用途                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | 让浏览器里的 ChatGPT 直接使用本地项目，并在需要时调用本地 Coding Agent |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | 从浏览器安装和管理 Agent Helm，并查看当前 ChatGPT 对应的本地工作     |

## 项目状态

DSH with ChatGPT 正在持续开发中。
