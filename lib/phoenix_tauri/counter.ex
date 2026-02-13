defmodule PhoenixTauri.Counter do
  use Ecto.Schema
  import Ecto.Changeset

  alias PhoenixTauri.Repo

  schema "counters" do
    field :name, :string
    field :value, :integer, default: 0

    timestamps()
  end

  def changeset(counter, attrs) do
    counter
    |> cast(attrs, [:name, :value])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end

  def get_or_create(name) do
    case Repo.get_by(__MODULE__, name: name) do
      nil ->
        %__MODULE__{}
        |> changeset(%{name: name, value: 0})
        |> Repo.insert!()

      counter ->
        counter
    end
  end

  def increment(name) do
    counter = get_or_create(name)

    counter
    |> changeset(%{value: counter.value + 1})
    |> Repo.update!()
  end

  def decrement(name) do
    counter = get_or_create(name)

    counter
    |> changeset(%{value: counter.value - 1})
    |> Repo.update!()
  end
end
