import type { Meta, StoryObj } from '@storybook/react';
import BookDetail from '../src/components/features/books/BookDetail';
import { LibraryContext } from '../src/contexts/LibraryContext';
import type { LibraryContextType } from '../src/contexts/LibraryContext';
import type { RentableBook } from '../src/types/interfaces';


const fakeBook: RentableBook = {
    genre: undefined,
    id: 1,
    title: 'Mocked Book',
    author: 'Jane Doe',
    coverColor: '#123456',
    coverImage: 'images/cover1.jpg',
    status: 'ForRent',
    rating: 4.5,
    description: 'Mocked book for Storybook',
    owner: '0xABC123',
    publishedYear: 2024,
    depositAmount: 0.2,
    lendingPeriod: 7,
    borrowDate: new Date().toISOString()
};

const mockedLibraryContext: LibraryContextType = {
    filters: undefined,
    selectedBook: fakeBook,
    selectBook: () => {},
    isBookOwner: () => true,
    isBookBorrower: () => false,
    hasUserRatedBook: () => false,
    borrowBook: async () => fakeBook,
    returnBook: async () => fakeBook,
    buyBook: async () => fakeBook,
    rateBook: async () => fakeBook,
    addBook: async () => fakeBook,
    refreshLibrary: async () => [fakeBook],
    precalculateBookMetadata: async () => ({
        isOwner: true,
        isBorrower: false,
        hasRated: false,
    }),
    getBookById: () => fakeBook,
    allBooks: [fakeBook],
    ownedBooks: [fakeBook],
    borrowedBooks: [],
    filteredBooks: [fakeBook],
    booksByGenre: {},
    setSearchQuery: () => {},
    setSelectedGenres: () => {},
    setSelectedStatuses: () => {},
    setSelectedYearRange: () => {},
    clearAllFilters: () => {},
    viewMode: 'grid',
    setViewMode: () => {},
    isFiltersOpen: false,
    setIsFiltersOpen: () => {},
    getUniqueGenres: () => ['Fantasy'],
    getYearRange: () => [2000, 2025],
    isLoading: false,
    error: null
};

const meta: Meta<typeof BookDetail> = {
    title: 'Books/BookDetail',
    component: BookDetail,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <LibraryContext.Provider value={mockedLibraryContext}>
                <Story />
            </LibraryContext.Provider>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof BookDetail>;

export const Default: Story = {
    args: {},
};
