// .storybook/main.mjs

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
    stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-essentials'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    docs: {
        autodocs: true,
    },
};

export default config;
