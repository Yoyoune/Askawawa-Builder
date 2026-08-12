"use strict";

const UI_SLOTS = [
  { id: "coiffe", label: "Coiffe", dataSlot: "coiffe", icon: "🎩" },
  { id: "cape", label: "Cape", dataSlot: "cape", icon: "🧣" },
  { id: "amulette", label: "Amulette", dataSlot: "amulette", icon: "📿" },
  { id: "arme", label: "Arme", dataSlot: "arme", icon: "⚔️" },
  { id: "bouclier", label: "Bouclier", dataSlot: "bouclier", icon: "🛡️" },
  { id: "anneau1", label: "Anneau", dataSlot: "anneau", icon: "💍" },
  { id: "anneau2", label: "Anneau", dataSlot: "anneau", icon: "💍" },
  { id: "ceinture", label: "Ceinture", dataSlot: "ceinture", icon: "⛓️" },
  { id: "bottes", label: "Bottes", dataSlot: "bottes", icon: "🥾" },
  { id: "familier", label: "Familier", dataSlot: "familier", icon: "🐾" },
  { id: "dofus1", label: "Dofus", dataSlot: "dofus", icon: "🔮", group: "dofus" },
  { id: "dofus2", label: "Dofus", dataSlot: "dofus", icon: "🔮", group: "dofus" },
  { id: "dofus3", label: "Dofus", dataSlot: "dofus", icon: "🔮", group: "dofus" },
  { id: "dofus4", label: "Dofus", dataSlot: "dofus", icon: "🔮", group: "dofus" },
  { id: "dofus5", label: "Dofus", dataSlot: "dofus", icon: "🔮", group: "dofus" },
  { id: "dofus6", label: "Dofus", dataSlot: "dofus", icon: "🔮", group: "dofus" },
];

// Server-specific base-stat formulas (Game/Actors/Stats/StatsFields.cs:227-247).
// Not vanilla Dofus values - this server is rebalanced.
const PARCHOTAGE_STATS = ["Force", "Intelligence", "Chance", "Agilité", "Vitalité", "Sagesse"];

// The dofus slot covers two distinct item pools that share the same equip location
// in-game (dofus vs trophée). Clicking it opens a category picker before the item
// browser.
const SLOT_CATEGORY_CHOICES = {
  dofus: [
    { key: "dofus", label: "Dofus", icon: "🔮" },
    { key: "trophee", label: "Trophée", icon: "🏆" },
  ],
};
const CATEGORY_LABELS = {
  familier: "Familier",
  dofus: "Dofus",
  trophee: "Trophée",
};
// items_types.Id for the "Trophée" item type (superType 13, shared with real Dofus).
const TROPHEE_TYPE_ID = 151;

function itemMatchesCategory(item, category) {
  if (category === "trophee") return item.slot === "dofus" && item.typeId === TROPHEE_TYPE_ID;
  if (category === "dofus") return item.slot === "dofus" && item.typeId !== TROPHEE_TYPE_ID;
  return item.slot === category;
}

// Dragodinde shares the "familier" paperdoll slot in-game, but has its own item.slot
// value so it can be filtered separately in the browser (see SLOT_CATEGORY_CHOICES).
function dataSlotForItem(item) {
  return item.slot === "dragodinde" ? "familier" : item.slot;
}

// Fixed display order for "Statistiques totales" (not sorted by value). Anything not
// listed here falls back to the end, alphabetically, so a new/unrecognized effect label
// still shows up instead of being silently dropped.
const STAT_ORDER = [
  "PA", "PM", "Portée", "Invocations",
  "Vitalité", "Sagesse", "Chance", "Intelligence", "Agilité", "Force", "Puissance",
  // Raw weapon damage/steal rolls (parenthesized labels, Category=2 in the game data) -
  // logically come before bonus damage since they're the weapon's base hit.
  "(dommages Terre)", "(dommages Feu)", "(dommages Eau)", "(dommages Air)", "(dommages Neutre)",
  "(vol Terre)", "(vol Feu)", "(vol Eau)", "(vol Air)", "(vol Neutre)", "(PV rendus)", "(Retrait PA)",
  "Dommages", "Dommages Terre", "Dommages Feu", "Dommages Eau", "Dommages Air", "Dommages Neutre",
  "Dommages Critiques", "Dommages Poussée", "Dommages Pièges", "Puissance (pièges)",
  "% Dommages mêlée", "% Dommages distance", "% Dommages d'armes", "% Dommages aux sorts",
  "% Critique",
  "% Résistance Terre", "% Résistance Feu", "% Résistance Eau", "% Résistance Air", "% Résistance Neutre",
  "% Résistance mêlée", "% Résistance distance",
  "Résistance Terre", "Résistance Feu", "Résistance Eau", "Résistance Air", "Résistance Neutre",
  "Résistance Critiques", "Résistance Poussée",
  "Initiative", "Prospection", "Fuite", "Tacle",
  "Esquive PA", "Esquive PM", "Retrait PA", "Retrait PM",
  "Soins", "Pods",
];

// Small visual icon shown before each stat name in "Statistiques totales". Emoji
// can't be recolored, so exact colors (a blue star, a solid red shield, a shield
// with only its outline red, a purple square with a white arrow inside...) are
// built as tiny inline SVGs instead, using the same palette as the rest of the UI.
const ICON_BLUE = "#5b9bd5", ICON_GREEN = "#6fbf73", ICON_GREEN_DARK = "#3d7a42", ICON_RED = "#d9686b",
  ICON_PURPLE = "#b07cd6", ICON_WHITE = "#e8e8e8", ICON_BROWN = "#a97c50", ICON_GRAY = "#8a8a8a";
const ELEMENT_COLORS = { "Terre": ICON_BROWN, "Feu": ICON_RED, "Eau": ICON_BLUE, "Air": ICON_GREEN, "Neutre": ICON_WHITE };

const ICON_SHAPES = {
  star: c => `<polygon points="12,2 14.9,9.1 22.5,9.5 16.5,14.3 18.6,21.5 12,17.3 5.4,21.5 7.5,14.3 1.5,9.5 9.1,9.1" fill="${c}"/>`,
  triangleRight: c => `<polygon points="6,3 20,12 6,21" fill="${c}"/>`,
  triangleLeft: c => `<polygon points="18,3 4,12 18,21" fill="${c}"/>`,
  spiral: c => `<path d="M12 3 a9 9 0 1 0 8.5 12 M12 3 a5.3 5.3 0 1 1 -4.8 7.5" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  arrowSmall: c => `<polygon points="6,9.5 13,9.5 13,7 18,12 13,17 13,14.5 6,14.5" fill="${c}"/>`,
  cross: c => `<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" fill="${c}"/>`,
  shield: c => `<path d="M12 2 L20 5.5 V11 C20 16.5 16.8 20.5 12 22 C7.2 20.5 4 16.5 4 11 V5.5 Z" fill="${c}"/>`,
  shieldOutline: c => `<path d="M12 2 L20 5.5 V11 C20 16.5 16.8 20.5 12 22 C7.2 20.5 4 16.5 4 11 V5.5 Z" fill="none" stroke="${c}" stroke-width="1.8"/>`,
  exclam: c => `<rect x="11.1" y="6.5" width="1.8" height="7" rx="0.9" fill="${c}"/><rect x="11.1" y="15.3" width="1.8" height="2" rx="0.9" fill="${c}"/>`,
  square: c => `<rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="${c}"/>`,
};

function svg(...parts) {
  return `<svg viewBox="0 0 24 24" width="13" height="13" class="stat-icon-svg">${parts.join("")}</svg>`;
}

const STAT_ICON_SVG = {
  "PA": svg(ICON_SHAPES.star(ICON_BLUE)),
  "PM": svg(ICON_SHAPES.star(ICON_GREEN_DARK)),
  "Sagesse": svg(ICON_SHAPES.spiral(ICON_PURPLE)),
  "Fuite": svg(ICON_SHAPES.triangleRight(ICON_GREEN)),
  "Tacle": svg(ICON_SHAPES.triangleLeft(ICON_GREEN)),
  "Esquive PA": svg(ICON_SHAPES.triangleRight(ICON_BLUE)),
  "Esquive PM": svg(ICON_SHAPES.triangleRight(ICON_GREEN_DARK)),
  "Retrait PA": svg(ICON_SHAPES.triangleLeft(ICON_BLUE)),
  "Retrait PM": svg(ICON_SHAPES.triangleLeft(ICON_GREEN_DARK)),
  "(Retrait PA)": svg(ICON_SHAPES.triangleLeft(ICON_BLUE)),
  "Soins": svg(ICON_SHAPES.cross(ICON_RED)),
  "Dommages Poussée": svg(ICON_SHAPES.square(ICON_PURPLE), ICON_SHAPES.arrowSmall(ICON_WHITE)),
  "Résistance Poussée": svg(ICON_SHAPES.shield(ICON_PURPLE), ICON_SHAPES.arrowSmall(ICON_WHITE)),
  "Résistance Critiques": svg(ICON_SHAPES.shieldOutline(ICON_RED), ICON_SHAPES.exclam(ICON_RED)),
  "% Résistance mêlée": svg(ICON_SHAPES.shield(ICON_GRAY)),
  "% Résistance distance": svg(ICON_SHAPES.shield(ICON_GRAY)),
};

function statIcon(label) {
  if (STAT_ICON_SVG[label]) return STAT_ICON_SVG[label];

  if (label.includes("Résistance")) {
    for (const [element, color] of Object.entries(ELEMENT_COLORS)) {
      if (label.includes(element)) return svg(ICON_SHAPES.shield(color));
    }
    return svg(ICON_SHAPES.shield(ICON_GRAY));
  }

  const isDamage = label.startsWith("(dommages") || label.startsWith("(vol") || label.startsWith("Dommages ");
  if (isDamage) {
    for (const [element, color] of Object.entries(ELEMENT_COLORS)) {
      if (label.includes(element)) return svg(ICON_SHAPES.square(color));
    }
  }

  const EMOJI_FALLBACK = {
    "Portée": "👁️", "Invocations": "🐗", "Vitalité": "❤️", "Chance": "💧",
    "Intelligence": "🔥", "Agilité": "🍃", "Force": "🟤", "Puissance": "⚡",
    "Dommages": "✨", "Dommages Critiques": "🎯", "Dommages Pièges": "🪤", "Puissance (pièges)": "🪤",
    "% Dommages mêlée": "👊", "% Dommages distance": "🏹", "% Dommages d'armes": "⚔️", "% Dommages aux sorts": "⭐",
    "% Critique": "❗", "Initiative": "🪶", "Prospection": "🔍",
    "Pods": "🎒", "(PV rendus)": "❤️",
  };
  if (EMOJI_FALLBACK[label]) return EMOJI_FALLBACK[label];

  const ELEMENT_EMOJI = { "Terre": "🟤", "Feu": "🔥", "Eau": "💧", "Air": "🍃", "Neutre": "⚪" };
  for (const [element, icon] of Object.entries(ELEMENT_EMOJI)) {
    if (label.includes(element)) return icon;
  }
  return "";
}

