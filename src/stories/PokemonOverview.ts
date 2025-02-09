import { LitElement, html, css } from 'lit';
import { state, property } from 'lit/decorators.js';

// Definição da interface para representar um Pokémon
interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
}

export class PokemonOverview extends LitElement {
  // reactive properties
  @property({ type: String }) headline = 'These are our products';
  @state() private pokemonList: Pokemon[] = []; //holds the list of pokemons to be displayed
  @state() private allPokemonList: Pokemon[] = []; //stores the full list fetched from the api
  @state() private selectedTypes: Set<string> = new Set();
  @state() private availableTypes: string[] = [];
  @state() private searchQuery: string = '';
  @state() private loading: boolean = false;
  @state() private currentPage: number = 1;
  @state() private pokemonsPerPage: number = 100;

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
      grid-template-columns: repeat(auto-fill, minmax(200px, max-content));
      justify-content: center;
      margin-left: 15px;
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
      border: 1px solid black;
      padding: 10px;
      background-color: white;
      width: 200px;
      height: 200px;
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
      border-top: 1px solid black;
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

    .search-bar {
      margin-bottom: 10px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
    }

    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    .pagination button {
      padding: 5px 10px;
      margin: 0 5px;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
  }

  async firstUpdated() {
    await this.fetchAvailableTypes();
    await this.fetchPokemonList('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0');
  }

  // Obtém a lista de tipos disponíveis a partir da API
  async fetchAvailableTypes() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/type/');
      const data = await response.json();
      this.availableTypes = data.results
        .map((type: { name: string }) => type.name)
        .sort((a: string, b: string) => a.localeCompare(b)); 
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  }

  // Obtém a lista completa de Pokémon a partir da API
  async fetchPokemonList(url: string) {
    try {
      this.loading = true;
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
    } finally {
      this.loading = false;
    }
  }

  // Atualiza os filtros baseados no tipo de Pokémon selecionado
  updateFilter(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedTypes.add(target.value);
    } else {
      this.selectedTypes.delete(target.value);
    }
    this.currentPage = 1; // Reset a página quando um filtro é aplicado
    this.applyFilter();
  }

  updateSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.currentPage = 1; // Reseta a página ao realizar a pesquisa
    this.applyFilter();
  }

  // Aplica os filtros e a pesquisa para atualizar a lista de Pokémon visíveis
  //Whenever the user applies a filter or updates the search, the applyFilter method is called to update the pokemonList accordingly.
  applyFilter() {
    const filteredPokemons = this.allPokemonList
      .filter(
        (pokemon) =>
          (this.selectedTypes.size === 0 ||
            [...this.selectedTypes].every((type) => pokemon.types.includes(type))) &&
          (this.searchQuery === '' || pokemon.name.toLowerCase().includes(this.searchQuery))
      );

    // Paginação: exibe apenas 100 pokémons por página
    const startIndex = (this.currentPage - 1) * this.pokemonsPerPage;
    const endIndex = startIndex + this.pokemonsPerPage;
    this.pokemonList = filteredPokemons.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.applyFilter();
  }

  render() {
    return html`
      <h2>${this.headline}</h2>
      <div class="container">
        <div class="filter">
          <h3>Search Pokémon</h3>
          <input type="text" class="search-bar" placeholder="Search" @input=${this.updateSearch} />
          <h3>Filter</h3>
          ${this.availableTypes.map(
            (type) => html`
              <label>
                <input type="checkbox" value="${type}" @change=${this.updateFilter} />
                ${type}
                <span class="type-indicator" style="background-color: ${this.getTypeColor(type)}"></span>
              </label>
            `
          )}
        </div>

        <div class="pokemon-container">
          ${this.loading
            ? html`<div class="loading-spinner">Loading...</div>`
            : this.pokemonList.map(
                (pokemon) => html`
                  <a href="/pokemon/${pokemon.id}" @click=${this.navigateToPokemon} class="pokemon-card">
                    <span class="pokemon-id">#${pokemon.id}</span>
                    <img src="${pokemon.image}" alt="${pokemon.name}" />
                    <div class="pokemon-info">
                      <p class="pokemon-name">${pokemon.name}</p>
                      <span class="pokemon-types">
                        ${pokemon.types.map(
                          (type) => html`<span class="type-indicator" style="background-color: ${this.getTypeColor(type)}"></span>`
                        )}
                      </span>
                    </div>
                  </a>
                `
              )}
        </div>
      </div>

      <div class="pagination">
        <button @click=${() => this.changePage(this.currentPage - 1)} ?disabled=${this.currentPage === 1}>Prev</button>
        <button @click=${() => this.changePage(this.currentPage + 1)} ?disabled=${this.pokemonList.length < this.pokemonsPerPage}>
          Next
        </button>
      </div>
    `;
  }

  // Navega para a página de detalhes do Pokémon sem recarregar a página
  navigateToPokemon(event: Event) {
    event.preventDefault();
    const target = event.currentTarget as HTMLAnchorElement;
    window.history.pushState({}, '', target.href);
    window.dispatchEvent(new Event('popstate')); // Atualiza a rota
  }

  // Obtém a cor associada a cada tipo de Pokémon
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      bug: 'olive',
      dark: 'black',
      dragon: 'darkblue',
      electric: 'yellow',
      fairy: 'lightpink',
      fighting: 'brown',
      fire: 'red',
      flying: 'skyblue',
      ghost: 'indigo',
      grass: 'green',
      ground: 'saddlebrown',
      ice: 'lightblue',
      normal: 'gray',
      poison: 'purple',
      psychic: 'pink',
      rock: 'darkgray',
      steel: 'silver',
      stellar: 'gold',
      unknown: 'dimgray',
      water: 'blue',
    };
    return colors[type];
  }
}

customElements.define('pokemon-overview', PokemonOverview);
