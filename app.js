"use strict";

// Empty-slot placeholders are greyed-out versions of a real item's icon (see
// tools/Builder/wwwroot/icons/slot-placeholders), not emoji - picked to be
// visually representative of their slot: coiffe=Coiffe de la Reine des Voleurs,
// cape=Cape des Justiciers, amulette=Amulette du Kam Assutra, anneau=Anneau
// Aimgéroks, ceinture=Sangle Ouare, bottes=Bottes du Sinistrofu, arme=Épée
// Maudite du Saigneur Guerrier, bouclier=Quatre-feuilles, familier=Bouloute,
// dofus=Dofus Pourpre.
const UI_SLOTS = [
  { id: "coiffe", label: "Coiffe", dataSlot: "coiffe", icon: "icons/slot-placeholders/coiffe.png" },
  { id: "cape", label: "Cape", dataSlot: "cape", icon: "icons/slot-placeholders/cape.png" },
  { id: "amulette", label: "Amulette", dataSlot: "amulette", icon: "icons/slot-placeholders/amulette.png" },
  { id: "arme", label: "Arme", dataSlot: "arme", icon: "icons/slot-placeholders/arme.png" },
  { id: "bouclier", label: "Bouclier", dataSlot: "bouclier", icon: "icons/slot-placeholders/bouclier.png" },
  { id: "anneau1", label: "Anneau", dataSlot: "anneau", icon: "icons/slot-placeholders/anneau.png" },
  { id: "anneau2", label: "Anneau", dataSlot: "anneau", icon: "icons/slot-placeholders/anneau.png" },
  { id: "ceinture", label: "Ceinture", dataSlot: "ceinture", icon: "icons/slot-placeholders/ceinture.png" },
  { id: "bottes", label: "Bottes", dataSlot: "bottes", icon: "icons/slot-placeholders/bottes.png" },
  { id: "familier", label: "Familier", dataSlot: "familier", icon: "icons/slot-placeholders/familier.png" },
  { id: "dofus1", label: "Dofus", dataSlot: "dofus", icon: "icons/slot-placeholders/dofus.png", group: "dofus" },
  { id: "dofus2", label: "Dofus", dataSlot: "dofus", icon: "icons/slot-placeholders/dofus.png", group: "dofus" },
  { id: "dofus3", label: "Dofus", dataSlot: "dofus", icon: "icons/slot-placeholders/dofus.png", group: "dofus" },
  { id: "dofus4", label: "Dofus", dataSlot: "dofus", icon: "icons/slot-placeholders/dofus.png", group: "dofus" },
  { id: "dofus5", label: "Dofus", dataSlot: "dofus", icon: "icons/slot-placeholders/dofus.png", group: "dofus" },
  { id: "dofus6", label: "Dofus", dataSlot: "dofus", icon: "icons/slot-placeholders/dofus.png", group: "dofus" },
];

// Server-specific base-stat formulas (Game/Actors/Stats/StatsFields.cs:227-247).
// Not vanilla Dofus values - this server is rebalanced.
const PARCHOTAGE_STATS = ["Force", "Intelligence", "Chance", "Agilité", "Vitalité", "Sagesse"];

// The dofus slot covers two distinct item pools that share the same equip location
// in-game (dofus vs trophée). Clicking it opens a category picker before the item
// browser.
const SLOT_CATEGORY_CHOICES = {
  dofus: [
    { key: "dofus", label: "Dofus", icon: "icons/slot-placeholders/dofus.png" },
    { key: "trophee", label: "Trophée", icon: "icons/slot-placeholders/trophee.png" },
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
  ICON_PURPLE = "#b07cd6", ICON_WHITE = "#e8e8e8", ICON_BROWN = "#a97c50", ICON_GRAY = "#8a8a8a", ICON_YELLOW = "#f2c94c";
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
    "Pods": "🎒", "(PV rendus)": "❤️", "(dommages)": "✨",
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
const BUILD_CATEGORIES = ["Feu", "Eau", "Air", "Terre", "Multi", "DoPou", "Tank", "Sagesse", "PP"];

const STORAGE_KEY_BUILDS = "populus-builder-saved-builds-v1";
const STORAGE_KEY_HIDDEN = "populus-builder-hidden-v1";
const STORAGE_KEY_ATELIER = "populus-builder-atelier-v1";

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
  { key: "dopou", label: "DoPou", kind: "item", stat: "Dommages Poussée" },
  { key: "docri", label: "DoCri", kind: "item", stat: "Dommages Critiques" },
  { key: "multi", label: "Pano Multi", kind: "computed" },
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
let activeSlotTypeExcludeFilters = new Set();

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
let itemNoPanoFilterActive = false;
let itemWithPanoFilterActive = false;
let activeBuildCategoryFilter = null;
let ladderData = null;
let ladderActiveTab = "xp";

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
/** ordered list of item ids sent to the atelier */
let atelierOrder = [];
/** itemId -> { ingredientItemId: quantity typed by the user } */
let atelierHave = {};
/** itemId -> number of copies of the item to craft (multiplies each ingredient's needed quantity) */
let atelierCopies = {};
/** "resource" (default) or "item" - which panel the Atelier modal currently shows */
let atelierViewMode = "resource";
/** name of the build last loaded/saved, so "Enregistrer" updates it without re-prompting */
let activeBuildName = null;
/** itemId set - hidden from the item browser until "Réinitialiser" is pressed */
let hiddenItemIds = new Set();
/** setId set - hidden from the panoplie browser until "Réinitialiser" is pressed */
let hiddenSetIds = new Set();

let activeUiSlot = null;
/** resolved category key for the open browser: a plain dataSlot, or "dragodinde"/"trophee" */
let activeCategory = null;

let BREEDS = [];

async function main() {
  const [items, sets, breeds] = await Promise.all([
    fetch("data/items.json").then(r => r.json()),
    fetch("data/sets.json").then(r => r.json()),
    fetch("data/spells.json").then(r => r.json()),
  ]);
  BREEDS = breeds;

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
  loadHidden();
  loadAtelier();
  handleImportFromUrl();
  renderPaperdoll();
  renderParchotageGrid();
  renderCharacteristicPointsGrid();
  renderBaseStats();
  renderStats();
  renderBuildCategoryFilterChips();
  renderSavedBuildsList();
  renderSetsFilterChips();
  renderSetsSlotTypeFilterChips();
  renderSetsSlotTypeExcludeFilterChips();
  renderStatFilterChips();

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
  document.getElementById("itemNoPanoFilterBtn").addEventListener("click", (ev) => {
    itemNoPanoFilterActive = !itemNoPanoFilterActive;
    ev.target.classList.toggle("active", itemNoPanoFilterActive);
    renderItemList();
  });
  document.getElementById("itemWithPanoFilterBtn").addEventListener("click", (ev) => {
    itemWithPanoFilterActive = !itemWithPanoFilterActive;
    ev.target.classList.toggle("active", itemWithPanoFilterActive);
    renderItemList();
  });
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
  document.getElementById("buildCategoryModalClose").addEventListener("click", () => {
    document.getElementById("buildCategoryModalOverlay").classList.add("hidden");
  });
  document.getElementById("buildCategoryModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "buildCategoryModalOverlay") document.getElementById("buildCategoryModalOverlay").classList.add("hidden");
  });
  document.getElementById("ladderBtn").addEventListener("click", openLadderModal);
  document.getElementById("ladderModalClose").addEventListener("click", () => {
    document.getElementById("ladderModalOverlay").classList.add("hidden");
  });
  document.getElementById("ladderModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "ladderModalOverlay") document.getElementById("ladderModalOverlay").classList.add("hidden");
  });
  document.getElementById("ladderTabXp").addEventListener("click", () => {
    ladderActiveTab = "xp";
    document.getElementById("ladderTabXp").classList.add("active");
    document.getElementById("ladderTabSuccess").classList.remove("active");
    renderLadderList();
  });
  document.getElementById("ladderTabSuccess").addEventListener("click", () => {
    ladderActiveTab = "success";
    document.getElementById("ladderTabSuccess").classList.add("active");
    document.getElementById("ladderTabXp").classList.remove("active");
    renderLadderList();
  });
  document.getElementById("recipeModalClose").addEventListener("click", closeRecipeModal);
  document.getElementById("recipeModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "recipeModalOverlay") closeRecipeModal();
  });
  document.getElementById("atelierBtn").addEventListener("click", openAtelierModal);
  document.getElementById("atelierClearBtn").addEventListener("click", clearAtelier);
  document.getElementById("atelierModalClose").addEventListener("click", closeAtelierModal);
  document.getElementById("atelierViewItemBtn").addEventListener("click", () => {
    atelierViewMode = "item";
    document.getElementById("atelierViewItemBtn").classList.add("active");
    document.getElementById("atelierViewResourceBtn").classList.remove("active");
    renderAtelierModal();
  });
  document.getElementById("atelierViewResourceBtn").addEventListener("click", () => {
    atelierViewMode = "resource";
    document.getElementById("atelierViewResourceBtn").classList.add("active");
    document.getElementById("atelierViewItemBtn").classList.remove("active");
    renderAtelierModal();
  });
  document.getElementById("atelierModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "atelierModalOverlay") closeAtelierModal();
  });
  document.getElementById("hiddenItemsBtn").addEventListener("click", openHiddenItemsModal);
  document.getElementById("hiddenSetsBtn").addEventListener("click", openHiddenSetsModal);
  document.getElementById("hiddenModalClose").addEventListener("click", closeHiddenModal);
  document.getElementById("hiddenModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "hiddenModalOverlay") closeHiddenModal();
  });
  document.getElementById("unhideAllBtn").addEventListener("click", unhideAllInCurrentModal);
  document.getElementById("weaponDamageBtn").addEventListener("click", openWeaponDamageModal);
  document.getElementById("weaponDamageModalClose").addEventListener("click", closeWeaponDamageModal);
  document.getElementById("weaponDamageModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "weaponDamageModalOverlay") closeWeaponDamageModal();
  });
  document.getElementById("classSpellsBtn").addEventListener("click", openClassPicker);
  document.getElementById("classPickerModalClose").addEventListener("click", closeClassPicker);
  document.getElementById("classPickerModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "classPickerModalOverlay") closeClassPicker();
  });
  document.getElementById("classSpellsModalClose").addEventListener("click", closeClassSpells);
  document.getElementById("classSpellsModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "classSpellsModalOverlay") closeClassSpells();
  });
  document.getElementById("paPmBtn").addEventListener("click", openPaPmPicker);
  document.getElementById("paPmPickerModalClose").addEventListener("click", closePaPmPicker);
  document.getElementById("paPmPickerModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "paPmPickerModalOverlay") closePaPmPicker();
  });
  document.getElementById("paPmPaBtn").addEventListener("click", () => openPaPmList("pa"));
  document.getElementById("paPmPmBtn").addEventListener("click", () => openPaPmList("pm"));
  document.getElementById("paPmListModalClose").addEventListener("click", closePaPmList);
  document.getElementById("paPmListModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "paPmListModalOverlay") closePaPmList();
  });
  document.getElementById("paPmSearchInput").addEventListener("input", renderPaPmList);
  document.getElementById("paPmSortSelect").addEventListener("change", renderPaPmList);
  document.getElementById("paPmLevelMinInput").addEventListener("input", renderPaPmList);
  document.getElementById("paPmLevelMaxInput").addEventListener("input", renderPaPmList);
  document.getElementById("paPmAddStatFilterBtn").addEventListener("click", addPaPmStatFilter);
  document.getElementById("paPmNoPanoFilterBtn").addEventListener("click", (ev) => {
    paPmNoPanoFilterActive = !paPmNoPanoFilterActive;
    ev.target.classList.toggle("active", paPmNoPanoFilterActive);
    renderPaPmList();
  });
  document.getElementById("paPmWithPanoFilterBtn").addEventListener("click", (ev) => {
    paPmWithPanoFilterActive = !paPmWithPanoFilterActive;
    ev.target.classList.toggle("active", paPmWithPanoFilterActive);
    renderPaPmList();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { closeSetPreview(); closeCompareModal(); closeCategoryPicker(); closeCompatibleSetsModal(); closeRecipeModal(); closeAtelierModal(); closeHiddenModal(); closeWeaponDamageModal(); closeClassPicker(); closeClassSpells(); closePaPmPicker(); closePaPmList(); }
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
    renderPaperdoll();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Retirer tout l'équipement (et les réglages de jet/forgemagie) ?")) return;
    equipped = {};
    rollOverrides = {};
    forgemagie = {};
    parchotage = {};
    characteristicPoints = {};
    hiddenItemIds = new Set();
    hiddenSetIds = new Set();
    activeBuildName = null;
    document.getElementById("buildNameInput").value = "";
    saveEquipped();
    saveCustomization();
    saveHidden();
    renderPaperdoll();
    renderParchotageGrid();
    renderCharacteristicPointsGrid();
    renderStats();
    renderItemList();
    renderSetsList();
    closeSidePanel();
  });

  document.getElementById("parchotageMaxBtn").addEventListener("click", () => {
    parchotage = { "Sagesse": 100, "Vitalité": 130, "Intelligence": 130, "Chance": 130, "Force": 130, "Agilité": 130 };
    saveCustomization();
    renderParchotageGrid();
    renderStats();
  });

  for (const value of [0, 25, 50, 80, 100]) {
    document.getElementById(`parchotage${value}Btn`).addEventListener("click", () => {
      parchotage = Object.fromEntries(PARCHOTAGE_STATS.map(stat => [stat, value]));
      saveCustomization();
      renderParchotageGrid();
      renderStats();
    });
  }
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

