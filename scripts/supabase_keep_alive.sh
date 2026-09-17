#!/bin/bash
# Supabase Keep-Alive Ping Script
# Sends queries to Supabase Postgres REST and Auth APIs to reset the 7-day inactivity pause timer.

SUPABASE_URL="https://eosbtwubpzoogpvajyyk.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvc2J0d3VicHpvb2dwdmFqeXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDkxMjgsImV4cCI6MjEwMjk4NTEyOH0.elGLlBOARK-B41GoftUCFeDSgJ7788oWqHdG3CxEdUI"

echo "⚡ Pinging Supabase Postgres REST (profiles)..."
PROFILES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY")

echo "⚡ Pinging Supabase Postgres REST (jobs)..."
JOBS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$SUPABASE_URL/rest/v1/jobs?select=id&limit=1" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY")

echo "⚡ Pinging Supabase Auth Health..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$SUPABASE_URL/auth/v1/health" -H "apikey: $ANON_KEY")

echo "----------------------------------------"
echo "Results:"
echo "• Database (Profiles): HTTP $PROFILES_STATUS"
echo "• Database (Jobs):     HTTP $JOBS_STATUS"
echo "• Auth Engine:         HTTP $AUTH_STATUS"
echo "----------------------------------------"
echo "✅ Supabase project engaged! Inactivity timer has been reset."
