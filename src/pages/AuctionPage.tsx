import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useAuction } from '../contexts/AuctionContext';
import type { ActiveTab } from '../types';

interface Props {
  setActiveTab: (tab: ActiveTab) => void;
}

const positionColor: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MID: 'bg-green-500/20 text-green-400 border-green-500/30',
  ATT: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function OverallBadge({ value }: { value: number }) {
  const color = value >= 90 ? 'from-yellow-400 to-orange-400' : value >= 85 ? 'from-green-400 to-emerald-500' : 'from-blue-400 to-cyan-500';
  return (
    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${color} rounded-xl font-bold text-gray-900 text-lg`}>
      {value}
    </div>
  );
}

export function AuctionPage({ setActiveTab }: any) {
  const { user } = useAuth();
  const { currentSession, startAuction } = useSession();
  const {
    currentAuction,
    currentPlayer,
    bids,
    mySquad,
    myTeam,
    allTeams,
    timeLeft,
    auctionComplete,
    placeBid,
    nextPlayer,
    skipPlayer,
  } = useAuction();

  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  const isHost = currentSession?.hostUserId === user?.id;
  const minBid = (currentAuction?.currentBid ?? 0) + 1;

  const highestBidTeam = useMemo(() => {
    if (!currentAuction?.highestTeamId) return null;
    return allTeams.find(t => t.id === currentAuction.highestTeamId) ?? null;
  }, [currentAuction, allTeams]);

  const myTeamIsHighest = myTeam && currentAuction?.highestTeamId === myTeam.id;

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      setBidError(`Bid must be at least €${minBid}M`);
      return;
    }
    setSubmittingBid(true);
    const { error } = await placeBid(amount);
    if (error) setBidError(error);
    else {
      setBidSuccess(`Bid of €${amount}M placed!`);
      setBidAmount('');
      setTimeout(() => setBidSuccess(''), 3000);
    }
    setSubmittingBid(false);
  };

  const handleNext = async () => {
    const { error } = await nextPlayer();
    if (error) setBidError(error);
    setBidAmount('');
    setBidError('');
    setBidSuccess('');
  };

  const handleSkip = async () => {
    const { error } = await skipPlayer();
    if (error) setBidError(error);
    setBidAmount('');
    setBidError('');
    setBidSuccess('');
  };

  // No session at all
  if (!currentSession) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-gray-400">No active game session.</p>
        <button onClick={() => setActiveTab && setActiveTab('dashboard')} className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg">
          Dashboard
        </button>
      </div>
    );
  }

  // Auction complete
  if (auctionComplete) {
    const handleContinueToMatches = async () => {
      if (currentSession) {
        await supabase
          .from('game_sessions')
          .update({ status: 'MATCHES' })
          .eq('id', currentSession.id);
      }
      if (typeof setActiveTab === 'function') {
        setActiveTab('matches');
      }
    };

    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto py-12 space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-3xl shadow-xl shadow-amber-500/20 mb-2">
            🏆
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide">AUCTION COMPLETE</h1>
          <p className="text-gray-400 text-sm">Drafting has ended. Squads are finalized for the season!</p>
        </div>

        {/* Your Team Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-gray-800 rounded-xl">{myTeam?.badgeIcon || myTeam?.badge || '⚡'}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-400">Your Team</p>
                <h2 className="text-xl font-bold text-white">{myTeam?.name || myTeam?.teamName || 'Your Club'}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Budget Remaining</p>
              <p className="text-2xl font-black text-green-400">€{myTeam?.budget ?? 100}M</p>
            </div>
          </div>

          {/* Squad List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">
                Squad ({mySquad.length}/7 Players)
              </h3>
              <span className="text-xs text-gray-500">Starting 7</span>
            </div>

            <div className="space-y-2">
              {mySquad.length === 0 ? (
                <div className="p-4 bg-gray-800/50 rounded-xl text-center text-xs text-gray-400">
                  Default squad allocated for match play.
                </div>
              ) : (
                mySquad.map(sq => (
                  <div key={sq.id} className="flex items-center justify-between bg-gray-800/70 border border-gray-700/60 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${positionColor[sq.player?.position ?? 'ATT'] ?? positionColor['ATT']}`}>
                        {sq.player?.position ?? 'ATT'}
                      </span>
                      <span className="font-semibold text-white text-sm">
                        {sq.player?.name ?? sq.playerId}
                      </span>
                      {sq.player?.overall && (
                        <span className="text-xs text-gray-400 font-mono">({sq.player.overall} OVR)</span>
                      )}
                    </div>
                    <span className="text-green-400 font-mono font-bold text-sm">€{sq.purchasePrice}M</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleContinueToMatches}
          className="w-full py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-gray-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-green-500/20 active:scale-98"
        >
          CONTINUE TO MATCHES →
        </button>
      </div>
    );
  }

  // Waiting for auction to start or load
  if (!currentAuction || currentSession.status !== 'AUCTION') {
    return (
      <div className="p-6 text-center py-20 space-y-4">
        {currentSession.status === 'LOBBY' ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-5xl mb-2">🏟️</div>
            <h2 className="text-2xl font-bold text-white">Draft Not Started</h2>
            {isHost ? (
              <div className="space-y-3 pt-2">
                <p className="text-gray-400 text-sm">You are the host! Start the live auction whenever all participants are ready in the lobby.</p>
                <button
                  onClick={async () => {
                    const { error } = await startAuction();
                    if (error) setBidError(error);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-green-500/20 active:scale-98"
                >
                  🚀 Start Auction Now
                </button>
                <button onClick={() => setActiveTab && setActiveTab('lobby')} className="text-xs text-gray-400 hover:text-white underline">
                  Back to Lobby
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-gray-400 text-sm">Waiting for the host to start the auction. You will be automatically connected as soon as it begins!</p>
                <button onClick={() => setActiveTab && setActiveTab('lobby')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm">
                  View Lobby
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 space-y-3">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-white font-bold text-lg">Preparing next player...</h3>
            <p className="text-gray-400 text-xs">Syncing real-time draft room</p>
          </div>
        )}
      </div>
    );
  }

  const timerColor = timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-yellow-400' : 'text-green-400';
  const timerPulse = timeLeft <= 5 ? 'animate-pulse' : '';

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ===== MAIN AUCTION PANEL ===== */}
        <div className="lg:col-span-2 space-y-4">

          {/* Player Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live Auction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  +3s / bid
                </span>
                <div className={`text-2xl font-bold font-mono ${timerColor} ${timerPulse}`}>
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Player Info */}
            {currentPlayer ? (
              <div className="p-5">
                <div className="flex items-start gap-5">
                  {/* Player avatar */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex flex-col items-center justify-center border border-gray-600 flex-shrink-0">
                    <span className="text-2xl font-bold text-white">
                      {(currentPlayer.shortName || currentPlayer.name || 'PL').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 ${positionColor[currentPlayer.position ?? 'ATT'] ?? positionColor['ATT']}`}>
                      {currentPlayer.position ?? 'ATT'}
                    </span>
                  </div>

                  {/* Name & stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{currentPlayer.name}</h2>
                        <p className="text-gray-400 text-sm">{currentPlayer.nationality || 'World'}</p>
                      </div>
                      <OverallBadge value={currentPlayer.overall ?? 75} />
                    </div>

                    {/* Attribute grid */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-3">
                      {currentPlayer.position === 'GK' ? (
                        <>
                          <div className="text-xs"><span className="text-gray-500">GK </span><span className="text-white font-semibold">{currentPlayer.goalkeeping ?? 10}</span></div>
                          <div className="text-xs"><span className="text-gray-500">REF </span><span className="text-white font-semibold">{currentPlayer.physical ?? 70}</span></div>
                          <div className="text-xs"><span className="text-gray-500">PAS </span><span className="text-white font-semibold">{currentPlayer.passing ?? 70}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs"><span className="text-gray-500">PAC </span><span className="text-white font-semibold">{currentPlayer.pace ?? 70}</span></div>
                          <div className="text-xs"><span className="text-gray-500">SHO </span><span className="text-white font-semibold">{currentPlayer.shooting ?? 70}</span></div>
                          <div className="text-xs"><span className="text-gray-500">PAS </span><span className="text-white font-semibold">{currentPlayer.passing ?? 70}</span></div>
                          <div className="text-xs"><span className="text-gray-500">DRI </span><span className="text-white font-semibold">{currentPlayer.dribbling ?? 70}</span></div>
                          <div className="text-xs"><span className="text-gray-500">DEF </span><span className="text-white font-semibold">{currentPlayer.defending ?? 70}</span></div>
                          <div className="text-xs"><span className="text-gray-500">PHY </span><span className="text-white font-semibold">{currentPlayer.physical ?? 70}</span></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-300">Loading player scouting card...</p>
              </div>
            )}

            {/* Bid Info */}
            <div className="border-t border-gray-700 grid grid-cols-3 divide-x divide-gray-700">
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Starting</p>
                <p className="text-lg font-bold text-white">€{currentAuction.startingPrice}M</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Current Bid</p>
                <p className="text-2xl font-bold text-green-400">
                  {currentAuction.currentBid > 0 ? `€${currentAuction.currentBid}M` : '–'}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Leader</p>
                <p className="text-sm font-bold text-white truncate">
                  {highestBidTeam ? (
                    <span className={myTeamIsHighest ? 'text-green-400' : 'text-white'}>
                      {myTeamIsHighest ? 'YOU 🎉' : (highestBidTeam.abbreviation)}
                    </span>
                  ) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Bid Controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            {bidError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{bidError}</div>}
            {bidSuccess && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{bidSuccess}</div>}

            {myTeamIsHighest && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
                🏆 You are the highest bidder!
              </div>
            )}

            <form onSubmit={handleBid} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">€</span>
                <input
                  type="number"
                  min={minBid}
                  max={myTeam?.budget ?? 100}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={`Min €${minBid}M`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submittingBid || currentAuction.status !== 'LIVE' || mySquad.length >= 7}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {submittingBid ? '...' : '💰 Bid'}
              </button>
            </form>

            {/* Quick bid buttons */}
            <div className="flex flex-wrap gap-2">
              {[minBid, minBid + 5, minBid + 10, minBid + 20].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBidAmount(String(amt))}
                  disabled={!myTeam || amt > myTeam.budget}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  €{amt}M
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-800">
              <span>💰 Budget: <span className="text-green-400 font-semibold">€{myTeam?.budget ?? '—'}M</span></span>
              <span>👥 Squad: <span className="text-white font-semibold">{mySquad.length}/7</span></span>
            </div>

            {/* Host controls */}
            {isHost && (
              <div className="space-y-2 pt-1 border-t border-gray-800">
                <div className="flex gap-2">
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    {currentAuction.currentBid > 0 ? '✓ Award & Next' : '→ Next Player'}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Skip
                  </button>
                </div>
                {mySquad.length >= 3 && (
                  <button
                    onClick={async () => {
                      if (confirm('Finish auction draft now and advance to matches?')) {
                        if (currentSession) {
                          await supabase
                            .from('game_sessions')
                            .update({ status: 'MATCHES' })
                            .eq('id', currentSession.id);
                        }
                        if (typeof setActiveTab === 'function') {
                          setActiveTab('matches');
                        }
                      }
                    }}
                    className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    🏁 Finish Auction & Start Matches
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div className="space-y-4">
          {/* Bid History */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-white text-sm">Bid History</h3>
            </div>
            <div className="divide-y divide-gray-800 max-h-48 overflow-y-auto">
              {bids.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-xs">No bids yet. Be the first!</div>
              ) : (
                bids.map(bid => {
                  const team = allTeams.find(t => t.id === bid.teamId);
                  const isMyBid = myTeam && bid.teamId === myTeam.id;
                  return (
                    <div key={bid.id} className={`flex items-center justify-between px-4 py-2.5 ${isMyBid ? 'bg-green-500/5' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{team?.badgeIcon ?? '⚽'}</span>
                        <span className="text-xs text-gray-300">{team?.abbreviation ?? '???'}</span>
                        {isMyBid && <span className="text-xs text-green-400">(you)</span>}
                      </div>
                      <span className="text-green-400 font-semibold text-sm">€{bid.amount}M</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Squad */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">My Squad</h3>
              <span className="text-xs text-gray-500">{mySquad.length}/7</span>
            </div>
            <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
              {mySquad.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-xs">No players yet. Start bidding!</div>
              ) : (
                mySquad.map(sq => (
                  <div key={sq.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${positionColor[sq.player?.position ?? 'ATT']}`}>
                        {sq.player?.position ?? '?'}
                      </span>
                      <span className="text-xs text-white truncate">{sq.player?.shortName ?? sq.playerId.slice(0, 8)}</span>
                    </div>
                    <span className="text-green-400 text-xs font-semibold flex-shrink-0">€{sq.purchasePrice}M</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teams Overview */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-white text-sm">All Teams</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {allTeams.map(t => {
                const isMe = myTeam && t.id === myTeam.id;
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-green-500/5' : ''}`}>
                    <span className="text-lg">{t.badgeIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{t.teamName}</p>
                    </div>
                    <span className="text-green-400 text-xs font-bold">€{t.budget}M</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuctionPage;