function loadHidden() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIDDEN);
    if (!raw) return;
    const data = JSON.parse(raw);
    hiddenItemIds = new Set(data.items || []);
    hiddenSetIds = new Set(data.sets || []);
  } catch (e) {
    console.warn("Could not restore hidden items/panoplies", e);
  }
}

function saveHidden() {
  localStorage.setItem(STORAGE_KEY_HIDDEN, JSON.stringify({ items: [...hiddenItemIds], sets: [...hiddenSetIds] }));
}

function loadAtelier() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATELIER);
    if (!raw) return;
    const data = JSON.parse(raw);
    atelierOrder = (data.order || []).filter(id => ITEMS_BY_ID.has(id));
    atelierHave = data.have || {};
    atelierCopies = data.copies || {};
  } catch (e) {
    console.warn("Could not restore atelier", e);
  }
}

function saveAtelier() {
  localStorage.setItem(STORAGE_KEY_ATELIER, JSON.stringify({ order: atelierOrder, have: atelierHave, copies: atelierCopies }));
}

function addItemToAtelier(itemId) {
  if (!atelierOrder.includes(itemId)) atelierOrder.push(itemId);
  if (!atelierHave[itemId]) atelierHave[itemId] = {};
  if (!atelierCopies[itemId]) atelierCopies[itemId] = 1;
  saveAtelier();
}

function removeItemFromAtelier(itemId) {
  atelierOrder = atelierOrder.filter(id => id !== itemId);
  delete atelierHave[itemId];
  delete atelierCopies[itemId];
  saveAtelier();
  renderAtelierModal();
}

function clearAtelier() {
  if (atelierOrder.length === 0) return;
  if (!confirm("Vider l'atelier (retirer tous les objets) ?")) return;
  atelierOrder = [];
  atelierHave = {};
  atelierCopies = {};
  saveAtelier();
  renderAtelierModal();
}

function sendAllEquippedToAtelier() {
  const ids = new Set(Object.values(equipped).map(it => it.id));
  if (ids.size === 0) return;
  for (const id of ids) addItemToAtelier(id);
  renderAtelierModal();
}

function sendSetToAtelier(set) {
  for (const itemId of set.itemIds) addItemToAtelier(itemId);
  renderAtelierModal();
}

function loadSavedBuilds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUILDS);
    if (!raw) return;
    savedBuilds = JSON.parse(raw) || [];
    // migrate the old single "category" field to the new multi-select "categories" array
    for (const b of savedBuilds) {
      if (!b.categories) b.categories = b.category ? [b.category] : [];
      delete b.category;
    }
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
  const existingIdx = savedBuilds.findIndex(b => b.name === name);
  const snapshot = {
    name,
    charLevel: getCharLevel(),
    equipped: equippedToIds(),
    rollOverrides: JSON.parse(JSON.stringify(rollOverrides)),
    forgemagie: JSON.parse(JSON.stringify(forgemagie)),
    parchotage: JSON.parse(JSON.stringify(parchotage)),
    characteristicPoints: JSON.parse(JSON.stringify(characteristicPoints)),
    categories: existingIdx >= 0 ? savedBuilds[existingIdx].categories : [],
    savedAt: new Date().toISOString(),
  };
  if (existingIdx >= 0) savedBuilds[existingIdx] = snapshot;
  else savedBuilds.push(snapshot);

  persistSavedBuilds();
  renderSavedBuildsList();
}

/** activeBuildCategoryFilter === null means "None" - builds with zero categories assigned
    (the implicit default, not an actual tag). Any other value filters to builds whose
    categories array includes that tag. */
function renderBuildCategoryFilterChips() {
  const row = document.getElementById("buildCategoryFilterRow");
  if (!row) return;
  row.innerHTML = "";

  const noneChip = document.createElement("button");
  noneChip.type = "button";
  noneChip.className = "filter-chip" + (activeBuildCategoryFilter === null ? " active" : "");
  noneChip.textContent = "None";
  noneChip.addEventListener("click", () => {
    activeBuildCategoryFilter = null;
    renderBuildCategoryFilterChips();
    renderSavedBuildsList();
  });
  row.appendChild(noneChip);

  for (const cat of BUILD_CATEGORIES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip" + (activeBuildCategoryFilter === cat ? " active" : "");
    chip.textContent = cat;
    chip.addEventListener("click", () => {
      activeBuildCategoryFilter = cat;
      renderBuildCategoryFilterChips();
      renderSavedBuildsList();
    });
    row.appendChild(chip);
  }
}

/** A build can belong to several categories at once (multi-toggle, modal stays open),
    "None" isn't a real tag - it's just what a build with an empty categories array shows as. */
function openBuildCategoryPicker(build) {
  if (!build.categories) build.categories = [];
  const body = document.getElementById("buildCategoryModalBody");
  body.innerHTML = "";
  for (const cat of BUILD_CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-choice-btn" + (build.categories.includes(cat) ? " active" : "");
    btn.innerHTML = `<span>${escapeHtml(cat)}</span>`;
    btn.addEventListener("click", () => {
      const idx = build.categories.indexOf(cat);
      if (idx >= 0) build.categories.splice(idx, 1);
      else build.categories.push(cat);
      persistSavedBuilds();
      renderSavedBuildsList();
      openBuildCategoryPicker(build);
    });
    body.appendChild(btn);
  }
  if (build.categories.length > 0) {
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "category-choice-btn";
    clearBtn.innerHTML = `<span>Aucune catégorie (None)</span>`;
    clearBtn.addEventListener("click", () => {
      build.categories = [];
      persistSavedBuilds();
      renderSavedBuildsList();
      document.getElementById("buildCategoryModalOverlay").classList.add("hidden");
    });
    body.appendChild(clearBtn);
  }
  document.getElementById("buildCategoryModalOverlay").classList.remove("hidden");
}

// ---------- Export / import a build via shareable link ----------

