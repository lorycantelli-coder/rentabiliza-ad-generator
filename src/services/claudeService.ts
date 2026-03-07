import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
});

export async function generateCopyWithClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1500
): Promise<string> {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response format from Claude');
  } catch (error: any) {
    if (error.status === 401) {
      throw new Error(
        'Claude API Key inválida. Configure VITE_CLAUDE_API_KEY no .env.local'
      );
    }
    throw new Error(`Claude API Error: ${error.message}`);
  }
}

export async function refineCopyWithClaude(
  originalCopy: string,
  validationIssues: string[],
  systemPrompt: string
): Promise<string> {
  const refinementPrompt = `Você recebeu um copy que falhou em validação. Refine-o corrigindo os problemas:

PROBLEMAS IDENTIFICADOS:
${validationIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

COPY ORIGINAL:
${originalCopy}

Refine o copy corrigindo TODOS os problemas acima. Mantenha a mesma estrutura (Variação X com Headline, Copy, CTA), mas melhore a qualidade.`;

  return generateCopyWithClaude(systemPrompt, refinementPrompt, 1500);
}
