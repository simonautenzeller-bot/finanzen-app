const ui = { tab: "overview", scope: "ich", period: "month" };

const viewEl = document.getElementById("view");
const importFileEl = document.getElementById("import-file");

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function fmt(value) {
  return currency.format(round2(value));
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function parseAmount(raw) {
  const normalized = String(raw).replace(/\s|€/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

function parseSignedAmount(raw) {
  const normalized = String(raw).replace(/\s|€/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

function periodFactor() {
  return ui.period === "year" ? 12 : 1;
}

function periodLabel() {
  return ui.period === "year" ? "pro Jahr" : "pro Monat";
}

function scopeLabel() {
  const s = Store.state.settings;
  if (ui.scope === "ich") return s.myName;
  if (ui.scope === "partner") return s.partnerName;
  return `Haushalt (${s.myName} + ${s.partnerName})`;
}

function ownerLabel(owner) {
  const s = Store.state.settings;
  if (owner === "ich") return s.myName;
  if (owner === "partner") return s.partnerName;
  return "Gemeinsam";
}

function ownerOptions(selected) {
  return ["ich", "partner"]
    .map(
      (o) =>
        `<option value="${o}"${o === selected ? " selected" : ""}>${esc(ownerLabel(o))}</option>`
    )
    .join("");
}

/* ---------------------------------------------------------------- Views */

function render() {
  renderScopeLabels();
  const calc = calculate(Store.state, ui.scope);
  if (ui.tab === "overview") viewEl.innerHTML = renderOverview(calc);
  else if (ui.tab === "budget") viewEl.innerHTML = renderBudget(calc);
  else if (ui.tab === "assets") viewEl.innerHTML = renderAssets(calc);
  else viewEl.innerHTML = renderData();
}

function renderScopeLabels() {
  const settings = Store.state.settings;
  document.querySelector('[data-scope="ich"]').textContent = settings.myName;
  document.querySelector('[data-scope="partner"]').textContent = settings.partnerName;
  document.querySelector('[data-scope="haushalt"]').textContent = "Haushalt";
}

function renderOverview(calc) {
  const f = periodFactor();
  const cards = [
    { label: "Einnahmen", value: calc.income * f, tone: "pos" },
    { label: "Fixkosten", value: -calc.fixed * f, tone: "neg" },
    { label: "Variable Kosten", value: -calc.variable * f, tone: "neg" },
    { label: "Sparen", value: -calc.savings * f, tone: "neutral" },
    { label: "Vor variablen Kosten", value: calc.beforeVariable * f, tone: tone(calc.beforeVariable) },
    { label: "Ergebnis", value: calc.result * f, tone: tone(calc.result), big: true },
  ];

  const expenseGroups = calc.groups
    .filter((g) => g.group.type !== "einnahme" && g.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxExpense = Math.max(...expenseGroups.map((g) => g.total), 1);

  return `
    <section class="stack">
      <p class="scope-note">Bereich: <strong>${esc(scopeLabel())}</strong> · ${periodLabel()}</p>

      <div class="cards">
        ${cards
          .map(
            (c) => `
          <div class="card${c.big ? " card--big" : ""}">
            <span class="card__label">${esc(c.label)}</span>
            <span class="card__value is-${c.tone}">${fmt(c.value)}</span>
          </div>`
          )
          .join("")}
      </div>

      <div class="panel">
        <h2 class="panel__title">Ausgaben nach Gruppe</h2>
        ${
          expenseGroups.length
            ? `<ul class="bars">
                ${expenseGroups
                  .map(
                    (g) => `
                  <li class="bar">
                    <span class="bar__label">${esc(g.group.name)}</span>
                    <span class="bar__track"><span class="bar__fill" style="width:${
                      (g.total / maxExpense) * 100
                    }%"></span></span>
                    <span class="bar__value">${fmt(g.total * f)}</span>
                  </li>`
                  )
                  .join("")}
              </ul>`
            : `<p class="empty">Keine Ausgaben in diesem Bereich.</p>`
        }
      </div>

      <div class="panel">
        <h2 class="panel__title">Einnahmen</h2>
        <ul class="list">
          ${calc.groups
            .filter((g) => g.group.type === "einnahme")
            .flatMap((g) => g.entries)
            .filter((row) => row.value > 0)
            .map(
              (row) => `
            <li class="list__row">
              <span>${esc(row.entry.name || "Ohne Namen")} <span class="tag">${esc(
                ownerLabel(row.entry.owner)
              )}</span></span>
              <span class="is-pos">${fmt(row.value * f)}</span>
            </li>`
            )
            .join("") || `<li class="empty">Keine Einnahmen.</li>`}
        </ul>
      </div>

      <div class="panel">
        <h2 class="panel__title">Vermögen</h2>
        <p class="big-number">${fmt(calc.assets)}</p>
      </div>
    </section>`;
}

function tone(value) {
  if (value > 0.005) return "pos";
  if (value < -0.005) return "neg";
  return "neutral";
}

function renderBudget(calc) {
  const f = periodFactor();
  const sections = Object.entries(GROUP_TYPES).map(([type, meta]) => {
    const groups = calc.groups.filter(
      (g) => g.group.type === type && (ui.scope === "haushalt" || g.group.owner === ui.scope)
    );
    const total = groups.reduce((sum, g) => sum + g.total, 0);
    return `
      <section class="type-section">
        <header class="type-section__head">
          <h2>${esc(meta.label)}</h2>
          <span class="type-section__total is-${meta.sign > 0 ? "pos" : "neg"}">${fmt(
            meta.sign * total * f
          )}</span>
        </header>
        <div class="group-grid">
          ${groups.map((g) => renderGroup(g, f)).join("")}
        </div>
        ${
          ui.scope === "haushalt"
            ? ""
            : `<button type="button" class="btn btn--ghost" data-action="add-group" data-type="${type}">
                + Gruppe in „${esc(meta.label)}“
              </button>`
        }
      </section>`;
  });

  return `
    <div class="stack">
      <p class="scope-note">Bereich: <strong>${esc(scopeLabel())}</strong> · Beträge werden immer
        als Monatswert erfasst. ${
          ui.scope === "haushalt"
            ? "Der Haushalt führt die Bereiche zusammen. Neue Posten werden bei der jeweiligen Person erfasst."
            : `Rechts steht der Wert für diesen Bereich (${periodLabel()}).`
        }</p>
      ${sections.join("")}
    </div>`;
}

function renderGroup(g, f) {
  const rows = g.entries
    .map(
      (row) => `
      <div class="entry${row.entry.active ? "" : " entry--off"}" data-group="${g.group.id}" data-entry="${
        row.entry.id
      }">
        <input class="input entry__name" type="text" value="${esc(row.entry.name)}"
               placeholder="Bezeichnung" data-field="name" aria-label="Bezeichnung" />
        <input class="input entry__amount" type="text" inputmode="decimal"
               value="${row.entry.amount.toFixed(2).replace(".", ",")}"
               data-field="amount" aria-label="Betrag pro Monat" />
        <label class="entry__active" title="Aktiv">
          <input type="checkbox" data-field="active" ${row.entry.active ? "checked" : ""} />
        </label>
        <span class="entry__share">${fmt(row.value * f)}</span>
        <button type="button" class="icon-btn" data-action="remove-entry" title="Eintrag löschen">✕</button>
        ${row.entry.note ? `<p class="entry__note">${esc(row.entry.note)}</p>` : ""}
        ${g.group.type === "einnahme" ? renderIncomeDetails(g.group.id, row.entry) : ""}
      </div>`
    )
    .join("");

  return `
    <article class="group" data-group="${g.group.id}">
      <header class="group__head">
        <input class="input group__name" type="text" value="${esc(g.group.name)}"
               data-field="group-name" aria-label="Gruppenname" />
        ${ui.scope === "haushalt" ? `<span class="tag">${esc(ownerLabel(g.group.owner))}</span>` : ""}
        <span class="group__total">${fmt(g.total * f)}</span>
        <button type="button" class="icon-btn" data-action="remove-group" title="Gruppe löschen">✕</button>
      </header>
      <div class="entry-head">
        <span>Bezeichnung</span><span>€ / Monat</span><span>Aktiv</span><span>Anteil</span><span></span>
      </div>
      ${rows || `<p class="empty">Noch keine Einträge.</p>`}
      <button type="button" class="btn btn--ghost btn--sm" data-action="add-entry">+ Eintrag</button>
    </article>`;
}

function renderIncomeDetails(groupId, entry) {
  const items = entry.breakdown || [];
  const gross = entry.gross !== null && entry.gross !== undefined && Number.isFinite(Number(entry.gross))
    ? Number(entry.gross)
    : null;
  return `
    <div class="income-details">
      <div class="income-details__head">Einnahmenaufschlüsselung <span>Netto links ist die Berechnungsgrundlage.</span></div>
      <label class="income-details__gross">
        <span>Brutto / Monat</span>
        <input class="input" type="text" inputmode="decimal" value="${
          gross === null ? "" : gross.toFixed(2).replace(".", ",")
        }" placeholder="Optional" data-field="gross" aria-label="Brutto pro Monat" />
      </label>
      ${items
        .map(
          (item) => `
          <div class="income-detail" data-detail="${item.id}">
            <input class="input" type="text" value="${esc(item.name)}" placeholder="Posten, z. B. Steuer"
                   data-field="detail-name" aria-label="Aufschlüsselung Bezeichnung" />
            <input class="input" type="text" inputmode="decimal"
                   value="${(Number(item.amount) || 0).toFixed(2).replace(".", ",")}" data-field="detail-amount"
                   aria-label="Aufschlüsselung Betrag" />
            <button type="button" class="icon-btn" data-action="remove-detail" title="Posten löschen">✕</button>
          </div>`
        )
        .join("")}
      <button type="button" class="btn btn--ghost btn--sm" data-action="add-detail" data-group-id="${groupId}" data-entry-id="${entry.id}">+ Aufschlüsselung</button>
    </div>`;
}

function renderAssets(calc) {
  const rows = Store.state.assets
    .filter((asset) => ui.scope === "haushalt" || asset.owner === ui.scope)
    .map(
      (a) => `
      <div class="entry" data-asset="${a.id}">
        <input class="input entry__name" type="text" value="${esc(a.name)}"
               placeholder="Konto / Depot" data-field="asset-name" aria-label="Name" />
        <input class="input entry__amount" type="text" inputmode="decimal"
               value="${a.value.toFixed(2).replace(".", ",")}" data-field="asset-value" aria-label="Wert" />
        <input class="input entry__date" type="date" value="${esc(a.date)}"
               data-field="asset-date" aria-label="Stand" />
         ${ui.scope === "haushalt" ? `<span class="tag">${esc(ownerLabel(a.owner))}</span>` : ""}
        <button type="button" class="icon-btn" data-action="remove-asset" title="Löschen">✕</button>
      </div>`
    )
    .join("");

  return `
    <div class="stack">
      <div class="panel">
        <h2 class="panel__title">Vermögen · ${esc(scopeLabel())}</h2>
        <p class="big-number">${fmt(calc.assets)}</p>
      </div>
      <article class="group group--assets">
        <div class="entry-head entry-head--assets">
          <span>Name</span><span>Wert</span><span>Stand</span><span></span>
        </div>
        ${rows || `<p class="empty">Noch keine Positionen.</p>`}
        ${
          ui.scope === "haushalt"
            ? ""
            : `<button type="button" class="btn btn--ghost btn--sm" data-action="add-asset">+ Position</button>`
        }
      </article>
    </div>`;
}

function renderData() {
  const s = Store.state.settings;
  return `
    <div class="stack">
      <div class="panel">
        <h2 class="panel__title">Bereiche</h2>
        <div class="form-grid">
          <label class="field">
            <span>Mein Name</span>
            <input class="input" type="text" value="${esc(s.myName)}" data-setting="myName" />
          </label>
          <label class="field">
            <span>Name Partner/in</span>
            <input class="input" type="text" value="${esc(s.partnerName)}" data-setting="partnerName" />
          </label>
        </div>
        <p class="hint">Die beiden Namen erscheinen direkt in den Bereichsumschaltern. Jeder Eintrag
          gehört genau einer Person; „Haushalt“ ist ausschließlich die Summe beider Bereiche.</p>
      </div>

      <div class="panel">
        <h2 class="panel__title">Daten</h2>
        <div class="btn-row">
          <button type="button" class="btn" data-action="export">Als JSON sichern</button>
          <button type="button" class="btn" data-action="import">JSON laden</button>
          <button type="button" class="btn btn--danger" data-action="reset">Auf Excel-Stand zurücksetzen</button>
        </div>
        <p class="hint">Alles wird lokal im Browser gespeichert (localStorage). Für Backups die
          JSON-Datei sichern.</p>
      </div>
    </div>`;
}

/* --------------------------------------------------------------- Events */

document.getElementById("scope-switch").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-scope]");
  if (!btn) return;
  ui.scope = btn.dataset.scope;
  setActive("#scope-switch", btn);
  render();
});

document.getElementById("period-switch").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-period]");
  if (!btn) return;
  ui.period = btn.dataset.period;
  setActive("#period-switch", btn);
  render();
});

