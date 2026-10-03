// ============================================================
// EA SPORTS FC ULTIMATE TEAM 3D HOLOGRAPHIC CARD RENDERER
// Generates official-fidelity gold shield card textures for WebGL
// ============================================================

import { Player } from '../types';

export interface CardRenderOptions {
  width?: number;
  height?: number;
  auraColor?: string;
}

// Map player position to EA FC Ultimate Team position code
export function getEAFCPosition(player?: Player | null): string {
  if (!player) return 'ST';
  const pos = player.position;
  const name = player.name.toLowerCase();

  if (pos === 'GK') return 'GK';
  if (pos === 'DEF') {
    if (name.includes('mendes') || name.includes('hernández') || name.includes('gvardiol')) return 'LB';
    if (name.includes('hakimi') || name.includes('arnold') || name.includes('koundé')) return 'RB';
    return 'CB';
  }
  if (pos === 'MID') {
    if (name.includes('bellingham') || name.includes('musiala') || name.includes('wirtz') || name.includes('palmer') || name.includes('ødegaard')) return 'CAM';
    if (name.includes('rodri') || name.includes('rice') || name.includes('kimmich')) return 'CDM';
    return 'CM';
  }
  // ATT
  if (name.includes('vinícius') || name.includes('leão') || name.includes('kvaratskhelia')) return 'LW';
  if (name.includes('messi') || name.includes('saka') || name.includes('yamal') || name.includes('salah') || name.includes('rodrygo')) return 'RW';
  return 'ST';
}

// Country code / Flag colors mapping
export function drawCountryFlag(ctx: CanvasRenderingContext2D, nationality: string, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const nat = (nationality || '').toLowerCase();

  if (nat.includes('france')) {
    // Blue, White, Red
    ctx.fillStyle = '#002654';
    ctx.fillRect(x, y, w / 3, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + w / 3, y, w / 3, h);
    ctx.fillStyle = '#ED2939';
    ctx.fillRect(x + (2 * w) / 3, y, w / 3, h);
  } else if (nat.includes('argentina')) {
    // Sky blue, White, Sky blue
    ctx.fillStyle = '#74ACDF';
    ctx.fillRect(x, y, w, h / 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y + h / 3, w, h / 3);
    ctx.fillStyle = '#74ACDF';
    ctx.fillRect(x, y + (2 * h) / 3, w, h / 3);
    // Sun
    ctx.fillStyle = '#F6B40E';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, h * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (nat.includes('portugal')) {
    // Green & Red
    ctx.fillStyle = '#046A38';
    ctx.fillRect(x, y, w * 0.4, h);
    ctx.fillStyle = '#DA291C';
    ctx.fillRect(x + w * 0.4, y, w * 0.6, h);
  } else if (nat.includes('brazil')) {
    // Green with yellow diamond & blue circle
    ctx.fillStyle = '#009739';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#FEDD00';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 2);
    ctx.lineTo(x + w - 3, y + h / 2);
    ctx.lineTo(x + w / 2, y + h - 2);
    ctx.lineTo(x + 3, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#012169';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, h * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (nat.includes('spain')) {
    // Red, Yellow (double), Red
    ctx.fillStyle = '#AA151B';
    ctx.fillRect(x, y, w, h * 0.25);
    ctx.fillStyle = '#F1BF00';
    ctx.fillRect(x, y + h * 0.25, w, h * 0.5);
    ctx.fillStyle = '#AA151B';
    ctx.fillRect(x, y + h * 0.75, w, h * 0.25);
  } else if (nat.includes('england')) {
    // White with Red St George Cross
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#CE1124';
    ctx.fillRect(x + w / 2 - 2, y, 4, h);
    ctx.fillRect(x, y + h / 2 - 2, w, 4);
  } else if (nat.includes('germany')) {
    // Black, Red, Gold
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h / 3);
    ctx.fillStyle = '#DD0000';
    ctx.fillRect(x, y + h / 3, w, h / 3);
    ctx.fillStyle = '#FFCE00';
    ctx.fillRect(x, y + (2 * h) / 3, w, h / 3);
  } else if (nat.includes('norway')) {
    // Red, White & Blue cross
    ctx.fillStyle = '#BA0C2F';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + w * 0.35 - 3, y, 6, h);
    ctx.fillRect(x, y + h / 2 - 3, w, 6);
    ctx.fillStyle = '#00205B';
    ctx.fillRect(x + w * 0.35 - 1.5, y, 3, h);
    ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
  } else if (nat.includes('belgium')) {
    // Black, Yellow, Red
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w / 3, h);
    ctx.fillStyle = '#FDDA24';
    ctx.fillRect(x + w / 3, y, w / 3, h);
    ctx.fillStyle = '#EF3340';
    ctx.fillRect(x + (2 * w) / 3, y, w / 3, h);
  } else {
    // Generic World Blue/Gold Flag
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, h * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Border around flag
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// Trace the exact EA Sports FC Ultimate Team Gold Shield Card Silhouette
export function traceEAFCCardPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.beginPath();
  // Top center curved peak
  ctx.moveTo(x + w * 0.5, y + 18);
  // Curve up to right crest shoulder
  ctx.quadraticCurveTo(x + w * 0.78, y + 26, x + w - 44, y + 54);
  // Top right angled notch
  ctx.lineTo(x + w - 24, y + 78);
  // Straight vertical right edge
  ctx.lineTo(x + w - 24, y + h * 0.73);
  // Bottom right taper curve towards shield point
  ctx.quadraticCurveTo(x + w - 34, y + h * 0.89, x + w * 0.5, y + h - 16);
  // Bottom left taper curve from shield point
  ctx.quadraticCurveTo(x + 34, y + h * 0.89, x + 24, y + h * 0.73);
  // Straight vertical left edge
  ctx.lineTo(x + 24, y + 78);
  // Top left angled notch
  ctx.lineTo(x + 44, y + 54);
  // Curve back up to top center peak
  ctx.quadraticCurveTo(x + w * 0.22, y + 26, x + w * 0.5, y + 18);
  ctx.closePath();
}

