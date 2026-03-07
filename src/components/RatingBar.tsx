import { ThumbsUp, ThumbsDown, Star, Bookmark } from 'lucide-react';
import { RatingType } from '../types/rating';

interface RatingBarProps {
  copyId: string;
  currentRating: RatingType | null;
  onRate: (type: RatingType) => void;
  compact?: boolean;
}

export function RatingBar({ copyId, currentRating, onRate, compact = false }: RatingBarProps) {
  const ratingButtons = [
    {
      type: 'like' as RatingType,
      icon: ThumbsUp,
      label: 'Gostei',
      color: 'text-green-400 hover:bg-green-400/10',
      activeBg: 'bg-green-400/20',
    },
    {
      type: 'dislike' as RatingType,
      icon: ThumbsDown,
      label: 'Não gostei',
      color: 'text-red-400 hover:bg-red-400/10',
      activeBg: 'bg-red-400/20',
    },
    {
      type: 'star' as RatingType,
      icon: Star,
      label: 'Favoritar',
      color: 'text-yellow-400 hover:bg-yellow-400/10',
      activeBg: 'bg-yellow-400/20',
    },
    {
      type: 'save' as RatingType,
      icon: Bookmark,
      label: 'Salvar',
      color: 'text-blue-400 hover:bg-blue-400/10',
      activeBg: 'bg-blue-400/20',
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${compact ? 'flex-wrap' : ''}`}>
      {ratingButtons.map(({ type, icon: Icon, label, color, activeBg }) => {
        const isActive = currentRating === type;
        return (
          <button
            key={type}
            onClick={() => onRate(type)}
            title={label}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
              isActive
                ? `${activeBg} border-white/20 ${color}`
                : `border-white/10 text-[var(--color-gray-slate)] ${color}`
            } ${compact ? 'text-xs' : 'text-sm'}`}
          >
            <Icon className={`w-${compact ? 3 : 4} h-${compact ? 3 : 4}`} />
            {!compact && <span className="font-medium">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
