// Validação de qualidade de copy

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  score: number; // 0-10
}

const FORBIDDEN_PHRASES = [
  'invista no seu futuro',
  'realize seus sonhos',
  'o melhor investimento',
  'conheça',
  'descubra',
  'confira',
  'saiba mais',
  'explore',
  'veja como',
];

const REQUIRED_METRICS = [
  '18.5%',
  '420m',
  '420',
  '87%',
  '10 anos',
  'dados',
  'rentabiliza',
];

export function validateCopy(copy: string): ValidationResult {
  const issues: string[] = [];
  let score = 10;

  const copyLower = copy.toLowerCase();

  // Check 1: Forbidden phrases
  for (const phrase of FORBIDDEN_PHRASES) {
    if (copyLower.includes(phrase)) {
      issues.push(`❌ Contém frase genérica proibida: "${phrase}"`);
      score -= 2;
    }
  }

  // Check 2: At least one metric
  let hasMetric = false;
  for (const metric of REQUIRED_METRICS) {
    if (copyLower.includes(metric.toLowerCase())) {
      hasMetric = true;
      break;
    }
  }
  if (!hasMetric) {
    issues.push('❌ Nenhuma métrica (18.5%, R$ 420M, 87%, etc) mencionada');
    score -= 3;
  }

  // Check 3: Agressiveness indicators
  const aggressiveTerms = [
    'não',
    'vs',
    'diferente',
    'você ainda',
    'por que você',
    'acima',
    'vence',
    'abandone',
    'esqueça',
  ];
  let aggressionCount = 0;
  for (const term of aggressiveTerms) {
    if (copyLower.includes(term)) {
      aggressionCount++;
    }
  }
  if (aggressionCount < 2) {
    issues.push(
      '⚠️ Copy pode ser mais agressiva (faltam termos provocativos)'
    );
    score -= 1;
  }

  // Check 4: Copy length (2-3 linhas esperado)
  const lines = copy
    .split('\n')
    .filter((l) => l.trim().length > 0);
  const bodyLines = lines.filter(
    (l) => !l.includes('**') && !l.includes('Headline') && !l.includes('CTA')
  );
  if (bodyLines.length > 5) {
    issues.push('⚠️ Copy muito longo (máx 3-4 linhas)');
    score -= 1;
  }

  // Check 5: Mentions Rentabiliza or product
  if (!copyLower.includes('rentabiliza') && !copyLower.includes('ia')) {
    issues.push('⚠️ Não menciona Rentabiliza ou solução');
    score -= 2;
  }

  // Check 6: CTA specificity
  const hasWeakCTA = copyLower.match(
    /\bcta:\s*(saiba mais|conheça|descubra|confira)/i
  );
  if (hasWeakCTA) {
    issues.push('❌ CTA genérico/fraco: use "Comece", "Mude", "Compare"');
    score -= 2;
  }

  score = Math.max(0, Math.min(10, score));

  return {
    isValid: issues.length === 0 || score >= 7,
    issues,
    score,
  };
}

export function validateMultipleVariations(copies: string[]): {
  allValid: boolean;
  results: ValidationResult[];
  overallScore: number;
} {
  const results = copies.map(validateCopy);
  const allValid = results.every((r) => r.isValid);
  const overallScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return {
    allValid,
    results,
    overallScore,
  };
}
