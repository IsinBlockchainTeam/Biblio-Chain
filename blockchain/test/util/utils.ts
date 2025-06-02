//ITA: serve per mostrare solo i miei output di console e non la verbose standard
//ITA utile per vedere se funziona tutto durante lo sviluppo, uso la stampa condizionale
//ITA: per vedere se è stato richiesto di  mostrare l'output. in questo modo posso sia testare
//ITA che provare a vedere se il codice funziona. per far partire i test con le stampe:

//ITA  PRINT_TEST=true npx hardhat test
//ITA potevo farlo con l'arg --verbose ma in questo modo ho tutte le porcate di verbose in mezzo
// mentre non posso specificare altri args che non sono conosciuti dal fw di test.
//mentre hardhat ignora bellamente le variabili d'ambiente quindi top:)

const isPrintEnabled = process.env.PRINT_TEST === "true";

export function debugLog(...args: any[]) {
    if (isPrintEnabled) {
        console.log(...args);
    }
}