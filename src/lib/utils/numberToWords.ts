/**
 * Conversion de nombres en lettres (français)
 * Utilisé dans les bons d'engagement, ordres de payer, etc.
 */

const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const TEENS = [
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
];
const TENS = [
  '',
  '',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
  'soixante-dix',
  'quatre-vingt',
  'quatre-vingt-dix',
];

/**
 * Convertit un nombre entier positif en lettres (français)
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToWords(-num);

  if (num < 10) return UNITS[num];
  if (num < 20) return TEENS[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) {
      return TENS[ten - 1] + '-' + TEENS[unit];
    }
    return TENS[ten] + (unit ? '-' + UNITS[unit] : '');
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    return (
      (hundred === 1 ? 'cent' : UNITS[hundred] + ' cent') + (rest ? ' ' + numberToWords(rest) : '')
    );
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    return (
      (thousand === 1 ? 'mille' : numberToWords(thousand) + ' mille') +
      (rest ? ' ' + numberToWords(rest) : '')
    );
  }
  if (num < 1000000000) {
    const million = Math.floor(num / 1000000);
    const rest = num % 1000000;
    return (
      numberToWords(million) +
      ' million' +
      (million > 1 ? 's' : '') +
      (rest ? ' ' + numberToWords(rest) : '')
    );
  }
  if (num < 1000000000000) {
    const milliard = Math.floor(num / 1000000000);
    const rest = num % 1000000000;
    return (
      numberToWords(milliard) +
      ' milliard' +
      (milliard > 1 ? 's' : '') +
      (rest ? ' ' + numberToWords(rest) : '')
    );
  }
  return num.toString();
}

/**
 * Convertit un montant en lettres avec "francs CFA"
 * Ex: 1 500 000 → "un million cinq cent mille francs CFA"
 */
export function numberToWordsCFA(montant: number): string {
  const entier = Math.floor(Math.abs(montant));
  const lettres = numberToWords(entier);
  return `${lettres} francs CFA`;
}
