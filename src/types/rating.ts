export type RatingType = 'like' | 'dislike' | 'star' | 'save';

export interface Rating {
  id: string;
  copyId: string;
  type: RatingType;
  timestamp: number;
}

export interface ComparisonItem {
  copyId: string;
  content: string;
  rating?: RatingType;
}

export interface Comparison {
  id: string;
  itemA: ComparisonItem;
  itemB: ComparisonItem;
  winner?: 'a' | 'b' | 'tie';
  timestamp: number;
}
