/*
  # Buzz237 Event Platform Database Schema

  ## Overview
  Complete database schema for Buzz237, a social event posting platform with user authentication,
  profiles, events, social interactions, and admin controls.

  ## New Tables

  ### 1. `profiles`
  User profile information extending auth.users
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique, required)
  - `full_name` (text)
  - `bio` (text)
  - `avatar_url` (text)
  - `is_admin` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `events`
  Event posts created by users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text, required)
  - `description` (text, required)
  - `event_date` (timestamptz)
  - `location` (text)
  - `image_url` (text)
  - `category` (text)
  - `status` (text, default 'active')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `likes`
  Tracks which users liked which events
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `event_id` (uuid, references events)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, event_id)

  ### 4. `comments`
  Comments on events
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `event_id` (uuid, references events)
  - `content` (text, required)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security (Row Level Security)

  All tables have RLS enabled with the following policies:

  ### Profiles
  - Anyone can view profiles
  - Authenticated users can create their own profile
  - Users can update only their own profile
  - Users cannot delete profiles

  ### Events
  - Anyone can view active events
  - Authenticated users can create events
  - Users can update their own events
  - Users and admins can delete events (users: their own, admins: any)

  ### Likes
  - Anyone can view likes count
  - Authenticated users can create likes on events
  - Users can delete only their own likes

  ### Comments
  - Anyone can view comments
  - Authenticated users can create comments
  - Users can update their own comments
  - Users and admins can delete comments (users: their own, admins: any)

  ## Indexes
  - Index on events.user_id for faster user event queries
  - Index on events.created_at for feed sorting
  - Index on likes (user_id, event_id) for quick lookup
  - Index on comments.event_id for faster comment retrieval
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  event_date timestamptz,
  location text,
  image_url text,
  category text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_event ON likes(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON comments(event_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (status = 'active' OR user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events, admins can delete any"
  ON events FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Likes policies
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like events"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments, admins can delete any"
  ON comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );