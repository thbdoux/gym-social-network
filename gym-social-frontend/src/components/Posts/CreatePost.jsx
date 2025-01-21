import React, { useState } from 'react';
import * as api from '../../api/api';

export default function CreatePost() {
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPost({ content });
      setContent('');
      // Trigger feed refresh
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-2 border rounded"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Post
        </button>
      </form>
    </div>
  );
}