const STORAGE_KEY = "populus-builder-equipped-v1";
const STORAGE_KEY_CUSTOM = "populus-builder-customization-v1";
const STORAGE_KEY_BUILDS = "populus-builder-saved-builds-v1";

// "bonus" filters check the set's bonus tiers; "item" filters check whether any
// individual piece in the set grants that stat; "other" catches sets with none of
// the four main stats on any of their items.
const SET_FILTER_DEFS = [
  { key: "pa", label: "Bonus pano PA", kind: "bonus", stat: "PA" },
  { key: "pm", label: "Bonus pano PM", kind: "bonus", stat: "PM" },
  { key: "force", label: "Pano Force", kind: "item", stat: "Force" },
  { key: "intelligence", label: "Pano Intelligence", kind: "item", stat: "Intelligence" },
  { key: "chance", label: "Pano Chance", kind: "item", stat: "Chance" },
  { key: "agilite", label: "Pano Agilité", kind: "item", stat: "Agilité" },
  { key: "autre", label: "Autre pano", kind: "other" },
];

// Which equipment slots a panoplie must contain at least one piece of (dofus/familier
// excluded per request - only "real" equipment slots make sense to filter by here).
const SLOT_TYPE_FILTER_DEFS = [
  { key: "coiffe", label: "Coiffe" },
  { key: "cape", label: "Cape" },
  { key: "amulette", label: "Amulette" },
  { key: "arme", label: "Arme" },
  { key: "bouclier", label: "Bouclier" },
  { key: "anneau", label: "Anneau" },
  { key: "ceinture", label: "Ceinture" },
  { key: "bottes", label: "Bottes" },
];
let activeSlotTypeFilters = new Set();

let ITEMS = [];
let ITEMS_BY_SLOT = new Map();
let ITEMS_BY_ID = new Map();
let SETS_BY_ID = new Map();
let SET_FLAGS = new Map();
/** setId -> highest item level in that set */
let SET_MAX_LEVEL = new Map();
let EFFECT_LABELS = [];
let activeSetFilters = new Set();
/** [{ stat, minValue }] */
let activeStatFilters = [];

/** uiSlotId -> item object (or undefined) */
let equipped = {};
/** uiSlotId -> { effectIndex: chosenValue } */
let rollOverrides = {};
/** uiSlotId -> [{ label, value }] */
let forgemagie = {};
/** statLabel -> manually added points (free-form, unrelated to the level-based budget) */
let parchotage = {};
/** statLabel -> points allocated from the level-based characteristic point budget */
let characteristicPoints = {};
/** [{ name, charLevel, equipped: {uiSlotId:itemId}, rollOverrides, forgemagie, parchotage, characteristicPoints, savedAt }] */
let savedBuilds = [];
/** name of the build last loaded/saved, so "Enregistrer" updates it without re-prompting */
let activeBuildName = null;

let activeUiSlot = null;
/** resolved category key for the open browser: a plain dataSlot, or "dragodinde"/"trophee" */
let activeCategory = null;

async function main() {
  const [items, sets] = await Promise.all([
    fetch("data/items.json").then(r => r.json()),
    fetch("data/sets.json").then(r => r.json()),
  ]);

  ITEMS = items;
  const labelSet = new Set();
  for (const item of items) {
    ITEMS_BY_ID.set(item.id, item);
    if (!ITEMS_BY_SLOT.has(item.slot)) ITEMS_BY_SLOT.set(item.slot, []);
    ITEMS_BY_SLOT.get(item.slot).push(item);
    for (const effect of item.effects || []) labelSet.add(stripSign(effect.label));
  }
  for (const set of sets) {
    SETS_BY_ID.set(set.id, set);
    for (const tier of set.bonuses || []) for (const effect of tier) labelSet.add(stripSign(effect.label));
  }
  EFFECT_LABELS = [...labelSet].sort((a, b) => a.localeCompare(b));
  buildEffectCatalogDatalist();

  for (const set of SETS_BY_ID.values()) {
    SET_FLAGS.set(set.id, computeSetFlags(set));
    SET_MAX_LEVEL.set(set.id, computeSetMaxLevel(set));
  }

  loadEquipped();
  loadCustomization();
  loadSavedBuilds();
  renderPaperdoll();
  renderParchotageGrid();
  renderCharacteristicPointsGrid();
  renderBaseStats();
  renderStats();
  renderSavedBuildsList();
  renderSetsFilterChips();
  renderSetsSlotTypeFilterChips();
  populateStatFilterSelect();

  document.getElementById("browserClose").addEventListener("click", closeSidePanel);
  document.getElementById("detailClose").addEventListener("click", closeSidePanel);
  document.getElementById("setsBrowserClose").addEventListener("click", closeSidePanel);
  document.getElementById("setsSearchBtn").addEventListener("click", openSetsBrowser);
  document.getElementById("setsSearchInput").addEventListener("input", renderSetsList);
  document.getElementById("setsSortSelect").addEventListener("change", renderSetsList);
  document.getElementById("setsLevelMinInput").addEventListener("input", renderSetsList);
  document.getElementById("setsLevelMaxInput").addEventListener("input", renderSetsList);
  document.getElementById("levelMinInput").addEventListener("input", renderItemList);
  document.getElementById("levelMaxInput").addEventListener("input", renderItemList);
  document.getElementById("categoryPickerClose").addEventListener("click", closeCategoryPicker);
  document.getElementById("categoryPickerOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "categoryPickerOverlay") closeCategoryPicker();
  });
  document.getElementById("addStatFilterBtn").addEventListener("click", addStatFilter);
  document.querySelectorAll(".collapsible-header").forEach(header => {
    header.addEventListener("click", () => header.closest(".collapsible-section").classList.toggle("collapsed"));
  });
  document.getElementById("setModalClose").addEventListener("click", closeSetPreview);
  document.getElementById("setModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "setModalOverlay") closeSetPreview();
  });
  document.getElementById("compareBuildsBtn").addEventListener("click", openCompareModal);
  document.getElementById("compareModalClose").addEventListener("click", closeCompareModal);
  document.getElementById("compareModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "compareModalOverlay") closeCompareModal();
  });
  document.getElementById("compareSelectA").addEventListener("change", renderComparison);
  document.getElementById("compareSelectB").addEventListener("change", renderComparison);
  document.getElementById("compatibleSetsClose").addEventListener("click", closeCompatibleSetsModal);
  document.getElementById("compatibleSetsModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "compatibleSetsModalOverlay") closeCompatibleSetsModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { closeSetPreview(); closeCompareModal(); closeCategoryPicker(); closeCompatibleSetsModal(); }
  });
  const doSaveBuild = () => {
    const input = document.getElementById("buildNameInput");
    const name = input.value.trim();
    if (!name) return;
    const exists = savedBuilds.some(b => b.name === name);
    if (exists && name !== activeBuildName && !confirm(`Un build nommé "${name}" existe déjà. L'écraser ?`)) return;
    saveCurrentAsBuild(name);
    activeBuildName = name;
  };
  document.getElementById("saveBuildBtn").addEventListener("click", doSaveBuild);
  document.getElementById("buildNameInput").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") doSaveBuild();
  });

  document.getElementById("searchInput").addEventListener("input", renderItemList);
  document.getElementById("sortSelect").addEventListener("change", renderItemList);
  document.getElementById("charLevel").addEventListener("input", () => {
    renderItemList();
    renderBaseStats();
    updateCharacteristicPointsBudget();
    renderStats();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Retirer tout l'équipement (et les réglages de jet/forgemagie) ?")) return;
    equipped = {};
    rollOverrides = {};
    forgemagie = {};
    activeBuildName = null;
    document.getElementById("buildNameInput").value = "";
    saveEquipped();
    saveCustomization();
    renderPaperdoll();
    renderStats();
    closeSidePanel();
  });
}

function buildEffectCatalogDatalist() {
  const datalist = document.createElement("datalist");
  datalist.id = "fmCatalogList";
  datalist.innerHTML = EFFECT_LABELS.map(l => `<option value="${escapeHtml(l)}">`).join("");
  document.body.appendChild(datalist);
}

function getCharLevel() {
  const v = parseInt(document.getElementById("charLevel").value, 10);
  if (isNaN(v)) return 200;
  return Math.min(200, Math.max(1, v));
}

// ---------- Persistence ----------

function loadEquipped() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    for (const [uiSlotId, itemId] of Object.entries(ids)) {
      const item = ITEMS_BY_ID.get(itemId);
      if (item) equipped[uiSlotId] = item;
    }
  } catch (e) {
    console.warn("Could not restore saved build", e);
  }
}

function equippedToIds() {
  const ids = {};
  for (const [uiSlotId, item] of Object.entries(equipped)) ids[uiSlotId] = item.id;
  return ids;
}

function equippedFromIds(ids) {
  const map = {};
  for (const [uiSlotId, itemId] of Object.entries(ids || {})) {
    const item = ITEMS_BY_ID.get(itemId);
    if (item) map[uiSlotId] = item;
  }
  return map;
}

function saveEquipped() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equippedToIds()));
}

function loadCustomization() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    if (!raw) return;
    const data = JSON.parse(raw);
    rollOverrides = data.rollOverrides || {};
    forgemagie = data.forgemagie || {};
    parchotage = data.parchotage || {};
    characteristicPoints = data.characteristicPoints || {};
  } catch (e) {
    console.warn("Could not restore saved customization", e);
  }
}

function saveCustomization() {
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify({ rollOverrides, forgemagie, parchotage, characteristicPoints }));
}

function loadSavedBuilds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUILDS);
    if (!raw) return;
    savedBuilds = JSON.parse(raw) || [];
  } catch (e) {
    console.warn("Could not restore saved builds list", e);
    savedBuilds = [];
  }
}

function persistSavedBuilds() {
  localStorage.setItem(STORAGE_KEY_BUILDS, JSON.stringify(savedBuilds));
}

// ---------- Mes builds ----------

