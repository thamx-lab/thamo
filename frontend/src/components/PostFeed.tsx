import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const PostFeed: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="feed-container">
      <header className="feed-header">
        <h1 className="gradient-text">Channel Forum</h1>
        <div className="header-actions">
           <button onClick={() => navigate('/create')} className="btn-primary">New Post</button>
           <button onClick={logout} className="btn-secondary">Log Out</button>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">No posts yet. Be the first to share!</div>
      ) : (
        <div className="post-grid">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-image-container">
                 <img src={post.image_url} alt={post.title} className="post-image" loading="lazy" />
              </div>
              <div className="post-content">
                <h3>{post.title}</h3>
                <p className="post-meta">Posted by {post.user_id ? post.user_id.substring(0,8) : 'Unknown'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
