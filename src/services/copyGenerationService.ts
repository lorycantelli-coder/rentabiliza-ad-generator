import { generateCopyWithClaude, refineCopyWithClaude } from './claudeService';
import { validateCopy, validateMultipleVariations } from './validationService';
import { SYSTEM_INSTRUCTION_CLAUDE, QUICK_PROMPT_CLAUDE, TEMPLATE_PROMPTS } from '../constants';

export interface CopyGenerationResult {
  copy: string;
  validationScore: number;
  issues: string[];
  attempts: number;
  refined: boolean;
}

export async function generateAdCopyWithValidation(
  templateId: string,
  formData: Record<string, string>
): Promise<CopyGenerationResult> {
  const templateConfig = TEMPLATE_PROMPTS[templateId as keyof typeof TEMPLATE_PROMPTS];
  if (!templateConfig) {
    throw new Error(`Template ${templateId} não encontrado`);
  }

  // Build user prompt by replacing placeholders
  let userPrompt = templateConfig.user;
  Object.entries(formData).forEach(([key, value]) => {
    userPrompt = userPrompt.replace(`{${key}}`, value || `[${key} não informado]`);
  });

  let copy = '';
  let attempts = 0;
  let refined = false;
  const maxAttempts = 2;

  // Try to generate copy
  while (attempts < maxAttempts) {
    attempts++;

    try {
      copy = await generateCopyWithClaude(
        templateConfig.system,
        userPrompt,
        1500
      );

      // Validate the generated copy
      const variationTexts = copy
        .split('---')
        .filter((s) => s.trim().length > 0);
      const validationResults = validateMultipleVariations(variationTexts);

      if (validationResults.allValid || validationResults.overallScore >= 7) {
        // Good enough!
        const issues = validationResults.results
          .flatMap((r) => r.issues)
          .filter((i) => i.includes('❌')); // Only critical issues

        return {
          copy,
          validationScore: validationResults.overallScore,
          issues,
          attempts,
          refined,
        };
      }

      // If not valid and still have attempts, refine
      if (attempts < maxAttempts) {
        const allIssues = validationResults.results
          .flatMap((r) => r.issues);

        copy = await refineCopyWithClaude(copy, allIssues, templateConfig.system);
        refined = true;
      }
    } catch (error: any) {
      throw new Error(`Erro ao gerar copy: ${error.message}`);
    }
  }

  // Final validation after refinement attempts
  const finalValidationTexts = copy
    .split('---')
    .filter((s) => s.trim().length > 0);
  const finalValidation = validateMultipleVariations(finalValidationTexts);

  return {
    copy,
    validationScore: finalValidation.overallScore,
    issues: finalValidation.results.flatMap((r) => r.issues),
    attempts,
    refined,
  };
}

export async function generateQuickCopy(
  input: string
): Promise<CopyGenerationResult> {
  const userPrompt = QUICK_PROMPT_CLAUDE.replace('{input}', input.trim());

  let copy = '';
  let attempts = 0;
  let refined = false;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      copy = await generateCopyWithClaude(
        SYSTEM_INSTRUCTION_CLAUDE,
        userPrompt,
        1500
      );

      const variationTexts = copy
        .split('---')
        .filter((s) => s.trim().length > 0);
      const validationResults = validateMultipleVariations(variationTexts);

      if (validationResults.allValid || validationResults.overallScore >= 7) {
        return {
          copy,
          validationScore: validationResults.overallScore,
          issues: validationResults.results
            .flatMap((r) => r.issues)
            .filter((i) => i.includes('❌')),
          attempts,
          refined,
        };
      }

      if (attempts < maxAttempts) {
        const allIssues = validationResults.results.flatMap((r) => r.issues);
        copy = await refineCopyWithClaude(
          copy,
          allIssues,
          SYSTEM_INSTRUCTION_CLAUDE
        );
        refined = true;
      }
    } catch (error: any) {
      throw new Error(`Erro ao gerar quick copy: ${error.message}`);
    }
  }

  const finalValidationTexts = copy
    .split('---')
    .filter((s) => s.trim().length > 0);
  const finalValidation = validateMultipleVariations(finalValidationTexts);

  return {
    copy,
    validationScore: finalValidation.overallScore,
    issues: finalValidation.results.flatMap((r) => r.issues),
    attempts,
    refined,
  };
}