function encodeBuildForUrl(snapshot) {
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBuildFromUrl(encoded) {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function exportBuild(build) {
  const snapshot = {
    name: build.name,
    charLevel: build.charLevel,
    equipped: build.equipped,
    rollOverrides: build.rollOverrides,
    forgemagie: build.forgemagie,
    parchotage: build.parchotage,
    characteristicPoints: build.characteristicPoints,
  };
  const url = `${location.origin}${location.pathname}?import=${encodeBuildForUrl(snapshot)}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  prompt('Lien du build (déjà copié dans le presse-papier) - à partager :', url);
}

/** On load, ?import=<encoded build> lets anyone who opens the link pull that build
    straight into their own saved builds - no server/account involved, it's all in the URL. */
function handleImportFromUrl() {
  const params = new URLSearchParams(location.search);
  const encoded = params.get("import");
  if (!encoded) return;
  history.replaceState(null, "", location.pathname);

  let snapshot;
  try {
    snapshot = decodeBuildFromUrl(encoded);
  } catch (e) {
    snapshot = null;
  }
  if (!snapshot || typeof snapshot !== "object" || !snapshot.equipped) {
    alert("Lien de build invalide ou corrompu.");
    return;
  }

  const name = snapshot.name || "Build importé";
  const overwrite = savedBuilds.some(b => b.name === name);
  const msg = overwrite
    ? `Importer le build "${name}" ? Un build du même nom existe déjà et sera écrasé.`
    : `Importer le build "${name}" dans vos builds enregistrés ?`;
  if (!confirm(msg)) return;

  const finalSnapshot = { ...snapshot, name, savedAt: new Date().toISOString() };
  const existingIdx = savedBuilds.findIndex(b => b.name === name);
  if (existingIdx >= 0) savedBuilds[existingIdx] = finalSnapshot;
  else savedBuilds.push(finalSnapshot);
  persistSavedBuilds();
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

  const visibleBuilds = activeBuildCategoryFilter === null
    ? savedBuilds.filter(b => !b.categories || b.categories.length === 0)
    : savedBuilds.filter(b => b.categories && b.categories.includes(activeBuildCategoryFilter));

  if (visibleBuilds.length === 0) {
    listEl.innerHTML = '<div class="stat-empty">Aucun build dans cette catégorie.</div>';
    return;
  }

  visibleBuilds.forEach((build, visIdx) => {
    const row = document.createElement("div");
    row.className = "build-row";

    const nameCell = document.createElement("div");
    nameCell.className = "build-name-cell";

    const renameBtn = document.createElement("button");
    renameBtn.className = "rename-btn";
    renameBtn.textContent = "✎";
    renameBtn.title = "Renommer";
    renameBtn.addEventListener("click", () => renameBuildByName(build.name));
    nameCell.appendChild(renameBtn);

    const name = document.createElement("span");
    name.className = "build-name";
    name.title = build.name + (build.categories && build.categories.length ? ` [${build.categories.join(", ")}]` : "");
    name.textContent = build.name;
    nameCell.appendChild(name);

    row.appendChild(nameCell);

    const actionsTop = document.createElement("div");
    actionsTop.className = "build-actions-top";

    const categoryBtn = document.createElement("button");
    categoryBtn.className = "category-btn";
    categoryBtn.innerHTML = '<img class="build-row-icon" src="icons/ui/categories.png" alt="">';
    categoryBtn.title = build.categories && build.categories.length ? `Catégories : ${build.categories.join(", ")}` : "Choisir une/des catégorie(s)";
    categoryBtn.addEventListener("click", () => openBuildCategoryPicker(build));
    actionsTop.appendChild(categoryBtn);

    const loadBtn = document.createElement("button");
    loadBtn.className = "load-btn";
    loadBtn.textContent = "📂";
    loadBtn.title = "Charger";
    loadBtn.addEventListener("click", () => loadBuildByName(build.name));
    actionsTop.appendChild(loadBtn);

    const exportBtn = document.createElement("button");
    exportBtn.className = "share-btn";
    exportBtn.innerHTML = '<img class="build-row-icon" src="icons/ui/export.png" alt="">';
    exportBtn.title = "Exporter (lien à partager)";
    exportBtn.addEventListener("click", () => exportBuild(build));
    actionsTop.appendChild(exportBtn);

    row.appendChild(actionsTop);

    const actionsBottom = document.createElement("div");
    actionsBottom.className = "build-actions-bottom";

    const upBtn = document.createElement("button");
    upBtn.className = "move-btn";
    upBtn.textContent = "▲";
    upBtn.title = "Monter";
    upBtn.disabled = visIdx === 0;
    upBtn.addEventListener("click", () => moveBuildInView(build, -1, visibleBuilds));
    actionsBottom.appendChild(upBtn);

    const downBtn = document.createElement("button");
    downBtn.className = "move-btn";
    downBtn.textContent = "▼";
    downBtn.title = "Descendre";
    downBtn.disabled = visIdx === visibleBuilds.length - 1;
    downBtn.addEventListener("click", () => moveBuildInView(build, 1, visibleBuilds));
    actionsBottom.appendChild(downBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "×";
    delBtn.title = "Supprimer";
    delBtn.addEventListener("click", () => deleteBuildByName(build.name));
    actionsBottom.appendChild(delBtn);

    row.appendChild(actionsBottom);
    listEl.appendChild(row);
  });
}

/** Moves a build by one step within the currently visible (filtered) list, so a single
    press always produces a single visible move - swaps its position with whichever
    build is its neighbor in that view, wherever the two of them sit in the real array. */
function moveBuildInView(build, direction, visibleBuilds) {
  const visIdx = visibleBuilds.indexOf(build);
  const targetVisIdx = visIdx + direction;
  if (targetVisIdx < 0 || targetVisIdx >= visibleBuilds.length) return;
  const otherBuild = visibleBuilds[targetVisIdx];

  const absIdxA = savedBuilds.indexOf(build);
  const absIdxB = savedBuilds.indexOf(otherBuild);
  [savedBuilds[absIdxA], savedBuilds[absIdxB]] = [savedBuilds[absIdxB], savedBuilds[absIdxA]];
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

// Visual position of the 3x4 paperdoll grid (in-game equipment doll layout), independent
// of UI_SLOTS's own order (which still drives equip-target resolution elsewhere). null = blank cell.
const PAPERDOLL_LAYOUT = [
  null, "coiffe", "cape",
  "anneau1", "amulette", "anneau2",
  "arme", "ceinture", "bouclier",
  null, "bottes", "familier",
];

function renderPaperdoll() {
  const root = document.getElementById("paperdoll");
  root.innerHTML = "";

  const dofusSlots = UI_SLOTS.filter(s => s.group === "dofus");

  let firstEmptySeen = false;
  for (const slotId of PAPERDOLL_LAYOUT) {
    if (slotId === null) {
      root.appendChild(renderEmptySlotEl(!firstEmptySeen));
      firstEmptySeen = true;
      continue;
    }
    root.appendChild(renderSlotEl(UI_SLOTS.find(s => s.id === slotId)));
  }

  const label = document.createElement("div");
  label.className = "paperdoll-section-label";
  label.textContent = "Dofus";
  root.appendChild(label);

  const dofusWrap = document.createElement("div");
  dofusWrap.className = "paperdoll-dofus";
  for (const uiSlot of dofusSlots) dofusWrap.appendChild(renderSlotEl(uiSlot));
  root.appendChild(dofusWrap);
}

function renderEmptySlotEl(withAtelierButton) {
  const el = document.createElement("div");
  el.className = "slot slot-empty" + (withAtelierButton ? " atelier-all-slot" : "");
  if (withAtelierButton) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "atelier-send-all-btn";
    btn.title = "Envoyer tout l'équipement en atelier";
    const img = document.createElement("img");
    img.src = "icons/ui/atelier.svg";
    img.alt = "";
    btn.appendChild(img);
    btn.addEventListener("click", () => sendAllEquippedToAtelier());
    el.appendChild(btn);
  }
  return el;
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
  el.className = "slot" + (item ? " filled" : "") + (activeUiSlot === uiSlot.id ? " selected" : "") +
    (itemHasUnmetConditions(item) ? " unmet-conditions" : "");
  el.title = item ? item.name : uiSlot.label;

  el.appendChild(itemIconEl(item, uiSlot.icon, "icon"));

  if (item) {
    el.addEventListener("mouseenter", () => showEquippedTooltip(el, item));
    el.addEventListener("mouseleave", hideEquippedTooltip);
  }

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

    const actionRow = document.createElement("div");
    actionRow.className = "slot-action-row";

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
      actionRow.appendChild(setBtn);
    }

    const atelierBtn = document.createElement("button");
    atelierBtn.type = "button";
    atelierBtn.className = "atelier-send-btn";
    atelierBtn.title = "Envoyer en atelier";
    const atelierImg = document.createElement("img");
    atelierImg.src = "icons/ui/atelier.svg";
    atelierImg.alt = "";
    atelierBtn.appendChild(atelierImg);
    atelierBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      addItemToAtelier(item.id);
    });
    actionRow.appendChild(atelierBtn);

    el.appendChild(actionRow);

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

  el.addEventListener("click", () => {
    hideEquippedTooltip();
    openBrowser(uiSlot.id);
  });
  return el;
}

/** Hover tooltip for an equipped slot: same effects-grid markup as the item browser cards. */
function showEquippedTooltip(anchorEl, item) {
  const tooltip = document.getElementById("equippedTooltip");
  tooltip.innerHTML = "";

  const name = document.createElement("div");
  name.className = "equipped-tooltip-name";
  name.textContent = item.name;
  tooltip.appendChild(name);

  const level = document.createElement("div");
  level.className = "equipped-tooltip-level";
  level.textContent = "Nv. " + item.level;
  tooltip.appendChild(level);

  const eff = document.createElement("div");
  eff.className = "item-effects";
  eff.innerHTML = effectsGridHtml(item.effects, { specialSpellName: item.specialSpellName, specialSpellDescription: item.specialSpellDescription });
  tooltip.appendChild(eff);

  if (item.weaponRange !== undefined || item.apCost !== undefined) {
    const w = document.createElement("div");
    w.className = "item-effects";
    const bits = [];
    if (item.apCost !== undefined) bits.push(`${item.apCost} PA`);
    if (item.minRange !== undefined && item.weaponRange !== undefined) {
      bits.push(item.minRange === item.weaponRange ? `Portée ${item.weaponRange}` : `Portée ${item.minRange}-${item.weaponRange}`);
    }
    if (item.criticalHitProbability) {
      let crit = `Critique ${item.criticalHitProbability}%`;
      if (item.criticalHitBonus) crit += ` (+${item.criticalHitBonus} Dommages de base)`;
      bits.push(crit);
    }
    w.textContent = bits.join(" · ");
    tooltip.appendChild(w);
  }

  if (item.conditions && item.conditions.length) {
    const cond = document.createElement("div");
    cond.className = "item-conditions";
    cond.textContent = "Cond. : " + item.conditions.map(formatCondition).join(", ");
    tooltip.appendChild(cond);
  }

  tooltip.classList.remove("hidden");

  const anchorRect = anchorEl.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const margin = 8;
  let left = anchorRect.right + margin;
  if (left + tipRect.width > window.innerWidth - margin) {
    left = anchorRect.left - margin - tipRect.width;
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));

  let top = anchorRect.top;
  top = Math.max(margin, Math.min(top, window.innerHeight - tipRect.height - margin));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideEquippedTooltip() {
  document.getElementById("equippedTooltip").classList.add("hidden");
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

  const head = document.createElement("div");
  head.className = "currently-equipped-head";
  const name = document.createElement("div");
  name.className = "currently-equipped-name";
  name.textContent = `${item.name} (Nv. ${item.level})`;
  head.appendChild(name);

  if (item.recipe && item.recipe.length > 0) {
    const recipeBtn = document.createElement("button");
    recipeBtn.type = "button";
    recipeBtn.className = "set-card-compat-btn";
    recipeBtn.textContent = "Recette";
    recipeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openRecipeModal(item.id);
    });
    head.appendChild(recipeBtn);
  }

  body.appendChild(head);
  if (item.effects && item.effects.length) {
    const eff = document.createElement("div");
    eff.className = "item-effects";
    eff.innerHTML = effectsGridHtml(item.effects, { specialSpellName: item.specialSpellName, specialSpellDescription: item.specialSpellDescription });
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
    btn.innerHTML = `<img class="category-choice-icon" src="${choice.icon}" alt=""><span>${escapeHtml(choice.label)}</span>`;
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
  updateHiddenButtonsLabel();
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
  list = list.filter(i => !hiddenItemIds.has(i.id));
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search));
  if (!isNaN(levelMin)) list = list.filter(i => i.level >= levelMin);
  if (!isNaN(levelMax)) list = list.filter(i => i.level <= levelMax);
  list = list.filter(itemMatchesStatFilters);
  if (itemNoPanoFilterActive) list = list.filter(i => !i.itemSetId || i.itemSetId <= 0);
  if (itemWithPanoFilterActive) list = list.filter(i => i.itemSetId && i.itemSetId > 0);

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
  head.innerHTML = `<span class="name"></span><span class="item-card-head-right"><span class="level">Nv. ${item.level}</span></span>`;
  head.querySelector(".name").textContent = item.name;
  const hideBtn = document.createElement("button");
  hideBtn.type = "button";
  hideBtn.className = "hide-btn";
  hideBtn.title = "Cacher cet objet";
  hideBtn.textContent = "Cacher";
  hideBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    hiddenItemIds.add(item.id);
    saveHidden();
    renderItemList();
  });
  head.querySelector(".item-card-head-right").appendChild(hideBtn);
  body.appendChild(head);

  if ((item.effects && item.effects.length) || item.specialSpellDescription) {
    const eff = document.createElement("div");
    eff.className = "item-effects";
    eff.innerHTML = effectsGridHtml(item.effects, { specialSpellName: item.specialSpellName, specialSpellDescription: item.specialSpellDescription });
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
    if (item.criticalHitProbability) {
      // On this server criticalHitProbability is a direct percentage, not a "1 in N"
      // denominator (confirmed against the real in-game tooltip: "Critique 20%").
      let crit = `Critique ${item.criticalHitProbability}%`;
      if (item.criticalHitBonus) crit += ` (+${item.criticalHitBonus} Dommages de base)`;
      bits.push(crit);
    }
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

  const set = item.itemSetId && item.itemSetId > 0 ? SETS_BY_ID.get(item.itemSetId) : null;
  const hasRecipe = item.recipe && item.recipe.length > 0;

  if (set || hasRecipe) {
    const setRow = document.createElement("div");
    setRow.className = "set-badge";

    if (set) {
      const setLabel = document.createElement("span");
      setLabel.textContent = `📦 ${set.name} (${set.itemIds.length} pièces)`;
      setRow.appendChild(setLabel);
    }

    const actions = document.createElement("div");
    actions.className = "set-badge-actions";

    if (hasRecipe) {
      const atelierBtn = document.createElement("button");
      atelierBtn.type = "button";
      atelierBtn.className = "secondary atelier-send-btn";
      atelierBtn.title = "Envoyer en atelier";
      const atelierImg = document.createElement("img");
      atelierImg.src = "icons/ui/atelier.svg";
      atelierImg.alt = "";
      atelierBtn.appendChild(atelierImg);
      atelierBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        addItemToAtelier(item.id);
      });
      actions.appendChild(atelierBtn);

      const recipeBtn = document.createElement("button");
      recipeBtn.type = "button";
      recipeBtn.className = "secondary";
      recipeBtn.textContent = "Recette";
      recipeBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openRecipeModal(item.id);
      });
      actions.appendChild(recipeBtn);
    }

    if (set) {
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
    }

    setRow.appendChild(actions);
    card.appendChild(setRow);
  }

  card.addEventListener("click", () => {
    const activeSlot = UI_SLOTS.find(s => s.id === activeUiSlot);
    const targetSlot = (activeSlot && activeSlot.dataSlot === item.slot)
      ? resolveEquipTargetSlot(activeUiSlot)
      : findUiSlotForItem(item);
    if (!targetSlot) return;
    unequipSlot(targetSlot);
    equipped[targetSlot] = item;
    saveEquipped();
    renderPaperdoll();
    renderItemList();
    renderPaPmList();
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

/** Same idea as resolveEquipTargetSlot, but derived from the item's own slot type instead
    of a currently-open single-slot browser - needed for cross-slot lists like Item PA/PM,
    where there's no one "active slot" the click could otherwise fall back to. */
function findUiSlotForItem(item) {
  const candidates = UI_SLOTS.filter(s => s.dataSlot === item.slot);
  if (candidates.length === 0) return null;
  const emptySlot = candidates.find(s => !equipped[s.id]);
  return (emptySlot || candidates[0]).id;
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
      const rollIcon = effectLineIcon(effect.label);
      labelSpan.innerHTML = (rollIcon ? `<span class="stat-icon">${rollIcon}</span>` : "") + escapeHtml(stripSign(effect.label)) + " ";
      const rangeSpan = document.createElement("span");
      rangeSpan.className = "roll-range";
      rangeSpan.textContent = `(${effect.min} à ${effect.max})`;
      labelSpan.appendChild(rangeSpan);
      row.appendChild(labelSpan);

      const input = document.createElement("input");
      input.type = "number";
      input.value = defaultVal;
      input.addEventListener("change", () => {
        // No min/max clamp: the theoretical roll bounds are shown as a hint next to the
        // label, but the user must be free to test any value (e.g. hypothetical/future
        // gear, or checking a stat past its normal cap), not just the item's real range.
        let v = parseInt(input.value, 10);
        if (isNaN(v)) v = defaultVal;
        input.value = v;
        if (!rollOverrides[uiSlotId]) rollOverrides[uiSlotId] = {};
        rollOverrides[uiSlotId][idx] = v;
        saveCustomization();
        renderStats();
      });
      row.appendChild(input);
    } else {
      row.className = "fixed-effect-row";
      const fixedIcon = effectLineIcon(effect.label);
      row.innerHTML = (fixedIcon ? `<span class="stat-icon">${fixedIcon}</span>` : "") + escapeHtml(effectPlainText(effect));
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
    const fmIcon = effectLineIcon(fm.label);
    span.innerHTML = (fmIcon ? `<span class="stat-icon">${fmIcon}</span>` : "") + escapeHtml(`${fm.value >= 0 ? "+" : ""}${fm.value} ${fm.label}`);
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

// Raw weapon damage/vol-de-vie lines are colored by their element (matching the
// elemental characteristic each one borrows its icon from), not a single flat blue.
const WEAPON_ELEMENT_CLASS = { "Terre": "weapon-terre", "Feu": "weapon-feu", "Eau": "weapon-eau", "Air": "weapon-air", "Neutre": "weapon-neutre" };

function weaponEffectClass(label) {
  for (const [element, cls] of Object.entries(WEAPON_ELEMENT_CLASS)) {
    if (label.includes(element)) return cls;
  }
  return "weapon"; // no element in the label (e.g. "(PV rendus)") - flat blue fallback
}

function effectHtml(effect) {
  // Weapon "lost AP" effect: shown as "-1 PA" (matching what it actually does to the
  // target) rather than the raw "+1 (Retrait PA)" the underlying label/operator imply.
  // Its own darker blue keeps it visually distinct from the "Eau" damage/vol lines.
  if (effect.label === "(Retrait PA)") {
    return `<span class="eff weapon-pa">-${effectValueText(effect)} PA</span>`;
  }
  const negative = effect.operator === "-";
  const isWeapon = isWeaponEffect(effect.label);
  const cls = isWeapon ? weaponEffectClass(effect.label) : (negative ? "neg" : "pos");
  let label = stripSign(effect.label);
  // Weapon-roll labels are always parenthesized ("(dommages Terre)", "(vol Feu)",
  // "(PV rendus)") to drive isWeaponEffect() detection - the parens aren't needed once
  // the color already marks them as distinct from real characteristics.
  if (isWeapon && label.startsWith("(") && label.endsWith(")")) {
    label = label.slice(1, -1);
  }
  const valueText = effectValueText(effect);
  // Weapon rolls skip the leading "+" too - "8 à 14 dommages Air", not "+8 à 14".
  const sign = isWeapon ? "" : (negative ? "-" : "+");
  return `<span class="eff ${cls}">${sign}${valueText} ${escapeHtml(label)}</span>`;
}

/** Raw weapon damage/steal/heal-return rolls, e.g. "(dommages Air)", "(vol Terre)", "(PV rendus)" - Category=2 in the game data, always parenthesized. */
function isWeaponEffect(label) {
  return (label || "").trim().startsWith("(");
}

// Weapon/spell damage & lifesteal lines use the same icon as the matching elemental
// characteristic instead of a distinct "damage" icon (e.g. Feu damage/vol -> the
// Intelligence icon) - only in effect descriptions, not in "Statistiques totales"
// (which keeps its own damage-square icon, see statIcon()).
const ELEMENT_TO_CHARACTERISTIC = { "Terre": "Force", "Feu": "Intelligence", "Eau": "Chance", "Air": "Agilité" };

function effectLineIcon(label) {
  // Raw effect labels carry their own sign ("- Initiative", "- Tacle") - strip it so
  // lookups match the unsigned keys in STAT_ICON_SVG/EMOJI_FALLBACK (e.g. "Initiative").
  label = stripSign(label || "");
  const isDamage = label.startsWith("(dommages") || label.startsWith("(vol") || label.startsWith("Dommages ");
  if (isDamage) {
    for (const [element, characteristic] of Object.entries(ELEMENT_TO_CHARACTERISTIC)) {
      if (label.includes(element)) return statIcon(characteristic);
    }
  }
  return statIcon(label);
}

function effectLineHtml(effect) {
  const icon = effectLineIcon(effect.label);
  const iconHtml = icon ? `<span class="stat-icon">${icon}</span>` : "";
  return `<span class="eff-line">${iconHtml}${effectHtml(effect)}</span>`;
}

const SPECIAL_SPELL_STAR_ICON = svg(ICON_SHAPES.star(ICON_YELLOW));

function specialSpellLineHtml(name, description) {
  if (!description) return "";
  const text = name ? `${name} : ${description}` : description;
  return `<span class="eff-line eff-line-spell"><span class="stat-icon">${SPECIAL_SPELL_STAR_ICON}</span><span class="eff spell">${escapeHtml(text)}</span></span>`;
}

const WEAPON_DIVIDER_HTML = '<hr class="eff-weapon-divider">';

/**
 * Inserts the weapon/stats divider into one column's line array, if the weapon/stat
 * boundary (a global index into the full effect list) falls strictly inside this
 * column's own [start, start+lines.length) range. No-op if the whole column is one
 * side of the boundary (all weapon lines, or none).
 */
function insertWeaponDivider(colLines, colStart, boundaryIndex) {
  const local = boundaryIndex - colStart;
  if (local > 0 && local < colLines.length) {
    const result = colLines.slice();
    result.splice(local, 0, WEAPON_DIVIDER_HTML);
    return result;
  }
  return colLines;
}

/**
 * Stable-partitions an effect list so every raw weapon damage/vol/AP-loss roll
 * (isWeaponEffect) comes first, in its original relative order, followed by the
 * item's real stats, also in their original relative order. The export usually
 * already lists weapon rolls first, but not always (varies per weapon row) - this
 * makes the builder's display consistent regardless of that raw ordering.
 */
function weaponEffectsFirst(effects) {
  const weapon = [], rest = [];
  for (const e of effects) (isWeaponEffect(e.label) ? weapon : rest).push(e);
  return weapon.concat(rest);
}

/**
 * Renders an effect list as a 2-column layout: fills the left column top-to-bottom,
 * then the right column, keeping the same number of rows per column (the right
 * column gets one fewer line when the count is odd). Used for item/panoplie effect
 * displays - NOT the FM panel, which stays a single column for readability.
 *
 * Raw weapon damage/vol/AP-loss rolls are always sorted first (see
 * weaponEffectsFirst) - a horizontal divider is inserted right after the last one,
 * splitting them visually from the item's real stats.
 */
function effectsGridHtml(effects, options) {
  options = options || {};
  effects = weaponEffectsFirst(effects || []);
  const lines = effects.map(effectLineHtml);
  if (options.specialSpellDescription) {
    lines.push(specialSpellLineHtml(options.specialSpellName, options.specialSpellDescription));
  }
  if (lines.length === 0) return "";

  let weaponLineCount = 0;
  for (const e of effects) {
    if (!isWeaponEffect(e.label)) break;
    weaponLineCount++;
  }

  const half = Math.ceil(lines.length / 2);
  let col1 = lines.slice(0, half);
  let col2 = lines.slice(half);
  if (weaponLineCount > 0 && weaponLineCount < effects.length) {
    col1 = insertWeaponDivider(col1, 0, weaponLineCount);
    col2 = insertWeaponDivider(col2, half, weaponLineCount);
  }
  return `<div class="effects-grid"><div class="effects-col">${col1.join("")}</div>${col2.length ? `<div class="effects-col">${col2.join("")}</div>` : ""}</div>`;
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

// Only these condition codes can actually be checked against the build (a plain
// stat-planning tool has no idea about guild/quest/alignment/account state etc.) -
// everything else is assumed met rather than flagged, to avoid false positives.
const CONDITION_STAT_LABELS = {
  "CA": "Agilité", "CC": "Chance", "CS": "Force", "CI": "Intelligence",
  "CW": "Sagesse", "CV": "Vitalité", "CM": "PM", "CP": "PA",
};

function conditionIsUnmet(c, combinedStats) {
  if (c.code === "PO") {
    const has = Object.values(equipped).some(it => it.id === parseInt(c.value, 10));
    if (c.operator === "=") return !has;
    if (c.operator === "!") return has;
    return false;
  }
  const statLabel = CONDITION_STAT_LABELS[c.code];
  if (statLabel) {
    const required = parseInt(c.value, 10);
    if (isNaN(required)) return false;
    const current = combinedStats.get(statLabel) || 0;
    if (c.operator === ">") return !(current > required);
    if (c.operator === "<") return !(current < required);
    if (c.operator === "=") return current !== required;
  }
  return false;
}

/** True if the item's own level exceeds the character's, or any checkable condition (stat requirement, PO object-owned) currently fails. */
function itemHasUnmetConditions(item) {
  if (!item) return false;
  if (item.level > getCharLevel()) return true;
  if (!item.conditions || item.conditions.length === 0) return false;
  const combined = computeCombinedStats(equipped, rollOverrides, forgemagie, parchotage, getCharLevel(), characteristicPoints);
  return item.conditions.some(c => conditionIsUnmet(c, combined));
}

// ---------- Weapon damage simulation ----------
// Reproduces FightActor.CalculateDamageBonuses (server source) for a weapon strike:
//   dmg = max(0, (roll * (100 + STAT + Puissance + "Dommages d'armes") / 100
//               + ("Dommages" + "Dommages Critiques"[si crit] + "Dommages physiques/magiques" + "Dommages <élément>"))
//              * (100 + DamageMultiplicator) / 100)
//       * (1 + "% Dommages d'armes"/100) * (1 + "% Dommages mêlée ou distance"/100)
// No target is selected in a stat planner, so resistances (which only apply to a
// defender) are never subtracted - this matches what the in-game tooltip itself shows.
const DAMAGE_ELEMENT_CHARACTERISTIC = { "Terre": "Force", "Neutre": "Force", "Feu": "Intelligence", "Eau": "Chance", "Air": "Agilité" };
const DAMAGE_ELEMENT_PHYSMAGIC = { "Terre": "Dommages physiques", "Neutre": "Dommages physiques", "Feu": "Dommages magiques", "Eau": "Dommages magiques", "Air": "Dommages magiques" };

// Effect_DamageBestElement (server id 2822, "Dommages (Meilleur élément)" - used by
// Flamiche/Foudroiement/Marteau de Moon): server-side (DirectDamage.cs) picks whichever
// element's flat "Dommages X" bonus is highest on the caster - Neutral is the starting
// default, then Earth/Water/Air/Fire each only overtake it on a STRICT >, in that order.
// Not the same rule as HPSteal's best-element pick (that one compares actual computed
// damage instead of the raw stat) - this is the raw-stat variant specifically.
function findBestElement(combinedStats) {
  let best = "Neutre";
  let bestValue = combinedStats.get("Dommages Neutre") || 0;
  for (const el of ["Terre", "Eau", "Air", "Feu"]) {
    const v = combinedStats.get(`Dommages ${el}`) || 0;
    if (v > bestValue) { best = el; bestValue = v; }
  }
  return best;
}

/**
 * Generic version of the formula, shared by weapon strikes and spell casts - only the
 * "done damage %" branch differs (weapon vs spell) and whether melee/ranged applies.
 * A weapon's own criticalHitBonus is NOT handled here: it's a bonus to the BASE dice
 * roll (added to effect.min/max before this function ever sees them - see
 * computeWeaponDamageSimulation), not a flat amount tacked on after the formula.
 * element may be "Meilleur" (Effect_DamageBestElement) - resolved to a concrete element
 * from the current build's stats before any of the lookups below use it.
 */
function simulateDamageLine(effect, element, combinedStats, isCritical, opts) {
  if (element === "Meilleur") element = findBestElement(combinedStats);
  const stat = combinedStats.get(DAMAGE_ELEMENT_CHARACTERISTIC[element]) || 0;
  // "Maîtrise des armes" toggle (weapon damage panel only): +300 Puissance applied ONLY
  // to this simulation, never written into combinedStats - it must stay invisible in
  // "Statistiques totales" and everywhere else that reads the shared stats map.
  const puissance = (combinedStats.get("Puissance") || 0) + (opts.puissanceBonus || 0);
  const weaponFlatBonusPercent = opts.isWeaponAttack ? (combinedStats.get("Dommages d'armes") || 0) : 0; // rare, inside the % bracket
  const flatBonus = combinedStats.get("Dommages") || 0;
  const critFlatBonusStat = isCritical ? (combinedStats.get("Dommages Critiques") || 0) : 0;
  const physMagicBonus = combinedStats.get(DAMAGE_ELEMENT_PHYSMAGIC[element]) || 0;
  const eltBonus = combinedStats.get(`Dommages ${element}`) || 0;
  const mult = combinedStats.get("DamageMultiplicator") || 0; // not a real gear stat on this server, kept for completeness
  const doneDamagePercent = opts.isWeaponAttack
    ? (combinedStats.get("% Dommages d'armes") || 0)
    : (combinedStats.get("% Dommages aux sorts") || 0);
  const meleeOrRangedDonePercent = opts.isMelee
    ? (combinedStats.get("% Dommages mêlée") || 0)
    : (combinedStats.get("% Dommages distance") || 0);

  function apply(roll) {
    let amount = (roll * (100 + stat + puissance + weaponFlatBonusPercent) / 100
      + (flatBonus + critFlatBonusStat + physMagicBonus + eltBonus)) * (100 + mult) / 100;
    if (doneDamagePercent) amount *= (1 + doneDamagePercent / 100);
    if (meleeOrRangedDonePercent) amount *= (1 + meleeOrRangedDonePercent / 100);
    return Math.max(0, Math.floor(amount));
  }

  return { min: apply(effect.min), max: apply(effect.max) };
}

/**
 * Any "(dommages X)"/"(vol X)" roll line in an effect list (weapon or spell), paired
 * with its own critical-roll counterpart from criticalEffects - spells can have a
 * genuinely different, usually higher, roll for their own critical hit, not just the
 * same roll plus a stat bonus. Matched first by exact kind+element (most spells keep
 * the same element on crit), then - since some spells change ELEMENT entirely on a
 * critical hit (e.g. "Bluff": dommages Air normal -> dommages Eau critique) - by kind
 * alone against whatever critical effect is still unclaimed. critElement/critKind are
 * reported separately from element/kind so callers use the right stat (characteristic,
 * "Dommages X") and the right icon for the critical side. Weapons have no separate
 * critical effect list, so critEffect/critElement/critKind fall back to the normal
 * effect's own (their crit differentiation comes entirely from stats + the weapon's own
 * flat criticalHitBonus, applied by the caller before this function ever sees it).
 */
function damageRollLines(effects, criticalEffects) {
  const elements = ["Terre", "Feu", "Eau", "Air", "Neutre"];
  function parse(list) {
    const out = [];
    for (const e of list || []) {
      // "Dommages Poussée" is a flat, non-parenthesized stat effect (Category != 2), not
      // a "(dommages X)"-style roll - bypasses the bracketed-effect gate specifically.
      const isPoussee = e.label === "Dommages Poussée";
      if (!isWeaponEffect(e.label) && !isPoussee) continue;
      let element = elements.find(el => e.label.includes(el));
      let kind;
      if (isPoussee) kind = "poussee";
      else if (e.label.includes("vol")) kind = "vol";
      else if (e.label.includes("PV rendus")) kind = "regen"; // flat HP return, not tied to an element
      else kind = "dommages";
      // Effect_DamageBestElement (id 2822, plain "(dommages)" label, no fixed element) -
      // e.g. Flamiche/Foudroiement/Marteau de Moon - resolved to a concrete element from
      // the current build's stats at simulation time (see findBestElement).
      if (!element && e.effectId === 2822) element = "Meilleur";
      if (!element && kind !== "regen" && kind !== "poussee") continue; // e.g. "(Retrait PA)" - not a damage/regen/poussée roll
      out.push({ effect: e, element: element || null, kind });
    }
    return out;
  }
  const normalLines = parse(effects);
  const critPool = parse(criticalEffects);

  function takeCrit(kind, element) {
    let idx = critPool.findIndex(c => c.kind === kind && c.element === element);
    if (idx === -1) idx = critPool.findIndex(c => c.kind === kind);
    return idx === -1 ? null : critPool.splice(idx, 1)[0];
  }

  return normalLines.map(({ effect, element, kind }) => {
    const crit = takeCrit(kind, element);
    return {
      effect, element, kind,
      critEffect: crit ? crit.effect : effect,
      critElement: crit ? crit.element : element,
      critKind: crit ? crit.kind : kind,
    };
  });
}

/**
 * "Repousse de X case(s)" (effect id 5) carries no damage value of its own. The actual
 * server formula (FightFormulas.CalculatePushBackDamages, read from source - NOT the
 * naive "stat x distance" first assumed, which came out roughly 2x too high):
 *   floor((level/2 + (source.PushDamageBonus - target.PushDamageReduction) + 32) * range / (4 * 2^targets))
 * The planner has no selected enemy, so target's PushDamageReduction is treated as 0
 * (matches how every other damage line here already skips target resistances), and
 * targets=0 (2^0=1, no AoE-multi-target divisor) for a single-target preview. Synthesized
 * as an extra damage-panel line when a Repousse effect is present. The formula's
 * (level/2 + 32) part is NOT a gear bonus - it applies even with 0 Dommages Poussée - so
 * "Base" mode computes with pushDamageBonus forced to 0 (level/range still apply) rather
 * than showing a flat 0; "Réel" plugs in the build's actual stat. Not affected by the
 * spell's own critical roll (a push/collision isn't a crit-able hit).
 */
function pushDamageLine(effects, combinedStats, level) {
  const repousse = (effects || []).find(e => e.effectId === 5);
  if (!repousse) return null;
  // EffectDice.GetValues() takes a different branch when Value==0 && DiceFace==0 (its
  // own convention for "flat DiceNum, no range") - the distance ends up in Min/Max
  // (both equal, e.g. "Repousse de 3 case(s)" -> min:3,max:3), not in .value.
  const range = repousse.max || repousse.value || 0;
  const pushDamageBonus = combinedStats.get("Dommages Poussée") || 0;
  const lvl = Math.min(level || 0, 200);
  const compute = (bonus) => Math.max(0, Math.floor((lvl / 2 + bonus + 32) * range / 4));
  const baseAmount = compute(0);
  const realAmount = compute(pushDamageBonus);
  const fake = { effectId: 414, label: "Dommages Poussée", min: realAmount, max: realAmount };
  const baseVal = { min: baseAmount, max: baseAmount };
  const val = { min: realAmount, max: realAmount };
  // "poussee_calc", not "poussee": this is real inflicted damage (counts toward Total),
  // unlike a spell's own literal flat "Dommages Poussée" effect (a stat buff/grant, e.g.
  // "Trèfle" - not damage this spell itself deals, so kept out of the total).
  return {
    effect: fake, critEffect: fake, element: null, kind: "poussee_calc", critElement: null, critKind: "poussee_calc",
    base: baseVal, baseCritical: baseVal, normal: val, critical: val,
  };
}

function computeWeaponDamageSimulation(weapon, masteryEnabled) {
  const combined = computeCombinedStats(equipped, rollOverrides, forgemagie, parchotage, getCharLevel(), characteristicPoints);
  const critRate = Math.min(100, Math.max(0, (weapon.criticalHitProbability || 0) + (combined.get("% Critique") || 0)));
  const isMelee = weapon.minRange <= 1 && weapon.weaponRange <= 1;
  // "Maîtrise des armes" is a weapon-damage-panel-only toggle: it never touches
  // combinedStats, so it stays invisible everywhere else (Statistiques totales, spells).
  const opts = { isMelee, isWeaponAttack: true, puissanceBonus: masteryEnabled ? 300 : 0 };
  const bonus = weapon.criticalHitBonus || 0;
  const lines = damageRollLines(weapon.effects, null).map(({ effect, element, kind, critElement, critKind }) => {
    // Weapons have no separate CriticalEffectsBin (that's a spell-only mechanic): their
    // own criticalHitBonus is a bonus to the BASE dice roll on a critical hit (both min
    // and max), which then goes through the exact same formula as the normal roll. Does
    // not apply to "PV rendus" (flat HP return isn't a weapon damage roll).
    const critEffect = (bonus && kind !== "regen") ? { ...effect, min: effect.min + bonus, max: effect.max + bonus } : effect;
    const base = { min: effect.min, max: effect.max };
    const baseCritical = { min: critEffect.min, max: critEffect.max };
    // "PV rendus"/"Dommages Poussée" are flat effects, not a stat-scaled damage roll - show as-is.
    const flat = kind === "regen" || kind === "poussee";
    const normal = flat ? base : simulateDamageLine(effect, element, combined, false, opts);
    const critical = flat ? baseCritical : simulateDamageLine(critEffect, critElement, combined, true, opts);
    return { effect, critEffect, element, kind, critElement, critKind, base, baseCritical, normal, critical };
  });
  const pushLine = pushDamageLine(weapon.effects, combined, getCharLevel());
  if (pushLine) lines.push(pushLine);
  // Weapons always have a real critical hit (stat-driven, even with no distinct roll of
  // their own) - unlike spells, where an empty CriticalEffectsBin can mean "cannot crit
  // at all" (see computeSpellGradeDamageSimulation).
  return { critRate, hasCritVariant: true, lines };
}

/**
 * Same simulation for one spell grade - isMelee/isWeaponAttack differ, no weapon
 * criticalHitBonus, and the critical roll comes from the grade's own CriticalEffects
 * when present. Unlike weapons (which always crit via player stats even with no
 * distinct roll of their own), a spell whose raw CriticalEffectsBin is genuinely empty
 * cannot crit at all - e.g. a glyph/trap's own "lay it down" cast has no critical
 * version server-side (only the thing it triggers can, and that's already merged into
 * this same grade's Effects, not a separate crit roll). hasCritVariant flags this so
 * the panel can skip the critical column entirely instead of showing a misleading
 * "critical" value that's really just the normal roll plus the player's crit stats.
 */
function computeSpellGradeDamageSimulation(grade) {
  const combined = computeCombinedStats(equipped, rollOverrides, forgemagie, parchotage, getCharLevel(), characteristicPoints);
  const hasCritVariant = (grade.criticalEffects || []).length > 0;
  const critRate = Math.min(100, Math.max(0, (grade.criticalHitProbability || 0) + (combined.get("% Critique") || 0)));
  const isMelee = grade.minRange <= 1 && grade.range <= 1;
  const opts = { isMelee, isWeaponAttack: false };
  const lines = damageRollLines(grade.effects, grade.criticalEffects).map(({ effect, critEffect, element, kind, critElement, critKind }) => {
    const base = { min: effect.min, max: effect.max };
    const baseCritical = { min: critEffect.min, max: critEffect.max };
    // "PV rendus"/"Dommages Poussée" are flat effects, not a stat-scaled damage roll - show as-is.
    const flat = kind === "regen" || kind === "poussee";
    const normal = flat ? base : simulateDamageLine(effect, element, combined, false, opts);
    const critical = flat ? baseCritical : simulateDamageLine(critEffect, critElement, combined, true, opts);
    return { effect, critEffect, element, kind, critElement, critKind, base, baseCritical, normal, critical };
  });
  const pushLine = pushDamageLine(grade.effects, combined, getCharLevel());
  if (pushLine) lines.push(pushLine);
  return { critRate, hasCritVariant, lines };
}

function damageLineHtml(line, key) {
  const isCrit = key.includes("ritical");
  const kind = isCrit ? line.critKind : line.kind;
  const srcEffect = isCrit ? line.critEffect : line.effect;
  const icon = effectLineIcon(srcEffect.label);
  const v = line[key];
  // Always render the label span (even empty) so it reserves a fixed column width -
  // the icon/value must line up whether or not this particular line says "Vol".
  const kindLabel = `<span class="damage-kind-label">${kind === "vol" ? "Vol" : ""}</span>`;
  let valueText = `${v.min} à ${v.max}`;
  let regainNote = "";
  if (kind === "regen" || kind === "poussee") {
    // "PV rendus"/"Dommages Poussée" are themselves the gain/bonus amount - show as a "+".
    valueText = `+${v.min} à +${v.max}`;
  } else if (kind === "vol") {
    // Vol de vie: the caster only actually regains half of the damage dealt on this line.
    const halfMin = Math.floor(v.min / 2);
    const halfMax = Math.floor(v.max / 2);
    regainNote = ` <span class="damage-regain-note">(❤️ ${halfMin} à ${halfMax})</span>`;
  }
  return `<span class="damage-two-col-line${isCrit ? " critical" : ""}">${kindLabel}${icon ? `<span class="stat-icon">${icon}</span>` : ""}${valueText}${regainNote}</span>`;
}

/**
 * Renders a damage simulation as 2 plain columns - non-critique left, critique right -
 * one value line per damage roll, icon-only (no repeated "Dommages Terre :" text per
 * line): which line is which element is conveyed by the icon and by the two columns
 * lining up row-for-row. "réel" (default) shows values simulated from the current
 * build's stats; "base" shows the raw roll (spell criticals use their own distinct
 * CriticalEffects roll here too, when the spell has one - not the same value twice).
 */
function damageTwoColumnHtml(sim, mode) {
  if (sim.lines.length === 0) return '<div class="stat-empty">Pas de ligne de dégâts/vol de vie.</div>';
  const key1 = mode === "base" ? "base" : "normal";
  const col1 = sim.lines.map(l => damageLineHtml(l, key1)).join("");
  // No critical column at all when the spell genuinely cannot crit (see hasCritVariant) -
  // showing one would just repeat the normal roll plus the player's crit stats, implying
  // a critical hit is possible when it isn't.
  if (sim.hasCritVariant === false) {
    return `<div class="damage-two-col"><div class="damage-two-col-col"><h4>${mode === "base" ? "Dégâts de base" : "Dégâts"}</h4>${col1}</div></div>`;
  }
  const key2 = mode === "base" ? "baseCritical" : "critical";
  const col2 = sim.lines.map(l => damageLineHtml(l, key2)).join("");
  return `<div class="damage-two-col">
    <div class="damage-two-col-col"><h4>${mode === "base" ? "Dégâts de base" : "Dégâts non critiques"}</h4>${col1}</div>
    <div class="damage-two-col-col"><h4>${mode === "base" ? "Dégâts de base critiques" : "Dégâts critiques"}</h4>${col2}</div>
  </div>`;
}

/**
 * Sum of every line's min/max, per column - "PV rendus" lines are excluded (they're a
 * flat HP return to the caster, not damage inflicted, so they don't belong in a damage
 * total). A line's critical side can carry a different kind than its normal side is rare
 * in practice but checked independently (critKind) to stay correct either way.
 */
function damageTotalHtml(sim, mode) {
  if (sim.lines.length === 0) return "";
  const key1 = mode === "base" ? "base" : "normal";
  let min1 = 0, max1 = 0;
  for (const l of sim.lines) {
    if (l.kind !== "regen" && l.kind !== "poussee") { min1 += l[key1].min; max1 += l[key1].max; }
  }
  if (sim.hasCritVariant === false) {
    return `<div class="damage-two-col damage-total-row"><div class="damage-two-col-col"><h4>Total</h4><span class="damage-two-col-line">${min1} à ${max1}</span></div></div>`;
  }
  const key2 = mode === "base" ? "baseCritical" : "critical";
  let min2 = 0, max2 = 0;
  for (const l of sim.lines) {
    if (l.critKind !== "regen" && l.critKind !== "poussee") { min2 += l[key2].min; max2 += l[key2].max; }
  }
  return `<div class="damage-two-col damage-total-row">
    <div class="damage-two-col-col"><h4>Total</h4><span class="damage-two-col-line">${min1} à ${max1}</span></div>
    <div class="damage-two-col-col"><h4>Total</h4><span class="damage-two-col-line critical">${min2} à ${max2}</span></div>
  </div>`;
}

/**
 * Damage section with a "Base"/"Réel" toggle pair on the right, same row as the
 * column headers. Both renderings are built upfront and toggled via a "hidden" class -
 * cheap since the underlying sim values are already computed, and avoids re-rendering
 * on click. Call wireDamageToggle(cardEl) once the returned HTML is in the DOM.
 */
function damageSectionHtml(sim) {
  if (sim.lines.length === 0) return "";
  return `
    <div class="damage-toggle-row">
      <div class="damage-toggle-buttons">
        <button type="button" class="damage-toggle-btn active" data-mode="reel">Réel</button>
        <button type="button" class="damage-toggle-btn" data-mode="base">Base</button>
      </div>
    </div>
    <div class="damage-content" data-mode="reel">${damageTwoColumnHtml(sim, "reel")}${damageTotalHtml(sim, "reel")}</div>
    <div class="damage-content hidden" data-mode="base">${damageTwoColumnHtml(sim, "base")}${damageTotalHtml(sim, "base")}</div>
  `;
}

function wireDamageToggle(cardEl) {
  const buttons = cardEl.querySelectorAll(".damage-toggle-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      buttons.forEach(b => b.classList.toggle("active", b === btn));
      cardEl.querySelectorAll(".damage-content").forEach(c => c.classList.toggle("hidden", c.dataset.mode !== mode));
    });
  });
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Builds an <img> for the item's icon, falling back to an emoji glyph (or a placeholder image path) if the icon is missing or fails to load. */
function itemIconEl(item, fallbackGlyph, className) {
  if (!item || !item.iconId) {
    if (typeof fallbackGlyph === "string" && fallbackGlyph.startsWith("icons/")) {
      const img = document.createElement("img");
      img.className = className + " icon-placeholder";
      img.src = fallbackGlyph;
      img.alt = "";
      return img;
    }
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

/** Same fallback pattern as itemIconEl, but for a spell's own icon (separate id namespace/folder, extracted from the client's gfx/spells/all.swf via FFDec). */
function spellIconEl(spell, fallbackGlyph, className) {
  if (!spell || !spell.iconId) {
    const span = document.createElement("span");
    span.className = className + " icon-fallback";
    span.textContent = fallbackGlyph;
    return span;
  }
  const img = document.createElement("img");
  img.className = className;
  img.src = `icons/spells/${spell.iconId}.png`;
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
  document.getElementById("setModalCompatBtn").onclick = () => openCompatibleSetsModal(setId);
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
    if (item.recipe && item.recipe.length) {
      const recipeBtn = document.createElement("button");
      recipeBtn.type = "button";
      recipeBtn.className = "equip-item-btn";
      recipeBtn.textContent = "Recette";
      recipeBtn.addEventListener("click", () => openRecipeModal(item.id));
      row.appendChild(recipeBtn);
    }
    const equipBtn = document.createElement("button");
    equipBtn.type = "button";
    equipBtn.className = "equip-item-btn";
    equipBtn.textContent = "Équiper";
    equipBtn.addEventListener("click", () => {
      equipSingleItem(item);
      openSetPreview(setId);
    });
    row.appendChild(equipBtn);

    if ((item.effects && item.effects.length) || item.specialSpellDescription) {
      const eff = document.createElement("div");
      eff.className = "set-item-effects";
      eff.innerHTML = effectsGridHtml(item.effects, { specialSpellName: item.specialSpellName, specialSpellDescription: item.specialSpellDescription });
      row.appendChild(eff);
    }

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
      eff.innerHTML = effectsGridHtml(tierEffects);
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

// "Pano Multi": a set where at least one SINGLE item (not the set's stats pooled
// together) matches one of three "generalist" patterns - a pure-Puissance item (no
// characteristic at all), an item granting all 4 characteristics, or an item granting
// all 4 elemental damages. Checked per-item, unlike the other flags below (which are a
// union across the whole set) because the point is "does one piece do this by itself".
function itemMatchesMultiPattern(item) {
  const labels = new Set((item.effects || []).map(eff => stripSign(eff.label)));
  const hasAnyCharacteristic = labels.has("Force") || labels.has("Chance") || labels.has("Intelligence") || labels.has("Agilité");
  if (labels.has("Puissance") && !hasAnyCharacteristic) return true;
  if (labels.has("Force") && labels.has("Chance") && labels.has("Intelligence") && labels.has("Agilité")) return true;
  if (labels.has("Dommages Terre") && labels.has("Dommages Eau") && labels.has("Dommages Feu") && labels.has("Dommages Air")) return true;
  return false;
}

function computeSetFlags(set) {
  const bonusLabels = new Set();
  for (const tier of set.bonuses || []) for (const eff of tier) bonusLabels.add(stripSign(eff.label));

  const itemLabels = new Set();
  let multi = false;
  for (const itemId of set.itemIds) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    for (const eff of item.effects || []) itemLabels.add(stripSign(eff.label));
    if (itemMatchesMultiPattern(item)) multi = true;
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
    dopou: itemLabels.has("Dommages Poussée"),
    docri: itemLabels.has("Dommages Critiques"),
    multi,
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

/** Stat filters render as toggle chips (like the other boolean filter rows); activating one
    reveals a small value box directly beneath it to set the minimum threshold. */
function renderStatFilterChips() {
  const row = document.getElementById("statFilterChipRow");
  const options = sortStatEntries(EFFECT_LABELS.filter(l => !isWeaponEffect(l)).map(l => [l])).map(([l]) => l);
  row.innerHTML = "";
  for (const stat of options) {
    const existing = activeStatFilters.find(f => f.stat === stat);

    const group = document.createElement("div");
    group.className = "stat-toggle-chip-group" + (existing ? " active" : "");

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip" + (existing ? " active" : "");
    chip.textContent = stat;
    group.appendChild(chip);

    const valueBox = document.createElement("div");
    valueBox.className = "stat-toggle-chip-value-box";
    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.className = "stat-toggle-chip-value";
    valueInput.min = "0";
    valueInput.placeholder = "Valeur mini";
    valueInput.value = existing ? existing.minValue : 0;
    valueInput.addEventListener("input", () => {
      const f = activeStatFilters.find(f => f.stat === stat);
      if (!f) return;
      const v = parseInt(valueInput.value, 10);
      f.minValue = isNaN(v) ? 0 : v;
      renderItemList();
    });
    valueBox.appendChild(valueInput);
    group.appendChild(valueBox);

    chip.addEventListener("click", () => {
      const idx = activeStatFilters.findIndex(f => f.stat === stat);
      if (idx >= 0) {
        activeStatFilters.splice(idx, 1);
        group.classList.remove("active");
        chip.classList.remove("active");
      } else {
        activeStatFilters.push({ stat, minValue: 0 });
        valueInput.value = 0;
        group.classList.add("active");
        chip.classList.add("active");
        valueInput.focus();
      }
      renderItemList();
    });

    row.appendChild(group);
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

function renderSetsSlotTypeExcludeFilterChips() {
  const row = document.getElementById("setsSlotExcludeFilterRow");
  if (!row) return;
  row.innerHTML = "";
  for (const def of SLOT_TYPE_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (activeSlotTypeExcludeFilters.has(def.key)) activeSlotTypeExcludeFilters.delete(def.key);
      else activeSlotTypeExcludeFilters.add(def.key);
      chip.classList.toggle("active", activeSlotTypeExcludeFilters.has(def.key));
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

/** A set matches only if it contains NO item of ANY active exclude-slot-type filter. */
function setMatchesSlotTypeExcludeFilters(set) {
  if (activeSlotTypeExcludeFilters.size === 0) return true;
  return [...activeSlotTypeExcludeFilters].every(slot =>
    !set.itemIds.some(id => {
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
  levelMaxInput.value = getCharLevel();
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

  const excludeLabel = document.createElement("div");
  excludeLabel.className = "sets-filter-label";
  excludeLabel.textContent = "Ne contient pas de/d' :";
  root.appendChild(excludeLabel);

  const activeSlotExcludeFilters = new Set();
  const slotExcludeFilterRow = document.createElement("div");
  slotExcludeFilterRow.className = "sets-filter-row";
  for (const def of SLOT_TYPE_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (activeSlotExcludeFilters.has(def.key)) activeSlotExcludeFilters.delete(def.key);
      else activeSlotExcludeFilters.add(def.key);
      chip.classList.toggle("active", activeSlotExcludeFilters.has(def.key));
      rerender();
    });
    slotExcludeFilterRow.appendChild(chip);
  }
  root.appendChild(slotExcludeFilterRow);

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
    if (activeSlotExcludeFilters.size > 0) {
      sets = sets.filter(s => [...activeSlotExcludeFilters].every(slot =>
        !s.itemIds.some(id => {
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
  updateHiddenButtonsLabel();
  const listEl = document.getElementById("setsList");
  const search = document.getElementById("setsSearchInput").value.trim().toLowerCase();
  const sort = document.getElementById("setsSortSelect").value;

  const levelMin = parseInt(document.getElementById("setsLevelMinInput").value, 10);
  const levelMax = parseInt(document.getElementById("setsLevelMaxInput").value, 10);

  let sets = [...SETS_BY_ID.values()].filter(s => s.itemIds.length > 0 && !hiddenSetIds.has(s.id));
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
  sets = sets.filter(setMatchesSlotTypeExcludeFilters);
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

  const headerActions = document.createElement("div");
  headerActions.className = "set-card-header-actions";

  const quickEquipBtn = document.createElement("button");
  quickEquipBtn.type = "button";
  quickEquipBtn.className = "set-card-compat-btn";
  quickEquipBtn.textContent = "Équiper la panoplie entière";
  quickEquipBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    equipEntireSet(set.id);
  });
  headerActions.appendChild(quickEquipBtn);

  const compatBtn = document.createElement("button");
  compatBtn.type = "button";
  compatBtn.className = "set-card-compat-btn";
  compatBtn.textContent = "Panoplies compatibles";
  compatBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openCompatibleSetsModal(set.id);
  });
  headerActions.appendChild(compatBtn);

  const hideCol = document.createElement("div");
  hideCol.className = "set-card-hide-col";

  const hideSetBtn = document.createElement("button");
  hideSetBtn.type = "button";
  hideSetBtn.className = "hide-btn";
  hideSetBtn.title = "Cacher cette panoplie";
  hideSetBtn.textContent = "Cacher";
  hideSetBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    hiddenSetIds.add(set.id);
    saveHidden();
    renderSetsList();
  });
  hideCol.appendChild(hideSetBtn);

  const atelierSetBtn = document.createElement("button");
  atelierSetBtn.type = "button";
  atelierSetBtn.className = "atelier-send-btn";
  atelierSetBtn.title = "Envoyer toute la panoplie en atelier";
  const atelierSetImg = document.createElement("img");
  atelierSetImg.src = "icons/ui/atelier.svg";
  atelierSetImg.alt = "";
  atelierSetBtn.appendChild(atelierSetImg);
  atelierSetBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    sendSetToAtelier(set);
  });
  hideCol.appendChild(atelierSetBtn);

  headerActions.appendChild(hideCol);

  header.appendChild(headerActions);

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

    if (item.recipe && item.recipe.length) {
      const recipeBtn = document.createElement("button");
      recipeBtn.type = "button";
      recipeBtn.className = "equip-item-btn";
      recipeBtn.textContent = "Recette";
      recipeBtn.addEventListener("click", () => openRecipeModal(item.id));
      row.appendChild(recipeBtn);
    }
    const equipBtn = document.createElement("button");
    equipBtn.type = "button";
    equipBtn.className = "equip-item-btn";
    equipBtn.textContent = "Équiper";
    equipBtn.addEventListener("click", () => equipSingleItem(item));
    row.appendChild(equipBtn);

    if ((item.effects && item.effects.length) || item.specialSpellDescription) {
      const eff = document.createElement("div");
      eff.className = "set-item-effects";
      eff.innerHTML = effectsGridHtml(item.effects, { specialSpellName: item.specialSpellName, specialSpellDescription: item.specialSpellDescription });
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
      eff.innerHTML = effectsGridHtml(tierEffects);
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
      renderPaperdoll();
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
      renderPaperdoll();
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
        eff.innerHTML = effectsGridHtml(tierEffects);
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

function openRecipeModal(itemId) {
  const item = ITEMS_BY_ID.get(itemId);
  if (!item) return;

  document.getElementById("recipeModalTitle").textContent = `Recette : ${item.name}`;
  const body = document.getElementById("recipeModalBody");
  body.innerHTML = "";

  if (!item.recipe || item.recipe.length === 0) {
    body.innerHTML = '<div class="stat-empty">Recette inconnue pour cet objet.</div>';
  } else {
    for (const ing of item.recipe) {
      const row = document.createElement("div");
      row.className = "resource-row";
      row.appendChild(itemIconEl({ iconId: ing.iconId }, "🧱", "item-icon"));
      const name = document.createElement("span");
      name.className = "resource-name";
      name.textContent = ing.name;
      row.appendChild(name);
      const qty = document.createElement("span");
      qty.className = "resource-qty";
      qty.textContent = `× ${ing.quantity}`;
      row.appendChild(qty);
      body.appendChild(row);
    }
  }

  document.getElementById("recipeModalOverlay").classList.remove("hidden");
}

function closeRecipeModal() {
  document.getElementById("recipeModalOverlay").classList.add("hidden");
}

// ---------- Atelier ----------

function openAtelierModal() {
  renderAtelierModal();
  document.getElementById("atelierModalOverlay").classList.remove("hidden");
}

function closeAtelierModal() {
  document.getElementById("atelierModalOverlay").classList.add("hidden");
}

function renderAtelierModal() {
  const body = document.getElementById("atelierModalBody");
  body.innerHTML = "";

  if (atelierOrder.length === 0) {
    body.innerHTML = '<div class="stat-empty">Aucun objet envoyé en atelier. Cliquez sur l\'icône marteau à côté d\'un objet équipé (ou celle au centre de la case vide à gauche des coiffes) pour l\'ajouter ici.</div>';
    return;
  }

  if (atelierViewMode === "resource") {
    body.appendChild(renderAtelierResourceView());
    return;
  }

  for (const itemId of atelierOrder) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item) continue;
    body.appendChild(renderAtelierCard(item));
  }
}

/** ingredientItemId -> { name, iconId, needed, have } aggregated across every item currently in the atelier. */
function computeAtelierResourceTotals() {
  const totals = new Map();
  for (const itemId of atelierOrder) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item || !item.recipe) continue;
    const copies = Math.max(1, atelierCopies[itemId] || 1);
    const have = atelierHave[itemId] || {};
    for (const ing of item.recipe) {
      let t = totals.get(ing.itemId);
      if (!t) {
        t = { name: ing.name, iconId: ing.iconId, needed: 0, have: 0 };
        totals.set(ing.itemId, t);
      }
      t.needed += ing.quantity * copies;
      t.have += have[ing.itemId] || 0;
    }
  }
  return totals;
}

/** Redistributes a resource's new total "have" across every item using it, filling each
 * item's own need in atelierOrder order before moving to the next (waterfall allocation) -
 * mirrors filling recipes one at a time with a shared pile of one raw resource. */
function distributeResourceHave(ingredientItemId, totalHave) {
  let remaining = Math.max(0, totalHave);
  for (const itemId of atelierOrder) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item || !item.recipe) continue;
    const ing = item.recipe.find(r => r.itemId === ingredientItemId);
    if (!ing) continue;
    const copies = Math.max(1, atelierCopies[itemId] || 1);
    const needed = ing.quantity * copies;
    const have = atelierHave[itemId] || (atelierHave[itemId] = {});
    const allocate = Math.min(remaining, needed);
    have[ingredientItemId] = allocate;
    remaining -= allocate;
  }
  saveAtelier();
}

function renderAtelierResourceView() {
  const wrap = document.createElement("div");
  wrap.className = "atelier-resource-view";

  const totals = computeAtelierResourceTotals();
  const ids = [...totals.keys()].sort((a, b) => totals.get(a).name.localeCompare(totals.get(b).name));

  if (ids.length === 0) {
    const none = document.createElement("div");
    none.className = "stat-empty";
    none.textContent = "Recette inconnue pour tous les objets de l'atelier.";
    wrap.appendChild(none);
    return wrap;
  }

  for (const ingId of ids) {
    const t = totals.get(ingId);
    const row = document.createElement("div");
    row.className = "atelier-ingredient-row" + (t.have === t.needed ? " fulfilled" : "");
    row.appendChild(itemIconEl({ iconId: t.iconId }, "🧱", "item-icon"));

    const name = document.createElement("span");
    name.className = "resource-name";
    name.textContent = t.name;
    row.appendChild(name);

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.className = "atelier-have-input";
    input.value = t.have;

    const needed = document.createElement("span");
    needed.className = "atelier-needed";
    needed.textContent = "/ " + t.needed;

    input.addEventListener("input", () => {
      const v = Math.max(0, Number(input.value) || 0);
      distributeResourceHave(ingId, v);
      row.classList.toggle("fulfilled", v === t.needed);
    });

    row.appendChild(input);
    row.appendChild(needed);
    wrap.appendChild(row);
  }

  return wrap;
}

function renderAtelierCard(item) {
  const card = document.createElement("div");
  card.className = "atelier-card";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "atelier-card-remove-btn";
  removeBtn.textContent = "×";
  removeBtn.title = "Retirer de l'atelier";
  removeBtn.addEventListener("click", () => removeItemFromAtelier(item.id));
  card.appendChild(removeBtn);

  const header = document.createElement("div");
  header.className = "atelier-card-header";
  header.appendChild(itemIconEl(item, "🔨", "item-icon"));
  const name = document.createElement("span");
  name.className = "atelier-card-name";
  name.textContent = item.name;
  header.appendChild(name);

  const copiesInput = document.createElement("input");
  copiesInput.type = "number";
  copiesInput.min = "1";
  copiesInput.className = "atelier-copies-input";
  copiesInput.title = "Nombre d'exemplaires à fabriquer";
  copiesInput.value = atelierCopies[item.id] || 1;
  header.appendChild(copiesInput);

  card.appendChild(header);

  const ingredients = document.createElement("div");
  ingredients.className = "atelier-ingredient-list";

  const rowUpdaters = [];

  if (!item.recipe || item.recipe.length === 0) {
    const none = document.createElement("div");
    none.className = "stat-empty";
    none.textContent = "Recette inconnue pour cet objet.";
    ingredients.appendChild(none);
  } else {
    const have = atelierHave[item.id] || (atelierHave[item.id] = {});
    for (const ing of item.recipe) {
      const row = document.createElement("div");
      row.className = "atelier-ingredient-row";
      row.appendChild(itemIconEl({ iconId: ing.iconId }, "🧱", "item-icon"));

      const name2 = document.createElement("span");
      name2.className = "resource-name";
      name2.textContent = ing.name;
      row.appendChild(name2);

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.className = "atelier-have-input";
      input.value = have[ing.itemId] || 0;

      const needed = document.createElement("span");
      needed.className = "atelier-needed";

      const update = () => {
        const copies = Math.max(1, Number(copiesInput.value) || 1);
        const totalNeeded = ing.quantity * copies;
        needed.textContent = "/ " + totalNeeded;
        row.classList.toggle("fulfilled", Number(input.value) === totalNeeded);
      };
      input.addEventListener("input", () => {
        const v = Math.max(0, Number(input.value) || 0);
        have[ing.itemId] = v;
        saveAtelier();
        update();
      });
      rowUpdaters.push(update);
      update();

      row.appendChild(input);
      row.appendChild(needed);
      ingredients.appendChild(row);
    }
  }

  copiesInput.addEventListener("input", () => {
    const v = Math.max(1, Number(copiesInput.value) || 1);
    atelierCopies[item.id] = v;
    saveAtelier();
    rowUpdaters.forEach(fn => fn());
  });

  card.appendChild(ingredients);
  return card;
}

// ---------- Ladder (XP / Succès) ----------
// data/ladder.json is published independently of items.json/sets.json, refreshed every ~5min
// by tools/refresh-ladder.ps1 (a scheduled task, not this app) straight from the live
// "characters" table - see that script for the full pipeline.
function openLadderModal() {
  document.getElementById("ladderModalOverlay").classList.remove("hidden");
  if (ladderData) {
    renderLadderList();
    return;
  }
  const listEl = document.getElementById("ladderList");
  listEl.innerHTML = '<div class="stat-empty">Chargement…</div>';
  fetch("data/ladder.json", { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      ladderData = data;
      renderLadderList();
    })
    .catch(() => {
      listEl.innerHTML = '<div class="stat-empty">Impossible de charger le ladder.</div>';
    });
}

function renderLadderList() {
  const listEl = document.getElementById("ladderList");
  const updatedEl = document.getElementById("ladderUpdated");
  if (!ladderData) return;

  if (ladderData.generatedAt) {
    const d = new Date(ladderData.generatedAt);
    updatedEl.textContent = "Mis à jour : " + d.toLocaleString("fr-FR");
  }

  const rows = ladderData[ladderActiveTab] || [];
  listEl.innerHTML = "";
  if (rows.length === 0) {
    listEl.innerHTML = '<div class="stat-empty">Aucune donnée.</div>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const row of rows) {
    const el = document.createElement("div");
    el.className = "ladder-row";
    el.innerHTML = `<span class="ladder-rank">#${row.rank}</span><span class="ladder-name"></span><span class="ladder-value"></span><span class="ladder-level"></span>`;
    el.querySelector(".ladder-name").textContent = row.name;
    el.querySelector(".ladder-value").textContent = row.value.toLocaleString("fr-FR");
    const levelEl = el.querySelector(".ladder-level");
    if (row.level !== undefined) levelEl.textContent = "Nv. " + row.level;
    else levelEl.remove();
    frag.appendChild(el);
  }
  listEl.appendChild(frag);
}

// "items" or "sets" - which list the modal's shared "Démasquer tout" button acts on.
let hiddenModalMode = null;

/** Hidden items belonging to the currently browsed category (dofus/trophée share one ITEMS_BY_SLOT bucket, split via itemMatchesCategory). */
function hiddenItemsInCurrentCategory() {
  const bucket = activeCategory === "trophee" || activeCategory === "dofus" ? "dofus" : activeCategory;
  return (ITEMS_BY_SLOT.get(bucket) || []).filter(i => hiddenItemIds.has(i.id) && itemMatchesCategory(i, activeCategory));
}

function updateHiddenButtonsLabel() {
  const itemsBtn = document.getElementById("hiddenItemsBtn");
  if (itemsBtn) itemsBtn.textContent = `Cachés (${hiddenItemsInCurrentCategory().length})`;

  const setsBtn = document.getElementById("hiddenSetsBtn");
  if (setsBtn) setsBtn.textContent = `Cachées (${hiddenSetIds.size})`;
}

function openHiddenItemsModal() {
  hiddenModalMode = "items";
  document.getElementById("hiddenModalTitle").textContent = "Objets cachés";
  renderHiddenModalBody();
  document.getElementById("hiddenModalOverlay").classList.remove("hidden");
}

function openHiddenSetsModal() {
  hiddenModalMode = "sets";
  document.getElementById("hiddenModalTitle").textContent = "Panoplies cachées";
  renderHiddenModalBody();
  document.getElementById("hiddenModalOverlay").classList.remove("hidden");
}

function closeHiddenModal() {
  document.getElementById("hiddenModalOverlay").classList.add("hidden");
}

/** Persists across re-renders of the weapon damage modal (not saved with the build - a display-only toggle for this panel). */
let weaponMasteryEnabled = true;

function openWeaponDamageModal() {
  const weapon = equipped["arme"];
  const body = document.getElementById("weaponDamageModalBody");
  body.innerHTML = "";

  if (!weapon) {
    body.innerHTML = '<div class="stat-empty">Équipez une arme pour voir la simulation de dégâts.</div>';
    document.getElementById("weaponDamageModalOverlay").classList.remove("hidden");
    return;
  }

  const sim = computeWeaponDamageSimulation(weapon, weaponMasteryEnabled);

  const paramsItems = [paramIconItem("PA", `${weapon.apCost} PA`)];
  if (weapon.minRange !== undefined && weapon.weaponRange !== undefined) {
    const rangeText = weapon.minRange === weapon.weaponRange ? `Portée ${weapon.weaponRange}` : `Portée ${weapon.minRange}-${weapon.weaponRange}`;
    paramsItems.push(paramIconItem("Portée", rangeText));
  }
  let critText = `Critique ${sim.critRate}%`;
  if (weapon.criticalHitBonus) critText += ` (+${weapon.criticalHitBonus} Dommages de base)`;
  paramsItems.push(paramIconItem("% Critique", critText));
  if (weapon.maxCastPerTurn) paramsItems.push(plainParamItem(`${weapon.maxCastPerTurn} utilisation${weapon.maxCastPerTurn > 1 ? "s" : ""} par tour`));

  const card = document.createElement("div");
  card.className = "spell-card";
  card.innerHTML = `
    <div class="spell-card-header">
      <div>
        <div class="spell-card-title">${escapeHtml(weapon.name)}</div>
        <div class="spell-card-level">Niveau ${weapon.level}</div>
      </div>
    </div>
    <div class="mastery-toggle-row">
      <button type="button" class="mastery-toggle-btn${weaponMasteryEnabled ? " active" : ""}" data-mastery="1">Maîtrise des armes</button>
      <button type="button" class="mastery-toggle-btn${weaponMasteryEnabled ? "" : " active"}" data-mastery="0">Pas de Maîtrise</button>
    </div>
    ${damageSectionHtml(sim)}
    <hr class="spell-card-hr">
    <div class="spell-card-params">
      ${paramsItems.join("")}
    </div>
    <hr class="spell-card-hr">
    <div class="spell-card-effects">${effectsGridHtml((weapon.effects || []).filter(e => e.effectId !== 5), { specialSpellName: weapon.specialSpellName, specialSpellDescription: weapon.specialSpellDescription })}</div>
  `;
  wireDamageToggle(card);
  card.querySelectorAll(".mastery-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      weaponMasteryEnabled = btn.dataset.mastery === "1";
      openWeaponDamageModal();
    });
  });
  body.appendChild(card);
  document.getElementById("weaponDamageModalOverlay").classList.remove("hidden");
}

