CREATE TABLE IF NOT EXISTS public.website_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name TEXT,
    tagline TEXT,
    about_description TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    email_address TEXT,
    business_address TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    youtube_url TEXT,
    website_url TEXT,
    logo_url TEXT,
    hero_banner_url TEXT,
    favicon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add any missing columns to an existing table
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN business_name TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN tagline TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN about_description TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN phone_number TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN whatsapp_number TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN email_address TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN business_address TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN instagram_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN facebook_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN youtube_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN website_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN logo_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN hero_banner_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN favicon_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'website_settings' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.website_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'website_settings' AND policyname = 'Enable insert for authenticated users only'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users only" ON public.website_settings FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'website_settings' AND policyname = 'Enable update for authenticated users only'
    ) THEN
        CREATE POLICY "Enable update for authenticated users only" ON public.website_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Storage buckets setup (We are instructed to use existing Supabase Storage bucket. The instruction says: "Upload all images to the existing Supabase Storage bucket and save the public URLs... If the required storage folders do not exist, create them automatically: logo, hero, favicon". Folders are just paths in a bucket. But which bucket? Let's assume the bucket used is 'gallery' or we check which bucket is used.
