"""Install command - IDE selection."""

from InquirerPy import inquirer

from wizard.config import IDE_ANTIGRAVITY, IDE_VSCODE, write_config


def install_command(cwd: str | None = None) -> None:
    """Run the install command to select IDEs."""
    import os

    cwd = cwd or os.getcwd()

    ides = inquirer.checkbox(
        message="Select the IDEs you need support for:",
        choices=[
            {"name": "VS Code", "value": IDE_VSCODE},
            {"name": "Antigravity", "value": IDE_ANTIGRAVITY},
        ],
    ).execute()

    if not ides:
        print("No IDEs selected. Aborting.")
        return

    config = {"ides": ides}
    write_config(cwd, config)

    print(f"\nConfiguration saved. Selected IDEs: {', '.join(ides)}")
    print("\nNext steps:")
    print("  wizard install agents   - Install AI agent definitions")
    print("  wizard install prompts  - Install prompt templates")
    print("  wizard install mcps     - Install MCP servers")
