module.exports = function (plop) {
    plop.setGenerator('story', {
        description: 'Genera uno story file nella cartella /stories',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Nome del componente (es: Button):',
            },
            {
                type: 'input',
                name: 'category',
                message: 'Categoria (es: Common, Auth, Visual):',
                default: 'Components',
            },
            {
                type: 'input',
                name: 'importPath',
                message: 'Import path relativo al file (es: ../src/components/common/Button):',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'stories/{{name}}.stories.tsx',
                templateFile: 'plop-templates/story.tsx.hbs',
            },
        ],
    });
};