function closeWeaponDamageModal() {
  document.getElementById("weaponDamageModalOverlay").classList.add("hidden");
}

// ---------- Item PA-PM ----------

// Montures/familiers/dofus/trophées excluded per user request - "monture"/"familier" both
// carry raw slot "dragodinde"/"familier" (see dataSlotForItem's grouping), "dofus" slot
// covers both regular dofus and trophées (distinguished only by typeId elsewhere).
const PA_PM_EXCLUDED_SLOTS = new Set(["familier", "dragodinde", "dofus"]);

function isPaFilterItem(item) {
  // Special case per user request: "Talisman Songe" (+2 PA) is the one amulette allowed
  // in the PA list even though it fails the "not amulette" rule below.
  if (item.id === 14169) return true;
  if (item.slot === "amulette" || PA_PM_EXCLUDED_SLOTS.has(item.slot)) return false;
  return (item.effects || []).some(e => stripSign(e.label) === "PA" && getEffectComparableValue(e) > 0);
}

function isPmFilterItem(item) {
  if (PA_PM_EXCLUDED_SLOTS.has(item.slot)) return false;
  // Special case per user request: Bottes Dogues (+2 PM) is the one boot allowed in the
  // PM list even though it fails both the "not bottes" and "exactly +1" rules below.
  if (item.name === "Bottes Dogues") return true;
  if (item.slot === "bottes") return false;
  return (item.effects || []).some(e => stripSign(e.label) === "PM" && getEffectComparableValue(e) === 1);
}

