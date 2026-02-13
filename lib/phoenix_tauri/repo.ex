defmodule PhoenixTauri.Repo do
  use Ecto.Repo,
    otp_app: :phoenix_tauri,
    adapter: Ecto.Adapters.SQLite3
end
