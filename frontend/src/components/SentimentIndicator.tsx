
import React from 'react';

type SentimentType = 'positive' | 'neutral' | 'negative';

interface SentimentIndicatorProps {
  sentiment: SentimentType | null;
  intensity?: number | null;
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = () => {
  // Sentiment indicator disabled - return nothing
  return null;
};

export default SentimentIndicator;