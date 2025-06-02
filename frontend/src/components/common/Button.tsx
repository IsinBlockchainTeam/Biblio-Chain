import React from 'react';
import styles from './styles/Button.module.css';

type ButtonVariant = 'border' | 'fill' | 'simple' | 'danger' | 'resume' | 'white';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: ButtonVariant;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    maxWidth?: string;
    disabled?: boolean;
};

/**
 * Reusable Button component with support for multiple visual variants.
 */
function Button({
                    children,
                    onClick,
                    variant = 'fill',
                    type = 'button',
                    className = '',
                    disabled = false,
                    maxWidth
                }: ButtonProps) {
    const style: React.CSSProperties = {};

    if (variant === 'danger' || variant === 'resume') {
        style.minWidth = maxWidth ?? '200px';
    }

    return (
        <button
            className={`
                ${styles.button}
                ${styles[`${variant}Button`]}
                ${className}
                ${disabled ? styles.disabledButton : ''}
            `}
            onClick={onClick}
            type={type}
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
}

export default Button;
