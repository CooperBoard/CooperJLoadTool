import React, { useState, useCallback } from 'react';

const COOPER_RED = '#E31937';
const COOPER_NAVY = '#2B3E50';
const COOPER_GOLD = '#D4AF37';

// Window glass options for tap-to-verify
const GLASS_OPTIONS = [
  { value: 'single', label: 'Single Pane', uFactor: 1.10, shgc: 0.86 },
  { value: 'double', label: 'Double Pane', uFactor: 0.49, shgc: 0.56 },
  { value: 'double-low-e', label: 'Double Low-E', uFactor: 0.30, shgc: 0.25 },
  { value: 'double-low-e-argon', label: 'Double Low-E Argon', uFactor: 0.27, shgc: 0.22 },
  { value: 'triple', label: 'Triple Pane', uFactor: 0.20, shgc: 0.27 },
  { value: 'triple-low-e', label: 'Triple Low-E', uFactor: 0.18, shgc: 0.22 },
];

const FRAME_OPTIONS = [
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'wood', label: 'Wood' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'aluminum-break', label: 'Aluminum w/ Break' },
  { value: 'fiberglass', label: 'Fiberglass' },
];

const PAGE_TYPES = [
  { value: 'auto', label: 'Auto-Detect', icon: '🤖', desc: 'AI figures out the page type' },
  { value: 'cover_sheet', label: 'Cover Sheet', icon: '📋', desc: 'Project info, sq footage tables' },
  { value: 'floor_plan', label: 'Floor Plan', icon: '🏠', desc: 'Room layout with dimensions' },
  { value: 'elevation', label: 'Elevation', icon: '🏗️', desc: 'Exterior view — windows & doors' },
];

// Extraction prompt is server-side in /api/parse-plan/route.js

