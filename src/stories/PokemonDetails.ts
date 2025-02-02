import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

// Definição da interface para representar um Pokémon
interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: { name: string }[];
  abilities: { name: string; flavorText: string; version: string }[];
}

export class PokemonDetails extends LitElement {
  // Propriedade que recebe o ID do Pokémon através da URL
  @property({ type: Number }) pokemonId: number = 0;

  // Estado interno para armazenar os detalhes do Pokémon
  @state() private pokemon: Pokemon | null = null;

  // Definição dos estilos do componente
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

  // Método chamado automaticamente quando o componente é inicializado
  async firstUpdated() {
    // Obtém o ID do Pokémon a partir da URL
    this.pokemonId = parseInt(location.pathname.split('/').pop() || '0', 10);
    
   
    await this.fetchPokemonDetails();
  }

  // Método assíncrono para procurar os detalhes do Pokémon na PokéAPI
  async fetchPokemonDetails() {
    try {
      // Faz a requisição para obter os dados do Pokémon pelo ID
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${this.pokemonId}`);
      const details = await response.json();
  
      // Obtém as habilidades do Pokémon e procura a descrição de cada uma
      const abilities = await Promise.all(details.abilities.map(async (abilityInfo: any) => {
        const abilityResponse = await fetch(abilityInfo.ability.url);
        const abilityDetails = await abilityResponse.json();
        
        // Obtém a primeira descrição disponível da habilidade
        const entry = abilityDetails.flavor_text_entries[0];
  
        return {
          name: abilityInfo.ability.name,
          flavorText: entry ? entry.flavor_text : 'Descrição não disponível',
          version: entry ? entry.version_group.name : 'Desconhecido'
        };
      }));
  
      // Atualiza o estado do Pokémon com os dados recebidos
      this.pokemon = {
        id: details.id,
        name: details.name,
        image: details.sprites.front_default,
        types: details.types.map((t: any) => ({ name: t.type.name })),
        abilities
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes do Pokémon:', error);
    }
  }

  // Método que renderiza o HTML do componente
  render() {
    return html`
      ${this.pokemon
        ? html`
          <div class="pokemon-container">
            <img class="pokemon-image" src="${this.pokemon.image}" alt="${this.pokemon.name}">
            <div class="pokemon-info">
              <h2>${this.pokemon.name} (#${this.pokemon.id})</h2>
              <div>
                <strong>Tipos:</strong>
                <ul>
                  ${this.pokemon.types.map(type => html`<li>${type.name}</li> `)}
                </ul>
              </div>
              <div>
                <strong>Habilidades:</strong>
                <ul>
                  ${this.pokemon.abilities.map(ability => html`<li>${ability.name}: ${ability.flavorText} (Versão: ${ability.version})</li>`)}
                </ul>
              </div>
            </div>
          </div>
          <div class="back-container">
            <a class="back-link" href="/" @click=${this.goBack}>← Voltar à lista</a>
          </div>`
        : html`<p>A carregar...</p>`}
    `;
  }

  // Método que trata o clique no botão de voltar
  goBack(event: Event) {
    event.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  }
}

// Regista o componente para ser utilizado no HTML
customElements.define('pokemon-details', PokemonDetails);