function openPaPmPicker() {
  document.getElementById("paPmPickerModalOverlay").classList.remove("hidden");
}

function closePaPmPicker() {
  document.getElementById("paPmPickerModalOverlay").classList.add("hidden");
}

/** Same filter set as the main item browser, kept in its own state so opening this panel never disturbs the main browser's filters. */
let paPmActiveKind = "pa";
let paPmNoPanoFilterActive = false;
let paPmWithPanoFilterActive = false;
let paPmActiveStatFilters = [];
/** Slot chips (OR logic: any selected slot matches, all shown when none selected) - no "Bouclier", per user request. */
const PA_PM_SLOT_FILTER_DEFS = [
  { key: "coiffe", label: "Coiffe" },
  { key: "cape", label: "Cape" },
  { key: "amulette", label: "Amulette" },
  { key: "anneau", label: "Anneau" },
  { key: "arme", label: "Arme" },
  { key: "ceinture", label: "Ceinture" },
  { key: "bottes", label: "Bottes" },
];
let paPmActiveSlotFilters = new Set();

function renderPaPmSlotFilterChips() {
  const row = document.getElementById("paPmSlotFilterRow");
  row.innerHTML = "";
  for (const def of PA_PM_SLOT_FILTER_DEFS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = def.label;
    chip.addEventListener("click", () => {
      if (paPmActiveSlotFilters.has(def.key)) paPmActiveSlotFilters.delete(def.key);
      else paPmActiveSlotFilters.add(def.key);
      chip.classList.toggle("active", paPmActiveSlotFilters.has(def.key));
      renderPaPmList();
    });
    row.appendChild(chip);
  }
}

