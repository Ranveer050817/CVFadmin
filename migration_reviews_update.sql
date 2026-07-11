-- Create the table if it does not exist (with the exact requested schema)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_role TEXT,
    client_image TEXT,
    review_text TEXT NOT NULL,
    rating INTEGER NOT NULL,
    featured BOOLEAN DEFAULT false,
    display_order INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add any missing columns to an existing table
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN client_name TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN client_role TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN client_image TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN review_text TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN rating INTEGER;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN featured BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN display_order INTEGER;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN active BOOLEAN DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Enable RLS and setup policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable insert for authenticated users only'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users only" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable update for authenticated users only'
    ) THEN
        CREATE POLICY "Enable update for authenticated users only" ON public.reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable delete for authenticated users only'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users only" ON public.reviews FOR DELETE TO authenticated USING (true);
    END IF;
END $$;
