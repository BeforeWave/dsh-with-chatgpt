# DSH ChatGPT Helm

> Use ChatGPT as the remote reasoning brain for DeepSeek Harness (DSH).

**DSH ChatGPT Helm** is a DSH plugin that connects ChatGPT seamlessly to your local codebase and native DeepSeek Harness execution sessions.

Instead of forcing your coding agent to repeatedly read the repository, rebuild context, and burn tokens on architectural reasoning, Helm offloads high-level planning to ChatGPT—leaving DSH focused strictly on high-speed execution.

```text
       ┌─────────────────────────────────────────┐
       │                ChatGPT                  │
       │  (Read project ➔ Architect ➔ Debug ➔ Plan)│
       └────────────────────┬────────────────────┘
                            │ OpenAI Secure MCP Tunnel
                            ▼
       ┌─────────────────────────────────────────┐
       │          DSH ChatGPT Helm               │
       └──────┬───────────────────────────┬──────┘
              │                           │
  Read-Only   │                           │ Native Execution
              ▼                           ▼
       ┌──────────────┐            ┌──────────────┐
       │   Serena     │            │ DeepSeek     │
       │ (Code Intel) │            │ Harness      │
       └──────────────┘            └──────┬───────┘
                                          │
                                          ▼
                                   [ Edit / Run / Test ]
```

---

## Key Benefits

* **ChatGPT for Deep Reasoning:** Let ChatGPT perform symbol inspection, architecture reviews, and issue diagnosis directly against your actual project code without manually copying context.
* **Save DSH Execution Tokens:** Avoid wasting agent context windows on code discovery. Hand over a fully drafted, step-by-step implementation plan directly to DSH.
* **Native DSH Sessions:** Every task initiated by ChatGPT creates a native DSH session. Take over at any point via DSH Web.
* **Independent Code Review:** Once DSH finishes, ChatGPT can inspect the modified workspace and perform an objective post-implementation verification.

---

## How It Works

DSH ChatGPT Helm manages the runtime bridge between ChatGPT, Serena for read-only code intelligence, and DeepSeek Harness for code execution. You do **not** need to manually start local services or configure the components separately.

---

## Prerequisites

Ensure the following tools are installed:

* **Node.js:** `v22.0.0+`
* **Core Tools:** `dsh`, `serena`, `tunnel-client`

Verify the setup:

```bash
node --version
dsh --version
serena --help
tunnel-client --version
```

### Install Serena If Missing

```bash
uv tool install -p 3.13 serena-agent
serena init
```

---

## Installation

Install the plugin into your DSH Web profile:

```bash
dsh plugin --profile web add @beforewave/dsh-chatgpt-helm
```

The Core package, `@beforewave/agent-chatgpt-helm`, is installed automatically.

---

## Tunnel Configuration

1. Create a Secure MCP Tunnel in the OpenAI Platform.
2. Create a Runtime API key with `Tunnels Read` and `Tunnels Use` permissions.
3. Export the credentials before starting DSH:

```bash
export CONTROL_PLANE_TUNNEL_ID="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CONTROL_PLANE_API_KEY="sk-..."
```

---

## ChatGPT Connection Setup

1. Open **ChatGPT** ➔ **Settings** ➔ **Connectors**.
2. Add a connector using **Tunnel**.
3. Select the tunnel matching `CONTROL_PLANE_TUNNEL_ID`.

---

## Usage

Start DSH Web normally:

```bash
dsh web
```

You can then use ChatGPT to inspect the project, design an implementation, delegate execution to DSH, and review the completed changes.

---

## Standalone Helm Service

`@beforewave/agent-chatgpt-helm` can also run independently as a shared Helm service for multiple local agents.

When used with DSH, `@beforewave/dsh-chatgpt-helm` starts and manages the Helm service automatically. If a standalone service is already running, the DSH plugin connects to it instead of starting another instance.

Project configuration can be placed in:

```text
.agent-chatgpt-helm/config.yml
```

DSH plugin configuration can override the Core configuration when Helm is managed by DSH. Existing Serena project configuration remains compatible.

---

## Troubleshooting

| Symptom | Solution |
| --- | --- |
| **Tunnel fails to start** | Verify `CONTROL_PLANE_TUNNEL_ID`, `CONTROL_PLANE_API_KEY`, and `tunnel-client --version`. |
| **ChatGPT cannot connect** | Ensure the ChatGPT connector uses the same tunnel ID configured locally. |

---

## License & Status

The npm packages are publicly available. Their source code repositories remain private for now and are planned to be open-sourced in the future.

Powered by [`@beforewave/agent-chatgpt-helm`](https://www.npmjs.com/package/@beforewave/agent-chatgpt-helm).
