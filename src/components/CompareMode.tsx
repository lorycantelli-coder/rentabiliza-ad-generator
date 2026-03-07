import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { RatingBar } from './RatingBar';

interface CompareModeProps {
  isOpen: boolean;
  onClose: () => void;
  itemA: {
    id: string;
    content: string;
    title: string;
  };
  itemB: {
    id: string;
    content: string;
    title: string;
  };
  currentRatings: { [key: string]: any };
  onRate: (id: string, type: any) => void;
  onSelectWinner: (winner: 'a' | 'b' | 'tie') => void;
}

export function CompareMode({
  isOpen,
  onClose,
  itemA,
  itemB,
  currentRatings,
  onRate,
  onSelectWinner,
}: CompareModeProps) {
  const [winner, setWinner] = useState<'a' | 'b' | 'tie' | null>(null);

  if (!isOpen) return null;

  const handleSelectWinner = (w: 'a' | 'b' | 'tie') => {
    setWinner(w);
    onSelectWinner(w);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-navy-deep)] border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black/40 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-serif text-[var(--color-gold-premium)]">
            A/B Testing — Qual cópia é melhor?
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-gray-slate)] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Item A */}
            <div
              className={`border-2 rounded-xl p-6 transition-all ${
                winner === 'a'
                  ? 'border-green-400 bg-green-400/5'
                  : 'border-white/10 bg-white/3 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">{itemA.title}</h3>
                {winner === 'a' && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>

              <div className="bg-black/40 rounded-lg p-4 mb-6 min-h-[200px]">
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                  {itemA.content}
                </p>
              </div>

              <div className="space-y-3">
                <RatingBar
                  copyId={itemA.id}
                  currentRating={currentRatings[itemA.id] || null}
                  onRate={(type) => onRate(itemA.id, type)}
                />

                <button
                  onClick={() => handleSelectWinner('a')}
                  className={`w-full py-2 px-4 rounded-lg border font-medium transition-all ${
                    winner === 'a'
                      ? 'bg-green-400/20 border-green-400 text-green-400'
                      : 'border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {winner === 'a' ? '✓ Vencedora' : 'Escolher esta'}
                </button>
              </div>
            </div>

            {/* Item B */}
            <div
              className={`border-2 rounded-xl p-6 transition-all ${
                winner === 'b'
                  ? 'border-green-400 bg-green-400/5'
                  : 'border-white/10 bg-white/3 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">{itemB.title}</h3>
                {winner === 'b' && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>

              <div className="bg-black/40 rounded-lg p-4 mb-6 min-h-[200px]">
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                  {itemB.content}
                </p>
              </div>

              <div className="space-y-3">
                <RatingBar
                  copyId={itemB.id}
                  currentRating={currentRatings[itemB.id] || null}
                  onRate={(type) => onRate(itemB.id, type)}
                />

                <button
                  onClick={() => handleSelectWinner('b')}
                  className={`w-full py-2 px-4 rounded-lg border font-medium transition-all ${
                    winner === 'b'
                      ? 'bg-green-400/20 border-green-400 text-green-400'
                      : 'border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {winner === 'b' ? '✓ Vencedora' : 'Escolher esta'}
                </button>
              </div>
            </div>
          </div>

          {/* Tie Option */}
          <div className="border border-white/10 rounded-xl p-4 bg-white/3">
            <button
              onClick={() => handleSelectWinner('tie')}
              className={`w-full py-2 px-4 rounded-lg border font-medium transition-all ${
                winner === 'tie'
                  ? 'bg-blue-400/20 border-blue-400 text-blue-400'
                  : 'border-white/10 text-white hover:bg-white/5'
              }`}
            >
              {winner === 'tie' ? '✓ Empate' : 'Ambas são boas (Empate)'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
