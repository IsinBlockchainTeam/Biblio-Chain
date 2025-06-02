import {ReactNode} from "react";

export type BookGenre =
    | 'Fantasy'
    | 'Science Fiction'
    | 'Mystery'
    | 'Thriller'
    | 'Romance'
    | 'Non-fiction'
    | 'Biography'
    | 'History'
    | 'Self-help'
    | 'Young Adult'
    | 'Classic'
    | 'Literature'
    | 'Adventure'
    | 'Horror'
    | 'Dystopian'
    | 'Science'
    | 'Children'
    | 'Philosophy';

export const ALL_GENRES: BookGenre[] = [
    'Fantasy',
    'Science Fiction',
    'Mystery',
    'Thriller',
    'Romance',
    'Non-fiction',
    'Biography',
    'History',
    'Self-help',
    'Young Adult',
    'Classic',
    'Literature',
    'Adventure',
    'Horror',
    'Dystopian',
    'Science',
    'Children',
    'Philosophy'
];

export interface Book {
    id: number;
    title: string;
    author: string;
    coverImage?: string;
    coverFile?: File;
    coverColor: string;
    genre: BookGenre;
    publishedYear: number;
    rating?: number;
    description?: string;
    status: BookStatus;
    owner: string;
    created?: Date;
}

export interface RentableBook extends Book {
    borrowDate?: string;
    borrower?: string;
    borrowStatus?: LendingStatus;
    depositAmount: number;
    lendingPeriod: number; // Number of days the book can be borrowed for (default: 30)
}

export interface SellableBook extends Book {
    price: number;
}
export interface Transaction {
    id: number;
    type: TransactionType;
    bookId: number;
    bookTitle: string;
    counterpartyAddress: string;
    date: string;
    status: 'Active' | 'Completed' | 'Overdue' | 'Cancelled';
}

export enum OperationType {
    Rentable = 0,
    Sellable = 1,
    Borrowing = 2,
    Returning = 3,
    Purchasing = 4
}

export interface TransactionFilters {
    type?: 'Borrowed' | 'Lent' | 'Returned' | 'Bought' | 'Sold';
    status?: 'Active' | 'Completed' | 'Overdue' | 'Cancelled';
    startDate?: string;
    endDate?: string;
}

export interface IPFSBookMetadata {
    title: string;
    author: string;
    genre: string;
    publishedYear: string;
    description?: string;
    coverColor: string;
    coverImage?: string;
    created: string;
}

export interface CatalogFilters {
    searchQuery: string;
    selectedGenres: string[];
    selectedStatuses: string[];
    yearRange: [number, number];
    selectedYearRange: [number, number];
}

export interface ServiceStatus {
    name: string;
    status: 'running' | 'paused' | 'maintenance';
}

export interface BlacklistedAddress {
    address: string;
    reason: string;
    addedAt: string;
}

export interface AdminUser {
    address: string;
    isCurrentUser: boolean;
}

export interface User {
    address: string;
    isRegistered: boolean;
    isBanned: boolean;
    trustLevel: number;
    isSystemOwner: boolean;
}
export interface GovernanceProposal {
    id: number;
    type: 'add_admin' | 'remove_admin';
    target: string;
    proposer: string;
    approvalCount: number;
    rejectionCount: number;
    state: 'Pending' | 'Executed' | 'Rejected';
    hasVoted: boolean;
}

export interface WalletConnection {
    address: string;
    shortAddress: string;
    balance: string;
    isAdmin: boolean;
}
export interface ProviderConnection {
    address: string;
    shortAddress: string;
    balance: string;
}

export interface RouteConfig {
    path: string;
    component: ReactNode;
    label: string;
    showInNavbar: boolean;
    protected?: boolean;
}
export interface BookFormData {
    title: string;
    author: string;
    genre: string;
    publishedYear: string;
    description: string;
    coverImage?: string;
    coverFile?: File;
    coverColor: string;
    bookType: 'rentable' | 'sellable';
    price?: string;
    depositAmount?: string;
    lendingPeriod?: string;
}

export interface ValidationErrors {
    [key: string]: string;
}
export type AnyBookType = Book | RentableBook | SellableBook;
export type BookStatus = 'Available' | 'ForRent' | 'Lent' | 'Sold';
export type LendingStatus = 'Active' | 'Overdue';
export type TransactionType = 'Borrowed' | 'Created' | 'Returned' | 'Bought';