import type { Meta, StoryObj } from '@storybook/react';
import StarryBackground from '../src/components/common/StarryBackground';

const meta: Meta<typeof StarryBackground> = {
    title: 'common/StarryBackground',
    component: StarryBackground,
    tags: ['autodocs'],
    };

    export default meta;
    type Story = StoryObj<typeof StarryBackground>;

        export const Default: Story = {
        args: {
        // Aggiungi qui eventuali props iniziali, es:
        // children: 'Click me',
        // variant: 'fill'
        },
        };