document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-tab]");
  if (!btn) return;
  ui.tab = btn.dataset.tab;
  setActive("#tabs", btn);
  render();
});

function setActive(selector, btn) {
  document
    .querySelectorAll(`${selector} button`)
    .forEach((b) => b.classList.toggle("is-active", b === btn));
}

viewEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const groupId = btn.closest("[data-group]")?.dataset.group;
  const entryId = btn.closest("[data-entry]")?.dataset.entry;
  const assetId = btn.closest("[data-asset]")?.dataset.asset;

  if (action === "add-group") Store.addGroup(btn.dataset.type, ui.scope);
  else if (action === "remove-group") {
    if (!confirm("Gruppe mit allen Einträgen löschen?")) return;
    Store.removeGroup(groupId);
  } else if (action === "add-entry") Store.addEntry(groupId);
  else if (action === "remove-entry") Store.removeEntry(groupId, entryId);
  else if (action === "add-detail") Store.addBreakdownItem(btn.dataset.groupId, btn.dataset.entryId);
  else if (action === "remove-detail") {
    const detailId = btn.closest("[data-detail]")?.dataset.detail;
    Store.removeBreakdownItem(groupId, entryId, detailId);
  }
  else if (action === "add-asset") Store.addAsset(ui.scope);
  else if (action === "remove-asset") Store.removeAsset(assetId);
  else if (action === "export") return exportJson();
  else if (action === "import") return importFileEl.click();
  else if (action === "reset") {
    if (!confirm("Alle Änderungen verwerfen und die Excel-Daten neu laden?")) return;
    Store.reset();
  } else return;

  render();
});

