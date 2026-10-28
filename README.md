<p align="right">
  <a href="./README.en.md">English</a> | <a href="./README.md"><b>中文</b></a>
</p>

<div align="center">

# DSH with ChatGPT

**告别复制粘贴与 DSH Token 焦虑！让网页版 ChatGPT 直连本地项目、自己动手 Coding，长任务交给 DSH 本地持续执行。**

**支持 macOS、Windows x64 和 Linux：** Windows 可通过 Agent Helm 原生执行本地命令，无需 WSL2；委派给 DSH 需要在本机安装 DSH。

[![npm](https://img.shields.io/npm/v/@beforewave/dsh-with-chatgpt?color=blue\&style=flat-square)](https://www.npmjs.com/package/@beforewave/dsh-with-chatgpt)
[![DSH](https://img.shields.io/badge/DeepSeek-Harness-blue?style=flat-square)](#-快速开始)
[![License](https://img.shields.io/github/license/BeforeWave/dsh-with-chatgpt?style=flat-square)](./LICENSE)

![macOS](https://img.shields.io/badge/macOS-supported-2ea44f?style=flat-square) ![Windows](https://img.shields.io/badge/Windows-supported-2ea44f?style=flat-square) ![Linux](https://img.shields.io/badge/Linux-supported-2ea44f?style=flat-square)

</div>

<br />
<p align="center">
 <sub>
  推荐
  <a href="https://github.com/BeforeWave/agent-helm-extensions"><b>Agent Helm Extensions</b></a> · ChatGPT + 本地 Agent
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://github.com/BeforeWave/agent-helm"><b>Agent Helm</b></a> · 本地运行时
</sub>
</p>
<p align="center">
  <img width="1000" alt="DSH with ChatGPT" src="https://github.com/user-attachments/assets/0446ad68-559a-43e0-b663-9f2a00699522" />
</p>

---

## 💡 为什么需要 DSH with ChatGPT？

网页版 ChatGPT 有很强的模型能力，但原本无法直接访问你的本地项目、文件和终端。

DSH 能真正操作工程，但大量 Token 往往消耗在读取项目、理解上下文、分析问题和反复确认上。

**DSH with ChatGPT** 把两者连接起来：

* **ChatGPT 直接动手 Coding：** 读取和修改本地文件、运行终端命令、检查 Diagnostics、Git、构建和测试结果。
* **减少 DSH Token 消耗：** 项目理解、问题分析、小型修改和结果 Review 可以直接由 ChatGPT 完成，把 DSH 的 Token 留给真正需要持续执行的任务。
* **复杂任务直接交给 DSH：** ChatGPT 把已经理解清楚的任务直接交给原生 DSH Session，无需让 DSH 再从头理解整个项目。
* **完成后继续 Review：** DSH 执行完成后，ChatGPT 可以重新检查真实代码、Diff 和测试结果。
* **原生 Session，随时接管：** ChatGPT 创建的任务就是正常的 DSH Session，可以直接在 DSH Web 中查看、继续操作或人工接管。

---

## ⚡ 快速开始

### 1. 安装 Plugin

**npm 稳定版：**

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt
```

> 指定版本：
> `dsh plugin --profile web add @beforewave/dsh-with-chatgpt@0.1.4`

**macOS / Linux：**

```bash
curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh
```

> 指定版本：
> `curl -fsSL https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.sh | sh -s -- 0.1.4`

**Windows x64：**

```powershell
irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1 | iex
```

> 指定版本：
> `& ([scriptblock]::Create((irm https://raw.githubusercontent.com/BeforeWave/dsh-with-chatgpt/main/install.ps1))) -Version 0.1.4`

GitHub 安装入口会先检查本机 DSH，下载并校验对应 Release 的 Plugin 包，再通过 `dsh plugin add` 完成安装。

---

### 2. 启动 DSH

```bash
dsh web
```

---

### 3. 完成配置

首次运行时，DSH with ChatGPT 会检查当前环境，并通过 **Setup Guide** 引导完成所需安装、ChatGPT Tunnel 和权限配置。

<p align="center">
  <img width="900" alt="DSH with ChatGPT Setup Guide" src="https://github.com/user-attachments/assets/d1d3c4d2-4e90-44e6-b3a6-232b69130f49" />
</p>

配置完成后，回到 `chatgpt.com` 就可以直接基于本地项目开始工作。

---

### 升级后刷新 ChatGPT Connector Tools

本次 **MCP Server Integration** 对应的 Agent Helm Core 修改了 MCP Tool Schema，将 `external_mcp_search_tools` 替换为 `external_mcp_list_tools`。**升级并重启 Core 后，必须在 ChatGPT 自定义 Connector 中执行 Refresh Tools。**

如果出现工具不存在、参数 Schema 或 Contract 不匹配，请先核对 Core 版本并刷新。详情见 [Agent Helm 升级说明](https://github.com/BeforeWave/agent-helm#refresh-chatgpt-connector-tools-after-upgrading)。刷新不会删除已导入的 Server 或撤销授权。

---

## 🛠️ 工作流与核心功能

### 1. ChatGPT 自己处理本地项目

通过 Agent Helm，ChatGPT 可以直接：

* 理解项目结构
* 查找和读取代码
* 修改本地文件
* 运行终端命令和工程工具
* 查看 Diagnostics 和 Git 状态
* 执行构建与测试
* 检查真实运行结果

小型修改、Bug 排查、代码理解和验证，可以直接由 ChatGPT 完成。

### 2. 重任务交给 DSH

任务需要大量修改、构建、测试或持续执行时，ChatGPT 可以直接创建原生 DSH Session。

```text
ChatGPT
   │
   ├── 理解项目
   ├── 分析问题
   ├── 直接修改与验证
   │
   └── 复杂任务 ──► DSH Session
                         │
                    Edit · Run · Test
                         │
                         ▼
                    ChatGPT Review
```

DSH 接到的是已经明确的任务和工作上下文，把更多 Token 留给真正的执行。

### 3. 原生 DSH Session，随时接管

通过 ChatGPT 创建的任务仍然是完整的 DSH Session。

你可以直接在 DSH Web 中：

* 查看 Agent 当前执行状态
* 查看执行活动和结果
* 继续与 DSH 交互
* 手动修改代码
* 随时接管 Session

ChatGPT 和 DSH 始终围绕同一项真实工作协作。

---

## 👀 在 DSH 中查看 ChatGPT 的工作

DSH with ChatGPT 会在 DSH 中增加一个轻量入口，用来查看 ChatGPT 当前关联的本地工作：

* ChatGPT Conversation
* 项目 / Worktree
* ChatGPT 的本地操作
* 当前工作状态
* 最近执行活动
* 关联的 DSH Session

<p align="center">
  <img width="700" alt="DSH with ChatGPT Work" src="https://github.com/user-attachments/assets/4340094b-7198-42f1-a3d6-b500a42bdf1f" />

</p>

这个入口用于查看和管理 ChatGPT 的本地工作，不改变原生 DSH Session 的使用方式。

---

## 📚 Work History

ChatGPT 和 DSH 的工作会保留在 Work History 中：

* 对应的 ChatGPT Conversation
* 项目 / Worktree
* ChatGPT 做过的本地操作
* DSH Session
* 当前或最终状态
* 最近执行活动

<p align="center">
  <img width="1000" alt="Work History" src="https://github.com/user-attachments/assets/6f8b7a88-99f0-4bdb-8abf-d9c0975c5f92" />
</p>

离开原来的 Conversation 后，也可以重新找到这项工作。

---

## 🔌 MCP Server Integration

DSH with ChatGPT 的 **MCP Servers** 管理入口可以复用 Codex 和 Claude 中已有的 MCP Server：

* 在 **Discover MCPs** 中手动 Scan 并 Import。
* 在 **My MCP Servers** 中启用或停用已导入的 Server。
* 按需配置环境变量、HTTP 凭据和认证，查看连接及扫描失败状态。

DSH 与 Chrome Extension 共用生产管理组件，使用 Agent Helm Core 的统一 MCP 状态。ChatGPT 通过 Agent Helm 使用已授权的上游工具，无需为每个 Server 单独创建 Connector。

---

## 🔒 本地项目与安全

项目和实际执行环境始终留在本地电脑上：

* **权限控制：** ChatGPT 可以访问哪些项目、执行哪些操作，由当前 Workspace 的授权和能力决定。
* **Sandbox：** ChatGPT 自己执行本地操作时受到 Agent Helm 的权限和 Sandbox 保护。
* **DSH 原生权限：** 任务交给 DSH 后，按照对应 DSH Session 自身的权限和 Sandbox 配置执行。

---

## 🔗 相关项目

| 项目                                                                           | 与本项目的关系                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Agent Helm](https://github.com/BeforeWave/agent-helm)                       | 本项目依赖的本地运行时，为 ChatGPT 提供代码理解、文件与命令操作、Sandbox 和 DSH Session 协作能力。    |
| [Agent Helm Extensions](https://github.com/BeforeWave/agent-helm-extensions) | Agent Helm 的 Chrome Extension，让 ChatGPT 从浏览器直接使用本地项目和 Coding Agent。 |

---

## 📌 项目状态

DSH with ChatGPT 正在持续开发与积极迭代中。欢迎提交 Issue 与 Pull Request！
