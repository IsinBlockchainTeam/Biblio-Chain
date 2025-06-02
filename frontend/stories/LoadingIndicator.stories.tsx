import type { Meta, StoryObj } from '@storybook/react';
import LoadingIndicator from '../src/components/common/LoadingIndicator';

const meta: Meta<typeof LoadingIndicator> = {
    title: 'common/LoadingIndicator',
    component: LoadingIndicator,
    tags: ['autodocs'],
    };

    export default meta;
    type Story = StoryObj<typeof LoadingIndicator>;

        export const Default: Story = {
        args: {
        // Aggiungi qui eventuali props iniziali, es:
        // children: 'Click me',
        // variant: 'fill'
        },
        };
