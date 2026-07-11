CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT,
    features TEXT[] DEFAULT '{}',
    display_order INTEGER,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
    BEGIN
        ALTER TABLE public.packages ADD COLUMN name TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.packages ADD COLUMN price TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.packages ADD COLUMN description TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.packages ADD COLUMN features TEXT[] DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.packages ADD COLUMN display_order INTEGER;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.packages ADD COLUMN is_featured BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.packages ADD COLUMN is_active BOOLEAN DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.packages FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Enable insert for authenticated users only'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users only" ON public.packages FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Enable update for authenticated users only'
    ) THEN
        CREATE POLICY "Enable update for authenticated users only" ON public.packages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'Enable delete for authenticated users only'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users only" ON public.packages FOR DELETE TO authenticated USING (true);
    END IF;
END $$;