// Tippen: nur speichern, kein Neuaufbau (Fokus soll erhalten bleiben).
viewEl.addEventListener("input", (e) => {
  const el = e.target;
  const field = el.dataset.field;
  const setting = el.dataset.setting;

  if (setting) {
    Store.state.settings[setting] = el.value;
    Store.save();
    renderScopeLabels();
    return;
  }
  if (!field) return;

  const groupId = el.closest("[data-group]")?.dataset.group;
  const entryId = el.closest("[data-entry]")?.dataset.entry;
  const assetId = el.closest("[data-asset]")?.dataset.asset;
  const detailId = el.closest("[data-detail]")?.dataset.detail;

  if (field === "group-name") {
    Store.group(groupId).name = el.value;
  } else if (assetId) {
    const asset = Store.state.assets.find((a) => a.id === assetId);
    if (!asset) return;
    if (field === "asset-name") asset.name = el.value;
    if (field === "asset-value") asset.value = parseAmount(el.value);
    if (field === "asset-date") asset.date = el.value;
  } else if (entryId) {
    const entry = Store.entry(groupId, entryId);
    if (!entry) return;
    if (field === "name") entry.name = el.value;
    if (field === "amount") entry.amount = parseAmount(el.value);
    if (field === "active") entry.active = el.checked;
    if (field === "gross") entry.gross = el.value.trim() === "" ? null : parseAmount(el.value);
    if (detailId) {
      const detail = entry.breakdown.find((item) => item.id === detailId);
      if (!detail) return;
      if (field === "detail-name") detail.name = el.value;
      if (field === "detail-amount") detail.amount = parseSignedAmount(el.value);
    }
  }

  Store.save();
  refreshTotals();
});

