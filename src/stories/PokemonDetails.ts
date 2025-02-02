import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: { name: string }[];
  abilities: { name: string; flavorText: string; version: string }[];
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
    .pokemon-container {
      display: flex;
      align-items: center;
      border: 2px solid yellow;
      background-color: white;
      padding: 20px;
      max-width: 600px;
    }
    .pokemon-image {
      width: 250px;
      height: 250px;
      margin-right: 20px;
    }
    .pokemon-info {
      display: flex;
      flex-direction: column;
      color: black;
    }
    .pokemon-types {
      margin-top: 5px;
    }
    .back-container {
      margin-top: 20px;
    }
    .back-link {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
    }
    .back-link:hover {
      background-color: #0056b3;
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
      
      const abilities = await Promise.all(details.abilities.map(async (abilityInfo: any) => {
        const abilityResponse = await fetch(abilityInfo.ability.url);
        const abilityDetails = await abilityResponse.json();
        const englishEntry = abilityDetails.flavor_text_entries.find((entry: any) => entry.language.name === 'en');
        return {
          name: abilityInfo.ability.name,
          flavorText: englishEntry ? englishEntry.flavor_text : 'No description available',
          version: englishEntry ? englishEntry.version_group.name : 'Unknown'
        };
      }));
      
      this.pokemon = {
        id: details.id,
        name: details.name,
        image: details.sprites.front_default,
        types: details.types.map((t: any) => ({ name: t.type.name })),
        abilities
      };
    } catch (error) {
      console.error('Error fetching Pokémon details:', error);
    }
  }

  render() {
    return html`
      ${this.pokemon
        ? html`
          <div class="pokemon-container">
            <img class="pokemon-image" src="${this.pokemon.image}" alt="${this.pokemon.name}">
            <div class="pokemon-info">
              <h2>${this.pokemon.name} (#${this.pokemon.id})</h2>
              <div>
                <strong>Types:</strong>
                <ul>
                  ${this.pokemon.types.map(type => html`<li>${type.name}:</li> `)}
                </ul>
              </div>
              <div>
                <strong>Abilities:</strong>
                <ul>
                  ${this.pokemon.abilities.map(ability => html`<li>${ability.name}: ${ability.flavorText} (Version: ${ability.version})</li>`)}
                </ul>
              </div>
            </div>
          </div>
          <div class="back-container">
            <a class="back-link" href="/" @click=${this.goBack}>← Back to list</a>
          </div>`
        : html`<p>Loading...</p>`}
    `;
  }

  goBack(event: Event) {
    event.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  }
}

customElements.define('pokemon-details', PokemonDetails);
