-- sql.dialect: PostgreSQL
-- ============================================
-- WATERWAYS INITIAL SCHEMA
-- ============================================
-- This is the initial database setup created from the UML diagram
-- Enhanced by Claude but reviewed by Tommy

-- If it annoys you that you see errors for this file make sure the intellisense is set to postgresql

-- Enable UUID and PostGIS extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'banned')) DEFAULT 'active',
  verified BOOLEAN DEFAULT false,
  role TEXT CHECK (role IN ('regular', 'admin')) DEFAULT 'regular'
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project membership junction table
CREATE TABLE project_membership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, project_id)
);

-- Observation categories table
CREATE TABLE observation_categories (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  start_location GEOGRAPHY(POINT),
  end_location GEOGRAPHY(POINT),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Observations table
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location GEOGRAPHY(POINT),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  observation TEXT,
  category_id int REFERENCES observation_categories(id) ON DELETE SET NULL
);

-- Observation media table
CREATE TABLE observation_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observation_id UUID REFERENCES observations(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_project_id ON trips(project_id);
CREATE INDEX idx_observations_trip_id ON observations(trip_id);
CREATE INDEX idx_observations_user_id ON observations(user_id);
CREATE INDEX idx_observations_category_id ON observations(category_id);
CREATE INDEX idx_project_membership_user_id ON project_membership(user_id);
CREATE INDEX idx_project_membership_project_id ON project_membership(project_id);
CREATE INDEX idx_observation_media_observation_id ON observation_media(observation_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- These are the generated RLS, I am not enabling these right away, we can figure out security later or atleast that wasn't my job
-- ============================================

-- -- Enable RLS on all tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_membership ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE observation_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE observation_media ENABLE ROW LEVEL SECURITY;

-- -- Users policies
-- CREATE POLICY "Users can view their own data" ON users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update their own data" ON users
--   FOR UPDATE USING (auth.uid() = id);

-- -- Projects policies
-- CREATE POLICY "Users can view projects they're members of" ON projects
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM project_membership
--       WHERE project_membership.project_id = projects.id
--       AND project_membership.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can create projects" ON projects
--   FOR INSERT WITH CHECK (auth.uid() = created_by);

-- CREATE POLICY "Users can update their projects" ON projects
--   FOR UPDATE USING (auth.uid() = created_by);

-- -- Project membership policies
-- CREATE POLICY "Users can view their own memberships" ON project_membership
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Project creators can manage memberships" ON project_membership
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM projects
--       WHERE projects.id = project_membership.project_id
--       AND projects.created_by = auth.uid()
--     )
--   );

-- -- Trips policies
-- CREATE POLICY "Users can view trips in their projects" ON trips
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM project_membership
--       WHERE project_membership.project_id = trips.project_id
--       AND project_membership.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can create trips in their projects" ON trips
--   FOR INSERT WITH CHECK (
--     auth.uid() = user_id AND
--     EXISTS (
--       SELECT 1 FROM project_membership
--       WHERE project_membership.project_id = trips.project_id
--       AND project_membership.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can update their own trips" ON trips
--   FOR UPDATE USING (auth.uid() = user_id);

-- -- Observations policies
-- CREATE POLICY "Users can view observations in their projects" ON observations
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM trips
--       JOIN project_membership ON project_membership.project_id = trips.project_id
--       WHERE trips.id = observations.trip_id
--       AND project_membership.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can create observations on their trips" ON observations
--   FOR INSERT WITH CHECK (
--     auth.uid() = user_id AND
--     EXISTS (
--       SELECT 1 FROM trips
--       WHERE trips.id = observations.trip_id
--       AND trips.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can update their own observations" ON observations
--   FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own observations" ON observations
--   FOR DELETE USING (auth.uid() = user_id);

-- -- Observation media policies
-- CREATE POLICY "Users can view media for observations in their projects" ON observation_media
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM observations
--       JOIN trips ON trips.id = observations.trip_id
--       JOIN project_membership ON project_membership.project_id = trips.project_id
--       WHERE observations.id = observation_media.observation_id
--       AND project_membership.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can add media to their observations" ON observation_media
--   FOR INSERT WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM observations
--       WHERE observations.id = observation_media.observation_id
--       AND observations.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can delete their own observation media" ON observation_media
--   FOR DELETE USING (
--     EXISTS (
--       SELECT 1 FROM observations
--       WHERE observations.id = observation_media.observation_id
--       AND observations.user_id = auth.uid()
--     )
--   );

-- -- Observation categories policies (readable by all authenticated users)
-- CREATE POLICY "Anyone can view observation categories" ON observation_categories
--   FOR SELECT USING (auth.role() = 'authenticated');
