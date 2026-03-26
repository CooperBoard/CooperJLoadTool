import React, { useState, useEffect, useCallback } from 'react';
import DrawScreen from './draw-screen';

const CooperJLoadCalculatorPro = () => {
  const [activeTab, setActiveTab] = useState('project');
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);
  const [drawFullScreen, setDrawFullScreen] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const [formData, setFormData] = useState({
    // === PROJECT INFO ===
    project: {
      name: '',
      customerName: '',
      address: '',
      city: 'Myrtle Beach',
      state: 'SC',
      zip: '29577',
      climateZone: '3A',
      designCoolingTemp: 95,
      designHeatingTemp: 28,
      indoorCoolingTemp: 75,
      indoorHeatingTemp: 70,
      latitude: 33.69,
      elevation: 25,
      coolingHumidity: 55,
    },

    // === BUILDING ENVELOPE ===
    envelope: {
      // Wall Construction
      walls: {
        type: '2x4', // 2x4, 2x6, block, icf
        studSpacing: 16, // 16, 24
        exteriorFinish: 'vinyl', // vinyl, brick, stucco, wood, hardie
        sheathing: 'osb', // osb, plywood, foam
        sheathingR: 0.5,
        cavityInsulation: 'fiberglass', // fiberglass, cellulose, spray-foam-open, spray-foam-closed
        cavityR: 13,
        continuousInsulation: false,
        continuousR: 0,
        interiorFinish: 'drywall',
        wallColor: 'medium', // light, medium, dark
      },
      // Roof/Ceiling
      roof: {
        type: 'asphalt-shingle', // asphalt-shingle, metal, tile, flat
        color: 'medium', // light, medium, dark
        radiantBarrier: false,
        atticType: 'vented', // vented, unvented, cathedral, flat
        ceilingInsulationType: 'blown', // blown, batt, spray-foam
        ceilingR: 30,
        atticDuctwork: true,
      },
      // Floor
      floor: {
        type: 'slab', // slab, crawl-vented, crawl-sealed, basement-conditioned, basement-unconditioned, over-garage
        slabEdgeInsulation: false,
        slabEdgeR: 0,
        floorInsulationR: 0,
        crawlWallInsulationR: 0,
      },
      // Doors
      doors: [
        { id: 1, type: 'solid-wood', width: 36, height: 80, quantity: 1, uFactor: 0.50, storm: false },
        { id: 2, type: 'sliding-glass', width: 72, height: 80, quantity: 1, uFactor: 0.45, storm: false },
      ],
    },

    // === WINDOWS ===
    windows: [
      { 
        id: 1, 
        name: 'Living Room South',
        width: 48, 
        height: 60, 
        quantity: 2, 
        frameType: 'vinyl', // wood, vinyl, aluminum, aluminum-break
        glassType: 'double-low-e', // single, double, double-low-e, triple, triple-low-e
        gasType: 'air', // air, argon, krypton
        uFactor: 0.30,
        shgc: 0.25,
        exposure: 'South',
        overhangDepth: 0,
        overhangDistance: 0,
        interiorShading: 'blinds', // none, blinds, drapes-light, drapes-medium, drapes-dark
        exteriorShading: 'none', // none, awning, screen, trees-deciduous, trees-evergreen
      },
      { 
        id: 2, 
        name: 'Kitchen East',
        width: 36, 
        height: 48, 
        quantity: 2, 
        frameType: 'vinyl',
        glassType: 'double-low-e',
        gasType: 'air',
        uFactor: 0.30,
        shgc: 0.25,
        exposure: 'East',
        overhangDepth: 12,
        overhangDistance: 6,
        interiorShading: 'blinds',
        exteriorShading: 'none',
      },
    ],

    // === INFILTRATION ===
    infiltration: {
      method: 'estimate', // blower-door, estimate
      ach50: null, // If blower door test
      constructionQuality: 'average', // tight, average, leaky, very-leaky
      hasFireplace: false,
      fireplaceType: 'none', // none, masonry-damper, masonry-glass, prefab-sealed
      numBathroomExhaust: 2,
      numKitchenExhaust: 1,
      dryerVented: true,
    },

    // === DUCT SYSTEM ===
    ducts: {
      systemType: 'forced-air', // forced-air, mini-split, radiant, none
      supplyLocation: 'attic', // conditioned, attic, crawl, garage, basement
      returnLocation: 'attic',
      supplyInsulationR: 6,
      returnInsulationR: 6,
      ductSealingClass: 'sealed-mastic', // unsealed, taped, sealed-mastic, spray-sealed
      estimatedLeakage: 'average', // tight, average, leaky
      supplyLinearFeet: 120,
      returnLinearFeet: 60,
      numSupplyRuns: 8,
      numReturnRuns: 2,
    },

    // === INTERNAL LOADS ===
    internalLoads: {
      numOccupants: 4,
      occupantActivityLevel: 'normal', // sedentary, normal, active
      numRefrigerators: 1,
      numRangeOven: 1,
      rangeType: 'electric', // gas, electric
      numDishwasher: 1,
      numClothesWasher: 1,
      numClothesDryer: 1,
      dryerType: 'electric', // gas, electric
      lightingType: 'mixed', // incandescent, cfl, led, mixed
      lightingWattsPerSqFt: 1.0,
      miscPlugLoads: 'average', // low, average, high
      homeOfficeEquipment: false,
      aquarium: false,
      hotTubIndoor: false,
    },

    // === VENTILATION ===
    ventilation: {
      method: 'exhaust-only', // none, exhaust-only, supply-only, balanced, erv, hrv
      ashrae622Compliant: true,
      cfmRequired: 0, // Auto-calculated or manual
      ervEfficiency: 0,
      hrvEfficiency: 0,
    },

    // === ROOMS ===
    rooms: [
      { 
        id: 1, 
        name: 'Living Room', 
        sqft: 400, 
        ceilingHeight: 9,
        floor: 1,
        exposedWalls: [
          { exposure: 'South', linearFeet: 20, percentGlass: 30 },
          { exposure: 'West', linearFeet: 20, percentGlass: 0 },
        ],
        aboveGrade: true,
        partitionToUnconditioned: false,
        partitionSqFt: 0,
      },
      { 
        id: 2, 
        name: 'Kitchen', 
        sqft: 200, 
        ceilingHeight: 9,
        floor: 1,
        exposedWalls: [
          { exposure: 'East', linearFeet: 15, percentGlass: 20 },
        ],
        aboveGrade: true,
        partitionToUnconditioned: false,
        partitionSqFt: 0,
      },
      { 
        id: 3, 
        name: 'Master Bedroom', 
        sqft: 250, 
        ceilingHeight: 9,
        floor: 1,
        exposedWalls: [
          { exposure: 'West', linearFeet: 18, percentGlass: 25 },
          { exposure: 'North', linearFeet: 14, percentGlass: 15 },
        ],
        aboveGrade: true,
        partitionToUnconditioned: false,
        partitionSqFt: 0,
      },
    ],
  });

  // Helper to update nested state
  const updateNested = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateDeepNested = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  // Add/remove array items
  const addWindow = () => {
    const newId = Math.max(...formData.windows.map(w => w.id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      windows: [...prev.windows, {
        id: newId,
        name: `Window ${newId}`,
        width: 36,
        height: 48,
        quantity: 1,
        frameType: 'vinyl',
        glassType: 'double-low-e',
        gasType: 'air',
        uFactor: 0.30,
        shgc: 0.25,
        exposure: 'North',
        overhangDepth: 0,
        overhangDistance: 0,
        interiorShading: 'none',
        exteriorShading: 'none',
      }]
    }));
  };

  const removeWindow = (id) => {
    setFormData(prev => ({
      ...prev,
      windows: prev.windows.filter(w => w.id !== id)
    }));
  };

  const updateWindow = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      windows: prev.windows.map(w => w.id === id ? { ...w, [field]: value } : w)
    }));
  };

  const addDoor = () => {
    const newId = Math.max(...formData.envelope.doors.map(d => d.id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      envelope: {
        ...prev.envelope,
        doors: [...prev.envelope.doors, {
          id: newId,
          type: 'solid-wood',
          width: 36,
          height: 80,
          quantity: 1,
          uFactor: 0.50,
          storm: false,
        }]
      }
    }));
  };

  const removeDoor = (id) => {
    setFormData(prev => ({
      ...prev,
      envelope: {
        ...prev.envelope,
        doors: prev.envelope.doors.filter(d => d.id !== id)
      }
    }));
  };

  const updateDoor = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      envelope: {
        ...prev.envelope,
        doors: prev.envelope.doors.map(d => d.id === id ? { ...d, [field]: value } : d)
      }
    }));
  };

  const addRoom = () => {
    const newId = Math.max(...formData.rooms.map(r => r.id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, {
        id: newId,
        name: `Room ${newId}`,
        sqft: 150,
        ceilingHeight: 9,
        floor: 1,
        exposedWalls: [{ exposure: 'North', linearFeet: 12, percentGlass: 10 }],
        aboveGrade: true,
        partitionToUnconditioned: false,
        partitionSqFt: 0,
      }]
    }));
  };

  const removeRoom = (id) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter(r => r.id !== id)
    }));
  };

  const updateRoom = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  // === SAVE / LOAD ===
  const saveProject = useCallback((name) => {
    const project = { name, formData, results, savedAt: new Date().toISOString() };
    const projects = JSON.parse(localStorage.getItem('cooper-jload-projects') || '[]');
    const existing = projects.findIndex(p => p.name === name);
    if (existing >= 0) projects[existing] = project;
    else projects.push(project);
    localStorage.setItem('cooper-jload-projects', JSON.stringify(projects));
    setSavedProjects(projects);
    setShowSaveModal(false);
  }, [formData, results]);

  const loadProject = useCallback((project) => {
    setFormData(project.formData);
    if (project.results) setResults(project.results);
    setShowLoadModal(false);
  }, []);

  const deleteProject = useCallback((name) => {
    const projects = JSON.parse(localStorage.getItem('cooper-jload-projects') || '[]').filter(p => p.name !== name);
    localStorage.setItem('cooper-jload-projects', JSON.stringify(projects));
    setSavedProjects(projects);
  }, []);

  useEffect(() => {
    setSavedProjects(JSON.parse(localStorage.getItem('cooper-jload-projects') || '[]'));
  }, []);

  const CLIMATE_DATA = {
    '29577': { city: 'Myrtle Beach', zone: '3A', cool: 95, heat: 28, lat: 33.69, elev: 25, humidity: 55 },
    '29572': { city: 'Myrtle Beach', zone: '3A', cool: 95, heat: 28, lat: 33.69, elev: 25, humidity: 55 },
    '29579': { city: 'Myrtle Beach', zone: '3A', cool: 95, heat: 28, lat: 33.69, elev: 25, humidity: 55 },
    '29566': { city: 'Murrells Inlet', zone: '3A', cool: 95, heat: 28, lat: 33.55, elev: 20, humidity: 56 },
    '29575': { city: 'Myrtle Beach', zone: '3A', cool: 95, heat: 28, lat: 33.69, elev: 25, humidity: 55 },
    '29588': { city: 'Surfside Beach', zone: '3A', cool: 95, heat: 28, lat: 33.61, elev: 20, humidity: 55 },
    '29526': { city: 'Conway', zone: '3A', cool: 96, heat: 27, lat: 33.84, elev: 35, humidity: 56 },
    '29440': { city: 'Georgetown', zone: '3A', cool: 95, heat: 28, lat: 33.37, elev: 10, humidity: 57 },
    '29582': { city: 'North Myrtle Beach', zone: '3A', cool: 95, heat: 29, lat: 33.82, elev: 15, humidity: 55 },
    '29585': { city: 'Pawleys Island', zone: '3A', cool: 95, heat: 28, lat: 33.43, elev: 10, humidity: 56 },
    '29568': { city: 'Myrtle Beach', zone: '3A', cool: 95, heat: 28, lat: 33.69, elev: 25, humidity: 55 },
    '29501': { city: 'Florence', zone: '3A', cool: 97, heat: 25, lat: 34.20, elev: 148, humidity: 54 },
    '29536': { city: 'Dillon', zone: '3A', cool: 97, heat: 24, lat: 34.42, elev: 105, humidity: 54 },
    '28401': { city: 'Wilmington NC', zone: '3A', cool: 95, heat: 27, lat: 34.23, elev: 30, humidity: 56 },
    '29403': { city: 'Charleston', zone: '3A', cool: 96, heat: 28, lat: 32.78, elev: 15, humidity: 57 },
    '29464': { city: 'Mt Pleasant', zone: '3A', cool: 96, heat: 28, lat: 32.79, elev: 20, humidity: 57 },
    '29407': { city: 'Charleston', zone: '3A', cool: 96, heat: 28, lat: 32.78, elev: 15, humidity: 57 },
    '29201': { city: 'Columbia', zone: '3A', cool: 99, heat: 24, lat: 34.00, elev: 292, humidity: 52 },
    '27601': { city: 'Raleigh NC', zone: '4A', cool: 96, heat: 22, lat: 35.77, elev: 315, humidity: 51 },
    '28202': { city: 'Charlotte NC', zone: '3A', cool: 97, heat: 22, lat: 35.23, elev: 748, humidity: 50 },
  };

  const lookupClimate = useCallback((zip) => {
    const data = CLIMATE_DATA[zip];
    if (!data) return;
    setFormData(prev => ({
      ...prev,
      project: {
        ...prev.project,
        city: data.city,
        climateZone: data.zone,
        designCoolingTemp: data.cool,
        designHeatingTemp: data.heat,
        latitude: data.lat,
        elevation: data.elev,
        coolingHumidity: data.humidity,
      }
    }));
  }, []);

  const exportPDF = useCallback(() => {
    if (!results) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const r = results;
    const p = formData.project;
    let html = `<!DOCTYPE html><html><head><title>Manual J Report — ${p.name || p.customerName || 'Project'}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;padding:20px;color:#333;max-width:8.5in}
      .header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:3px solid #E31937;margin-bottom:16px}
      .logo{display:flex;align-items:center;gap:10px}
      .logo-icon{width:40px;height:40px;background:#E31937;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:800}
      .company{font-size:16px;font-weight:800;color:#2B3E50}
      .tagline{font-size:9px;color:#888}
      h1{font-size:18px;color:#2B3E50;margin-bottom:4px}
      h2{font-size:14px;color:#2B3E50;margin:16px 0 8px;padding-bottom:4px;border-bottom:2px solid #D4AF37}
      .info{font-size:11px;color:#666;margin-bottom:2px}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px}
      .card{background:#f4f5f7;border-radius:6px;padding:12px;text-align:center}
      .card-val{font-size:22px;font-weight:700;color:#2B3E50}
      .card-label{font-size:9px;color:#888;text-transform:uppercase}
      .card-primary{background:#E31937;color:#fff}
      .card-primary .card-val{color:#fff}
      .card-primary .card-label{color:rgba(255,255,255,0.8)}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
      th{background:#2B3E50;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
      td{padding:5px 8px;border-bottom:1px solid #ddd}
      tr:nth-child(even){background:#f8f9fb}
      .footer{margin-top:20px;padding-top:8px;border-top:1px solid #ddd;font-size:9px;color:#999;display:flex;justify-content:space-between}
      .disclaimer{margin-top:10px;font-size:9px;color:#E65100;background:#FFF8E1;padding:8px;border-radius:4px}
      @media print{body{padding:12px}@page{margin:0.3in}}
    </style></head><body>`;
    html += `<div class="header"><div class="logo"><div class="logo-icon">C</div><div><div class="company">COOPER MECHANICAL</div><div class="tagline">HVAC · ELECTRICAL · GENERATORS</div></div></div><div style="text-align:right;font-size:10px;color:#666">Manual J8 Load Report<br>${r.timestamp}</div></div>`;
    html += `<h1>${p.name || 'Load Calculation Report'}</h1>`;
    if (p.customerName) html += `<div class="info">Customer: ${p.customerName}</div>`;
    if (p.address) html += `<div class="info">Address: ${p.address}, ${p.city}, ${p.state} ${p.zip}</div>`;
    html += `<div class="info">Design: ${p.designCoolingTemp}°F cooling / ${p.designHeatingTemp}°F heating · Climate Zone ${p.climateZone}</div>`;
    html += `<h2>Load Summary</h2><div class="grid">`;
    html += `<div class="card card-primary"><div class="card-val">${r.recommendedTonnage}</div><div class="card-label">Recommended Tons</div></div>`;
    html += `<div class="card"><div class="card-val">${r.totalCoolingLoad.toLocaleString()}</div><div class="card-label">Cooling BTU/hr</div></div>`;
    html += `<div class="card"><div class="card-val">${r.totalHeatingLoad.toLocaleString()}</div><div class="card-label">Heating BTU/hr</div></div>`;
    html += `<div class="card"><div class="card-val">${r.totalSqFt.toLocaleString()}</div><div class="card-label">Total Sq Ft</div></div></div>`;
    html += `<h2>Cooling Load Breakdown</h2><table><thead><tr><th>Component</th><th style="text-align:right">BTU/hr</th><th style="text-align:right">% of Total</th></tr></thead><tbody>`;
    Object.entries(r.loadBreakdown).forEach(([k, v]) => {
      const pct = r.totalCoolingLoad > 0 ? ((v / r.totalCoolingLoad) * 100).toFixed(1) : '0';
      html += '<tr><td style="text-transform:capitalize">' + k.replace(/([A-Z])/g, ' $1').trim() + '</td><td style="text-align:right">' + v.toLocaleString() + '</td><td style="text-align:right">' + pct + '%</td></tr>';
    });
    html += `</tbody></table>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">`;
    html += `<div class="card"><div class="card-val">${r.effectiveACH}</div><div class="card-label">Effective ACH</div></div>`;
    html += `<div class="card"><div class="card-val">${r.ductLossFactor}%</div><div class="card-label">Duct Loss</div></div>`;
    html += `<div class="card"><div class="card-val">${r.buildingVolume.toLocaleString()}</div><div class="card-label">Volume Cu Ft</div></div></div>`;
    html += `<h2>Room-by-Room Results</h2><table><thead><tr><th>Room</th><th style="text-align:right">Sq Ft</th><th style="text-align:right">Cooling BTU</th><th style="text-align:right">Heating BTU</th><th style="text-align:right">CFM</th></tr></thead><tbody>`;
    r.roomLoads.forEach(rm => { html += '<tr><td>' + rm.name + '</td><td style="text-align:right">' + Number(rm.sqft).toLocaleString() + '</td><td style="text-align:right">' + rm.coolingBtu.toLocaleString() + '</td><td style="text-align:right">' + rm.heatingBtu.toLocaleString() + '</td><td style="text-align:right">' + rm.cfm + '</td></tr>'; });
    html += `</tbody></table>`;
    if (r.equipmentOptions) {
      html += `<h2>Equipment Sizing Recommendations</h2><table><thead><tr><th>Option</th><th>Tonnage</th><th>SEER</th><th>HSPF</th><th>Brand</th><th>Notes</th></tr></thead><tbody>`;
      r.equipmentOptions.forEach(eq => { html += '<tr><td>' + eq.label + '</td><td>' + eq.tons + ' ton</td><td>' + eq.seer + '</td><td>' + eq.hspf + '</td><td>' + eq.brand + '</td><td>' + eq.note + '</td></tr>'; });
      html += `</tbody></table>`;
    }
    html += `<div class="disclaimer">This load calculation is for estimation purposes. Final equipment selection should be verified by a licensed HVAC contractor. Manual J calculations per ACCA methodology.</div>`;
    html += `<div class="footer"><span>Cooper Mechanical Services · www.CallCooper.com</span><span>Generated ${new Date().toLocaleDateString()}</span></div>`;
    html += `</body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [results, formData]);

  // Calculate loads (simplified but more comprehensive)
  const calculateLoad = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const { project, envelope, windows, infiltration, ducts, internalLoads, rooms } = formData;
      const totalSqFt = rooms.reduce((sum, r) => sum + Number(r.sqft), 0);
      const avgCeilingHeight = rooms.reduce((sum, r) => sum + Number(r.ceilingHeight), 0) / rooms.length;
      const buildingVolume = totalSqFt * avgCeilingHeight;

      // Design delta T
      const coolingDeltaT = project.designCoolingTemp - project.indoorCoolingTemp;
      const heatingDeltaT = project.indoorHeatingTemp - project.designHeatingTemp;

      // Wall R-value calculation
      const wallCavityR = envelope.walls.cavityR;
      const wallContinuousR = envelope.walls.continuousInsulation ? envelope.walls.continuousR : 0;
      const wallTotalR = wallCavityR + wallContinuousR + 1; // +1 for air films
      const wallUFactor = 1 / wallTotalR;

      // Estimate wall area
      const wallArea = rooms.reduce((sum, r) => {
        return sum + r.exposedWalls.reduce((wSum, w) => wSum + (w.linearFeet * r.ceilingHeight), 0);
      }, 0);

      // Window calculations
      const totalWindowArea = windows.reduce((sum, w) => {
        return sum + ((w.width * w.height / 144) * w.quantity);
      }, 0);
      const avgWindowU = windows.reduce((sum, w) => sum + w.uFactor, 0) / (windows.length || 1);
      const avgSHGC = windows.reduce((sum, w) => sum + w.shgc, 0) / (windows.length || 1);

      // Door calculations
      const totalDoorArea = envelope.doors.reduce((sum, d) => {
        return sum + ((d.width * d.height / 144) * d.quantity);
      }, 0);
      const avgDoorU = envelope.doors.reduce((sum, d) => sum + d.uFactor, 0) / (envelope.doors.length || 1);

      // Ceiling R-value
      const ceilingR = envelope.roof.ceilingR;
      const ceilingUFactor = 1 / (ceilingR + 1);

      // Floor factors
      let floorFactor = 0;
      if (envelope.floor.type === 'slab') {
        floorFactor = envelope.floor.slabEdgeInsulation ? 0.5 : 1.0;
      } else if (envelope.floor.type.includes('crawl')) {
        floorFactor = envelope.floor.floorInsulationR > 0 ? 0.6 : 1.2;
      }

      // Infiltration ACH
      let effectiveACH;
      if (infiltration.method === 'blower-door' && infiltration.ach50) {
        effectiveACH = infiltration.ach50 / 20; // Simplified conversion
      } else {
        const qualityFactors = { 'tight': 0.2, 'average': 0.35, 'leaky': 0.5, 'very-leaky': 0.75 };
        effectiveACH = qualityFactors[infiltration.constructionQuality] || 0.35;
      }
      if (infiltration.hasFireplace && infiltration.fireplaceType !== 'prefab-sealed') {
        effectiveACH += 0.1;
      }

      // Duct loss factors
      const ductLocationFactors = { 'conditioned': 1.0, 'attic': 1.20, 'crawl': 1.12, 'garage': 1.15, 'basement': 1.08 };
      const ductSealingFactors = { 'unsealed': 1.15, 'taped': 1.08, 'sealed-mastic': 1.03, 'spray-sealed': 1.01 };
      const ductLossFactor = (ductLocationFactors[ducts.supplyLocation] || 1.0) * (ductSealingFactors[ducts.ductSealingClass] || 1.0);

      // Internal loads (BTU/hr)
      const occupantLoad = internalLoads.numOccupants * 400;
      const applianceLoad = 
        (internalLoads.numRefrigerators * 400) +
        (internalLoads.numRangeOven * (internalLoads.rangeType === 'gas' ? 1200 : 800)) +
        (internalLoads.numDishwasher * 300) +
        (internalLoads.numClothesDryer * (internalLoads.dryerType === 'gas' ? 500 : 400));
      const lightingLoad = totalSqFt * internalLoads.lightingWattsPerSqFt * 3.412;
      const plugLoadFactors = { 'low': 0.5, 'average': 1.0, 'high': 1.5 };
      const plugLoad = totalSqFt * 1.5 * (plugLoadFactors[internalLoads.miscPlugLoads] || 1.0);
      const totalInternalLoad = occupantLoad + applianceLoad + lightingLoad + plugLoad;

      // === COOLING LOAD CALCULATION ===
      // Wall conduction
      const wallCoolingLoad = (wallArea - totalWindowArea - totalDoorArea) * wallUFactor * coolingDeltaT;
      
      // Window conduction + solar
      const windowConductionLoad = totalWindowArea * avgWindowU * coolingDeltaT;
      const solarLoadFactor = avgSHGC * 200; // Simplified solar gain
      const windowSolarLoad = totalWindowArea * solarLoadFactor;
      const totalWindowLoad = windowConductionLoad + windowSolarLoad;

      // Door load
      const doorLoad = totalDoorArea * avgDoorU * coolingDeltaT;

      // Ceiling load
      const ceilingLoad = totalSqFt * ceilingUFactor * coolingDeltaT * (envelope.roof.atticType === 'vented' ? 1.3 : 1.0);

      // Floor load (minimal for cooling)
      const floorCoolingLoad = totalSqFt * floorFactor * 2;

      // Infiltration load (sensible)
      const infiltrationCoolingLoad = buildingVolume * effectiveACH * 0.018 * coolingDeltaT;

      // Latent load (humidity)
      const latentLoad = buildingVolume * effectiveACH * 0.7 * (project.coolingHumidity - 50) * 0.5;

      // Total cooling load
      const sensibleCoolingLoad = (wallCoolingLoad + totalWindowLoad + doorLoad + ceilingLoad + floorCoolingLoad + infiltrationCoolingLoad + totalInternalLoad) * ductLossFactor;
      const totalCoolingLoad = Math.round(sensibleCoolingLoad + latentLoad);

      // === HEATING LOAD CALCULATION ===
      const wallHeatingLoad = (wallArea - totalWindowArea - totalDoorArea) * wallUFactor * heatingDeltaT;
      const windowHeatingLoad = totalWindowArea * avgWindowU * heatingDeltaT;
      const doorHeatingLoad = totalDoorArea * avgDoorU * heatingDeltaT;
      const ceilingHeatingLoad = totalSqFt * ceilingUFactor * heatingDeltaT;
      const floorHeatingLoad = totalSqFt * floorFactor * 5;
      const infiltrationHeatingLoad = buildingVolume * effectiveACH * 0.018 * heatingDeltaT;

      const totalHeatingLoad = Math.round((wallHeatingLoad + windowHeatingLoad + doorHeatingLoad + ceilingHeatingLoad + floorHeatingLoad + infiltrationHeatingLoad) * ductLossFactor);

      // Equipment sizing
      const coolingTonnage = totalCoolingLoad / 12000;
      const recommendedTonnage = Math.ceil(coolingTonnage * 2) / 2;

      // Room-by-room breakdown
      const roomLoads = rooms.map(room => {
        const roomRatio = room.sqft / totalSqFt;
        const roomCooling = Math.round(totalCoolingLoad * roomRatio);
        const roomHeating = Math.round(totalHeatingLoad * roomRatio);
        const roomCFM = Math.round(roomCooling / 30);
        return {
          ...room,
          coolingBtu: roomCooling,
          heatingBtu: roomHeating,
          cfm: roomCFM,
        };
      });

      // Load breakdown for display
      const loadBreakdown = {
        walls: Math.round(wallCoolingLoad),
        windows: Math.round(totalWindowLoad),
        doors: Math.round(doorLoad),
        ceiling: Math.round(ceilingLoad),
        floor: Math.round(floorCoolingLoad),
        infiltration: Math.round(infiltrationCoolingLoad),
        internal: Math.round(totalInternalLoad),
        latent: Math.round(latentLoad),
        ductLoss: Math.round((sensibleCoolingLoad + latentLoad) * (ductLossFactor - 1)),
      };

      setResults({
        totalCoolingLoad,
        totalHeatingLoad,
        sensibleCoolingLoad: Math.round(sensibleCoolingLoad),
        latentLoad: Math.round(latentLoad),
        calculatedTonnage: coolingTonnage.toFixed(2),
        recommendedTonnage,
        totalSqFt,
        buildingVolume: Math.round(buildingVolume),
        effectiveACH: effectiveACH.toFixed(2),
        ductLossFactor: ((ductLossFactor - 1) * 100).toFixed(1),
        roomLoads,
        loadBreakdown,
        // Equipment recommendations
        equipmentOptions: [
          { tons: recommendedTonnage, label: 'Standard Efficiency', seer: 14, hspf: 8.2, brand: 'Carrier/Bryant', note: 'Minimum code (2023 SEER2)' },
          { tons: recommendedTonnage, label: 'High Efficiency', seer: 16, hspf: 9.0, brand: 'Carrier Infinity', note: 'Good rebate potential' },
          { tons: recommendedTonnage, label: 'Premium', seer: 20, hspf: 10, brand: 'Carrier Greenspeed', note: 'Variable speed, best comfort' },
        ],
        timestamp: new Date().toLocaleString(),
      });
      
      setIsCalculating(false);
      setActiveTab('results');
    }, 2000);
  };

  // Styles
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const sectionStyle = {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const sectionTitleStyle = {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#D4AF37',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const tabs = [
    { id: 'draw', label: 'Draw', icon: '✏️' },
    { id: 'project', label: 'Project', icon: '📋' },
    { id: 'envelope', label: 'Envelope', icon: '🏠' },
    { id: 'windows', label: 'Windows', icon: '🪟' },
    { id: 'infiltration', label: 'Infiltration', icon: '💨' },
    { id: 'ducts', label: 'Ducts', icon: '🔧' },
    { id: 'internal', label: 'Internal', icon: '⚡' },
    { id: 'ventilation', label: 'Ventilation', icon: '🌀' },
    { id: 'rooms', label: 'Rooms', icon: '🚪' },
    { id: 'results', label: 'Results', icon: '📊' },
  ];

  if (drawFullScreen) {
    return (
      <DrawScreen
        formData={formData}
        setFormData={setFormData}
        onBack={() => setDrawFullScreen(false)}
        isFullScreen={true}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2634 0%, #2B3E50 50%, #1a2634 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff',
      padding: '16px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #D4AF37'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: '#E31937',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 4px 12px rgba(227, 25, 55, 0.4)'
          }}>
            C
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Manual J Load Calculator</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#D4AF37' }}>ACCA Manual J8 Methodology</p>
          </div>
        </div>
        <div style={{
          background: 'rgba(212, 175, 55, 0.15)',
          border: '1px solid #D4AF37',
          borderRadius: '16px',
          padding: '4px 12px',
          fontSize: '10px',
          color: '#D4AF37',
          fontWeight: '600'
        }}>
          PRO
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', justifyContent: 'flex-end' }}>
        <button onClick={() => setShowSaveModal(true)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>💾 Save</button>
        <button onClick={() => { setSavedProjects(JSON.parse(localStorage.getItem('cooper-jload-projects') || '[]')); setShowLoadModal(true); }} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>📂 Load</button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 12px',
              background: activeTab === tab.id ? '#E31937' : 'rgba(255,255,255,0.06)',
              border: activeTab === tab.id ? '1px solid #E31937' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '10px',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto',
      }}>

        {/* === DRAW TAB === */}
        {activeTab === 'draw' && (
          <div style={{ margin: '-20px', height: 'calc(100vh - 180px)' }}>
            <DrawScreen
              formData={formData}
              setFormData={setFormData}
              onBack={() => setActiveTab('rooms')}
              isFullScreen={false}
            />
            <button
              onClick={() => setDrawFullScreen(true)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', zIndex: 10,
              }}
            >⛶ Full Screen</button>
          </div>
        )}

        {/* === PROJECT TAB === */}
        {activeTab === 'project' && (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>📋 Project Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Project Name</label>
                  <input
                    type="text"
                    value={formData.project.name}
                    onChange={(e) => updateNested('project', 'name', e.target.value)}
                    placeholder="e.g., Smith Residence"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Customer Name</label>
                  <input
                    type="text"
                    value={formData.project.customerName}
                    onChange={(e) => updateNested('project', 'customerName', e.target.value)}
                    placeholder="e.g., John Smith"
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Address</label>
                  <input
                    type="text"
                    value={formData.project.address}
                    onChange={(e) => updateNested('project', 'address', e.target.value)}
                    placeholder="123 Ocean Blvd"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    type="text"
                    value={formData.project.city}
                    onChange={(e) => updateNested('project', 'city', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input
                      type="text"
                      value={formData.project.state}
                      onChange={(e) => updateNested('project', 'state', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP</label>
                    <input
                      type="text"
                      value={formData.project.zip}
                      onChange={(e) => updateNested('project', 'zip', e.target.value)}
                      style={inputStyle}
                    />
                    <button onClick={() => lookupClimate(formData.project.zip)} style={{ marginTop: '4px', padding: '4px 10px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px', color: '#D4AF37', cursor: 'pointer', fontSize: '10px' }}>🌡️ Auto-fill climate data</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🌡️ Climate & Design Conditions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Climate Zone</label>
                  <select
                    value={formData.project.climateZone}
                    onChange={(e) => updateNested('project', 'climateZone', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="1A">1A - Very Hot Humid</option>
                    <option value="2A">2A - Hot Humid</option>
                    <option value="3A">3A - Warm Humid (Myrtle Beach)</option>
                    <option value="3B">3B - Warm Dry</option>
                    <option value="4A">4A - Mixed Humid</option>
                    <option value="4B">4B - Mixed Dry</option>
                    <option value="5A">5A - Cool Humid</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Latitude</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.project.latitude}
                    onChange={(e) => updateNested('project', 'latitude', parseFloat(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Elevation (ft)</label>
                  <input
                    type="number"
                    value={formData.project.elevation}
                    onChange={(e) => updateNested('project', 'elevation', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Outdoor Design Cooling (°F)</label>
                  <input
                    type="number"
                    value={formData.project.designCoolingTemp}
                    onChange={(e) => updateNested('project', 'designCoolingTemp', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Outdoor Design Heating (°F)</label>
                  <input
                    type="number"
                    value={formData.project.designHeatingTemp}
                    onChange={(e) => updateNested('project', 'designHeatingTemp', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Outdoor Humidity (%)</label>
                  <input
                    type="number"
                    value={formData.project.coolingHumidity}
                    onChange={(e) => updateNested('project', 'coolingHumidity', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Indoor Cooling Setpoint (°F)</label>
                  <input
                    type="number"
                    value={formData.project.indoorCoolingTemp}
                    onChange={(e) => updateNested('project', 'indoorCoolingTemp', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Indoor Heating Setpoint (°F)</label>
                  <input
                    type="number"
                    value={formData.project.indoorHeatingTemp}
                    onChange={(e) => updateNested('project', 'indoorHeatingTemp', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === ENVELOPE TAB === */}
        {activeTab === 'envelope' && (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🧱 Wall Construction</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Wall Type</label>
                  <select
                    value={formData.envelope.walls.type}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'type', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="2x4">2x4 Wood Frame</option>
                    <option value="2x6">2x6 Wood Frame</option>
                    <option value="block">Concrete Block</option>
                    <option value="icf">ICF</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Stud Spacing</label>
                  <select
                    value={formData.envelope.walls.studSpacing}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'studSpacing', parseInt(e.target.value))}
                    style={selectStyle}
                  >
                    <option value={16}>16" O.C.</option>
                    <option value={24}>24" O.C.</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Exterior Finish</label>
                  <select
                    value={formData.envelope.walls.exteriorFinish}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'exteriorFinish', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="vinyl">Vinyl Siding</option>
                    <option value="brick">Brick Veneer</option>
                    <option value="stucco">Stucco</option>
                    <option value="wood">Wood Siding</option>
                    <option value="hardie">Fiber Cement (Hardie)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sheathing</label>
                  <select
                    value={formData.envelope.walls.sheathing}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'sheathing', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="osb">OSB</option>
                    <option value="plywood">Plywood</option>
                    <option value="foam">Foam Sheathing</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cavity Insulation</label>
                  <select
                    value={formData.envelope.walls.cavityInsulation}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'cavityInsulation', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="fiberglass">Fiberglass Batt</option>
                    <option value="cellulose">Blown Cellulose</option>
                    <option value="spray-foam-open">Open-Cell Spray Foam</option>
                    <option value="spray-foam-closed">Closed-Cell Spray Foam</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cavity R-Value</label>
                  <input
                    type="number"
                    value={formData.envelope.walls.cavityR}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'cavityR', parseFloat(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Continuous Insulation?</label>
                  <select
                    value={formData.envelope.walls.continuousInsulation ? 'yes' : 'no'}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'continuousInsulation', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {formData.envelope.walls.continuousInsulation && (
                  <div>
                    <label style={labelStyle}>Continuous R-Value</label>
                    <input
                      type="number"
                      value={formData.envelope.walls.continuousR}
                      onChange={(e) => updateDeepNested('envelope', 'walls', 'continuousR', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Wall Color</label>
                  <select
                    value={formData.envelope.walls.wallColor}
                    onChange={(e) => updateDeepNested('envelope', 'walls', 'wallColor', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🏠 Roof / Ceiling</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Roof Type</label>
                  <select
                    value={formData.envelope.roof.type}
                    onChange={(e) => updateDeepNested('envelope', 'roof', 'type', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="asphalt-shingle">Asphalt Shingle</option>
                    <option value="metal">Metal</option>
                    <option value="tile">Tile</option>
                    <option value="flat">Flat/Built-Up</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Roof Color</label>
                  <select
                    value={formData.envelope.roof.color}
                    onChange={(e) => updateDeepNested('envelope', 'roof', 'color', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Radiant Barrier?</label>
                  <select
                    value={formData.envelope.roof.radiantBarrier ? 'yes' : 'no'}
                    onChange={(e) => updateDeepNested('envelope', 'roof', 'radiantBarrier', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Attic Type</label>
                  <select
                    value={formData.envelope.roof.atticType}
                    onChange={(e) => updateDeepNested('envelope', 'roof', 'atticType', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="vented">Vented Attic</option>
                    <option value="unvented">Unvented (Sealed) Attic</option>
                    <option value="cathedral">Cathedral Ceiling</option>
                    <option value="flat">Flat Roof</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ceiling Insulation Type</label>
                  <select
                    value={formData.envelope.roof.ceilingInsulationType}
                    onChange={(e) => updateDeepNested('envelope', 'roof', 'ceilingInsulationType', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="blown">Blown-In</option>
                    <option value="batt">Batt</option>
                    <option value="spray-foam">Spray Foam</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ceiling R-Value</label>
                  <input
                    type="number"
                    value={formData.envelope.roof.ceilingR}
                    onChange={(e) => updateDeepNested('envelope', 'roof', 'ceilingR', parseFloat(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🪵 Floor / Foundation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Floor Type</label>
                  <select
                    value={formData.envelope.floor.type}
                    onChange={(e) => updateDeepNested('envelope', 'floor', 'type', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="slab">Slab on Grade</option>
                    <option value="crawl-vented">Vented Crawl Space</option>
                    <option value="crawl-sealed">Sealed Crawl Space</option>
                    <option value="basement-conditioned">Conditioned Basement</option>
                    <option value="basement-unconditioned">Unconditioned Basement</option>
                    <option value="over-garage">Over Garage</option>
                  </select>
                </div>
                {formData.envelope.floor.type === 'slab' && (
                  <>
                    <div>
                      <label style={labelStyle}>Slab Edge Insulation?</label>
                      <select
                        value={formData.envelope.floor.slabEdgeInsulation ? 'yes' : 'no'}
                        onChange={(e) => updateDeepNested('envelope', 'floor', 'slabEdgeInsulation', e.target.value === 'yes')}
                        style={selectStyle}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {formData.envelope.floor.slabEdgeInsulation && (
                      <div>
                        <label style={labelStyle}>Slab Edge R-Value</label>
                        <input
                          type="number"
                          value={formData.envelope.floor.slabEdgeR}
                          onChange={(e) => updateDeepNested('envelope', 'floor', 'slabEdgeR', parseFloat(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                    )}
                  </>
                )}
                {formData.envelope.floor.type.includes('crawl') && (
                  <div>
                    <label style={labelStyle}>Floor Insulation R-Value</label>
                    <input
                      type="number"
                      value={formData.envelope.floor.floorInsulationR}
                      onChange={(e) => updateDeepNested('envelope', 'floor', 'floorInsulationR', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ ...sectionTitleStyle, margin: 0 }}>🚪 Doors</h3>
                <button
                  onClick={addDoor}
                  style={{
                    padding: '6px 12px',
                    background: '#E31937',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  + Add Door
                </button>
              </div>
              {formData.envelope.doors.map(door => (
                <div key={door.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', 
                  gap: '8px', 
                  alignItems: 'end',
                  marginBottom: '8px',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '6px',
                }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select
                      value={door.type}
                      onChange={(e) => updateDoor(door.id, 'type', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="solid-wood">Solid Wood</option>
                      <option value="solid-insulated">Solid Insulated</option>
                      <option value="half-glass">Half Glass</option>
                      <option value="full-glass">Full Glass</option>
                      <option value="sliding-glass">Sliding Glass</option>
                      <option value="french">French Doors</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Width (in)</label>
                    <input
                      type="number"
                      value={door.width}
                      onChange={(e) => updateDoor(door.id, 'width', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Height (in)</label>
                    <input
                      type="number"
                      value={door.height}
                      onChange={(e) => updateDoor(door.id, 'height', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Qty</label>
                    <input
                      type="number"
                      value={door.quantity}
                      onChange={(e) => updateDoor(door.id, 'quantity', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>U-Factor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={door.uFactor}
                      onChange={(e) => updateDoor(door.id, 'uFactor', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Storm?</label>
                    <select
                      value={door.storm ? 'yes' : 'no'}
                      onChange={(e) => updateDoor(door.id, 'storm', e.target.value === 'yes')}
                      style={selectStyle}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeDoor(door.id)}
                    disabled={formData.envelope.doors.length <= 1}
                    style={{
                      padding: '8px',
                      background: 'rgba(227, 25, 55, 0.2)',
                      border: '1px solid rgba(227, 25, 55, 0.4)',
                      borderRadius: '4px',
                      color: '#E31937',
                      cursor: formData.envelope.doors.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: formData.envelope.doors.length <= 1 ? 0.4 : 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === WINDOWS TAB === */}
        {activeTab === 'windows' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#D4AF37' }}>🪟 Window Schedule</h3>
              <button
                onClick={addWindow}
                style={{
                  padding: '8px 16px',
                  background: '#E31937',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                + Add Window
              </button>
            </div>

            {formData.windows.map(window => (
              <div key={window.id} style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={window.name}
                    onChange={(e) => updateWindow(window.id, 'name', e.target.value)}
                    style={{ 
                      ...inputStyle, 
                      width: 'auto', 
                      background: 'transparent', 
                      border: 'none', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#D4AF37',
                      padding: '4px 0',
                    }}
                  />
                  <button
                    onClick={() => removeWindow(window.id)}
                    disabled={formData.windows.length <= 1}
                    style={{
                      padding: '6px 10px',
                      background: 'rgba(227, 25, 55, 0.2)',
                      border: '1px solid rgba(227, 25, 55, 0.4)',
                      borderRadius: '4px',
                      color: '#E31937',
                      cursor: formData.windows.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: formData.windows.length <= 1 ? 0.4 : 1,
                      fontSize: '11px',
                    }}
                  >
                    Remove
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Width (in)</label>
                    <input
                      type="number"
                      value={window.width}
                      onChange={(e) => updateWindow(window.id, 'width', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Height (in)</label>
                    <input
                      type="number"
                      value={window.height}
                      onChange={(e) => updateWindow(window.id, 'height', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Quantity</label>
                    <input
                      type="number"
                      value={window.quantity}
                      onChange={(e) => updateWindow(window.id, 'quantity', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Exposure</label>
                    <select
                      value={window.exposure}
                      onChange={(e) => updateWindow(window.id, 'exposure', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="Northeast">Northeast</option>
                      <option value="Northwest">Northwest</option>
                      <option value="Southeast">Southeast</option>
                      <option value="Southwest">Southwest</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Frame Type</label>
                    <select
                      value={window.frameType}
                      onChange={(e) => updateWindow(window.id, 'frameType', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="vinyl">Vinyl</option>
                      <option value="wood">Wood</option>
                      <option value="aluminum">Aluminum</option>
                      <option value="aluminum-break">Aluminum w/ Break</option>
                      <option value="fiberglass">Fiberglass</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Glass Type</label>
                    <select
                      value={window.glassType}
                      onChange={(e) => updateWindow(window.id, 'glassType', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="single">Single Pane</option>
                      <option value="double">Double Pane</option>
                      <option value="double-low-e">Double Low-E</option>
                      <option value="triple">Triple Pane</option>
                      <option value="triple-low-e">Triple Low-E</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Gas Fill</label>
                    <select
                      value={window.gasType}
                      onChange={(e) => updateWindow(window.id, 'gasType', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="air">Air</option>
                      <option value="argon">Argon</option>
                      <option value="krypton">Krypton</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>U-Factor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={window.uFactor}
                      onChange={(e) => updateWindow(window.id, 'uFactor', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>SHGC</label>
                    <input
                      type="number"
                      step="0.01"
                      value={window.shgc}
                      onChange={(e) => updateWindow(window.id, 'shgc', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Overhang Depth (in)</label>
                    <input
                      type="number"
                      value={window.overhangDepth}
                      onChange={(e) => updateWindow(window.id, 'overhangDepth', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Overhang Distance (in)</label>
                    <input
                      type="number"
                      value={window.overhangDistance}
                      onChange={(e) => updateWindow(window.id, 'overhangDistance', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Interior Shading</label>
                    <select
                      value={window.interiorShading}
                      onChange={(e) => updateWindow(window.id, 'interiorShading', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="none">None</option>
                      <option value="blinds">Blinds</option>
                      <option value="drapes-light">Light Drapes</option>
                      <option value="drapes-medium">Medium Drapes</option>
                      <option value="drapes-dark">Dark Drapes</option>
                      <option value="cellular">Cellular Shades</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Exterior Shading</label>
                    <select
                      value={window.exteriorShading}
                      onChange={(e) => updateWindow(window.id, 'exteriorShading', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="none">None</option>
                      <option value="awning">Awning</option>
                      <option value="screen">Solar Screen</option>
                      <option value="trees-deciduous">Deciduous Trees</option>
                      <option value="trees-evergreen">Evergreen Trees</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === INFILTRATION TAB === */}
        {activeTab === 'infiltration' && (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>💨 Air Infiltration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Measurement Method</label>
                  <select
                    value={formData.infiltration.method}
                    onChange={(e) => updateNested('infiltration', 'method', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="estimate">Estimate (Construction Quality)</option>
                    <option value="blower-door">Blower Door Test</option>
                  </select>
                </div>
                {formData.infiltration.method === 'blower-door' ? (
                  <div>
                    <label style={labelStyle}>ACH50 (Blower Door Result)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.infiltration.ach50 || ''}
                      onChange={(e) => updateNested('infiltration', 'ach50', parseFloat(e.target.value))}
                      placeholder="e.g., 5.0"
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>Construction Quality</label>
                    <select
                      value={formData.infiltration.constructionQuality}
                      onChange={(e) => updateNested('infiltration', 'constructionQuality', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="tight">Tight (Energy Star, Sealed)</option>
                      <option value="average">Average (Standard New Construction)</option>
                      <option value="leaky">Leaky (Older Construction)</option>
                      <option value="very-leaky">Very Leaky (Pre-1980)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🔥 Fireplace</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Has Fireplace?</label>
                  <select
                    value={formData.infiltration.hasFireplace ? 'yes' : 'no'}
                    onChange={(e) => updateNested('infiltration', 'hasFireplace', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {formData.infiltration.hasFireplace && (
                  <div>
                    <label style={labelStyle}>Fireplace Type</label>
                    <select
                      value={formData.infiltration.fireplaceType}
                      onChange={(e) => updateNested('infiltration', 'fireplaceType', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="masonry-damper">Masonry w/ Damper</option>
                      <option value="masonry-glass">Masonry w/ Glass Doors</option>
                      <option value="prefab-sealed">Prefab Sealed</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🌀 Exhaust Fans</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Bathroom Exhaust Fans</label>
                  <input
                    type="number"
                    value={formData.infiltration.numBathroomExhaust}
                    onChange={(e) => updateNested('infiltration', 'numBathroomExhaust', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kitchen Exhaust Fans</label>
                  <input
                    type="number"
                    value={formData.infiltration.numKitchenExhaust}
                    onChange={(e) => updateNested('infiltration', 'numKitchenExhaust', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Dryer Vented Outside?</label>
                  <select
                    value={formData.infiltration.dryerVented ? 'yes' : 'no'}
                    onChange={(e) => updateNested('infiltration', 'dryerVented', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === DUCTS TAB === */}
        {activeTab === 'ducts' && (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🔧 Duct System</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>System Type</label>
                  <select
                    value={formData.ducts.systemType}
                    onChange={(e) => updateNested('ducts', 'systemType', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="forced-air">Forced Air (Ducted)</option>
                    <option value="mini-split">Mini-Split (Ductless)</option>
                    <option value="radiant">Radiant</option>
                  </select>
                </div>
                {formData.ducts.systemType === 'forced-air' && (
                  <>
                    <div>
                      <label style={labelStyle}>Supply Duct Location</label>
                      <select
                        value={formData.ducts.supplyLocation}
                        onChange={(e) => updateNested('ducts', 'supplyLocation', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="conditioned">Conditioned Space</option>
                        <option value="attic">Unconditioned Attic</option>
                        <option value="crawl">Crawl Space</option>
                        <option value="garage">Garage</option>
                        <option value="basement">Basement</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Return Duct Location</label>
                      <select
                        value={formData.ducts.returnLocation}
                        onChange={(e) => updateNested('ducts', 'returnLocation', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="conditioned">Conditioned Space</option>
                        <option value="attic">Unconditioned Attic</option>
                        <option value="crawl">Crawl Space</option>
                        <option value="garage">Garage</option>
                        <option value="basement">Basement</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Supply Insulation R-Value</label>
                      <input
                        type="number"
                        value={formData.ducts.supplyInsulationR}
                        onChange={(e) => updateNested('ducts', 'supplyInsulationR', parseFloat(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Return Insulation R-Value</label>
                      <input
                        type="number"
                        value={formData.ducts.returnInsulationR}
                        onChange={(e) => updateNested('ducts', 'returnInsulationR', parseFloat(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Duct Sealing</label>
                      <select
                        value={formData.ducts.ductSealingClass}
                        onChange={(e) => updateNested('ducts', 'ductSealingClass', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="unsealed">Unsealed</option>
                        <option value="taped">Taped Only</option>
                        <option value="sealed-mastic">Mastic Sealed</option>
                        <option value="spray-sealed">Aeroseal / Spray Sealed</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Supply Linear Feet</label>
                      <input
                        type="number"
                        value={formData.ducts.supplyLinearFeet}
                        onChange={(e) => updateNested('ducts', 'supplyLinearFeet', parseInt(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Return Linear Feet</label>
                      <input
                        type="number"
                        value={formData.ducts.returnLinearFeet}
                        onChange={(e) => updateNested('ducts', 'returnLinearFeet', parseInt(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Number of Supply Runs</label>
                      <input
                        type="number"
                        value={formData.ducts.numSupplyRuns}
                        onChange={(e) => updateNested('ducts', 'numSupplyRuns', parseInt(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Number of Return Runs</label>
                      <input
                        type="number"
                        value={formData.ducts.numReturnRuns}
                        onChange={(e) => updateNested('ducts', 'numReturnRuns', parseInt(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === INTERNAL LOADS TAB === */}
        {activeTab === 'internal' && (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>👥 Occupants</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Number of Occupants</label>
                  <input
                    type="number"
                    value={formData.internalLoads.numOccupants}
                    onChange={(e) => updateNested('internalLoads', 'numOccupants', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Activity Level</label>
                  <select
                    value={formData.internalLoads.occupantActivityLevel}
                    onChange={(e) => updateNested('internalLoads', 'occupantActivityLevel', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="normal">Normal</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🍳 Appliances</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Refrigerators</label>
                  <input
                    type="number"
                    value={formData.internalLoads.numRefrigerators}
                    onChange={(e) => updateNested('internalLoads', 'numRefrigerators', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Range/Oven</label>
                  <input
                    type="number"
                    value={formData.internalLoads.numRangeOven}
                    onChange={(e) => updateNested('internalLoads', 'numRangeOven', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Range Type</label>
                  <select
                    value={formData.internalLoads.rangeType}
                    onChange={(e) => updateNested('internalLoads', 'rangeType', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="electric">Electric</option>
                    <option value="gas">Gas</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Dishwashers</label>
                  <input
                    type="number"
                    value={formData.internalLoads.numDishwasher}
                    onChange={(e) => updateNested('internalLoads', 'numDishwasher', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Clothes Dryers</label>
                  <input
                    type="number"
                    value={formData.internalLoads.numClothesDryer}
                    onChange={(e) => updateNested('internalLoads', 'numClothesDryer', parseInt(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Dryer Type</label>
                  <select
                    value={formData.internalLoads.dryerType}
                    onChange={(e) => updateNested('internalLoads', 'dryerType', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="electric">Electric</option>
                    <option value="gas">Gas</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>💡 Lighting & Plug Loads</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Lighting Type</label>
                  <select
                    value={formData.internalLoads.lightingType}
                    onChange={(e) => updateNested('internalLoads', 'lightingType', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="led">All LED</option>
                    <option value="cfl">CFL</option>
                    <option value="mixed">Mixed</option>
                    <option value="incandescent">Incandescent</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Lighting W/SF</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.internalLoads.lightingWattsPerSqFt}
                    onChange={(e) => updateNested('internalLoads', 'lightingWattsPerSqFt', parseFloat(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Misc Plug Loads</label>
                  <select
                    value={formData.internalLoads.miscPlugLoads}
                    onChange={(e) => updateNested('internalLoads', 'miscPlugLoads', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="low">Low</option>
                    <option value="average">Average</option>
                    <option value="high">High (Home Office, Gaming)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Home Office Equipment?</label>
                  <select
                    value={formData.internalLoads.homeOfficeEquipment ? 'yes' : 'no'}
                    onChange={(e) => updateNested('internalLoads', 'homeOfficeEquipment', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Aquarium?</label>
                  <select
                    value={formData.internalLoads.aquarium ? 'yes' : 'no'}
                    onChange={(e) => updateNested('internalLoads', 'aquarium', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Indoor Hot Tub?</label>
                  <select
                    value={formData.internalLoads.hotTubIndoor ? 'yes' : 'no'}
                    onChange={(e) => updateNested('internalLoads', 'hotTubIndoor', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === VENTILATION TAB === */}
        {activeTab === 'ventilation' && (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>🌀 Mechanical Ventilation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Ventilation Method</label>
                  <select
                    value={formData.ventilation.method}
                    onChange={(e) => updateNested('ventilation', 'method', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="none">None</option>
                    <option value="exhaust-only">Exhaust Only</option>
                    <option value="supply-only">Supply Only</option>
                    <option value="balanced">Balanced</option>
                    <option value="erv">ERV (Energy Recovery)</option>
                    <option value="hrv">HRV (Heat Recovery)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ASHRAE 62.2 Compliant?</label>
                  <select
                    value={formData.ventilation.ashrae622Compliant ? 'yes' : 'no'}
                    onChange={(e) => updateNested('ventilation', 'ashrae622Compliant', e.target.value === 'yes')}
                    style={selectStyle}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {(formData.ventilation.method === 'erv' || formData.ventilation.method === 'hrv') && (
                  <div>
                    <label style={labelStyle}>
                      {formData.ventilation.method === 'erv' ? 'ERV' : 'HRV'} Efficiency (%)
                    </label>
                    <input
                      type="number"
                      value={formData.ventilation.method === 'erv' ? formData.ventilation.ervEfficiency : formData.ventilation.hrvEfficiency}
                      onChange={(e) => updateNested('ventilation', formData.ventilation.method === 'erv' ? 'ervEfficiency' : 'hrvEfficiency', parseInt(e.target.value))}
                      placeholder="e.g., 75"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              padding: '16px', 
              background: 'rgba(212, 175, 55, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#D4AF37' }}>
                💡 <strong>ASHRAE 62.2:</strong> Required ventilation = 0.03 × floor area + 7.5 × (# bedrooms + 1). 
                This will be calculated automatically based on room data.
              </p>
            </div>
          </div>
        )}

        {/* === ROOMS TAB === */}
        {activeTab === 'rooms' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#D4AF37' }}>🚪 Room-by-Room Details</h3>
              <button
                onClick={addRoom}
                style={{
                  padding: '8px 16px',
                  background: '#E31937',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                + Add Room
              </button>
            </div>

            {formData.rooms.map(room => (
              <div key={room.id} style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                    style={{ 
                      ...inputStyle, 
                      width: 'auto', 
                      background: 'transparent', 
                      border: 'none', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#D4AF37',
                      padding: '4px 0',
                    }}
                  />
                  <button
                    onClick={() => removeRoom(room.id)}
                    disabled={formData.rooms.length <= 1}
                    style={{
                      padding: '6px 10px',
                      background: 'rgba(227, 25, 55, 0.2)',
                      border: '1px solid rgba(227, 25, 55, 0.4)',
                      borderRadius: '4px',
                      color: '#E31937',
                      cursor: formData.rooms.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: formData.rooms.length <= 1 ? 0.4 : 1,
                      fontSize: '11px',
                    }}
                  >
                    Remove
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Square Feet</label>
                    <input
                      type="number"
                      value={room.sqft}
                      onChange={(e) => updateRoom(room.id, 'sqft', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ceiling Height (ft)</label>
                    <input
                      type="number"
                      value={room.ceilingHeight}
                      onChange={(e) => updateRoom(room.id, 'ceilingHeight', parseInt(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Floor Level</label>
                    <select
                      value={room.floor}
                      onChange={(e) => updateRoom(room.id, 'floor', parseInt(e.target.value))}
                      style={selectStyle}
                    >
                      <option value={1}>1st Floor</option>
                      <option value={2}>2nd Floor</option>
                      <option value={3}>3rd Floor</option>
                      <option value={0}>Basement</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Above Grade?</label>
                    <select
                      value={room.aboveGrade ? 'yes' : 'no'}
                      onChange={(e) => updateRoom(room.id, 'aboveGrade', e.target.value === 'yes')}
                      style={selectStyle}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No (Below Grade)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Partition to Unconditioned?</label>
                    <select
                      value={room.partitionToUnconditioned ? 'yes' : 'no'}
                      onChange={(e) => updateRoom(room.id, 'partitionToUnconditioned', e.target.value === 'yes')}
                      style={selectStyle}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  {room.partitionToUnconditioned && (
                    <div>
                      <label style={labelStyle}>Partition SF</label>
                      <input
                        type="number"
                        value={room.partitionSqFt}
                        onChange={(e) => updateRoom(room.id, 'partitionSqFt', parseInt(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              background: 'rgba(43, 62, 80, 0.5)', 
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Total Conditioned Space:</span>
              <span style={{ color: '#D4AF37', fontWeight: '600', fontSize: '13px' }}>
                {formData.rooms.reduce((sum, r) => sum + Number(r.sqft), 0).toLocaleString()} sq ft
              </span>
            </div>
          </div>
        )}

        {/* === RESULTS TAB === */}
        {activeTab === 'results' && (
          <div>
            {!results ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>
                  Complete all input tabs, then calculate your load.
                </p>
                <button
                  onClick={calculateLoad}
                  disabled={isCalculating}
                  style={{
                    padding: '14px 32px',
                    background: isCalculating ? 'rgba(227, 25, 55, 0.5)' : 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: isCalculating ? 'wait' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: '0 4px 16px rgba(227, 25, 55, 0.4)',
                  }}
                >
                  {isCalculating ? '⏳ Calculating...' : '🔥 Calculate Load'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', color: '#D4AF37' }}>Manual J Load Results</h2>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{results.timestamp}</span>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{results.recommendedTonnage}</div>
                    <div style={{ fontSize: '10px', opacity: 0.9, textTransform: 'uppercase' }}>Recommended Tons</div>
                  </div>
                  <div style={{
                    background: 'rgba(43, 62, 80, 0.8)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid rgba(212, 175, 55, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#D4AF37' }}>{results.totalCoolingLoad.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Total Cooling BTU/hr</div>
                  </div>
                  <div style={{
                    background: 'rgba(43, 62, 80, 0.8)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{results.totalHeatingLoad.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Total Heating BTU/hr</div>
                  </div>
                  <div style={{
                    background: 'rgba(43, 62, 80, 0.8)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{results.totalSqFt.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Total Sq Ft</div>
                  </div>
                </div>

                {/* Load Breakdown */}
                <div style={sectionStyle}>
                  <h3 style={sectionTitleStyle}>📉 Cooling Load Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(results.loadBreakdown).map(([key, value]) => (
                      <div key={key} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                          {value.toLocaleString()} BTU
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '12px',
                    padding: '10px 12px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    borderRadius: '4px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                  }}>
                    <span style={{ color: '#D4AF37', fontSize: '12px', fontWeight: '600' }}>Sensible + Latent Total</span>
                    <span style={{ color: '#D4AF37', fontSize: '12px', fontWeight: '600' }}>
                      {results.totalCoolingLoad.toLocaleString()} BTU/hr
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ ...sectionStyle, marginBottom: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#D4AF37' }}>{results.effectiveACH}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Effective ACH</div>
                  </div>
                  <div style={{ ...sectionStyle, marginBottom: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#D4AF37' }}>{results.ductLossFactor}%</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Duct Loss Factor</div>
                  </div>
                  <div style={{ ...sectionStyle, marginBottom: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#D4AF37' }}>{results.buildingVolume.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Building Cu Ft</div>
                  </div>
                </div>

                {/* Room Breakdown */}
                <div style={sectionStyle}>
                  <h3 style={sectionTitleStyle}>🚪 Room-by-Room Results</h3>
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(43, 62, 80, 0.8)' }}>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#D4AF37' }}>Room</th>
                          <th style={{ padding: '10px', textAlign: 'right', color: '#D4AF37' }}>Sq Ft</th>
                          <th style={{ padding: '10px', textAlign: 'right', color: '#D4AF37' }}>Cooling</th>
                          <th style={{ padding: '10px', textAlign: 'right', color: '#D4AF37' }}>Heating</th>
                          <th style={{ padding: '10px', textAlign: 'right', color: '#D4AF37' }}>CFM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.roomLoads.map((room) => (
                          <tr key={room.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px' }}>{room.name}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{Number(room.sqft).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{room.coolingBtu.toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{room.heatingBtu.toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{room.cfm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {results.equipmentOptions && (
                  <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>🏗️ Equipment Sizing Recommendations</h3>
                    {results.equipmentOptions.map((eq, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: i === 0 ? 'rgba(227,25,55,0.08)' : 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '6px', border: i === 0 ? '1px solid rgba(227,25,55,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: i === 0 ? '#E31937' : '#fff' }}>{eq.label} — {eq.tons} Ton</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{eq.brand} · {eq.note}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#D4AF37', fontWeight: '600' }}>{eq.seer} SEER</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{eq.hspf} HSPF</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={exportPDF} style={{
                    flex: 1,
                    padding: '12px',
                    background: '#E31937',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    📄 Export PDF Report
                  </button>
                  <button style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    📋 Copy to Proposal
                  </button>
                  <button 
                    onClick={() => { setResults(null); setActiveTab('project'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                  }}>
                    🔄 New Calculation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Calculate Button (fixed at bottom when not on results) */}
      {activeTab !== 'results' && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={calculateLoad}
            disabled={isCalculating}
            style={{
              width: '100%',
              padding: '14px',
              background: isCalculating ? 'rgba(227, 25, 55, 0.5)' : 'linear-gradient(135deg, #E31937 0%, #b8142c 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: isCalculating ? 'wait' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 16px rgba(227, 25, 55, 0.4)',
            }}
          >
            {isCalculating ? '⏳ Calculating...' : '🔥 Calculate Load'}
          </button>
        </div>
      )}

      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSaveModal(false)}>
          <div style={{ background: '#1a2332', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#D4AF37', margin: '0 0 16px', fontSize: '16px' }}>💾 Save Project</h3>
            <input id="save-name" defaultValue={formData.project.name || formData.project.customerName || ''} placeholder="Project name..." style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} autoFocus />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { const name = document.getElementById('save-name')?.value; if (name) saveProject(name); }} style={{ flex: 1, padding: '10px', background: '#E31937', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
              <button onClick={() => setShowSaveModal(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showLoadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLoadModal(false)}>
          <div style={{ background: '#1a2332', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '70vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#D4AF37', margin: '0 0 16px', fontSize: '16px' }}>📂 Load Project</h3>
            {savedProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>No saved projects yet</div>
            ) : savedProjects.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => loadProject(p)}>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{new Date(p.savedAt).toLocaleString()}</div>
                </div>
                <button onClick={() => deleteProject(p.name)} style={{ padding: '4px 8px', background: 'rgba(227,25,55,0.15)', border: 'none', borderRadius: '4px', color: '#E31937', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => setShowLoadModal(false)} style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Close</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        textAlign: 'center',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.3)'
      }}>
        Cooper Mechanical Services • Manual J8 Load Calculator • For estimation purposes — verify with certified software for permit submission
      </div>
    </div>
  );
};

export default CooperJLoadCalculatorPro;