function saveCurrentAsBuild(name) {
  const snapshot = {
    name,
    charLevel: getCharLevel(),
    equipped: equippedToIds(),
    rollOverrides: JSON.parse(JSON.stringify(rollOverrides)),
    forgemagie: JSON.parse(JSON.stringify(forgemagie)),
    parchotage: JSON.parse(JSON.stringify(parchotage)),
    characteristicPoints: JSON.parse(JSON.stringify(characteristicPoints)),
    savedAt: new Date().toISOString(),
  };
  const existingIdx = savedBuilds.findIndex(b => b.name === name);
  if (existingIdx >= 0) savedBuilds[existingIdx] = snapshot;
  else savedBuilds.push(snapshot);

  persistSavedBuilds();
  renderSavedBuildsList();
}

function loadBuildByName(name) {
  const build = savedBuilds.find(b => b.name === name);
  if (!build) return;

  equipped = equippedFromIds(build.equipped);
  rollOverrides = JSON.parse(JSON.stringify(build.rollOverrides || {}));
  forgemagie = JSON.parse(JSON.stringify(build.forgemagie || {}));
  parchotage = JSON.parse(JSON.stringify(build.parchotage || {}));
  characteristicPoints = JSON.parse(JSON.stringify(build.characteristicPoints || {}));
  if (build.charLevel) document.getElementById("charLevel").value = build.charLevel;

  activeBuildName = name;
  document.getElementById("buildNameInput").value = name;

  saveEquipped();
  saveCustomization();
  closeSidePanel();
  renderPaperdoll();
  renderParchotageGrid();
  renderCharacteristicPointsGrid();
  renderBaseStats();
  renderStats();
}

function renameBuildByName(oldName) {
  const newName = prompt("Nouveau nom du build :", oldName);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  if (savedBuilds.some(b => b.name === trimmed) && !confirm(`Un build nommé "${trimmed}" existe déjà. L'écraser ?`)) return;

  savedBuilds = savedBuilds.filter(b => b.name !== trimmed);
  const build = savedBuilds.find(b => b.name === oldName);
  if (build) build.name = trimmed;

  if (activeBuildName === oldName) {
    activeBuildName = trimmed;
    document.getElementById("buildNameInput").value = trimmed;
  }
  persistSavedBuilds();
  renderSavedBuildsList();
}

function deleteBuildByName(name) {
  if (!confirm(`Supprimer le build "${name}" ?`)) return;
  savedBuilds = savedBuilds.filter(b => b.name !== name);
  if (activeBuildName === name) {
    activeBuildName = null;
    document.getElementById("buildNameInput").value = "";
  }
  persistSavedBuilds();
  renderSavedBuildsList();
}

function renderSavedBuildsList() {
  const listEl = document.getElementById("savedBuildsList");
  listEl.innerHTML = "";
  if (savedBuilds.length === 0) {
    listEl.innerHTML = '<div class="stat-empty">Aucun build enregistré.</div>';
    return;
  }

  savedBuilds.forEach((build, idx) => {
    const row = document.createElement("div");
    row.className = "build-row";

    const name = document.createElement("span");
    name.className = "build-name";
    name.title = build.name;
    name.textContent = build.name;
    row.appendChild(name);

    const actions = document.createElement("div");
    actions.className = "build-actions";

    const upBtn = document.createElement("button");
    upBtn.className = "move-btn";
    upBtn.textContent = "▲";
    upBtn.title = "Monter";
    upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", () => moveBuild(idx, -1));
    actions.appendChild(upBtn);

    const downBtn = document.createElement("button");
    downBtn.className = "move-btn";
    downBtn.textContent = "▼";
    downBtn.title = "Descendre";
    downBtn.disabled = idx === savedBuilds.length - 1;
    downBtn.addEventListener("click", () => moveBuild(idx, 1));
    actions.appendChild(downBtn);

    const loadBtn = document.createElement("button");
    loadBtn.className = "load-btn";
    loadBtn.textContent = "📂";
    loadBtn.title = "Charger";
    loadBtn.addEventListener("click", () => loadBuildByName(build.name));
    actions.appendChild(loadBtn);

    const renameBtn = document.createElement("button");
    renameBtn.className = "rename-btn";
    renameBtn.textContent = "✎";
    renameBtn.title = "Renommer";
    renameBtn.addEventListener("click", () => renameBuildByName(build.name));
    actions.appendChild(renameBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "×";
    delBtn.title = "Supprimer";
    delBtn.addEventListener("click", () => deleteBuildByName(build.name));
    actions.appendChild(delBtn);

    row.appendChild(actions);
    listEl.appendChild(row);
  });
}

function moveBuild(idx, direction) {
  const target = idx + direction;
  if (target < 0 || target >= savedBuilds.length) return;
  [savedBuilds[idx], savedBuilds[target]] = [savedBuilds[target], savedBuilds[idx]];
  persistSavedBuilds();
  renderSavedBuildsList();
}

// ---------- Compare builds ----------

function populateCompareSelects() {
  const sorted = [...savedBuilds].sort((a, b) => a.name.localeCompare(b.name));
  const options = sorted.map(b => `<option value="${escapeHtml(b.name)}">${escapeHtml(b.name)}</option>`).join("");
  const selA = document.getElementById("compareSelectA");
  const selB = document.getElementById("compareSelectB");
  const prevA = selA.value, prevB = selB.value;
  selA.innerHTML = options;
  selB.innerHTML = options;
  if (sorted.some(b => b.name === prevA)) selA.value = prevA;
  if (sorted.some(b => b.name === prevB)) selB.value = prevB;
  else if (sorted.length > 1) selB.value = sorted[1].name;
}

function openCompareModal() {
  if (savedBuilds.length < 2) {
    alert("Il faut au moins 2 builds enregistrés pour pouvoir les comparer.");
    return;
  }
  populateCompareSelects();
  renderComparison();
  document.getElementById("compareModalOverlay").classList.remove("hidden");
}

function closeCompareModal() {
  document.getElementById("compareModalOverlay").classList.add("hidden");
}

function statsForBuild(build) {
  return computeCombinedStats(
    equippedFromIds(build.equipped),
    build.rollOverrides || {},
    build.forgemagie || {},
    build.parchotage || {},
    build.charLevel || 200,
    build.characteristicPoints || {}
  );
}

function renderComparison() {
  const resultEl = document.getElementById("compareResult");
  const nameA = document.getElementById("compareSelectA").value;
  const nameB = document.getElementById("compareSelectB").value;
  const buildA = savedBuilds.find(b => b.name === nameA);
  const buildB = savedBuilds.find(b => b.name === nameB);
  resultEl.innerHTML = "";
  if (!buildA || !buildB) return;

  const statsA = statsForBuild(buildA);
  const statsB = statsForBuild(buildB);

  const labels = new Set([...statsA.keys(), ...statsB.keys()]);
  const entries = [...labels].filter(l => !isWeaponEffect(l)).map(label => [label, statsA.get(label) || 0, statsB.get(label) || 0]);
  const filtered = entries.filter(([, a, b]) => a !== 0 || b !== 0);
  const sorted = sortStatEntries(filtered);

  const header = document.createElement("div");
  header.className = "compare-header-row";
  header.innerHTML = `<span>Statistique</span><span>${escapeHtml(buildA.name)}</span><span>${escapeHtml(buildB.name)}</span>`;
  resultEl.appendChild(header);

  if (sorted.length === 0) {
    resultEl.innerHTML += '<div class="stat-empty">Aucune statistique à comparer.</div>';
    return;
  }

  const cellClass = (v, other) => v > other ? "compare-pos" : v < other ? "compare-neg" : "compare-eq";
  const fmt = (v) => (v >= 0 ? "+" : "") + v;
  for (const [label, valueA, valueB] of sorted) {
    const row = document.createElement("div");
    row.className = "compare-row";
    row.innerHTML = `<span>${escapeHtml(label)}</span><span class="${cellClass(valueA, valueB)}">${fmt(valueA)}</span><span class="${cellClass(valueB, valueA)}">${fmt(valueB)}</span>`;
    resultEl.appendChild(row);
  }
}

// ---------- Paperdoll ----------

function renderPaperdoll() {
  const root = document.getElementById("paperdoll");
  root.innerHTML = "";

  const mainSlots = UI_SLOTS.filter(s => s.group !== "dofus");
  const dofusSlots = UI_SLOTS.filter(s => s.group === "dofus");

  for (const uiSlot of mainSlots) root.appendChild(renderSlotEl(uiSlot));

  const label = document.createElement("div");
  label.className = "paperdoll-section-label";
  label.textContent = "Dofus";
  root.appendChild(label);

  const dofusWrap = document.createElement("div");
  dofusWrap.className = "paperdoll-dofus";
  for (const uiSlot of dofusSlots) dofusWrap.appendChild(renderSlotEl(uiSlot));
  root.appendChild(dofusWrap);
}

function unequipSlot(uiSlotId) {
  delete equipped[uiSlotId];
  delete rollOverrides[uiSlotId];
  delete forgemagie[uiSlotId];
  saveEquipped();
  saveCustomization();
}

function renderSlotEl(uiSlot) {
  const item = equipped[uiSlot.id];
  const el = document.createElement("div");
  el.className = "slot" + (item ? " filled" : "") + (activeUiSlot === uiSlot.id ? " selected" : "");
  el.title = item ? item.name : uiSlot.label;

  el.appendChild(itemIconEl(item, uiSlot.icon, "icon"));

  if (item && forgemagie[uiSlot.id] && forgemagie[uiSlot.id].length > 0) {
    const fmBadge = document.createElement("span");
    fmBadge.className = "fm-badge";
    fmBadge.textContent = "🔥";
    fmBadge.title = "Forgemagie appliquée";
    el.appendChild(fmBadge);
  }

  if (item) {
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = item.name;
    el.appendChild(name);

    const level = document.createElement("div");
    level.className = "item-level";
    level.textContent = "Nv. " + item.level;
    el.appendChild(level);

    if (item.itemSetId && item.itemSetId > 0 && SETS_BY_ID.has(item.itemSetId)) {
      const setBtn = document.createElement("button");
      setBtn.className = "slot-set-btn";
      setBtn.type = "button";
      setBtn.textContent = "Panoplie";
      setBtn.title = "Voir la panoplie";
      setBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openSetPreview(item.itemSetId);
      });
      el.appendChild(setBtn);
    }

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "✎";
    editBtn.title = "Régler le jet / la forgemagie";
    editBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openItemDetail(uiSlot.id);
    });
    el.appendChild(editBtn);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Retirer";
    removeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      unequipSlot(uiSlot.id);
      renderPaperdoll();
      renderStats();
      if (activeUiSlot === uiSlot.id) closeSidePanel();
    });
    el.appendChild(removeBtn);
  } else {
    const lbl = document.createElement("div");
    lbl.className = "label";
    lbl.textContent = uiSlot.label;
    el.appendChild(lbl);
  }

  el.addEventListener("click", () => openBrowser(uiSlot.id));
  return el;
}

