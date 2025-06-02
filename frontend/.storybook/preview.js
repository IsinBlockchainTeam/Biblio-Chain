import React from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';
import {LibraryProvider} from "../src/contexts/LibraryContext.js";
import '../src/app.css';


/** @type { import('@storybook/react').Preview } */
const preview = {
    decorators: [
        (Story) => {
            return React.createElement(
                LibraryProvider,
                null,
                React.createElement(Story)
            );
        },
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        backgrounds: {
            default: 'customDark',
            values: [
                {
                    name: 'customDark',
                    value: 'rgba(4, 27, 45, 1)',
                },
            ],
        },
    },
};

export default preview;
