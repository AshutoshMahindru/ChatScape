# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/sign up
2. Click "New Project"
3. Fill in the project details:
   - **Name**: LlmChatMap (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to you
4. Wait for the project to be created (~2 minutes)

## Step 2: Configure Authentication

1. In your Supabase project dashboard, go to **Authentication** > **Providers**
2. Find **Email** provider and ensure it's enabled (it should be by default)
3. Go to **Authentication** > **URL Configuration**
4. Set the following:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

## Step 3: Create Database Schema

1. Go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase/setup.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the script
6. Verify in **Table Editor** that the `profiles` table was created

## Step 4: Get Your API Credentials

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 5: Update Environment Variables

Create a `.env.local` file in the project root with your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the actual values from Step 4.

## Verification

Once complete, you should be able to:
- See the `profiles` table in **Table Editor**
- See RLS policies enabled (green shield icon)
- Have a valid `.env.local` file with credentials

## Next Steps

After completing these steps, let me know and we'll continue with the next task: creating Supabase client utilities.
