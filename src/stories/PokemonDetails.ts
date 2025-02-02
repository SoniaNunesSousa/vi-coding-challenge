import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
}

export class PokemonDetails extends LitElement {
  @property({ type: Number }) pokemonId: number = 0;
  @state() private pokemon: Pokemon | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
    }
    .pokemon-card {
      text-align: center;
      border: 1px solid black;
      padding: 20px;
      background-color: white;
      width: 300px;
    }
    img {
      width: 150px;
      height: 150px;
    }
  `;

  async firstUpdated() {
    this.pokemonId = parseInt(location.pathname.split('/').pop() || '0', 10);
    await this.fetchPokemonDetails();
  }

  async fetchPokemonDetails() {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.pokemonId}`);
      const details = await response.json();
      this.pokemon = {
        id: details.id,
        name: details.name,
        image: details.sprites.front_default,
        types: details.types.map((t: any) => t.type.name),
        height: details.height,
        weight: details.weight
      };
    } catch (error) {
      console.error('Error fetching Pokémon details:', error);
    }
  }

  render() {
    return this.pokemon
      ? html`
          <div class="pokemon-card">
            <h2>${this.pokemon.name} (#${this.pokemon.id})</h2>
            <img src="${this.pokemon.image}" alt="${this.pokemon.name}">
            <p>Height: ${this.pokemon.height}</p>
            <p>Weight: ${this.pokemon.weight}</p>
            <p>Types: ${this.pokemon.types.join(', ')}</p>
            <a href="/" @click=${this.goBack}>← Back to list</a>
          </div>
        `
      : html`<p>Loading...</p>`;
  }

  goBack(event: Event) {
    event.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  }
}

customElements.define('pokemon-details', PokemonDetails);
