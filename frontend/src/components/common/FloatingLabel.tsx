import {
    InputHTMLAttributes,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
    ReactNode,
} from 'react';
import styles from './styles/FloatingLabel.module.css';

/**
 * Props for input and textarea floating label fields
 */
interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    error?: string;
    as?: 'input';
}

interface FloatingLabelTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
    error?: string;
    as: 'textarea';
}

/**
 * Props for select floating label field
 */
interface FloatingLabelSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    error?: string;
    children: ReactNode;
}

/**
 * FloatingLabelInput
 *
 * Renders an input or textarea with floating label styling and optional error state.
 */
export const FloatingLabelInput= ({
                                                                                                 label,
                                                                                                 id,
                                                                                                 error,
                                                                                                 className,
                                                                                                 as,
                                                                                                 ...props
                                                                                             } :FloatingLabelInputProps | FloatingLabelTextareaProps) => {
    const commonClasses = `${styles.formInput} ${error ? styles.errorInput : ''} ${className || ''}`;

    return (
        <div className={styles.formField}>
            {as === 'textarea' ? (
                <textarea
                    id={id}
                    className={commonClasses}
                    style={{ resize: 'vertical' }}
                    {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                />
            ) : (
                <input
                    id={id}
                    className={commonClasses}
                    placeholder={label}
                    {...(props as InputHTMLAttributes<HTMLInputElement>)}
                />
            )}
            <label htmlFor={id} className={styles.formLabel}>
                {label}
            </label>
            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    );
};

/**
 * FloatingLabelSelect
 *
 * Renders a styled <select> element with floating label and optional error state.
 */
export const FloatingLabelSelect= ({
                                                                      label,
                                                                      id,
                                                                      error,
                                                                      className,
                                                                      value,
                                                                      children,
                                                                      ...props
                                                                  }: FloatingLabelSelectProps) => {
    const isEmpty = value === '';

    const classes = [
        styles.formSelect,
        error && styles.errorInput,
        isEmpty && styles.emptySelect,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={styles.formField}>
            <select
                id={id}
                className={classes}
                value={value}
                {...props}
            >
                {children}
            </select>
            <label htmlFor={id} className={styles.formLabel}>
                {label}
            </label>
            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    );
};
