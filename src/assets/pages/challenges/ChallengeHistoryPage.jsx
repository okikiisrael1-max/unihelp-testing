import React from 'react';
import { Clock } from 'lucide-react';

const ChallengeHistoryPage = ({ theme, history, getStatusColor }) => {
  return (
    <div>
      <h2 className="text-2xl font-black mb-2">Challenge History</h2>
      <p className={`${theme.textSoft} mb-6`}>Your past challenge attempts</p>
      {history.length === 0 ? (
        <div className={`${theme.card} rounded-[2rem] p-10 text-center`}>
          <Clock size={50} className="mx-auto mb-4 opacity-50" />
          <h3 className="font-bold text-xl mb-2">No History Yet</h3>
          <p className={`text-sm ${theme.textSoft}`}>Complete a challenge to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className={`${theme.card} rounded-[2rem] p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.accuracy)} bg-current/10`}>
                    {item.status}
                  </span>
                  <span className="font-medium text-sm capitalize">{item.category} Challenge</span>
                </div>
                <span className={`text-xs ${theme.textSoft}`}>+{item.xpEarned} XP</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className={`${theme.soft} rounded-xl p-2 text-center`}>
                  <p className={`text-xs ${theme.textSoft}`}>Score</p>
                  <p className="font-bold">{item.score}/{item.totalQuestions}</p>
                </div>
                <div className={`${theme.soft} rounded-xl p-2 text-center`}>
                  <p className={`text-xs ${theme.textSoft}`}>Accuracy</p>
                  <p className="font-bold">{item.accuracy}%</p>
                </div>
                <div className={`${theme.soft} rounded-xl p-2 text-center`}>
                  <p className={`text-xs ${theme.textSoft}`}>Duration</p>
                  <p className="font-bold">{item.durationSeconds || 0}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeHistoryPage;
