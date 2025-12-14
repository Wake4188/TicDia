import { supabase } from "@/integrations/supabase/client";

export interface WordOfTheDay {
  word: string;
  word_date: string;
  is_admin_selected: boolean;
}

/**
 * Get the word of the day for a specific date
 * Returns null if no word is set for that date
 */
export async function getWordOfTheDay(date: Date = new Date()): Promise<string | null> {
  try {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('word_of_the_day')
      .select('word')
      .eq('word_date', dateString)
      .single();

    if (error) {
      // If no rows found, return null (this is expected if no word is set)
      if (error.code === 'PGRST116') {
        return null;
      }
      // If table doesn't exist yet (migration not run), return null gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('word_of_the_day table not found. Please run the migration.');
        return null;
      }
      console.error('Error fetching word of the day:', error);
      return null;
    }

    return data?.word || null;
  } catch (error) {
    console.error('Error in getWordOfTheDay:', error);
    return null;
  }
}

/**
 * Get the full word of the day record for a specific date
 */
export async function getWordOfTheDayRecord(date: Date = new Date()): Promise<WordOfTheDay | null> {
  try {
    const dateString = date.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('word_of_the_day')
      .select('word, word_date, is_admin_selected')
      .eq('word_date', dateString)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      // If table doesn't exist yet (migration not run), return null gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('word_of_the_day table not found. Please run the migration.');
        return null;
      }
      console.error('Error fetching word of the day record:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWordOfTheDayRecord:', error);
    return null;
  }
}

/**
 * Set the word of the day for a specific date (admin only)
 */
export async function setWordOfTheDay(
  word: string,
  date: Date = new Date(),
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const dateString = date.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('word_of_the_day')
      .upsert({
        word,
        word_date: dateString,
        is_admin_selected: true,
        created_by: userId || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'word_date',
      });

    if (error) {
      // If table doesn't exist yet (migration not run), return helpful error
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return { success: false, error: 'Database table not found. Please run the migration first.' };
      }
      console.error('Error setting word of the day:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in setWordOfTheDay:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate a deterministic random word for a date
 * This ensures the same word is selected for the same date if no admin word is set
 */
export function generateWordOfTheDay(date: Date = new Date(), wordList: string[]): string {
  // Use the date as a seed for deterministic randomness
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = dateString.split('-').join(''); // YYYYMMDD as number
  
  // Simple seeded random function
  let seedNum = parseInt(seed, 10);
  const random = () => {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  };

  // Select a word based on the seed
  const index = Math.floor(random() * wordList.length);
  return wordList[index];
}