// Nach dem Verlassen eines Betragsfeldes sauber formatiert anzeigen.
viewEl.addEventListener(
  "blur",
  (e) => {
    const el = e.target;
    if (el.dataset?.field === "amount" || el.dataset?.field === "asset-value" || el.dataset?.field === "gross") {
      el.value = parseAmount(el.value).toFixed(2).replace(".", ",");
    }
    if (el.dataset?.field === "detail-amount") el.value = parseSignedAmount(el.value).toFixed(2).replace(".", ",");
  },
  true
);

/** Aktualisiert nur die berechneten Summen, ohne die Eingabefelder neu zu bauen. */
function refreshTotals() {
  if (ui.tab !== "budget" && ui.tab !== "assets") return render();
  const calc = calculate(Store.state, ui.scope);
  const f = periodFactor();

  calc.groups.forEach((g) => {
    const groupEl = viewEl.querySelector(`.group[data-group="${g.group.id}"]`);
    if (!groupEl) return;
    groupEl.querySelector(".group__total").textContent = fmt(g.total * f);
    g.entries.forEach((row) => {
      const entryEl = groupEl.querySelector(`.entry[data-entry="${row.entry.id}"]`);
      if (!entryEl) return;
      entryEl.querySelector(".entry__share").textContent = fmt(row.value * f);
      entryEl.classList.toggle("entry--off", !row.entry.active);
    });
  });

  viewEl.querySelectorAll(".type-section").forEach((section, index) => {
    const [type, meta] = Object.entries(GROUP_TYPES)[index];
    const total = calc.groups
      .filter((g) => g.group.type === type)
      .reduce((sum, g) => sum + g.total, 0);
    section.querySelector(".type-section__total").textContent = fmt(meta.sign * total * f);
  });

  const assetTotal = viewEl.querySelector(".panel .big-number");
  if (assetTotal && ui.tab === "assets") assetTotal.textContent = fmt(calc.assets);
}

/* ----------------------------------------------------------- Import/Export */

function exportJson() {
  const blob = new Blob([JSON.stringify(Store.state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finanzen-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

importFileEl.addEventListener("change", async () => {
  const file = importFileEl.files?.[0];
  if (!file) return;
  try {
    Store.replace(JSON.parse(await file.text()));
    render();
  } catch {
    alert("Die Datei konnte nicht gelesen werden.");
  }
  importFileEl.value = "";
});

Store.load();
render();
