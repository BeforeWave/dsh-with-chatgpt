<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><b>中文</b></a>
</p>

# DSH with ChatGPT

> **把 ChatGPT 的推理能力带进本地代码库：小任务直接修复，大任务交给 DSH。**

**DSH with ChatGPT** 将 ChatGPT 深度接入你的本地代码库与 DeepSeek Harness (DSH) 原生执行 Session。

ChatGPT 不再局限于被动接收复制粘贴的代码片段，而是能够直接读取工程结构、追踪符号与引用、分析诊断信息，基于真实工程上下文进行深入推理。

对于明确而集中的修改，ChatGPT 可直接完成；对于范围较大、需要反复构建测试的任务，由 ChatGPT 梳理方案后交由 DSH 原生 Session 持续执行，并在完成后进行独立 Code Review。

```text
                         ChatGPT
                   理解 · 推理 · Review
                            │
                  Secure MCP Tunnel
                            │
                            ▼
                        Agent Helm
                       /          \
                      /            \
                 直接处理           委派
                   │                │
                   ▼                ▼
                本地代码库           DSH
                   ▲          编辑 · 运行 · 测试
                   │          (随时可人工接管)
                   └────────────────┘

```

---

## 核心特性

* **真实代码库感知**：直接读取本地仓库结构、符号引用与诊断信息，无需手动复制粘贴代码与报错。
* **轻量任务直接处理**：对局部修改与针对性重构，ChatGPT 自动完成代码检查、编辑与验证，免去启动完整 Agent 的开销。
* **复杂任务委派与随时接管**：涉及多文件编辑与构建测试的任务，由 ChatGPT 理清方案后自动委派给 DSH 原生 Session 持续执行——**且你可以在任意时刻随时切入并直接接管控制**。
* **独立 Code Review**：DSH 完成任务后，ChatGPT 独立校验真实代码与 Git Diff，检查边界遗漏、潜在回归或测试缺失。

---

### 以dsh-plugin的形态作为UI

<img width="1080" height="852" alt="bae78bd73882abe6a2a4ae70d171367f" src="https://github.com/user-attachments/assets/dc6b91fa-c4c0-49ec-aabe-8ce3ea92b0db" />
<img width="886" height="696" alt="19459a7e4525e912d4a70cd508b8d829" src="https://github.com/user-attachments/assets/b640327b-9cb4-4031-b076-c2d077b300f5" />
<img width="855" height="661" alt="c2922a065866fb172d380505069f2e2a" src="https://github.com/user-attachments/assets/2d34142f-df90-4cf0-9ec1-b3779baced0b" />


---
## 工作机制

**聚焦型轻量任务：**

```text
ChatGPT ──► Agent Helm ──► 读取 · 推理 · 修改 · 验证

```

**复杂型持续任务：**

```text
ChatGPT ──► 读取分析 · 制定方案 ──► 委派给 DSH ──► DSH 原生 Session ──► ChatGPT Review
                                                        ▲
                                                  (随时可人工接管)

```

---

## 依赖说明

本项目运行依赖以下底层组件：

* **Node.js**：v22+
* **DeepSeek Harness**：(`dsh`)
* **Serena**：代码智能分析引擎
* **OpenAI Tunnel Client**：`tunnel-client`

> **提示**：无需预先手动安装和配置上述组件。插件在启动时会自动检查本地环境，引导补全依赖，并在支持的环境下提供一键安装。如需手动配置，请参考 [中文配置指南](https://gist.github.com/tonyzhu/d7ad8c84a90ea04e5c853a3cfe4df099#file-readme-zh-cn-md)。

---

## 安装说明

安装插件至 DSH Web Profile：

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt

```

*底层组件 `@beforewave/agent-helm` 会随插件自动安装。*

启动 DSH：

```bash
dsh web

```

启动后插件将自动检查运行环境，并引导完成初始配置。

---

## 连接 ChatGPT

插件通过 **OpenAI Secure MCP Tunnel** 将 ChatGPT 安全连接至本机运行的 `Agent Helm`。

```text
ChatGPT ──► Secure MCP Tunnel ──► tunnel-client ──► Agent Helm ──► 本地代码库 / DSH

```

### 配置步骤

1. 准备 OpenAI Secure MCP Tunnel 信息：
* **Tunnel ID**
* **Runtime API Key**（需具备 `Tunnels Read` 与 `Tunnels Use` 权限）


2. 配置环境变量：
```bash
export CONTROL_PLANE_TUNNEL_ID="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CONTROL_PLANE_API_KEY="sk-..."

```


3. 配置 ChatGPT：
* 在 ChatGPT 中开启 **Developer Mode**（开发者模式）。
* 进入 **Settings** -> **Apps / Connectors** -> **Add Custom Connector**。
* 连接类型选择 **Tunnel**。
* 选择与环境变量对应的 Secure MCP Tunnel 实例。



---

## 使用示例

### 1. 问题排查与局部修复

```text
看看为什么这个 authentication flow 偶尔会 refresh 两次。
先读取真实实现，追一下相关代码路径与调用关系，
告知我根因，然后直接修掉并完成验证。

```

### 2. 委派大任务给 DSH

```text
先读取当前实现，搞清楚这个新功能应该怎么加。
理解涉及的架构与修改范围后，把实现工作委派给 DSH，
完成后你再独立 Review 一遍。

```

### 3. 独立 Review DSH 结果

```text
Review 一下 DSH 刚做完的修改。
重新读取实际代码与 Diff，
检查正确性、边界情况遗漏、潜在回归与测试缺失。

```

---

## 原生 DSH Session 集成：完全掌控，随时无缝接管

将任务委派给 DSH 并不意味着丢失控制权。每个委派任务都会创建一个**完整的原生 DeepSeek Harness Session**。

> **⚡ 随时无缝接管：** DSH 不是隐藏在后台的“黑盒执行器”。你可以在任意时刻打开 DSH Web UI，实时查看执行进度、手动修改代码、调整 Agent 路线，或者直接完全接管整个 Session，无缝保留所有上下文与历史记录。

通过 DSH Web UI，你可以：

* **实时监控与方向纠偏**：观测 Agent 的执行日志与变动，必要时随时打断或重定向。
* **随时人工接管**：在任意节点一键切入交互式环境，由人工直接完成剩余工作。
* **保留完整工作流上下文**：保留真实的 DSH Session 状态、历史日志与工作区代码改动。

---

## 底层架构：Agent Helm

[`@beforewave/agent-helm`](https://www.npmjs.com/package/@beforewave/agent-helm) 是插件背后的本地能力引擎，为 ChatGPT 提供以下工具调用：

* 本地仓库与文件读写
* 符号（Symbol）与引用（Reference）导航
* 代码智能与诊断分析（由 **Serena** 驱动）
* 受控的代码修改与命令执行
* 本地 Coding Agent 调度与 Session 委派

*Agent Helm 可脱离本插件独立运行，作为共享的本地能力层使用。*

---

## 包结构说明

| 包名 | 职责描述 |
| --- | --- |
| **`@beforewave/dsh-with-chatgpt`** | DSH 插件集成与用户交互体验层 |
| **`@beforewave/agent-helm`** | 本地底层能力引擎（代码导航、命令执行与 Agent 桥接） |

---

## 项目状态

DSH with ChatGPT 与 Agent Helm 均处于积极迭代开发中。


> **让 ChatGPT 真正理解你的本地项目；合适的事情直接做，更大的执行任务则把已经建立好的理解和推理带给 DSH。**
