import { useState, useEffect, useMemo } from 'react';
import { ActiveTab, MatchResult, Player, Team, UserAccount } from './types';
import { loadInitialState, saveState, resetToDefaults, applyMatchToStandings } from './services/gameStorage';
import { simulateMatch } from './simulation/engine';
import { calculateTeamOverall } from './utils/formatters';
import { supabase } from './lib/supabase';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';

import { Dashboard } from './pages/Dashboard';
import { PlayersPage } from './pages/PlayersPage';
import { MyTeamPage } from './pages/MyTeamPage';
import { LineupBuilderPage } from './pages/LineupBuilderPage';
import { MatchSetupPage } from './pages/MatchSetupPage';
import { MatchSimulationPage } from './pages/MatchSimulationPage';
import { LeaguePage } from './pages/LeaguePage';
import { AuctionPage } from './pages/AuctionPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';
import { EmailConfirmedPage } from './pages/EmailConfirmedPage';
import SeasonCompleteModal from './components/SeasonCompleteModal';
import { saveMatchToSupabase } from './services/sessionService';
import { useSession } from './contexts/SessionContext';
import { useAuth } from './contexts/AuthContext';
import { computeTournamentStandings, generateTournamentFixtures } from './utils/tournament';
import { syncPlayersToSupabase } from './services/playerSyncService';

