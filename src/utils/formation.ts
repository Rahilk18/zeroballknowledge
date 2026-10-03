import { Player } from '../types';

export interface FormationInfo {
  id: string;
  name: string;
  label: string;
  defCount: number;
  midCount: number;
  attCount: number;
  description: string;
}

export const FORMATIONS: FormationInfo[] = [
  {
    id: '1-2-2-2',
    name: '1-2-2-2',
    label: '1-2-2-2 Twin Strike',
    defCount: 2,
    midCount: 2,
    attCount: 2,
    description: 'Balanced 2 defenders, 2 midfielders, and 2 forwards. Versatile tactical shape.',
  },
  {
    id: '1-3-2-1',
    name: '1-3-2-1',
    label: '1-3-2-1 Solid Wall',
    defCount: 3,
    midCount: 2,
    attCount: 1,
    description: '3 defenders, 2 midfield anchors, 1 lone target man. Rock-solid defense.',
  },
  {
    id: '1-2-3-1',
    name: '1-2-3-1',
    label: '1-2-3-1 Maestro',
    defCount: 2,
    midCount: 3,
    attCount: 1,
    description: '2 defenders, 3 midfielders controlling possession, 1 clinical striker.',
  },
  {
    id: '1-3-1-2',
    name: '1-3-1-2',
    label: '1-3-1-2 Counter Blitz',
    defCount: 3,
    midCount: 1,
    attCount: 2,
    description: 'Heavy 3-man backline, rapid transition, twin counter-attackers.',
  },
  {
    id: '1-1-3-2',
    name: '1-1-3-2',
    label: '1-1-3-2 Total Attack',
    defCount: 1,
    midCount: 3,
    attCount: 2,
    description: 'Single defender, high-press midfield and dual attack overload.',
  },
  {
    id: '1-1-2-3',
    name: '1-1-2-3',
    label: '1-1-2-3 Trident Assault',
    defCount: 1,
    midCount: 2,
    attCount: 3,
    description: 'Ultra-aggressive 3-man forward trident (wingers & striker). Constant goal threat.',
  },
  {
    id: '1-2-1-3',
    name: '1-2-1-3',
    label: '1-2-1-3 The Arrowhead',
    defCount: 2,
    midCount: 1,
    attCount: 3,
    description: 'Solid twin center-backs, solitary midfield destroyer, and 3 lethal forwards.',
  },
  {
    id: '1-1-4-1',
    name: '1-1-4-1',
    label: '1-1-4-1 Tiki-Taka Diamond',
    defCount: 1,
    midCount: 4,
    attCount: 1,
    description: '4-man midfield swarm controlling pitch possession and threading killer passes.',
  },
  {
    id: '1-4-1-1',
    name: '1-4-1-1',
    label: '1-4-1-1 The Catenaccio',
    defCount: 4,
    midCount: 1,
    attCount: 1,
    description: '4-man backline iron curtain. Shuts down opposition attacking channels.',
  },
  {
    id: '1-2-4-0',
    name: '1-2-4-0',
    label: '1-2-4-0 False Nine',
    defCount: 2,
    midCount: 4,
    attCount: 0,
    description: 'Zero traditional strikers. 4 roaming attacking midfielders overwhelming the box.',
  },
];

export function getFormationInfo(id?: string): FormationInfo {
  return FORMATIONS.find(f => f.id === id) || FORMATIONS[0]; // Default to 1-2-2-2
}

/**
 * Auto-picks the best 7 starting players and bench based on selected formation
 */
export function autoPickBestLineup(
  allSquadPlayers: Player[],
  formationId: string = '1-2-2-2'
): { startingSeven: string[]; bench: string[] } {
  if (!allSquadPlayers || allSquadPlayers.length === 0) {
    return { startingSeven: [], bench: [] };
  }

  const formation = getFormationInfo(formationId);
  const pool = [...allSquadPlayers];

  // 1. Best GK
  const gks = pool.filter(p => p.position === 'GK').sort((a, b) => b.overall - a.overall);
  const selectedGK = gks[0] || pool.slice().sort((a, b) => (b.goalkeeping || 0) - (a.goalkeeping || 0))[0];
  
  const remainingAfterGK = pool.filter(p => p.id !== selectedGK?.id);

  // 2. Best DEFs
  const defs = remainingAfterGK.filter(p => p.position === 'DEF').sort((a, b) => b.overall - a.overall);
  const selectedDEFs = defs.slice(0, formation.defCount);
  const remainingAfterDEF = remainingAfterGK.filter(p => !selectedDEFs.some(d => d.id === p.id));

  // 3. Best MIDs
  const mids = remainingAfterDEF.filter(p => p.position === 'MID').sort((a, b) => b.overall - a.overall);
  const selectedMIDs = mids.slice(0, formation.midCount);
  const remainingAfterMID = remainingAfterDEF.filter(p => !selectedMIDs.some(m => m.id === p.id));

  // 4. Best ATTs
  const atts = remainingAfterMID.filter(p => p.position === 'ATT').sort((a, b) => b.overall - a.overall);
  const selectedATTs = atts.slice(0, formation.attCount);
  const remainingAfterATT = remainingAfterMID.filter(p => !selectedATTs.some(a => a.id === p.id));

  // Fill any remaining starter slots up to 7 with the highest rated overall players
  let starters = [
    ...(selectedGK ? [selectedGK] : []),
    ...selectedDEFs,
    ...selectedMIDs,
    ...selectedATTs,
  ];

  if (starters.length < 7 && remainingAfterATT.length > 0) {
    const filler = remainingAfterATT.sort((a, b) => b.overall - a.overall);
    starters = [...starters, ...filler.slice(0, 7 - starters.length)];
  }

  const startingIds = starters.slice(0, 7).map(p => p.id);
  const benchIds = pool.filter(p => !startingIds.includes(p.id)).map(p => p.id);

  return { startingSeven: startingIds, bench: benchIds };
}
