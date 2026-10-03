import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import type { ActiveTab } from '../types';

const BADGES = ['⚡', '🔥', '🦁', '🐉', '⭐', '🚀', '🏆', '🎯', '🦅', '💎', '🌟', '⚔️'];

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
}

type DashboardModal = 'none' | 'create' | 'join';

export function Dashboard({ setActiveTab, onStartMatch }: any) {
  const { profile } = useAuth();
  const { currentSession, createGame, joinGame, loadingSession } = useSession();
  const [modal, setModal] = useState<DashboardModal>('none');
  const [error, setError] = useState('');

  // Create Game form state
  const [teamName, setTeamName] = useState(profile ? `${profile.displayName} FC` : '');
  const [abbreviation, setAbbreviation] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('⚡');
  const [createdCode, setCreatedCode] = useState('');

  // Join Game form state
  const [joinCode, setJoinCode] = useState('');
  const [joinTeamName, setJoinTeamName] = useState(profile ? `${profile.displayName} FC` : '');
  const [joinAbbr, setJoinAbbr] = useState('');
  const [joinBadge, setJoinBadge] = useState('🔥');

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!teamName.trim()) { setError('Team name is required.'); return; }
    const abbr = abbreviation || teamName.slice(0, 3).toUpperCase();
    const { sessionCode, error: err } = await createGame(teamName, abbr, selectedBadge);
    if (err) { setError(err); return; }
    if (sessionCode) setCreatedCode(sessionCode);
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!joinCode.trim()) { setError('Game code is required.'); return; }
    if (!joinTeamName.trim()) { setError('Team name is required.'); return; }
    const abbr = joinAbbr || joinTeamName.slice(0, 3).toUpperCase();
    const { error: err } = await joinGame(joinCode, joinTeamName, abbr, joinBadge);
    if (err) { setError(err); return; }
    setModal('none');
    setActiveTab('lobby');
  };

  const stats = [
    { label: 'Games Played', value: profile?.gamesPlayed ?? 0, icon: '🎮' },
    { label: 'Wins', value: profile?.wins ?? 0, icon: '🏆' },
    { label: 'Draws', value: profile?.draws ?? 0, icon: '🤝' },
    { label: 'Losses', value: profile?.losses ?? 0, icon: '💔' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-green-900/40 to-gray-900 border border-green-800/30 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-green-500/20">
            {profile?.displayName?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-gray-400 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{profile?.displayName ?? 'Manager'}</h1>
            <p className="text-green-400 text-sm">@{profile?.username ?? '...'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!currentSession ? (
          <>
            <button
              onClick={() => { setModal('create'); setError(''); setCreatedCode(''); }}
              className="group bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 rounded-2xl p-6 text-left transition-all shadow-lg shadow-green-500/10 hover:shadow-green-500/20 hover:-translate-y-0.5"
            >
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="text-xl font-bold text-white mb-1">Create Game</h2>
              <p className="text-green-200/70 text-sm">Host a new draft session and invite your friends with a 6-letter code.</p>
            </button>

            <button
              onClick={() => { setModal('join'); setError(''); }}
              className="group bg-gray-900 border border-gray-800 hover:border-green-800/50 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="text-3xl mb-3">🎯</div>
              <h2 className="text-xl font-bold text-white mb-1">Join Game</h2>
              <p className="text-gray-400 text-sm">Enter a 6-letter code from your friend to join their draft session.</p>
            </button>
          </>
        ) : (
          <div className="md:col-span-2 bg-gradient-to-br from-green-900/40 to-gray-900 border border-green-800/40 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">Active Session</p>
                <h2 className="text-xl font-bold text-white">Code: {currentSession.sessionCode}</h2>
                <p className="text-gray-400 text-sm mt-1">Status: <span className="text-green-400 capitalize">{currentSession.status.toLowerCase()}</span></p>
              </div>
              <button
                onClick={() => setActiveTab('lobby')}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
              >
                View Lobby →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xl mb-2">⚽</div>
          <h3 className="font-semibold text-white mb-1">50 Players</h3>
          <p className="text-gray-500 text-xs">World-class players available in the auction pool.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xl mb-2">💰</div>
          <h3 className="font-semibold text-white mb-1">€100M Budget</h3>
          <p className="text-gray-500 text-xs">Each manager gets €100M to bid on players.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xl mb-2">🏟️</div>
          <h3 className="font-semibold text-white mb-1">7-a-side</h3>
          <p className="text-gray-500 text-xs">Build your 7-player squad and simulate matches.</p>
        </div>
      </div>

      {/* CREATE GAME MODAL */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">🚀 Create Game</h2>
              <button onClick={() => setModal('none')} className="text-gray-400 hover:text-white transition-colors text-xl">✕</button>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
              {createdCode ? (
                <div className="text-center space-y-4">
                  <div className="text-5xl">🎉</div>
                  <h3 className="text-lg font-bold text-white">Game Created!</h3>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">Your game code is:</p>
                    <p className="text-4xl font-bold text-green-400 tracking-widest font-mono">{createdCode}</p>
                    <p className="text-gray-500 text-xs mt-2">Share this code with friends to join your game.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(createdCode)}
                      className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                    >
                      📋 Copy Code
                    </button>
                    <button
                      onClick={() => { setModal('none'); setActiveTab('lobby'); }}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                      Go to Lobby →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="e.g. Rahil FC"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Abbreviation (3 letters)</label>
                    <input
                      type="text"
                      value={abbreviation}
                      onChange={e => setAbbreviation(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. RHF"
                      maxLength={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Team Badge</label>
                    <div className="grid grid-cols-6 gap-2">
                      {BADGES.map(b => (
                        <button key={b} type="button" onClick={() => setSelectedBadge(b)}
                          className={`aspect-square flex items-center justify-center text-xl rounded-lg border transition-all ${
                            selectedBadge === b ? 'border-green-500 bg-green-500/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                        >{b}</button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loadingSession}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {loadingSession ? 'Creating...' : '🚀 Create Game'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JOIN GAME MODAL */}
      {modal === 'join' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">🎯 Join Game</h2>
              <button onClick={() => setModal('none')} className="text-gray-400 hover:text-white transition-colors text-xl">✕</button>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
              <form onSubmit={handleJoinGame} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Game Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. F7K92A"
                    maxLength={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm font-mono tracking-widest uppercase text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Your Team Name</label>
                  <input
                    type="text"
                    value={joinTeamName}
                    onChange={e => setJoinTeamName(e.target.value)}
                    placeholder="e.g. Aashish United"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Abbreviation (3 letters)</label>
                  <input
                    type="text"
                    value={joinAbbr}
                    onChange={e => setJoinAbbr(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="e.g. ASH"
                    maxLength={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Team Badge</label>
                  <div className="grid grid-cols-6 gap-2">
                    {BADGES.map(b => (
                      <button key={b} type="button" onClick={() => setJoinBadge(b)}
                        className={`aspect-square flex items-center justify-center text-xl rounded-lg border transition-all ${
                          joinBadge === b ? 'border-green-500 bg-green-500/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >{b}</button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loadingSession}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {loadingSession ? 'Joining...' : '🎯 Join Game'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
