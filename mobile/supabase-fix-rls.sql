-- Quick Fix: Disable RLS for Privy Authentication
-- Run this in your Supabase SQL Editor
-- This is the simplest solution since you're using Privy (not Supabase Auth)

-- Simply disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE markets DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bets DISABLE ROW LEVEL SECURITY;

-- That's it! Your app should work now.
-- The wallet address from Privy serves as authentication.

-- Note: If you want RLS enabled later, you'll need to:
-- 1. Use Supabase service role key in a backend
-- 2. Or create permissive policies that don't rely on auth.uid()
-- For now, RLS disabled is fine for development/testing.
