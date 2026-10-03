import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import type { ActiveTab } from '../types';

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
}

export default function LobbyPage({ setActiveTab }: Props) {
  const { user, profile } = useAuth();
  const { currentSession, myTeam, lobbyMembers, allTeams, loadingSession, startAuction, leaveGame } = useSession();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!currentSession) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🏟️</div>
        <h2 className="text-xl font-bold text-white mb-2">No Active Game</h2>
        <p className="text-gray-400 mb-6">Create or join a game from the dashboard.</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const isHost = currentSession.hostUserId === user?.id;
  const memberCount = lobbyMembers.length;

  // Auto-redirect all players when host starts auction or matches
  React.useEffect(() => {
    if (currentSession?.status === 'AUCTION') {
      setActiveTab('auction');
    } else if (currentSession?.status === 'MATCHES') {
      setActiveTab('matches');
    }
  }, [currentSession?.status, setActiveTab]);

  const copyCode = () => {
    navigator.clipboard.writeText(currentSession.sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartAuction = async () => {
    setStartError('');
    setStarting(true);
    const { error } = await startAuction();
    if (error) setStartError(error);
    else setActiveTab('auction');
    setStarting(false);
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this game?')) return;
    await leaveGame();
    setActiveTab('dashboard');
  };

  const statusColor = {
    LOBBY: 'text-yellow-400',
    AUCTION: 'text-green-400',
    TEAM_SETUP: 'text-blue-400',
    MATCHES: 'text-purple-400',
    COMPLETED: 'text-gray-400',
  }[currentSession.status] ?? 'text-gray-400';

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Session Header */}
      <div className="bg-gradient-to-br from-green-900/30 to-gray-900 border border-green-800/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Game Lobby</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${statusColor}`}>
                • {currentSession.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {myTeam?.teamName ?? 'Your Game'}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {memberCount} / {currentSession.maxPlayers} players joined
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Game Code</p>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-4 py-2 transition-colors"
            >
              <span className="text-2xl font-bold text-green-400 font-mono tracking-widest">
                {currentSession.sessionCode}
              </span>
              <span className="text-gray-400 text-sm">{copied ? '✓' : '📋'}</span>
            </button>
          </div>
        </div>

        {/* Session config pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-gray-800/50 border border-gray-700/50 text-gray-300 text-xs px-3 py-1 rounded-full">
            💰 €{currentSession.startingBudget}M Budget
          </span>
          <span className="bg-gray-800/50 border border-gray-700/50 text-gray-300 text-xs px-3 py-1 rounded-full">
            👤 {currentSession.squadSize} players per squad
          </span>
          <span className="bg-gray-800/50 border border-gray-700/50 text-gray-300 text-xs px-3 py-1 rounded-full">
            🏆 {currentSession.seasonLength} match season
          </span>
        </div>
      </div>

      {/* Players in Lobby */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Players in Lobby</h2>
          <span className="text-xs text-gray-500">{memberCount} joined</span>
        </div>
        <div className="divide-y divide-gray-800">
          {lobbyMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-3xl mb-2">⏳</div>
              <p>Waiting for players to join...</p>
            </div>
          ) : (
            lobbyMembers.map((member) => {
              const memberTeam = allTeams.find(t => t.userId === member.userId);
              const isMe = member.userId === user?.id;
              const isMemberHost = member.userId === currentSession.hostUserId;

              return (
                <div key={member.userId} className="flex items-center gap-4 px-5 py-4">
                  {/* Badge */}
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {memberTeam?.badgeIcon ?? '⚽'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">
                        {memberTeam?.teamName ?? member.profile?.displayName ?? 'Unknown'}
                      </span>
                      {isMemberHost && (
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 flex-shrink-0">
                          HOST
                        </span>
                      )}
                      {isMe && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30 flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      @{member.profile?.username ?? '...'}
                      {memberTeam && ` · ${memberTeam.abbreviation}`}
                    </p>
                  </div>

                  {/* Budget */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 font-semibold text-sm">
                      €{memberTeam?.budget ?? currentSession.startingBudget}M
                    </p>
                    <p className="text-xs text-gray-500">budget</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && currentSession.status === 'LOBBY' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white">🎛️ Host Controls</h2>
          {startError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {startError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleStartAuction}
              disabled={starting || loadingSession || memberCount < 1}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? '⏳ Starting Draft...' : `⚡ Start Auction (${memberCount} Player${memberCount === 1 ? '' : 's'} Ready)`}
            </button>
          </div>
          {memberCount < 2 && (
            <p className="text-xs text-gray-500 text-center">
              You can start drafting solo or wait for friends to enter code <span className="text-green-400 font-mono font-bold">{currentSession.sessionCode}</span>.
            </p>
          )}
        </div>
      )}

      {/* Non-host waiting message */}
      {!isHost && currentSession.status === 'LOBBY' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-center space-y-1">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-gray-200 font-semibold">
            Waiting for host <span className="text-green-400 font-bold">{allTeams.find(t => t.userId === currentSession.hostUserId)?.teamName || 'Host'}</span> to click Start Auction...
          </p>
          <p className="text-gray-400 text-xs">
            {memberCount} player{memberCount === 1 ? '' : 's'} connected in lobby. As soon as the host starts, everyone will enter the live auction room automatically!
          </p>
        </div>
      )}

      {/* If auction is live, go to it */}
      {currentSession.status === 'AUCTION' && (
        <div className="bg-green-900/30 border border-green-800/40 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🔥</div>
          <p className="text-white font-bold">Auction is LIVE!</p>
          <button
            onClick={() => setActiveTab('auction')}
            className="mt-3 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Auction →
          </button>
        </div>
      )}

      {/* Leave button */}
      <div className="text-center">
        <button
          onClick={handleLeave}
          className="text-sm text-gray-600 hover:text-red-400 transition-colors"
        >
          Leave Game
        </button>
      </div>
    </div>
  );
}