function populatePaPmStatFilterSelect() {
  const select = document.getElementById("paPmStatFilterSelect");
  const options = sortStatEntries(EFFECT_LABELS.filter(l => !isWeaponEffect(l)).map(l => [l])).map(([l]) => l);
  select.innerHTML = options.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
}

function addPaPmStatFilter() {
  const stat = document.getElementById("paPmStatFilterSelect").value;
  const minValue = parseInt(document.getElementById("paPmStatFilterValue").value, 10) || 0;
  if (!stat) return;
  const existingIdx = paPmActiveStatFilters.findIndex(f => f.stat === stat);
  if (existingIdx >= 0) paPmActiveStatFilters[existingIdx].minValue = minValue;
  else paPmActiveStatFilters.push({ stat, minValue });
  renderPaPmActiveStatFilters();
  renderPaPmList();
}

function removePaPmStatFilter(stat) {
  paPmActiveStatFilters = paPmActiveStatFilters.filter(f => f.stat !== stat);
  renderPaPmActiveStatFilters();
  renderPaPmList();
}

function renderPaPmActiveStatFilters() {
  const container = document.getElementById("paPmActiveStatFilters");
  container.innerHTML = "";
  for (const f of paPmActiveStatFilters) {
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
      renderPaPmList();
    });
    chip.appendChild(valueInput);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.title = "Retirer ce filtre";
    rm.addEventListener("click", () => removePaPmStatFilter(f.stat));
    chip.appendChild(rm);
    container.appendChild(chip);
  }
}

