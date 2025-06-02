import { useState, useMemo, useCallback } from 'react';
import { Book, CatalogFilters } from '../../types/interfaces.ts';
import { filterService } from '../../services/library/FilterService.ts';
import { libraryService } from '../../services/library/LibraryService.ts';

type AnyBookType = Book;

/**
 * Hook for managing catalog filters in the library
 */
export function useLibraryFilters(books: AnyBookType[]) {
    const initialYearRange = useMemo(() => {
        return libraryService.getYearRange(books);
    }, [books]);

    // Filter state
    const [filters, setFilters] = useState<CatalogFilters>({
        searchQuery: '',
        selectedGenres: [],
        selectedStatuses: [],
        yearRange: initialYearRange,
        selectedYearRange: initialYearRange
    });


    const [isFiltersOpen, setIsFiltersOpen] = useState(false);


    const filteredBooks = useMemo(() => {
        return filterService.filterBooks(books, filters);
    }, [books, filters]);


    const booksByGenre = useMemo(() => {
        return filterService.groupBooksByGenre(filteredBooks);
    }, [filteredBooks]);


    const setSearchQuery = useCallback((query: string) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
    }, []);


    const setSelectedGenres = useCallback((genres: string[]) => {
        setFilters(prev => ({ ...prev, selectedGenres: genres }));
    }, []);


    const setSelectedStatuses = useCallback((statuses: string[]) => {
        setFilters(prev => ({ ...prev, selectedStatuses: statuses }));
    }, []);


    const setSelectedYearRange = useCallback((range: [number, number]) => {
        setFilters((prev) => ({ ...prev, selectedYearRange: range }));
    }, []);


    const clearAllFilters = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            searchQuery: '',
            selectedGenres: [],
            selectedStatuses: [],
            selectedYearRange: prev.yearRange
        }));
    }, []);


    const getUniqueGenres = useCallback(() => {
        return libraryService.getUniqueGenres();
    }, []);


    const getYearRange = useCallback(() => {
        return libraryService.getYearRange(books);
    }, [books]);

    return {
        filters,
        filteredBooks,
        booksByGenre,
        isFiltersOpen,
        setIsFiltersOpen,
        setSearchQuery,
        setSelectedGenres,
        setSelectedStatuses,
        setSelectedYearRange,
        clearAllFilters,
        getUniqueGenres,
        getYearRange
    };
}