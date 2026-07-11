DO $$
BEGIN
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN about_description TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN facebook TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN website TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN logo_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.website_settings ADD COLUMN favicon_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;
