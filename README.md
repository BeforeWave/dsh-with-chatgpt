# DSH ChatGPT Helm

> Use ChatGPT as the remote reasoning brain for DeepSeek Harness (DSH).

**DSH ChatGPT Helm** is a DSH plugin that connects ChatGPT seamlessly to your local codebase and native DeepSeek Harness execution sessions.

Instead of forcing your coding agent to repeatedly read the repository, rebuild context, and burn tokens on architectural reasoning, Helm Offloads high-level planning to ChatGPT—leaving DSH focused strictly on high-speed execution.

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

DSH ChatGPT Helm manages the runtime bridge between ChatGPT, Serena (for read-only code intelligence), and DeepSeek Harness (for code execution). You do **not** need to manually spin up local servers, handle authentication proxies, or configure local tunnels.

---

## Prerequisites

Ensure the following tools are installed in your environment:

* **Node.js:** `v22.0.0+`
* **Package Manager:** `pnpm`
* **Core Tools:** `dsh`, `serena`, `tunnel-client`

Verify setup:

```bash
node --version
pnpm --version
dsh --version
serena --help
tunnel-client --version

```

### Quick Tool Setup (If missing)

```bash
# Install pnpm
npm install -g pnpm

# Install Serena
uv tool install -p 3.13 serena-agent
serena init

```

---

## Installation

Install the plugin directly into your DSH Web profile:

```bash
dsh plugin --profile web add @beforewave/dsh-chatgpt-helm

```

*(The underlying core runtime `@beforewave/agent-chatgpt-helm` will be resolved and installed automatically).*

---

## Tunnel Configuration

1. **Create Tunnel:** Set up a Secure MCP Tunnel in the **OpenAI Platform** under the target ChatGPT workspace.
2. **Generate Key:** Create a Runtime API Key with `Tunnels Read` and `Tunnels Use` permissions.
3. **Set Environment Variables:** Export credentials prior to launching DSH:

```bash
export CONTROL_PLANE_TUNNEL_ID="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export CONTROL_PLANE_API_KEY="sk-..."

```

---

## ChatGPT Connection Setup

1. Open **ChatGPT** ➔ **Settings** ➔ **Connectors**.
2. Add a new connector using **Tunnel**.
3. Select the tunnel matching your `CONTROL_PLANE_TUNNEL_ID`.

---

## Usage Workflow

1. Start DSH Web normally:
```bash
dsh web

```


2. Interact with ChatGPT using high-level intent prompts:

* **Phase 1: Analysis**
> *"Inspect this repository and explain the project architecture. Do not edit files yet."*


* **Phase 2: Planning & Handoff**
> *"Design the solution for parallel execution stages. Once the plan is solid, have DSH implement it and run test suites."*


* **Phase 3: Verification**
> *"Inspect the diff and verify if the implementation satisfies all original requirements."*



---

## Troubleshooting

| Symptom | Cause / Check | Solution |
| --- | --- | --- |
| **Tunnel Fails to Start** | Missing credentials or missing `tunnel-client` | Verify `echo $CONTROL_PLANE_TUNNEL_ID` and ensure `tunnel-client --version` works. |
| **ChatGPT Cannot Connect** | Tunnel ID mismatch | Ensure ChatGPT Connector uses the exact ID defined in `CONTROL_PLANE_TUNNEL_ID`. Check Admin logs in console output. |

---

## License & Status

**Open Source Coming Soon.**

Core components and source files are being prepped for public release. Powered by [`@beforewave/agent-chatgpt-helm`](https://www.npmjs.com/package/@beforewave/agent-chatgpt-helm).

