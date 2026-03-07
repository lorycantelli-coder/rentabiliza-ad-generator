import { useState, useEffect } from 'react';
import { TEMPLATES } from './constants';
import { generateAdCopy, generateImage } from './services/geminiService';
import { Loader2, Sparkles, Copy, Check, ChevronRight, LayoutTemplate, Image as ImageIcon, Download, Type } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)!;

  useEffect(() => {
    if (!baseImage) {
      setGeneratedImage(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw text overlay if exists
      if (overlayText) {
        // Gradient for readability
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(4, 8, 18, 0)');
        gradient.addColorStop(1, 'rgba(4, 8, 18, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text styling
        ctx.fillStyle = '#DCA405'; // Gold Premium
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Responsive font size based on image width
        const fontSize = Math.max(canvas.width * 0.05, 30);
        ctx.font = `bold ${fontSize}px "Playfair Display", Georgia, serif`;

        // Word wrap
        const maxWidth = canvas.width * 0.85;
        const words = overlayText.split(' ');
        let line = '';
        const lines = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        // Draw lines from bottom up
        let y = canvas.height - (canvas.height * 0.08); // Bottom padding
        for (let i = lines.length - 1; i >= 0; i--) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 5;

          ctx.fillText(lines[i].trim(), canvas.width / 2, y);
          y -= (fontSize * 1.2);
        }
      }

      setGeneratedImage(canvas.toDataURL('image/png'));
    };
    img.src = baseImage;
  }, [baseImage, overlayText]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setFormData({});
    setGeneratedCopy(null);
    setBaseImage(null);
    setGeneratedImage(null);
    setOverlayText('');
    setError(null);
  };

  const handleGenerateCopy = async () => {
    setIsGeneratingCopy(true);
    setError(null);
    try {
      let prompt = selectedTemplate.promptTemplate;
      selectedTemplate.fields.forEach((field) => {
        const value = formData[field.id] || `[${field.label} não informado]`;
        prompt = prompt.replace(`{${field.id}}`, value);
      });
      const result = await generateAdCopy(prompt);
      if (!result || result.trim() === '') {
        throw new Error("A IA retornou uma resposta vazia. Tente mudar o contexto.");
      }
      setGeneratedCopy(result);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao gerar o copy.');
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const contextValues = Object.values(formData).filter(Boolean).join(', ') || 'Investimento imobiliário de alto padrão';
      
      const prompt = `Crie uma imagem publicitária premium e sofisticada para a Rentabiliza, uma plataforma de investimentos imobiliários.
      Cores principais: Navy Deep (azul escuro) e Gold Premium (dourado).
      Estilo: Profissional, clean, moderno, sofisticado.
      Contexto: ${contextValues}.
      Não inclua textos na imagem.`;
      
      const aspectRatio = (selectedTemplate as any).aspectRatio || "1:1";
      
      const copyPrompt = `Atuando como Copywriter Sênior e Diretor de Arte da Rentabiliza, crie UMA ÚNICA FRASE CURTA (máximo 6 palavras) de altíssimo impacto para ser a headline (título) sobreposta na imagem do anúncio.
      
      Contexto da campanha: ${contextValues}.
      
      REGRAS:
      1. NÃO SEJA GENÉRICO. Proibido usar "Invista no seu futuro", "Realize sonhos", "O melhor investimento".
      2. Seja agressivo, data-driven ou contrariano.
      3. Use números se possível (ex: 18.5% a.a., R$ 420M, 10 anos).
      4. A frase deve ser um "hook" que faça a pessoa parar de rolar o feed.
      
      Exemplos bons: 
      - "Renda fixa perde para inflação."
      - "ROI de 18.5% com IA."
      - "Imóveis sem lidar com inquilinos."
      
      Retorne APENAS a frase, sem aspas, sem introduções, sem explicações.`;

      let imageResult = '';
      let shortCopyResult = 'Rentabiliza: Invista com Inteligência';

      try {
        imageResult = await generateImage(prompt, aspectRatio);
      } catch (imgErr: any) {
        throw new Error(`Erro na imagem: ${imgErr.message}`);
      }

      try {
        const copyRes = await generateAdCopy(copyPrompt);
        if (copyRes && copyRes.trim() !== '') {
          shortCopyResult = copyRes.replace(/["*]/g, '').trim();
        }
      } catch (copyErr) {
        console.error("Erro ao gerar copy curta, usando fallback", copyErr);
      }

      setBaseImage(imageResult);
      setOverlayText(shortCopyResult);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao gerar a imagem.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopy = () => {
    if (generatedCopy) {
      navigator.clipboard.writeText(generatedCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `rentabiliza-creative-${selectedTemplateId}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-navy-deep)] text-[var(--color-pure-white)] font-sans selection:bg-[var(--color-gold-premium)] selection:text-[var(--color-navy-deep)]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#02040A] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--color-gold-premium)] flex items-center justify-center text-[var(--color-navy-deep)] font-serif font-bold text-xl">
              R
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-wide">
              Rentabiliza <span className="text-[var(--color-gold-premium)] font-sans font-medium text-lg tracking-normal">Ad Generator</span>
            </h1>
          </div>
          <div className="text-sm text-[var(--color-gray-slate)] font-mono">
            v3.0 • Copy & Image AI
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Template Selection */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[var(--color-gold-premium)]" />
              1. Escolha o Formato
            </h2>
            <div className="space-y-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  id={`template-btn-${template.id}`}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedTemplateId === template.id
                      ? 'bg-[var(--color-gold-premium)]/10 border-[var(--color-gold-premium)] text-white'
                      : 'border-white/5 hover:bg-white/5 text-[var(--color-gray-slate)] hover:text-white'
                  }`}
                >
                  <div>
                    <div className={`font-medium ${selectedTemplateId === template.id ? 'text-[var(--color-gold-premium)]' : ''}`}>
                      {template.name}
                    </div>
                    <div className="text-xs opacity-70 mt-1">{template.description}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedTemplateId === template.id ? 'text-[var(--color-gold-premium)] translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          </section>

          {/* Inputs */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--color-gold-premium)]" />
              2. Contexto da Campanha
            </h2>
            
            <div className="space-y-5">
              {selectedTemplate.fields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-[var(--color-gray-slate)] mb-2">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-gold-premium)] focus:ring-1 focus:ring-[var(--color-gold-premium)] transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <button
                id="generate-copy-btn"
                onClick={handleGenerateCopy}
                disabled={isGeneratingCopy}
                className="w-full bg-[var(--color-gold-premium)] hover:bg-[#F2B915] text-[var(--color-navy-deep)] font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,164,5,0.2)] hover:shadow-[0_0_30px_rgba(220,164,5,0.4)]"
              >
                {isGeneratingCopy ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Copy...
                  </>
                ) : (
                  <>
                    <Type className="w-5 h-5" />
                    Gerar Copy de Alta Conversão
                  </>
                )}
              </button>

              <button
                id="generate-image-btn"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Imagem...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Gerar Imagem Premium
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
          <section className="bg-white/5 border border-white/10 rounded-2xl h-full min-h-[600px] flex flex-col overflow-hidden relative">
            
            {/* Results Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[var(--color-gold-premium)]">Output Gerado</h2>
              <div className="flex items-center gap-3">
                {generatedImage && (
                  <button
                    id="download-btn"
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-sm text-[var(--color-navy-deep)] bg-[var(--color-gold-premium)] hover:bg-[#F2B915] transition-colors px-3 py-1.5 rounded-lg font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Imagem
                  </button>
                )}
                {generatedCopy && (
                  <button
                    id="copy-btn"
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-sm text-[var(--color-gray-slate)] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                  >
                    {copied ? <Check className="w-4 h-4 text-[var(--color-success-green)]" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Results Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {(isGeneratingCopy || isGeneratingImage) ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-gray-slate)] space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-[var(--color-gold-premium)] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-[var(--color-gold-premium)] rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="font-mono text-sm animate-pulse">
                    {isGeneratingCopy ? 'Aplicando Brand Voice Rentabiliza...' : 'Renderizando com Nano Banana...'}
                  </p>
                </div>
              ) : (generatedCopy || generatedImage) ? (
                <div className="space-y-8">
                  {generatedImage && (
                    <div className="space-y-4">
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 shadow-2xl relative group">
                        <img 
                          src={generatedImage} 
                          alt="Criativo Gerado" 
                          className="w-full h-auto object-contain max-h-[500px]" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <label htmlFor="overlayText" className="block text-sm font-medium text-[var(--color-gold-premium)] mb-2 flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Texto no Criativo (Editável)
                        </label>
                        <input
                          type="text"
                          id="overlayText"
                          value={overlayText}
                          onChange={(e) => setOverlayText(e.target.value)}
                          placeholder="Cole aqui a melhor headline gerada na copy..."
                          className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-gold-premium)] focus:ring-1 focus:ring-[var(--color-gold-premium)] transition-all"
                        />
                        <p className="text-xs text-[var(--color-gray-slate)] mt-2">
                          O texto acima é renderizado automaticamente dentro da imagem.
                        </p>
                      </div>
                    </div>
                  )}
                  {generatedCopy && (
                    <div className="prose prose-invert prose-gold max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {generatedCopy}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-gray-slate)]/50 text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="font-serif text-xl mb-2 text-white/40">Nenhum conteúdo gerado ainda.</p>
                  <p className="text-sm max-w-md">
                    Preencha o contexto da campanha ao lado e gere o Copy e/ou a Imagem para seus anúncios.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
