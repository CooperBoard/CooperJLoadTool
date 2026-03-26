import React, { useState } from 'react';

const CooperJLoadCalculatorPro = () => {
  const [activeTab, setActiveTab] = useState('project');
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);
  
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

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button style={{
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