// ---------- Side panel (item browser / item detail) ----------

function showSidePanel(which) {
  document.getElementById("browserEmpty").classList.toggle("hidden", which !== "empty");
  document.getElementById("browserContent").classList.toggle("hidden", which !== "list");
  document.getElementById("detailContent").classList.toggle("hidden", which !== "detail");
  document.getElementById("setsBrowserContent").classList.toggle("hidden", which !== "sets");
}

function closeSidePanel() {
  activeUiSlot = null;
  showSidePanel("empty");
  renderPaperdoll();
}

function openBrowser(uiSlotId, category) {
  const uiSlot = UI_SLOTS.find(s => s.id === uiSlotId);
  const choices = SLOT_CATEGORY_CHOICES[uiSlot.dataSlot];
  if (choices && !category) {
    openCategoryPicker(uiSlot, choices);
    return;
  }
  activeUiSlot = uiSlotId;
  activeCategory = category || uiSlot.dataSlot;
  showSidePanel("list");
  document.getElementById("browserTitle").textContent = CATEGORY_LABELS[activeCategory] || uiSlot.label;
  document.getElementById("searchInput").value = "";
  document.getElementById("levelMinInput").value = "";
  document.getElementById("levelMaxInput").value = getCharLevel();
  document.getElementById("sortSelect").value = "level-desc";
  renderItemList();
  renderCurrentlyEquipped();
  renderPaperdoll();
}

// Shows the item currently equipped in the browsed slot next to the browser title,
// so it's easy to compare against while scrolling alternatives. Not shown for the
// dofus/trophée group since there are 6 slots and no single one to compare against.
function renderCurrentlyEquipped() {
  const el = document.getElementById("currentlyEquipped");
  if (!el) return;
  const uiSlot = UI_SLOTS.find(s => s.id === activeUiSlot);
  const item = uiSlot && uiSlot.group !== "dofus" ? equipped[activeUiSlot] : null;

  if (!item) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }

  el.classList.remove("hidden");
  el.innerHTML = "";

  const label = document.createElement("div");
  label.className = "currently-equipped-label";
  label.textContent = "Actuellement équipé";
  el.appendChild(label);

  const card = document.createElement("div");
  card.className = "currently-equipped-card";
  card.appendChild(itemIconEl(item, "🎒", "item-icon"));

  const body = document.createElement("div");
  body.className = "currently-equipped-body";
  const name = document.createElement("div");
  name.className = "currently-equipped-name";
  name.textContent = `${item.name} (Nv. ${item.level})`;
  body.appendChild(name);
  if (item.effects && item.effects.length) {
    const eff = document.createElement("div");
    eff.className = "item-effects";
    eff.innerHTML = item.effects.map(effectHtml).join("");
    body.appendChild(eff);
  }
  card.appendChild(body);
  el.appendChild(card);
}

function openCategoryPicker(uiSlot, choices) {
  document.getElementById("categoryPickerTitle").textContent = uiSlot.label;
  const body = document.getElementById("categoryPickerBody");
  body.innerHTML = "";
  for (const choice of choices) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-choice-btn";
    btn.innerHTML = `<span class="category-choice-icon">${choice.icon}</span><span>${escapeHtml(choice.label)}</span>`;
    btn.addEventListener("click", () => {
      closeCategoryPicker();
      openBrowser(uiSlot.id, choice.key);
    });
    body.appendChild(btn);
  }
  document.getElementById("categoryPickerOverlay").classList.remove("hidden");
}

function closeCategoryPicker() {
  document.getElementById("categoryPickerOverlay").classList.add("hidden");
}

function renderItemList() {
  if (!activeUiSlot || document.getElementById("browserContent").classList.contains("hidden")) return;
  const listEl = document.getElementById("itemList");
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const sort = document.getElementById("sortSelect").value;
  const charLevel = getCharLevel();
  const levelMin = parseInt(document.getElementById("levelMinInput").value, 10);
  const levelMax = parseInt(document.getElementById("levelMaxInput").value, 10);

  let list;
  if (activeCategory === "trophee") list = (ITEMS_BY_SLOT.get("dofus") || []).filter(i => i.typeId === TROPHEE_TYPE_ID);
  else if (activeCategory === "dofus") list = (ITEMS_BY_SLOT.get("dofus") || []).filter(i => i.typeId !== TROPHEE_TYPE_ID);
  else list = (ITEMS_BY_SLOT.get(activeCategory) || []).slice();
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search));
  if (!isNaN(levelMin)) list = list.filter(i => i.level >= levelMin);
  if (!isNaN(levelMax)) list = list.filter(i => i.level <= levelMax);
  list = list.filter(itemMatchesStatFilters);

  if (sort === "level-asc") list.sort((a, b) => a.level - b.level);
  else if (sort === "level-desc") list.sort((a, b) => b.level - a.level);
  else list.sort((a, b) => a.name.localeCompare(b.name));

  listEl.innerHTML = "";
  if (list.length === 0) {
    listEl.innerHTML = '<div class="stat-empty">Aucun objet trouvé.</div>';
    return;
  }

  const equippedItem = equipped[activeUiSlot];
  const frag = document.createDocumentFragment();
  for (const item of list) {
    frag.appendChild(renderItemCard(item, equippedItem && equippedItem.id === item.id, charLevel));
  }
  listEl.appendChild(frag);
}

function renderItemCard(item, isEquipped, charLevel) {
  const card = document.createElement("div");
  card.className = "item-card" + (isEquipped ? " equipped" : "") + (item.level > charLevel ? " over-level" : "");

  const row = document.createElement("div");
  row.className = "item-card-row";
  row.appendChild(itemIconEl(item, "🎒", "item-icon"));

  const body = document.createElement("div");
  body.className = "item-card-body";

  const head = document.createElement("div");
  head.className = "item-card-head";
  head.innerHTML = `<span class="name"></span><span class="level">Nv. ${item.level}</span>`;
  head.querySelector(".name").textContent = item.name;
  body.appendChild(head);

  if (item.effects && item.effects.length) {
    const eff = document.createElement("div");
    eff.className = "item-effects";
    eff.innerHTML = item.effects.map(effectHtml).join("");
    body.appendChild(eff);
  }

  if (item.weaponRange !== undefined || item.apCost !== undefined) {
    const w = document.createElement("div");
    w.className = "item-effects";
    const bits = [];
    if (item.apCost !== undefined) bits.push(`${item.apCost} PA`);
    if (item.minRange !== undefined && item.weaponRange !== undefined) {
      bits.push(item.minRange === item.weaponRange ? `Portée ${item.weaponRange}` : `Portée ${item.minRange}-${item.weaponRange}`);
    }
    if (item.criticalHitProbability) bits.push(`Critique 1/${item.criticalHitProbability}`);
    w.textContent = bits.join(" · ");
    body.appendChild(w);
  }

  if (item.conditions && item.conditions.length) {
    const cond = document.createElement("div");
    cond.className = "item-conditions";
    cond.textContent = "Cond. : " + item.conditions.map(formatCondition).join(", ");
    body.appendChild(cond);
  }

  row.appendChild(body);
  card.appendChild(row);

  if (item.itemSetId && item.itemSetId > 0) {
    const set = SETS_BY_ID.get(item.itemSetId);
    if (set) {
      const setRow = document.createElement("div");
      setRow.className = "set-badge";
      const setLabel = document.createElement("span");
      setLabel.textContent = `📦 ${set.name} (${set.itemIds.length} pièces)`;
      setRow.appendChild(setLabel);

      const actions = document.createElement("div");
      actions.className = "set-badge-actions";

      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.className = "secondary";
      previewBtn.textContent = "Panoplie";
      previewBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openSetPreview(item.itemSetId);
      });
      actions.appendChild(previewBtn);

      const setBtn = document.createElement("button");
      setBtn.type = "button";
      setBtn.textContent = "Équiper la panoplie";
      setBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        equipEntireSet(item.itemSetId);
      });
      actions.appendChild(setBtn);

      setRow.appendChild(actions);
      card.appendChild(setRow);
    }
  }

  card.addEventListener("click", () => {
    const targetSlot = resolveEquipTargetSlot(activeUiSlot);
    unequipSlot(targetSlot);
    equipped[targetSlot] = item;
    saveEquipped();
    renderPaperdoll();
    renderItemList();
    renderCurrentlyEquipped();
    renderStats();
  });

  return card;
}

// For grouped slots (the 6 dofus/trophée slots), equipping a new item while the
// clicked slot is already filled goes to the next empty slot in the group instead
// of overwriting it - only falls back to overwriting once the whole group is full.
function resolveEquipTargetSlot(uiSlotId) {
  const uiSlot = UI_SLOTS.find(s => s.id === uiSlotId);
  if (uiSlot.group && equipped[uiSlotId]) {
    const groupSlotIds = UI_SLOTS.filter(s => s.group === uiSlot.group).map(s => s.id);
    const emptySlot = groupSlotIds.find(id => !equipped[id]);
    if (emptySlot) return emptySlot;
  }
  return uiSlotId;
}

// ---------- Item detail (roll + forgemagie editor) ----------

function openItemDetail(uiSlotId) {
  if (!equipped[uiSlotId]) return;
  activeUiSlot = uiSlotId;
  showSidePanel("detail");
  renderDetail(uiSlotId);
  renderPaperdoll();
}

