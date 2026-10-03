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

interface AuctionContextType {
  currentAuction: Auction | null;
  currentPlayer: Player | null;
  bids: Bid[];
  mySquad: SquadPlayer[];
  myTeam: Team | null;
  allTeams: Team[];
  timeLeft: number;
  auctionComplete: boolean;
  placeBid: (amount: number) => Promise<{ error: string | null }>;
  nextPlayer: () => Promise<{ error: string | null }>;
  skipPlayer: () => Promise<{ error: string | null }>;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export function AuctionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentSession, myTeam: sessionTeam, allTeams } = useSession();
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [mySquad, setMySquad] = useState<SquadPlayer[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(sessionTeam);
  const [timeLeft, setTimeLeft] = useState(0);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMyTeam(sessionTeam);
  }, [sessionTeam]);

  // Load fresh team budget
  const refreshMyTeam = async () => {
    if (!currentSession || !user) return;
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', currentSession.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setMyTeam(teamFromRow(data as TeamRow));
  };

  // Load my squad
  const loadMySquad = async () => {
    if (!currentSession || !sessionTeam) return;
    const { data } = await supabase
      .from('squads')
      .select('*, players(*)')
      .eq('session_id', currentSession.id)
      .eq('team_id', sessionTeam.id);
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

  // Subscribe to auction updates when session is in AUCTION state
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'AUCTION') return;
    loadCurrentAuction();
    loadMySquad();
    refreshMyTeam();
    subscribeToAuction();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id, currentSession?.status]);

  const loadCurrentAuction = async () => {
    if (!currentSession) return;
    try {
      const { data: rows } = await supabase
        .from('auctions')
        .select('*, players(*)')
        .eq('session_id', currentSession.id)
        .in('status', ['LIVE', 'WAITING'])
        .order('created_at', { ascending: false })
        .limit(1);

      const data = rows && rows.length > 0 ? rows[0] : null;

      if (!data) {
        // Check session_player_pool status to see if draft has truly completed
        const { count: remainingCount } = await supabase
          .from('session_player_pool')
          .select('id', { count: 'exact' })
          .eq('session_id', currentSession.id)
          .in('status', ['AVAILABLE', 'IN_AUCTION']);

        const { count: totalPoolCount } = await supabase
          .from('session_player_pool')
          .select('id', { count: 'exact' })
          .eq('session_id', currentSession.id);

        if (
          currentSession.status === 'MATCHES' ||
          currentSession.status === 'TEAM_SETUP' ||
          currentSession.status === 'COMPLETED' ||
          (totalPoolCount && totalPoolCount > 0 && (remainingCount === 0 || remainingCount === null))
        ) {
          setAuctionComplete(true);
          setCurrentAuction(null);
          setCurrentPlayer(null);
        } else {
          // Pool is not completed! Auction is still in progress or advancing
          setAuctionComplete(false);
          // If host and no live auction row exists, auto-advance
          if (currentSession.hostUserId === user?.id && remainingCount && remainingCount > 0) {
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
      setAuctionComplete(false); // CRITICAL: Reset auctionComplete when auction is found!
      loadBids(auction.id);
      if (auction.endsAt) startTimer(auction.endsAt);
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

  const startTimer = (endsAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0 && currentSession?.hostUserId === user?.id) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        autoNextTimeoutRef.current = setTimeout(() => {
          nextPlayer();
        }, 1500);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 500);
  };

  const subscribeToAuction = () => {
    if (!currentSession) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`auction:${currentSession.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'auctions',
        filter: `session_id=eq.${currentSession.id}`,
      }, () => {
        loadCurrentAuction();
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bids',
      }, (payload) => {
        const newBid = bidFromRow(payload.new as BidRow);
        setBids(prev => [newBid, ...prev]);
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'squads',
        filter: `session_id=eq.${currentSession.id}`,
      }, () => {
        loadMySquad();
        refreshMyTeam();
      })
      .subscribe();
    channelRef.current = channel;
  };

  const placeBid = async (amount: number): Promise<{ error: string | null }> => {
    if (!user || !currentAuction || !sessionTeam) return { error: 'Not ready.' };
    if (currentAuction.status !== 'LIVE') return { error: 'Auction is not live.' };
    if (amount <= currentAuction.currentBid) return { error: `Bid must be higher than current bid (€${currentAuction.currentBid}M).` };
    if (myTeam && amount > myTeam.budget) return { error: `Insufficient budget. You have €${myTeam?.budget}M.` };
    if (mySquad.length >= 7) return { error: 'Your squad is full (7 players max).' };
    if (currentAuction.highestTeamId === sessionTeam.id) return { error: 'You are already the highest bidder.' };

    // Calculate new ends_at by adding 3 seconds (+3,000ms) to remaining auction time
    const currentEndMs = currentAuction.endsAt ? new Date(currentAuction.endsAt).getTime() : Date.now();
    const remainingMs = Math.max(0, currentEndMs - Date.now());
    // Ensure at least 3 seconds, capped at max 20 seconds so rapid bidding doesn't grow indefinitely
    const newRemainingMs = Math.min(20_000, Math.max(3_000, remainingMs + 3_000));
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
    setCurrentAuction(prev => prev ? {
      ...prev,
      currentBid: amount,
      highestTeamId: sessionTeam.id,
      endsAt: newEndsAt,
    } : null);
    startTimer(newEndsAt);

    return { error: null };
  };

  const nextPlayer = async (): Promise<{ error: string | null }> => {
    if (!user || !currentSession) return { error: 'No session.' };
    if (currentSession.hostUserId !== user.id) return { error: 'Only the host can advance the auction.' };
    if (!currentAuction) return { error: 'No auction active.' };

    // If there's a winner, award the player
    if (currentAuction.highestTeamId && currentAuction.currentBid > 0) {
      // Deduct budget
      const { data: teamData } = await supabase
        .from('teams')
        .select('budget')
        .eq('id', currentAuction.highestTeamId)
        .single();
      if (teamData) {
        await supabase
          .from('teams')
          .update({ budget: Math.max(0, teamData.budget - currentAuction.currentBid) })
          .eq('id', currentAuction.highestTeamId);
      }

      // Add to squad
      await supabase.from('squads').insert({
        session_id: currentSession.id,
        team_id: currentAuction.highestTeamId,
        player_id: currentAuction.playerId,
        purchase_price: currentAuction.currentBid,
      });

      // Mark pool entry as SOLD
      await supabase
        .from('session_player_pool')
        .update({ status: 'SOLD' })
        .eq('session_id', currentSession.id)
        .eq('player_id', currentAuction.playerId);

      // Mark auction as SOLD
      await supabase.from('auctions').update({ status: 'SOLD' }).eq('id', currentAuction.id);
    } else {
      // No bids — skip
      await supabase.from('auctions').update({ status: 'SKIPPED' }).eq('id', currentAuction.id);
      await supabase
        .from('session_player_pool')
        .update({ status: 'SKIPPED' })
        .eq('session_id', currentSession.id)
        .eq('player_id', currentAuction.playerId);
    }

    // Start next auction
    return advanceToNextPlayer();
  };

  const skipPlayer = async (): Promise<{ error: string | null }> => {
    if (!user || !currentSession) return { error: 'No session.' };
    if (currentSession.hostUserId !== user.id) return { error: 'Only the host can skip.' };
    if (!currentAuction) return { error: 'No auction active.' };

    await supabase.from('auctions').update({ status: 'SKIPPED' }).eq('id', currentAuction.id);
    await supabase
      .from('session_player_pool')
      .update({ status: 'SKIPPED' })
      .eq('session_id', currentSession.id)
      .eq('player_id', currentAuction.playerId);

    return advanceToNextPlayer();
  };

  const advanceToNextPlayer = async (): Promise<{ error: string | null }> => {
    if (!currentSession) return { error: 'No session.' };

    // Find next AVAILABLE player in pool by auction_order
    const { data: nextPoolEntry } = await supabase
      .from('session_player_pool')
      .select('player_id, auction_order')
      .eq('session_id', currentSession.id)
      .eq('status', 'AVAILABLE')
      .order('auction_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextPoolEntry) {
      // No more players — auction complete
      await supabase
        .from('game_sessions')
        .update({ status: 'TEAM_SETUP' })
        .eq('id', currentSession.id);
      setAuctionComplete(true);
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
        placeBid,
        nextPlayer,
        skipPlayer,
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
