import type { Meta, StoryObj } from '@storybook/react';
import BookCard from '../src/components/features/books/BookCard';
import { LibraryContext } from '../src/contexts/LibraryContext';
import type { LibraryContextType } from '../src/contexts/LibraryContext';
import {AnyBookType, BookFormData} from "../src/types/interfaces";
import '../src/index.css';

const fakeBook = {
    id: 1,
    title: 'Mock Book',
    author: 'Author ',
    coverColor: '#a2d2ff',
    coverImage: 'images/cover2.jpg',
    status: 'Available',
    rating: 4.7,
    description: 'Book for testing BookCard with bookId prop',
    owner: '0xABCDEF',
    publishedYear: 2023,
    price: 1.2,
};

const mockedLibraryContext: LibraryContextType = {
    addBook(book: BookFormData): Promise<AnyBookType> {
        console.log(book)
        return Promise.resolve(fakeBook as AnyBookType);
    },
    allBooks: [],
    borrowBook(bookId: number): Promise<AnyBookType> {
        console.log(bookId)
        return Promise.resolve(fakeBook as AnyBookType);
    },
    buyBook(bookId: number): Promise<AnyBookType> {
        console.log(bookId)
        return Promise.resolve(fakeBook as AnyBookType);
    },
    filteredBooks: [],
    filters: undefined,
    getBookById(id: number): AnyBookType | undefined {
        console.log(id)
        return fakeBook as AnyBookType;
    },
    precalculateBookMetadata(bookId: number): Promise<{
        isOwner: boolean;
        isBorrower: boolean;
        hasRated: boolean
    } | null | undefined> {
        console.log(bookId)
        return Promise.resolve(undefined);
    },
    rateBook(bookId: number, rating: number): Promise<AnyBookType> {
        console.log(bookId);
        console.log(rating)
        return Promise.resolve(undefined);
    },
    refreshLibrary(): Promise<AnyBookType[]> {
        return Promise.resolve([]);
    },
    returnBook(bookId: number): Promise<AnyBookType> {
        console.log(bookId)
        return Promise.resolve(undefined);
    },
    selectedBook: null,
    selectBook: () => {},
    isBookOwner: () => false,
    isBookBorrower: () => false,
    hasUserRatedBook: () => false,

    ownedBooks: [],
    borrowedBooks: [],
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
    getUniqueGenres: () => ['Test'],
    getYearRange: () => [2000, 2030],
    isLoading: false,
    error: null
};

const meta: Meta<typeof BookCard> = {
    title: 'Books/BookCard',
    component: BookCard,
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

type Story = StoryObj<typeof BookCard>;

export const Default: Story = {
    render: () => <BookCard id={1} />,
};
