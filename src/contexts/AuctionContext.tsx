import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useSession } from './SessionContext';
import type {
  Auction, AuctionRow, Bid, BidRow, Player, PlayerRow,
  SquadPlayer, SquadRow, Team, TeamRow
} from '../types';
import {
  auctionFromRow, bidFromRow, playerFromRow, squadPlayerFromRow, teamFromRow
} from '../services/sessionService';
import { syncPlayersToSupabase } from '../services/playerSyncService';
import { INITIAL_PLAYERS } from '../data/initialData';
import { AI_BOTS, evaluateAIBid, ABSOLUTE_MAX_AI_BID } from '../services/aiEngine';
import { sound } from '../utils/audioSynth';

interface AuctionContextType {
  currentAuction: Auction | null;
  currentPlayer: Player | null;
  bids: Bid[];
  mySquad: SquadPlayer[];
  myTeam: Team | null;
  allTeams: Team[];
  timeLeft: number;
  auctionComplete: boolean;
  teamSquadCounts: Record<string, number>;
  allTeamsHaveMinSquad: boolean;
  minSquadRequired: number;
  aiThinking: string | null;
  placeBid: (amount: number) => Promise<{ error: string | null }>;
  nextPlayer: () => Promise<{ error: string | null }>;
  skipPlayer: () => Promise<{ error: string | null }>;
  endAuctionManually: () => Promise<{ error: string | null }>;
  reopenAuction: () => Promise<{ error: string | null }>;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export function AuctionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const {
    currentSession,
    myTeam: sessionTeam,
    allTeams,
    refreshSessionData,
    updateSessionTeamSquadAndBudget,
    finalizeAiLineups,
  } = useSession();
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [mySquad, setMySquad] = useState<SquadPlayer[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(sessionTeam);
  const [timeLeft, setTimeLeft] = useState(0);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [teamSquadCounts, setTeamSquadCounts] = useState<Record<string, number>>({});
  const [aiThinking, setAiThinking] = useState<string | null>(null);
  const aiPoolRef = useRef<Player[]>([]);
  const aiPoolIndexRef = useRef<number>(0);
  const aiSquadsRef = useRef<Record<string, Player[]>>({});
  const aiBidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAuctionRef = useRef<Auction | null>(null);
  const isResolvingRef = useRef<boolean>(false);

  const minSquadRequired = 7;
  const allTeamsHaveMinSquad = (allTeams || []).length > 0 &&
    (allTeams || []).every(t => (teamSquadCounts[t.id] || 0) >= minSquadRequired);

  useEffect(() => {
    currentAuctionRef.current = currentAuction;
  }, [currentAuction]);

  useEffect(() => {
    setMyTeam(sessionTeam);
  }, [sessionTeam]);

  // Load fresh team budget dynamically from actual purchases
  const refreshMyTeam = async () => {
    if (!currentSession || !user) return;
    const teamId = sessionTeam?.id;
    if (!teamId) return;

    const { data: squadData } = await supabase
      .from('squads')
      .select('purchase_price')
      .eq('session_id', currentSession.id)
      .eq('team_id', teamId);

    const totalSpent = (squadData || []).reduce((sum, r) => sum + (r.purchase_price || 0), 0);
    const baseBudget = currentSession.startingBudget || 130;
    const computedBudget = Math.max(0, baseBudget - totalSpent);

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', currentSession.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (teamData) {
      if (teamData.budget !== computedBudget) {
        // Sync database team row with actual remaining budget
        await supabase
          .from('teams')
          .update({ budget: computedBudget })
          .eq('id', teamId);
      }
      const t = teamFromRow(teamData as TeamRow);
      t.budget = computedBudget;
      setMyTeam(t);
    }
  };

