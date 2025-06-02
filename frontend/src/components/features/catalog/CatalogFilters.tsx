import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles/CatalogFilters.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';
import { ALL_GENRES } from '../../../types/interfaces.ts';
import { STATUS_OPTIONS } from '../../../types/costants.ts';

/**
 * CatalogFilters displays search and advanced filtering options
 * for the book catalog: text search, genre, status, and year range.
 */
const CatalogFilters= () => {
    const { t } = useTranslation();
    const {
        filters,
        setSearchQuery,
        setSelectedGenres,
        setSelectedStatuses,
        setSelectedYearRange,
        clearAllFilters,
        isFiltersOpen,
        setIsFiltersOpen,
    } = useLibrary();

    const {
        searchQuery,
        selectedGenres,
        selectedStatuses,
        yearRange,
        selectedYearRange,
    } = filters;

    const [minYear, maxYear] = yearRange;
    const [currentMinYear, currentMaxYear] = selectedYearRange;
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(isFiltersOpen);

    /**
     * Controls animation when filters panel is toggled
     */
    useEffect(() => {
        if (isFiltersOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isFiltersOpen, shouldRender]);

    /** Updates search query state */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    /** Toggles genre selection */
    const handleGenreChange = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    /** Toggles status selection */
    const handleStatusChange = (status: string) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    /** Updates minimum year in range */
    const handleMinYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMinYear = parseInt(e.target.value);
        if (newMinYear <= currentMaxYear) {
            setSelectedYearRange([newMinYear, currentMaxYear]);
        }
    };

    /** Updates maximum year in range */
    const handleMaxYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaxYear = parseInt(e.target.value);
        if (newMaxYear >= currentMinYear) {
            setSelectedYearRange([currentMinYear, newMaxYear]);
        }
    };

    /** Detects if any filter is active */
    const hasActiveFilters = useMemo(() => {
        return (
            searchQuery ||
            selectedGenres.length > 0 ||
            selectedStatuses.length > 0 ||
            currentMinYear !== minYear ||
            currentMaxYear !== maxYear
        );
    }, [searchQuery, selectedGenres, selectedStatuses, currentMinYear, currentMaxYear, minYear, maxYear]);

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.searchBar}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <FontAwesomeIcon
                        icon={faSearch}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255, 255, 255, 0.5)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder={t('catalog_filterTextPlaceholder')}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                    />
                </div>
                <button
                    className={styles.filterToggle}
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    style={{ position: 'relative' }}
                >
                    <FontAwesomeIcon icon={faFilter} />
                    <span style={{ marginLeft: '8px' }}>
                        {isFiltersOpen ? t('catalog_filterHide') : t('catalog_filterShow')}
                    </span>
                </button>
            </div>

            {shouldRender && (
                <div className={`${styles.advancedFilters} ${isClosing ? styles.filtersClosing : ''}`}>
                    <div className={styles.filtersHeader}>
                        <h3 className={styles.filtersTitle}>{t('catalog_advancedFilters')}</h3>
                        {hasActiveFilters && (
                            <button className={styles.clearFiltersButton} onClick={clearAllFilters}>
                                {t('catalog_advancedFiltersClearAll')}
                            </button>
                        )}
                    </div>

                    <div className={styles.filtersGrid}>
                        {/* Genre filter */}
                        <div className={styles.filterSection}>
                            <h4 className={styles.filterSectionTitle}>{t('catalog_filterGenre')}</h4>
                            <div className={styles.genreColumns}>
                                {[0, 1, 2].map(columnIndex => {
                                    const genresPerColumn = Math.ceil(ALL_GENRES.length / 3);
                                    const startIndex = columnIndex * genresPerColumn;
                                    const endIndex = startIndex + genresPerColumn;
                                    const columnGenres = ALL_GENRES.slice(startIndex, endIndex);

                                    return (
                                        <div key={columnIndex} className={styles.filterGroup}>
                                            <div className={styles.checkboxGroup}>
                                                {columnGenres.map(genre => (
                                                    <label key={genre} className={styles.checkboxLabel}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedGenres.includes(genre)}
                                                            onChange={() => handleGenreChange(genre)}
                                                        />
                                                        <span>{genre}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.filterRow}>
                            {/* Status filter */}
                            <div className={styles.filterGroup}>
                                <h4 className={styles.filterGroupTitle}>{t('catalog_filterStatus')}</h4>
                                <div className={styles.checkboxGroup}>
                                    {STATUS_OPTIONS.map(option => (
                                        <label key={option.value} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedStatuses.includes(option.value)}
                                                onChange={() => handleStatusChange(option.value)}
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Year range filter */}
                            <div className={styles.filterGroup}>
                                <h4 className={styles.filterGroupTitle}>{t('catalog_filterPubYear')}</h4>
                                <div className={styles.rangeContainer}>
                                    <div className={styles.rangeLabels}>
                                        <span className={styles.rangeValue}>{currentMinYear}</span>
                                        <span className={styles.rangeValue}>{currentMaxYear}</span>
                                    </div>
                                    <div className={styles.rangeSliders}>
                                        <input
                                            type="range"
                                            min={minYear}
                                            max={maxYear}
                                            value={currentMinYear}
                                            onChange={handleMinYearChange}
                                            className={styles.rangeInput}
                                        />
                                        <input
                                            type="range"
                                            min={minYear}
                                            max={maxYear}
                                            value={currentMaxYear}
                                            onChange={handleMaxYearChange}
                                            className={styles.rangeInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogFilters;
