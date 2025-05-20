import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MessageSquare, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Step5ChatMiniGame = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [stage, setStage] = useState(0);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [typing, setTyping] = useState(false);
  const [showFinalResponse, setShowFinalResponse] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stage, selectedResponses, typing, showFinalResponse]);
  
  // Chat conversation flow
  const chatFlow = [
    {
      message: 'chat_initial_message',
      options: [
        {
          id: 'same_as_you',
          text: 'chat_response_same_as_you',
          score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 1 },
          leads_to: 'friend_excited'
        },
        {
          id: 'hiking',
          text: 'chat_response_hiking',
          score: { optimizer: 1, diplomate: 0, mentor: 0, versatile: 3 },
          leads_to: 'friend_disappointed'
        },
        {
          id: 'gym',
          text: 'chat_response_gym',
          score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 0 },
          leads_to: 'friend_neutral'
        }
      ]
    },
    {
      response_to: 'friend_excited',
      message: 'chat_friend_excited',
      options: [
        {
          id: 'join_party',
          text: 'chat_response_join_party',
          score: { optimizer: 0, diplomate: 3, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_excited'
        },
        {
          id: 'workout_first',
          text: 'chat_response_workout_first',
          score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 0 },
          final_response: 'chat_friend_final_understanding'
        },
        {
          id: 'bring_friends',
          text: 'chat_response_bring_friends',
          score: { optimizer: 0, diplomate: 2, mentor: 3, versatile: 0 },
          final_response: 'chat_friend_final_impressed'
        }
      ]
    },
    {
      response_to: 'friend_disappointed',
      message: 'chat_friend_disappointed',
      options: [
        {
          id: 'next_time',
          text: 'chat_response_next_time',
          score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_pleased'
        },
        {
          id: 'invite_hiking',
          text: 'chat_response_invite_hiking',
          score: { optimizer: 0, diplomate: 1, mentor: 2, versatile: 2 },
          final_response: 'chat_friend_final_interested'
        },
        {
          id: 'stick_to_plan',
          text: 'chat_response_stick_to_plan',
          score: { optimizer: 2, diplomate: 0, mentor: 0, versatile: 3 },
          final_response: 'chat_friend_final_respectful'
        }
      ]
    },
    {
      response_to: 'friend_neutral',
      message: 'chat_friend_neutral',
      options: [
        {
          id: 'come_to_gym',
          text: 'chat_response_come_to_gym',
          score: { optimizer: 2, diplomate: 1, mentor: 3, versatile: 0 },
          final_response: 'chat_friend_final_considering'
        },
        {
          id: 'another_day',
          text: 'chat_response_another_day',
          score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 1 },
          final_response: 'chat_friend_final_happy'
        },
        {
          id: 'training_important',
          text: 'chat_response_training_important',
          score: { optimizer: 3, diplomate: 0, mentor: 0, versatile: 1 },
          final_response: 'chat_friend_final_admiring'
        }
      ]
    }
  ];
  
  // Get current stage of the chat
  const getCurrentStage = () => {
    if (stage === 0) return chatFlow[0];
    
    const previousResponse = selectedResponses[0];
    const friendResponseType = previousResponse.leads_to;
    
    return chatFlow.find(flow => flow.response_to === friendResponseType);
  };
  
  // Get final response message key
  const getFinalResponseKey = () => {
    if (selectedResponses.length < 2) return '';
    return selectedResponses[1].final_response || 'chat_friend_final_default';
  };
  
  // Handle selecting a response
  const handleSelectResponse = (option) => {
    // Add selected response to history
    setSelectedResponses(prev => [...prev, option]);
    
    // Show typing indicator
    setTyping(true);
    
    // After a delay, move to next stage
    setTimeout(() => {
      setTyping(false);
      if (stage === 1) {
        // For the second response, show the final message from friend
        setShowFinalResponse(true);
        
        // After showing the final response, enable the continue button
        setTimeout(() => {
          setStage(prev => prev + 1);
        }, 1500);
      } else {
        setStage(prev => prev + 1);
      }
    }, 1500);
  };
  
  // Handle completing the chat
  const handleContinue = () => {
    // Calculate scores based on selected responses
    const calculatedScores = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    selectedResponses.forEach(response => {
      Object.keys(calculatedScores).forEach(key => {
        calculatedScores[key] += response.score[key];
      });
    });
    
    // Adjust scores to reduce chance of getting "versatile" type
    if (calculatedScores.versatile > Math.max(calculatedScores.optimizer, calculatedScores.diplomate, calculatedScores.mentor)) {
      // Reduce versatile score by 15% if it's the highest
      calculatedScores.versatile *= 0.85;
    }
    
    onComplete(calculatedScores);
  };
  
  return (
    <div className={`flex flex-col h-full transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-xl font-bold text-center text-white mb-2">
        {t('chat_title')}
      </h2>
      <p className="text-center text-gray-400 mb-4">
        {t('chat_subtitle')}
      </p>
      
      {/* Chat interface */}
      <div className="flex-grow flex flex-col bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden mb-4">
        {/* Chat header */}
        <div className="bg-gray-800/70 p-3 border-b border-gray-700/30 flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center mr-3">
            <MessageSquare size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{t('chat_friend_name')}</p>
            <p className="text-gray-400 text-xs">{t('chat_friend_status')}</p>
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="flex-grow p-4 overflow-y-auto flex flex-col space-y-3">
          {/* Initial friend message */}
          <div className="flex">
            <div className="w-8 h-8 rounded-full bg-gray-700/50 flex-shrink-0 mr-2"></div>
            <div className="bg-gray-700/50 rounded-lg p-3 max-w-[80%]">
              <p className="text-white">{t(chatFlow[0].message)}</p>
            </div>
          </div>
          
          {/* First user response if selected */}
          {selectedResponses.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-blue-900/30 rounded-lg p-3 max-w-[80%]">
                <p className="text-white">{t(selectedResponses[0].text)}</p>
              </div>
            </div>
          )}
          
          {/* Friend's second message */}
          {stage >= 1 && (
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex-shrink-0 mr-2"></div>
              <div className="bg-gray-700/50 rounded-lg p-3 max-w-[80%]">
                <p className="text-white">{t(getCurrentStage().message)}</p>
              </div>
            </div>
          )}
          
          {/* Second user response if selected */}
          {selectedResponses.length > 1 && (
            <div className="flex justify-end">
              <div className="bg-blue-900/30 rounded-lg p-3 max-w-[80%]">
                <p className="text-white">{t(selectedResponses[1].text)}</p>
              </div>
            </div>
          )}
          
          {/* Friend's final response after user's second message */}
          {showFinalResponse && (
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex-shrink-0 mr-2"></div>
              <div className="bg-gray-700/50 rounded-lg p-3 max-w-[80%]">
                <p className="text-white">{t(getFinalResponseKey())}</p>
              </div>
            </div>
          )}
          
          {/* Typing indicator */}
          {typing && (
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-gray-700/50 flex-shrink-0 mr-2"></div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Spacer div for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Response options or continue button */}
        <div className="p-3 border-t border-gray-700/30">
          {stage < 2 ? (
            <div className="space-y-2">
              {getCurrentStage().options.map((option, index) => (
                <div
                  key={option.id}
                  onClick={() => handleSelectResponse(option)}
                  className="bg-gray-700/50 hover:bg-gray-700/80 transition-colors rounded-lg p-3 cursor-pointer flex items-center"
                >
                  <span className="text-white text-sm">{t(option.text)}</span>
                  <Send size={14} className="text-blue-400 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2
                bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/90 hover:to-indigo-700/90
                transition-all duration-300"
            >
              <span>{t('finish_chat')}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step5ChatMiniGame;