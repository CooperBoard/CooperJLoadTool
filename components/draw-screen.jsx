import React, { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================
// Cooper J-Load Draw Screen — Wrightsoft-style floor plan tool
// Hotlink sync: receives formData + setFormData as props
// Drawing rooms auto-populates formData.rooms, .windows, .envelope.doors
// ============================================================

const GRID_SIZE = 20; // 1 foot = 20px
const SNAP = GRID_SIZE;
const COOPER_RED = '#E31937';
const COOPER_NAVY = '#2B3E50';
const COOPER_GOLD = '#D4AF37';

const WINDOW_PRESETS = [
  { name: "2'×3' Standard", w: 24, h: 36, frameType: 'vinyl', glassType: 'double-low-e', gasType: 'air', uFactor: 0.30, shgc: 0.25, interiorShading: 'blinds', exteriorShading: 'none' },
  { name: "3'×4' Double Hung", w: 36, h: 48, frameType: 'vinyl', glassType: 'double-low-e', gasType: 'air', uFactor: 0.30, shgc: 0.25, interiorShading: 'blinds', exteriorShading: 'none' },
  { name: "4'×5' Picture", w: 48, h: 60, frameType: 'vinyl', glassType: 'double-low-e', gasType: 'air', uFactor: 0.28, shgc: 0.22, interiorShading: 'none', exteriorShading: 'none' },
  { name: "6'×5' Slider", w: 72, h: 60, frameType: 'vinyl', glassType: 'double-low-e', gasType: 'air', uFactor: 0.30, shgc: 0.25, interiorShading: 'blinds', exteriorShading: 'none' },
];

const DOOR_PRESETS = [
  { name: "3' Entry", w: 36, h: 80, type: 'solid-wood', uFactor: 0.50, storm: false },
  { name: "3' Insulated", w: 36, h: 80, type: 'solid-insulated', uFactor: 0.35, storm: false },
  { name: "6' Sliding Glass", w: 72, h: 80, type: 'sliding-glass', uFactor: 0.45, storm: false },
  { name: "5' French", w: 60, h: 80, type: 'french', uFactor: 0.45, storm: false },
];

const snap = (v) => Math.round(v / SNAP) * SNAP;

const DrawScreen = ({ formData, setFormData, onBack, isFullScreen = false }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeTool, setActiveTool] = useState('room');
  const [drawRooms, setDrawRooms] = useState([]); // Internal drawing state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedWall, setSelectedWall] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 60, y: 60 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('properties');
  const [nextRoomNum, setNextRoomNum] = useState(1);
  const [placingComponent, setPlacingComponent] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null); // { roomId, compId }
  const [draggingComponent, setDraggingComponent] = useState(null); // { roomId, compId }
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeFloor, setActiveFloor] = useState(1);

  // === UNDO / REDO ===
  const pushHistory = useCallback((rooms) => {
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(JSON.parse(JSON.stringify(rooms)));
      if (newHist.length > 50) newHist.shift();
      return newHist;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setDrawRooms(JSON.parse(JSON.stringify(history[newIdx])));
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setDrawRooms(JSON.parse(JSON.stringify(history[newIdx])));
  }, [history, historyIndex]);

  // ============================================================
  // HOTLINK SYNC: Push drawn data into formData
  // ============================================================
  const syncToFormData = useCallback(() => {
    if (!setFormData || drawRooms.length === 0) return;

    // Build rooms array for formData
    const newRooms = drawRooms.map(room => {
      const widthFt = room.w / GRID_SIZE;
      const heightFt = room.h / GRID_SIZE;
      const sqft = Math.round(widthFt * heightFt);

      // Determine exposed walls based on wallTypes and shared walls
      const wallDefs = [
        { exposure: 'North', side: 'top', linearFeet: widthFt },
        { exposure: 'East', side: 'right', linearFeet: heightFt },
        { exposure: 'South', side: 'bottom', linearFeet: widthFt },
        { exposure: 'West', side: 'left', linearFeet: heightFt },
      ];

      const exposedWalls = wallDefs
        .filter((_, i) => room.wallTypes[i] === 'exterior' && !isSharedWall(room, i))
        .map((wall, _i, arr) => {
          // Calculate glass percentage from components on this wall
          const wallIndex = wallDefs.indexOf(wall);
          const wallComponents = (room.components || []).filter(c => c.type === 'window' && c.wallIndex === wallIndex);
          const windowArea = wallComponents.reduce((sum, c) => sum + ((c.w || 36) * (c.h || 48) / 144), 0);
          const wallArea = wall.linearFeet * room.ceilingHeight;
          const percentGlass = wallArea > 0 ? Math.round(windowArea / wallArea * 100) : 0;
          return { exposure: wall.exposure, linearFeet: Math.round(wall.linearFeet), percentGlass };
        });

      return {
        id: room.id,
        name: room.name,
        sqft,
        ceilingHeight: room.ceilingHeight,
        floor: room.floor,
        exposedWalls,
        aboveGrade: true,
        partitionToUnconditioned: room.wallTypes.includes('partition'),
        partitionSqFt: 0,
      };
    });

    // Build windows array for formData
    const newWindows = [];
    let winId = 1;
    drawRooms.forEach(room => {
      const wallDefs = [
        { exposure: 'North' }, { exposure: 'East' }, { exposure: 'South' }, { exposure: 'West' },
      ];
      (room.components || []).filter(c => c.type === 'window').forEach(comp => {
        const exposure = wallDefs[comp.wallIndex]?.exposure || 'North';
        newWindows.push({
          id: winId++,
          name: `${room.name} ${exposure}`,
          width: comp.w || 36,
          height: comp.h || 48,
          quantity: 1,
          frameType: comp.frameType || 'vinyl',
          glassType: comp.glassType || 'double-low-e',
          gasType: comp.gasType || 'air',
          uFactor: comp.uFactor || 0.30,
          shgc: comp.shgc || 0.25,
          exposure,
          overhangDepth: 0,
          overhangDistance: 0,
          interiorShading: comp.interiorShading || 'blinds',
          exteriorShading: comp.exteriorShading || 'none',
        });
      });
    });

    // Build doors array for formData
    const newDoors = [];
    let doorId = 1;
    drawRooms.forEach(room => {
      (room.components || []).filter(c => c.type === 'door').forEach(comp => {
        newDoors.push({
          id: doorId++,
          type: comp.doorType || 'solid-wood',
          width: comp.w || 36,
          height: comp.h || 80,
          quantity: 1,
          uFactor: comp.uFactor || 0.50,
          storm: comp.storm || false,
        });
      });
    });

    setFormData(prev => ({
      ...prev,
      rooms: newRooms.length > 0 ? newRooms : prev.rooms,
      windows: newWindows.length > 0 ? newWindows : prev.windows,
      envelope: {
        ...prev.envelope,
        doors: newDoors.length > 0 ? newDoors : prev.envelope.doors,
      },
    }));

    setSyncStatus(`Synced ${newRooms.length} rooms, ${newWindows.length} windows, ${newDoors.length} doors`);
    setTimeout(() => setSyncStatus(''), 3000);
  }, [drawRooms, setFormData]);

  // Auto-sync when rooms change
  useEffect(() => {
    if (drawRooms.length > 0) {
      const timer = setTimeout(syncToFormData, 500); // Debounce 500ms
      return () => clearTimeout(timer);
    }
  }, [drawRooms, syncToFormData]);

  // ============================================================
  // GEOMETRY HELPERS
  // ============================================================
  const getCanvasPos = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left - panOffset.x) / zoom, y: (e.clientY - rect.top - panOffset.y) / zoom };
  }, [panOffset, zoom]);

  const getRoomWalls = useCallback((room) => {
    const { x, y, w, h } = room;
    return [
      { x1: x, y1: y, x2: x + w, y2: y, exposure: 'North', side: 'top' },
      { x1: x + w, y1: y, x2: x + w, y2: y + h, exposure: 'East', side: 'right' },
      { x1: x, y1: y + h, x2: x + w, y2: y + h, exposure: 'South', side: 'bottom' },
      { x1: x, y1: y, x2: x, y2: y + h, exposure: 'West', side: 'left' },
    ];
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isSharedWall = useCallback((room, wallIndex) => {
    const walls = getRoomWalls(room);
    const wall = walls[wallIndex];
    for (const other of drawRooms) {
      if (other.id === room.id) continue;
      const otherWalls = getRoomWalls(other);
      for (const ow of otherWalls) {
        const isH = wall.y1 === wall.y2;
        const isOH = ow.y1 === ow.y2;
        if (isH && isOH && wall.y1 === ow.y1) {
          if (Math.min(wall.x1, wall.x2) < Math.max(ow.x1, ow.x2) && Math.min(ow.x1, ow.x2) < Math.max(wall.x1, wall.x2)) return true;
        }
        if (!isH && !isOH && wall.x1 === ow.x1) {
          if (Math.min(wall.y1, wall.y2) < Math.max(ow.y1, ow.y2) && Math.min(ow.y1, ow.y2) < Math.max(wall.y1, wall.y2)) return true;
        }
      }
    }
    return false;
  }, [drawRooms, getRoomWalls]);

  const findWallAtPoint = useCallback((px, py) => {
    const threshold = 10 / zoom;
    for (const room of drawRooms) {
      const walls = getRoomWalls(room);
      for (let i = 0; i < walls.length; i++) {
        const { x1, y1, x2, y2 } = walls[i];
        const dx = x2 - x1, dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) continue;
        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const dist = Math.sqrt((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2);
        if (dist < threshold) return { roomId: room.id, wallIndex: i, wall: walls[i], t };
      }
    }
    return null;
  }, [drawRooms, zoom, getRoomWalls]);

  const findRoomAtPoint = useCallback((px, py) => {
    for (let i = drawRooms.length - 1; i >= 0; i--) {
      const r = drawRooms[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r;
    }
    return null;
  }, [drawRooms]);

  const findComponentAtPoint = useCallback((px, py) => {
    for (const room of drawRooms) {
      const walls = getRoomWalls(room);
      for (const comp of (room.components || [])) {
        const wall = walls[comp.wallIndex]; if (!wall) continue;
        const cx = wall.x1 + (wall.x2 - wall.x1) * comp.position;
        const cy = wall.y1 + (wall.y2 - wall.y1) * comp.position;
        const isH = wall.y1 === wall.y2;
        const cW = (comp.w || 36) / 12 * GRID_SIZE;
        const hitPad = 8 / zoom;
        let hit = false;
        if (isH) hit = px >= cx - cW / 2 - hitPad && px <= cx + cW / 2 + hitPad && py >= cy - hitPad && py <= cy + hitPad;
        else hit = px >= cx - hitPad && px <= cx + hitPad && py >= cy - cW / 2 - hitPad && py <= cy + cW / 2 + hitPad;
        if (hit) return { roomId: room.id, compId: comp.id, comp, wallIndex: comp.wallIndex };
      }
    }
    return null;
  }, [drawRooms, getRoomWalls, zoom]);

  const moveComponentToWall = useCallback((roomId, compId, wallIndex, t) => {
    setDrawRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      return { ...r, components: r.components.map(c => c.id === compId ? { ...c, wallIndex, position: Math.max(0.05, Math.min(0.95, t)) } : c) };
    }));
  }, []);

  const deleteComponent = useCallback((roomId, compId) => {
    setDrawRooms(prev => prev.map(r => r.id === roomId ? { ...r, components: r.components.filter(c => c.id !== compId) } : r));
    setSelectedComponent(null);
  }, []);

  // ============================================================
  // MOUSE HANDLERS
  // ============================================================
  const handleMouseDown = useCallback((e) => {
    // Right-click to delete component
    if (e.button === 2) {
      e.preventDefault();
      const pos = getCanvasPos(e);
      const ch = findComponentAtPoint(pos.x, pos.y);
      if (ch) deleteComponent(ch.roomId, ch.compId);
      return;
    }
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    const pos = getCanvasPos(e);
    if (activeTool === 'room') {
      setIsDrawing(true);
      setDrawStart({ x: snap(pos.x), y: snap(pos.y) });
      setDrawCurrent({ x: snap(pos.x), y: snap(pos.y) });
    } else if (activeTool === 'select') {
      // Check components first (windows/doors) — start drag if hit
      const ch = findComponentAtPoint(pos.x, pos.y);
      if (ch) {
        setSelectedComponent({ roomId: ch.roomId, compId: ch.compId });
        setDraggingComponent({ roomId: ch.roomId, compId: ch.compId });
        setSelectedRoom(drawRooms.find(r => r.id === ch.roomId) || null);
        setSelectedWall(null);
        return;
      }
      setSelectedComponent(null);
      const wh = findWallAtPoint(pos.x, pos.y);
      if (wh) { setSelectedWall(wh); setSelectedRoom(drawRooms.find(r => r.id === wh.roomId) || null); }
      else { setSelectedRoom(findRoomAtPoint(pos.x, pos.y)); setSelectedWall(null); }
    } else if ((activeTool === 'window' || activeTool === 'door') && placingComponent) {
      const wh = findWallAtPoint(pos.x, pos.y);
      if (wh) {
        const room = drawRooms.find(r => r.id === wh.roomId);
        if (room) {
          const nc = { id: Date.now(), type: activeTool, wallIndex: wh.wallIndex, position: wh.t, ...placingComponent.preset };
          setDrawRooms(prev => prev.map(r => r.id === room.id ? { ...r, components: [...(r.components || []), nc] } : r));
        }
      }
    } else if (activeTool === 'delete') {
      const rh = findRoomAtPoint(pos.x, pos.y);
      if (rh) { setDrawRooms(prev => prev.filter(r => r.id !== rh.id)); if (selectedRoom?.id === rh.id) setSelectedRoom(null); }
    }
  }, [activeTool, getCanvasPos, findWallAtPoint, findRoomAtPoint, panOffset, placingComponent, drawRooms, selectedRoom]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) { setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    const pos = getCanvasPos(e);
    // Dragging a component — snap to nearest wall
    if (draggingComponent) {
      const room = drawRooms.find(r => r.id === draggingComponent.roomId);
      if (room) {
        const wh = findWallAtPoint(pos.x, pos.y);
        if (wh && wh.roomId === room.id) {
          moveComponentToWall(room.id, draggingComponent.compId, wh.wallIndex, wh.t);
        }
      }
      return;
    }
    if (isDrawing && activeTool === 'room') setDrawCurrent({ x: snap(pos.x), y: snap(pos.y) });
    else setHoveredRoom(findRoomAtPoint(pos.x, pos.y)?.id || null);
  }, [isPanning, isDrawing, activeTool, getCanvasPos, findRoomAtPoint, panStart, draggingComponent, drawRooms, findWallAtPoint, moveComponentToWall]);

  const handleMouseUp = useCallback(() => {
    if (draggingComponent) { setDraggingComponent(null); return; }
    if (isPanning) { setIsPanning(false); return; }
    if (isDrawing && activeTool === 'room' && drawStart && drawCurrent) {
      const x = Math.min(drawStart.x, drawCurrent.x), y = Math.min(drawStart.y, drawCurrent.y);
      const w = Math.abs(drawCurrent.x - drawStart.x), h = Math.abs(drawCurrent.y - drawStart.y);
      if (w >= GRID_SIZE * 2 && h >= GRID_SIZE * 2) {
        const nr = {
          id: Date.now(), name: `Room ${nextRoomNum}`, x, y, w, h,
          ceilingHeight: 9, floor: activeFloor, components: [],
          wallTypes: ['exterior', 'exterior', 'exterior', 'exterior'],
        };
        setDrawRooms(prev => [...prev, nr]);
        setSelectedRoom(nr);
        pushHistory([...drawRooms, nr]);
        setNextRoomNum(p => p + 1);
      }
      setIsDrawing(false); setDrawStart(null); setDrawCurrent(null);
    }
  }, [isPanning, isDrawing, activeTool, drawStart, drawCurrent, nextRoomNum, pushHistory, drawRooms, activeFloor]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.25, Math.min(4, prev * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================
  useEffect(() => {
    const hk = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      else if (e.key === 'r' || e.key === 'R') setActiveTool('room');
      else if (e.key === 'w' || e.key === 'W') { setActiveTool('window'); setPlacingComponent({ type: 'window', preset: WINDOW_PRESETS[1] }); }
      else if (e.key === 'd' || e.key === 'D') { setActiveTool('door'); setPlacingComponent({ type: 'door', preset: DOOR_PRESETS[0] }); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponent) { deleteComponent(selectedComponent.roomId, selectedComponent.compId); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRoom && activeTool === 'select') { setDrawRooms(p => p.filter(r => r.id !== selectedRoom.id)); setSelectedRoom(null); }
      else if (e.key === 'Escape') { setActiveTool('select'); setSelectedRoom(null); setSelectedWall(null); setPlacingComponent(null); setSelectedComponent(null); if (onBack && isFullScreen) onBack(); }
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [selectedRoom, activeTool, onBack, isFullScreen, undo, redo, selectedComponent, deleteComponent]);

  // ============================================================
  // CANVAS RENDERING
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cw = containerRef.current.offsetWidth;
    const ch = containerRef.current.offsetHeight;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0f1923'; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.translate(panOffset.x, panOffset.y); ctx.scale(zoom, zoom);

    // Grid
    const gs = { x: Math.floor(-panOffset.x / zoom / GRID_SIZE) * GRID_SIZE - GRID_SIZE, y: Math.floor(-panOffset.y / zoom / GRID_SIZE) * GRID_SIZE - GRID_SIZE };
    const ge = { x: Math.ceil((cw - panOffset.x) / zoom / GRID_SIZE) * GRID_SIZE + GRID_SIZE, y: Math.ceil((ch - panOffset.y) / zoom / GRID_SIZE) * GRID_SIZE + GRID_SIZE };
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 0.5 / zoom;
    for (let x = gs.x; x <= ge.x; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, gs.y); ctx.lineTo(x, ge.y); ctx.stroke(); }
    for (let y = gs.y; y <= ge.y; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(gs.x, y); ctx.lineTo(ge.x, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1 / zoom;
    for (let x = gs.x; x <= ge.x; x += GRID_SIZE * 5) { ctx.beginPath(); ctx.moveTo(x, gs.y); ctx.lineTo(x, ge.y); ctx.stroke(); }
    for (let y = gs.y; y <= ge.y; y += GRID_SIZE * 5) { ctx.beginPath(); ctx.moveTo(gs.x, y); ctx.lineTo(ge.x, y); ctx.stroke(); }

    // Origin
    ctx.strokeStyle = 'rgba(212,175,55,0.25)'; ctx.lineWidth = 1 / zoom; ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(ge.x, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, ge.y); ctx.stroke(); ctx.setLineDash([]);

    // Rooms
    drawRooms.filter(r => r.floor === activeFloor).forEach(room => {
      const isSel = selectedRoom?.id === room.id;
      const isHov = hoveredRoom === room.id;
      ctx.fillStyle = isSel ? 'rgba(227,25,55,0.08)' : isHov ? 'rgba(212,175,55,0.05)' : 'rgba(43,62,80,0.12)';
      ctx.fillRect(room.x, room.y, room.w, room.h);

      const walls = getRoomWalls(room);
      walls.forEach((wall, i) => {
        const wt = room.wallTypes[i]; const shared = isSharedWall(room, i);
        const wSel = selectedWall?.roomId === room.id && selectedWall?.wallIndex === i;
        if (shared) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([4 / zoom, 4 / zoom]); }
        else if (wt === 'exterior') { ctx.strokeStyle = wSel ? COOPER_GOLD : isSel ? COOPER_RED : COOPER_NAVY; ctx.lineWidth = (wSel ? 5 : 3.5) / zoom; ctx.setLineDash([]); }
        else if (wt === 'partition') { ctx.strokeStyle = '#888'; ctx.lineWidth = 2 / zoom; ctx.setLineDash([6 / zoom, 3 / zoom]); }
        else { ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2 / zoom; ctx.setLineDash([]); }
        ctx.beginPath(); ctx.moveTo(wall.x1, wall.y1); ctx.lineTo(wall.x2, wall.y2); ctx.stroke(); ctx.setLineDash([]);
        // Exposure labels
        if (wt === 'exterior' && !shared && zoom > 0.5) {
          const mx = (wall.x1 + wall.x2) / 2, my = (wall.y1 + wall.y2) / 2;
          const isH = wall.y1 === wall.y2;
          const ox = isH ? 0 : (wall.side === 'left' ? -14 / zoom : 14 / zoom);
          const oy = isH ? (wall.side === 'top' ? -10 / zoom : 14 / zoom) : 0;
          ctx.save(); ctx.font = `${9 / zoom}px system-ui`; ctx.fillStyle = 'rgba(212,175,55,0.65)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(wall.exposure[0], mx + ox, my + oy); ctx.restore();
        }
      });

      // Components
      (room.components || []).forEach(comp => {
        const wall = walls[comp.wallIndex]; if (!wall) return;
        const cx = wall.x1 + (wall.x2 - wall.x1) * comp.position;
        const cy = wall.y1 + (wall.y2 - wall.y1) * comp.position;
        const isH = wall.y1 === wall.y2;
        const cW = (comp.w || 36) / 12 * GRID_SIZE;
        const isSelComp = selectedComponent && selectedComponent.roomId === room.id && selectedComponent.compId === comp.id;
        // Selection highlight ring
        if (isSelComp) {
          ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 / zoom; ctx.setLineDash([4 / zoom, 3 / zoom]);
          if (isH) ctx.strokeRect(cx - cW / 2 - 4 / zoom, cy - 7 / zoom, cW + 8 / zoom, 14 / zoom);
          else ctx.strokeRect(cx - 7 / zoom, cy - cW / 2 - 4 / zoom, 14 / zoom, cW + 8 / zoom);
          ctx.setLineDash([]); ctx.restore();
        }
        if (comp.type === 'window') {
          ctx.fillStyle = isSelComp ? 'rgba(100,180,255,0.5)' : 'rgba(100,180,255,0.25)'; ctx.strokeStyle = isSelComp ? '#fff' : 'rgba(100,180,255,0.7)'; ctx.lineWidth = 1.5 / zoom;
          if (isH) { ctx.fillRect(cx - cW / 2, cy - 3 / zoom, cW, 6 / zoom); ctx.strokeRect(cx - cW / 2, cy - 3 / zoom, cW, 6 / zoom); ctx.beginPath(); ctx.moveTo(cx, cy - 3 / zoom); ctx.lineTo(cx, cy + 3 / zoom); ctx.stroke(); }
          else { ctx.fillRect(cx - 3 / zoom, cy - cW / 2, 6 / zoom, cW); ctx.strokeRect(cx - 3 / zoom, cy - cW / 2, 6 / zoom, cW); ctx.beginPath(); ctx.moveTo(cx - 3 / zoom, cy); ctx.lineTo(cx + 3 / zoom, cy); ctx.stroke(); }
        } else {
          ctx.strokeStyle = COOPER_GOLD; ctx.lineWidth = 1.5 / zoom;
          const dW = (comp.w || 36) / 12 * GRID_SIZE;
          if (isH) { ctx.fillStyle = '#0f1923'; ctx.fillRect(cx - dW / 2, cy - 2.5 / zoom, dW, 5 / zoom); ctx.beginPath(); ctx.arc(cx - dW / 2, cy, dW, 0, -Math.PI / 2, true); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - dW / 2, cy); ctx.lineTo(cx - dW / 2, cy - dW); ctx.stroke(); }
          else { ctx.fillStyle = '#0f1923'; ctx.fillRect(cx - 2.5 / zoom, cy - dW / 2, 5 / zoom, dW); ctx.beginPath(); ctx.arc(cx, cy - dW / 2, dW, Math.PI / 2, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, cy - dW / 2); ctx.lineTo(cx - dW, cy - dW / 2); ctx.stroke(); }
        }
      });

      // Labels
      ctx.save();
      const fs = Math.max(10, 13 / zoom);
      ctx.font = `600 ${fs}px system-ui`; ctx.fillStyle = isSel ? '#fff' : 'rgba(255,255,255,0.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(room.name, room.x + room.w / 2, room.y + room.h / 2 - 8 / zoom);
      const sqft = Math.round((room.w / GRID_SIZE) * (room.h / GRID_SIZE));
      ctx.font = `400 ${fs * 0.75}px system-ui`; ctx.fillStyle = isSel ? COOPER_GOLD : 'rgba(212,175,55,0.55)';
      ctx.fillText(`${sqft} sq ft`, room.x + room.w / 2, room.y + room.h / 2 + 8 / zoom);

      // Dimension lines on hover/select
      if (isSel || isHov) {
        const d = 20 / zoom;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8 / zoom; ctx.setLineDash([3 / zoom, 2 / zoom]);
        ctx.beginPath(); ctx.moveTo(room.x, room.y - d); ctx.lineTo(room.x + room.w, room.y - d); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(room.x, room.y - d - 4 / zoom); ctx.lineTo(room.x, room.y - d + 4 / zoom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(room.x + room.w, room.y - d - 4 / zoom); ctx.lineTo(room.x + room.w, room.y - d + 4 / zoom); ctx.stroke();
        ctx.font = `500 ${9 / zoom}px system-ui`; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${room.w / GRID_SIZE}'`, room.x + room.w / 2, room.y - d - 3 / zoom);
        ctx.setLineDash([3 / zoom, 2 / zoom]);
        ctx.beginPath(); ctx.moveTo(room.x - d, room.y); ctx.lineTo(room.x - d, room.y + room.h); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(room.x - d - 4 / zoom, room.y); ctx.lineTo(room.x - d + 4 / zoom, room.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(room.x - d - 4 / zoom, room.y + room.h); ctx.lineTo(room.x - d + 4 / zoom, room.y + room.h); ctx.stroke();
        ctx.save(); ctx.translate(room.x - d - 3 / zoom, room.y + room.h / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${room.h / GRID_SIZE}'`, 0, 0); ctx.restore();
      }
      ctx.restore();

      // Selection handles
      if (isSel) {
        const hs = 6 / zoom; ctx.fillStyle = COOPER_RED;
        [[room.x, room.y], [room.x + room.w, room.y], [room.x, room.y + room.h], [room.x + room.w, room.y + room.h]].forEach(([cx, cy]) => {
          ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
        });
      }
    });

    // Draw preview
    if (isDrawing && drawStart && drawCurrent) {
      const x = Math.min(drawStart.x, drawCurrent.x), y = Math.min(drawStart.y, drawCurrent.y);
      const w = Math.abs(drawCurrent.x - drawStart.x), h = Math.abs(drawCurrent.y - drawStart.y);
      ctx.fillStyle = 'rgba(227,25,55,0.1)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = COOPER_RED; ctx.lineWidth = 2 / zoom; ctx.setLineDash([6 / zoom, 3 / zoom]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
      ctx.font = `500 ${11 / zoom}px system-ui`; ctx.fillStyle = COOPER_RED; ctx.textAlign = 'center';
      ctx.fillText(`${w / GRID_SIZE}' × ${h / GRID_SIZE}'`, x + w / 2, y + h / 2);
      ctx.fillStyle = 'rgba(227,25,55,0.6)'; ctx.font = `400 ${9 / zoom}px system-ui`;
      ctx.fillText(`${Math.round(w / GRID_SIZE * h / GRID_SIZE)} sq ft`, x + w / 2, y + h / 2 + 14 / zoom);
    }
    ctx.restore();

    // Compass
    const cpx = cw - 50, cpy = 50, cpr = 22;
    ctx.save(); ctx.translate(cpx, cpy);
    ctx.beginPath(); ctx.arc(0, 0, cpr, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -cpr + 4); ctx.lineTo(-5, 3); ctx.lineTo(5, 3); ctx.closePath(); ctx.fillStyle = COOPER_RED; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, cpr - 4); ctx.lineTo(-4, -1); ctx.lineTo(4, -1); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
    ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -cpr - 9); ctx.restore();
  }, [drawRooms, selectedRoom, selectedWall, hoveredRoom, isDrawing, drawStart, drawCurrent, panOffset, zoom, getRoomWalls, isSharedWall, activeFloor]);

  // Room property updates
  const updateRoom = (id, field, value) => {
    setDrawRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    if (selectedRoom?.id === id) setSelectedRoom(prev => ({ ...prev, [field]: value }));
  };
  const updateWallType = (roomId, wallIndex, type) => {
    setDrawRooms(prev => prev.map(r => { if (r.id !== roomId) return r; const nt = [...r.wallTypes]; nt[wallIndex] = type; return { ...r, wallTypes: nt }; }));
  };
  const removeComponent = (roomId, compId) => {
    setDrawRooms(prev => prev.map(r => r.id === roomId ? { ...r, components: r.components.filter(c => c.id !== compId) } : r));
  };

  // ============================================================
  // STYLES
  // ============================================================
  const inputSt = { width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'system-ui' };
  const tools = [
    { id: 'select', icon: '⊹', label: 'Select (V)' },
    { id: 'room', icon: '▢', label: 'Draw Room (R)' },
    { id: 'window', icon: '◻', label: 'Window (W)' },
    { id: 'door', icon: '⊡', label: 'Door (D)' },
    { id: 'delete', icon: '✕', label: 'Delete' },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ display: 'flex', width: '100%', height: isFullScreen ? '100vh' : 'calc(100vh - 180px)', background: '#0f1923', fontFamily: "'Segoe UI',system-ui,sans-serif", color: '#fff', overflow: 'hidden', borderRadius: isFullScreen ? 0 : '10px' }}>

      {/* Left Toolbar */}
      <div style={{ width: '50px', background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '3px' }}>
        {onBack && (
          <button onClick={onBack} title="Back to Calculator" style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '6px', color: COOPER_GOLD, cursor: 'pointer', fontSize: '16px', fontFamily: 'system-ui', marginBottom: '8px' }}>←</button>
        )}
        {tools.map(t => (
          <button key={t.id} onClick={() => { setActiveTool(t.id); if (t.id === 'window') setPlacingComponent({ type: 'window', preset: WINDOW_PRESETS[1] }); else if (t.id === 'door') setPlacingComponent({ type: 'door', preset: DOOR_PRESETS[0] }); else setPlacingComponent(null); }} title={t.label} style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeTool === t.id ? COOPER_RED : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '17px', fontFamily: 'system-ui', transition: 'all 0.15s' }}>
            {t.icon}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setZoom(p => Math.min(4, p * 1.2))} style={{ width: '34px', height: '26px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '15px', fontFamily: 'system-ui' }}>+</button>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom(p => Math.max(0.25, p / 1.2))} style={{ width: '34px', height: '26px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '15px', fontFamily: 'system-ui' }}>−</button>
        <button onClick={() => { setZoom(1); setPanOffset({ x: 60, y: 60 }); }} style={{ width: '34px', height: '26px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '9px', fontFamily: 'system-ui', marginTop: '3px' }}>FIT</button>
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Status bar */}
        <div style={{ height: '34px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '18px', fontSize: '11px' }}>
          <span style={{ color: COOPER_GOLD, fontWeight: '600', letterSpacing: '1px', fontSize: '10px' }}>DRAW MODE</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Tool: <span style={{ color: '#fff' }}>{tools.find(t => t.id === activeTool)?.label}</span></span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Rooms: <span style={{ color: '#fff' }}>{drawRooms.length}</span></span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total: <span style={{ color: '#fff' }}>{drawRooms.reduce((s, r) => s + Math.round(r.w / GRID_SIZE * r.h / GRID_SIZE), 0)} sf</span></span>
          {syncStatus && <span style={{ color: '#4CAF50', fontSize: '10px' }}>✓ {syncStatus}</span>}
          <div style={{ flex: 1 }} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginRight: '4px' }}>FLOOR</span>
            {[1, 2, 3].map(f => (
              <button key={f} onClick={() => setActiveFloor(f)} style={{
                padding: '5px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui',
                background: activeFloor === f ? COOPER_RED : 'rgba(0,0,0,0.3)',
                border: activeFloor === f ? '1px solid ' + COOPER_RED : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}>{f}F</button>
            ))}
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>
              Ctrl+Z undo · Ctrl+Y redo
            </span>
          </div>
        </div>

        {/* Component tray */}
        {(activeTool === 'window' || activeTool === 'door') && (
          <div style={{ height: '40px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginRight: '6px' }}>{activeTool === 'window' ? '🪟' : '🚪'} Click wall:</span>
            {(activeTool === 'window' ? WINDOW_PRESETS : DOOR_PRESETS).map((p, i) => (
              <button key={i} onClick={() => setPlacingComponent({ type: activeTool, preset: p })} style={{ padding: '3px 10px', fontSize: '10px', background: placingComponent?.preset?.name === p.name ? COOPER_RED : 'rgba(255,255,255,0.07)', border: '1px solid', borderColor: placingComponent?.preset?.name === p.name ? COOPER_RED : 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontFamily: 'system-ui' }}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', cursor: activeTool === 'room' ? 'crosshair' : activeTool === 'delete' ? 'not-allowed' : isPanning ? 'grabbing' : 'default' }} onWheel={handleWheel}>
          <canvas ref={canvasRef} style={{ display: 'block', cursor: draggingComponent ? 'grabbing' : undefined }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setIsPanning(false); setIsDrawing(false); setDraggingComponent(null); }} onContextMenu={(e) => e.preventDefault()} />
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ width: '260px', background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {['properties', 'components', 'rooms'].map(tab => (
            <button key={tab} onClick={() => setSidebarTab(tab)} style={{ flex: 1, padding: '9px 0', borderRadius: 0, border: 'none', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', background: sidebarTab === tab ? 'rgba(227,25,55,0.12)' : 'transparent', borderBottom: sidebarTab === tab ? `2px solid ${COOPER_RED}` : '2px solid transparent', color: '#fff', cursor: 'pointer', fontFamily: 'system-ui' }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {sidebarTab === 'properties' && (
            selectedRoom ? (
              <div>
                <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>Room Properties</div>
                <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Name</label>
                <input type="text" value={selectedRoom.name} onChange={e => updateRoom(selectedRoom.id, 'name', e.target.value)} style={{ ...inputSt, marginBottom: '10px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  <div><label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Width</label><div style={{ padding: '7px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{selectedRoom.w / GRID_SIZE} ft</div></div>
                  <div><label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Depth</label><div style={{ padding: '7px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{selectedRoom.h / GRID_SIZE} ft</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                  <div><label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Sq Ft</label><div style={{ padding: '7px 8px', background: 'rgba(212,175,55,0.1)', borderRadius: '4px', fontSize: '12px', color: COOPER_GOLD, fontWeight: '600' }}>{Math.round(selectedRoom.w / GRID_SIZE * selectedRoom.h / GRID_SIZE)}</div></div>
                  <div><label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Ceiling</label><select value={selectedRoom.ceilingHeight} onChange={e => updateRoom(selectedRoom.id, 'ceilingHeight', Number(e.target.value))} style={inputSt}>{[7, 8, 9, 10, 11, 12, 14, 16, 18, 20].map(h => <option key={h} value={h}>{h} ft</option>)}</select></div>
                </div>
                <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Floor</label>
                <select value={selectedRoom.floor} onChange={e => updateRoom(selectedRoom.id, 'floor', Number(e.target.value))} style={{ ...inputSt, marginBottom: '14px' }}><option value={0}>Basement</option><option value={1}>1st Floor</option><option value={2}>2nd Floor</option><option value={3}>3rd Floor</option></select>
                <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: '600' }}>Wall Types</div>
                {['Top (N)', 'Right (E)', 'Bottom (S)', 'Left (W)'].map((label, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', width: '55px', flexShrink: 0 }}>{label}</span>
                    <select value={selectedRoom.wallTypes[i]} onChange={e => updateWallType(selectedRoom.id, i, e.target.value)} style={{ ...inputSt, padding: '4px 6px', fontSize: '10px' }}><option value="exterior">Exterior</option><option value="interior">Interior</option><option value="partition">Partition</option></select>
                    {isSharedWall(selectedRoom, i) && <span style={{ fontSize: '8px', color: COOPER_GOLD }}>adj</span>}
                  </div>
                ))}
                {(selectedRoom.components || []).length > 0 && (<>
                  <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', marginTop: '12px', fontWeight: '600' }}>Components</div>
                  {(selectedRoom.components || []).map(comp => {
                    const walls = getRoomWalls(selectedRoom);
                    return (<div key={comp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 7px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '3px', fontSize: '10px' }}><span>{comp.type === 'window' ? '🪟' : '🚪'} {comp.name} ({walls[comp.wallIndex]?.exposure})</span><button onClick={() => removeComponent(selectedRoom.id, comp.id)} style={{ padding: '1px 5px', background: 'rgba(227,25,55,0.2)', border: 'none', borderRadius: '3px', color: COOPER_RED, cursor: 'pointer', fontSize: '9px', fontFamily: 'system-ui' }}>✕</button></div>);
                  })}
                </>)}
                <button onClick={() => { setDrawRooms(p => p.filter(r => r.id !== selectedRoom.id)); setSelectedRoom(null); }} style={{ width: '100%', padding: '7px', background: 'rgba(227,25,55,0.12)', border: '1px solid rgba(227,25,55,0.25)', borderRadius: '4px', color: COOPER_RED, cursor: 'pointer', marginTop: '14px', fontSize: '11px', fontFamily: 'system-ui' }}>Delete Room</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 12px' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px', opacity: 0.25 }}>▢</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' }}>Select a room or press <strong style={{ color: COOPER_RED }}>R</strong> to draw</div>
                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(212,175,55,0.06)', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.12)', fontSize: '10px', color: 'rgba(255,255,255,0.45)', textAlign: 'left', lineHeight: '1.7' }}>
                  <div style={{ color: COOPER_GOLD, fontWeight: '600', marginBottom: '4px', fontSize: '9px' }}>QUICK START</div>
                  1. <strong>R</strong> — draw rooms<br />2. Click walls to set type<br />3. <strong>W</strong> — add windows<br />4. <strong>D</strong> — add doors<br />5. Auto-syncs to calculator
                </div>
              </div>
            )
          )}

          {sidebarTab === 'components' && (
            <div>
              <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>Windows</div>
              {WINDOW_PRESETS.map((p, i) => (<button key={i} onClick={() => { setActiveTool('window'); setPlacingComponent({ type: 'window', preset: p }); }} style={{ width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: '3px', background: placingComponent?.preset?.name === p.name && activeTool === 'window' ? 'rgba(227,25,55,0.15)' : 'rgba(0,0,0,0.2)', border: '1px solid', borderColor: placingComponent?.preset?.name === p.name && activeTool === 'window' ? 'rgba(227,25,55,0.3)' : 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: 'system-ui', display: 'flex', justifyContent: 'space-between' }}><span>🪟 {p.name}</span><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>U:{p.uFactor}</span></button>))}
              <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', marginTop: '16px', fontWeight: '600' }}>Doors</div>
              {DOOR_PRESETS.map((p, i) => (<button key={i} onClick={() => { setActiveTool('door'); setPlacingComponent({ type: 'door', preset: p }); }} style={{ width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: '3px', background: placingComponent?.preset?.name === p.name && activeTool === 'door' ? 'rgba(227,25,55,0.15)' : 'rgba(0,0,0,0.2)', border: '1px solid', borderColor: placingComponent?.preset?.name === p.name && activeTool === 'door' ? 'rgba(227,25,55,0.3)' : 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: 'system-ui', display: 'flex', justifyContent: 'space-between' }}><span>🚪 {p.name}</span><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>U:{p.uFactor}</span></button>))}
              <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', marginTop: '16px', fontWeight: '600' }}>Room Templates</div>
              {[
                { name: 'Master Bed', w: 14, h: 16, windows: [{wall:2,pos:0.5,preset:1}], doors: [{wall:3,pos:0.3,preset:1}] },
                { name: 'Bedroom', w: 12, h: 12, windows: [{wall:2,pos:0.5,preset:0}], doors: [{wall:3,pos:0.5,preset:1}] },
                { name: 'Kitchen', w: 14, h: 12, windows: [{wall:2,pos:0.5,preset:1}], doors: [] },
                { name: 'Living Room', w: 18, h: 16, windows: [{wall:2,pos:0.3,preset:2},{wall:2,pos:0.7,preset:2}], doors: [{wall:0,pos:0.5,preset:0}] },
                { name: 'Bathroom', w: 8, h: 10, windows: [{wall:2,pos:0.5,preset:0}], doors: [{wall:3,pos:0.5,preset:1}] },
                { name: 'Garage', w: 20, h: 22, windows: [], doors: [{wall:0,pos:0.5,preset:0}] },
              ].map((tmpl, i) => (
                <button key={i} onClick={() => {
                  const nr = {
                    id: Date.now() + i, name: tmpl.name, x: 60 + (drawRooms.length % 3) * 400, y: 60 + Math.floor(drawRooms.length / 3) * 400,
                    w: tmpl.w * GRID_SIZE, h: tmpl.h * GRID_SIZE, ceilingHeight: 9, floor: activeFloor,
                    components: [
                      ...tmpl.windows.map((w, wi) => ({ id: Date.now() + wi + 100, type: 'window', wallIndex: w.wall, position: w.pos, ...WINDOW_PRESETS[w.preset] })),
                      ...tmpl.doors.map((d, di) => ({ id: Date.now() + di + 200, type: 'door', wallIndex: d.wall, position: d.pos, ...DOOR_PRESETS[d.preset] })),
                    ],
                    wallTypes: ['exterior', 'exterior', 'exterior', 'exterior'],
                  };
                  setDrawRooms(prev => [...prev, nr]);
                  setSelectedRoom(nr);
                  setNextRoomNum(p => p + 1);
                }} style={{ width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: '3px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: 'system-ui' }}>
                  📐 {tmpl.name} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{tmpl.w}×{tmpl.h} ft</span>
                </button>
              ))}
            </div>
          )}

          {sidebarTab === 'rooms' && (
            <div>
              <div style={{ fontSize: '9px', color: COOPER_GOLD, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>Room List</div>
              {drawRooms.length === 0 ? (<div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', padding: '16px', textAlign: 'center' }}>No rooms yet</div>) : drawRooms.map(room => (<button key={room.id} onClick={() => { setSelectedRoom(room); setSidebarTab('properties'); }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: '3px', background: selectedRoom?.id === room.id ? 'rgba(227,25,55,0.12)' : 'rgba(0,0,0,0.2)', border: '1px solid', borderColor: selectedRoom?.id === room.id ? 'rgba(227,25,55,0.25)' : 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: 'system-ui' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{room.name}</span><span style={{ color: COOPER_GOLD, fontSize: '9px' }}>{Math.round(room.w / GRID_SIZE * room.h / GRID_SIZE)} sf</span></div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>Floor {room.floor} · {room.ceilingHeight}' ceil{(room.components || []).length > 0 ? ` · ${(room.components || []).length} comp` : ''}</div></button>))}
            </div>
          )}
        </div>

        {/* Sync indicator */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '8px 10px', background: 'rgba(212,175,55,0.08)', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.15)', fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: drawRooms.length > 0 ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>●</span>
            {drawRooms.length > 0 ? `Hotlink active · ${drawRooms.length} rooms synced` : 'Draw rooms to sync with calculator'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawScreen;
