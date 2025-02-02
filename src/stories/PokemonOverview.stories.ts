import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './PokemonOverview'; 

const meta: Meta = {
  title: 'Components/PokemonOverview',
  component: 'pokemon-overview',
  argTypes: {
    headline: { control: 'text' },
  },
};

export default meta; 

export const Default: StoryObj = {
  render: (args) => html`<pokemon-overview .headline=${args.headline}></pokemon-overview>`,
  args: {
    headline: 'These are our products',
  },
};
