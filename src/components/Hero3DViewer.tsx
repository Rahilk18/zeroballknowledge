import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Sparkles, Eye, Shield, Zap, Flame } from 'lucide-react';
import { Player } from '../types';
import { renderEASportsFCCard } from '../utils/cardRenderer';
import { getCORSPlayerAvatarUrl, getPlayerAvatarUrl } from '../data/playerAvatars';

interface Hero3DViewerProps {
  player?: Player | null;
  auraHex?: string;
  height?: number | string;
  showControls?: boolean;
}

export const Hero3DViewer: React.FC<Hero3DViewerProps> = ({
  player,
  auraHex = '#00E5FF',
  height = 360,
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeAura, setActiveAura] = useState(auraHex);
  const [activeAction, setActiveAction] = useState<string>('Idle Float');
  const [loading, setLoading] = useState(true);

  // References to three objects for runtime manipulation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const heroGroupRef = useRef<THREE.Group | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveAura(auraHex);
  }, [auraHex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);

    const width = container.clientWidth || 360;
    const h = typeof height === 'number' ? height : container.clientHeight || 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 100);
    camera.position.set(0, 1.35, 3.2);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting (HeroBid Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);

    const auraColor = parseInt(activeAura.replace('#', '0x'), 16);
    const rimLight = new THREE.PointLight(auraColor, 3.5, 14);
    rimLight.position.set(-2.5, 2.5, -2.5);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 4. Holographic Floor Grid (HeroBid GridHelper)
    const gridHelper = new THREE.GridHelper(8, 16, auraColor, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // 5. Holographic Concentric Rings
    const ringGeo = new THREE.RingGeometry(1.25, 1.32, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: auraColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    scene.add(ringMesh);

    const innerRingGeo = new THREE.RingGeometry(0.85, 0.88, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: auraColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = -Math.PI / 2;
    innerRingMesh.position.y = 0.008;
    scene.add(innerRingMesh);

    // 6. Holographic Floating Character / Card Group
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0.95, 0);
    scene.add(heroGroup);
    heroGroupRef.current = heroGroup;

    // Floating Hologram Crystal Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.4, 0.55, 0.15, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: auraColor,
      emissiveIntensity: 0.35,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.85;
    heroGroup.add(pedestal);

    // Create 3D EA Sports FC Ultimate Team Holographic Card Canvas
    const cardCanvas = document.createElement('canvas');
    const CARD_W = 800;
    const CARD_H = 1120;
    cardCanvas.width = CARD_W;
    cardCanvas.height = CARD_H;

    // Immediately render full EA FC Gold Card layout (NEVER empty!)
    renderEASportsFCCard(cardCanvas, player || null, null, {
      width: CARD_W,
      height: CARD_H,
      auraColor: activeAura
    });

    // Convert Canvas to Three.js Texture
    const texture = new THREE.CanvasTexture(cardCanvas);
    texture.anisotropy = 8;
    texture.generateMipmaps = true;

    // Load actual high-res player portrait from EA Sports FC CDN
    const avatarUrl = getCORSPlayerAvatarUrl(player);
    if (avatarUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        renderEASportsFCCard(cardCanvas, player || null, img, {
          width: CARD_W,
          height: CARD_H,
          auraColor: activeAura
        });
        texture.needsUpdate = true;
      };
      img.onerror = () => {
        // Fallback is already beautifully rendered with high-res stylized silhouette, stats & gold shield!
      };
      img.src = avatarUrl;
    }

    // Geometry matching EA FC card aspect ratio (800x1120 -> 1.35 x 1.89)
    const cardGeo = new THREE.BoxGeometry(1.35, 1.89, 0.04);
    const cardMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.04,
      roughness: 0.2,
      metalness: 0.65,
      emissive: 0xdaa520,
      emissiveIntensity: 0.15,
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    heroGroup.add(cardMesh);

    // Floating Particle Orbs surrounding the card
    const particlesCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particlesCount * 3);
    for (let p = 0; p < particlesCount * 3; p += 3) {
      const radius = 0.8 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      particlePos[p] = Math.cos(angle) * radius;
      particlePos[p + 1] = (Math.random() - 0.5) * 1.8;
      particlePos[p + 2] = Math.sin(angle) * radius;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: auraColor,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    heroGroup.add(particlePoints);

    // 7. Mouse drag to orbit in 3D
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !heroGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      heroGroupRef.current.rotation.y += deltaX * 0.01;
      heroGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.4, heroGroupRef.current.rotation.x + deltaY * 0.005));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support for mobile
    let touchStartX = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && heroGroupRef.current) {
        const deltaX = e.touches[0].clientX - touchStartX;
        touchStartX = e.touches[0].clientX;
        heroGroupRef.current.rotation.y += deltaX * 0.015;
      }
    };
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });

    // 8. 60 FPS Render Loop with Delta Time and Floating Hover
    const clock = new THREE.Clock();
    let time = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      if (autoRotate && heroGroupRef.current && !isDragging) {
        heroGroupRef.current.rotation.y += delta * 1.2;
      }

      // Smooth idle levitation
      if (heroGroupRef.current) {
        heroGroupRef.current.position.y = 0.95 + Math.sin(time * 2.2) * 0.06;
      }

      // Rotate floor rings slowly
      ringMesh.rotation.z += delta * 0.3;
      innerRingMesh.rotation.z -= delta * 0.45;

      // Particle float
      particlePoints.rotation.y += delta * 0.5;

      renderer.render(scene, camera);
    };

    animate();
    setLoading(false);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const newH = typeof height === 'number' ? height : container.clientHeight || 360;
      camera.aspect = w / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, [player?.id, height, activeAura]);

  const triggerAction = (actionName: string) => {
    setActiveAction(actionName);
    if (!heroGroupRef.current) return;

    if (actionName === 'SIU Strike') {
      // Fast explosive spin and jump
      heroGroupRef.current.rotation.y += Math.PI * 2;
      heroGroupRef.current.position.y += 0.3;
      setTimeout(() => {
        if (heroGroupRef.current) heroGroupRef.current.position.y -= 0.3;
      }, 400);
    } else if (actionName === 'Golden Finesse') {
      heroGroupRef.current.rotation.y += Math.PI;
    } else if (actionName === 'Cyber Boost') {
      setActiveAura('#F59E0B');
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#0A0A14] via-[#0E1324] to-[#0A0A14] border border-[#00E5FF]/20 shadow-glow-cyan">
      {/* 3D Canvas Mount Point */}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full relative cursor-grab active:cursor-grabbing select-none"
      />

      {/* HeroBid Cyber Grid Background Overlay */}
      <div className="absolute inset-0 pointer-events-none cyber-grid-bg opacity-40" />

      {/* Loading Indicator like HeroBid */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A14]/80 pointer-events-none">
          <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mb-3 shadow-glow-cyan" />
          <span className="text-[#00E5FF] font-bold text-xs tracking-widest text-glow-cyan">
            PROJECTION SYNCING...
          </span>
        </div>
      )}

      {/* Header Overlay: Hero Name & Hologram Status */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/30 text-glow-cyan">
            3D HOLO-STAGE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">FPS: 60</span>
          <span className="text-[11px] font-mono text-emerald-400">● LIVE</span>
        </div>
      </div>

      {/* Controls Overlay Bar */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#0E1324]/85 backdrop-blur-md border border-[#00E5FF]/20">
          {/* Action triggers */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => triggerAction('SIU Strike')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold transition-all border border-[#00E5FF]/40"
              title="Explosive Strike Animation"
            >
              <Zap className="w-3 h-3" />
              <span>SIU!</span>
            </button>
            <button
              onClick={() => triggerAction('Golden Finesse')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/40"
              title="Ballon d'Or Skill"
            >
              <Sparkles className="w-3 h-3" />
              <span>FINESSE</span>
            </button>
            <button
              onClick={() => triggerAction('Cyber Boost')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition-all border border-purple-500/40"
              title="Overdrive Aura"
            >
              <Flame className="w-3 h-3" />
              <span>OVERDRIVE</span>
            </button>
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-2">
            {/* Aura Colors */}
            <div className="flex items-center gap-1">
              {[
                { hex: '#00E5FF', name: 'Cyan' },
                { hex: '#F59E0B', name: 'Gold' },
                { hex: '#A855F7', name: 'Purple' },
                { hex: '#EF4444', name: 'Red' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setActiveAura(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    activeAura === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>

            {/* Auto Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                autoRotate
                  ? 'bg-[#00E5FF]/20 border-[#00E5FF]/40 text-[#00E5FF]'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Auto Rotation"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
