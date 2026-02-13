defmodule PhoenixTauri.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      PhoenixTauriWeb.Telemetry,
      PhoenixTauri.Repo,
      {Ecto.Migrator,
       repos: Application.fetch_env!(:phoenix_tauri, :ecto_repos), skip: skip_migrations?()},
      {DNSCluster, query: Application.get_env(:phoenix_tauri, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: PhoenixTauri.PubSub},
      # Start a worker by calling: PhoenixTauri.Worker.start_link(arg)
      # {PhoenixTauri.Worker, arg},
      # Start to serve requests, typically the last entry
      PhoenixTauriWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: PhoenixTauri.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    PhoenixTauriWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp skip_migrations?() do
    false
  end
end