  // Load my squad
  const loadMySquad = async () => {
    if (!currentSession || !user) return;
    const teamId = sessionTeam?.id || myTeam?.id;
    let effectiveTeamId = teamId;
    if (!effectiveTeamId) {
      const { data: tRow } = await supabase
        .from('teams')
        .select('id')
        .eq('session_id', currentSession.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (tRow) effectiveTeamId = tRow.id;
    }
    if (!effectiveTeamId) return;

    const { data } = await supabase
      .from('squads')
      .select('*, players(*)')
      .eq('session_id', currentSession.id)
      .eq('team_id', effectiveTeamId);
    if (data) {
      const squad = data.map((row: any) => {
        const sq = squadPlayerFromRow(row as SquadRow);
        let pData = row.players;
        if (Array.isArray(pData)) pData = pData[0];
        if (pData) sq.player = playerFromRow(pData);
        return sq;
      });
      setMySquad(squad);
    }
  };

  // Load squad counts for all teams in the session to track minimum 7 players readiness
  const refreshSquadCounts = async () => {
    if (!currentSession) return;
    const { data: squadRows } = await supabase
      .from('squads')
      .select('team_id')
      .eq('session_id', currentSession.id);

    const counts: Record<string, number> = {};
    (squadRows || []).forEach((r: any) => {
      counts[r.team_id] = (counts[r.team_id] || 0) + 1;
    });
    setTeamSquadCounts(counts);
  };

  const initAiAuction = () => {
    // Sort players so higher-rated cards come first, with shuffle within each tier
    const tier1 = INITIAL_PLAYERS.filter(p => (p.overall || 75) >= 90).sort(() => Math.random() - 0.5);
    const tier2 = INITIAL_PLAYERS.filter(p => (p.overall || 75) >= 85 && (p.overall || 75) < 90).sort(() => Math.random() - 0.5);
    const tier3 = INITIAL_PLAYERS.filter(p => (p.overall || 75) >= 80 && (p.overall || 75) < 85).sort(() => Math.random() - 0.5);
    const tier4 = INITIAL_PLAYERS.filter(p => (p.overall || 75) < 80).sort(() => Math.random() - 0.5);

    const orderedPool = [...tier1, ...tier2, ...tier3, ...tier4];
    aiPoolRef.current = orderedPool;
    aiPoolIndexRef.current = 0;

    const initialSquads: Record<string, Player[]> = {};
    const initialCounts: Record<string, number> = {};
    (allTeams || []).forEach(t => {
      initialSquads[t.id] = [];
      initialCounts[t.id] = 0;
    });
    aiSquadsRef.current = initialSquads;
    setTeamSquadCounts(initialCounts);
    setMySquad([]);

    const firstPlayer = orderedPool[0];
    const endsAt = new Date(Date.now() + 15_000).toISOString();
    const firstAuction: Auction = {
      id: 'ai-lot-' + firstPlayer.id + '-' + Date.now(),
      sessionId: currentSession!.id,
      playerId: firstPlayer.id,
      startingPrice: 5,
      currentBid: 0,
      highestTeamId: undefined,
      status: 'LIVE',
      startedAt: new Date().toISOString(),
      endsAt,
      player: firstPlayer,
    };

    setCurrentPlayer(firstPlayer);
    setCurrentAuction(firstAuction);
    currentAuctionRef.current = firstAuction;
    setBids([]);
    setAuctionComplete(false);
    startTimer(endsAt, firstAuction.id);
    triggerAiEvaluation(firstAuction, firstPlayer, 0, null);
  };

  const triggerAiEvaluation = (
    auction: Auction,
    player: Player,
    currentBid: number,
    highestTeamId: string | null | undefined
  ) => {
    if (aiBidTimeoutRef.current) {
      clearTimeout(aiBidTimeoutRef.current);
      aiBidTimeoutRef.current = null;
    }

    const aiTeams = (allTeams || []).filter(t => t.id.startsWith('ai-') && t.id !== highestTeamId);
    if (aiTeams.length === 0) return;

    interface Candidate {
      team: Team;
      bot: (typeof AI_BOTS)[0];
      decision: ReturnType<typeof evaluateAIBid>;
    }

    const candidates: Candidate[] = [];

    for (const team of aiTeams) {
      const bot = AI_BOTS.find(b => b.id === team.id);
      if (!bot) continue;

      const squad = aiSquadsRef.current[team.id] || [];
      const decision = evaluateAIBid(
        player,
        currentBid,
        auction.startingPrice || 5,
        highestTeamId,
        team,
        squad,
        bot,
        auction.id
      );

      if (decision.shouldBid && decision.bidAmount <= ABSOLUTE_MAX_AI_BID) {
        candidates.push({ team, bot, decision });
      }
    }

    if (candidates.length === 0) {
      setAiThinking(null);
      return;
    }

    candidates.sort((a, b) => a.decision.delayMs - b.decision.delayMs);
    const chosen = candidates[0];

    setAiThinking(chosen.decision.thinkingMessage);

    aiBidTimeoutRef.current = setTimeout(() => {
      aiBidTimeoutRef.current = null;
      setAiThinking(null);

      const liveAuction = currentAuctionRef.current;
      if (!liveAuction || liveAuction.id !== auction.id || liveAuction.status !== 'LIVE') return;

      const liveEffectiveBid = Math.max(liveAuction.currentBid || 0);
      if (liveAuction.highestTeamId === chosen.team.id) return;
      if (chosen.decision.bidAmount <= liveEffectiveBid) return;
      if (chosen.decision.bidAmount > ABSOLUTE_MAX_AI_BID) return;

      const currentEndMs = liveAuction.endsAt ? new Date(liveAuction.endsAt).getTime() : Date.now();
      const remainingMs = Math.max(0, currentEndMs - Date.now());
      const newRemainingMs = Math.min(45_000, Math.max(10_000, remainingMs + 10_000));
      const newEndsAt = new Date(Date.now() + newRemainingMs).toISOString();

      const aiBid: Bid = {
        id: 'bid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        auctionId: liveAuction.id,
        teamId: chosen.team.id,
        userId: chosen.team.id,
        amount: chosen.decision.bidAmount,
        createdAt: new Date().toISOString(),
        team: chosen.team,
      };

      setBids(prev => [aiBid, ...prev]);

      const updatedAuction = {
        ...liveAuction,
        currentBid: chosen.decision.bidAmount,
        highestTeamId: chosen.team.id,
        endsAt: newEndsAt,
      };
      setCurrentAuction(updatedAuction);
      currentAuctionRef.current = updatedAuction;
      startTimer(newEndsAt, liveAuction.id);

      triggerAiEvaluation(updatedAuction, player, chosen.decision.bidAmount, chosen.team.id);
    }, chosen.decision.delayMs);
  };

  // Subscribe to auction updates when session is in AUCTION state
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'AUCTION') return;
    if (currentSession.gameMode === 'ai') {
      initAiAuction();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
        if (aiBidTimeoutRef.current) clearTimeout(aiBidTimeoutRef.current);
      };
    }
    loadCurrentAuction();
    loadMySquad();
    refreshMyTeam();
    refreshSquadCounts();
    subscribeToAuction();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id, currentSession?.status, currentSession?.gameMode]);

  const loadCurrentAuction = async () => {
    if (!currentSession) return;
    try {
      await refreshSquadCounts();

      const { data: rows } = await supabase
        .from('auctions')
        .select('*, players(*)')
        .eq('session_id', currentSession.id)
        .in('status', ['LIVE', 'WAITING'])
        .order('created_at', { ascending: false })
        .limit(1);

      const data = rows && rows.length > 0 ? rows[0] : null;

      if (!data) {
        if (
          currentSession.status === 'MATCHES' ||
          currentSession.status === 'TEAM_SETUP' ||
          currentSession.status === 'COMPLETED'
        ) {
          setAuctionComplete(true);
          setCurrentAuction(null);
          setCurrentPlayer(null);
        } else {
          // In AUCTION status: Auction must NOT complete abruptly!
          setAuctionComplete(false);
          // If host and no live auction row exists, auto-advance or recycle
          if (currentSession.hostUserId === user?.id) {
            advanceToNextPlayer();
          }
        }
        return;
      }

      const auction = auctionFromRow(data as AuctionRow);
      let playerObj: Player | null = null;
      let rawPlayer = (data as any).players;
      if (Array.isArray(rawPlayer)) rawPlayer = rawPlayer[0];
      if (rawPlayer) {
        playerObj = playerFromRow(rawPlayer);
      } else if (data.player_id) {
        const { data: p } = await supabase
          .from('players')
          .select('*')
          .eq('id', data.player_id)
          .maybeSingle();
        if (p) playerObj = playerFromRow(p);
      }

      if (playerObj) {
        auction.player = playerObj;
        setCurrentPlayer(playerObj);
      }
      setCurrentAuction(auction);
      currentAuctionRef.current = auction;
      isResolvingRef.current = false;
      setAuctionComplete(false); // CRITICAL: Reset auctionComplete when auction is found!
      setBids(prev => (prev.length > 0 && prev[0].auctionId !== auction.id ? [] : prev));
      loadBids(auction.id);
      if (auction.endsAt) startTimer(auction.endsAt, auction.id);
    } catch (err) {
      console.error('Error loading current auction:', err);
    }
  };

  const loadBids = async (auctionId: string) => {
    const { data } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setBids(data.map((r: any) => bidFromRow(r as BidRow)));
  };

  const startTimer = (endsAt: string, auctionId: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    const targetTime = new Date(endsAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((targetTime - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;

        const isHost = currentSession?.hostUserId === user?.id;

        if (isHost) {
          // Host immediately auto-sells to highest bidder and advances without waiting for clicks
          if (!isResolvingRef.current) {
            isResolvingRef.current = true;
            autoSellAndAdvance(auctionId);
          }
        } else {
          // Safety fallback for non-host if host disconnects or lags: advance after 1.5s
          autoNextTimeoutRef.current = setTimeout(() => {
            if (!isResolvingRef.current) {
              isResolvingRef.current = true;
              autoSellAndAdvance(auctionId);
            }
          }, 1500);
        }
      }
    };

    tick();
    timerRef.current = setInterval(tick, 300);
  };

  const subscribeToAuction = () => {
    if (!currentSession) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`auction:${currentSession.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'auctions',
        filter: `session_id=eq.${currentSession.id}`,
      }, (payload) => {
        if (payload.new && (payload.new as any).ends_at && (payload.new as any).status === 'LIVE') {
          const row = payload.new as any;
          startTimer(row.ends_at, row.id);
        }
        loadCurrentAuction();
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bids',
      }, (payload) => {
        const newBid = bidFromRow(payload.new as BidRow);
        setBids(prev => {
          if (prev.some(b => b.id === newBid.id)) return prev;
          return [newBid, ...prev];
        });
        setCurrentAuction(prev => {
          if (!prev || prev.id !== newBid.auctionId) return prev;
          const updated = {
            ...prev,
            currentBid: Math.max(prev.currentBid || 0, newBid.amount),
            highestTeamId: newBid.teamId,
          };
          currentAuctionRef.current = updated;
          return updated;
        });
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'squads',
      }, () => {
        loadMySquad();
        refreshMyTeam();
        refreshSquadCounts();
        if (typeof refreshSessionData === 'function') refreshSessionData();
      })
      .on('broadcast', { event: 'squad_updated' }, () => {
        loadMySquad();
        refreshMyTeam();
        refreshSquadCounts();
        if (typeof refreshSessionData === 'function') refreshSessionData();
      })
      .subscribe();
    channelRef.current = channel;
  };

  const placeBid = async (amount: number): Promise<{ error: string | null }> => {
    if (!currentAuction || !sessionTeam) return { error: 'Not ready.' };
    if (currentAuction.status !== 'LIVE') return { error: 'Auction is not live.' };

    const effectiveCurrentBid = Math.max(
      currentAuction.currentBid || 0,
      bids.length > 0 ? bids[0].amount : 0
    );
    const minRequired = effectiveCurrentBid > 0 
      ? effectiveCurrentBid + 1 
      : (currentAuction.startingPrice || 5);

    if (amount < minRequired) {
      return { error: `Bid must be at least €${minRequired}M.` };
    }
    if (myTeam && amount > myTeam.budget) {
      return { error: `Insufficient budget. You have €${myTeam?.budget}M.` };
    }
    if (mySquad.length >= 10) {
      return { error: 'Your squad is full (10 players max).' };
    }

    if (currentSession?.gameMode === 'ai') {
      if (aiBidTimeoutRef.current) {
        clearTimeout(aiBidTimeoutRef.current);
        aiBidTimeoutRef.current = null;
      }
      setAiThinking(null);

      const currentEndMs = currentAuction.endsAt ? new Date(currentAuction.endsAt).getTime() : Date.now();
      const remainingMs = Math.max(0, currentEndMs - Date.now());
      const newRemainingMs = Math.min(45_000, Math.max(10_000, remainingMs + 10_000));
      const newEndsAt = new Date(Date.now() + newRemainingMs).toISOString();

      const newBid: Bid = {
        id: 'bid-' + Date.now(),
        auctionId: currentAuction.id,
        teamId: sessionTeam.id,
        userId: user?.id || 'human-user',
        amount,
        createdAt: new Date().toISOString(),
        team: sessionTeam,
      };

      setBids(prev => [newBid, ...prev]);

      const updated = {
        ...currentAuction,
        currentBid: amount,
        highestTeamId: sessionTeam.id,
        endsAt: newEndsAt,
      };
      setCurrentAuction(updated);
      currentAuctionRef.current = updated;
      startTimer(newEndsAt, currentAuction.id);

      if (currentPlayer) {
        triggerAiEvaluation(updated, currentPlayer, amount, sessionTeam.id);
      }

      return { error: null };
    }

    if (!user) return { error: 'Not ready.' };

    // Increase remaining auction time by 10 seconds (+10,000ms), ensuring at least 10 seconds remaining
    const currentEndMs = currentAuction.endsAt ? new Date(currentAuction.endsAt).getTime() : Date.now();
    const remainingMs = Math.max(0, currentEndMs - Date.now());
    const newRemainingMs = Math.min(45_000, Math.max(10_000, remainingMs + 10_000));
    const newEndsAt = new Date(Date.now() + newRemainingMs).toISOString();

    // Insert bid
    const { error: bidErr } = await supabase.from('bids').insert({
      auction_id: currentAuction.id,
      team_id: sessionTeam.id,
      user_id: user.id,
      amount,
    });
    if (bidErr) return { error: bidErr.message };

    // Update auction
    const { error: auctErr } = await supabase
      .from('auctions')
      .update({
        current_bid: amount,
        highest_team_id: sessionTeam.id,
        ends_at: newEndsAt,
        status: 'LIVE',
      })
      .eq('id', currentAuction.id);
    if (auctErr) return { error: auctErr.message };

    // Optimistically update local timer & auction state for instant responsiveness
    const updated = {
      ...currentAuction,
      currentBid: amount,
      highestTeamId: sessionTeam.id,
      endsAt: newEndsAt,
    };
    setCurrentAuction(updated);
    currentAuctionRef.current = updated;
    startTimer(newEndsAt, currentAuction.id);

    return { error: null };
  };

  const autoSellAndAdvance = async (auctionIdToResolve?: string): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No session.' };

    if (currentSession.gameMode === 'ai') {
      if (aiBidTimeoutRef.current) {
        clearTimeout(aiBidTimeoutRef.current);
        aiBidTimeoutRef.current = null;
      }
      setAiThinking(null);

      const targetAuction = currentAuctionRef.current;
      if (!targetAuction || targetAuction.status !== 'LIVE') return { error: null };

      const effectiveBid = targetAuction.currentBid || 0;
      const winningTeamId = targetAuction.highestTeamId;
      const hasWinner = Boolean(winningTeamId && effectiveBid > 0);
      const soldPlayer = currentPlayer;

      if (hasWinner && winningTeamId && soldPlayer) {
        sound.playGavelHammer();
        if (sessionTeam && winningTeamId === sessionTeam.id) {
          sound.playVictorySound();
          setMySquad(prev => [
            ...prev,
            {
              id: 'sq-' + Date.now(),
              sessionId: currentSession.id,
              teamId: winningTeamId,
              playerId: soldPlayer.id,
              purchasePrice: effectiveBid,
              player: soldPlayer,
              acquiredAt: new Date().toISOString(),
            }
          ]);
        }

        aiSquadsRef.current[winningTeamId] = [
          ...(aiSquadsRef.current[winningTeamId] || []),
          soldPlayer
        ];

        updateSessionTeamSquadAndBudget(winningTeamId, soldPlayer, effectiveBid);

        setTeamSquadCounts(prev => ({
          ...prev,
          [winningTeamId]: (prev[winningTeamId] || 0) + 1,
        }));
      }

      setBids([]);

      // Advance to next footballer in the pool
      aiPoolIndexRef.current += 1;
      let pool = aiPoolRef.current;
      if (aiPoolIndexRef.current >= pool.length) {
        const allAcquired = new Set<string>();
        Object.values(aiSquadsRef.current).forEach(sq => sq.forEach(p => allAcquired.add(p.id)));
        const untaken = INITIAL_PLAYERS.filter(p => !allAcquired.has(p.id));
        if (untaken.length > 0) {
          const t1 = untaken.filter(p => (p.overall || 75) >= 90).sort(() => Math.random() - 0.5);
          const t2 = untaken.filter(p => (p.overall || 75) >= 85 && (p.overall || 75) < 90).sort(() => Math.random() - 0.5);
          const t3 = untaken.filter(p => (p.overall || 75) >= 80 && (p.overall || 75) < 85).sort(() => Math.random() - 0.5);
          const t4 = untaken.filter(p => (p.overall || 75) < 80).sort(() => Math.random() - 0.5);
          aiPoolRef.current = [...t1, ...t2, ...t3, ...t4];
          aiPoolIndexRef.current = 0;
          pool = aiPoolRef.current;
        } else {
          setAuctionComplete(true);
          return { error: null };
        }
      }

      const nextPlayerObj = pool[aiPoolIndexRef.current];
      if (!nextPlayerObj) {
        setAuctionComplete(true);
        return { error: null };
      }

      const endsAt = new Date(Date.now() + 15_000).toISOString();
      const nextAuction: Auction = {
        id: 'ai-lot-' + nextPlayerObj.id + '-' + Date.now(),
        sessionId: currentSession.id,
        playerId: nextPlayerObj.id,
        startingPrice: 5,
        currentBid: 0,
        highestTeamId: undefined,
        status: 'LIVE',
        startedAt: new Date().toISOString(),
        endsAt,
        player: nextPlayerObj,
      };

      setCurrentPlayer(nextPlayerObj);
      setCurrentAuction(nextAuction);
      currentAuctionRef.current = nextAuction;
      setAuctionComplete(false);
      startTimer(endsAt, nextAuction.id);
      triggerAiEvaluation(nextAuction, nextPlayerObj, 0, null);

      return { error: null };
    }

    const targetId = auctionIdToResolve || currentAuctionRef.current?.id;
    if (!targetId) return { error: 'No auction active.' };

    try {
      // 1. Fetch live auction from DB to guarantee freshest state
      const { data: auctionRow } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (!auctionRow || auctionRow.status !== 'LIVE') {
        // Already sold or not in LIVE status
        return { error: null };
      }

      // 2. Query the bids table directly to identify the absolute highest bidder
      const { data: topBids } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', targetId)
        .order('amount', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

      const winningBid = topBids && topBids.length > 0 ? topBids[0] : null;
      const winningTeamId = winningBid?.team_id || auctionRow.highest_team_id;
      const winningAmount = winningBid?.amount || auctionRow.current_bid;
      const hasWinner = Boolean(winningTeamId && winningAmount > 0);

      if (hasWinner && winningTeamId) {
        sound.playGavelHammer();
        if (sessionTeam && winningTeamId === sessionTeam.id) {
          sound.playVictorySound();
        }
        // Deduct winning team's budget
        const { data: teamData } = await supabase
          .from('teams')
          .select('budget')
          .eq('id', winningTeamId)
          .maybeSingle();

        if (teamData) {
          await supabase
            .from('teams')
            .update({ budget: Math.max(0, teamData.budget - winningAmount) })
            .eq('id', winningTeamId);
        }

        // Add to squads table (upsert with fallback)
        const { error: sqErr } = await supabase.from('squads').upsert({
          session_id: currentSession.id,
          team_id: winningTeamId,
          player_id: auctionRow.player_id,
          purchase_price: winningAmount,
        }, { onConflict: 'session_id,player_id' });

        if (sqErr) {
          console.warn('Squad upsert error, trying direct insert:', sqErr);
          const { error: insErr } = await supabase.from('squads').insert({
            session_id: currentSession.id,
            team_id: winningTeamId,
            player_id: auctionRow.player_id,
            purchase_price: winningAmount,
          });
          if (insErr) console.error('Direct squad insert error:', insErr);
        }

        // Immediately refresh local squad, team budget, and room state!
        await loadMySquad();
        await refreshMyTeam();
        if (typeof refreshSessionData === 'function') {
          await refreshSessionData();
        }

        // Broadcast to all peers in the room so everyone's squad & budget updates immediately!
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'squad_updated',
            payload: {
              sessionId: currentSession.id,
              teamId: winningTeamId,
              playerId: auctionRow.player_id,
              price: winningAmount,
            }
          });
        }

        // Mark session_player_pool as SOLD
        await supabase
          .from('session_player_pool')
          .update({ status: 'SOLD' })
          .eq('session_id', currentSession.id)
          .eq('player_id', auctionRow.player_id);

        // Mark auctions as SOLD
        await supabase
          .from('auctions')
          .update({
            status: 'SOLD',
            highest_team_id: winningTeamId,
            current_bid: winningAmount,
          })
          .eq('id', targetId);
      } else {
        // True skip: no bids placed at all
        await supabase
          .from('auctions')
          .update({ status: 'SKIPPED' })
          .eq('id', targetId);

        await supabase
          .from('session_player_pool')
          .update({ status: 'SKIPPED' })
          .eq('session_id', currentSession.id)
          .eq('player_id', auctionRow.player_id);
      }

      setBids([]);

      // Start next auction automatically without waiting for host click
      return await advanceToNextPlayer();
    } catch (err: any) {
      console.error('Error auto-selling lot:', err);
      return { error: err.message || 'Auto-sell error' };
    } finally {
      isResolvingRef.current = false;
    }
  };

  const nextPlayer = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No session.' };
    if (currentSession.gameMode === 'ai') {
      return await autoSellAndAdvance();
    }
    if (!user) return { error: 'No session.' };
    const targetId = currentAuctionRef.current?.id;
    if (!targetId) return { error: 'No auction active.' };
    return await autoSellAndAdvance(targetId);
  };

  const skipPlayer = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No session.' };
    if (currentSession.gameMode === 'ai') {
      if (currentAuctionRef.current) {
        currentAuctionRef.current.highestTeamId = undefined;
        currentAuctionRef.current.currentBid = 0;
      }
      return await autoSellAndAdvance();
    }
    if (!user) return { error: 'No session.' };
    if (currentSession.hostUserId !== user.id) return { error: 'Only the host can skip.' };
    const targetId = currentAuctionRef.current?.id;
    if (!targetId) return { error: 'No auction active.' };

    const { data: auctionRow } = await supabase
      .from('auctions')
      .select('player_id')
      .eq('id', targetId)
      .maybeSingle();

    await supabase.from('auctions').update({ status: 'SKIPPED' }).eq('id', targetId);
    if (auctionRow?.player_id) {
      await supabase
        .from('session_player_pool')
        .update({ status: 'SKIPPED' })
        .eq('session_id', currentSession.id)
        .eq('player_id', auctionRow.player_id);
    }

    setBids([]);
    return await advanceToNextPlayer();
  };

  const advanceToNextPlayer = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No session.' };

    // 1. Find next AVAILABLE player in pool by auction_order
    let { data: nextPoolEntry } = await supabase
      .from('session_player_pool')
      .select('player_id, auction_order')
      .eq('session_id', currentSession.id)
      .eq('status', 'AVAILABLE')
      .order('auction_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    // 2. If no available players left, recycle SKIPPED players so the auction never terminates abruptly
    if (!nextPoolEntry) {
      const { data: skippedRows } = await supabase
        .from('session_player_pool')
        .select('id')
        .eq('session_id', currentSession.id)
        .eq('status', 'SKIPPED');

      if (skippedRows && skippedRows.length > 0) {
        await supabase
          .from('session_player_pool')
          .update({ status: 'AVAILABLE' })
          .eq('session_id', currentSession.id)
          .eq('status', 'SKIPPED');

        const { data: recycled } = await supabase
          .from('session_player_pool')
          .select('player_id, auction_order')
          .eq('session_id', currentSession.id)
          .eq('status', 'AVAILABLE')
          .order('auction_order', { ascending: true })
          .limit(1)
          .maybeSingle();

        nextPoolEntry = recycled;
      }
    }

    // 3. If STILL no available players, query main players table for any players not yet in squads
    if (!nextPoolEntry) {
      await syncPlayersToSupabase();

      const { data: squadData } = await supabase
        .from('squads')
        .select('player_id')
        .eq('session_id', currentSession.id);
      
      const takenIds = new Set((squadData || []).map((s: any) => s.player_id));
      const { data: allPlayersDb } = await supabase
        .from('players')
        .select('id');

      const untaken = (allPlayersDb || []).filter(p => !takenIds.has(p.id));
      if (untaken.length > 0) {
        const shuffledNew = [...untaken].sort(() => Math.random() - 0.5);
        const { data: currentPoolMax } = await supabase
          .from('session_player_pool')
          .select('auction_order')
          .eq('session_id', currentSession.id)
          .order('auction_order', { ascending: false })
          .limit(1)
          .maybeSingle();

        const baseOrder = (currentPoolMax?.auction_order || 0) + 1;
        const newEntries = shuffledNew.map((p, idx) => ({
          session_id: currentSession.id,
          player_id: p.id,
          status: 'AVAILABLE',
          auction_order: baseOrder + idx
        }));

        await supabase.from('session_player_pool').insert(newEntries);

        nextPoolEntry = {
          player_id: newEntries[0].player_id,
          auction_order: newEntries[0].auction_order
        };
      }
    }

    // 4. If literally all players in the database are drafted, wait for host to conclude manually
    if (!nextPoolEntry) {
      return { error: null };
    }

    // Mark pool entry as IN_AUCTION
    await supabase
      .from('session_player_pool')
      .update({ status: 'IN_AUCTION' })
      .eq('session_id', currentSession.id)
      .eq('player_id', nextPoolEntry.player_id);

    // Create auction row
    const endsAt = new Date(Date.now() + 15_000).toISOString();
    const { error: createErr } = await supabase.from('auctions').insert({
      session_id: currentSession.id,
      player_id: nextPoolEntry.player_id,
      starting_price: 5,
      current_bid: 0,
      status: 'LIVE',
      started_at: new Date().toISOString(),
      ends_at: endsAt,
    });

    if (createErr) return { error: createErr.message };
    return { error: null };
  };

  const endAuctionManually = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No active session.' };

    if (currentSession.gameMode === 'ai') {
      const incomplete = (allTeams || []).filter(t => (teamSquadCounts[t.id] || 0) < minSquadRequired);
      if (incomplete.length > 0) {
        const summary = incomplete
          .map(t => `${t.name || t.teamName || 'Team'}: ${teamSquadCounts[t.id] || 0}/${minSquadRequired} players`)
          .join(', ');
        return {
          error: `Cannot end auction: Every team must draft at least ${minSquadRequired} players before simulation! Deficit: ${summary}`,
        };
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (aiBidTimeoutRef.current) clearTimeout(aiBidTimeoutRef.current);
      finalizeAiLineups();
      setAuctionComplete(true);
      setCurrentAuction(null);
      setCurrentPlayer(null);
      return { error: null };
    }

    if (currentSession.hostUserId !== user?.id) {
      return { error: 'Only the room host can conclude the draft auction.' };
    }

    // Verify all teams have minimum 7 players
    const { data: squadRows } = await supabase
      .from('squads')
      .select('team_id')
      .eq('session_id', currentSession.id);

    const counts: Record<string, number> = {};
    (squadRows || []).forEach((r: any) => {
      counts[r.team_id] = (counts[r.team_id] || 0) + 1;
    });

    const incomplete = (allTeams || []).filter(t => (counts[t.id] || 0) < minSquadRequired);
    if (incomplete.length > 0) {
      const summary = incomplete
        .map(t => `${t.name || t.teamName || 'Team'}: ${counts[t.id] || 0}/${minSquadRequired} players`)
        .join(', ');
      return {
        error: `Cannot end auction: Every team must draft at least ${minSquadRequired} players before simulation! Deficit: ${summary}`,
      };
    }

    // Mark current active auction row as concluded
    if (currentAuctionRef.current?.id) {
      await supabase
        .from('auctions')
        .update({ status: 'CONCLUDED' })
        .eq('id', currentAuctionRef.current.id);
    }

    // Transition session status to TEAM_SETUP
    const { error: sessErr } = await supabase
      .from('game_sessions')
      .update({ status: 'TEAM_SETUP' })
      .eq('id', currentSession.id);

    if (sessErr) return { error: sessErr.message };

    setAuctionComplete(true);
    setCurrentAuction(null);
    setCurrentPlayer(null);

    // Broadcast navigation to lineup for all participants
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'navigation',
        payload: { tab: 'lineup' }
      });
    }

    return { error: null };
  };

  const reopenAuction = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No active session.' };

    if (currentSession.gameMode === 'ai') {
      setAuctionComplete(false);
      const targetLot = currentAuctionRef.current;
      if (targetLot) {
        const endsAt = new Date(Date.now() + 15_000).toISOString();
        const reopened = { ...targetLot, status: 'LIVE' as const, endsAt };
        setCurrentAuction(reopened);
        currentAuctionRef.current = reopened;
        startTimer(endsAt, targetLot.id);
        if (currentPlayer) {
          triggerAiEvaluation(reopened, currentPlayer, reopened.currentBid || 0, reopened.highestTeamId);
        }
      } else {
        autoSellAndAdvance();
      }
      return { error: null };
    }

    if (currentSession.hostUserId !== user?.id) {
      return { error: 'Only the room host can reopen the auction.' };
    }

    // Update game_sessions status back to AUCTION
    const { error: sessErr } = await supabase
      .from('game_sessions')
      .update({ status: 'AUCTION' })
      .eq('id', currentSession.id);

    if (sessErr) return { error: sessErr.message };

    setAuctionComplete(false);

    // Broadcast navigation to all participants so everyone returns to auction
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'navigation',
        payload: { tab: 'auction' }
      });
    }

    // Check if an auction is currently LIVE; if not, advance to next player
    const { data: liveRows } = await supabase
      .from('auctions')
      .select('id')
      .eq('session_id', currentSession.id)
      .eq('status', 'LIVE')
      .limit(1);

    if (!liveRows || liveRows.length === 0) {
      await advanceToNextPlayer();
    } else {
      await loadCurrentAuction();
    }

    return { error: null };
  };

  return (
    <AuctionContext.Provider
      value={{
        currentAuction,
        currentPlayer,
        bids,
        mySquad,
        myTeam,
        allTeams,
        timeLeft,
        auctionComplete,
        teamSquadCounts,
        allTeamsHaveMinSquad,
        minSquadRequired,
        aiThinking,
        placeBid,
        nextPlayer,
        skipPlayer,
        endAuctionManually,
        reopenAuction,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used inside <AuctionProvider>');
  return ctx;
}
