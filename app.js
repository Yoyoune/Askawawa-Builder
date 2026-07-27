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
const PARCHOTAGE_STATS = ["Force", "Intelligence", "Chance", "Agilité", "Vitalité", "Sagesse", "PA", "PM", "Portée"];

// Fixed display order for "Statistiques totales" (not sorted by value). Anything not
// listed here falls back to the end, alphabetically, so a new/unrecognized effect label
// still shows up instead of being silently dropped.
const STAT_ORDER = [
  "PA", "PM", "Portée", "Invocations",
  "Vitalité", "Sagesse", "Chance", "Intelligence", "Agilité", "Force", "Puissance",
  // Raw weapon damage/steal rolls (parenthesized labels, Category=2 in the game data) -
  // logically come before bonus damage since they're the weapon's base hit.
  "(dommages Terre)", "(dommages Feu)", "(dommages Eau)", "(dommages Air)", "(dommages Neutre)",
  "(vol Terre)", "(vol Feu)", "(vol Eau)", "(vol Air)", "(vol Neutre)", "(PV rendus)",
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
/** statLabel -> manually added points */
let parchotage = {};
/** [{ name, charLevel, equipped: {uiSlotId:itemId}, rollOverrides, forgemagie, parchotage, savedAt }] */
let savedBuilds = [];

let activeUiSlot = null;

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
  renderBaseStats();
  renderStats();
  renderSavedBuildsList();
  renderSetsFilterChips();
  populateStatFilterSelect();

  document.getElementById("browserClose").addEventListener("click", closeSidePanel);
  document.getElementById("detailClose").addEventListener("click", closeSidePanel);
  document.getElementById("setsBrowserClose").addEventListener("click", closeSidePanel);
  document.getElementById("setsSearchBtn").addEventListener("click", openSetsBrowser);
  document.getElementById("setsSearchInput").addEventListener("input", renderSetsList);
  document.getElementById("setsSortSelect").addEventListener("change", renderSetsList);
  document.getElementById("addStatFilterBtn").addEventListener("click", addStatFilter);
  document.getElementById("setModalClose").addEventListener("click", closeSetPreview);
  document.getElementById("setModalOverlay").addEventListener("click", (ev) => {
    if (ev.target.id === "setModalOverlay") closeSetPreview();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeSetPreview();
  });
  const doSaveBuild = () => {
    const input = document.getElementById("buildNameInput");
    const name = input.value.trim();
    if (!name) return;
    if (savedBuilds.some(b => b.name === name) && !confirm(`Un build nommé "${name}" existe déjà. L'écraser ?`)) return;
    saveCurrentAsBuild(name);
    input.value = "";
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
    renderStats();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Retirer tout l'équipement (et les réglages de jet/forgemagie) ?")) return;
    equipped = {};
    rollOverrides = {};
    forgemagie = {};
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
  } catch (e) {
    console.warn("Could not restore saved customization", e);
  }
}

function saveCustomization() {
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify({ rollOverrides, forgemagie, parchotage }));
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

  equipped = {};
  for (const [uiSlotId, itemId] of Object.entries(build.equipped || {})) {
    const item = ITEMS_BY_ID.get(itemId);
    if (item) equipped[uiSlotId] = item;
  }
  rollOverrides = JSON.parse(JSON.stringify(build.rollOverrides || {}));
  forgemagie = JSON.parse(JSON.stringify(build.forgemagie || {}));
  parchotage = JSON.parse(JSON.stringify(build.parchotage || {}));
  if (build.charLevel) document.getElementById("charLevel").value = build.charLevel;

  saveEquipped();
  saveCustomization();
  closeSidePanel();
  renderPaperdoll();
  renderParchotageGrid();
  renderBaseStats();
  renderStats();
}

