defmodule PhoenixTauriWeb.HomeLive do
  use PhoenixTauriWeb, :live_view

  alias PhoenixTauri.Counter

  def mount(_params, _session, socket) do
    counter = Counter.get_or_create("default")
    {:ok, assign(socket, :count, counter.value)}
  end

  def handle_event("increment", _params, socket) do
    counter = Counter.increment("default")
    {:noreply, assign(socket, :count, counter.value)}
  end

  def handle_event("decrement", _params, socket) do
    counter = Counter.decrement("default")
    {:noreply, assign(socket, :count, counter.value)}
  end

  def render(assigns) do
    ~H"""
    <div class="relative min-h-screen overflow-hidden bg-base-300">
      <%!-- Background gradient layers --%>
      <div class="absolute inset-0 bg-gradient-to-b from-base-300 via-base-300/90 to-base-200" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)/8%,_transparent_70%)]" />

      <%!-- Globe --%>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div class="relative w-[500px] h-[500px] sm:w-[900px] sm:h-[900px] md:w-[1100px] md:h-[1100px] lg:w-[1300px] lg:h-[1300px] xl:w-[1500px] xl:h-[1500px] mx-auto">
          <canvas
            id="globe-canvas"
            phx-hook="Globe"
            phx-update="ignore"
            class="w-full h-full opacity-40"
            style="contain: layout paint size"
          />
          <%!-- Layered glow effects --%>
          <div class="absolute inset-0 -z-10 bg-primary/20 blur-[120px] rounded-full scale-75" />
          <div class="absolute inset-0 -z-20 bg-accent/10 blur-[150px] rounded-full scale-90" />
        </div>
      </div>

      <%!-- Content overlay --%>
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 class="text-5xl sm:text-7xl font-bold tracking-tight text-base-content">
          Phoenix <span class="text-primary">Tauri</span>
        </h1>
        <p class="mt-4 text-lg sm:text-xl text-base-content/60 max-w-xl">
          A desktop application powered by Phoenix LiveView and Tauri
        </p>
        <div class="mt-8 flex gap-4">
          <a
            href="https://mrpopov.com/posts/elixir-liveview-single-binary/"
            class="btn btn-primary btn-lg"
            target="_blank"
          >
            Article
          </a>
          <a
            href="https://github.com/lalabuy948/phoenix_tauri"
            class="btn btn-ghost btn-lg"
            target="_blank"
          >
            GitHub
          </a>
        </div>

      </div>

      <%!-- Counter (persisted in SQLite3) --%>
      <div class="absolute bottom-12 left-0 right-0 z-10 flex flex-col items-center">
        <div class="flex items-center gap-6">
          <button phx-click="decrement" class="btn btn-circle btn-outline btn-lg text-2xl">
            -
          </button>
          <span class="text-6xl font-mono font-bold tabular-nums text-base-content min-w-[4ch] text-center">
            {@count}
          </span>
          <button phx-click="increment" class="btn btn-circle btn-outline btn-lg text-2xl">
            +
          </button>
        </div>
        <p class="mt-3 text-sm text-base-content/40">persisted in SQLite3</p>
      </div>

      <%!-- Bottom fade --%>
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-base-300 to-transparent pointer-events-none" />
    </div>
    """
  end
end