function renderDetail(uiSlotId) {
  const item = equipped[uiSlotId];
  if (!item) { closeSidePanel(); return; }
  const uiSlot = UI_SLOTS.find(s => s.id === uiSlotId);

  const titleEl = document.getElementById("detailTitle");
  titleEl.innerHTML = "";
  const titleIcon = itemIconEl(item, uiSlot.icon, "detail-title-icon");
  titleEl.appendChild(titleIcon);
  const titleText = document.createElement("span");
  titleText.textContent = `${uiSlot.label} — ${item.name}`;
  titleEl.appendChild(titleText);

  const body = document.getElementById("detailBody");
  body.innerHTML = "";

  const effSection = document.createElement("div");
  effSection.className = "detail-section";
  effSection.innerHTML = "<h3>Effets de l'objet (jet)</h3>";

  const effects = item.effects || [];
  if (effects.length === 0) {
    const none = document.createElement("div");
    none.className = "stat-empty";
    none.textContent = "Cet objet n'a pas d'effet.";
    effSection.appendChild(none);
  }

  effects.forEach((effect, idx) => {
    const isRanged = effect.min !== undefined && effect.max !== undefined && effect.min !== effect.max;
    const row = document.createElement("div");

    if (isRanged) {
      row.className = "roll-row";
      const stored = rollOverrides[uiSlotId] && rollOverrides[uiSlotId][idx];
      const defaultVal = stored !== undefined ? stored : effect.max;

      const labelSpan = document.createElement("span");
      labelSpan.className = "roll-label";
      labelSpan.textContent = stripSign(effect.label) + " ";
      const rangeSpan = document.createElement("span");
      rangeSpan.className = "roll-range";
      rangeSpan.textContent = `(${effect.min} à ${effect.max})`;
      labelSpan.appendChild(rangeSpan);
      row.appendChild(labelSpan);

      const input = document.createElement("input");
      input.type = "number";
      input.min = effect.min;
      input.max = effect.max;
      input.value = defaultVal;
      input.addEventListener("change", () => {
        let v = parseInt(input.value, 10);
        if (isNaN(v)) v = defaultVal;
        v = Math.min(effect.max, Math.max(effect.min, v));
        input.value = v;
        if (!rollOverrides[uiSlotId]) rollOverrides[uiSlotId] = {};
        rollOverrides[uiSlotId][idx] = v;
        saveCustomization();
        renderStats();
      });
      row.appendChild(input);
    } else {
      row.className = "fixed-effect-row";
      row.textContent = effectPlainText(effect);
    }
    effSection.appendChild(row);
  });
  body.appendChild(effSection);

  const fmSection = document.createElement("div");
  fmSection.className = "detail-section";
  fmSection.innerHTML = "<h3>Forgemagie</h3>";

  const fmList = document.createElement("div");
  fmList.className = "fm-list";
  (forgemagie[uiSlotId] || []).forEach((fm, idx) => {
    const row = document.createElement("div");
    row.className = "fm-row";
    const span = document.createElement("span");
    span.textContent = `${fm.value >= 0 ? "+" : ""}${fm.value} ${fm.label}`;
    row.appendChild(span);
    const rm = document.createElement("button");
    rm.textContent = "×";
    rm.title = "Retirer cet effet";
    rm.addEventListener("click", () => {
      forgemagie[uiSlotId].splice(idx, 1);
      saveCustomization();
      renderDetail(uiSlotId);
      renderPaperdoll();
      renderStats();
    });
    row.appendChild(rm);
    fmList.appendChild(row);
  });
  if (!(forgemagie[uiSlotId] || []).length) {
    const none = document.createElement("div");
    none.className = "stat-empty";
    none.textContent = "Aucun effet de forgemagie ajouté.";
    fmList.appendChild(none);
  }
  fmSection.appendChild(fmList);

  const addRow = document.createElement("div");
  addRow.className = "fm-add-row";
  const labelInput = document.createElement("input");
  labelInput.setAttribute("list", "fmCatalogList");
  labelInput.placeholder = "Caractéristique (ex. Vitalité)";
  const valueInput = document.createElement("input");
  valueInput.type = "number";
  valueInput.placeholder = "Valeur";
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "+ Ajouter";
  addBtn.addEventListener("click", () => {
    const label = labelInput.value.trim();
    const value = parseInt(valueInput.value, 10);
    if (!label || isNaN(value) || value === 0) return;
    if (!forgemagie[uiSlotId]) forgemagie[uiSlotId] = [];
    forgemagie[uiSlotId].push({ label, value });
    saveCustomization();
    labelInput.value = "";
    valueInput.value = "";
    renderDetail(uiSlotId);
    renderPaperdoll();
    renderStats();
  });
  addRow.appendChild(labelInput);
  addRow.appendChild(valueInput);
  addRow.appendChild(addBtn);
  fmSection.appendChild(addRow);
  body.appendChild(fmSection);
}

function effectPlainText(effect) {
  const negative = effect.operator === "-";
  const sign = negative ? "-" : "+";
  return `${sign}${effectValueText(effect)} ${stripSign(effect.label)}`;
}

function effectValueText(effect) {
  if (effect.min !== undefined && effect.max !== undefined && effect.min !== effect.max) {
    return `${effect.min} à ${effect.max}`;
  }
  const v = effect.value !== undefined ? effect.value : (effect.min !== undefined ? effect.min : effect.max);
  return v !== undefined ? String(v) : "";
}

function effectHtml(effect) {
  // Weapon "lost AP" effect: shown as "-1 PA" (matching what it actually does to the
  // target) rather than the raw "+1 (Retrait PA)" the underlying label/operator imply.
  if (effect.label === "(Retrait PA)") {
    return `<span class="eff weapon">-${effectValueText(effect)} PA</span>`;
  }
  const negative = effect.operator === "-";
  const cls = isWeaponEffect(effect.label) ? "weapon" : (negative ? "neg" : "pos");
  let label = stripSign(effect.label);
  // Blue weapon-roll labels are always parenthesized ("(dommages Terre)", "(vol Feu)",
  // "(PV rendus)") to drive isWeaponEffect() detection - the parens aren't needed once
  // the blue color already marks them as distinct from real characteristics.
  if (cls === "weapon" && label.startsWith("(") && label.endsWith(")")) {
    label = label.slice(1, -1);
  }
  const valueText = effectValueText(effect);
  const sign = negative ? "-" : "+";
  return `<span class="eff ${cls}">${sign}${valueText} ${escapeHtml(label)}</span>`;
}

/** Raw weapon damage/steal/heal-return rolls, e.g. "(dommages Air)", "(vol Terre)", "(PV rendus)" - Category=2 in the game data, always parenthesized. */
function isWeaponEffect(label) {
  return (label || "").trim().startsWith("(");
}

function stripSign(label) {
  return (label || "").replace(/^[+\-]\s*/, "").trim();
}

/** "PO" (Objet possédé) conditions reference another item by id - resolve that to its name instead of showing the raw id. */
function formatCondition(c) {
  if (c.code === "PO") {
    const refItem = ITEMS_BY_ID.get(parseInt(c.value, 10));
    const itemName = refItem ? refItem.name : `objet #${c.value}`;
    if (c.operator === "!") return `Ne pas être équipé de ${itemName}`;
    if (c.operator === "=") return `Être équipé de ${itemName}`;
  }
  return `${c.label} ${c.operator} ${c.value}`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Builds an <img> for the item's icon, falling back to an emoji glyph if the icon is missing or fails to load. */
function itemIconEl(item, fallbackGlyph, className) {
  if (!item || !item.iconId) {
    const span = document.createElement("span");
    span.className = className + " icon-fallback";
    span.textContent = fallbackGlyph;
    return span;
  }
  const img = document.createElement("img");
  img.className = className;
  img.src = `icons/${item.iconId}.png`;
  img.alt = "";
  img.addEventListener("error", () => {
    const span = document.createElement("span");
    span.className = className + " icon-fallback";
    span.textContent = fallbackGlyph;
    img.replaceWith(span);
  });
  return img;
}

// ---------- Panoplie ----------

function equipEntireSet(setId) {
  const set = SETS_BY_ID.get(setId);
  if (!set) return;

  const usedThisPass = new Set();
  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    const candidates = UI_SLOTS.filter(s => s.dataSlot === dataSlotForItem(item)).map(s => s.id);
    if (candidates.length === 0) continue;

    let target = candidates.find(id => !equipped[id] && !usedThisPass.has(id));
    if (!target) target = candidates.find(id => !usedThisPass.has(id)) || candidates[0];
    usedThisPass.add(target);

    unequipSlot(target);
    equipped[target] = item;
  }

  saveEquipped();
  renderPaperdoll();
  renderStats();
  if (activeUiSlot) {
    if (!document.getElementById("detailContent").classList.contains("hidden")) {
      if (equipped[activeUiSlot]) renderDetail(activeUiSlot);
      else closeSidePanel();
    } else {
      renderItemList();
    }
  }
}

function openSetPreview(setId) {
  const set = SETS_BY_ID.get(setId);
  if (!set) return;

  document.getElementById("setModalTitle").textContent = set.name;
  const body = document.getElementById("setModalBody");
  body.innerHTML = "";

  const itemsSection = document.createElement("div");
  itemsSection.className = "modal-section";
  itemsSection.innerHTML = `<h3>Objets (${set.itemIds.length} pièces)</h3>`;
  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    const row = document.createElement("div");
    row.className = "set-item-row";
    row.appendChild(itemIconEl(item, "🎒", "item-icon"));
    const name = document.createElement("span");
    name.className = "set-item-name";
    name.textContent = item.name;
    row.appendChild(name);
    const level = document.createElement("span");
    level.className = "set-item-level";
    level.textContent = `Nv. ${item.level}`;
    row.appendChild(level);
    const equipBtn = document.createElement("button");
    equipBtn.type = "button";
    equipBtn.className = "equip-item-btn";
    equipBtn.textContent = "Équiper";
    equipBtn.addEventListener("click", () => {
      equipSingleItem(item);
      openSetPreview(setId);
    });
    row.appendChild(equipBtn);
    itemsSection.appendChild(row);
  }
  body.appendChild(itemsSection);

  const bonusSection = document.createElement("div");
  bonusSection.className = "modal-section";
  bonusSection.innerHTML = "<h3>Bonus par nombre de pièces équipées</h3>";
  (set.bonuses || []).forEach((tierEffects, idx) => {
    const count = idx + 1;
    if (count < 2) return; // 1 piece never grants a set bonus
    const tier = document.createElement("div");
    tier.className = "set-tier";
    const title = document.createElement("div");
    title.className = "set-tier-title";
    title.textContent = `${count} pièces`;
    tier.appendChild(title);

    if (tierEffects && tierEffects.length > 0) {
      const eff = document.createElement("div");
      eff.className = "item-effects";
      eff.innerHTML = tierEffects.map(effectHtml).join("");
      tier.appendChild(eff);
    } else {
      const none = document.createElement("div");
      none.className = "stat-empty";
      none.textContent = "Pas de bonus à ce nombre de pièces.";
      tier.appendChild(none);
    }
    bonusSection.appendChild(tier);
  });
  body.appendChild(bonusSection);

  const equipAllBtn = document.createElement("button");
  equipAllBtn.type = "button";
  equipAllBtn.className = "set-card-equip-all";
  equipAllBtn.textContent = "Équiper la panoplie entière";
  equipAllBtn.addEventListener("click", () => {
    equipEntireSet(setId);
    openSetPreview(setId);
  });
  body.appendChild(equipAllBtn);

  document.getElementById("setModalOverlay").classList.remove("hidden");
}

