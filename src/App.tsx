import { useState, useEffect } from 'react';
import { ActiveTab, MatchResult, Player, Team, UserAccount } from './types';
import { loadInitialState, saveState, resetToDefaults, applyMatchToStandings } from './services/gameStorage';
import { simulateMatch } from './simulation/engine';
import { calculateTeamOverall } from './utils/formatters';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';

import { Dashboard } from './pages/Dashboard';
import { PlayersPage } from './pages/PlayersPage';
import { MyTeamPage } from './pages/MyTeamPage';
import { MatchSetupPage } from './pages/MatchSetupPage';
import { MatchSimulationPage } from './pages/MatchSimulationPage';
import { LeaguePage } from './pages/LeaguePage';
import { AuctionPage } from './pages/AuctionPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SeasonCompleteModal from './components/SeasonCompleteModal';
import { saveMatchToSupabase } from './services/sessionService';
import { useSession } from './contexts/SessionContext';
import { useAuth } from './contexts/AuthContext';

export function App() {
  const { currentSession, clearSession } = useSession();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [guestMode, setGuestMode] = useState(false);
  const [gameState, setGameState] = useState(loadInitialState);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showSeasonComplete, setShowSeasonComplete] = useState(false);

  // Match setup & simulation state
  const [targetOpponentId, setTargetOpponentId] = useState<string>('team-aashish');
  const [activeMatchResult, setActiveMatchResult] = useState<MatchResult | null>(null);

  // Auto-save whenever game state changes
  useEffect(() => {
    saveState(gameState);
  }, [gameState]);

  // Sync logged-in Supabase user with game state
  useEffect(() => {
    if (user) {
      const displayName = profile?.displayName || user.email?.split('@')[0] || 'Manager';
      const email = user.email || '';
      setGameState((prev) => {
        const updatedTeams = prev.teams.map((t) => {
          if (t.id === prev.userTeamId) {
            return {
              ...t,
              name: `${displayName} FC`,
              manager: displayName,
              badgeIcon: '⚡'
            };
          }
          return t;
        });

        return {
          ...prev,
          currentUser: {
            id: user.id,
            name: displayName,
            email: email,
            managerName: displayName,
            clubName: `${displayName} FC`,
            badgeIcon: '⚡',
          },
          teams: updatedTeams
        };
      });
    }
  }, [user, profile]);

  const userTeam = gameState.teams.find((t) => t.id === gameState.userTeamId) || gameState.teams[0];

  const userStartingPlayers = userTeam.startingSeven
    .map((id) => gameState.players.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const teamOverall = calculateTeamOverall(userStartingPlayers);

  // Launch Match Setup
  const handleStartMatchSetup = (opponentTeamId: string) => {
    setTargetOpponentId(opponentTeamId);
    setActiveTab('matches');
  };

  // Run the Simulation Engine
  const handleExecuteSimulation = (opponentTeamId: string) => {
    const opponent = gameState.teams.find((t) => t.id === opponentTeamId) || gameState.teams[1];

    const result = simulateMatch(
      { team: userTeam, players: gameState.players },
      { team: opponent, players: gameState.players }
    );

    // Update league standings
    const updatedStandings = applyMatchToStandings(gameState.standings, result);

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

    const updatedMatches = [...gameState.recentMatches, result];

    setGameState((prev) => ({
      ...prev,
      standings: updatedStandings,
      players: updatedPlayers,
      recentMatches: updatedMatches
    }));

    setActiveMatchResult(result);
    if (currentSession) {
      saveMatchToSupabase(result, currentSession.id);
    }
    setActiveTab('simulation');
  };

  // Lineup update handler
  const handleUpdateLineup = (newStartingSeven: string[], newBench: string[]) => {
    setGameState((prev) => {
      const updatedTeams = prev.teams.map((t) => {
        if (t.id === userTeam.id) {
          return {
            ...t,
            startingSeven: newStartingSeven,
            bench: newBench
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

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    setGameState((prev) => {
      const updatedTeams = prev.teams.map((t) => {
        if (t.id === prev.userTeamId) {
          return {
            ...t,
            manager: user.managerName || user.name || t.manager || 'Manager',
            badgeIcon: user.badgeIcon || t.badgeIcon || '⚡'
          };
        }
        return t;
      });
      return {
        ...prev,
        currentUser: user,
        teams: updatedTeams
      };
    });
    setIsAuthOpen(false);
  };

  const handleSignUp = (user: UserAccount) => {
    setGameState((prev) => {
      const updatedTeams = prev.teams.map((t) => {
        if (t.id === prev.userTeamId) {
          return {
            ...t,
            name: user.clubName,
            manager: user.managerName || user.name || 'Manager',
            badgeIcon: user.badgeIcon || '⚡'
          };
        }
        return t;
      });

      const updatedStandings = prev.standings.map((s) => {
        if (s.teamId === prev.userTeamId) {
          return {
            ...s,
            teamName: user.clubName
          };
        }
        return s;
      });

      const updatedSaved = [...(prev.savedAccounts || []).filter((a) => a.email !== user.email), user];

      return {
        ...prev,
        currentUser: user,
        savedAccounts: updatedSaved,
        teams: updatedTeams,
        standings: updatedStandings
      };
    });
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
        onQuickSimulate={() => handleStartMatchSetup('team-aashish')}
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
            currentTeam={userTeam}
            allTeams={gameState.teams}
            allPlayers={gameState.players}
            teamOverall={teamOverall}
            standings={gameState.standings}
            recentMatches={gameState.recentMatches}
            auctions={gameState.auctions}
            setActiveTab={setActiveTab}
            onStartMatch={handleStartMatchSetup}
          />
        )}

        {activeTab === 'my-team' && (
          <MyTeamPage
            currentTeam={userTeam}
            allPlayers={gameState.players}
            onUpdateLineup={handleUpdateLineup}
          />
        )}

        {activeTab === 'players' && (
          <PlayersPage
            players={gameState.players}
            userTeamId={userTeam.id}
          />
        )}

        {activeTab === 'matches' && (
          <MatchSetupPage
            currentTeam={userTeam}
            allTeams={gameState.teams}
            allPlayers={gameState.players}
            preselectedOpponentId={targetOpponentId}
            onSimulate={handleExecuteSimulation}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'simulation' && activeMatchResult && (
          <MatchSimulationPage
            matchResult={activeMatchResult}
            allPlayers={gameState.players}
            onFinishMatch={() => setActiveTab('dashboard')}
            onGoToLeague={() => setActiveTab('league')}
          />
        )}

        {activeTab === 'league' && (
          <LeaguePage
            standings={gameState.standings}
            currentTeam={userTeam}
            allTeams={gameState.teams}
            recentMatches={gameState.recentMatches}
            onPlayNextMatch={() => handleStartMatchSetup(targetOpponentId)}
            onViewSeasonComplete={() => setShowSeasonComplete(true)}
          />
        )}

        {activeTab === 'auction' && (
          <AuctionPage
            setActiveTab={setActiveTab}
            auctions={gameState.auctions}
            currentTeam={userTeam}
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
            sessionStandings={gameState.standings}
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
      </main>

      {/* Season Complete Celebration & Career Points Modal */}
      {showSeasonComplete && (
        <SeasonCompleteModal
          standings={gameState.standings}
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
            setActiveTab('leaderboard');
          }}
        />
      )}

    </div>
  );
}

export default App;
