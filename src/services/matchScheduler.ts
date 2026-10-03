import { Team, Fixture } from '../types';

/**
 * Generate a fair round-robin schedule for 2 to 8 teams.
 * Supports odd numbers of teams with byes.
 */
export function generateFixtures(teams: Team[], sessionId?: string): Fixture[] {
  if (teams.length < 2) return [];

  const teamList = [...teams];
  const fixtures: Fixture[] = [];

  // Special case: 2 teams play a 4-match series (home, away, home, away)
  if (teamList.length === 2) {
    const [teamA, teamB] = teamList;
    for (let w = 1; w <= 4; w++) {
      const isEven = w % 2 === 0;
      fixtures.push({
        id: `fix-${sessionId || 'local'}-${w}-1`,
        sessionId,
        matchweek: w,
        homeTeamId: isEven ? teamB.id : teamA.id,
        awayTeamId: isEven ? teamA.id : teamB.id,
        status: 'SCHEDULED'
      });
    }
    return fixtures;
  }

  // If odd number of teams, add dummy BYE team
  const hasBye = teamList.length % 2 !== 0;
  const dummyByeId = '__BYE__';
  const participants = teamList.map(t => t.id);
  if (hasBye) {
    participants.push(dummyByeId);
  }

  const n = participants.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;

  // Circle algorithm
  const rotation = [...participants];
  let fixtureIdCounter = 1;

  for (let round = 0; round < rounds; round++) {
    const matchweek = round + 1;
    for (let i = 0; i < matchesPerRound; i++) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];

      // Skip bye matches
      if (home !== dummyByeId && away !== dummyByeId) {
        // Alternate home and away to be fair
        const isAlternate = (round + i) % 2 === 1;
        fixtures.push({
          id: `fix-${sessionId || 'local'}-${matchweek}-${fixtureIdCounter++}`,
          sessionId,
          matchweek,
          homeTeamId: isAlternate ? away : home,
          awayTeamId: isAlternate ? home : away,
          status: 'SCHEDULED'
        });
      }
    }

    // Rotate array: keep index 0 fixed, shift the rest
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  // Second half of season (reverse fixtures for full home & away)
  const firstHalfCount = fixtures.length;
  for (let i = 0; i < firstHalfCount; i++) {
    const firstHalfFix = fixtures[i];
    fixtures.push({
      id: `fix-${sessionId || 'local'}-${firstHalfFix.matchweek + rounds}-${fixtureIdCounter++}`,
      sessionId,
      matchweek: firstHalfFix.matchweek + rounds,
      homeTeamId: firstHalfFix.awayTeamId,
      awayTeamId: firstHalfFix.homeTeamId,
      status: 'SCHEDULED'
    });
  }

  return fixtures;
}
