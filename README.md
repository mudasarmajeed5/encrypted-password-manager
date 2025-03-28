# Password Manager

## Overview
This is a secure password manager application built using Vite and Supabase. Users can log in using their Supabase credentials and store their passwords securely in an encrypted format using Supabase SQL.

---

## Setup Instructions

### 1. Create a Supabase Account
1. Go to [Supabase](https://supabase.com/) and sign up.
2. Create a new project.
3. Navigate to the **Project Settings** > **API** section.
4. Copy the **Supabase URL** and **Anon Key**.

### 2. Configure Environment Variables
Create a `.env` file in your project's root directory and add the following:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with the values from your Supabase dashboard.

---

## 3. Set Up the Database in Supabase
Once your Supabase project is created, set up the database by executing the following SQL in the **SQL Editor** of Supabase:

```sql
CREATE TABLE passwords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  encrypted_password text not null,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own passwords
CREATE POLICY "Users can read own passwords"
  ON passwords
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own passwords
CREATE POLICY "Users can insert own passwords"
  ON passwords
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

This ensures that each user can only access and manage their own passwords securely.

---

## 4. Run the Application Locally
Ensure you have [Node.js](https://nodejs.org/) installed. Then run:

```sh
yarn install  # or npm install
```

```sh
yarn dev  # or npm run dev
```

The app will start running on `http://localhost:5173/`.

---

## 5. Deploy the Application
You can deploy the app using Netlify:

1. Push your project to GitHub.
2. Go to [Netlify](https://netlify.com/) and connect your repository.
3. Set up the **environment variables** (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in Netlify's dashboard under **Site settings** > **Build & deploy** > **Environment Variables**.
4. Deploy your site.

---

## 6. User Authentication
The application uses Supabase authentication for logging in. Users need to sign up or log in using their credentials from Supabase authentication. Ensure you have **email/password authentication** enabled in Supabase under **Authentication Settings**.

Once logged in, users can securely store and manage their passwords.

---

## Conclusion
Your password manager is now set up and deployed! 🎉 Always ensure sensitive data is encrypted before storing it in the database. Happy coding!

