# Cooper J-Load Draw Screen Integration Guide

## Overview
Add a Wrightsoft-style draw screen to the J-Load Calculator with Hotlink sync.
The draw screen is a separate component (`draw-screen.jsx`) that receives `formData` and `setFormData` as props.
When users draw rooms, add windows, or place doors on the canvas, the data auto-syncs into the calculator's state.

## Files
- `components/jload-calculator.jsx` — existing calculator (modify)
- `components/draw-screen.jsx` — NEW draw screen component (add this file)

## Integration Steps

### 1. Add `draw-screen.jsx` to `components/`
Copy the provided `draw-screen.jsx` file into the `components/` directory alongside `jload-calculator.jsx`.

### 2. Import DrawScreen in jload-calculator.jsx
At the top of `jload-calculator.jsx`, add:
```jsx
import DrawScreen from './draw-screen';
```

### 3. Add "Draw" tab to the tabs array (line ~556)
Find the `tabs` array and add a Draw tab as the FIRST item:
```jsx
const tabs = [
  { id: 'draw', label: 'Draw', icon: '✏️' },
  { id: 'project', label: 'Project', icon: '📋' },
  { id: 'envelope', label: 'Envelope', icon: '🏠' },
  // ... rest stays the same
];
```

### 4. Add state for full-screen draw mode
After the existing state declarations (~line 7), add:
```jsx
const [drawFullScreen, setDrawFullScreen] = useState(false);
```

### 5. Add the Draw tab content in the Content Area
Find the `{/* Content Area */}` section (~line 652). Right after the opening div and before `{/* === PROJECT TAB === */}`, add:

```jsx
{/* === DRAW TAB === */}
{activeTab === 'draw' && (
  <div style={{ margin: '-20px', height: 'calc(100vh - 180px)' }}>
    <DrawScreen
      formData={formData}
      setFormData={setFormData}
      onBack={() => setActiveTab('rooms')}
      isFullScreen={false}
    />
  </div>
)}
```

### 6. (Optional) Add full-screen draw mode
If you want a full-screen toggle, add this before the main return:
```jsx
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
```

And add a full-screen button somewhere in the draw tab:
```jsx
<button onClick={() => setDrawFullScreen(true)}>⛶ Full Screen</button>
```

## How the Sync Works

### One-way auto-sync (Draw → Calculator)
When the user draws or modifies rooms in the draw screen:
1. `drawRooms` state changes in DrawScreen
2. A 500ms debounced effect fires `syncToFormData()`
3. `syncToFormData()` converts draw data to calculator format and calls `setFormData()`
4. The calculator's Rooms tab, Windows tab, and Doors section all reflect the drawn data

### What gets synced:
| Draw Action | Calculator Field |
|---|---|
| Draw a room | `formData.rooms[]` — name, sqft, ceilingHeight, floor, exposedWalls |
| Place window on wall | `formData.windows[]` — width, height, exposure, uFactor, shgc, frame/glass type |
| Place door on wall | `formData.envelope.doors[]` — width, height, type, uFactor |
| Set wall to exterior/interior/partition | `formData.rooms[].exposedWalls` and `partitionToUnconditioned` |
| Adjacent rooms auto-detect shared walls | Shared walls excluded from exposed wall list |

### Window presets include full Manual J properties:
- frameType, glassType, gasType
- uFactor, shgc
- interiorShading, exteriorShading

### Door presets include:
- type (solid-wood, solid-insulated, sliding-glass, french)
- uFactor, storm door flag

## Project Structure After Integration
```
components/
  jload-calculator.jsx   (modified — added Draw tab + import)
  draw-screen.jsx        (NEW — the draw screen component)
app/
  layout.js              (unchanged)
  page.js                (unchanged)
```

## Testing
1. Start dev server: `npm run dev`
2. Click the "Draw" tab
3. Press R to enter room drawing mode
4. Click and drag to draw rooms on the grid
5. Press W, click a wall to place a window
6. Press D, click a wall to place a door
7. Switch to the "Rooms" tab — verify rooms are populated
8. Switch to the "Windows" tab — verify windows with correct exposures
9. Switch to "Envelope" tab, scroll to Doors — verify doors are populated
10. Click "Calculate Load" — verify results include drawn room data