function closeSetPreview() {
  document.getElementById("setModalOverlay").classList.add("hidden");
}

// ---------- Sets browser ----------

function computeSetFlags(set) {
  const bonusLabels = new Set();
  for (const tier of set.bonuses || []) for (const eff of tier) bonusLabels.add(stripSign(eff.label));

  const itemLabels = new Set();
  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    for (const eff of item.effects || []) itemLabels.add(stripSign(eff.label));
  }

  const force = itemLabels.has("Force");
  const intelligence = itemLabels.has("Intelligence");
  const chance = itemLabels.has("Chance");
  const agilite = itemLabels.has("Agilité");

  return {
    pa: bonusLabels.has("PA"),
    pm: bonusLabels.has("PM"),
    force,
    intelligence,
    chance,
    agilite,
    autre: !force && !intelligence && !chance && !agilite,
  };
}

function computeSetMaxLevel(set) {
  let max = 0;
  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (item && item.level > max) max = item.level;
  }
  return max;
}

function getEffectComparableValue(effect) {
  const sign = effect.operator === "-" ? -1 : 1;
  let raw;
  if (effect.value !== undefined) raw = effect.value;
  else if (effect.max !== undefined) raw = effect.max;
  else if (effect.min !== undefined) raw = effect.min;
  else raw = 0;
  return sign * raw;
}

function populateStatFilterSelect() {
  const select = document.getElementById("statFilterSelect");
  const options = sortStatEntries(EFFECT_LABELS.filter(l => !isWeaponEffect(l)).map(l => [l])).map(([l]) => l);
  select.innerHTML = options.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
}

function addStatFilter() {
  const stat = document.getElementById("statFilterSelect").value;
  const valueInput = document.getElementById("statFilterValue");
  const minValue = parseInt(valueInput.value, 10) || 0;
  if (!stat) return;

  const existingIdx = activeStatFilters.findIndex(f => f.stat === stat);
  if (existingIdx >= 0) activeStatFilters[existingIdx].minValue = minValue;
  else activeStatFilters.push({ stat, minValue });

  renderActiveStatFilters();
  renderItemList();
}

function removeStatFilter(stat) {
  activeStatFilters = activeStatFilters.filter(f => f.stat !== stat);
  renderActiveStatFilters();
  renderItemList();
}

function renderActiveStatFilters() {
  const container = document.getElementById("activeStatFilters");
  container.innerHTML = "";
  for (const f of activeStatFilters) {
    const chip = document.createElement("span");
    chip.className = "stat-filter-chip";
    const label = document.createElement("span");
    label.textContent = `${f.stat} ≥ `;
    chip.appendChild(label);
    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.className = "stat-filter-chip-value";
    valueInput.value = f.minValue;
    valueInput.addEventListener("input", () => {
      const v = parseInt(valueInput.value, 10);
      f.minValue = isNaN(v) ? 0 : v;
      renderItemList();
    });
    chip.appendChild(valueInput);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.title = "Retirer ce filtre";
    rm.addEventListener("click", () => removeStatFilter(f.stat));
    chip.appendChild(rm);
    container.appendChild(chip);
  }
}

/** An item matches only if EVERY active characteristic filter is satisfied by one of its own effects. */
function itemMatchesStatFilters(item) {
  if (activeStatFilters.length === 0) return true;
  return activeStatFilters.every(({ stat, minValue }) =>
    (item.effects || []).some(eff => stripSign(eff.label) === stat && getEffectComparableValue(eff) >= minValue)
  );
}

function renderSetsFilterChips() {
  const row = document.getElementById("setsFilterRow");
  row.innerHTML = "";
  for (const def of SET_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (activeSetFilters.has(def.key)) activeSetFilters.delete(def.key);
      else activeSetFilters.add(def.key);
      chip.classList.toggle("active", activeSetFilters.has(def.key));
      renderSetsList();
    });
    row.appendChild(chip);
  }
}

function renderSetsSlotTypeFilterChips() {
  const row = document.getElementById("setsSlotFilterRow");
  if (!row) return;
  row.innerHTML = "";
  for (const def of SLOT_TYPE_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (activeSlotTypeFilters.has(def.key)) activeSlotTypeFilters.delete(def.key);
      else activeSlotTypeFilters.add(def.key);
      chip.classList.toggle("active", activeSlotTypeFilters.has(def.key));
      renderSetsList();
    });
    row.appendChild(chip);
  }
}

/** A set matches only if it contains at least one item for EVERY active slot-type filter. */
function setMatchesSlotTypeFilters(set) {
  if (activeSlotTypeFilters.size === 0) return true;
  return [...activeSlotTypeFilters].every(slot =>
    set.itemIds.some(id => {
      const item = ITEMS_BY_ID.get(id);
      return item && item.slot === slot;
    })
  );
}

// ---------- Compatible panoplies (wearable together) ----------

function computeSetSlotTypes(set) {
  const types = new Set();
  for (const id of set.itemIds) {
    const item = ITEMS_BY_ID.get(id);
    if (item) types.add(item.slot);
  }
  return types;
}

/**
 * Two panoplies are "compatible" if their equipment slots don't clash - you can't
 * wear two coiffes at once, but the 2 anneau slots mean a ring type on both sides
 * never counts as a conflict. "full" = zero conflicting slot types; "partial" = at
 * least one conflict but still 2+ slot types that aren't shared between the two.
 */
function classifySetCompatibility(setA, setB) {
  const typesA = computeSetSlotTypes(setA);
  const typesB = computeSetSlotTypes(setB);
  const conflicting = [...typesA].filter(t => t !== "anneau" && typesB.has(t));
  const nonCommon = new Set([...typesA, ...typesB].filter(t => !(typesA.has(t) && typesB.has(t))));
  if (conflicting.length === 0) return "full";
  if (nonCommon.size >= 2) return "partial";
  return "none";
}

function openCompatibleSetsModal(setId) {
  const refSet = SETS_BY_ID.get(setId);
  if (!refSet) return;
  document.getElementById("compatibleSetsTitle").textContent = `Panoplies compatibles avec ${refSet.name}`;

  const candidates = [...SETS_BY_ID.values()].filter(s => s.id !== setId && s.itemIds.length > 0);
  const partial = [], full = [];
  for (const s of candidates) {
    const cls = classifySetCompatibility(refSet, s);
    if (cls === "partial") partial.push(s);
    else if (cls === "full") full.push(s);
  }

  const partialCol = document.getElementById("compatiblePartialColumn");
  partialCol.innerHTML = "";
  partialCol.appendChild(buildSetFilterPanel(`Partiellement compatibles (${partial.length})`, partial));

  const fullCol = document.getElementById("compatibleFullColumn");
  fullCol.innerHTML = "";
  fullCol.appendChild(buildSetFilterPanel(`Totalement compatibles (${full.length})`, full));

  document.getElementById("compatibleSetsModalOverlay").classList.remove("hidden");
}

function closeCompatibleSetsModal() {
  document.getElementById("compatibleSetsModalOverlay").classList.add("hidden");
}

/** Builds a self-contained mini panoplie browser (search/sort/level range/filter chips
 * + results) over a fixed candidate list, with its own local filter state - used to
 * give each column of the compatible-panoplies modal the same filters as the main
 * panoplie search, independently of each other. */
function buildSetFilterPanel(title, candidateSets) {
  const root = document.createElement("div");
  root.className = "compatible-panel";

  const heading = document.createElement("h3");
  heading.textContent = title;
  root.appendChild(heading);

  const controls = document.createElement("div");
  controls.className = "browser-controls";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Rechercher une panoplie...";
  const sortSelect = document.createElement("select");
  sortSelect.innerHTML = `
    <option value="level-asc">Niveau croissant</option>
    <option value="level-desc" selected>Niveau décroissant</option>
    <option value="name-asc">Nom (A-Z)</option>`;
  controls.appendChild(searchInput);
  controls.appendChild(sortSelect);
  root.appendChild(controls);

  const levelRow = document.createElement("div");
  levelRow.className = "level-range-row";
  const levelMinInput = document.createElement("input");
  levelMinInput.type = "number";
  levelMinInput.placeholder = "Min";
  const levelMaxInput = document.createElement("input");
  levelMaxInput.type = "number";
  levelMaxInput.placeholder = "Max";
  const minLabel = document.createElement("label");
  minLabel.textContent = "Niv. min ";
  minLabel.appendChild(levelMinInput);
  const maxLabel = document.createElement("label");
  maxLabel.textContent = "Niv. max ";
  maxLabel.appendChild(levelMaxInput);
  levelRow.appendChild(minLabel);
  levelRow.appendChild(maxLabel);
  root.appendChild(levelRow);

  const activeBonusFilters = new Set();
  const bonusFilterRow = document.createElement("div");
  bonusFilterRow.className = "sets-filter-row";
  for (const def of SET_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (activeBonusFilters.has(def.key)) activeBonusFilters.delete(def.key);
      else activeBonusFilters.add(def.key);
      chip.classList.toggle("active", activeBonusFilters.has(def.key));
      rerender();
    });
    bonusFilterRow.appendChild(chip);
  }
  root.appendChild(bonusFilterRow);

  const slotLabel = document.createElement("div");
  slotLabel.className = "sets-filter-label";
  slotLabel.textContent = "Contient au moins un(e) :";
  root.appendChild(slotLabel);

  const activeSlotFilters = new Set();
  const slotFilterRow = document.createElement("div");
  slotFilterRow.className = "sets-filter-row";
  for (const def of SLOT_TYPE_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (activeSlotFilters.has(def.key)) activeSlotFilters.delete(def.key);
      else activeSlotFilters.add(def.key);
      chip.classList.toggle("active", activeSlotFilters.has(def.key));
      rerender();
    });
    slotFilterRow.appendChild(chip);
  }
  root.appendChild(slotFilterRow);

  const listEl = document.createElement("div");
  listEl.className = "item-list";
  root.appendChild(listEl);

  function rerender() {
    const search = searchInput.value.trim().toLowerCase();
    const sort = sortSelect.value;
    const levelMin = parseInt(levelMinInput.value, 10);
    const levelMax = parseInt(levelMaxInput.value, 10);

    let sets = candidateSets.slice();
    if (search) sets = sets.filter(s => s.name.toLowerCase().includes(search));
    if (!isNaN(levelMin)) sets = sets.filter(s => SET_MAX_LEVEL.get(s.id) >= levelMin);
    if (!isNaN(levelMax)) sets = sets.filter(s => SET_MAX_LEVEL.get(s.id) <= levelMax);
    if (activeBonusFilters.size > 0) {
      sets = sets.filter(s => {
        const flags = SET_FLAGS.get(s.id);
        return flags && [...activeBonusFilters].every(key => flags[key]);
      });
    }
    if (activeSlotFilters.size > 0) {
      sets = sets.filter(s => [...activeSlotFilters].every(slot =>
        s.itemIds.some(id => {
          const item = ITEMS_BY_ID.get(id);
          return item && item.slot === slot;
        })
      ));
    }
    if (sort === "level-asc") sets.sort((a, b) => SET_MAX_LEVEL.get(a.id) - SET_MAX_LEVEL.get(b.id));
    else if (sort === "level-desc") sets.sort((a, b) => SET_MAX_LEVEL.get(b.id) - SET_MAX_LEVEL.get(a.id));
    else sets.sort((a, b) => a.name.localeCompare(b.name));

    listEl.innerHTML = "";
    if (sets.length === 0) {
      listEl.innerHTML = '<div class="stat-empty">Aucune panoplie trouvée.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    for (const set of sets) frag.appendChild(renderSetCard(set));
    listEl.appendChild(frag);
  }

  searchInput.addEventListener("input", rerender);
  sortSelect.addEventListener("change", rerender);
  levelMinInput.addEventListener("input", rerender);
  levelMaxInput.addEventListener("input", rerender);

  rerender();
  return root;
}

