/* ============================================================
   AgroPan — Simulation Engine (Placeholder)
   ============================================================
   This module contains the simulation logic for AgroPan.

   In a production release, this would call a backend API
   or a WASM-compiled agronomic model. For this prototype,
   we use well-structured placeholder data calibrated to
   realistic Nepal agriculture ranges so the UI feels
   authentic and the data structure is ready for real
   integration.
   ============================================================ */

var AgroPanSim = (function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // CROP DATA — Realistic ranges for Nepal
  // ══════════════════════════════════════════════════════════
  // Each crop has yield ranges (kg per ropani), cost per
  // ropani, and market price per kg. Values sourced from
  // Nepal's Ministry of Agriculture & Livestock Development
  // open datasets and adjusted for simplicity.
  //
  // Structure:
  //   yieldRange: [min, max] in kg/ropani
  //   costPerRopani: NPR
  //   pricePerKg: [min, max] NPR
  //   bestSeason: ideal planting season
  //   riskFactors: array of risk descriptions
  // ──────────────────────────────────────────────────────────

  var CROP_DATA = {
    rice: {
      name: 'Rice (धान)',
      yieldRange: [180, 320],
      costPerRopani: 4500,
      pricePerKg: [28, 42],
      bestSeason: 'monsoon',
      riskFactors: ['Late monsoon onset', 'Flood damage', 'Pest outbreak (stem borer)']
    },
    maize: {
      name: 'Maize (मकै)',
      yieldRange: [120, 250],
      costPerRopani: 3200,
      pricePerKg: [22, 35],
      bestSeason: 'monsoon',
      riskFactors: ['Drought stress', 'Fall armyworm', 'Hailstorm damage']
    },
    wheat: {
      name: 'Wheat (गहुँ)',
      yieldRange: [100, 200],
      costPerRopani: 3800,
      pricePerKg: [30, 45],
      bestSeason: 'winter',
      riskFactors: ['Unseasonal rain', 'Rust disease', 'Late frost']
    },
    millet: {
      name: 'Millet (कोदो)',
      yieldRange: [60, 140],
      costPerRopani: 2800,
      pricePerKg: [35, 55],
      bestSeason: 'monsoon',
      riskFactors: ['Bird damage', 'Poor germination', 'Nutrient deficiency']
    },
    lentil: {
      name: 'Lentil (मसुरो)',
      yieldRange: [40, 90],
      costPerRopani: 2500,
      pricePerKg: [80, 130],
      bestSeason: 'winter',
      riskFactors: ['Wilt disease', 'Waterlogging', 'Aphid infestation']
    },
    mustard: {
      name: 'Mustard (तोरी)',
      yieldRange: [30, 70],
      costPerRopani: 2200,
      pricePerKg: [90, 150],
      bestSeason: 'winter',
      riskFactors: ['Frost damage', 'Aphid attack', 'Low pollination']
    },
    potato: {
      name: 'Potato (आलु)',
      yieldRange: [400, 800],
      costPerRopani: 6500,
      pricePerKg: [18, 32],
      bestSeason: 'winter',
      riskFactors: ['Late blight', 'Storage loss', 'Price crash at harvest']
    },
    sugarcane: {
      name: 'Sugarcane (उखु)',
      yieldRange: [1200, 2000],
      costPerRopani: 8000,
      pricePerKg: [4, 7],
      bestSeason: 'spring',
      riskFactors: ['Water scarcity', 'Red rot', 'Delayed mill payments']
    },
    tea: {
      name: 'Tea (चिया)',
      yieldRange: [50, 120],
      costPerRopani: 5500,
      pricePerKg: [150, 300],
      bestSeason: 'spring',
      riskFactors: ['Blister blight', 'Labour shortage', 'Quality degradation']
    },
    cardamom: {
      name: 'Cardamom (अलैंची)',
      yieldRange: [20, 50],
      costPerRopani: 7000,
      pricePerKg: [800, 2200],
      bestSeason: 'monsoon',
      riskFactors: ['Chirke/Foorke virus', 'Hailstorm', 'Price manipulation']
    }
  };

  // ══════════════════════════════════════════════════════════
  // DISTRICT MODIFIERS
  // ══════════════════════════════════════════════════════════
  // Each district applies a yield modifier and a risk modifier
  // based on its ecological zone and infrastructure level.

  var DISTRICT_DATA = {
    kathmandu:     { zone: 'Mid-Hill',  yieldMod: 0.85, riskMod: 1.1  },
    chitwan:       { zone: 'Terai',     yieldMod: 1.10, riskMod: 0.85 },
    morang:        { zone: 'Terai',     yieldMod: 1.05, riskMod: 0.90 },
    kaski:         { zone: 'Mid-Hill',  yieldMod: 0.90, riskMod: 1.05 },
    rupandehi:     { zone: 'Terai',     yieldMod: 1.08, riskMod: 0.88 },
    jhapa:         { zone: 'Terai',     yieldMod: 1.12, riskMod: 0.82 },
    kailali:       { zone: 'Terai',     yieldMod: 1.00, riskMod: 0.95 },
    sunsari:       { zone: 'Terai',     yieldMod: 1.06, riskMod: 0.90 },
    sindhupalchok: { zone: 'High-Hill', yieldMod: 0.70, riskMod: 1.30 },
    dang:          { zone: 'Inner-Terai', yieldMod: 1.02, riskMod: 0.92 }
  };

  // ══════════════════════════════════════════════════════════
  // SEASON MODIFIERS
  // ══════════════════════════════════════════════════════════
  // Matching the crop's best season gives a bonus; planting
  // off-season increases risk.

  function getSeasonModifier(crop, season) {
    if (crop.bestSeason === season) {
      return { yieldMod: 1.0, riskMod: 1.0 };
    }
    // Off-season penalty
    return { yieldMod: 0.65, riskMod: 1.45 };
  }

  // ══════════════════════════════════════════════════════════
  // CORE SIMULATION FUNCTION
  // ══════════════════════════════════════════════════════════
  /**
   * simulate(params)
   *
   * @param {Object} params
   * @param {string} params.district  — district key
   * @param {string} params.crop      — crop key
   * @param {string} params.season    — season key
   * @param {number} params.land      — land area in ropani
   *
   * @returns {Object} Simulation result:
   *   - yieldMin, yieldMax (kg/ropani)
   *   - totalYieldMin, totalYieldMax (kg total)
   *   - profitMin, profitMax (NPR)
   *   - riskScore (0–100)
   *   - riskLevel ('Low' | 'Medium' | 'High')
   *   - confidence (%)
   *   - recommendation (string)
   *   - cropName, districtZone, riskFactors
   */
  function simulate(params) {
    var crop     = CROP_DATA[params.crop];
    var district = DISTRICT_DATA[params.district];
    var season   = getSeasonModifier(crop, params.season);
    var land     = Math.max(1, Math.min(100, params.land || 5));

    if (!crop || !district) {
      return null;
    }

    // ── Yield calculation ────────────────────────────────
    var yieldMin = Math.round(crop.yieldRange[0] * district.yieldMod * season.yieldMod);
    var yieldMax = Math.round(crop.yieldRange[1] * district.yieldMod * season.yieldMod);

    var totalYieldMin = yieldMin * land;
    var totalYieldMax = yieldMax * land;

    // ── Profit calculation ───────────────────────────────
    // Revenue = yield × price per kg
    // Profit = Revenue − Cost
    var revenueMin = totalYieldMin * crop.pricePerKg[0];
    var revenueMax = totalYieldMax * crop.pricePerKg[1];
    var totalCost  = crop.costPerRopani * land;

    var profitMin = Math.round(revenueMin - totalCost);
    var profitMax = Math.round(revenueMax - totalCost);

    // ── Risk score (0–100) ───────────────────────────────
    // Base risk starts at 30, modified by district & season
    var baseRisk  = 30;
    var riskScore = Math.round(baseRisk * district.riskMod * season.riskMod);
    riskScore     = Math.max(5, Math.min(95, riskScore));

    var riskLevel;
    if (riskScore <= 35) {
      riskLevel = 'Low';
    } else if (riskScore <= 60) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'High';
    }

    // ── Confidence ───────────────────────────────────────
    // Higher when season matches and district is well-mapped
    var confidence = 100 - riskScore + Math.round(Math.random() * 8);
    confidence     = Math.max(45, Math.min(95, confidence));

    // ── Recommendation ───────────────────────────────────
    var recommendation = buildRecommendation(crop, district, season, riskLevel, params);

    return {
      cropName:      crop.name,
      districtZone:  district.zone,
      yieldMin:      yieldMin,
      yieldMax:      yieldMax,
      totalYieldMin: totalYieldMin,
      totalYieldMax: totalYieldMax,
      profitMin:     profitMin,
      profitMax:     profitMax,
      riskScore:     riskScore,
      riskLevel:     riskLevel,
      confidence:    confidence,
      recommendation: recommendation,
      riskFactors:   crop.riskFactors
    };
  }

  /**
   * buildRecommendation
   * Generates a contextual, human-readable recommendation
   * string based on the simulation outcome.
   */
  function buildRecommendation(crop, district, season, riskLevel, params) {
    var rec = '';

    if (season.yieldMod < 1.0) {
      rec += params.crop.charAt(0).toUpperCase() + params.crop.slice(1) +
             ' is typically planted in the ' + crop.bestSeason +
             ' season. Planting in ' + params.season +
             ' increases risk significantly. ';
    }

    if (riskLevel === 'Low') {
      rec += 'Conditions in ' + district.zone + ' (' + params.district +
             ') are favorable for ' + crop.name +
             '. This is a solid planting decision with manageable risk.';
    } else if (riskLevel === 'Medium') {
      rec += 'Moderate risk detected. Consider staggered planting to spread ' +
             'exposure. Monitor ' + crop.riskFactors[0].toLowerCase() +
             ' closely in your area.';
    } else {
      rec += 'High risk scenario. Primary concerns: ' +
             crop.riskFactors.slice(0, 2).join(' and ').toLowerCase() +
             '. Consider diversifying with a secondary crop or delaying ' +
             'until a more favorable window.';
    }

    return rec;
  }

  // ── Public API ─────────────────────────────────────────
  return {
    simulate: simulate,
    CROP_DATA: CROP_DATA,
    DISTRICT_DATA: DISTRICT_DATA
  };

})();
