import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ChallengeAchievementsPage = ({ theme, achievements, getAchievementIcon }) => {
  return (
    <div>
      <h2 className="text-2xl font-black mb-2">Achievements</h2>
      <p className={`${theme.textSoft} mb-6`}>Complete challenges to unlock achievements</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <div key={ach.id} className={`${theme.card} rounded-[2rem] p-5 ${ach.unlocked ? '' : 'opacity-60'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${ach.unlocked ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                {getAchievementIcon(ach.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm">{ach.title}</h4>
                <p className={`text-xs ${theme.textSoft}`}>{ach.unlocked ? 'Unlocked 🎉' : `${ach.value}/${ach.target}`}</p>
              </div>
              {ach.unlocked && <CheckCircle2 size={18} className="text-green-500" />}
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10">
              <div className={`h-full rounded-full transition-all ${ach.unlocked ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, ach.progress * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengeAchievementsPage;