function openSetsBrowser() {
  activeUiSlot = null;
  showSidePanel("sets");
  document.getElementById("setsSearchInput").value = "";
  document.getElementById("setsLevelMinInput").value = "";
  document.getElementById("setsLevelMaxInput").value = getCharLevel();
  document.getElementById("setsSortSelect").value = "level-desc";
  renderPaperdoll();
  renderSetsList();
}

function renderSetsList() {
  const listEl = document.getElementById("setsList");
  const search = document.getElementById("setsSearchInput").value.trim().toLowerCase();
  const sort = document.getElementById("setsSortSelect").value;

  const levelMin = parseInt(document.getElementById("setsLevelMinInput").value, 10);
  const levelMax = parseInt(document.getElementById("setsLevelMaxInput").value, 10);

  let sets = [...SETS_BY_ID.values()].filter(s => s.itemIds.length > 0);
  if (search) sets = sets.filter(s => s.name.toLowerCase().includes(search));
  if (!isNaN(levelMin)) sets = sets.filter(s => SET_MAX_LEVEL.get(s.id) >= levelMin);
  if (!isNaN(levelMax)) sets = sets.filter(s => SET_MAX_LEVEL.get(s.id) <= levelMax);
  if (activeSetFilters.size > 0) {
    sets = sets.filter(s => {
      const flags = SET_FLAGS.get(s.id);
      return flags && [...activeSetFilters].every(key => flags[key]);
    });
  }
  sets = sets.filter(setMatchesSlotTypeFilters);
  if (sort === "level-asc") sets.sort((a, b) => SET_MAX_LEVEL.get(a.id) - SET_MAX_LEVEL.get(b.id));
  else if (sort === "level-desc") sets.sort((a, b) => SET_MAX_LEVEL.get(b.id) - SET_MAX_LEVEL.get(a.id));
  else sets.sort((a, b) => a.name.localeCompare(b.name));

  listEl.innerHTML = "";
  if (sets.length === 0) {
    listEl.innerHTML = '<div class="stat-empty">Aucune panoplie trouvée.</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const set of sets) frag.appendChild(renderSetCard(set));
  listEl.appendChild(frag);
}

function renderSetCard(set) {
  const card = document.createElement("div");
  card.className = "set-card";

  const summary = document.createElement("div");
  summary.className = "set-card-summary";

  const header = document.createElement("div");
  header.className = "set-card-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "set-card-title-group";
  titleGroup.innerHTML = `<span class="set-card-title"></span><span class="set-card-count">Nv. ${SET_MAX_LEVEL.get(set.id)} · ${set.itemIds.length} pièces</span>`;
  titleGroup.querySelector(".set-card-title").textContent = set.name;
  header.appendChild(titleGroup);

  const compatBtn = document.createElement("button");
  compatBtn.type = "button";
  compatBtn.className = "set-card-compat-btn";
  compatBtn.textContent = "Panoplies compatibles";
  compatBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openCompatibleSetsModal(set.id);
  });
  header.appendChild(compatBtn);

  summary.appendChild(header);

  const iconsRow = document.createElement("div");
  iconsRow.className = "set-card-icons";
  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    const icon = itemIconEl(item, "🎒", "item-icon");
    icon.title = item.name;
    iconsRow.appendChild(icon);
  }
  summary.appendChild(iconsRow);

  summary.addEventListener("click", () => card.classList.toggle("expanded"));
  card.appendChild(summary);

  const details = document.createElement("div");
  details.className = "set-card-details";

  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;

    const row = document.createElement("div");
    row.className = "set-item-row";
    row.appendChild(itemIconEl(item, "🎒", "item-icon"));

    const name = document.createElement("span");
    name.className = "set-item-name";
    name.textContent = item.name;
    row.appendChild(name);

    const level = document.createElement("span");
    level.className = "set-item-level";
    level.textContent = `Nv. ${item.level}`;
    row.appendChild(level);

    const equipBtn = document.createElement("button");
    equipBtn.type = "button";
    equipBtn.className = "equip-item-btn";
    equipBtn.textContent = "Équiper";
    equipBtn.addEventListener("click", () => equipSingleItem(item));
    row.appendChild(equipBtn);

    if (item.effects && item.effects.length) {
      const eff = document.createElement("div");
      eff.className = "set-item-effects";
      eff.innerHTML = item.effects.map(effectHtml).join(" · ");
      row.appendChild(eff);
    }

    details.appendChild(row);
  }

  (set.bonuses || []).forEach((tierEffects, idx) => {
    const count = idx + 1;
    if (count < 2) return; // 1 piece never grants a set bonus

    const tier = document.createElement("div");
    tier.className = "set-tier";
    const title = document.createElement("div");
    title.className = "set-tier-title";
    title.textContent = `${count} pièces`;
    tier.appendChild(title);

    if (tierEffects && tierEffects.length > 0) {
      const eff = document.createElement("div");
      eff.className = "item-effects";
      eff.innerHTML = tierEffects.map(effectHtml).join("");
      tier.appendChild(eff);
    } else {
      const none = document.createElement("div");
      none.className = "stat-empty";
      none.textContent = "Pas de bonus à ce nombre de pièces.";
      tier.appendChild(none);
    }
    details.appendChild(tier);
  });

  const equipAllBtn = document.createElement("button");
  equipAllBtn.type = "button";
  equipAllBtn.className = "set-card-equip-all";
  equipAllBtn.textContent = "Équiper la panoplie entière";
  equipAllBtn.addEventListener("click", () => equipEntireSet(set.id));
  details.appendChild(equipAllBtn);

  card.appendChild(details);
  return card;
}

function equipSingleItem(item) {
  const candidates = UI_SLOTS.filter(s => s.dataSlot === dataSlotForItem(item)).map(s => s.id);
  if (candidates.length === 0) return;

  const target = candidates.find(id => !equipped[id]) || candidates[0];
  unequipSlot(target);
  equipped[target] = item;

  saveEquipped();
  renderPaperdoll();
  renderStats();
}

// ---------- Personnage / Parchotage ----------

function computeBaseStats(level) {
  return {
    "PA": level < 100 ? 6 : 7,
    "PM": 3,
    "Vitalité": 55 + 5 * level,
  };
}

function renderBaseStats() {
  const base = computeBaseStats(getCharLevel());
  const el = document.getElementById("baseStatsContent");
  el.innerHTML = `
    <div class="stat-row"><span>PA de base</span><span>${base["PA"]}</span></div>
    <div class="stat-row"><span>PM de base</span><span>${base["PM"]}</span></div>
    <div class="stat-row"><span>Vitalité de base (PV)</span><span>${base["Vitalité"]}</span></div>
  `;
}

// ---------- Parchotage (free-form scroll points, no budget) ----------

function renderParchotageGrid() {
  const grid = document.getElementById("parchotageGrid");
  grid.innerHTML = "";
  for (const stat of PARCHOTAGE_STATS) {
    const field = document.createElement("label");
    field.className = "parchotage-field";
    const span = document.createElement("span");
    span.textContent = stat;
    const input = document.createElement("input");
    input.type = "number";
    input.value = parchotage[stat] || 0;
    input.addEventListener("input", () => {
      const v = parseInt(input.value, 10);
      parchotage[stat] = isNaN(v) ? 0 : v;
      saveCustomization();
      renderStats();
    });
    field.appendChild(span);
    field.appendChild(input);
    grid.appendChild(field);
  }
}

// ---------- Points de caractéristiques à répartir (level-based budget) ----------

function characteristicPointsBudget(level) {
  return Math.max(0, 5 * level - 5);
}

// In-game exchange rate: the number typed for each stat IS the stat value you'll
// get. What it costs out of the shared pool is what scales - Vitalité costs 1
// pool point per point, Sagesse costs 3, and the 4 elemental stats (Force/
// Intelligence/Chance/Agilité) get progressively more expensive per point as the
// stat value climbs past each 100-point tier (0-100: x1, 100-200: x2, 200-300:
// x3, 300+: x4) - e.g. 200 Agilité costs 100*1 + 100*2 = 300 pool points.
const CHARACTERISTIC_FLAT_RATES = { "Vitalité": 1, "Sagesse": 3 };
const ELEMENTAL_CHARACTERISTIC_STATS = new Set(["Force", "Intelligence", "Chance", "Agilité"]);
const ELEMENTAL_STAT_TIERS = [
  { span: 100, rate: 1 },
  { span: 100, rate: 2 },
  { span: 100, rate: 3 },
];
const ELEMENTAL_STAT_TIER_RATE_BEYOND = 4;

