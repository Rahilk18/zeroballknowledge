import { supabase } from '../lib/supabase';
import { INITIAL_PLAYERS } from '../data/initialData';

export interface SyncResult {
  totalInCatalog: number;
  totalInDb: number;
  synced: number;
  error: string | null;
}

/**
 * Ensures all 110+ superstars and legends from INITIAL_PLAYERS exist in Supabase's `players` table.
 * If any are missing, attempts to insert them in batches.
 */
export async function syncPlayersToSupabase(): Promise<SyncResult> {
  const totalInCatalog = INITIAL_PLAYERS.length;
  try {
    const { data: dbPlayers, error: fetchErr } = await supabase
      .from('players')
      .select('id, name');

    if (fetchErr) {
      return { totalInCatalog, totalInDb: 0, synced: 0, error: fetchErr.message };
    }

    const currentDbNames = new Set((dbPlayers || []).map(p => (p.name || '').trim().toLowerCase()));
    const missing = INITIAL_PLAYERS.filter(p => !currentDbNames.has((p.name || '').trim().toLowerCase()));

    if (missing.length === 0) {
      return { totalInCatalog, totalInDb: (dbPlayers || []).length, synced: 0, error: null };
    }

    // Format missing players to match Supabase `players` columns
    const payload = missing.map(p => ({
      name: p.name,
      short_name: p.shortName || p.name.split(' ').pop() || p.name,
      position: p.position,
      nationality: p.nationality || '',
      overall: p.overall,
      pace: p.pace,
      shooting: p.shooting,
      passing: p.passing,
      dribbling: p.dribbling,
      defending: p.defending,
      physical: p.physical,
      goalkeeping: p.goalkeeping,
      form: p.form || 85,
      market_value_m: p.marketValue || (p as any).cost || 50,
      avatar_url: p.avatarUrl || ''
    }));

    let inserted = 0;
    // Insert in batches of 20
    for (let i = 0; i < payload.length; i += 20) {
      const batch = payload.slice(i, i + 20);
      const { error: insErr } = await supabase.from('players').insert(batch);
      if (insErr) {
        console.warn('Auto-sync players to Supabase batch warning:', insErr.message);
        return {
          totalInCatalog,
          totalInDb: (dbPlayers || []).length + inserted,
          synced: inserted,
          error: insErr.message
        };
      }
      inserted += batch.length;
    }

    const newTotal = (dbPlayers || []).length + inserted;
    return { totalInCatalog, totalInDb: newTotal, synced: inserted, error: null };
  } catch (err: any) {
    return { totalInCatalog, totalInDb: 0, synced: 0, error: err.message || 'Unknown sync error' };
  }
}
