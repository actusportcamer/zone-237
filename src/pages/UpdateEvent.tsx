import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ImageIcon, Tag } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface PostProps {
  eventId: string;
}


const UpdateEvent: React.FC<PostProps> = ({ eventId }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 🧩 Fetch post by ID
  const loadPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) setError(error.message);
    else setPost(data);

    setLoading(false);
  };

  // 🧠 Update post content
  const updatePost = async () => {

    const { error } = await supabase
      .from("events")
      .update([{
          title: post.title,
          description: post.description,
          location: post.location || null,
          image_url: post.image_url || null,
          category: post.category || null,
        }])
      .eq("id", eventId);

    if (error) throw error;

    setEditing(false)
  };

  const CLOUD_NAME = 'dbub1gaog';
  const UPLOAD_PRESET = 'zone237';

  const handleImageChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
          try {
              const imageUrl = await uploadImage(file);
              setPost({ ...post, image_url: imageUrl });
          } catch (err) {
              alert(err.message);
          }
      }
  };
  
  const uploadImage = async (file) => {
    const imageData = new FormData();
    imageData.append('file', file);
    imageData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: imageData,
            }
        );

        if (!response.ok) throw new Error("Image upload failed");
        const data = await response.json();
        return data.secure_url;
    } catch (err) {
        throw new Error('Failed to upload image: ' + err.message);
    }
};

  useEffect(() => {
    loadPost();
  }, [eventId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!post) return <p>Event not found.</p>;

  return (
    <div className="min-h-screen flex justify-center items-center m-2">
      <div className="sm:p-2 shadow-sm sm:w-[500px]">
        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
        {!editing ? (
            <>
            <p className="text-gray-700 mb-4">{post.description}</p>
            <button
                onClick={() => {
                setNewContent(post.content);
                setEditing(true);
                }}
                className="bg-blue-500 mb-2 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
                Edit Post
            </button>
            </>
        ) : (
            <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Give your event a catchy title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">
              Description *
            </label>
            <textarea
              value={post.description}
              onChange={(e) => setPost({ ...post, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Tell people what your event is about..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <select
              value={post.category}
              onChange={(e) => setPost({ ...post, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="Music">Music</option>
              <option value="Sports">Sports</option>
              <option value="Business">Business</option>
              <option value="Food">Food & Drink</option>
              <option value="Arts">Arts & Culture</option>
              <option value="Community">Community</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Image URL
            </label>
            <div className='border-4 border-teal-500 border-dotted p-3'>
                                <input type='file'
                                  accept='image/*'
                                  onChange={handleImageChange} />
                              </div>
            {post.image_url && (
              <div className="mt-2 mb-2">
                <img
                  src={post.image_url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
            <div className="space-x-2 w-full flex">
                <button
                onClick={updatePost}
                className="bg-green-600 w-full text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                Save
                </button>
                <button
                onClick={() => setEditing(false)}
                className="bg-gray-400 w-full text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                Cancel
                </button>
            </div>
            </>
        )}
        </div>
    </div>
  );
};

export default UpdateEvent;
