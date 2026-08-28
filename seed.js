// Startdaten aus AusgabenEinnahmen.xlsx (Stand der Datei).
// Beträge immer als positive Zahl; das Vorzeichen ergibt sich aus dem Gruppentyp.
const SEED_DATA = {
  version: 2,
  settings: {
    myName: "Ich",
    partnerName: "Partner",
  },
  groups: [
    {
      id: "g-einnahmen",
      type: "einnahme",
      name: "Einnahmen",
      owner: "ich",
      entries: [
        {
          id: "e-gehalt",
          name: "Gehalt Telefonica (netto)",
          amount: 3203.21,
          owner: "ich",
          active: true,
          gross: 5772.56,
          breakdown: [
            { id: "d-baf", name: "BAF", amount: -230 },
          ],
        },
        { id: "e-familiengeld", name: "Familiengeld", amount: 0, owner: "ich", active: true, note: "" },
      ],
    },
    {
      id: "g-miete",
      type: "fix",
      name: "Miete & Wohnen",
      owner: "ich",
      entries: [
        { id: "e-wohnung", name: "Miete Wohnung", amount: 1299.71, owner: "ich", active: true, note: "" },
        { id: "e-strom", name: "Strom", amount: 46, owner: "ich", active: true, note: "" },
        { id: "e-boats", name: "Studio BOATS", amount: 80, owner: "ich", active: true, note: "" },
      ],
    },
    {
      id: "g-entertainment",
      type: "fix",
      name: "Entertainment",
      owner: "ich",
      entries: [
        { id: "e-rbtv", name: "RBTV", amount: 5, owner: "ich", active: true, note: "" },
        { id: "e-netflix", name: "Netflix", amount: 13.99, owner: "ich", active: true, note: "" },
        { id: "e-crunchyroll", name: "Crunchyroll", amount: 0, owner: "ich", active: false, note: "" },
        { id: "e-youtube", name: "YouTube", amount: 10.84, owner: "ich", active: true, note: "" },
        { id: "e-appletv", name: "Apple TV+", amount: 0, owner: "ich", active: false, note: "" },
        { id: "e-prime", name: "Amazon Prime", amount: 0, owner: "ich", active: false, note: "" },
        { id: "e-disney", name: "Disney+", amount: 0, owner: "ich", active: false, note: "" },
      ],
    },
    {
      id: "g-kind",
      type: "fix",
      name: "Kind",
      owner: "ich",
      entries: [
        { id: "e-kita", name: "Kita", amount: 177.9, owner: "ich", active: true, note: "" },
        { id: "e-kita-essen", name: "Kita Essen", amount: 94.06, owner: "ich", active: true, note: "" },
      ],
    },
    {
      id: "g-versicherung",
      type: "fix",
      name: "Versicherung",
      owner: "ich",
      entries: [
        { id: "e-hausrat", name: "Allianz Hausrat", amount: 8.13, owner: "ich", active: true, note: "" },
        { id: "e-rechtsschutz", name: "Allianz Rechtsschutz", amount: 24.4, owner: "ich", active: true, note: "" },
        { id: "e-reise", name: "Allianz Reisekrankenvers.", amount: 0.8, owner: "ich", active: true, note: "" },
        { id: "e-haftpflicht", name: "Allianz Privathaftpflicht", amount: 7.14, owner: "ich", active: true, note: "" },
        { id: "e-kfz", name: "Allianz KFZ-Versicherung", amount: 91.02, owner: "ich", active: true, note: "" },
        { id: "e-zahn", name: "Ergo Zahnzusatz", amount: 19, owner: "ich", active: true, note: "" },
      ],
    },
    {
      id: "g-sonstiges",
      type: "fix",
      name: "Sonstiges",
      owner: "ich",
      entries: [
        { id: "e-gesang", name: "Gesang", amount: 0, owner: "ich", active: false, note: "" },
        { id: "e-kfz-steuer", name: "Auto KFZ Steuer", amount: 5.5, owner: "ich", active: true, note: "" },
        { id: "e-office", name: "Office 365", amount: 5.8, owner: "ich", active: true, note: "" },
        { id: "e-dticket", name: "Deutschland Ticket", amount: 26, owner: "ich", active: true, note: "" },
        { id: "e-entgelt", name: "Entgeltabschluss Sparkasse", amount: 6.14, owner: "ich", active: true, note: "" },
      ],
    },
    {
      id: "g-variabel",
      type: "variabel",
      name: "Variable Kosten",
      owner: "ich",
      entries: [
        { id: "e-leben", name: "Leben", amount: 500, owner: "ich", active: true, note: "" },
        { id: "e-kind-var", name: "Kind", amount: 0, owner: "ich", active: true, note: "" },
        { id: "e-tanken", name: "Tanken", amount: 0, owner: "ich", active: true, note: "" },
      ],
    },
    {
      id: "g-sparen",
      type: "sparen",
      name: "Sparen",
      owner: "ich",
      entries: [{ id: "e-sparen", name: "Sparen", amount: 800, owner: "ich", active: true, note: "" }],
    },
  ],
  assets: [
    { id: "a-sparkonto", name: "Sparkonto", value: 30054.9, date: "2025-04-27", owner: "ich" },
    { id: "a-bauspar", name: "Bausparkonto", value: 10983.3, date: "2025-12-31", owner: "ich" },
    { id: "a-aktien-spk", name: "Aktien Sparkasse", value: 21088.1, date: "2026-04-27", owner: "ich" },
    { id: "a-aktien-tef", name: "Aktien Telefonica", value: 3348.37, date: "2026-04-27", owner: "ich" },
  ],
};
