import React from 'react';
import { Heart } from 'lucide-react';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import { ProgramCard } from '../../../Workouts/components/ProgramCard';
import WorkoutLogCard from '../../../Workouts/components/WorkoutLogCard';
import { useCurrentUser } from '../../../../hooks/query/useUserQuery';
import { useForkProgram } from '../../../../hooks/query/useProgramQuery';
import { useLanguage } from '../../../../context/LanguageContext';

const ActivityTab = ({ userData, posts, handleWorkoutLogSelect, handleProgramSelect }) => {
  const { t } = useLanguage();
  const { data: currentUser } = useCurrentUser();
  
  // Get fork program mutation
  const { mutateAsync: forkProgram } = useForkProgram();
  const handleFork = async (program) => {
    try {
      const forkedProgram = await forkProgram(program.id);
      return forkedProgram;
    } catch (error) {
      console.error('Error forking program:', error);
      throw error;
    }
  };
  return (
    <div className="animate-fadeIn">
      <h3 className="text-lg font-semibold mb-4">{t('recent_posts')}</h3>
      
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.slice(0, 3).map((post) => (
            <div key={post.id} className="bg-gray-800/40 p-4 rounded-lg hover:bg-gray-800/60 transition-all duration-300 transform hover:scale-[1.01]">
              <div className="flex items-start gap-3">
                <img
                  src={getAvatarUrl(userData.avatar, 40)}
                  alt={`${userData.username}'s ${t('avatar')}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{userData.username}</div>
                      <div className="text-sm text-gray-400">{
                        new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', 
                          month: 'short',
                          day: 'numeric'
                        })
                      }</div>
                    </div>
                    {post.post_type !== 'regular' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        {post.post_type === 'workout_log' ? t('workout') : t(post.post_type)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-200">{post.content}</p>
                  
                  {/* Display workout log if present */}
                  {post.post_type === 'workout_log' && post.workout_log_details && (
                    <div className="mt-3 cursor-pointer" onClick={() => handleWorkoutLogSelect(post.workout_log_details)}>
                      <WorkoutLogCard
                        user={userData.username}
                        logId={post.workout_log_details.id}
                        log={post.workout_log_details}
                        inFeedMode={true}
                      />
                    </div>
                  )}
                  
                  {/* Display program if present */}
                  {post.post_type === 'program' && post.program_details && (
                    <div className="mt-3 cursor-pointer" onClick={() => handleProgramSelect(post.program_details)}>
                      <ProgramCard
                        programId={post.program_details.id}
                        program={post.program_details}
                        inFeedMode={true}
                        onFork={handleFork}
                        currentUser={currentUser?.username}
                      />
                    </div>
                  )}
                  
                  {post.image && (
                    <img
                      src={getAvatarUrl(post.image)}
                      alt={t('post_thumbnail')}
                      className="mt-3 rounded-lg w-full object-cover max-h-60"
                    />
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 text-gray-400">
                    <div className="flex items-center gap-1 text-sm">
                      <Heart className="w-4 h-4" />
                      {post.likes_count || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {posts.length > 3 && (
            <div className="text-center mt-2">
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                {t('view_all_posts', {count: posts.length})}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-800/30 rounded-xl">
          <p className="text-gray-400">{t('no_posts')}</p>
        </div>
      )}
    </div>
  );
};

export default ActivityTab;