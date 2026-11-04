import os
import urllib.error
import urllib.request

import click

from jejune_cli.app_context import AppContext
from jejune_cli.plugin_description import PluginDescription

from .component_cont_kg_viewer import CompKgViewer
from .click_cont_comp_kg_viewer import view

_DEFAULT_PORT = "8080"
_CONFIG_VAR = "KG_PORT"


def _check_availability(component: CompKgViewer) -> tuple[bool, str]:
    if not component.is_running()[0]:
        return False, "container not running"
    port = os.environ.get(_CONFIG_VAR, _DEFAULT_PORT)
    url = f"http://localhost:{port}/"
    try:
        urllib.request.urlopen(url, timeout=2)
        return True, f"responding on :{port}"
    except urllib.error.URLError as exc:
        return False, str(exc.reason)
    except Exception as exc:
        return False, str(exc)


def _registered_component(ctx: click.Context) -> CompKgViewer:
    return ctx.find_object(AppContext).component_registry.get("kg-viewer")


@click.group("kg-viewer")
def kg_viewer_group():
    """Commands for the jejune kg-graph-viewer UI component."""


kg_viewer_group.add_command(view)


@kg_viewer_group.command("status-availability")
@click.pass_context
def status_availability(ctx):
    """Show kg-viewer availability status (mirrors the doctor Status column)."""
    ok, _ = _check_availability(_registered_component(ctx))
    if ok:
        click.echo(f"kg-viewer: {click.style('ok', fg='green')}")
    else:
        click.echo(f"kg-viewer: {click.style('error', fg='red')}")


@kg_viewer_group.command("hint-availability")
@click.pass_context
def hint_availability(ctx):
    """Show how to start the kg-graph-viewer container."""
    ok, _ = _check_availability(_registered_component(ctx))
    if ok:
        click.echo(click.style("kg-viewer is reachable", fg="green"))
    else:
        click.echo("run `docker compose --env-file deployment.env up -d`")


plugin = PluginDescription(
    name="kg-viewer",
    group=kg_viewer_group,
    config_vars=[_CONFIG_VAR],
    config_hint=f"Set {_CONFIG_VAR} to the port exposed by the kg-graph-viewer container (default {_DEFAULT_PORT}).",
    avail_hint="",
    check_availability=_check_availability,
    target_role="deployer",
    component_factory=CompKgViewer,
    repo_name="jejune_kg-graph_viewer",
)
