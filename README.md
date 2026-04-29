# bork-ai

A plugin library for Claude Code, Gemini, and Codex, providing specialized agents, skills, and commands for enhanced development workflows.

## Installation

### With Claude Code CLI

```bash
claude plugin marketplace add borkweb/bork-ai
```

Then install individual plugins:

```bash
claude plugin install bork
claude plugin install matt
claude plugin install team
```

### With Claude Code (Desktop App)

1. In Claude Code, click the + button in the Plugins panel
2. Select Browse plugins
3. Click the marketplace dropdown and select Add marketplace from GitHub
4. Enter `borkweb/bork-ai`
5. Click _Sync_

The plugins will appear in your marketplace and can be installed from there.

### Optional Claude Agent Teams

Some skills, such as `bork: council`, can use Claude Code Agent Teams for delegated multi-agent analysis when the runtime supports it. To enable Agent Teams, add this to `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Restart Claude Code after changing the setting. Skills that support Agent Teams should still work without this setting by running internally in a single assistant response.

### With Codex

Codex manifests live alongside each plugin package:

- `bork/.codex-plugin/plugin.json`
- `team/.codex-plugin/plugin.json`
- `matt/.codex-plugin/plugin.json`

This repo also includes a repo-owned Codex marketplace bundle at `.agents/bork-ai/`.

The Codex marketplace definition lives at `.agents/bork-ai/codex.marketplace.json` and is intended to be symlinked to `~/.agents/bork-ai/marketplace.json` so the marketplace definition and plugin wiring stay versioned in this repository.

Setup:

```bash
mkdir -p ~/.agents/bork-ai
ln -sfn /Users/matt/git/bork-ai/.agents/bork-ai/plugins ~/.agents/bork-ai/plugins
ln -sfn /Users/matt/git/bork-ai/.agents/bork-ai/codex.marketplace.json ~/.agents/bork-ai/marketplace.json
```

Then enable the plugins in `~/.codex/config.toml`:

```toml
[plugins."bork@bork-ai"]
enabled = true

[plugins."team@bork-ai"]
enabled = true

[plugins."matt@bork-ai"]
enabled = true
```

Restart Codex after updating the symlinks and config.

## Plugins

| Plugin | Description |
|--------|-------------|
| [**bork**](bork/) | General development tools — agents, skills, and commands for everyday workflows. |
| [**matt**](matt/) | Personal voice profile and writing style configuration. |
| [**team**](team/) | Development workflow skills — planning, review, QA, shipping, and retrospectives. |

## License

MIT
