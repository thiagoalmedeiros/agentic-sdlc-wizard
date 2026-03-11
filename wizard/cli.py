"""Wizard CLI entry point."""

import sys

from wizard.commands.install import install_command
from wizard.commands.install_agents import install_agents_command
from wizard.commands.install_all import install_all_command
from wizard.commands.install_mcps import install_mcps_command
from wizard.commands.install_prompts import install_prompts_command


def main():
    """Main CLI entry point."""
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print_help()
        return

    if args[0] == "--version":
        print("1.0.0")
        return

    if args[0] == "install":
        sub = args[1] if len(args) > 1 else None
        if sub is None:
            install_command()
        elif sub == "agents":
            install_agents_command()
        elif sub == "prompts":
            install_prompts_command()
        elif sub == "mcps":
            install_mcps_command()
        elif sub == "all":
            install_all_command()
        elif sub in ("-h", "--help"):
            print_install_help()
        else:
            print(f"Unknown subcommand: {sub}")
            print_install_help()
            sys.exit(1)
    else:
        print(f"Unknown command: {args[0]}")
        print_help()
        sys.exit(1)


def print_help():
    """Print main help message."""
    print(
        "Usage: wizard [command]\n"
        "\n"
        "Agentic SDLC Wizard - Install and configure AI agents, prompts, and MCP servers\n"
        "\n"
        "Commands:\n"
        "  install          Initialize wizard configuration or install components\n"
        "\n"
        "Options:\n"
        "  --version        Show version number\n"
        "  -h, --help       Show this help message"
    )


def print_install_help():
    """Print install subcommand help."""
    print(
        "Usage: wizard install [subcommand]\n"
        "\n"
        "Initialize wizard configuration or install components\n"
        "\n"
        "Subcommands:\n"
        "  agents           Install AI agent definitions for your IDE\n"
        "  prompts          Install prompt templates for your IDE\n"
        "  mcps             Install and configure MCP servers for your IDE\n"
        "  all              Install all agents, prompts, and MCP servers at once\n"
        "\n"
        "Options:\n"
        "  -h, --help       Show this help message"
    )


if __name__ == "__main__":
    main()
