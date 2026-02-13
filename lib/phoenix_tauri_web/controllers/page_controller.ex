defmodule PhoenixTauriWeb.PageController do
  use PhoenixTauriWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