function itemMatchesPaPmStatFilters(item) {
  if (paPmActiveStatFilters.length === 0) return true;
  return paPmActiveStatFilters.every(({ stat, minValue }) =>
    (item.effects || []).some(eff => stripSign(eff.label) === stat && getEffectComparableValue(eff) >= minValue)
  );
}

function openPaPmList(kind) {
  closePaPmPicker();
  paPmActiveKind = kind;
  document.getElementById("paPmListModalTitle").textContent = kind === "pa" ? "Items PA" : "Items PM";
  document.getElementById("paPmSearchInput").value = "";
  document.getElementById("paPmLevelMinInput").value = "";
  document.getElementById("paPmLevelMaxInput").value = "";
  document.getElementById("paPmSortSelect").value = "level-desc";
  paPmNoPanoFilterActive = false;
  paPmWithPanoFilterActive = false;
  paPmActiveStatFilters = [];
  paPmActiveSlotFilters = new Set();
  document.getElementById("paPmNoPanoFilterBtn").classList.remove("active");
  document.getElementById("paPmWithPanoFilterBtn").classList.remove("active");
  populatePaPmStatFilterSelect();
  renderPaPmActiveStatFilters();
  renderPaPmSlotFilterChips();
  document.getElementById("paPmListModalOverlay").classList.remove("hidden");
  renderPaPmList();
}

