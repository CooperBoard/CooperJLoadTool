// app/api/parse-plan/route.js
// Server-side API route — two-pass plan parsing
// Pass 1 (floor_plan): rooms, dimensions, layout
// Pass 2 (elevation): windows, doors, wall heights, exterior finishes
// API key stored in Vercel environment variable: ANTHROPIC_API_KEY

const FLOOR_PLAN_PROMPT = `You are an HVAC load calculation expert analyzing an architectural FLOOR PLAN. Extract room layout data for a Manual J load calculation.

Analyze this floor plan image and return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "pageType": "floor_plan",
  "planName": "name of the plan/project",
  "floorLevel": 1 or 2,
  "stories": number,
  "foundationType": "slab"|"crawl-vented"|"crawl-sealed"|"basement-conditioned"|"basement-unconditioned",
  "totalSqFt": number,
  "rooms": [
    {
      "name": "Room Name",
      "sqft": number,
      "widthFt": number,
      "depthFt": number,
      "ceilingHeight": 9,
      "floor": 1 or 2,
      "exposedWalls": [
        { "exposure": "North"|"South"|"East"|"West", "linearFeet": number, "percentGlass": 0 }
      ],
      "hasExteriorWall": true|false,
      "adjacentTo": ["names of rooms sharing a wall"]
    }
  ],
  "wallConstruction": {
    "type": "2x4"|"2x6"|"block"|"icf",
    "studSpacing": 16 or 24,
    "exteriorFinish": "vinyl"|"brick"|"stucco"|"wood"|"hardie",
    "cavityInsulation": "fiberglass"|"cellulose"|"spray-foam-open"|"spray-foam-closed",
    "estimatedCavityR": number
  },
  "roofType": "asphalt-shingle"|"metal"|"tile"|"flat",
  "atticType": "vented"|"unvented"|"cathedral",
  "designNotes": ["relevant notes"],
  "confidence": {
    "rooms": "high"|"medium"|"low",
    "dimensions": "high"|"medium"|"low",
    "construction": "high"|"medium"|"low"
  }
}

RULES:
- Extract EVERY labeled room visible
- Read dimensions from callouts (format: 15'-10" or 11'-4 1/2"), convert to decimal feet
- Identify which walls are exterior (on the building perimeter) vs interior
- For exposures: if a north arrow is shown use it, otherwise assume top of page = North
- Note room adjacencies (which rooms share walls)
- Ceiling heights default 9' first floor, 8' second floor unless noted
- Do NOT try to extract windows from floor plans — that comes from elevation views
- Return ONLY the JSON`;

const ELEVATION_PROMPT = `You are an HVAC load calculation expert analyzing architectural ELEVATION VIEWS. Extract window, door, and exterior details for a Manual J load calculation.

This image shows one or more building elevations (front, rear, left side, right side). Extract EVERY window and door visible.

Return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "pageType": "elevation",
  "elevations": [
    {
      "face": "front"|"rear"|"left"|"right",
      "facingDirection": "North"|"South"|"East"|"West",
      "wallHeightFirstFloor": number in feet,
      "wallHeightSecondFloor": number in feet or null,
      "roofPitch": "string like 12/8 or 8/12",
      "exteriorFinish": "vinyl"|"brick"|"stucco"|"wood"|"hardie"|"mixed",
      "windows": [
        {
          "id": "W1",
          "floor": 1 or 2,
          "estimatedWidth": number in inches,
          "estimatedHeight": number in inches,
          "positionOnWall": "left"|"center-left"|"center"|"center-right"|"right",
          "verticalPosition": "low"|"standard"|"high"|"transom",
          "windowStyle": "single-hung"|"double-hung"|"casement"|"picture"|"slider"|"transom"|"sidelight"|"bay"|"arched",
          "headerSize": "string if visible, e.g. 3050 or 4060",
          "nearestRoom": "best guess room name based on position",
          "groupedWith": "W2 if part of a mulled pair/triple, null otherwise"
        }
      ],
      "doors": [
        {
          "id": "D1",
          "floor": 1,
          "type": "entry"|"sliding-glass"|"french"|"garage"|"service",
          "estimatedWidth": number in inches,
          "estimatedHeight": number in inches,
          "positionOnWall": "left"|"center-left"|"center"|"center-right"|"right",
          "hasSidelights": true|false,
          "hasTransom": true|false,
          "nearestRoom": "best guess room name"
        }
      ]
    }
  ],
  "designNotes": ["relevant construction notes visible"],
  "confidence": {
    "windowCount": "high"|"medium"|"low",
    "windowSizes": "high"|"medium"|"low",
    "doorTypes": "high"|"medium"|"low",
    "roomMapping": "high"|"medium"|"low"
  }
}

RULES:
- Count EVERY window on each elevation — miss none
- Look for header/mark callouts near windows (e.g. "3050" means 3'0" × 5'0", "TW#3050" etc.)
- Note window style: single-hung has one operable sash, double-hung has two, casement cranks out, picture is fixed, slider slides horizontally
- For grouped/mulled windows, note which ones are paired together
- Estimate sizes from proportions if exact callouts aren't readable — compare to the door height (typically 6'8") as a reference
- Map each window to the most likely room based on its horizontal and vertical position on the elevation
- Note exterior finish per elevation — some houses have brick on front, siding on sides
- Read roof pitch if shown (format like 12/8 means 12 rise over 8 run, or 8/12 etc.)
- Garage doors are doors too — note their count and width
- Return ONLY the JSON`;

