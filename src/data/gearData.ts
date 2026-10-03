export interface FootballGear {
  id: string;
  name: string;
  category: 'STRIKE' | 'PLAYMAKING' | 'DEFENSE' | 'PHYSICAL' | 'CYBER';
  icon: string;
  rarity: 'MYTHIC' | 'LEGENDARY' | 'EPIC' | 'RARE';
  statBoost: {
    stat: 'shooting' | 'pace' | 'passing' | 'dribbling' | 'defending' | 'physical' | 'overall';
    amount: number;
  };
  description: string;
  cost: number;
}

export const FOOTBALL_GEARS: FootballGear[] = [
  {
    id: 'gear-siu-jump',
    name: 'SIU Jet Jump',
    category: 'STRIKE',
    icon: '⚡',
    rarity: 'MYTHIC',
    statBoost: { stat: 'shooting', amount: 8 },
    description: 'Explosive vertical aerial attack. Grants critical clutch goal probability in 80th+ minute.',
    cost: 25,
  },
  {
    id: 'gear-golden-ballons',
    name: 'Golden Ballon d\'Or Aura',
    category: 'PLAYMAKING',
    icon: '🏆',
    rarity: 'MYTHIC',
    statBoost: { stat: 'dribbling', amount: 9 },
    description: 'Masterclass dribbling magnetism. Decimates defender containment with effortless feints.',
    cost: 30,
  },
  {
    id: 'gear-haaland-engine',
    name: 'Cyborg Turbine Engine',
    category: 'PHYSICAL',
    icon: '🦾',
    rarity: 'LEGENDARY',
    statBoost: { stat: 'physical', amount: 10 },
    description: 'High-torque kinetic drive. Overpowers any backline tackle with unstoppable power.',
    cost: 22,
  },
  {
    id: 'gear-left-foot',
    name: 'God Left Foot Cannon',
    category: 'STRIKE',
    icon: '🎯',
    rarity: 'MYTHIC',
    statBoost: { stat: 'shooting', amount: 11 },
    description: 'Laser-guided ball trajectory with 99% curl accuracy from 30 yards out.',
    cost: 28,
  },
  {
    id: 'gear-elastico',
    name: 'Samba Elastico Matrix',
    category: 'PLAYMAKING',
    icon: '🌀',
    rarity: 'LEGENDARY',
    statBoost: { stat: 'dribbling', amount: 8 },
    description: 'Hypnotic ankle-breaking snap dribble. Unlocks instant separation in tight penalty box.',
    cost: 18,
  },
  {
    id: 'gear-roulette',
    name: 'Marseille 360 Roulette',
    category: 'PLAYMAKING',
    icon: '🔄',
    rarity: 'EPIC',
    statBoost: { stat: 'passing', amount: 7 },
    description: 'Spin evasion pivot that opens passing lanes through compact midfield presses.',
    cost: 15,
  },
  {
    id: 'gear-speed-force',
    name: 'Speed Force Cleats',
    category: 'CYBER',
    icon: '👟',
    rarity: 'LEGENDARY',
    statBoost: { stat: 'pace', amount: 9 },
    description: 'Supercharged carbon fiber sprint spikes. Blitz past high defensive lines.',
    cost: 20,
  },
  {
    id: 'gear-vibranium-shield',
    name: 'Vibranium Centerback Armor',
    category: 'DEFENSE',
    icon: '🛡️',
    rarity: 'LEGENDARY',
    statBoost: { stat: 'defending', amount: 10 },
    description: 'Absorbs kinetic impact and neutralizes through-balls with flawless slide timing.',
    cost: 20,
  },
  {
    id: 'gear-heart-herb',
    name: 'Panther Reflex Serum',
    category: 'PHYSICAL',
    icon: '💜',
    rarity: 'EPIC',
    statBoost: { stat: 'overall', amount: 5 },
    description: 'Universal neuro-kinetic reaction booster. Enhances recovery pace and second-ball reactions.',
    cost: 16,
  },
  {
    id: 'gear-continental-coin',
    name: 'High Table Bidding Coin',
    category: 'CYBER',
    icon: '🪙',
    rarity: 'MYTHIC',
    statBoost: { stat: 'overall', amount: 6 },
    description: 'Underworld VIP privilege. Grants +$15M bidding power bonus during live auction.',
    cost: 35,
  },
];
