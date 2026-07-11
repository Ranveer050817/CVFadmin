-- Make sure the reviews table has all the necessary columns matching our updated schema

DO $$
BEGIN
    -- These are the exact columns we expect based on the new types
    BEGIN
        ALTER TABLE public.reviews ADD COLUMN name TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN designation TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN image_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.reviews ADD COLUMN review TEXT;
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
