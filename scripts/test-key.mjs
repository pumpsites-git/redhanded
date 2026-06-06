import { createClient } from '@supabase/supabase-js';

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw';

console.log('Key length:', key.length);
const s = createClient('https://peebgxqrvxafmocatspz.supabase.co', key);

const { data, error, count } = await s.from('judges').select('name', { count: 'exact' }).limit(3);
console.log('Error:', error);
console.log('Count:', count);
console.log('Data:', data);
