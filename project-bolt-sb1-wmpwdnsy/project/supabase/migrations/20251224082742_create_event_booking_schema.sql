/*
  # Event Booking Portal Schema

  ## Overview
  Creates the complete database schema for an event booking platform with user authentication,
  event management, and booking tracking.

  ## New Tables

  ### 1. user_profiles
  Extends Supabase auth.users with additional profile information
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text) - User's email address
  - `full_name` (text) - User's full name
  - `is_admin` (boolean) - Admin flag for access control
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. events
  Stores event information
  - `id` (uuid, primary key) - Unique event identifier
  - `title` (text) - Event name/title
  - `description` (text) - Detailed event description
  - `event_date` (timestamptz) - When the event takes place
  - `location` (text) - Event venue/location
  - `total_seats` (integer) - Total capacity
  - `available_seats` (integer) - Remaining available seats
  - `image_url` (text) - Event image/poster URL
  - `price` (decimal) - Ticket price
  - `created_by` (uuid) - Admin who created the event
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. bookings
  Tracks user event bookings
  - `id` (uuid, primary key) - Unique booking identifier
  - `user_id` (uuid) - References user_profiles(id)
  - `event_id` (uuid) - References events(id)
  - `seats_booked` (integer) - Number of seats reserved
  - `booking_status` (text) - Status: 'confirmed', 'cancelled'
  - `created_at` (timestamptz) - Booking creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can view their own profile and bookings
  - Users can view all events
  - Only admins can create/update/delete events
  - Users can create bookings for themselves
  - Users can cancel their own bookings

  ## Important Notes
  1. Available seats are automatically managed via triggers
  2. Booking cancellation restores seat availability
  3. Admin access is controlled via is_admin flag in user_profiles
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  total_seats integer NOT NULL CHECK (total_seats > 0),
  available_seats integer NOT NULL CHECK (available_seats >= 0),
  image_url text DEFAULT '',
  price decimal(10,2) DEFAULT 0,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  seats_booked integer NOT NULL CHECK (seats_booked > 0),
  booking_status text DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id, booking_status)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for events

CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view events"
  ON events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- RLS Policies for bookings

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND booking_status = 'confirmed');

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update available seats when booking is created
CREATE OR REPLACE FUNCTION update_seats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_status = 'confirmed' THEN
    UPDATE events
    SET available_seats = available_seats - NEW.seats_booked
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to restore seats when booking is cancelled
CREATE OR REPLACE FUNCTION restore_seats_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    UPDATE events
    SET available_seats = available_seats + OLD.seats_booked
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS booking_created_trigger ON bookings;
CREATE TRIGGER booking_created_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_seats_on_booking();

DROP TRIGGER IF EXISTS booking_cancelled_trigger ON bookings;
CREATE TRIGGER booking_cancelled_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION restore_seats_on_cancel();

-- Insert sample events
INSERT INTO events (title, description, event_date, location, total_seats, available_seats, image_url, price)
VALUES
  (
    'Tech Conference 2025',
    'Join us for the biggest technology conference of the year featuring keynote speakers from leading tech companies, workshops on AI, Cloud Computing, and Web Development.',
    '2025-03-15 09:00:00+00',
    'Convention Center, Downtown',
    500,
    500,
    'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg',
    49.99
  ),
  (
    'Music Festival Summer Bash',
    'Experience an unforgettable evening with live performances from top artists across multiple genres. Food trucks, craft beverages, and great vibes!',
    '2025-06-20 18:00:00+00',
    'City Park Amphitheater',
    2000,
    2000,
    'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    79.99
  ),
  (
    'Business Leadership Summit',
    'Network with industry leaders and learn cutting-edge business strategies. Includes panel discussions, breakout sessions, and networking lunch.',
    '2025-04-10 08:30:00+00',
    'Grand Hotel Ballroom',
    300,
    300,
    'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
    149.99
  ),
  (
    'Food & Wine Tasting Experience',
    'Indulge in a curated selection of gourmet dishes paired with fine wines. Meet renowned chefs and sommeliers in an elegant setting.',
    '2025-05-05 19:00:00+00',
    'Riverside Restaurant',
    150,
    150,
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    99.99
  ),
  (
    'Startup Pitch Competition',
    'Watch innovative startups pitch their ideas to top investors. Network with entrepreneurs and VCs. Cash prizes for winners!',
    '2025-03-25 14:00:00+00',
    'Innovation Hub',
    400,
    400,
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
    29.99
  ),
  (
    'Art Exhibition Opening Night',
    'Exclusive opening night of contemporary art exhibition featuring local and international artists. Complimentary refreshments included.',
    '2025-04-18 18:00:00+00',
    'Modern Art Gallery',
    200,
    200,
    'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg',
    25.00
  )
ON CONFLICT DO NOTHING;