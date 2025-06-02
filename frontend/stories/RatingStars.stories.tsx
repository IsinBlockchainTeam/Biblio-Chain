import type { Meta, StoryObj } from '@storybook/react';
import RatingStars from '../src/components/common/RatingStars';

const meta: Meta<typeof RatingStars> = {
    title: 'common/RatingStars',
    component: RatingStars,
    tags: ['autodocs'],
    };

    export default meta;
    type Story = StoryObj<typeof RatingStars>;

        export const Default: Story = {
        args: {
        // Aggiungi qui eventuali props iniziali, es:
        // children: 'Click me',
        // variant: 'fill'
        },
        };
