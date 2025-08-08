-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run daily article selection at 5 PM France time (16:00 UTC in winter, 15:00 UTC in summer)
-- Using 15:00 UTC to account for both scenarios
SELECT cron.schedule(
  'daily-article-selection',
  '0 15 * * *', -- Every day at 15:00 UTC (approximately 5 PM France time)
  $$
  SELECT
    net.http_post(
        url:='https://rtuxaekhfwvpwmvmdaul.supabase.co/functions/v1/daily-article-selection',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dXhhZWtoZnd2cHdtdm1kYXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTc1NzMsImV4cCI6MjA2NTQ5MzU3M30.C6vl_5xJ69JuRIwSyK8H_uvdSU6CPEm4lYDkdhGn7lw"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);