// src/components/stock/NewsList.tsx
import React from 'react';
import { NewsArticle } from '@gridstock/types';
import { Card } from '@gridstock/components/ui/Card';
import { Badge } from '@gridstock/components/ui/Badge';

interface NewsListProps {
  news: NewsArticle[];
}

export const NewsList: React.FC<NewsListProps> = ({ news }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold mb-4">Latest News</h3>
      {news.map((article) => (
        <Card key={article.id} className="hover:bg-white/5 transition-colors">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start gap-4">
              <h4 className="font-medium text-lg leading-snug text-slate-100">{article.headline}</h4>
              <Badge variant="neutral">{article.source}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
               <span>{new Date(article.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
               <span>•</span>
               <span className="flex gap-1">
                 {article.relatedTickers.map(t => (
                   <span key={t} className="text-emerald-300/90 font-medium">${t}</span>
                 ))}
               </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
