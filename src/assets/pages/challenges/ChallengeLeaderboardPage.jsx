import React from 'react';
import { Trophy } from 'lucide-react';

const ChallengeLeaderboardPage = ({
  theme,
  leaderboard,
  leaderboardScope,
  setLeaderboardScope,
  fetchLeaderboard,
  getRankColor,
  currentUserId,
}) => {
  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black">Leaderboard</h2>
          <p className={`${theme.textSoft} text-sm`}>Top challengers ranked by XP</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['global', 'university', 'department'].map((scope) => (
            <button
              key={scope}
              onClick={() => { setLeaderboardScope(scope); fetchLeaderboard(scope); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                leaderboardScope === scope ? 'bg-indigo-600 text-white' : theme.soft
              }`}
            >
              {scope === 'global' ? '🌍 Global' : scope === 'university' ? '🏫 University' : '📚 Department'}
            </button>
          ))}
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className={`${theme.card} rounded-[2rem] p-10 text-center`}>
          <Trophy size={50} className="mx-auto mb-4 opacity-50" />
          <h3 className="font-bold text-xl mb-2">No Rankings Yet</h3>
          <p className={`text-sm ${theme.textSoft}`}>Complete challenges to appear on the leaderboard.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((item, index) => {
            const isMe = item.uid === currentUserId;
            return (
              <div key={item.id || index} className={`${theme.card} rounded-2xl p-4 flex items-center gap-4 ${isMe ? 'ring-2 ring-indigo-500' : ''}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white' : index === 2 ? 'bg-orange-600 text-white' : theme.soft
                }`}>
                  {item.position || index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name || 'Student'}</p>
                  <p className={`text-xs ${theme.textSoft}`}>{item.university || ''} {item.department ? `· ${item.department}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{item.xp || 0} XP</p>
                  <p className="text-xs font-medium" style={{ color: getRankColor(item.rank) }}>{item.rank || 'Bronze'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChallengeLeaderboardPage;
