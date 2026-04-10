#!/usr/bin/env bash

# install.sh: Symlinks compy scripts into ~/bin/ and loads the launchd agent.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.borkweb.tc-handler"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "Installing compy scripts..."

# Symlink scripts to ~/bin/
for script in t tc tc-handler tmux-config-parser; do
    src="$SCRIPT_DIR/$script"
    dst="$HOME/bin/$script"

    if [[ -L "$dst" ]]; then
        echo "  Updating symlink: $dst"
        rm "$dst"
    elif [[ -f "$dst" ]]; then
        echo "  Backing up existing $dst to $dst.bak"
        mv "$dst" "$dst.bak"
    fi

    ln -s "$src" "$dst"
    chmod +x "$src"
    echo "  Linked: $dst -> $src"
done

# Create default config if it doesn't exist
CONFIG_DIR="$HOME/.bork-ai"
CONFIG_FILE="$CONFIG_DIR/tmux-config.yml"
if [[ ! -f "$CONFIG_FILE" ]]; then
    mkdir -p "$CONFIG_DIR"
    cp "$SCRIPT_DIR/../config/tmux-config.yml" "$CONFIG_FILE"
    echo "  Created default config: $CONFIG_FILE"
else
    echo "  Config already exists: $CONFIG_FILE"
fi

# Install and load the launchd agent
if launchctl list | grep -q "$PLIST_NAME" 2>/dev/null; then
    echo "  Unloading existing launchd agent..."
    launchctl bootout "gui/$(id -u)/$PLIST_NAME" 2>/dev/null || \
        launchctl unload "$PLIST_DST" 2>/dev/null || true
fi

cp "$PLIST_SRC" "$PLIST_DST"
launchctl load "$PLIST_DST"
echo "  Loaded launchd agent: $PLIST_NAME"

echo ""
echo "Done! Available commands:"
echo "  t            - tmux session picker (fzf)"
echo "  tc <project> - tmux + Claude Code launcher"
echo ""
echo "The tc-handler launchd agent is active and watching ~/bin/.tc-trigger"
echo "for Dispatch integration."
