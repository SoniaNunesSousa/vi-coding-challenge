import { LitElement, html, css } from 'lit';
import { state, property } from 'lit/decorators.js';

interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
}

export class PokemonOverview extends LitElement {
  @property({ type: String }) headline = 'These are our products';
  @state() private pokemonList: Pokemon[] = [];
  @state() private allPokemonList: Pokemon[] = [];
  @state() private selectedTypes: Set<string> = new Set();
  @state() private availableTypes: string[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
    }

    h2 {
      text-align: center;
      margin-bottom: 16px;
    }

    .container {
      display: flex;
      width: 100%;
      height: calc(100vh - 100px);
      
    }

    .filter {
      width: 200px;
      padding: 10px;
      border-right: 1px solid #ccc;
      overflow-y: auto;
    }

    .filter label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .pokemon-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      padding: 10px;
      flex-grow: 1;
      overflow-y: auto;
      border-right: 1px solid #ccc;
      overflow-x: hidden;
    }

    .pokemon-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        border: 1px solid black; /* Borda ao redor da card */
        border-radius: 0; /* Remove arredondamento */
        padding: 10px;
        background-color: white;
        box-shadow: none; /* Remove sombra */
        width: 200px;
        height: 200px;
        position: relative;
        color: black;
    }

    .pokemon-card img {
    width: 135px;
    height: 135px;
    }

    .pokemon-name {
    font-size: 16px;
    font-weight: bold;
    white-space: normal;
    word-wrap: break-word;
    overflow: hidden;
    text-align: center;
    color: black;
    width: 100%;
    border-top: 1px solid black; /* Linha separando nome da imagem */
    padding-top: 5px;
    }

    .pokemon-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      margin-top: -8px;
    }

    .pokemon-name {
      font-size: 16px;
      font-weight: bold;
      white-space: normal;
      word-wrap: break-word;
      overflow: hidden;
      text-align: center;
      color: black;
    }

    .pokemon-types {
      display: flex;
      gap: 5px;
      justify-content: center;
    }

    .type-indicator {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      display: inline-block;
    }
    .divider {
        width: 80%;
        border: 0;
        height: 1px;
        background-color: black;
        margin: 5px 0;
    }
  `;

  constructor() {
    super();
  }

  async firstUpdated() {
    await this.fetchAvailableTypes();
    await this.fetchPokemonList('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0');
  }

  async fetchAvailableTypes() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/type/');
      const data = await response.json();
      this.availableTypes = data.results
        .map((type: { name: string }) => type.name)
        .sort((a: string, b: string) => a.localeCompare(b)); // Definir tipos explícitos
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  }

  async fetchPokemonList(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao carregar Pokémon');
      }
      const data = await response.json();

      const pokemonDetails = await Promise.all(
        data.results.map(async (pokemon: { name: string; url: string }) => {
          const res = await fetch(pokemon.url);
          const details = await res.json();
          return {
            id: details.id,
            name: details.name,
            image: details.sprites.front_default,
            types: details.types.map((t: any) => t.type.name),
          };
        })
      );

      this.allPokemonList = pokemonDetails;
      this.applyFilter();
    } catch (error) {
      console.error(error);
    }
  }

  updateFilter(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedTypes.add(target.value);
    } else {
      this.selectedTypes.delete(target.value);
    }
    this.applyFilter();
  }

  applyFilter() {
    //this.pokemonList = this.selectedTypes.size > 0
      //? this.allPokemonList.filter(pokemon => pokemon.types.some(type => this.selectedTypes.has(type)))
      //: this.allPokemonList;
    this.pokemonList = this.selectedTypes.size > 0
    ? this.allPokemonList.filter(pokemon =>
        [...this.selectedTypes].every(selectedType => pokemon.types.includes(selectedType))
    )
    : this.allPokemonList;
  }

  render() {
    return html`
      <h2>${this.headline}</h2>
      <div class="container">
        <div class="filter">
          <h3>Filter</h3>
          ${this.availableTypes.map(type => html`
            <label>
              <input type="checkbox" value="${type}" @change=${this.updateFilter}>
              ${type}
              <span class="type-indicator" style="background-color: ${this.getTypeColor(type)}"></span>
            </label>
          `)}
        </div>

        <div class="pokemon-container">
          ${this.pokemonList.map(
            pokemon => html`
              <a href="/pokemon/${pokemon.id}" @click=${this.navigateToPokemon} class="pokemon-card">
                <span class="pokemon-id">#${pokemon.id}</span>
                <img src="${pokemon.image}" alt="${pokemon.name}">
                <div class="pokemon-info">
                  <p class="pokemon-name">${pokemon.name}</p>
                  <span class="pokemon-types">
                    ${pokemon.types.map(
                      type => html`<span class="type-indicator" style="background-color: ${this.getTypeColor(type)}"></span>`
                    )}
                  </span>
                </div>
              </a>
            `
          )}
        </div>
      </div>
    `;
  }

  navigateToPokemon(event: Event) {
  event.preventDefault();
  const target = event.currentTarget as HTMLAnchorElement;
  window.history.pushState({}, '', target.href);
  window.dispatchEvent(new Event('popstate')); // Atualiza a rota
}
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      bug: 'olive', dark: 'black', dragon: 'darkblue', electric: 'yellow', fairy: 'lightpink',
      fighting: 'brown', fire: 'red', flying: 'skyblue', ghost: 'indigo', grass: 'green',
      ground: 'saddlebrown', ice: 'lightblue', normal: 'gray', poison: 'purple', psychic: 'pink',
      rock: 'darkgray', steel: 'silver', stellar: 'gold', unknown: 'dimgray', water: 'blue'
    };
    return colors[type];
  }
}

customElements.define('pokemon-overview', PokemonOverview);
