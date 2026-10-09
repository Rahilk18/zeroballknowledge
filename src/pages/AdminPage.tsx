import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { Player, Team, GameSession } from '../types';
import { sound } from '../utils/audioSynth';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Trash2, 
  PlusCircle, 
  Radio, 
  Coins, 
  Trophy, 
  Activity, 
  Database, 
  Check, 
  RefreshCw,
  Users,
  AlertTriangle,
  Play
} from 'lucide-react';
import { syncPlayersToSupabase, SyncResult } from '../services/playerSyncService';

interface AdminPageProps {
  allPlayers: Player[];
  allTeams: Team[];
  onAddPlayer: (player: Player) => void;
  onUpdateTeamBudget: (teamId: string, newBudget: number) => void;
}

const ADMIN_MASTER_PASSWORD = 'Rahil@2005';

export const AdminPage: React.FC<AdminPageProps> = ({
  allPlayers,
  allTeams,
  onAddPlayer,
  onUpdateTeamBudget
}) => {
  const { user, profile } = useAuth();
  const { currentSession } = useSession();

  const [pinInput, setPinInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('zeroball_super_admin') === 'true' || localStorage.getItem('herobid_super_admin') === 'true';
  });
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'rooms' | 'players' | 'budget' | 'leaderboard'>('rooms');
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Player creation form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState<'GK' | 'DEF' | 'MID' | 'ATT'>('ATT');
  const [newPlayerNat, setNewPlayerNat] = useState('');
  const [newPlayerOvr, setNewPlayerOvr] = useState(88);
  const [newPlayerPac, setNewPlayerPac] = useState(85);
  const [newPlayerSho, setNewPlayerSho] = useState(86);
  const [newPlayerPas, setNewPlayerPas] = useState(82);
  const [newPlayerDri, setNewPlayerDri] = useState(87);
  const [newPlayerDef, setNewPlayerDef] = useState(55);
  const [newPlayerPhy, setNewPlayerPhy] = useState(78);
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('');
  const [newPlayerValue, setNewPlayerValue] = useState(65);

  // Budget grant state
  const [selectedTeamId, setSelectedTeamId] = useState<string>(allTeams[0]?.id || '');
  const [customBudgetAmount, setCustomBudgetAmount] = useState<number>(250);

  // ELO adjustment state
  const [targetUsername, setTargetUsername] = useState('');
  const [eloAmount, setEloAmount] = useState(100);

  // Catalog sync state
  const [syncingPlayers, setSyncingPlayers] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSyncAllPlayers = async () => {
    sound.playPowerUp();
    setSyncingPlayers(true);
    const res = await syncPlayersToSupabase();
    setSyncResult(res);
    setSyncingPlayers(false);
    if (!res.error) {
      sound.playVictorySound();
      setStatusMessage(`Sync complete! Database now has ${res.totalInDb}/${res.totalInCatalog} players.`);
    } else {
      setStatusMessage(`Sync partial/warning: ${res.error}. (Tip: If RLS blocked insert, run seed_100_players.sql in Supabase SQL editor).`);
    }
    setTimeout(() => setStatusMessage(''), 5000);
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchLiveSessions();
    }
  }, [isAuthorized]);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (pinInput.trim() === ADMIN_MASTER_PASSWORD) {
      sound.playVictorySound();
      setIsAuthorized(true);
      localStorage.setItem('zeroball_super_admin', 'true');
      setAuthError('');
      fetchLiveSessions();
    } else {
      setAuthError('INVALID MASTER PASSWORD. Access Denied.');
    }
  };

  const handleDeauthorize = () => {
    sound.playClick();
    setIsAuthorized(false);
    localStorage.removeItem('zeroball_super_admin');
    localStorage.removeItem('herobid_super_admin');
  };

  const fetchLiveSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setLiveSessions(data);
      } else {
        setLiveSessions(currentSession ? [currentSession] : []);
      }
    } catch {
      setLiveSessions(currentSession ? [currentSession] : []);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleAdvanceRoomStatus = async (sessionId: string, newStatus: string) => {
    sound.playClick();
    try {
      await supabase
        .from('game_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);
      
      setStatusMessage(`Room status updated to ${newStatus}`);
      fetchLiveSessions();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDeleteRoom = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this room?')) return;
    sound.playClick();
    try {
      await supabase.from('game_sessions').delete().eq('id', sessionId);
      setStatusMessage('Room terminated successfully');
      fetchLiveSessions();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    sound.playVictorySound();
    const createdPlayer: Player = {
      id: `custom-${Date.now()}`,
      name: newPlayerName.trim(),
      shortName: newPlayerName.trim().split(' ').slice(-1)[0],
      position: newPlayerPos,
      nationality: newPlayerNat || 'World',
      overall: newPlayerOvr,
      pace: newPlayerPac,
      shooting: newPlayerSho,
      passing: newPlayerPas,
      dribbling: newPlayerDri,
      defending: newPlayerDef,
      physical: newPlayerPhy,
      goalkeeping: newPlayerPos === 'GK' ? newPlayerOvr : 15,
      form: 95,
      fitness: 100,
      marketValue: newPlayerValue,
      marketValueM: newPlayerValue,
      avatarUrl: newPlayerAvatar || 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p231747.png',
      stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 7.5 }
    };

    // Inject into local state
    onAddPlayer(createdPlayer);

    // Optionally try injecting to Supabase
    try {
      await supabase.from('players').insert([{
        name: createdPlayer.name,
        short_name: createdPlayer.shortName,
        position: createdPlayer.position,
        nationality: createdPlayer.nationality,
        overall: createdPlayer.overall,
        pace: createdPlayer.pace,
        shooting: createdPlayer.shooting,
        passing: createdPlayer.passing,
        dribbling: createdPlayer.dribbling,
        defending: createdPlayer.defending,
        physical: createdPlayer.physical,
        market_value_m: createdPlayer.marketValue,
        avatar_url: createdPlayer.avatarUrl
      }]);
    } catch (err) {
      // Offline fallback
    }

    setStatusMessage(`Superstar ${createdPlayer.name} added to catalog!`);
    setNewPlayerName('');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleGrantBudget = (amount: number) => {
    sound.playClick();
    if (!selectedTeamId) return;
    const team = allTeams.find(t => t.id === selectedTeamId);
    if (!team) return;

    const newBudget = amount;
    onUpdateTeamBudget(selectedTeamId, newBudget);

    // Update in Supabase
    supabase
      .from('teams')
      .update({ budget: newBudget })
      .eq('id', selectedTeamId)
      .then();

    setStatusMessage(`Granted €${newBudget}M budget to ${team.name}!`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleAdjustElo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;
    sound.playClick();

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', targetUsername.trim())
        .single();

      if (data) {
        const updatedPoints = (data.total_points || 0) + eloAmount;
        await supabase
          .from('profiles')
          .update({ total_points: updatedPoints })
          .eq('id', data.id);

        setStatusMessage(`Added +${eloAmount} ELO points to @${targetUsername}!`);
      } else {
        alert('User profile not found in Supabase.');
      }
    } catch (err: any) {
      alert('Error updating ELO: ' + err.message);
    }
  };

  // Lock Screen if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-[#0E1324] border border-[#FF1744]/40 rounded-3xl p-8 max-w-md w-full shadow-glow-cyan text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#FF1744]/15 border border-[#FF1744]/40 flex items-center justify-center text-3xl mx-auto shadow-glow-cyan text-[#FF1744]">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 text-glow-cyan">
              RESTRICTED CONSOLE
            </span>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display text-glow-cyan mt-2">
              SUPER ADMIN PANEL
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Enter your Master Admin Password to unlock server authority.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthorize} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="Enter Admin Password..."
                className="w-full bg-[#0A0A14] border border-slate-700 focus:border-[#FF1744] rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none text-center font-mono tracking-widest text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan"
            >
              AUTHORIZE ACCESS
            </button>
          </form>

          <p className="text-[11px] text-slate-500 font-mono">
            Restricted Access • Authorized Administrators Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-fadeIn pb-6 max-w-6xl mx-auto">
      
      {/* Super Admin Top Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#0E1324] to-purple-950/40 border-2 border-[#FF1744]/50 px-4 py-3 sm:px-5 sm:py-3.5 shadow-glow-cyan">
        <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF1744]/20 border border-[#FF1744]/50 flex items-center justify-center text-xl shadow-glow-cyan text-[#FF1744]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40 tracking-wider text-glow-cyan">
                  ROOT SYSTEM ADMIN
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  ● PRIVILEGES ELEVATED
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                COMMAND CENTER
              </h1>
              <p className="text-[11px] text-slate-400">
                Manage live multiplayer rooms, inject footballers, grant budget credits, and control leaderboards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeauthorize}
              className="px-3 py-1.5 bg-[#0A0A14] hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold uppercase rounded-xl transition flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>LOCK CONSOLE</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 bg-[#FF1744]/10 border border-[#FF1744]/40 rounded-xl text-[#FF1744] text-xs font-bold text-center shadow-glow-cyan animate-fadeIn">
          {statusMessage}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'rooms', label: 'ROOMS & LOBBIES', icon: Radio },
          { id: 'players', label: 'FOOTBALLER INJECTOR', icon: PlusCircle },
          { id: 'budget', label: 'BUDGET & CREDITS', icon: Coins },
          { id: 'leaderboard', label: 'LEADERBOARD ELO', icon: Trophy },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(t.id as any);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                isActive
                  ? 'bg-[#FF1744] text-slate-950 shadow-glow-cyan'
                  : 'bg-[#0E1324] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACTIVE ROOMS MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="bg-[#0E1324] rounded-2xl border border-[#FF1744]/20 p-3 sm:p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white font-display">
                ACTIVE MULTIPLAYER ROOMS
              </h2>
              <p className="text-[11px] text-slate-400">Force status change or terminate rooms</p>
            </div>
            <button
              onClick={fetchLiveSessions}
              className="p-2 rounded-xl bg-[#0A0A14] border border-slate-700 hover:border-[#FF1744] text-slate-400 hover:text-[#FF1744] transition"
              title="Refresh Rooms"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {liveSessions.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500 font-mono">No active rooms found on server.</p>
            ) : (
              liveSessions.map((session) => (
                <div key={session.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0A0A14] border border-[#FF1744]/30 flex items-center justify-center font-mono font-black text-[#FF1744] text-sm">
                      {session.session_code || session.sessionCode}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm font-mono tracking-wider">
                          CODE: {session.session_code || session.sessionCode}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/40">
                          {session.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Created: {new Date(session.created_at || session.createdAt || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleAdvanceRoomStatus(session.id, 'AUCTION')}
                      className="px-3 py-1.5 rounded-xl bg-[#0A0A14] hover:bg-[#12182D] border border-slate-700 text-xs font-bold text-white transition"
                    >
                      Force AUCTION
                    </button>
                    <button
                      onClick={() => handleAdvanceRoomStatus(session.id, 'MATCHES')}
                      className="px-3 py-1.5 rounded-xl bg-[#0A0A14] hover:bg-[#12182D] border border-slate-700 text-xs font-bold text-white transition"
                    >
                      Force MATCHES
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(session.id)}
                      className="p-2 rounded-xl bg-[#0A0A14] hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
                      title="Terminate Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FOOTBALLER INJECTOR */}
      {activeTab === 'players' && (
        <div className="bg-[#0E1324] rounded-2xl border border-[#FF1744]/20 p-3 sm:p-4 shadow-xl space-y-3.5">
          
          {/* OFFICIAL CATALOG AUTO-SYNC CARD */}
          <div className="p-3 rounded-xl bg-[#0A0A14] border border-[#FF1744]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#FF1744]" />
                OFFICIAL 110+ PLAYER CATALOG SYNC
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ensure all 110 superstars, wonderkids, and legends (including Messi 92, Ronaldo 92, Zidane, Ronaldinho) are in your live auction pool.
              </p>
              {syncResult && (
                <p className="text-[10px] font-mono mt-1 text-emerald-400 font-bold">
                  Status: {syncResult.totalInDb}/{syncResult.totalInCatalog} players currently in database. {syncResult.synced > 0 ? `(+${syncResult.synced} newly synced)` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSyncAllPlayers}
              disabled={syncingPlayers}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black text-xs uppercase tracking-wider transition whitespace-nowrap shadow-glow-cyan cursor-pointer disabled:opacity-50"
            >
              {syncingPlayers ? 'SYNCING PLAYERS...' : '⚡ SYNC ALL 110 PLAYERS TO DB'}
            </button>
          </div>

          <div className="pb-2 border-b border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-widest text-white font-display">
              CREATE CUSTOM SUPERSTAR FOOTBALLER
            </h2>
            <p className="text-[10px] text-slate-400">Inject custom players directly into your draft auction pool</p>
          </div>

          <form onSubmit={handleCreatePlayer} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  placeholder="e.g. Wayne Rooney"
                  className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Position</label>
                <select
                  value={newPlayerPos}
                  onChange={e => setNewPlayerPos(e.target.value as any)}
                  className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#FF1744] text-xs font-bold"
                >
                  <option value="ATT">ATT (Forward)</option>
                  <option value="MID">MID (Midfield)</option>
                  <option value="DEF">DEF (Defender)</option>
                  <option value="GK">GK (Goalkeeper)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nationality</label>
                <input
                  type="text"
                  value={newPlayerNat}
                  onChange={e => setNewPlayerNat(e.target.value)}
                  placeholder="e.g. England"
                  className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-xs font-bold"
                />
              </div>
            </div>

            {/* Attributes slider grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0A0A14] p-3 rounded-xl border border-slate-800">
              {[
                { label: 'Overall (OVR)', val: newPlayerOvr, set: setNewPlayerOvr },
                { label: 'Pace (PAC)', val: newPlayerPac, set: setNewPlayerPac },
                { label: 'Shooting (SHO)', val: newPlayerSho, set: setNewPlayerSho },
                { label: 'Passing (PAS)', val: newPlayerPas, set: setNewPlayerPas },
                { label: 'Dribbling (DRI)', val: newPlayerDri, set: setNewPlayerDri },
                { label: 'Defending (DEF)', val: newPlayerDef, set: setNewPlayerDef },
                { label: 'Physical (PHY)', val: newPlayerPhy, set: setNewPlayerPhy },
                { label: 'Market Value (€M)', val: newPlayerValue, set: setNewPlayerValue, max: 200 },
              ].map(st => (
                <div key={st.label}>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                    <span>{st.label}</span>
                    <span className="text-[#FF1744] font-mono font-black">{st.val}</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={st.max || 99}
                    value={st.val}
                    onChange={e => st.set(Number(e.target.value))}
                    className="w-full accent-[#FF1744]"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Avatar Image URL (Optional)</label>
              <input
                type="text"
                value={newPlayerAvatar}
                onChange={e => setNewPlayerAvatar(e.target.value)}
                placeholder="https://...png"
                className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-gradient-to-r from-[#FF1744] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan"
            >
              + INJECT SUPERSTAR INTO DATABASE
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: BUDGET & CREDITS CHEATS */}
      {activeTab === 'budget' && (
        <div className="bg-[#0E1324] rounded-2xl border border-[#FF1744]/20 p-3 sm:p-4 shadow-xl space-y-3">
          <div className="pb-2 border-b border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-widest text-white font-display">
              ECONOMY & SQUAD BUDGET CONTROLS
            </h2>
            <p className="text-[10px] text-slate-400">Instantly modify budget credits for any manager team</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Team</label>
              <select
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-[#FF1744]"
              >
                {allTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.badgeIcon} {t.name} (Current: €{t.budget}M)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quick Grant Options</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleGrantBudget(150)}
                  className="py-2 px-2.5 bg-[#0A0A14] hover:bg-[#12182D] border border-slate-700 text-[#FF1744] text-xs font-black rounded-xl transition"
                >
                  €150M Default
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantBudget(300)}
                  className="py-2 px-2.5 bg-[#0A0A14] hover:bg-[#12182D] border border-slate-700 text-amber-400 text-xs font-black rounded-xl transition"
                >
                  €300M Mega
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantBudget(999)}
                  className="py-2 px-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black rounded-xl transition shadow-glow-purple"
                >
                  €999M Infinite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEADERBOARD ELO ADJUSTER */}
      {activeTab === 'leaderboard' && (
        <div className="bg-[#0E1324] rounded-2xl border border-[#FF1744]/20 p-3 sm:p-4 shadow-xl space-y-3">
          <div className="pb-2 border-b border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-widest text-white font-display">
              LEADERBOARD ELO CHEAT ENGINE
            </h2>
            <p className="text-[10px] text-slate-400">Manually grant or deduct career ELO rating points</p>
          </div>

          <form onSubmit={handleAdjustElo} className="space-y-4 max-w-md">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Username</label>
              <input
                type="text"
                required
                value={targetUsername}
                onChange={e => setTargetUsername(e.target.value)}
                placeholder="e.g. rahil"
                className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ELO Points to Add (+ or -)</label>
              <input
                type="number"
                value={eloAmount}
                onChange={e => setEloAmount(Number(e.target.value))}
                className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF1744] text-xs font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan"
            >
              APPLY ELO ADJUSTMENT
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
