import React from 'react';
import { Activity, Flame, Sparkles, ArrowRight } from 'lucide-react';

const ChallengeOverviewPage = ({
  theme,
  stats,
  history,
  handleStartQuiz,
  getRankColor,
  getStatusColor,
  getCategoryIcon,
  dark,
  challengeCategories,
}) => {
  return (
    <>
      <div className={`relative overflow-hidden rounded-[2rem] p-6 md:p-8 mb-8 border ${
        dark
          ? 'bg-linear-to-br from-indigo-950 via-[#0f172a] to-black border-white/10'
          : 'bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 border-indigo-400/20 text-white'
      }`}>
        <div className="absolute top-0 right-0 opacity-20"><Sparkles size={180} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={24} className="text-orange-400" />
            <span className="text-2xl font-black">{stats?.currentStreak || 0} Day Streak</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-white/70">Total XP</p>
              <p className="text-2xl font-black">{stats?.xp || 0}</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-white/70">Rank</p>
              <p className="text-2xl font-black" style={{ color: getRankColor(stats?.rank) }}>{stats?.rank || 'Bronze'}</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-white/70">Questions</p>
              <p className="text-2xl font-black">{stats?.questionsAnswered || 0}</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-white/70">Accuracy</p>
              <p className="text-2xl font-black">{stats?.accuracy || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-black mb-4">Quick Challenge</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {challengeCategories.slice(0, 4).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleStartQuiz(cat)}
              className={`${theme.card} rounded-[1.5rem] p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cat.tone}20`, color: cat.tone }}>
                  {getCategoryIcon(cat.icon)}
                </div>
              </div>
              <h4 className="font-bold text-sm">{cat.title}</h4>
              <p className={`text-xs ${theme.textSoft} mt-1`}>{cat.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`${theme.card} rounded-[2rem] p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Recent Activity</h3>
          <span className={`text-sm ${theme.textSoft}`}>Latest attempts</span>
        </div>
        {history.length === 0 ? (
          <div className={`${theme.soft} rounded-2xl p-8 text-center`}>
            <Activity size={40} className="mx-auto mb-3 opacity-50" />
            <p className={`text-sm ${theme.textSoft}`}>No activity yet. Start a challenge!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className={`${theme.soft} rounded-2xl p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${getStatusColor(item.accuracy)} bg-current/10`}>
                    {item.accuracy}%
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{item.category} Challenge</p>
                    <p className={`text-xs ${theme.textSoft}`}>{item.score}/{item.totalQuestions} correct · +{item.xpEarned} XP</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${getStatusColor(item.accuracy)}`}>{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ChallengeOverviewPage;
