import React from 'react';
import { ArrowRight } from 'lucide-react';

const ChallengeCategoriesPage = ({ theme, stats, handleStartQuiz, getCategoryIcon, challengeCategories }) => {
  return (
    <div>
      <h2 className="text-2xl font-black mb-2">Challenge Categories</h2>
      <p className={`${theme.textSoft} mb-6`}>Choose a category to start answering questions</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challengeCategories.map((cat) => {
          const catStats = stats?.categoryStats?.[cat.id] || {};
          return (
            <button
              key={cat.id}
              onClick={() => handleStartQuiz(cat)}
              className={`${theme.card} rounded-[2rem] p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cat.tone}20`, color: cat.tone }}>
                  {getCategoryIcon(cat.icon, 24)}
                </div>
                <ArrowRight size={18} className={`${theme.textSoft}`} />
              </div>
              <h3 className="font-bold text-lg">{cat.title}</h3>
              <p className={`text-sm ${theme.textSoft} mb-3`}>{cat.subtitle}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme.textSoft}`}>{cat.questionCount.toLocaleString()} questions</span>
                {catStats.attempted > 0 && (
                  <span className="text-xs font-bold text-indigo-500">{catStats.correct}/{catStats.attempted}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengeCategoriesPage;