function deleteBuildByName(name) {
  if (!confirm(`Supprimer le build "${name}" ?`)) return;
  savedBuilds = savedBuilds.filter(b => b.name !== name);
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

  const sorted = [...savedBuilds].sort((a, b) => a.name.localeCompare(b.name));
  for (const build of sorted) {
    const row = document.createElement("div");
    row.className = "build-row";

    const name = document.createElement("span");
    name.className = "build-name";
    name.title = build.name;
    name.textContent = build.name;
    row.appendChild(name);

    const actions = document.createElement("div");
    actions.className = "build-actions";

    const loadBtn = document.createElement("button");
    loadBtn.className = "load-btn";
    loadBtn.textContent = "Charger";
    loadBtn.addEventListener("click", () => loadBuildByName(build.name));
    actions.appendChild(loadBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "×";
    delBtn.title = "Supprimer";
    delBtn.addEventListener("click", () => deleteBuildByName(build.name));
    actions.appendChild(delBtn);

    row.appendChild(actions);
    listEl.appendChild(row);
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

  if (item) {
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = item.name;
    el.appendChild(name);

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

function openBrowser(uiSlotId) {
  activeUiSlot = uiSlotId;
  showSidePanel("list");
  const uiSlot = UI_SLOTS.find(s => s.id === uiSlotId);
  document.getElementById("browserTitle").textContent = uiSlot.label;
  document.getElementById("searchInput").value = "";
  renderItemList();
  renderPaperdoll();
}

function renderItemList() {
  if (!activeUiSlot || document.getElementById("browserContent").classList.contains("hidden")) return;
  const uiSlot = UI_SLOTS.find(s => s.id === activeUiSlot);
  const listEl = document.getElementById("itemList");
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const sort = document.getElementById("sortSelect").value;
  const charLevel = getCharLevel();

  let list = (ITEMS_BY_SLOT.get(uiSlot.dataSlot) || []).slice();
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search));
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
  for (const item of list.slice(0, 300)) {
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
    cond.textContent = "Cond. : " + item.conditions.map(c => `${c.label} ${c.operator} ${c.value}`).join(", ");
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
    unequipSlot(activeUiSlot);
    equipped[activeUiSlot] = item;
    saveEquipped();
    renderPaperdoll();
    renderItemList();
    renderStats();
  });

  return card;
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
  const negative = effect.operator === "-";
  const cls = isWeaponEffect(effect.label) ? "weapon" : (negative ? "neg" : "pos");
  const label = stripSign(effect.label);
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
    const candidates = UI_SLOTS.filter(s => s.dataSlot === item.slot).map(s => s.id);
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
  if (effect.value !== undefined) return effect.value;
  if (effect.max !== undefined) return effect.max;
  if (effect.min !== undefined) return effect.min;
  return 0;
}

function populateStatFilterSelect() {
  const select = document.getElementById("statFilterSelect");
  const options = EFFECT_LABELS.filter(l => !isWeaponEffect(l));
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
    label.textContent = `${f.stat} ≥ ${f.minValue}`;
    chip.appendChild(label);
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

function openSetsBrowser() {
  activeUiSlot = null;
  showSidePanel("sets");
  document.getElementById("setsSearchInput").value = "";
  renderPaperdoll();
  renderSetsList();
}

function renderSetsList() {
  const listEl = document.getElementById("setsList");
  const search = document.getElementById("setsSearchInput").value.trim().toLowerCase();
  const sort = document.getElementById("setsSortSelect").value;

  let sets = [...SETS_BY_ID.values()].filter(s => s.itemIds.length > 0);
  if (search) sets = sets.filter(s => s.name.toLowerCase().includes(search));
  if (activeSetFilters.size > 0) {
    sets = sets.filter(s => {
      const flags = SET_FLAGS.get(s.id);
      return flags && [...activeSetFilters].every(key => flags[key]);
    });
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
  for (const set of sets.slice(0, 150)) frag.appendChild(renderSetCard(set));
  listEl.appendChild(frag);
}

function renderSetCard(set) {
  const card = document.createElement("div");
  card.className = "set-card";

  const header = document.createElement("div");
  header.className = "set-card-header";
  header.innerHTML = `<span class="set-card-title"></span><span class="set-card-count">Nv. ${SET_MAX_LEVEL.get(set.id)} · ${set.itemIds.length} pièces</span>`;
  header.querySelector(".set-card-title").textContent = set.name;
  card.appendChild(header);

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

    card.appendChild(row);
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
    card.appendChild(tier);
  });

  const equipAllBtn = document.createElement("button");
  equipAllBtn.type = "button";
  equipAllBtn.className = "set-card-equip-all";
  equipAllBtn.textContent = "Équiper la panoplie entière";
  equipAllBtn.addEventListener("click", () => equipEntireSet(set.id));
  card.appendChild(equipAllBtn);

  return card;
}

function equipSingleItem(item) {
  const candidates = UI_SLOTS.filter(s => s.dataSlot === item.slot).map(s => s.id);
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
    "Vitalité": 50 + 5 * level,
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

function computeItemStats() {
  const totals = new Map();
  for (const [uiSlotId, item] of Object.entries(equipped)) {
    (item.effects || []).forEach((effect, idx) => {
      const override = rollOverrides[uiSlotId] && rollOverrides[uiSlotId][idx];
      addEffectToTotals(totals, effect, override);
    });
    for (const fm of forgemagie[uiSlotId] || []) {
      totals.set(fm.label, (totals.get(fm.label) || 0) + fm.value);
    }
  }
  return totals;
}

function computeActiveSets() {
  const countBySet = new Map();
  for (const item of Object.values(equipped)) {
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

function renderStats() {
  const base = computeBaseStats(getCharLevel());
  const itemTotals = computeItemStats();
  const activeSets = computeActiveSets();

  const combined = new Map();
  for (const [label, value] of Object.entries(base)) combined.set(label, value);
  for (const [label, value] of itemTotals) combined.set(label, (combined.get(label) || 0) + value);
  for (const { tierEffects } of activeSets) {
    for (const effect of tierEffects) addEffectToTotals(combined, effect);
  }
  for (const [stat, value] of Object.entries(parchotage)) {
    if (value) combined.set(stat, (combined.get(stat) || 0) + value);
  }

  const statsEl = document.getElementById("statsContent");
  statsEl.innerHTML = "";
  const sortedEntries = [...combined.entries()].filter(([, v]) => v !== 0).sort((a, b) => {
    const ia = STAT_ORDER.indexOf(a[0]);
    const ib = STAT_ORDER.indexOf(b[0]);
    const ra = ia === -1 ? STAT_ORDER.length : ia;
    const rb = ib === -1 ? STAT_ORDER.length : ib;
    return ra !== rb ? ra - rb : a[0].localeCompare(b[0]);
  });
  if (sortedEntries.length === 0) {
    statsEl.innerHTML = '<div class="stat-empty">Équipez un objet pour voir les statistiques.</div>';
  } else {
    for (const [label, value] of sortedEntries) {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<span>${escapeHtml(label)}</span><span class="val ${value >= 0 ? "pos" : "neg"}">${value >= 0 ? "+" : ""}${value}</span>`;
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
}

main().catch(err => {
  document.body.innerHTML = `<pre style="color:#d9686b;padding:20px;">Erreur de chargement : ${err.message}\n${err.stack || ""}</pre>`;
  console.error(err);
});