const PlanParser = ({ formData, setFormData, onComplete }) => {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]); // [{pageNum, pageType}]
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload');
  const [editingWindow, setEditingWindow] = useState(null);

  // Convert PDF page to image using canvas
  const loadPdfPages = useCallback(async (pdfFile) => {
    setParseProgress('Loading PDF...');

    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageImages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      setParseProgress(`Rendering page ${i} of ${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      pageImages.push({
        pageNum: i,
        thumbnail: canvas.toDataURL('image/jpeg', 0.3),
        base64: canvas.toDataURL('image/jpeg', 0.85).split(',')[1],
      });
    }

    setPages(pageImages);
    // Auto-select with smart type guessing
    const autoSelect = [];
    if (pageImages.length >= 1) autoSelect.push({ pageNum: 1, pageType: 'cover_sheet' });
    if (pageImages.length >= 3) autoSelect.push({ pageNum: 3, pageType: 'floor_plan' });
    if (pageImages.length >= 4) autoSelect.push({ pageNum: 4, pageType: 'floor_plan' });
    if (pageImages.length >= 5) autoSelect.push({ pageNum: 5, pageType: 'elevation' });
    if (pageImages.length >= 6) autoSelect.push({ pageNum: 6, pageType: 'elevation' });
    setSelectedPages(autoSelect.length > 0 ? autoSelect : [{ pageNum: 1, pageType: 'auto' }]);
    setStep('select');
    setParseProgress('');
  }, []);

  const handleFileChange = useCallback((e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setError(null);
      loadPdfPages(f);
    } else {
      setError('Please upload a PDF file');
    }
  }, [loadPdfPages]);

  const togglePage = (pageNum) => {
    setSelectedPages(prev => {
      const exists = prev.find(p => p.pageNum === pageNum);
      if (exists) return prev.filter(p => p.pageNum !== pageNum);
      return [...prev, { pageNum, pageType: 'auto' }];
    });
  };

  const setPageType = (pageNum, pageType) => {
    setSelectedPages(prev => prev.map(p => p.pageNum === pageNum ? { ...p, pageType } : p));
  };

  const isPageSelected = (pageNum) => selectedPages.some(p => p.pageNum === pageNum);
  const getPageType = (pageNum) => selectedPages.find(p => p.pageNum === pageNum)?.pageType || 'auto';

  // Parse selected pages
  const parsePlans = useCallback(async () => {
    setParsing(true);
    setStep('parsing');
    setError(null);

    try {
      const allResults = [];

      for (let i = 0; i < selectedPages.length; i++) {
        const { pageNum, pageType } = selectedPages[i];
        const page = pages.find(p => p.pageNum === pageNum);
        if (!page) continue;

        const typeLabel = PAGE_TYPES.find(t => t.value === pageType)?.label || 'Auto';
        setParseProgress(`Analyzing page ${pageNum} as ${typeLabel} (${i + 1}/${selectedPages.length})...`);

        const response = await fetch('/api/parse-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: page.base64, pageNum, pageType }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `API error: ${response.status}`);
        }

        const parsed = await response.json();
        allResults.push(parsed);
      }

      const merged = mergeResults(allResults);
      setResults(merged);
      setStep('review');
      setParseProgress('');
    } catch (err) {
      setError(err.message);
      setStep('select');
    } finally {
      setParsing(false);
    }
  }, [pages, selectedPages]);

  // Merge floor plan + elevation + cover sheet results
  const mergeResults = (allResults) => {
    const valid = allResults.filter(r => !r._error);
    if (valid.length === 0) return { rooms: [], windows: [], doors: [], _errors: allResults.filter(r => r._error) };

    const coverSheets = valid.filter(r => r.pageType === 'cover_sheet');
    const floorPlans = valid.filter(r => r.pageType === 'floor_plan');
    const elevations = valid.filter(r => r.pageType === 'elevation');
    // Auto-detected pages may have any pageType
    const autos = valid.filter(r => !['cover_sheet', 'floor_plan', 'elevation'].includes(r.pageType));
    autos.forEach(a => {
      if (a.rooms) floorPlans.push(a);
      else if (a.elevations) elevations.push(a);
      else if (a.totalSqFt || a.planName) coverSheets.push(a);
    });

    // Start with cover sheet data
    const base = coverSheets[0] || {};

    // Merge rooms from floor plans
    const allRooms = [];
    const seenNames = new Set();
    floorPlans.forEach(fp => {
      (fp.rooms || []).forEach(room => {
        if (!seenNames.has(room.name)) {
          seenNames.add(room.name);
          allRooms.push(room);
        }
      });
    });

    // Merge windows from elevations
    const allWindows = [];
    const allDoors = [];
    elevations.forEach(elev => {
      (elev.elevations || []).forEach(face => {
        (face.windows || []).forEach(win => {
          allWindows.push({
            ...win,
            exposure: face.facingDirection || 'North',
            face: face.face,
            // Default glass type — user will verify
            glassType: 'double-low-e',
            frameType: 'vinyl',
            uFactor: 0.30,
            shgc: 0.25,
            gasType: 'air',
            verified: false,
          });
        });
        (face.doors || []).forEach(door => {
          allDoors.push({
            ...door,
            exposure: face.facingDirection || 'North',
            face: face.face,
          });
        });
      });
    });

    // Also grab windows from floor plan results (if any auto-detected pages had them)
    floorPlans.forEach(fp => {
      (fp.windows || []).forEach(w => {
        allWindows.push({ ...w, glassType: 'double-low-e', frameType: 'vinyl', uFactor: 0.30, shgc: 0.25, gasType: 'air', verified: false });
      });
      (fp.doors || []).forEach(d => allDoors.push(d));
    });

    return {
      planName: base.planName || floorPlans[0]?.planName || '',
      stories: base.stories || floorPlans[0]?.stories || 1,
      totalSqFt: base.totalSqFt || floorPlans.reduce((s, fp) => s + (fp.totalSqFt || 0), 0),
      firstFloorSqFt: base.firstFloorSqFt || null,
      secondFloorSqFt: base.secondFloorSqFt || null,
      foundationType: base.foundationType || floorPlans[0]?.foundationType || 'slab',
      wallConstruction: floorPlans[0]?.wallConstruction || {},
      roofType: floorPlans[0]?.roofType || base.roofType || 'asphalt-shingle',
      atticType: floorPlans[0]?.atticType || 'vented',
      rooms: allRooms,
      windows: allWindows,
      doors: allDoors,
      elevationData: elevations.flatMap(e => e.elevations || []),
      designNotes: [
        ...coverSheets.flatMap(c => c.designNotes || []),
        ...floorPlans.flatMap(f => f.designNotes || []),
        ...elevations.flatMap(e => e.designNotes || []),
      ],
      confidence: {
        rooms: floorPlans[0]?.confidence?.rooms || 'medium',
        dimensions: floorPlans[0]?.confidence?.dimensions || 'medium',
        windows: elevations.length > 0 ? (elevations[0]?.confidence?.windowCount || 'medium') : 'low',
        construction: floorPlans[0]?.confidence?.construction || 'medium',
      },
      _pageCount: valid.length,
      _floorPlanPages: floorPlans.length,
      _elevationPages: elevations.length,
      _errors: allResults.filter(r => r._error),
    };
  };

  // Update a window's properties
  const updateWindow = (index, field, value) => {
    setResults(prev => {
      const newWindows = [...prev.windows];
      newWindows[index] = { ...newWindows[index], [field]: value };
      // Auto-set U-factor and SHGC from glass type
      if (field === 'glassType') {
        const glass = GLASS_OPTIONS.find(g => g.value === value);
        if (glass) {
          newWindows[index].uFactor = glass.uFactor;
          newWindows[index].shgc = glass.shgc;
        }
      }
      if (field === 'glassType' || field === 'frameType') {
        newWindows[index].verified = true;
      }
      return { ...prev, windows: newWindows };
    });
  };

  // Apply parsed results to formData
  const applyToCalculator = useCallback(() => {
    if (!results || !setFormData) return;

    setFormData(prev => {
      const newRooms = (results.rooms || []).map((room, i) => ({
        id: i + 1,
        name: room.name,
        sqft: room.sqft || 150,
        ceilingHeight: room.ceilingHeight || 9,
        floor: room.floor || 1,
        exposedWalls: room.exposedWalls || [{ exposure: 'North', linearFeet: 12, percentGlass: 10 }],
        aboveGrade: true,
        partitionToUnconditioned: false,
        partitionSqFt: 0,
      }));

      const newWindows = (results.windows || []).map((win, i) => ({
        id: i + 1,
        name: win.name || win.nearestRoom || `${win.face || ''} Window ${i + 1}`,
        width: win.estimatedWidth || win.width || 36,
        height: win.estimatedHeight || win.height || 48,
        quantity: win.quantity || 1,
        frameType: win.frameType || 'vinyl',
        glassType: win.glassType || 'double-low-e',
        gasType: win.gasType || 'air',
        uFactor: win.uFactor || 0.30,
        shgc: win.shgc || 0.25,
        exposure: win.exposure || 'North',
        overhangDepth: 0,
        overhangDistance: 0,
        interiorShading: 'blinds',
        exteriorShading: 'none',
      }));

      const newDoors = (results.doors || []).map((door, i) => ({
        id: i + 1,
        type: door.type === 'entry' ? 'solid-insulated' : door.type === 'garage' ? 'solid-wood' : door.type || 'solid-wood',
        width: door.estimatedWidth || door.width || 36,
        height: door.estimatedHeight || door.height || 80,
        quantity: door.quantity || 1,
        uFactor: door.type === 'sliding-glass' ? 0.45 : door.type === 'entry' ? 0.35 : 0.50,
        storm: false,
      }));

      const wc = results.wallConstruction || {};

      return {
        ...prev,
        project: { ...prev.project, name: results.planName || prev.project.name },
        rooms: newRooms.length > 0 ? newRooms : prev.rooms,
        windows: newWindows.length > 0 ? newWindows : prev.windows,
        envelope: {
          ...prev.envelope,
          walls: {
            ...prev.envelope.walls,
            type: wc.type || prev.envelope.walls.type,
            studSpacing: wc.studSpacing || prev.envelope.walls.studSpacing,
            exteriorFinish: wc.exteriorFinish || prev.envelope.walls.exteriorFinish,
            cavityInsulation: wc.cavityInsulation || prev.envelope.walls.cavityInsulation,
            cavityR: wc.estimatedCavityR || prev.envelope.walls.cavityR,
          },
          roof: { ...prev.envelope.roof, type: results.roofType || prev.envelope.roof.type, atticType: results.atticType || prev.envelope.roof.atticType },
          floor: { ...prev.envelope.floor, type: results.foundationType || prev.envelope.floor.type },
          doors: newDoors.length > 0 ? newDoors : prev.envelope.doors,
        },
      };
    });

    if (onComplete) onComplete();
  }, [results, setFormData, onComplete]);

  // Styles
  const cardStyle = { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' };
  const labelSm = { display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.5px' };
  const selectSm = { width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' };

  const unverifiedCount = results ? (results.windows || []).filter(w => !w.verified).length : 0;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* === UPLOAD === */}
      {step === 'upload' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📐</div>
          <h3 style={{ color: COOPER_GOLD, margin: '0 0 8px', fontSize: '18px' }}>AI Plan Parser</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px', lineHeight: '1.6' }}>
            Upload building plans (PDF). AI reads floor plans for rooms & dimensions, elevation views for windows & doors.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '24px' }}>
            Two-pass extraction: floor plans → rooms & layout, elevations → windows & doors with exact count and placement
          </p>
          <label style={{
            display: 'inline-block', padding: '14px 32px',
            background: 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)',
            borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
            boxShadow: '0 4px 16px rgba(227, 25, 55, 0.4)',
          }}>
            📁 Upload Building Plans (PDF)
            <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
          {parseProgress && (
            <div style={{ marginTop: '20px', color: COOPER_GOLD, fontSize: '13px' }}>{parseProgress}</div>
          )}
        </div>
      )}

      {/* === SELECT PAGES + TAG TYPE === */}
      {step === 'select' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ color: COOPER_GOLD, margin: '0 0 4px', fontSize: '16px' }}>Select & Tag Pages</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                Click pages to select, then tag each as Floor Plan, Elevation, or Cover Sheet
              </p>
            </div>
            <button onClick={parsePlans} disabled={selectedPages.length === 0} style={{
              padding: '10px 24px',
              background: selectedPages.length > 0 ? 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)' : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: '6px', color: '#fff',
              cursor: selectedPages.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontWeight: '600', opacity: selectedPages.length > 0 ? 1 : 0.4,
            }}>
              🤖 Parse {selectedPages.length} Page{selectedPages.length !== 1 ? 's' : ''}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px' }}>
            {pages.map(page => {
              const selected = isPageSelected(page.pageNum);
              const pType = getPageType(page.pageNum);
              return (
                <div key={page.pageNum} style={{
                  borderRadius: '8px', overflow: 'hidden',
                  border: selected ? `2px solid ${COOPER_RED}` : '2px solid rgba(255,255,255,0.1)',
                  background: selected ? 'rgba(227,25,55,0.08)' : 'rgba(0,0,0,0.2)',
                }}>
                  <img
                    src={page.thumbnail} alt={`Page ${page.pageNum}`}
                    onClick={() => togglePage(page.pageNum)}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block', opacity: selected ? 1 : 0.5, cursor: 'pointer' }}
                  />
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: selected ? '#fff' : 'rgba(255,255,255,0.4)' }}>Page {page.pageNum}</span>
                      <span style={{
                        width: '16px', height: '16px', borderRadius: '3px',
                        background: selected ? COOPER_RED : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer',
                      }} onClick={() => togglePage(page.pageNum)}>
                        {selected ? '✓' : ''}
                      </span>
                    </div>
                    {selected && (
                      <select
                        value={pType}
                        onChange={(e) => setPageType(page.pageNum, e.target.value)}
                        style={{ ...selectSm, fontSize: '10px', padding: '4px 6px' }}
                      >
                        {PAGE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {PAGE_TYPES.map(t => (
              <div key={t.value} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                {t.icon} <strong>{t.label}</strong>: {t.desc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === PARSING === */}
      {step === 'parsing' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>🤖</div>
          <h3 style={{ color: COOPER_GOLD, margin: '0 0 12px', fontSize: '16px' }}>AI is Analyzing Your Plans</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>{parseProgress}</p>
          <div style={{ width: '300px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(90deg, ${COOPER_RED}, ${COOPER_GOLD})`, borderRadius: '3px', animation: 'loading 2s ease-in-out infinite' }} />
          </div>
          <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 50% { transform: translateX(0); } 100% { transform: translateX(100%); } }`}</style>
        </div>
      )}

      {/* === REVIEW RESULTS === */}
      {step === 'review' && results && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ color: COOPER_GOLD, margin: '0 0 4px', fontSize: '16px' }}>{results.planName || 'Extraction Results'}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                {results._floorPlanPages || 0} floor plan{results._floorPlanPages !== 1 ? 's' : ''} + {results._elevationPages || 0} elevation{results._elevationPages !== 1 ? 's' : ''} analyzed
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setStep('select')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>← Re-parse</button>
              <button onClick={applyToCalculator} style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 16px rgba(227, 25, 55, 0.4)' }}>
                ✓ Apply to Calculator
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Rooms', value: (results.rooms || []).length, icon: '🚪' },
              { label: 'Windows', value: (results.windows || []).length, icon: '🪟' },
              { label: 'Doors', value: (results.doors || []).length, icon: '🚪' },
              { label: 'Total SF', value: results.totalSqFt || 0, icon: '📐' },
              { label: 'Verified', value: `${(results.windows || []).filter(w => w.verified).length}/${(results.windows || []).length}`, icon: '✓', highlight: unverifiedCount > 0 },
            ].map(item => (
              <div key={item.label} style={{
                background: item.highlight ? 'rgba(212,175,55,0.1)' : 'rgba(43,62,80,0.5)',
                borderRadius: '8px', padding: '12px', textAlign: 'center',
                border: item.highlight ? `1px solid ${COOPER_GOLD}33` : '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: '16px', marginBottom: '2px' }}>{item.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: item.highlight ? COOPER_GOLD : COOPER_GOLD }}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Rooms table */}
          <div style={cardStyle}>
            <h4 style={{ color: COOPER_GOLD, margin: '0 0 10px', fontSize: '13px' }}>🏠 Rooms (from Floor Plans)</h4>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(43,62,80,0.8)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: COOPER_GOLD }}>Room</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: COOPER_GOLD }}>Sq Ft</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: COOPER_GOLD }}>W × D</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: COOPER_GOLD }}>Floor</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: COOPER_GOLD }}>Ext Walls</th>
                  </tr>
                </thead>
                <tbody>
                  {(results.rooms || []).map((room, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 10px' }}>{room.name}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{room.sqft}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.5)' }}>
                        {room.widthFt ? `${room.widthFt}' × ${room.depthFt}'` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{room.floor}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        {(room.exposedWalls || []).map(w => w.exposure[0]).join('') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* WINDOWS — TAP TO VERIFY (the magic) */}
          {/* ============================================================ */}
          {(results.windows || []).length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ color: COOPER_GOLD, margin: 0, fontSize: '13px' }}>🪟 Windows (from Elevations) — Tap to Verify</h4>
                {unverifiedCount > 0 && (
                  <span style={{ fontSize: '10px', color: COOPER_GOLD, background: 'rgba(212,175,55,0.15)', padding: '3px 8px', borderRadius: '10px' }}>
                    {unverifiedCount} unverified
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gap: '6px' }}>
                {(results.windows || []).map((win, i) => {
                  const isEditing = editingWindow === i;
                  const glass = GLASS_OPTIONS.find(g => g.value === win.glassType);

                  return (
                    <div key={i} style={{
                      background: isEditing ? 'rgba(227,25,55,0.08)' : 'rgba(0,0,0,0.15)',
                      border: isEditing ? `1px solid ${COOPER_RED}44` : win.verified ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(212,175,55,0.15)',
                      borderRadius: '6px', overflow: 'hidden',
                    }}>
                      {/* Window row — click to expand */}
                      <div
                        onClick={() => setEditingWindow(isEditing ? null : i)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: win.verified ? '#4CAF50' : COOPER_GOLD,
                          }} />
                          <span style={{ fontSize: '12px' }}>
                            {win.nearestRoom || win.name || `Window ${i + 1}`}
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                            {win.estimatedWidth || win.width}″×{win.estimatedHeight || win.height}″
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{win.exposure}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '9px',
                            background: win.verified ? 'rgba(76,175,80,0.15)' : 'rgba(212,175,55,0.15)',
                            color: win.verified ? '#4CAF50' : COOPER_GOLD,
                          }}>
                            {glass?.label || win.glassType}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>{isEditing ? '▾' : '▸'}</span>
                        </div>
                      </div>

                      {/* Expanded edit panel */}
                      {isEditing && (
                        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                              <label style={labelSm}>Glass Type</label>
                              <select value={win.glassType} onChange={(e) => updateWindow(i, 'glassType', e.target.value)} style={selectSm}>
                                {GLASS_OPTIONS.map(g => (
                                  <option key={g.value} value={g.value}>{g.label} (U:{g.uFactor})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelSm}>Frame</label>
                              <select value={win.frameType} onChange={(e) => updateWindow(i, 'frameType', e.target.value)} style={selectSm}>
                                {FRAME_OPTIONS.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelSm}>Style</label>
                              <select value={win.windowStyle || 'double-hung'} onChange={(e) => updateWindow(i, 'windowStyle', e.target.value)} style={selectSm}>
                                <option value="single-hung">Single Hung</option>
                                <option value="double-hung">Double Hung</option>
                                <option value="casement">Casement</option>
                                <option value="picture">Picture (Fixed)</option>
                                <option value="slider">Slider</option>
                                <option value="bay">Bay</option>
                                <option value="awning">Awning</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={labelSm}>U-Factor</label>
                              <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px', color: COOPER_GOLD }}>{win.uFactor}</div>
                            </div>
                            <div>
                              <label style={labelSm}>SHGC</label>
                              <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px', color: COOPER_GOLD }}>{win.shgc}</div>
                            </div>
                            <div>
                              <label style={labelSm}>Exposure</label>
                              <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px' }}>{win.exposure}</div>
                            </div>
                            <div>
                              <label style={labelSm}>Room</label>
                              <div style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px' }}>{win.nearestRoom || '—'}</div>
                            </div>
                          </div>
                          {!win.verified && (
                            <button
                              onClick={() => updateWindow(i, 'verified', true)}
                              style={{
                                marginTop: '10px', width: '100%', padding: '7px',
                                background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)',
                                borderRadius: '4px', color: '#4CAF50', cursor: 'pointer', fontSize: '11px',
                              }}
                            >
                              ✓ Mark as Verified
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bulk verify */}
              {unverifiedCount > 0 && (
                <button
                  onClick={() => {
                    setResults(prev => ({
                      ...prev,
                      windows: prev.windows.map(w => ({ ...w, verified: true })),
                    }));
                  }}
                  style={{
                    marginTop: '10px', width: '100%', padding: '8px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '11px',
                  }}
                >
                  ✓ Accept All as Double Low-E (default)
                </button>
              )}
            </div>
          )}

          {/* Doors */}
          {(results.doors || []).length > 0 && (
            <div style={cardStyle}>
              <h4 style={{ color: COOPER_GOLD, margin: '0 0 10px', fontSize: '13px' }}>🚪 Doors (from Elevations)</h4>
              <div style={{ display: 'grid', gap: '4px' }}>
                {(results.doors || []).map((door, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', fontSize: '11px',
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{(door.type || 'entry').replace('-', ' ')} — {door.nearestRoom || door.roomName || '?'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {door.estimatedWidth || door.width}″ × {door.estimatedHeight || door.height}″ • {door.exposure || '?'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(results.designNotes || []).length > 0 && (
            <div style={cardStyle}>
              <h4 style={{ color: COOPER_GOLD, margin: '0 0 10px', fontSize: '13px' }}>📝 Design Notes</h4>
              {results.designNotes.map((note, i) => (
                <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', paddingLeft: '8px', borderLeft: `2px solid ${COOPER_GOLD}33` }}>{note}</div>
              ))}
            </div>
          )}

          {/* Apply button */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={applyToCalculator} style={{
              padding: '14px 48px', background: 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)',
              border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              boxShadow: '0 4px 16px rgba(227, 25, 55, 0.4)',
            }}>
              🔥 Apply All to Load Calculator
            </button>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              Populates Rooms, Windows, Doors, Envelope & Project tabs
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ margin: '16px 0', padding: '12px 16px', background: 'rgba(227,25,55,0.15)', border: '1px solid rgba(227,25,55,0.3)', borderRadius: '6px', fontSize: '12px', color: COOPER_RED }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default PlanParser;
