import type { Meta, StoryObj } from '@storybook/react';
import CatalogBookCard from '../src/components/features/catalog/CatalogBookCard';

const meta: Meta<typeof CatalogBookCard> = {
    title: 'Catalog/CatalogBookCard',
    component: CatalogBookCard,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof CatalogBookCard>;

export const Default: Story = {
    args: {
        id: 1,
        title: 'Mock Book',
        author: 'Author Name',
        coverColor: '#a2d2ff',
        coverImage: 'images/cover2.jpg',
        rating: 4.2,
        status: 'Available',
        genre: 'Sci-Fi',
        publishedYear: 2023,
    },
};

export const Compact: Story = {
    ...Default,
    render: (args) => (
        <div style={{ maxWidth: 100, maxHeight:30,transformOrigin: 'top left', width: 'fit-content' }}>
            <CatalogBookCard {...args} />
        </div>
    ),
};
