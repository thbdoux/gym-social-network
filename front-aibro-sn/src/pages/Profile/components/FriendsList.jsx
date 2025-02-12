
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  LineChart,
  ChevronRight,
  ChevronLeft,
  Edit,
  Check,
  Save,
} from 'lucide-react';

const FriendsList = ({ friends, recommendedFriends }) => (
    <div className="space-y-6">
      {/* Current Friends */}
      <div className="bg-gray-800/40 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Friends</h2>
        <div className="space-y-3">
          {Array.isArray(friends) && friends.slice(0, 3).map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
              <img
                src={friend.avatar || "/api/placeholder/40/40"}
                alt={friend.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">{friend.username}</div>
                <div className="text-sm text-gray-400">{friend.training_level}</div>
              </div>
              <Check className="w-4 h-4 text-green-400" />
            </div>
          ))}
        </div>
      </div>
  
      {/* Recommended Friends */}
      <div className="bg-gray-800/40 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Recommended</h2>
        <div className="space-y-3">
          {recommendedFriends?.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
              <img
                src={friend.avatar || "/api/placeholder/40/40"}
                alt={friend.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">{friend.username}</div>
                <div className="text-sm text-gray-400">{friend.training_level}</div>
              </div>
              <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

export default FriendsList;