const COVER_SHEET_PROMPT = `You are analyzing a building plan COVER SHEET or general notes page. Extract project-level data for an HVAC load calculation.

Return ONLY valid JSON (no markdown, no backticks):

{
  "pageType": "cover_sheet",
  "planName": "name/model of the plan",
  "builder": "builder name if visible",
  "address": "project address if visible",
  "stories": number,
  "totalSqFt": number,
  "firstFloorSqFt": number,
  "secondFloorSqFt": number,
  "garageSqFt": number,
  "foundationType": "slab"|"crawl-vented"|"crawl-sealed"|"basement-conditioned"|"basement-unconditioned",
  "buildingCode": "code year and edition if noted",
  "designLoads": {
    "roof": "psf if noted",
    "floor": "psf if noted",
    "wind": "speed if noted"
  },
  "climateZone": "zone if noted",
  "designNotes": ["any relevant building info"],
  "confidence": {
    "overall": "high"|"medium"|"low"
  }
}

RULES:
- Look for square footage tables/summaries
- Extract design loads, code references, climate data
- Note the builder, plan name/model, lot number
- Return ONLY the JSON`;

export async function POST(request) {
  try {
    const { imageBase64, pageNum, pageType = 'auto' } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: 'No image data provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured — add it in Vercel Settings → Environment Variables' }, { status: 500 });
    }

    // Select the right prompt based on page type
    let prompt;
    if (pageType === 'floor_plan') {
      prompt = FLOOR_PLAN_PROMPT;
    } else if (pageType === 'elevation') {
      prompt = ELEVATION_PROMPT;
    } else if (pageType === 'cover_sheet') {
      prompt = COVER_SHEET_PROMPT;
    } else {
      // Auto-detect: send a meta prompt that identifies and extracts
      prompt = `First, determine what type of architectural drawing this is:
- "floor_plan" if it shows rooms from above with dimensions and labels
- "elevation" if it shows the exterior of the building from the side (front, rear, left, right view)
- "cover_sheet" if it shows project info, square footage tables, code references
- "structural" if it shows framing details, foundation details, structural notes
- "electrical" if it shows electrical layouts
- "other" for anything else

Then extract the relevant data.

If this is a FLOOR PLAN:
${FLOOR_PLAN_PROMPT}

If this is an ELEVATION:
${ELEVATION_PROMPT}

If this is a COVER SHEET:
${COVER_SHEET_PROMPT}

If this is structural, electrical, or other, return:
{"pageType": "other", "designNotes": ["list any notes relevant to HVAC load calculation"]}

Return ONLY the JSON.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return Response.json(
        { error: errData.error?.message || `Anthropic API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';

    // Parse JSON from response
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
      const parsed = JSON.parse(clean);
      parsed._pageNum = pageNum;
      parsed._requestedType = pageType;
      return Response.json(parsed);
    } catch (parseErr) {
      return Response.json({
        _pageNum: pageNum,
        _error: 'Could not parse AI response as JSON',
        _raw: text.substring(0, 1000),
      }, { status: 422 });
    }

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
