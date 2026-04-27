import { useEffect, useState } from 'react';

const SCORE_LABEL = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
const SCORE_COLOR = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500'];
const SCORE_TEXT = ['text-red-600', 'text-red-500', 'text-amber-600', 'text-lime-600', 'text-green-600'];

const WARNING_ES = {
  'This is a top-10 common password': 'Esta es una de las 10 contraseñas más usadas del mundo.',
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
  'Repeats like "abcabcabc" are only slightly harder to guess than "abc"':
    'Las repeticiones como "abcabc" son casi tan débiles como "abc".',
  'Sequences like abc or 6543 are easy to guess': 'Las secuencias como "abc" o "6543" son fáciles de adivinar.',
  'Recent years are easy to guess': 'Los años recientes son fáciles de adivinar.',
  'Dates are often easy to guess': 'Las fechas son fáciles de adivinar.',
};
const SUGGESTION_ES = {
  'Use a few words, avoid common phrases': 'Usa varias palabras, evita frases comunes.',
  'No need for symbols, digits, or uppercase letters':
    'No necesitas símbolos ni mayúsculas si la frase es larga.',
  'Add another word or two. Uncommon words are better.':
    'Añade una o dos palabras más. Mejor palabras poco comunes.',
  "Capitalization doesn't help very much": 'Las mayúsculas por sí solas no ayudan mucho.',
  'All-uppercase is almost as easy to guess as all-lowercase':
    'Escribir todo en mayúsculas es casi tan débil como todo en minúsculas.',
  "Reversed words aren't much harder to guess": 'Invertir palabras no las hace mucho más seguras.',
  "Predictable substitutions like '@' instead of 'a' don't help very much":
    "Sustituciones predecibles (como '@' por 'a') no ayudan mucho.",
  'Avoid repeated words and characters': 'Evita repeticiones.',
  'Avoid sequences': 'Evita secuencias.',
  'Avoid recent years': 'Evita años recientes.',
  'Avoid years that are associated with you': 'Evita años ligados a ti.',
  'Avoid dates and years that are associated with you': 'Evita fechas ligadas a ti.',
};

// Carga zxcvbn solo cuando se llama por primera vez. La librería pesa ~400KB
// (diccionarios de contraseñas comunes) — no la metemos en el bundle inicial.
let zxcvbnModulePromise = null;
function loadZxcvbn() {
  if (!zxcvbnModulePromise) {
    zxcvbnModulePromise = import('zxcvbn').then((m) => m.default || m);
  }
  return zxcvbnModulePromise;
}

/**
 * Evalúa una contraseña. Async porque carga zxcvbn de forma diferida.
 * Devuelve null si password vacío.
 */
export async function evaluatePassword(password, userInputs = []) {
  if (!password) return null;
  const zxcvbn = await loadZxcvbn();
  const clean = userInputs.filter((s) => typeof s === 'string' && s.length > 0);
  const r = zxcvbn(password, clean);
  const warning = WARNING_ES[r.feedback?.warning] || r.feedback?.warning || '';
  const suggestions = (r.feedback?.suggestions || []).map((s) => SUGGESTION_ES[s] || s);
  return { score: r.score, warning, suggestions };
}

export default function PasswordStrengthMeter({ password, userInputs = [], minScore = 3 }) {
  const [evalResult, setEvalResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!password) {
      setEvalResult(null);
      return;
    }
    evaluatePassword(password, userInputs).then((r) => {
      if (!cancelled) setEvalResult(r);
    });
    return () => { cancelled = true; };
    // userInputs es un array — lo serializamos para el deps; cambia poco.
  }, [password, userInputs.join('|')]);

  if (!evalResult) return null;
  const { score, warning, suggestions } = evalResult;
  const fillPct = ((score + 1) / 5) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${SCORE_COLOR[score]}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${SCORE_TEXT[score]}`}>
          {SCORE_LABEL[score]}
        </span>
      </div>
      {score < minScore && (warning || suggestions.length > 0) && (
        <p className="text-xs text-gray-500">
          {warning} {suggestions[0] || ''}
        </p>
      )}
    </div>
  );
}
