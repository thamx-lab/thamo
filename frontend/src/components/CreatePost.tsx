import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      alert("Please provide both a title and an image.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to create a post.");
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('image', file);

      // Using the Python backend API deployed locally or somewhere else
      // Adjust standard URL for local dev to standard port
      await axios.post('http://localhost:8000/posts', formData, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      
      // Navigate back to home feed
      navigate('/');
    } catch (error: any) {
      console.error(error);
      alert("Error creating post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="card form-card">
        <h2>Create a New Post</h2>
        <form onSubmit={handlePost}>
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              placeholder="What's this about?" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              className="input-field"
            />
          </div>
          <div className="form-group file-group">
            <label>Photo / Meme</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                }
              }} 
              required
              className="file-input"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Posting...' : 'Post to Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
