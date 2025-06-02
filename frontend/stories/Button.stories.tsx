import type { Meta, StoryObj } from '@storybook/react';
import Button from '../src/components/common/Button';

const meta: Meta<typeof Button> = {
    title: 'Common/Button',
    component: Button,
    tags: ['autodocs'],
    };

    export default meta;
    type Story = StoryObj<typeof Button>;

        export const Default: Story = {
        args: {
        // Aggiungi qui eventuali props iniziali, es:
        // children: 'Click me',
        // variant: 'fill'
        },
        };