function renderPaPmList() {
  if (document.getElementById("paPmListModalOverlay").classList.contains("hidden")) return;
  const search = document.getElementById("paPmSearchInput").value.trim().toLowerCase();
  const sort = document.getElementById("paPmSortSelect").value;
  const levelMin = parseInt(document.getElementById("paPmLevelMinInput").value, 10);
  const levelMax = parseInt(document.getElementById("paPmLevelMaxInput").value, 10);

  let items = ITEMS.filter(paPmActiveKind === "pa" ? isPaFilterItem : isPmFilterItem);
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search));
  if (!isNaN(levelMin)) items = items.filter(i => i.level >= levelMin);
  if (!isNaN(levelMax)) items = items.filter(i => i.level <= levelMax);
  if (paPmNoPanoFilterActive) items = items.filter(i => !i.itemSetId || i.itemSetId <= 0);
  if (paPmWithPanoFilterActive) items = items.filter(i => i.itemSetId && i.itemSetId > 0);
  if (paPmActiveSlotFilters.size > 0) items = items.filter(i => paPmActiveSlotFilters.has(i.slot));
  items = items.filter(itemMatchesPaPmStatFilters);

  if (sort === "level-asc") items.sort((a, b) => a.level - b.level);
  else if (sort === "level-desc") items.sort((a, b) => b.level - a.level);
  else items.sort((a, b) => a.name.localeCompare(b.name));

  const body = document.getElementById("paPmListModalBody");
  body.innerHTML = "";
  if (items.length === 0) {
    body.innerHTML = '<div class="stat-empty">Aucun objet trouvé.</div>';
    return;
  }
  const charLevel = getCharLevel();
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const matchingSlotIds = UI_SLOTS.filter(s => s.dataSlot === item.slot).map(s => s.id);
    const isEquipped = matchingSlotIds.some(id => equipped[id] && equipped[id].id === item.id);
    frag.appendChild(renderItemCard(item, isEquipped, charLevel));
  }
  body.appendChild(frag);
}

function closePaPmList() {
  document.getElementById("paPmListModalOverlay").classList.add("hidden");
}

// ---------- Classe / sorts ----------

function openClassPicker() {
  const body = document.getElementById("classPickerModalBody");
  body.innerHTML = "";
  for (const breed of BREEDS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-choice-btn";
    btn.innerHTML = `<span>${escapeHtml(breed.name)}</span>`;
    btn.addEventListener("click", () => {
      closeClassPicker();
      openClassSpells(breed.id);
    });
    body.appendChild(btn);
  }
  document.getElementById("classPickerModalOverlay").classList.remove("hidden");
}

function closeClassPicker() {
  document.getElementById("classPickerModalOverlay").classList.add("hidden");
}

/** Picks the highest grade unlocked at or below the character's level, falling back to the lowest grade if the character hasn't reached the spell's first grade yet. */
function pickGradeForLevel(spell, level) {
  if (!spell.grades || spell.grades.length === 0) return null;
  const eligible = spell.grades.filter(g => g.minPlayerLevel <= level);
  if (eligible.length > 0) return eligible[eligible.length - 1];
  return spell.grades[0];
}

function gradeTabsHtml(spell, activeGrade) {
  if (!spell.grades || spell.grades.length <= 1) return "";
  return `<div class="spell-card-grades">${spell.grades.map((g, i) =>
    `<span class="spell-card-grade${g === activeGrade ? " active" : ""}">${i + 1}</span>`).join("")}</div>`;
}

/** One params-list bullet, using the same stat icon as everywhere else instead of a plain "•" when one exists for statLabel. */
function paramIconItem(statLabel, text) {
  const icon = statIcon(statLabel);
  return `<div class="spell-card-params-item${icon ? " has-icon" : ""}">${icon ? `<span class="stat-icon">${icon}</span>` : ""}${escapeHtml(text)}</div>`;
}

/** Same bullet style, no icon - for params with no matching stat (Portée modifiable, Lancer en ligne, ...). */
function plainParamItem(text) {
  return `<div class="spell-card-params-item">${escapeHtml(text)}</div>`;
}

function renderSpellVariantCard(spell, level) {
  const grade = pickGradeForLevel(spell, level);
  const card = document.createElement("div");
  card.className = "spell-card";
  if (!grade) {
    card.innerHTML = `<div class="spell-card-title">${escapeHtml(spell.name)}</div><div class="stat-empty">Aucune donnée de grade.</div>`;
    return card;
  }

  const sim = computeSpellGradeDamageSimulation(grade);
  // "Repousse de X case(s)" is already represented as the computed "Dommages Poussée"
  // damage-panel line (see pushDamageLine) - showing the raw effect too would be redundant.
  const nonDamageEffects = (grade.effects || []).filter(e => !isWeaponEffect(e.label) && e.effectId !== 5);

  const paramsItems = [
    paramIconItem("PA", `${grade.apCost} PA`),
    paramIconItem("Portée", grade.minRange === grade.range ? `Portée ${grade.range}` : `Portée ${grade.minRange}-${grade.range}`),
    plainParamItem(grade.rangeCanBeBoosted ? "Portée modifiable" : "Portée fixe"),
    plainParamItem(grade.castInLine ? "Lancer en ligne" : "Lancer libre"),
    paramIconItem("% Critique", `Critique ${sim.critRate}%`),
  ];
  if (grade.castInDiagonal) paramsItems.push(plainParamItem("Diagonale"));
  if (grade.maxCastPerTurn) paramsItems.push(plainParamItem(`${grade.maxCastPerTurn} lancer${grade.maxCastPerTurn > 1 ? "s" : ""} par tour`));
  if (grade.maxStack) paramsItems.push(plainParamItem(`Cumul : ${grade.maxStack}`));

  card.innerHTML = `
    <div class="spell-card-header">
      <span class="spell-card-icon-slot"></span>
      <div class="spell-card-header-text">
        <div class="spell-card-title">${escapeHtml(spell.name)}</div>
        <div class="spell-card-level">Niveau ${grade.minPlayerLevel}${spell.obtainLevel !== grade.minPlayerLevel ? ` (débloqué Nv. ${spell.obtainLevel})` : ""}</div>
      </div>
      ${gradeTabsHtml(spell, grade)}
    </div>
    ${spell.description ? `<div class="spell-card-top"><div class="spell-card-description">${escapeHtml(spell.description)}</div></div>` : ""}
    ${damageSectionHtml(sim)}
    <hr class="spell-card-hr">
    <div class="spell-card-params">
      ${paramsItems.join("")}
    </div>
    ${nonDamageEffects.length ? `<hr class="spell-card-hr"><div class="spell-card-effects">${effectsGridHtml(nonDamageEffects)}</div>` : ""}
  `;
  card.querySelector(".spell-card-icon-slot").replaceWith(spellIconEl(spell, "✨", "spell-card-icon"));
  wireDamageToggle(card);
  return card;
}

function openClassSpells(breedId) {
  const breed = BREEDS.find(b => b.id === breedId);
  if (!breed) return;
  document.getElementById("classSpellsModalTitle").textContent = breed.name;
  const body = document.getElementById("classSpellsModalBody");
  body.innerHTML = "";
  const level = getCharLevel();

  for (const spell of breed.spells) {
    const row = document.createElement("div");
    row.className = "compatible-sets-body";
    row.style.marginBottom = "16px";
    row.appendChild(renderSpellVariantCard(spell, level));
    if (spell.variant) row.appendChild(renderSpellVariantCard(spell.variant, level));
    body.appendChild(row);
  }

  document.getElementById("classSpellsModalOverlay").classList.remove("hidden");
}

function closeClassSpells() {
  document.getElementById("classSpellsModalOverlay").classList.add("hidden");
}

function renderHiddenModalBody() {
  const body = document.getElementById("hiddenModalBody");
  body.innerHTML = "";

  const entries = hiddenModalMode === "items"
    ? hiddenItemsInCurrentCategory()
    : [...SETS_BY_ID.values()].filter(s => hiddenSetIds.has(s.id));

  if (entries.length === 0) {
    body.innerHTML = '<div class="stat-empty">Rien de caché ici.</div>';
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "set-item-row";
    if (hiddenModalMode === "items") {
      row.appendChild(itemIconEl(entry, "🎒", "item-icon"));
    } else {
      const icon = document.createElement("span");
      icon.className = "item-icon icon-fallback";
      icon.textContent = "📦";
      row.appendChild(icon);
    }
    const name = document.createElement("span");
    name.className = "set-item-name";
    name.textContent = entry.name;
    row.appendChild(name);

    const unhideBtn = document.createElement("button");
    unhideBtn.type = "button";
    unhideBtn.className = "equip-item-btn";
    unhideBtn.textContent = "Démasquer";
    unhideBtn.addEventListener("click", () => {
      if (hiddenModalMode === "items") {
        hiddenItemIds.delete(entry.id);
        saveHidden();
        renderItemList();
      } else {
        hiddenSetIds.delete(entry.id);
        saveHidden();
        renderSetsList();
      }
      updateHiddenButtonsLabel();
      renderHiddenModalBody();
    });
    row.appendChild(unhideBtn);

    body.appendChild(row);
  }
}

function unhideAllInCurrentModal() {
  if (hiddenModalMode === "items") {
    for (const i of hiddenItemsInCurrentCategory()) hiddenItemIds.delete(i.id);
    saveHidden();
    renderItemList();
  } else if (hiddenModalMode === "sets") {
    hiddenSetIds = new Set();
    saveHidden();
    renderSetsList();
  }
  updateHiddenButtonsLabel();
  renderHiddenModalBody();
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
