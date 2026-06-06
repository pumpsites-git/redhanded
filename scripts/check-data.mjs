import { createClient } from '@supabase/supabase-js';
const s = createClient('https://peebgxqrvxafmocatspz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWJneHFydnhhZm1vY2F0c3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTc2NTgsImV4cCI6MjA5NjMzMzY1OH0.sZjMfYQaW6go3k_ak_zMfs6xG_Dfp4ryZYQm_M5iybw');

const { count: withData } = await s.from('judges').select('*', { count: 'exact', head: true }).not('total_cases', 'is', null);
const { count: total } = await s.from('judges').select('*', { count: 'exact', head: true });
console.log(`Judges with case data: ${withData} / ${total}`);

const { data: sample } = await s.from('judges').select('name, total_cases, caseload_per_year').not('total_cases', 'is', null).order('total_cases', { ascending: false }).limit(10);
if (sample && sample.length > 0) {
  console.log('\nTop judges by case count:');
  sample.forEach(j => console.log(`  ${j.name}: ${j.total_cases.toLocaleString()} cases (${j.caseload_per_year}/yr)`));
} else {
  console.log('\nNo judges have case data yet — updates may not have persisted.');
}
