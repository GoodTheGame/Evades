import { Mirage } from './Mirage.js';
import { Frozen } from './Frozen.js';
import { Pulsar } from './Pulsar.js';


export class HeroFactory {
    static createHero(heroName, x, y) {
        switch(heroName.toLowerCase()) {
            case 'mirage':
                return new Mirage(x, y);
            case 'frozen':
                return new Frozen(x, y);
            case 'pulsar':
                return new Pulsar(x, y);
            default:
                throw new Error(`Unknown hero: ${heroName}`);
        }
    }
}