function statValueToPoolCost(stat, statValue) {
  const v = statValue || 0;
  if (v <= 0) return 0;
  if (CHARACTERISTIC_FLAT_RATES[stat]) return v * CHARACTERISTIC_FLAT_RATES[stat];
  if (!ELEMENTAL_CHARACTERISTIC_STATS.has(stat)) return v;

  let remaining = v;
  let cost = 0;
  for (const tier of ELEMENTAL_STAT_TIERS) {
    if (remaining <= 0) break;
    const used = Math.min(remaining, tier.span);
    cost += used * tier.rate;
    remaining -= used;
  }
  if (remaining > 0) cost += remaining * ELEMENTAL_STAT_TIER_RATE_BEYOND;
  return cost;
}

// Inverse of statValueToPoolCost: the highest stat value affordable with a given
// pool budget, used to clamp input as the user types past what's left.
function maxStatValueForPoolBudget(stat, budget) {
  const b = Math.max(0, budget || 0);
  if (CHARACTERISTIC_FLAT_RATES[stat]) return Math.floor(b / CHARACTERISTIC_FLAT_RATES[stat]);
  if (!ELEMENTAL_CHARACTERISTIC_STATS.has(stat)) return b;

  let remainingBudget = b;
  let value = 0;
  for (const tier of ELEMENTAL_STAT_TIERS) {
    const tierFullCost = tier.span * tier.rate;
    if (remainingBudget >= tierFullCost) {
      value += tier.span;
      remainingBudget -= tierFullCost;
    } else {
      value += remainingBudget / tier.rate;
      remainingBudget = 0;
      break;
    }
  }
  if (remainingBudget > 0) value += remainingBudget / ELEMENTAL_STAT_TIER_RATE_BEYOND;
  return Math.floor(value);
}

function updateCharacteristicPointsBudget() {
  const el = document.getElementById("pointsBudgetValue");
  if (!el) return;
  const budget = characteristicPointsBudget(getCharLevel());
  const spent = PARCHOTAGE_STATS.reduce((sum, s) => sum + statValueToPoolCost(s, characteristicPoints[s]), 0);
  const remaining = budget - spent;
  el.textContent = `${remaining} / ${budget}`;
  el.className = remaining < 0 ? "neg" : "pos";
}

function renderCharacteristicPointsGrid() {
  const grid = document.getElementById("pointsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const budgetRow = document.createElement("div");
  budgetRow.className = "parchotage-budget-row";
  budgetRow.innerHTML = '<span>Points à répartir</span><span id="pointsBudgetValue"></span>';
  grid.appendChild(budgetRow);

  for (const stat of PARCHOTAGE_STATS) {
    const field = document.createElement("label");
    field.className = "parchotage-field parchotage-field-points";
    const span = document.createElement("span");
    span.textContent = stat;
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.value = characteristicPoints[stat] || 0;
    const result = document.createElement("span");
    result.className = "parchotage-points-result";
    result.textContent = `coût : ${statValueToPoolCost(stat, characteristicPoints[stat] || 0)}`;
    input.addEventListener("input", () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      const budget = characteristicPointsBudget(getCharLevel());
      const spentOthers = PARCHOTAGE_STATS.filter(s => s !== stat).reduce((sum, s) => sum + statValueToPoolCost(s, characteristicPoints[s]), 0);
      const maxAllowed = maxStatValueForPoolBudget(stat, budget - spentOthers);
      if (v > maxAllowed) v = maxAllowed;
      input.value = v;
      characteristicPoints[stat] = v;
      result.textContent = `coût : ${statValueToPoolCost(stat, v)}`;
      saveCustomization();
      updateCharacteristicPointsBudget();
      renderStats();
    });
    field.appendChild(span);
    field.appendChild(input);
    field.appendChild(result);
    grid.appendChild(field);
  }

  updateCharacteristicPointsBudget();
}

// ---------- Stats ----------

function addEffectToTotals(totals, effect, overrideValue) {
  const label = stripSign(effect.label);
  const sign = effect.operator === "-" ? -1 : 1;
  let value;
  if (overrideValue !== undefined) value = overrideValue;
  else if (effect.value !== undefined) value = effect.value;
  else if (effect.min !== undefined && effect.max !== undefined) value = effect.max;
  else if (effect.min !== undefined) value = effect.min;
  else if (effect.max !== undefined) value = effect.max;
  else value = 0;

  totals.set(label, (totals.get(label) || 0) + sign * value);
}

function computeItemStats(equippedMap = equipped, rollOverridesObj = rollOverrides, forgemagieObj = forgemagie) {
  const totals = new Map();
  for (const [uiSlotId, item] of Object.entries(equippedMap)) {
    (item.effects || []).forEach((effect, idx) => {
      const override = rollOverridesObj[uiSlotId] && rollOverridesObj[uiSlotId][idx];
      addEffectToTotals(totals, effect, override);
    });
    for (const fm of forgemagieObj[uiSlotId] || []) {
      totals.set(fm.label, (totals.get(fm.label) || 0) + fm.value);
    }
  }
  return totals;
}

function computeActiveSets(equippedMap = equipped) {
  const countBySet = new Map();
  for (const item of Object.values(equippedMap)) {
    if (!item.itemSetId || item.itemSetId <= 0) continue;
    countBySet.set(item.itemSetId, (countBySet.get(item.itemSetId) || 0) + 1);
  }

  const result = [];
  for (const [setId, count] of countBySet.entries()) {
    const set = SETS_BY_ID.get(setId);
    if (!set) continue;
    const tier = set.bonuses && set.bonuses[count - 1];
    result.push({ set, count, tierEffects: tier || [] });
  }
  result.sort((a, b) => a.set.name.localeCompare(b.set.name));
  return result;
}

function computeCombinedStats(equippedMap, rollOverridesObj, forgemagieObj, parchotageObj, charLevel, characteristicPointsObj) {
  const base = computeBaseStats(charLevel);
  const itemTotals = computeItemStats(equippedMap, rollOverridesObj, forgemagieObj);
  const activeSets = computeActiveSets(equippedMap);

  const combined = new Map();
  for (const [label, value] of Object.entries(base)) combined.set(label, value);
  for (const [label, value] of itemTotals) combined.set(label, (combined.get(label) || 0) + value);
  for (const { tierEffects } of activeSets) {
    for (const effect of tierEffects) addEffectToTotals(combined, effect);
  }
  for (const [stat, value] of Object.entries(parchotageObj)) {
    if (value) combined.set(stat, (combined.get(stat) || 0) + value);
  }
  for (const [stat, value] of Object.entries(characteristicPointsObj || {})) {
    if (value) combined.set(stat, (combined.get(stat) || 0) + value);
  }
  return combined;
}

function sortStatEntries(entries) {
  return entries.sort((a, b) => {
    const ia = STAT_ORDER.indexOf(a[0]);
    const ib = STAT_ORDER.indexOf(b[0]);
    const ra = ia === -1 ? STAT_ORDER.length : ia;
    const rb = ib === -1 ? STAT_ORDER.length : ib;
    return ra !== rb ? ra - rb : a[0].localeCompare(b[0]);
  });
}

function renderStats() {
  const combined = computeCombinedStats(equipped, rollOverrides, forgemagie, parchotage, getCharLevel(), characteristicPoints);
  const activeSets = computeActiveSets(equipped);

  const statsEl = document.getElementById("statsContent");
  statsEl.innerHTML = "";
  const sortedEntries = sortStatEntries([...combined.entries()].filter(([label, v]) => v !== 0 && !isWeaponEffect(label)));
  if (sortedEntries.length === 0) {
    statsEl.innerHTML = '<div class="stat-empty">Équipez un objet pour voir les statistiques.</div>';
  } else {
    for (const [label, value] of sortedEntries) {
      const row = document.createElement("div");
      row.className = "stat-row";
      const icon = statIcon(label);
      row.innerHTML = `<span>${icon ? `<span class="stat-icon">${icon}</span>` : ""}${escapeHtml(label)}</span><span class="val ${value >= 0 ? "pos" : "neg"}">${value >= 0 ? "+" : ""}${value}</span>`;
      statsEl.appendChild(row);
    }
  }

  const setsEl = document.getElementById("setsContent");
  setsEl.innerHTML = "";
  if (activeSets.length === 0) {
    setsEl.innerHTML = '<div class="stat-empty">Aucune panoplie en cours.</div>';
  } else {
    for (const { set, count, tierEffects } of activeSets) {
      const block = document.createElement("div");
      block.className = "set-block" + (tierEffects.length > 0 ? " active" : "");
      const title = document.createElement("div");
      title.className = "set-title";
      title.innerHTML = `<span>${escapeHtml(set.name)}</span><span class="set-count">${count}/${set.itemIds.length}</span>`;
      block.appendChild(title);

      if (tierEffects.length > 0) {
        const eff = document.createElement("div");
        eff.className = "item-effects";
        eff.innerHTML = tierEffects.map(effectHtml).join("");
        block.appendChild(eff);
      } else {
        const none = document.createElement("div");
        none.className = "stat-empty";
        none.textContent = "Pas encore de bonus à ce nombre de pièces.";
        block.appendChild(none);
      }
      setsEl.appendChild(block);
    }
  }

  renderResourceNeeds();
}

function renderResourceNeeds() {
  const el = document.getElementById("resourcesContent");
  if (!el) return;
  el.innerHTML = "";

  // itemId -> { name, iconId, quantity }
  const totals = new Map();
  for (const item of Object.values(equipped)) {
    for (const ing of item.recipe || []) {
      const existing = totals.get(ing.itemId);
      if (existing) existing.quantity += ing.quantity;
      else totals.set(ing.itemId, { name: ing.name, iconId: ing.iconId, quantity: ing.quantity });
    }
  }

  if (totals.size === 0) {
    el.innerHTML = '<div class="stat-empty">Équipez un objet dont la recette est connue pour voir les ressources nécessaires.</div>';
    return;
  }

  const sorted = [...totals.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const res of sorted) {
    const row = document.createElement("div");
    row.className = "resource-row";
    row.appendChild(itemIconEl({ iconId: res.iconId }, "🧱", "item-icon"));
    const name = document.createElement("span");
    name.className = "resource-name";
    name.textContent = res.name;
    row.appendChild(name);
    const qty = document.createElement("span");
    qty.className = "resource-qty";
    qty.textContent = `× ${res.quantity}`;
    row.appendChild(qty);
    el.appendChild(row);
  }
}

main().catch(err => {
  document.body.innerHTML = `<pre style="color:#d9686b;padding:20px;">Erreur de chargement : ${err.message}\n${err.stack || ""}</pre>`;
  console.error(err);
});
