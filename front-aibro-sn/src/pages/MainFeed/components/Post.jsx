import React, { useState, useRef } from 'react';
import { User, MoreVertical, Heart, MessageCircle, Share2, Send, 
  Trash2, X, Edit, Activity, Users, Dumbbell } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { ProgramCard } from '../../Workouts/components/ProgramCard';
import WorkoutLogCard from '../../Workouts/components/WorkoutLogCard';
import SharePostModal from './SharePostModal';
import { getPostTypeDetails } from '../../../utils/postTypeUtils';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  useProgram, 
  useLog, 
  useUser, 
  useForkProgram
} from '../../../hooks/query';

const Post = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onShare, 
  onEdit, 
  onDelete,
  userData,
  onProgramClick,
  onForkProgram 
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { t } = useLanguage();
  
  // Use React Query hooks instead of direct API calls
  const programId = post.post_type === 'program' ? 
    (post.program_id || (post.program_details && 
      (typeof post.program_details === 'string' 
        ? JSON.parse(post.program_details).id 
        : post.program_details.id))) 
    : null;
  
  const { data: programData } = useProgram(programId, {
    enabled: !!programId && post.post_type === 'program'
  });
  
  // Fork program mutation
  const forkProgramMutation = useForkProgram();

  const handleShareSuccess = (newSharedPost) => {
    if (onShare) {
      onShare(post.id, newSharedPost);
    }
    setIsShareModalOpen(false);
  };

  const handleProgramClick = (program) => {
    if (onProgramClick) {
      onProgramClick(program);
    }
  };

  const handleForkProgram = async (programId) => {
    try {
      const forkedProgram = await forkProgramMutation.mutateAsync(programId);
      return forkedProgram;
    } catch (error) {
      console.error("Error forking program:", error);
      throw error;
    }
  };

  const PostMenu = ({ isOpen }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute right-0 top-10 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-10">
        {post.user_username === currentUser && (
          <>
            <button
              onClick={() => {
                onEdit(post);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              {t('edit_post')}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t('confirm_delete_post'))) {
                  onDelete(post.id);
                }
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('delete_post')}
            </button>
          </>
        )}
        <button
          onClick={() => setShowMenu(false)}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    );
  };

  const SharedPostContent = ({ originalPost, currentUser }) => {
    // Use React Query for shared post data
    const { 
      data: workoutLog, 
      isLoading: logLoading 
    } = useLog(
      originalPost.post_type === 'workout_log' && originalPost.workout_log_details?.id, 
      { enabled: originalPost.post_type === 'workout_log' && !!originalPost.workout_log_details?.id }
    );
    
    const { 
      data: sharedProgramData,
      isLoading: programLoading 
    } = useProgram(
      originalPost.post_type === 'program' && 
        (originalPost.program_id || (originalPost.program_details && 
          (typeof originalPost.program_details === 'string' 
            ? JSON.parse(originalPost.program_details).id 
            : originalPost.program_details.id))),
      { 
        enabled: originalPost.post_type === 'program' && 
          !!(originalPost.program_id || originalPost.program_details) 
      }
    );
    
    const { 
      data: userDetails,
      isLoading: userLoading 
    } = useUser(
      userData?.id || originalPost.user_id,
      { enabled: !!userData?.id || !!originalPost.user_id }
    );

    const loading = logLoading || programLoading || userLoading;

    if (loading) {
      return (
        <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {originalPost.user_username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-white">{originalPost.user_username}</p>
              <p className="text-xs text-gray-400">
                {new Date(originalPost.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <p className="text-gray-200 mb-3">{originalPost.content}</p>
          
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-gray-700 rounded-lg"></div>
            <div className="h-5 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    // Get post type details for the original post
    const postTypeDetails = originalPost.post_type 
      ? getPostTypeDetails(originalPost.post_type) 
      : getPostTypeDetails('regular');
    const postTypeGradient = postTypeDetails.colors.gradient;

    // Determine what program data to use
    const effectiveProgramData = sharedProgramData || 
      (typeof originalPost.program_details === 'string' 
        ? JSON.parse(originalPost.program_details) 
        : originalPost.program_details);

    // Determine what workout log data to use
    const effectiveWorkoutLog = workoutLog || 
      (typeof originalPost.workout_log_details === 'object' 
        ? originalPost.workout_log_details 
        : null);

    return (
      <div className={`mt-4 bg-gray-800/50 rounded-lg p-4 border ${postTypeDetails.colors.border}`}>
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${postTypeGradient} flex items-center justify-center overflow-hidden`}>
          {userDetails?.avatar ? (
            <img 
              src={getAvatarUrl(userDetails.avatar)}
              alt={originalPost.user_username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {originalPost.user_username[0].toUpperCase()}
            </span>
          )}
        </div>
          <div>
            <p className="font-medium text-white">{originalPost.user_username}</p>
            <p className="text-xs text-gray-400">
              {new Date(originalPost.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <p className="text-gray-200 mb-3">{originalPost.content}</p>
        
        {/* Use WorkoutLogCard component for workout logs */}
        {originalPost.post_type === 'workout_log' && effectiveWorkoutLog && (
          <WorkoutLogCard
            user={currentUser}
            logId={originalPost.workout_log}
            log={effectiveWorkoutLog}
            inFeedMode={true}
          />
        )}
        
        {/* Use ProgramCard component for programs */}
        {originalPost.post_type === 'program' && effectiveProgramData && (
          <ProgramCard 
            programId={originalPost.program_id || originalPost.program}
            program={effectiveProgramData}
            inFeedMode={true}
            currentUser={currentUser}
            onFork={handleForkProgram}
          />
        )}
        
        {/* Regular Image */}
        {originalPost.image && (
          <img
            src={getAvatarUrl(originalPost.image)}
            alt={t('original_post_content')}
            className="mt-3 rounded-lg w-full object-cover"
          />
        )}
      </div>
    );
  };

  const Comments = () => (
    <div className="mt-4 space-y-3">
      {post.comments?.map(comment => (
        <div key={comment.id} className="flex gap-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${post.post_type ? getPostTypeDetails(post.post_type).colors.gradient : 'from-blue-500 to-indigo-500'} flex items-center justify-center`}>
            <span className="text-white text-sm font-medium">
              {comment.user_username[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {comment.user_username}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ActionButtons = () => {
    const postColorText = post.post_type ? getPostTypeDetails(post.post_type).colors.text : 'text-blue-400';
    
    return (
      <div className="flex justify-between">
        <button 
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 py-2 rounded-lg hover:bg-gray-800 transition-colors group px-3"
        >
          <Heart 
            className={`w-5 h-5 ${
              post.is_liked 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-400 group-hover:text-red-500'
            }`}
          />
          <span className={`text-sm font-medium ${
            post.is_liked ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'
          }`}>{post.likes_count || 0}</span>
        </button>
    
        <button 
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex items-center gap-1.5 py-2 rounded-lg hover:bg-gray-800 transition-colors group px-3"
        >
          <MessageCircle className={`w-5 h-5 text-gray-400 group-hover:${postColorText}`} />
          <span className={`text-sm font-medium text-gray-400 group-hover:${postColorText}`}>
            {post.comments?.length || 0}
          </span>
        </button>
    
        {post.is_share ? (
          <div className="relative group">
            <button 
              disabled
              className="flex items-center gap-1.5 py-2 rounded-lg opacity-50 cursor-not-allowed px-3"
            >
              <Share2 className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">
                {post.shares_count || 0}
              </span>
            </button>
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
              {t('shared_posts_cannot_be_shared')}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 py-2 rounded-lg hover:bg-gray-800 transition-colors group px-3"
          >
            <Share2 className={`w-5 h-5 text-gray-400 group-hover:${postColorText}`} />
            <span className={`text-sm font-medium text-gray-400 group-hover:${postColorText}`}>
              {post.shares_count || 0}
            </span>
          </button>
        )}
      </div>
    );
  };

  const effectivePostType = (post.is_share && post.original_post_details?.post_type) 
  ? post.original_post_details.post_type 
  : post.post_type || 'regular';

  const postTypeDetails = getPostTypeDetails(effectivePostType);
  const colorGradient = postTypeDetails.colors.gradient;
  const colorText = postTypeDetails.colors.text;
  const ringColor = colorText.split('-')[0] || 'blue';

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg border border-white/5 mb-5">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center overflow-hidden`}>
              {userData?.avatar ? (
                <img 
                  src={getAvatarUrl(userData.avatar)}
                  alt={post.user_username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium text-lg">
                  {post.user_username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="ml-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">{post.user_username}</h3>
                {post.is_share && (
                  <span className="text-gray-400 text-sm">{t('shared_a_post')}</span>
                )}
                {post.post_type && (() => {
                  const { Icon: IconName, label, colors } = getPostTypeDetails(post.post_type);
                  // Find the actual Icon component from the imported icons
                  const Icon = 
                    IconName === 'Edit' ? Edit :
                    IconName === 'Activity' ? Activity :
                    IconName === 'Users' ? Users :
                    IconName === 'Dumbbell' ? Dumbbell : Edit;
                  
                  return (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                      <Icon className="w-3 h-3" />
                      <span>{t(label.toLowerCase())}</span>
                    </div>
                  );
                })()}
              </div>
              <time className="text-xs text-gray-400">
                {new Date(post.created_at).toLocaleDateString()}
              </time>
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors group"
            >
              <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </button>
            <PostMenu isOpen={showMenu} />
          </div>
        </div>

        <div className="mt-3">
          {post.content && <p className="text-gray-100">{post.content}</p>}
          
          {/* Program Card */}
          {post.post_type === 'program' && programData && (
            <div className="mt-3">
              <ProgramCard
                programId={programId}
                program={programData}
                onProgramSelect={handleProgramClick}
                currentUser={currentUser}
                inFeedMode={true}
                canManage={false}
                onFork={handleForkProgram}
              />
            </div>
          )}
          
          {/* Workout Log */}
          {post.post_type === 'workout_log' && post.workout_log_details && (
            <div className="mt-3">
              <WorkoutLogCard 
                user={currentUser}
                logId={post.workout_log}
                log={post.workout_log_details}
                inFeedMode={true}
              />
            </div>
          )}
          
          {/* Shared Post */}
          {post.is_share && post.original_post_details && (
            <SharedPostContent 
              originalPost={post.original_post_details}
              currentUser={currentUser} 
            />
          )}
          
          {/* Regular Image */}
          {!post.is_share && post.image && (
            <img
              src={getAvatarUrl(post.image)}
              alt={t('post_content')}
              className="mt-3 w-full rounded-lg object-cover"
            />
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-800">
          <ActionButtons />
        </div>

        {/* Share Modal */}
        <SharePostModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          post={post}
          onShareSuccess={handleShareSuccess}
        />

        {showCommentInput && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center overflow-hidden`}>
              <span className="text-white text-sm font-medium">
                {currentUser ? currentUser[0].toUpperCase() : "?"}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('write_a_comment')}
                className={`flex-1 bg-gray-800 text-gray-100 rounded-full px-3 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-${ringColor}-500`}
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    onComment(post.id, commentText);
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="p-1.5 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${colorText}`} />
              </button>
            </div>
          </div>
          
          <Comments />
        </div>
        )}
      </div>
    </div>
  );
};

export default Post;