const STORAGE_KEY = "finanzen-app:v3";

const GROUP_TYPES = {
  einnahme: { label: "Einnahmen", sign: 1 },
  fix: { label: "Fixkosten", sign: -1 },
  variabel: { label: "Variable Kosten", sign: -1 },
  sparen: { label: "Sparen", sign: -1 },
};

const OWNERS = ["ich", "partner"];

const Store = {
  state: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.state = raw ? this.migrate(JSON.parse(raw)) : structuredClone(SEED_DATA);
    } catch {
      this.state = structuredClone(SEED_DATA);
    }
    return this.state;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  reset() {
    this.state = structuredClone(SEED_DATA);
    this.save();
  },

  replace(data) {
    this.state = this.migrate(data);
    this.save();
  },

  // Fehlende Felder ergänzen, damit ältere Exporte weiter laden.
  migrate(data) {
    const base = structuredClone(SEED_DATA);
    const s = { version: 3, ...data };
    s.settings = { ...base.settings, ...(s.settings || {}) };
    s.groups = Array.isArray(s.groups) ? s.groups : base.groups;
    s.assets = Array.isArray(s.assets) ? s.assets : [];
    s.groups.forEach((g) => {
      g.id = g.id || uid("g");
      g.type = GROUP_TYPES[g.type] ? g.type : "fix";
      g.name = g.name || "Neue Gruppe";
      g.owner = OWNERS.includes(g.owner) ? g.owner : "ich";
      g.entries = Array.isArray(g.entries) ? g.entries : [];
      g.entries.forEach((e) => {
        e.id = e.id || uid("e");
        e.name = e.name || "";
        e.amount = Number(e.amount) || 0;
        // Alte, geteilte Einträge bleiben erhalten und werden einer Person zugeordnet.
        e.owner = OWNERS.includes(e.owner) ? e.owner : "ich";
        e.active = e.active !== false;
        e.note = e.note || "";
        e.gross = e.gross !== null && e.gross !== undefined && Number.isFinite(Number(e.gross))
          ? Number(e.gross)
          : null;
        e.breakdown = Array.isArray(e.breakdown) ? e.breakdown : [];
        e.breakdown.forEach((item) => {
          item.id = item.id || uid("d");
          item.name = item.name || "";
          item.amount = Number(item.amount) || 0;
        });
      });
    });
    s.assets.forEach((a) => {
      a.id = a.id || uid("a");
      a.name = a.name || "";
      a.value = Number(a.value) || 0;
      a.date = a.date || "";
      a.owner = OWNERS.includes(a.owner) ? a.owner : "ich";
    });
    return s;
  },

  group(id) {
    return this.state.groups.find((g) => g.id === id);
  },

  entry(groupId, entryId) {
    return this.group(groupId)?.entries.find((e) => e.id === entryId);
  },

  addGroup(type, owner) {
    const group = { id: uid("g"), type, name: "Neue Gruppe", owner, entries: [] };
    this.state.groups.push(group);
    this.save();
    return group;
  },

  removeGroup(id) {
    this.state.groups = this.state.groups.filter((g) => g.id !== id);
    this.save();
  },

  addEntry(groupId) {
    const group = this.group(groupId);
    if (!group) return null;
    const entry = {
      id: uid("e"),
      name: "",
      amount: 0,
      owner: group.owner,
      active: true,
      note: "",
      gross: null,
      breakdown: [],
    };
    group.entries.push(entry);
    this.save();
    return entry;
  },

  removeEntry(groupId, entryId) {
    const group = this.group(groupId);
    if (!group) return;
    group.entries = group.entries.filter((e) => e.id !== entryId);
    this.save();
  },

  addBreakdownItem(groupId, entryId) {
    const entry = this.entry(groupId, entryId);
    if (!entry) return null;
    entry.breakdown.push({ id: uid("d"), name: "", amount: 0 });
    this.save();
  },

  removeBreakdownItem(groupId, entryId, itemId) {
    const entry = this.entry(groupId, entryId);
    if (!entry) return;
    entry.breakdown = entry.breakdown.filter((item) => item.id !== itemId);
    this.save();
  },

  addAsset(owner) {
    const asset = { id: uid("a"), name: "", value: 0, date: today(), owner };
    this.state.assets.push(asset);
    this.save();
    return asset;
  },

  removeAsset(id) {
    this.state.assets = this.state.assets.filter((a) => a.id !== id);
    this.save();
  },
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function belongsToScope(owner, scope) {
  return scope === "haushalt" || owner === scope;
}

/** Berechnet alle Summen für den aktuellen Bereich. */
function calculate(state, scope) {
  const groups = state.groups.map((group) => {
    const entries = group.entries.map((entry) => {
      const factor = entry.active && belongsToScope(group.owner, scope) ? 1 : 0;
      return { entry, factor, value: entry.amount * factor };
    });
    return {
      group,
      entries,
      total: entries.reduce((sum, row) => sum + row.value, 0),
    };
  });

  const totalOf = (type) =>
    groups.filter((g) => g.group.type === type).reduce((sum, g) => sum + g.total, 0);

  const income = totalOf("einnahme");
  const fixed = totalOf("fix");
  const variable = totalOf("variabel");
  const savings = totalOf("sparen");

  return {
    groups,
    income,
    fixed,
    variable,
    savings,
    beforeVariable: income - fixed - savings,
    result: income - fixed - variable - savings,
    assets: state.assets.reduce(
      (sum, a) => sum + a.value * (belongsToScope(a.owner, scope) ? 1 : 0),
      0
    ),
  };
}
