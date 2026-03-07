import { useState, useEffect } from 'react';
import { Rating, Comparison, RatingType } from '../types/rating';

const RATINGS_KEY = 'rentabiliza_ratings';
const COMPARISONS_KEY = 'rentabiliza_comparisons';

export function useRating() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedRatings = localStorage.getItem(RATINGS_KEY);
      const savedComparisons = localStorage.getItem(COMPARISONS_KEY);

      if (savedRatings) setRatings(JSON.parse(savedRatings));
      if (savedComparisons) setComparisons(JSON.parse(savedComparisons));
    } catch (error) {
      console.error('Error loading ratings from localStorage:', error);
    }
  }, []);

  // Save ratings to localStorage
  const saveRatings = (newRatings: Rating[]) => {
    setRatings(newRatings);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(newRatings));
  };

  // Save comparisons to localStorage
  const saveComparisons = (newComparisons: Comparison[]) => {
    setComparisons(newComparisons);
    localStorage.setItem(COMPARISONS_KEY, JSON.stringify(newComparisons));
  };

  // Add or update rating
  const addRating = (copyId: string, type: RatingType) => {
    const newRating: Rating = {
      id: `${copyId}-${type}-${Date.now()}`,
      copyId,
      type,
      timestamp: Date.now(),
    };

    const filtered = ratings.filter(r => r.copyId !== copyId);
    saveRatings([newRating, ...filtered]);
  };

  // Get rating for a specific copy
  const getRating = (copyId: string): RatingType | null => {
    const rating = ratings.find(r => r.copyId === copyId);
    return rating ? rating.type : null;
  };

  // Get all ratings for a copy (for analytics)
  const getRatingsForCopy = (copyId: string) => {
    return ratings.filter(r => r.copyId === copyId);
  };

  // Add comparison
  const addComparison = (comparison: Omit<Comparison, 'id' | 'timestamp'>) => {
    const newComparison: Comparison = {
      ...comparison,
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };

    saveComparisons([newComparison, ...comparisons]);
    return newComparison;
  };

  // Get comparison stats
  const getComparisonStats = () => {
    const stats = {
      totalComparisons: comparisons.length,
      aWins: comparisons.filter(c => c.winner === 'a').length,
      bWins: comparisons.filter(c => c.winner === 'b').length,
      ties: comparisons.filter(c => c.winner === 'tie').length,
    };
    return stats;
  };

  return {
    ratings,
    comparisons,
    addRating,
    getRating,
    getRatingsForCopy,
    addComparison,
    getComparisonStats,
  };
}
