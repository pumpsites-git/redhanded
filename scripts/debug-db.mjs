import { createClient } from '@supabase/supabase-js';
const s = createClient('https://peebgxqrvxafmocatspz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw');

// Test basic select
const { data, error, count } = await s.from('judges').select('name, total_cases', { count: 'exact' }).limit(3);
console.log('Error:', error);
console.log('Count:', count);
console.log('Data:', JSON.stringify(data, null, 2));