// Master Render Routine
export function renderEASportsFCCard(
  canvas: HTMLCanvasElement,
  player: Player | null,
  avatarImage: HTMLImageElement | null,
  options: CardRenderOptions = {}
) {
  const width = options.width || 800;
  const height = options.height || 1120;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear full canvas with transparent background so 3D mesh only shows shield shape
  ctx.clearRect(0, 0, width, height);

  // 1. Draw and Clip Outer Shield
  ctx.save();
  traceEAFCCardPath(ctx, 0, 0, width, height);
  ctx.clip();

  // 2. Base Metallic Gold Gradient Background
  const goldGrad = ctx.createLinearGradient(0, 0, width, height);
  goldGrad.addColorStop(0, '#FFF6BD');
  goldGrad.addColorStop(0.15, '#FCE881');
  goldGrad.addColorStop(0.4, '#F5C242');
  goldGrad.addColorStop(0.7, '#E5A51A');
  goldGrad.addColorStop(0.9, '#C68310');
  goldGrad.addColorStop(1, '#935804');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. 3D Diagonal Geometric Waves & Holographic Gold Ribbons (Matches FC 25 Ultimate Team Card)
  ctx.save();
  // Diagonal gold ribbon 1
  const ribbon1 = ctx.createLinearGradient(100, 50, width, 450);
  ribbon1.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  ribbon1.addColorStop(0.3, 'rgba(255, 230, 130, 0.3)');
  ribbon1.addColorStop(0.7, 'rgba(180, 110, 10, 0.35)');
  ribbon1.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
  ctx.fillStyle = ribbon1;

  ctx.beginPath();
  ctx.moveTo(width * 0.25, 40);
  ctx.bezierCurveTo(width * 0.5, 90, width * 0.7, 180, width - 20, 260);
  ctx.lineTo(width - 20, 360);
  ctx.bezierCurveTo(width * 0.65, 280, width * 0.45, 170, width * 0.2, 100);
  ctx.closePath();
  ctx.fill();

  // Diagonal gold ribbon 2
  const ribbon2 = ctx.createLinearGradient(200, 180, width, 550);
  ribbon2.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  ribbon2.addColorStop(0.5, 'rgba(240, 185, 45, 0.4)');
  ribbon2.addColorStop(1, 'rgba(140, 80, 5, 0.45)');
  ctx.fillStyle = ribbon2;

  ctx.beginPath();
  ctx.moveTo(width * 0.35, 140);
  ctx.bezierCurveTo(width * 0.65, 230, width * 0.8, 330, width - 20, 430);
  ctx.lineTo(width - 20, 510);
  ctx.bezierCurveTo(width * 0.75, 420, width * 0.55, 300, width * 0.3, 190);
  ctx.closePath();
  ctx.fill();

  // Subtle Holographic Rainbow Prismatic Sheen
  const holoGrad = ctx.createLinearGradient(0, height * 0.2, width, height * 0.7);
  holoGrad.addColorStop(0, 'rgba(255, 23, 68, 0.12)');
  holoGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.08)');
  holoGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.12)');
  holoGrad.addColorStop(1, 'rgba(255, 23, 68, 0.15)');
  ctx.fillStyle = holoGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 4. Player Photo or High-Res Silhouette
  const photoW = width * 0.68;
  const photoH = height * 0.54;
  const photoX = width * 0.22;
  const photoY = height * 0.135;

  if (avatarImage && avatarImage.complete && avatarImage.naturalWidth > 0) {
    // Draw real EA Sports FC player portrait with soft shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(avatarImage, photoX, photoY, photoW, photoH);
    ctx.restore();
  } else {
    // High-tech stylized player silhouette fallback (NEVER comes empty!)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 18;

    // Body / Shoulders
    const bodyGrad = ctx.createLinearGradient(photoX, photoY + photoH * 0.5, photoX + photoW, photoY + photoH);
    bodyGrad.addColorStop(0, '#1E293B');
    bodyGrad.addColorStop(0.5, '#0F172A');
    bodyGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(photoX + photoW * 0.5, photoY + photoH * 0.9, photoW * 0.45, photoH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headGrad = ctx.createRadialGradient(
      photoX + photoW * 0.5, photoY + photoH * 0.38, 10,
      photoX + photoW * 0.5, photoY + photoH * 0.38, photoW * 0.3
    );
    headGrad.addColorStop(0, '#334155');
    headGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = headGrad;

    ctx.beginPath();
    ctx.arc(photoX + photoW * 0.5, photoY + photoH * 0.38, photoW * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // Neon Player Number / Initial on chest
    ctx.fillStyle = '#FF1744';
    ctx.font = '900 48px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${player?.number || '9'}`, photoX + photoW * 0.5, photoY + photoH * 0.85);
    ctx.restore();
  }

  // 5. Left Header: Overall Rating (OVR), Position & Playstyle
  const ovr = player?.overall || 91;
  const position = getEAFCPosition(player);

  ctx.save();
  ctx.fillStyle = '#1C1917'; // Deep dark bronze/black
  ctx.font = '900 96px Orbitron, Rajdhani, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(ovr), width * 0.23, height * 0.205);

  ctx.font = '800 42px Orbitron, Rajdhani, sans-serif';
  ctx.fillText(position, width * 0.23, height * 0.26);

  // Small Golden Rocket Playstyle Badge on left edge
  const badgeX = width * 0.17;
  const badgeY = height * 0.31;
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.moveTo(badgeX, badgeY - 14);
  ctx.lineTo(badgeX + 16, badgeY);
  ctx.lineTo(badgeX, badgeY + 14);
  ctx.lineTo(badgeX - 16, badgeY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '16px sans-serif';
  ctx.fillText('🚀', badgeX, badgeY + 5);
  ctx.restore();

  // 6. Name Plate Banner & Typography
  const displayName = (
    player?.shortName ||
    player?.name.split(' ').slice(-1)[0] ||
    'PLAYER'
  ).toUpperCase();

  ctx.save();
  // Name Bar Shadow & Text
  ctx.fillStyle = '#1C1917';
  ctx.font = '900 54px Rajdhani, Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 4;
  ctx.fillText(displayName, width * 0.5, height * 0.69);
  ctx.restore();

  // 7. Stats Horizontal Divider Line
  ctx.save();
  const dividerGrad = ctx.createLinearGradient(width * 0.12, 0, width * 0.88, 0);
  dividerGrad.addColorStop(0, 'rgba(90, 50, 5, 0.05)');
  dividerGrad.addColorStop(0.2, 'rgba(90, 50, 5, 0.7)');
  dividerGrad.addColorStop(0.5, 'rgba(90, 50, 5, 0.95)');
  dividerGrad.addColorStop(0.8, 'rgba(90, 50, 5, 0.7)');
  dividerGrad.addColorStop(1, 'rgba(90, 50, 5, 0.05)');
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.12, height * 0.72);
  ctx.lineTo(width * 0.88, height * 0.72);
  ctx.stroke();
  ctx.restore();

  // 8. Attributes Grid (6 FC Stats)
  const isGK = player?.position === 'GK';
  const statLabels = isGK
    ? ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS']
    : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  const statValues = isGK
    ? [
        player?.goalkeeping || 88,
        player?.defending || 85,
        player?.passing || 78,
        player?.form || 89,
        player?.pace || 52,
        player?.physical || 84,
      ]
    : [
        player?.pace || 94,
        player?.shooting || 90,
        player?.passing || 80,
        player?.dribbling || 92,
        player?.defending || 38,
        player?.physical || 77,
      ];

  const colCenters = [
    width * 0.18,
    width * 0.31,
    width * 0.44,
    width * 0.57,
    width * 0.70,
    width * 0.83,
  ];

  ctx.save();
  statLabels.forEach((label, idx) => {
    const cx = colCenters[idx];

    // Label: PAC, SHO, etc.
    ctx.fillStyle = '#44403C';
    ctx.font = '700 24px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, height * 0.765);

    // Numeric Value
    ctx.fillStyle = '#1C1917';
    ctx.font = '900 40px Orbitron, Rajdhani, sans-serif';
    ctx.fillText(String(statValues[idx]), cx, height * 0.825);
  });
  ctx.restore();

  // 9. Bottom Row: Country Flag, League Logo, Club Crest
  const bottomY = height * 0.88;
  const flagW = 44;
  const flagH = 28;

  // Nation Flag
  drawCountryFlag(ctx, player?.nationality || 'World', width * 0.35, bottomY - 14, flagW, flagH);

  // League Flame Logo (EA FC Official Flame)
  ctx.save();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(width * 0.5, bottomY - 16);
  ctx.quadraticCurveTo(width * 0.5 + 16, bottomY - 5, width * 0.5 + 8, bottomY + 14);
  ctx.quadraticCurveTo(width * 0.5, bottomY + 8, width * 0.5 - 8, bottomY + 14);
  ctx.quadraticCurveTo(width * 0.5 - 16, bottomY - 5, width * 0.5, bottomY - 16);
  ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FC', width * 0.5, bottomY + 3);
  ctx.restore();

  // Club Shield Crest
  ctx.save();
  const crestX = width * 0.65;
  ctx.fillStyle = '#1E3A8A';
  ctx.beginPath();
  ctx.moveTo(crestX, bottomY - 15);
  ctx.lineTo(crestX + 16, bottomY - 8);
  ctx.lineTo(crestX + 14, bottomY + 8);
  ctx.lineTo(crestX, bottomY + 16);
  ctx.lineTo(crestX - 14, bottomY + 8);
  ctx.lineTo(crestX - 16, bottomY - 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡', crestX, bottomY + 4);
  ctx.restore();

  // 10. Outer Beveled Metallic Gold Border & Shimmer Frame
  ctx.restore(); // Undo shield clipping so border is drawn on the edge

  ctx.save();
  traceEAFCCardPath(ctx, 0, 0, width, height);

  // Outer Golden Metallic Bevel
  const borderGrad = ctx.createLinearGradient(0, 0, width, height);
  borderGrad.addColorStop(0, '#FEF08A');
  borderGrad.addColorStop(0.3, '#F59E0B');
  borderGrad.addColorStop(0.7, '#D97706');
  borderGrad.addColorStop(1, '#78350F');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 14;
  ctx.stroke();

  // Inner Dark Inset Pinstripe
  ctx.strokeStyle = 'rgba(70, 35, 5, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}
