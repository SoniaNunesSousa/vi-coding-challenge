import { Router } from '@vaadin/router';
import '../stories/PokemonOverview.ts';
import '../stories/PokemonDetails.ts';

const outlet = document.querySelector('#outlet') as HTMLElement;

if (outlet) {
  outlet.style.width = '100%'; // Garante que o outlet ocupe toda a largura da tela
  const router = new Router(outlet);
  router.setRoutes([
    { path: '/', component: 'pokemon-overview' },
    { path: '/pokemon/:id', component: 'pokemon-details' }
  ]);
}

export default Router;