export function App() {
  const {
    currentSession,
    myTeam: sessionTeam,
    allTeams: sessionAllTeams,
    sessionPlayers,
    sessionMatches,
    sessionStandings,
    tournamentFixtures,
    isTournamentComplete,
    tournamentWinner,
    latestMatchResult,
    clearSession,
    broadcastSimulatedMatch,
    updateLineup,
    remoteNavigation,
    broadcastNavigation,
  } = useSession();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const isHost = Boolean(currentSession ? currentSession.hostUserId === user?.id : true);
  const [guestMode, setGuestMode] = useState(false);
  const [gameState, setGameState] = useState(loadInitialState);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showSeasonComplete, setShowSeasonComplete] = useState(false);

  // Email confirmation link route detection
  const [isEmailConfirmedRoute, setIsEmailConfirmedRoute] = useState(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const pathname = window.location.pathname || '';
    return (
      hash.includes('access_token=') ||
      hash.includes('type=signup') ||
      hash.includes('type=email') ||
      hash.includes('type=email_change') ||
      hash.includes('error_description') ||
      hash.includes('error=') ||
      hash.includes('confirmed') ||
      search.includes('code=') ||
      search.includes('token_hash=') ||
      search.includes('type=signup') ||
      search.includes('type=email') ||
      search.includes('error_description') ||
      search.includes('confirmed') ||
      pathname.includes('/confirm')
    );
  });

  // Match setup & simulation state
  const [targetOpponentId, setTargetOpponentId] = useState<string>('');
  const [activeMatchResult, setActiveMatchResult] = useState<MatchResult | null>(null);

  // Auto-save whenever game state changes
  useEffect(() => {
    saveState(gameState);
  }, [gameState]);

  // Attempt background sync of official player catalog to Supabase
  useEffect(() => {
    syncPlayersToSupabase().catch(() => {});
  }, []);

  // Sync logged-in Supabase user with game state
  useEffect(() => {
    if (user) {
      const displayName = profile?.displayName || user.email?.split('@')[0] || 'Manager';
      const email = user.email || '';
      setGameState((prev) => ({
        ...prev,
        currentUser: {
          id: user.id,
          name: displayName,
          email: email,
          managerName: displayName,
          clubName: sessionTeam?.name || 'My Club',
          badgeIcon: sessionTeam?.badgeIcon || '⚡',
        }
      }));
    }
  }, [user, profile, sessionTeam]);

  // Combine offline prototype players with any real players drafted in multiplayer session
  const combinedPlayers = useMemo(() => {
    const map = new Map<string, Player>();
    (gameState.players || []).forEach(p => map.set(p.id, p));
    (sessionPlayers || []).forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [gameState.players, sessionPlayers]);

  // Dynamic user team — strictly derived from active session team (or null if no team yet)
  const userTeam = sessionTeam || (gameState.teams.find((t) => t.id === gameState.userTeamId) || null);

  const userStartingPlayers = (userTeam?.startingSeven || [])
    .map((id) => combinedPlayers.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const teamOverall = userStartingPlayers.length > 0 ? calculateTeamOverall(userStartingPlayers) : 0;

  const activeAllTeams = sessionAllTeams.length > 0 ? sessionAllTeams : gameState.teams;
  const opponentOptions = activeAllTeams.filter(t => t.id !== userTeam?.id);

  // Active fixtures, standings, and matches for tournament (3 matches per pair)
  const effectiveStandings = useMemo(() => {
    if (currentSession && sessionStandings.length > 0) {
      return sessionStandings;
    }
    const matches = currentSession ? sessionMatches : gameState.recentMatches;
    return computeTournamentStandings(activeAllTeams, matches);
  }, [currentSession, sessionStandings, sessionMatches, gameState.recentMatches, activeAllTeams]);

  const effectiveMatches = useMemo(() => {
    return currentSession ? sessionMatches : gameState.recentMatches;
  }, [currentSession, sessionMatches, gameState.recentMatches]);

  const effectiveFixtures = useMemo(() => {
    if (currentSession && tournamentFixtures.length > 0) {
      return tournamentFixtures;
    }
    return generateTournamentFixtures(activeAllTeams);
  }, [currentSession, tournamentFixtures, activeAllTeams]);

  const nextUnplayedFixture = useMemo(() => {
    if (effectiveFixtures.length === 0) return null;
    const completedCount = effectiveMatches.length;
    if (completedCount >= effectiveFixtures.length) return null;
    return effectiveFixtures[completedCount] || null;
  }, [effectiveFixtures, effectiveMatches]);

  // Synchronize remote navigation across room members
  useEffect(() => {
    if (remoteNavigation && currentSession) {
      if (remoteNavigation.opponentId) {
        setTargetOpponentId(remoteNavigation.opponentId);
      }
      setActiveTab(remoteNavigation.tab as ActiveTab);
    }
  }, [remoteNavigation, currentSession]);

  // When room status transitions to TEAM_SETUP, move room participants to lineup view
  useEffect(() => {
    if (currentSession?.status === 'TEAM_SETUP') {
      if (activeTab === 'auction' || activeTab === 'lobby') {
        setActiveTab('lineup');
      }
    }
  }, [currentSession?.status, activeTab]);

  // When room status transitions to MATCHES, move room participants to matches view
  useEffect(() => {
    if (currentSession?.status === 'MATCHES') {
      if (activeTab === 'auction' || activeTab === 'lobby' || activeTab === 'lineup') {
        setActiveTab('matches');
      }
    }
  }, [currentSession?.status, activeTab]);

  // When room status transitions back to AUCTION, move room participants back to auction view
  useEffect(() => {
    if (currentSession?.status === 'AUCTION' && currentSession?.gameMode !== 'ai') {
      if (activeTab === 'matches' || activeTab === 'lineup' || activeTab === 'simulation') {
        setActiveTab('auction');
      }
    }
  }, [currentSession?.status, currentSession?.gameMode, activeTab]);

  // Keep activeMatchResult in sync with real-time simulations and navigate joined players to watch
  useEffect(() => {
    if (latestMatchResult) {
      setActiveMatchResult(latestMatchResult);
      setActiveTab('simulation');
    }
  }, [latestMatchResult]);

  // When tournament finishes across room, trigger celebration modal
  useEffect(() => {
    if (isTournamentComplete) {
      setShowSeasonComplete(true);
    }
  }, [isTournamentComplete]);

  // Auto-simulate AI vs AI matches in AI mode without forcing the human to watch
  useEffect(() => {
    if (!currentSession || currentSession.gameMode !== 'ai' || currentSession.status !== 'MATCHES') return;
    if (!nextUnplayedFixture || !userTeam) return;

    const isHumanMatch = nextUnplayedFixture.homeTeamId === userTeam.id || nextUnplayedFixture.awayTeamId === userTeam.id;
    if (!isHumanMatch) {
      const homeTeam = activeAllTeams.find(t => t.id === nextUnplayedFixture.homeTeamId);
      const awayTeam = activeAllTeams.find(t => t.id === nextUnplayedFixture.awayTeamId);
      if (homeTeam && awayTeam) {
        const getTeamRoster = (team: Team): Player[] => {
          const teamPlayerIds = new Set([...(team.startingSeven || []), ...(team.bench || [])].filter(Boolean));
          const matched = combinedPlayers.filter(p => teamPlayerIds.has(p.id));
          if (matched.length > 0) return matched;
          return combinedPlayers.filter(p => (p as any).teamId === team.id || (p as any).currentClub === team.name);
        };
        const homeRoster = getTeamRoster(homeTeam);
        const awayRoster = getTeamRoster(awayTeam);
        const result = simulateMatch(
          { team: homeTeam, players: homeRoster },
          { team: awayTeam, players: awayRoster }
        );
        result.matchweek = effectiveMatches.length + 1;
        broadcastSimulatedMatch(result);
      }
    }
  }, [currentSession?.gameMode, currentSession?.status, nextUnplayedFixture, userTeam?.id, activeAllTeams, combinedPlayers, effectiveMatches.length]);

  // Launch Match Setup
  const handleStartMatchSetup = (opponentTeamId: string) => {
    setTargetOpponentId(opponentTeamId);
    setActiveTab('matches');
    if (currentSession && isHost) {
      broadcastNavigation('matches', opponentTeamId);
    }
  };

  // Run the Simulation Engine
  const handleExecuteSimulation = async (opponentTeamId?: string) => {
    if (currentSession && !isHost) return;
    let homeTeam: Team | undefined;
    let awayTeam: Team | undefined;

    if (nextUnplayedFixture) {
      homeTeam = activeAllTeams.find(t => t.id === nextUnplayedFixture.homeTeamId);
      awayTeam = activeAllTeams.find(t => t.id === nextUnplayedFixture.awayTeamId);
    }

    if (!homeTeam) {
      homeTeam = userTeam || activeAllTeams[0];
    }

    if (!awayTeam) {
      awayTeam = activeAllTeams.find(t => t.id === opponentTeamId) || opponentOptions[0] || {
        id: 'ai-sparring-bot',
        name: 'Apex AI Rivals',
        shortCode: 'AI',
        teamName: 'Apex AI Rivals',
        abbreviation: 'AI',
        manager: 'Sparring Bot',
        budget: 130,
        badgeIcon: '🤖',
        badge: '🤖',
        startingSeven: [],
        bench: [],
        formation: '1-2-2-2',
      };
    }

    if (!homeTeam) return;

    try {
      // Extract ONLY the players that genuinely belong to homeTeam and awayTeam
      const getTeamRoster = (team: Team): Player[] => {
        const teamPlayerIds = new Set([
          ...(team.startingSeven || []),
          ...(team.bench || [])
        ].filter(Boolean));

        const matched = combinedPlayers.filter(p => teamPlayerIds.has(p.id));
        if (matched.length > 0) return matched;
        return combinedPlayers.filter(p => (p as any).teamId === team.id || (p as any).currentClub === team.name);
      };

      const homeRoster = getTeamRoster(homeTeam);
      const awayRoster = getTeamRoster(awayTeam);

      const result = simulateMatch(
        { team: homeTeam, players: homeRoster },
        { team: awayTeam, players: awayRoster }
      );

      result.matchweek = effectiveMatches.length + 1;

      // Update player season stats
      const updatedPlayers = gameState.players.map((p) => {
        const matchRating = result.playerRatings[p.id];
        if (!matchRating) return p;

        const prevMatches = p.stats.matches;
        const newMatches = prevMatches + 1;
        const newGoals = p.stats.goals + matchRating.goals;
        const newAssists = p.stats.assists + matchRating.assists;
        const newRating = Number(
          (((p.stats.avgRating * prevMatches) + matchRating.rating) / newMatches).toFixed(1)
        );

        return {
          ...p,
          stats: {
            ...p.stats,
            matches: newMatches,
            goals: newGoals,
            assists: newAssists,
            avgRating: newRating
          }
        };
      });

      if (currentSession) {
        await broadcastSimulatedMatch(result);
        setGameState((prev) => ({
          ...prev,
          players: updatedPlayers,
        }));
      } else {
        const updatedMatches = [...gameState.recentMatches, result];
        const updatedStandings = computeTournamentStandings(activeAllTeams, updatedMatches);

        setGameState((prev) => ({
          ...prev,
          standings: updatedStandings,
          players: updatedPlayers,
          recentMatches: updatedMatches
        }));

        if (effectiveFixtures.length > 0 && updatedMatches.length >= effectiveFixtures.length) {
          setShowSeasonComplete(true);
        }
      }

      setActiveMatchResult(result);
      setActiveTab('simulation');
    } catch (err) {
      console.error('Match simulation error:', err);
    }
  };

  // Lineup update handler
  const handleUpdateLineup = (newStartingSeven: string[], newBench: string[], formation?: string) => {
    if (!userTeam) return;
    if (currentSession && userTeam.id) {
      updateLineup(userTeam.id, newStartingSeven, newBench, formation);
    }
    setGameState((prev) => {
      const updatedTeams = prev.teams.map((t) => {
        if (t.id === userTeam.id) {
          return {
            ...t,
            startingSeven: newStartingSeven,
            bench: newBench,
            formation: formation || t.formation
          };
        }
        return t;
      });
      return {
        ...prev,
        teams: updatedTeams
      };
    });
  };

  // Auction bid handler
  const handlePlaceBid = (auctionId: string, amount: number) => {
    if (!userTeam) return;
    setGameState((prev) => {
      const updatedAuctions = prev.auctions.map((auc) => {
        if (auc.id === auctionId) {
          return {
            ...auc,
            currentBid: amount,
            highestBidderTeamId: userTeam.id,
            highestBidderName: userTeam.name,
            minNextBid: amount + 5
          };
        }
        return auc;
      });

      // Update team budget
      const updatedTeams = prev.teams.map((t) => {
        if (t.id === userTeam.id) {
          return {
            ...t,
            budget: Math.max(0, t.budget - (amount * 0.1)) // 10% deposit / prototype bid
          };
        }
        return t;
      });

      return {
        ...prev,
        auctions: updatedAuctions,
        teams: updatedTeams
      };
    });
  };

  // Team profile update handler
  const handleUpdateTeamProfile = (newName: string, newManager: string) => {
    if (!userTeam) return;
    setGameState((prev) => {
      const updatedTeams = prev.teams.map((t) => {
        if (t.id === userTeam.id) {
          return {
            ...t,
            name: newName,
            manager: newManager
          };
        }
        return t;
      });

      const updatedStandings = prev.standings.map((s) => {
        if (s.teamId === userTeam.id) {
          return {
            ...s,
            teamName: newName
          };
        }
        return s;
      });

      return {
        ...prev,
        teams: updatedTeams,
        standings: updatedStandings
      };
    });
  };

  // Reset season handler
  const handleResetSeason = () => {
    const fresh = resetToDefaults();
    setGameState(fresh);
    setActiveMatchResult(null);
    setActiveTab('dashboard');
  };

  // Super Admin handlers
  const handleAddPlayer = (newPlayer: Player) => {
    setGameState((prev) => ({
      ...prev,
      players: [newPlayer, ...prev.players]
    }));
  };

  const handleUpdateTeamBudget = (teamId: string, newBudget: number) => {
    setGameState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => t.id === teamId ? { ...t, budget: newBudget } : t)
    }));
  };

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    setGameState((prev) => ({
      ...prev,
      currentUser: user,
    }));
    setIsAuthOpen(false);
  };

  const handleSignUp = (user: UserAccount) => {
    setGameState((prev) => ({
      ...prev,
      currentUser: user,
      savedAccounts: [...(prev.savedAccounts || []).filter((a) => a.email !== user.email), user],
    }));
    setIsAuthOpen(false);
  };

  const handleLogOut = async () => {
    await signOut();
    setGuestMode(false);
    setIsAuthOpen(false);
    setGameState((prev) => ({
      ...prev,
      currentUser: null
    }));
  };

  // Loading state while checking persistent Supabase session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070b0e] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400 font-bold tracking-wider text-sm uppercase">Loading Football Draft FC...</p>
        </div>
      </div>
    );
  }

  // DEDICATED EMAIL CONFIRMED PAGE (Intercepts Supabase email confirmation links)
  if (isEmailConfirmedRoute) {
    return (
      <EmailConfirmedPage
        onContinue={() => {
          setIsEmailConfirmedRoute(false);
          setIsAuthOpen(false);
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {}
          setActiveTab('dashboard');
        }}
        onGoToLogin={() => {
          setIsEmailConfirmedRoute(false);
          setGuestMode(false);
          setIsAuthOpen(true);
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {}
        }}
      />
    );
  }

  // SIGN IN & LOGIN AS THE FIRST PAGE IN THE APPLICATION
  if ((!user && !guestMode) || isAuthOpen) {
    return (
      <AuthPage
        onLogin={(acc) => {
          if (acc) handleLogin(acc);
          setIsAuthOpen(false);
        }}
        onSignUp={(acc) => {
          if (acc) handleSignUp(acc);
          setIsAuthOpen(false);
        }}
        onContinueGuest={() => {
          setGuestMode(true);
          setIsAuthOpen(false);
        }}
        savedAccounts={gameState.savedAccounts || []}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Header */}
      <Header
        currentTeam={userTeam}
        teamOverall={teamOverall}
        currentUser={gameState.currentUser}
        onLogOut={handleLogOut}
        onOpenAuth={() => {
          setGuestMode(false);
          setIsAuthOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onQuickSimulate={userTeam && opponentOptions.length > 0 ? () => handleStartMatchSetup(opponentOptions[0]?.id) : undefined}
      />

      {/* Navigation Bar (Desktop top nav + Mobile drawer & bottom bar) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onStartMatch={handleStartMatchSetup}
          />
        )}

        {activeTab === 'my-team' && (
          <MyTeamPage
            currentTeam={userTeam}
            allPlayers={combinedPlayers}
            onUpdateLineup={handleUpdateLineup}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'lineup' && (
          <LineupBuilderPage
            currentTeam={userTeam}
            allPlayers={combinedPlayers}
            onUpdateLineup={handleUpdateLineup}
            setActiveTab={setActiveTab}
            isHost={isHost}
          />
        )}

        {activeTab === 'players' && (
          <PlayersPage
            players={combinedPlayers}
            userTeamId={userTeam?.id || ''}
          />
        )}

        {activeTab === 'matches' && (
          <MatchSetupPage
            currentTeam={
              nextUnplayedFixture
                ? (activeAllTeams.find(t => t.id === nextUnplayedFixture.homeTeamId) || userTeam)
                : userTeam
            }
            allTeams={activeAllTeams}
            allPlayers={combinedPlayers}
            preselectedOpponentId={
              nextUnplayedFixture
                ? nextUnplayedFixture.awayTeamId
                : (targetOpponentId || opponentOptions[0]?.id)
            }
            onSimulate={handleExecuteSimulation}
            onBack={() => {
              setActiveTab('league');
              if (currentSession && isHost) broadcastNavigation('league');
            }}
            onGoToDashboard={() => setActiveTab('dashboard')}
            isHost={isHost}
          />
        )}

        {activeTab === 'simulation' && (
          activeMatchResult ? (
            <MatchSimulationPage
              matchResult={activeMatchResult}
              allPlayers={combinedPlayers}
              onReturnToAuction={async () => {
                if (currentSession && isHost) {
                  await supabase
                    .from('game_sessions')
                    .update({ status: 'AUCTION' })
                    .eq('id', currentSession.id);
                  await broadcastNavigation('auction');
                }
                setActiveTab('auction');
              }}
              onFinishMatch={() => {
                setActiveTab('league');
                if (currentSession && isHost) broadcastNavigation('league');
              }}
              onGoToLeague={() => {
                setActiveTab('league');
                if (currentSession && isHost) broadcastNavigation('league');
              }}
            />
          ) : (
            <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-fadeIn">
              <p className="text-sm text-slate-400">No active match simulation recorded.</p>
              <button
                onClick={() => setActiveTab('league')}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider"
              >
                Go to Tournament Standings
              </button>
            </div>
          )
        )}

        {activeTab === 'league' && (
          <LeaguePage
            standings={effectiveStandings}
            currentTeam={userTeam}
            allTeams={activeAllTeams}
            recentMatches={effectiveMatches}
            nextFixture={nextUnplayedFixture}
            totalFixtures={effectiveFixtures.length}
            completedFixtures={effectiveMatches.length}
            isTournamentComplete={isTournamentComplete || (effectiveFixtures.length > 0 && effectiveMatches.length >= effectiveFixtures.length)}
            isHost={isHost}
            onPlayNextMatch={() => {
              if (nextUnplayedFixture) {
                const oppId = nextUnplayedFixture.homeTeamId === userTeam?.id
                  ? nextUnplayedFixture.awayTeamId
                  : nextUnplayedFixture.homeTeamId;
                handleStartMatchSetup(oppId);
              } else if (opponentOptions.length > 0) {
                handleStartMatchSetup(opponentOptions[0]?.id);
              }
            }}
            onViewSeasonComplete={() => setShowSeasonComplete(true)}
          />
        )}

        {activeTab === 'auction' && (
          <AuctionPage
            setActiveTab={setActiveTab}
            auctions={gameState.auctions}
            currentTeam={userTeam || undefined}
            onPlaceBid={handlePlaceBid}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsPage
            players={gameState.players}
            teams={gameState.teams}
          />
        )}

        {activeTab === 'lobby' && (
          <LobbyPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage
            sessionStandings={effectiveStandings}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            currentTeam={userTeam}
            currentUser={gameState.currentUser}
            onUpdateTeam={handleUpdateTeamProfile}
            onResetSeason={handleResetSeason}
            onLogOut={handleLogOut}
            onOpenAuth={() => {
              setGuestMode(false);
              setIsAuthOpen(true);
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            allPlayers={gameState.players}
            allTeams={activeAllTeams}
            onAddPlayer={handleAddPlayer}
            onUpdateTeamBudget={handleUpdateTeamBudget}
          />
        )}
      </main>

      {/* Season Complete Celebration & Career Points Modal */}
      {showSeasonComplete && (
        <SeasonCompleteModal
          standings={effectiveStandings}
          onStartNewGame={() => {
            setShowSeasonComplete(false);
            clearSession();
            handleResetSeason();
            setActiveTab('dashboard');
          }}
          onJoinAnotherGame={() => {
            setShowSeasonComplete(false);
            clearSession();
            handleResetSeason();
            setActiveTab('dashboard');
          }}
          onViewLeaderboard={() => {
            setShowSeasonComplete(false);
            clearSession();
            handleResetSeason();
            setActiveTab('leaderboard');
          }}
        />
      )}

    </div>
  );
}

export default App;
