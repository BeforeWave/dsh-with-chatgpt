<p align="right">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

# DSH with ChatGPT

> **把 ChatGPT 的推理能力带进你的本地代码库：小任务ChatGPT直接做，大任务交给 DSH。**

**DSH with ChatGPT** 把 ChatGPT 连接到你的真实本地代码库和 DeepSeek Harness 原生执行 Session。

ChatGPT 不再只能依赖你复制进去的代码片段，而是可以直接读取项目、理解代码结构、追踪符号和引用、诊断问题，并基于真实工程上下文进行推理。

对于明确而集中的修改，ChatGPT 可以直接完成；对于更大、更偏执行的任务，可以先由 ChatGPT 理清问题和方案，再交给 DSH 持续执行，完成后由 ChatGPT 独立 Review。

```text
                         ChatGPT
                   理解 · 推理 · Review
                            │
                  Secure MCP Tunnel
                            │
                            ▼
                        Agent Helm
                            │
                       本地代码库
                      /          \
                     /            \
               直接处理          委派
                                   │
                                   ▼
                                  DSH
                            编辑 · 运行 · 测试
                                   │
                                   ▼
                            ChatGPT Review
```

---

## 为什么需要 DSH with ChatGPT

### 让 ChatGPT 真正读懂项目

ChatGPT 可以直接读取真实 Repository、代码结构、Symbols、References 和 Diagnostics，不再需要手工复制大量代码和错误信息到对话里。

### 合适的小任务直接做

对于范围明确的修改，ChatGPT 可以自己完成代码检查、修改和验证，没有必要为了几处改动额外启动一个 Coding Agent。

### 大任务交给 DSH 执行

对于需要大量编辑、构建、测试和反复迭代的任务，ChatGPT 可以先把问题和工程上下文理解清楚，再把执行工作交给原生 DSH Session。

### 完成后独立 Review

DSH 完成任务后，ChatGPT 可以重新读取实际代码和 Diff，独立检查实现是否完整、是否存在回归、边界遗漏或测试缺失。

---

## 工作方式

小任务可以直接完成：

```text
ChatGPT
   ↓
Agent Helm
   ↓
读取 · 推理 · 修改 · 验证
```

较大的任务：

```text
ChatGPT
   ↓
读取代码 · 理解架构 · 制定方案
   ↓
交给 DSH
   ↓
原生 DSH Session
   ↓
编辑 · 运行 · 测试 · 迭代
   ↓
ChatGPT Review
```

这里并不是要把 ChatGPT 强行变成另一个终端 Coding Agent。

更重要的是让 ChatGPT 的推理真正建立在本地工程事实上：适合直接完成的事情自己完成，需要长时间机械执行的事情再交给 DSH。

---

## 依赖

DSH with ChatGPT 当前依赖：

* **Node.js 22+**
* **DeepSeek Harness (`dsh`)**
* **Serena**
* **OpenAI `tunnel-client`**

开始使用前不需要自己逐个安装和配置这些组件。

**DSH with ChatGPT 会检查本地环境，在缺少依赖时引导完成配置，并在支持的场景提供一键安装。**

如果你希望了解底层组件如何手工安装和配置，可以参考：

* [配置参考](https://gist.github.com/tonyzhu/933704e4fba6cb4938ebfa3b16683b4a)

---

## 安装

安装到 DSH Web Profile：

```bash
dsh plugin --profile web add @beforewave/dsh-with-chatgpt
```

底层的 `@beforewave/agent-helm` 会自动安装。

正常启动 DSH：

```bash
dsh web
```

DSH with ChatGPT 会检查本地运行环境，并引导完成剩余配置。

---

## 连接 ChatGPT

DSH with ChatGPT 使用 **OpenAI Secure MCP Tunnel** 将 ChatGPT 安全连接到本机的 Agent Helm。

```text
ChatGPT
   ↓
OpenAI Secure MCP Tunnel
   ↓
tunnel-client
   ↓
Agent Helm
   ↓
本地代码库 / DSH
```

需要准备：

* 一个 OpenAI Secure MCP Tunnel；
* 一个 Runtime API Key，并授予：

  * `Tunnels Read`
  * `Tunnels Use`

向本地 Runtime 提供：

```bash
export CONTROL_PLANE_TUNNEL_ID="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CONTROL_PLANE_API_KEY="sk-..."
```

然后在 ChatGPT 中：

1. 开启 **Developer Mode**；
2. 在 **Settings** 中添加自定义 App / Connector；
3. 连接类型选择 **Tunnel**；
4. 选择与本地配置相同的 Secure MCP Tunnel。

连接完成后，ChatGPT 就可以使用 Agent Helm 暴露的本地能力。

需要完整的手工配置过程时，可以参考 [中文配置参考](https://gist.github.com/tonyzhu/933704e4fba6cb4938ebfa3b16683b4a)。

---

## 使用

直接在运行 DSH 的项目上和 ChatGPT 对话即可。

例如排查问题：

```text
看看为什么这个 authentication flow 偶尔会 refresh 两次。

先读取真实实现，追一下相关调用和代码路径，
告诉我根因，然后直接修掉并验证。
```

对于更大的任务：

```text
先读取现在的实现，搞清楚这个功能应该怎么加。

理解涉及的架构和修改范围后，把实现交给 DSH，
完成后你再独立 review 一遍。
```

也可以直接让 ChatGPT Review DSH 的结果：

```text
Review 一下 DSH 刚做完的修改。

自己重新读取实际代码和 diff，
检查正确性、遗漏的边界情况、潜在回归和测试缺失。
```

并不是所有任务都必须经过 DSH。

简单、明确的事情 ChatGPT 可以直接完成；需要大量持续执行的事情，再交给 DSH。

---

## 原生 DSH Session

从 ChatGPT 委派出去的任务会创建真实的 DeepSeek Harness Session。

你随时可以在 DSH Web 中：

* 查看执行进度；
* 查看 Agent 正在做什么；
* 自己继续 Session；
* 必要时直接接手；
* 保留完整的 DSH 原生工作流和 Session 历史。

DSH 不是一个隐藏在后台的执行器，而仍然是可以随时进入和接管的完整 Coding Agent 环境。

---

## Agent Helm

[`@beforewave/agent-helm`](https://www.npmjs.com/package/@beforewave/agent-helm) 是 DSH with ChatGPT 背后的本地能力层。

它负责把本地工程能力提供给 ChatGPT，包括：

* Repository 和文件读取；
* 代码搜索；
* Symbol / Reference 导航；
* Diagnostics；
* 精确代码修改；
* 受控的本地命令执行；
* 本地 Coding Agent 集成。

目前 Agent Helm 主要使用 Serena 提供代码智能能力。

Agent Helm 也可以脱离 DSH with ChatGPT 独立运行，作为共享的本地能力层。通过 DSH with ChatGPT 使用时，插件会自动管理 Agent Helm。

---

## Packages

### `@beforewave/dsh-with-chatgpt`

面向 DSH 用户的集成和产品体验。

### `@beforewave/agent-helm`

底层本地能力层，负责连接 ChatGPT、代码智能、本地执行和 Coding Agent。

---

## 当前状态

DSH with ChatGPT 和 Agent Helm 都在持续开发中。

目前最核心的目标很简单：

> **让 ChatGPT 真正理解你的本地项目；合适的事情直接做，更大的执行任务则把已经建立好的理解和推理带给 DSH。**
