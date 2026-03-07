import { useState, useEffect } from 'react';
import { TEMPLATES } from './constants';
import { generateImage } from './services/geminiService';
import { generateAdCopyWithValidation, generateQuickCopy } from './services/copyGenerationService';
import { Loader2, Sparkles, Copy, Check, ChevronRight, LayoutTemplate, Image as ImageIcon, Download, Type, History, X, Zap, FileJson, ClipboardCheck, Zap as CompareIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RatingBar } from './components/RatingBar';
import { CompareMode } from './components/CompareMode';
import { useRating } from './hooks/useRating';
import { RatingType } from './types/rating';

interface ParsedVariation {
  title: string;
  headline: string;
  body: string;
  cta: string;
  raw: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')          // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')       // bold
    .replace(/\*(.+?)\*/g, '$1')           // italic
    .replace(/`(.+?)`/g, '$1')             // inline code
    .replace(/^[-*+]\s+/gm, '• ')         // unordered list
    .replace(/^\d+\.\s+/gm, '')           // ordered list
    .replace(/^>\s+/gm, '')               // blockquote
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // links
    .replace(/\n{3,}/g, '\n\n')           // excess blank lines
    .trim();
}

function parseVariations(text: string): ParsedVariation[] | null {
  const sections = text.split(/\n---\n|\n---$|^---\n/).filter(s => s.trim());
  if (sections.length < 2) return null;

  const variations: ParsedVariation[] = [];

  for (const section of sections) {
    const headlineMatch = section.match(/\*\*Headline:\*\*\s*(.+)/);
    if (!headlineMatch) continue;

    const titleMatch = section.match(/###\s+(.+)/);
    const copyMatch = section.match(/\*\*Copy:\*\*\s*([\s\S]+?)(?=\n\*\*CTA:|$)/);
    const ctaMatch = section.match(/\*\*CTA:\*\*\s*(.+)/);

    variations.push({
      title: titleMatch ? titleMatch[1].trim() : `Variação ${variations.length + 1}`,
      headline: headlineMatch[1].trim(),
      body: copyMatch ? copyMatch[1].trim() : '',
      cta: ctaMatch ? ctaMatch[1].trim() : '',
      raw: section.trim(),
    });
  }

  return variations.length >= 2 ? variations : null;
}

interface HistoryItem {
  id: string;
  templateId: string;
  templateName: string;
  copy: string | null;
  image: string | null;
  overlayText: string;
  createdAt: number;
}

const HISTORY_KEY = 'rentabiliza_history';
const MAX_HISTORY = 20;

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

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
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [copiedVariation, setCopiedVariation] = useState<number | null>(null);
  const [copiedClean, setCopiedClean] = useState(false);

  // Rating System
  const { getRating, addRating, addComparison } = useRating();
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [compareVariations, setCompareVariations] = useState<{ a: number; b: number } | null>(null);

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

      ctx.drawImage(img, 0, 0);

      if (overlayText) {
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(4, 8, 18, 0)');
        gradient.addColorStop(1, 'rgba(4, 8, 18, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#DCA405';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const fontSize = Math.max(canvas.width * 0.05, 30);
        ctx.font = `bold ${fontSize}px "Playfair Display", Georgia, serif`;

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

        let y = canvas.height - (canvas.height * 0.08);
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

  const addToHistory = (copy: string | null, image: string | null, overlay: string) => {
    if (!copy && !image) return;
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      templateId: selectedTemplateId,
      templateName: selectedTemplate.name,
      copy,
      image,
      overlayText: overlay,
      createdAt: Date.now(),
    };
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, MAX_HISTORY);
      saveHistory(updated);
      return updated;
    });
  };

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
      const result = await generateAdCopyWithValidation(selectedTemplateId, formData);

      if (!result.copy || result.copy.trim() === '') {
        throw new Error("A IA retornou uma resposta vazia. Tente mudar o contexto.");
      }

      // Show validation feedback if there were issues
      if (result.issues.length > 0) {
        console.warn('⚠️ Copy gerado com algumas advertências:', result.issues);
      }

      if (result.refined) {
        console.log('✨ Copy foi refinado automaticamente para melhor qualidade');
      }

      console.log(`📊 Score de qualidade: ${result.validationScore.toFixed(1)}/10`);

      setGeneratedCopy(result.copy);
      setSelectedVariation(null);
      addToHistory(result.copy, generatedImage, overlayText);
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

      const copyPrompt = `Atuando como Copywriter Sênior da Rentabiliza, crie UMA ÚNICA FRASE CURTA (máximo 6 palavras) de altíssimo impacto para ser a headline sobreposta na imagem do anúncio.

      Contexto da campanha: ${contextValues}.

      REGRAS:
      1. NÃO SEJA GENÉRICO. Proibido: "Invista no seu futuro", "Realize sonhos", "O melhor investimento".
      2. Seja agressivo, data-driven ou contrariano.
      3. Use números se possível (ex: 18.5% a.a., R$ 420M, 10 anos).
      4. A frase deve ser um hook que faça a pessoa parar de rolar o feed.

      Exemplos bons:
      - "Renda fixa perde para inflação."
      - "ROI de 18.5% com IA."
      - "Imóveis sem lidar com inquilinos."

      Retorne APENAS a frase, sem aspas, sem introduções.`;

      let imageResult = '';
      let shortCopyResult = 'Rentabiliza: Invista com Inteligência';

      try {
        imageResult = await generateImage(prompt, aspectRatio);
      } catch (imgErr: any) {
        throw new Error(`Erro na imagem: ${imgErr.message}`);
      }

      try {
        const copyRes = await generateQuickCopy(copyPrompt);
        if (copyRes && copyRes.copy && copyRes.copy.trim() !== '') {
          // Extrai apenas a primeira variação para headline
          const firstVariation = copyRes.copy.split('---')[1] || copyRes.copy;
          const headlineMatch = firstVariation.match(/\*\*Headline:\*\*\s*(.+)/);
          if (headlineMatch) {
            shortCopyResult = headlineMatch[1].replace(/["*]/g, '').trim();
          }
        }
      } catch (copyErr) {
        console.error("Erro ao gerar copy curta, usando fallback", copyErr);
      }

      setBaseImage(imageResult);
      setOverlayText(shortCopyResult);
      addToHistory(generatedCopy, imageResult, shortCopyResult);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao gerar a imagem.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleQuickGenerate = async () => {
    if (!quickInput.trim()) return;
    setIsQuickGenerating(true);
    setError(null);
    setGeneratedCopy(null);
    setGeneratedImage(null);
    try {
      const result = await generateQuickCopy(quickInput.trim());
      if (!result.copy || result.copy.trim() === '') {
        throw new Error('A IA retornou uma resposta vazia. Tente reformular.');
      }

      // Show validation feedback
      if (result.issues.length > 0) {
        console.warn('⚠️ Variações geradas com avisos:', result.issues);
      }

      setGeneratedCopy(result.copy);
      setSelectedVariation(null);
      addToHistory(result.copy, null, '');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao gerar o copy.');
    } finally {
      setIsQuickGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedCopy) {
      navigator.clipboard.writeText(generatedCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyClean = () => {
    if (!generatedCopy) return;
    navigator.clipboard.writeText(stripMarkdown(generatedCopy));
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: isQuickMode ? 'quick' : 'complete',
      template: isQuickMode ? null : { id: selectedTemplateId, name: selectedTemplate.name },
      formData: isQuickMode ? { input: quickInput } : formData,
      copy: generatedCopy
        ? { raw: generatedCopy, clean: stripMarkdown(generatedCopy) }
        : null,
      image: generatedImage
        ? { overlayText, dataUrl: generatedImage }
        : null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rentabiliza-campaign-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
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

  const handleLoadFromHistory = (item: HistoryItem) => {
    const template = TEMPLATES.find(t => t.id === item.templateId);
    if (template) setSelectedTemplateId(item.templateId);
    if (item.copy) setGeneratedCopy(item.copy);
    if (item.image) {
      setBaseImage(item.image);
      setOverlayText(item.overlayText);
    }
    setShowHistory(false);
    setError(null);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveHistory(updated);
      return updated;
    });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleRateVariation = (variationIndex: number, ratingType: RatingType) => {
    const copyId = `variation-${selectedTemplateId}-${variationIndex}`;
    addRating(copyId, ratingType);
  };

  const handleOpenCompare = (indexA: number, indexB: number) => {
    setCompareVariations({ a: indexA, b: indexB });
    setShowCompareMode(true);
  };

  const handleSelectWinner = (winner: 'a' | 'b' | 'tie') => {
    if (!compareVariations || !generatedCopy) return;

    const variations = parseVariations(generatedCopy);
    if (!variations) return;

    const varA = variations[compareVariations.a];
    const varB = variations[compareVariations.b];

    addComparison({
      itemA: {
        copyId: `variation-${selectedTemplateId}-${compareVariations.a}`,
        content: varA.raw,
      },
      itemB: {
        copyId: `variation-${selectedTemplateId}-${compareVariations.b}`,
        content: varB.raw,
      },
      winner,
    });
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${showHistory ? 'bg-[var(--color-gold-premium)]/10 text-[var(--color-gold-premium)] border border-[var(--color-gold-premium)]/30' : 'text-[var(--color-gray-slate)] hover:text-white hover:bg-white/5'}`}
            >
              <History className="w-4 h-4" />
              Histórico
              {history.length > 0 && (
                <span className="bg-[var(--color-gold-premium)] text-[var(--color-navy-deep)] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {history.length > 9 ? '9+' : history.length}
                </span>
              )}
            </button>
            <div className="text-sm text-[var(--color-gray-slate)] font-mono">
              v4.0 • Copy & Image AI
            </div>
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-medium flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--color-gold-premium)]" />
                Criativos Gerados ({history.length})
              </h2>
              <button onClick={() => setShowHistory(false)} className="text-[var(--color-gray-slate)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="px-6 py-8 text-center text-[var(--color-gray-slate)] text-sm">
                Nenhum criativo gerado ainda. Gere seu primeiro copy ou imagem acima.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadFromHistory(item)}
                    className="px-6 py-4 flex items-start gap-4 hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    {item.image && (
                      <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[var(--color-gold-premium)] font-medium">{item.templateName}</span>
                        <span className="text-xs text-[var(--color-gray-slate)]">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.copy && (
                        <p className="text-sm text-white/70 line-clamp-2">{item.copy.replace(/[#*]/g, '').slice(0, 120)}...</p>
                      )}
                      {item.overlayText && !item.copy && (
                        <p className="text-sm text-white/70 italic">"{item.overlayText}"</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-gray-slate)] hover:text-red-400 transition-all flex-shrink-0 mt-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-8">

          {/* Mode Toggle */}
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setIsQuickMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                !isQuickMode
                  ? 'bg-[var(--color-gold-premium)]/10 text-[var(--color-gold-premium)] border-r border-[var(--color-gold-premium)]/30'
                  : 'text-[var(--color-gray-slate)] hover:text-white hover:bg-white/5 border-r border-white/10'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              Modo Completo
            </button>
            <button
              onClick={() => setIsQuickMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                isQuickMode
                  ? 'bg-[var(--color-gold-premium)]/10 text-[var(--color-gold-premium)]'
                  : 'text-[var(--color-gray-slate)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-4 h-4" />
              Quick Generate
            </button>
          </div>

          {/* Quick Generate Mode */}
          {isQuickMode && (
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-[var(--color-gold-premium)]" />
                <h2 className="text-lg font-medium">Quick Generate</h2>
              </div>
              <p className="text-sm text-[var(--color-gray-slate)] mb-6">
                Descreva em uma linha o que quer anunciar. A IA gera 3 variações prontas.
              </p>
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickGenerate();
                  }
                }}
                placeholder="ex: Captação de leads para investidores que estão cansados de renda fixa"
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-gold-premium)] focus:ring-1 focus:ring-[var(--color-gold-premium)] transition-all resize-none"
              />
              <button
                onClick={handleQuickGenerate}
                disabled={isQuickGenerating || !quickInput.trim()}
                className="mt-4 w-full bg-[var(--color-gold-premium)] hover:bg-[#F2B915] text-[var(--color-navy-deep)] font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,164,5,0.2)] hover:shadow-[0_0_30px_rgba(220,164,5,0.4)]"
              >
                {isQuickGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando 3 variações...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Gerar Agora
                  </>
                )}
              </button>
              <p className="text-xs text-[var(--color-gray-slate)] mt-3 text-center">
                Enter para gerar · Shift+Enter para nova linha
              </p>
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </section>
          )}

          {/* Template Selection + Inputs — Modo Completo */}
          {!isQuickMode && (<><section className="bg-white/5 border border-white/10 rounded-2xl p-6">
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

            <div className="mt-8">
              <button
                id="generate-image-btn"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="w-full bg-[var(--color-gold-premium)] hover:bg-[#F2B915] text-[var(--color-navy-deep)] font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,164,5,0.2)] hover:shadow-[0_0_30px_rgba(220,164,5,0.4)]"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Ad...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Gerar Ad Premium
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </section></>)}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
          <section className="bg-white/5 border border-white/10 rounded-2xl h-full min-h-[600px] flex flex-col overflow-hidden relative">

            {/* Results Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[var(--color-gold-premium)]">Output Gerado</h2>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {generatedImage && (
                  <>
                    <button
                      id="download-btn"
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-sm text-[var(--color-navy-deep)] bg-[var(--color-gold-premium)] hover:bg-[#F2B915] transition-colors px-3 py-1.5 rounded-lg font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Ad
                    </button>
                    <button
                      onClick={handleExportJSON}
                      title="Exporta imagem em JSON para integração com outras ferramentas"
                      className="flex items-center gap-1.5 text-sm text-[var(--color-gray-slate)] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                    >
                      <FileJson className="w-4 h-4" />
                      JSON
                    </button>
                  </>
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
                    {isGeneratingCopy ? 'Aplicando Brand Voice Rentabiliza...' : 'Renderizando criativo premium...'}
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 shadow-2xl relative group">
                    <img
                      src={generatedImage}
                      alt="Ad Gerado"
                      className="w-full h-auto object-contain max-h-[500px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label htmlFor="overlayText" className="block text-sm font-medium text-[var(--color-gold-premium)] mb-2 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Headline do Ad (Editável)
                    </label>
                    <input
                      type="text"
                      id="overlayText"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Edite a headline que aparece no Ad..."
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-gold-premium)] focus:ring-1 focus:ring-[var(--color-gold-premium)] transition-all"
                    />
                    <p className="text-xs text-[var(--color-gray-slate)] mt-2">
                      A headline acima é renderizada automaticamente no Ad.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-gray-slate)]/50 text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="font-serif text-xl mb-2 text-white/40">Nenhum Ad gerado ainda.</p>
                  <p className="text-sm max-w-md">
                    Preencha o contexto da campanha ao lado e gere seu Ad Premium com imagem + headline.
                  </p>
                  {history.length > 0 && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="mt-4 flex items-center gap-2 text-sm text-[var(--color-gold-premium)]/70 hover:text-[var(--color-gold-premium)] transition-colors"
                    >
                      <History className="w-4 h-4" />
                      Ver {history.length} criativo{history.length > 1 ? 's' : ''} anterior{history.length > 1 ? 'es' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Compare Mode Modal */}
      {showCompareMode && generatedCopy && compareVariations !== null && (() => {
        const variations = parseVariations(generatedCopy);
        if (!variations) return null;

        const varA = variations[compareVariations.a];
        const varB = variations[compareVariations.b];

        return (
          <CompareMode
            isOpen={showCompareMode}
            onClose={() => {
              setShowCompareMode(false);
              setCompareVariations(null);
            }}
            itemA={{
              id: `variation-${selectedTemplateId}-${compareVariations.a}`,
              title: varA.title,
              content: varA.raw,
            }}
            itemB={{
              id: `variation-${selectedTemplateId}-${compareVariations.b}`,
              title: varB.title,
              content: varB.raw,
            }}
            currentRatings={{
              [`variation-${selectedTemplateId}-${compareVariations.a}`]: getRating(
                `variation-${selectedTemplateId}-${compareVariations.a}`
              ),
              [`variation-${selectedTemplateId}-${compareVariations.b}`]: getRating(
                `variation-${selectedTemplateId}-${compareVariations.b}`
              ),
            }}
            onRate={handleRateVariation}
            onSelectWinner={handleSelectWinner}
          />
        );
      })()}
    </div>
  );
}
