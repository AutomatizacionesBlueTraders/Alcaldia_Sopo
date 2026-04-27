const zxcvbn = require('zxcvbn');

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;
const MIN_SCORE = 3; // 0..4 (0 débil, 4 muy fuerte). 3 = fuerte.

// Mensajes de feedback de zxcvbn traducidos a español (parcial).
const WARNING_ES = {
  'This is a top-10 common password': 'Esta es una de las contraseñas más usadas del mundo.',
  'This is a top-100 common password': 'Esta es una contraseña muy común.',
  'This is a very common password': 'Esta es una contraseña muy común.',
  'This is similar to a commonly used password': 'Se parece a una contraseña muy común.',
  'A word by itself is easy to guess': 'Una palabra sola es fácil de adivinar.',
  'Names and surnames by themselves are easy to guess': 'Los nombres por sí solos son fáciles de adivinar.',
  'Common names and surnames are easy to guess': 'Los nombres comunes son fáciles de adivinar.',
  'Straight rows of keys are easy to guess': 'Las filas del teclado son fáciles de adivinar.',
  'Short keyboard patterns are easy to guess': 'Los patrones cortos de teclado son fáciles de adivinar.',
  'Use a longer keyboard pattern with more turns': 'Usa un patrón más largo y variado.',
  'Repeats like "aaa" are easy to guess': 'Las repeticiones como "aaa" son fáciles de adivinar.',
  'Repeats like "abcabcabc" are only slightly harder to guess than "abc"': 'Las repeticiones como "abcabc" son casi tan débiles como "abc".',
  'Sequences like abc or 6543 are easy to guess': 'Las secuencias como "abc" o "6543" son fáciles de adivinar.',
  'Recent years are easy to guess': 'Los años recientes son fáciles de adivinar.',
  'Dates are often easy to guess': 'Las fechas son fáciles de adivinar.',
};

const SUGGESTION_ES = {
  'Use a few words, avoid common phrases': 'Usa varias palabras, evita frases comunes.',
  'No need for symbols, digits, or uppercase letters': 'No necesitas símbolos ni mayúsculas si la frase es larga.',
  'Add another word or two. Uncommon words are better.': 'Añade una o dos palabras más. Mejor palabras poco comunes.',
  'Capitalization doesn\'t help very much': 'Las mayúsculas por sí solas no ayudan mucho.',
  'All-uppercase is almost as easy to guess as all-lowercase': 'Escribir todo en mayúsculas es casi tan débil como todo en minúsculas.',
  'Reversed words aren\'t much harder to guess': 'Invertir palabras no las hace mucho más seguras.',
  'Predictable substitutions like \'@\' instead of \'a\' don\'t help very much': 'Sustituciones predecibles (como \'@\' por \'a\') no ayudan mucho.',
  'Avoid repeated words and characters': 'Evita repeticiones.',
  'Avoid sequences': 'Evita secuencias.',
  'Avoid recent years': 'Evita años recientes.',
  'Avoid years that are associated with you': 'Evita años ligados a ti.',
  'Avoid dates and years that are associated with you': 'Evita fechas ligadas a ti.',
};

function translate(map, text) {
  return map[text] || text;
}

/**
 * Valida una contraseña.
 * @param {string} password
 * @param {string[]} userInputs - datos personales del usuario para penalizar
 *        su uso en la contraseña (ej. email, nombre).
 * @returns {{valid: boolean, reason?: string, score?: number}}
 */
function validatePasswordStrength(password, userInputs = []) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    return { valid: false, reason: `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.` };
  }
  if (password.length > MAX_LENGTH) {
    return { valid: false, reason: `La contraseña no puede tener más de ${MAX_LENGTH} caracteres.` };
  }

  const cleanInputs = userInputs.filter((s) => typeof s === 'string' && s.length > 0);
  const r = zxcvbn(password, cleanInputs);

  if (r.score < MIN_SCORE) {
    const warning = translate(WARNING_ES, r.feedback?.warning || '') ||
      'Esta contraseña es fácil de adivinar.';
    const sugerencias = (r.feedback?.suggestions || [])
      .map((s) => translate(SUGGESTION_ES, s))
      .filter(Boolean);
    const sugerencia = sugerencias[0] ||
      'Usa una frase larga con varias palabras o combina letras, números y símbolos.';
    return {
      valid: false,
      reason: `${warning} ${sugerencia}`.trim(),
      score: r.score,
    };
  }
  return { valid: true, score: r.score };
}

module.exports = { validatePasswordStrength, MIN_LENGTH, MAX_LENGTH, MIN_SCORE };
