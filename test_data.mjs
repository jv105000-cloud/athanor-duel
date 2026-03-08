import { factions } from './src/data/cardLibrary.js';
const temple = factions.find(f => f.id === 'temple-of-light');
console.log('Temple Heroes:', temple.heroes.map(h => h.name));
console.log('Luo Jun Image:', temple.heroes.find(h => h.id === 'luojun')?.image);
