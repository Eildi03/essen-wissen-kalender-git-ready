const app = document.getElementById("app"); console.log("app element:", app);
const API_BASE = "https://kalender.localhost/api/v1"; // ggf. anpassen

let authToken = null;

function setAuthToken(token) {
  authToken = token;
}

async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

(function () {
        const demoToday = new Date(2026, 7, 31);
        const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
        const months = [
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember",
        ];
        const monthShort = [
          "Jan",
          "Feb",
          "Mär",
          "Apr",
          "Mai",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Okt",
          "Nov",
          "Dez",
        ];
        let state = {
          view: "month",
          mode: "internal",
          anchor: new Date(2026, 8, 1),
          search: "",
          type: "all",
          status: "all",
          region: "all",
          selectedId: null,
          modal: null,
          editingId: null,
          toast: "",
          events: [
            {
              id: "demo-1",
              title: "Brotbox-Baukasten",
              publicTitle: "Essen-Wissen Bus",
              type: "bus",
              status: "bestätigt",
              start: "2026-09-02",
              end: "2026-09-02",
              startTime: "09:00",
              endTime: "13:00",
              institution: "Grundschule Wiesenblick",
              institutionType: "Grundschule",
              state: "Berlin",
              postal: "12555",
              city: "Berlin",
              street: "Ahornweg",
              house: "14",
              district: "",
              building: "Schulhof",
              topic: "Brotbox und Pausenenergie",
              participants: 48,
              audience: "Klassenstufe 3–4",
              description:
                "Gemeinsam bauen die Kinder eine bunte, saisonale Brotbox und entdecken, was sie lange satt hält.",
              publicDescription:
                "Ein praktischer Workshop rund um eine bunte, saisonale Brotbox.",
              contact: {
                first: "Mara",
                last: "Feld",
                role: "Koordination Ganztag",
                company: "Grundschule Wiesenblick",
                phone: "030 555 18 20",
                mobile: "0176 204 81 73",
                email: "m.feld@example.org",
              },
              resource: "Essen-Wissen Bus",
              visibility: "öffentlich",
              internalNotes:
                "Zufahrt über den Schulhof. Stromanschluss nicht nötig.",
              creator: "Stiftungsteam",
              changed: "28.08.2026, 10:12",
            },
            {
              id: "demo-2",
              title: "Markt der Sinne",
              publicTitle: "Markt der Sinne – Bus-Einsatz",
              type: "bus",
              status: "vorläufig geplant",
              start: "2026-09-08",
              end: "2026-09-08",
              startTime: "10:30",
              endTime: "14:00",
              institution: "Oberschule am Fluss",
              institutionType: "weiterführende Schule",
              state: "Brandenburg",
              postal: "15806",
              city: "Zossen",
              street: "Uferstraße",
              house: "7",
              district: "Wünsdorf",
              building: "Innenhof",
              topic: "Sinne, Gewürze und Geschmack",
              participants: 62,
              audience: "Klassenstufe 7–8",
              description:
                "Ein Riechen, Schmecken und Mischen mit Kräutern, Gewürzen und regionalem Gemüse.",
              publicDescription:
                "Ein Mitmachformat zum Riechen, Schmecken und Mischen mit regionalem Gemüse.",
              contact: {
                first: "Jonas",
                last: "Klee",
                role: "Schulsozialarbeit",
                company: "Oberschule am Fluss",
                phone: "03377 410 269",
                mobile: "0178 923 44 06",
                email: "j.klee@example.org",
              },
              resource: "Essen-Wissen Bus",
              visibility: "teilweise öffentlich",
              internalNotes:
                "Vorläufig: Zufahrt und Stellfläche noch bestätigen.",
              creator: "Diether E.",
              changed: "27.08.2026, 15:45",
            },
            {
              id: "demo-3",
              title: "Gemüsehelden unterwegs",
              publicTitle: "Gemüsehelden unterwegs",
              type: "bus",
              status: "durchgeführt",
              start: "2026-09-16",
              end: "2026-09-16",
              startTime: "08:30",
              endTime: "12:30",
              institution: "Familienzentrum Sonnenhof",
              institutionType: "Familienzentrum",
              state: "Brandenburg",
              postal: "14532",
              city: "Kleinmachnow",
              street: "Rosenanger",
              house: "3",
              district: "",
              building: "Gartenbereich",
              topic: "Gemüsevielfalt und Saisonkalender",
              participants: 35,
              audience: "Familien und Kinder ab 6 Jahren",
              description:
                "Kinder und Eltern lernen saisonales Gemüse kennen und verwandeln es in schnelle Familiengerichte.",
              publicDescription:
                "Kinder und Eltern entdecken saisonales Gemüse und schnelle Familiengerichte.",
              contact: {
                first: "Nele",
                last: "Ahrens",
                role: "Familienbildung",
                company: "Familienzentrum Sonnenhof",
                phone: "033203 886 41",
                mobile: "0157 550 72 18",
                email: "n.ahrens@example.org",
              },
              resource: "Essen-Wissen Bus",
              visibility: "öffentlich",
              internalNotes: "Nachbereitung als Fotodokumentation angefragt.",
              creator: "Stiftungsteam",
              changed: "17.09.2026, 09:02",
            },
            {
              id: "demo-4",
              title: "Teig & Teamwork",
              publicTitle: "Teig & Teamwork",
              type: "kitchen",
              status: "bestätigt",
              start: "2026-09-10",
              end: "2026-09-10",
              startTime: "14:00",
              endTime: "17:00",
              institution: "Jugendfreizeithaus Nord",
              institutionType: "Jugendfreizeiteinrichtung",
              state: "Sachsen",
              postal: "01067",
              city: "Dresden",
              street: "Kastanienstraße",
              house: "22",
              district: "",
              building: "Stiftungsküche, Raum 2",
              topic: "Hefeteig, Geduld und Teamwork",
              participants: 18,
              audience: "Jugendliche von 12–16 Jahren",
              description:
                "In der Stiftungsküche wird geknetet, gewartet und gemeinsam ein herzhaftes Ofenblech entwickelt.",
              publicDescription:
                "Gemeinsam kneten, warten und ein herzhaftes Ofenblech entwickeln.",
              contact: {
                first: "Sina",
                last: "Wolff",
                role: "Pädagogische Leitung",
                company: "Jugendfreizeithaus Nord",
                phone: "0351 288 42 90",
                mobile: "0162 711 63 04",
                email: "s.wolff@example.org",
              },
              resource: "Stiftungsküche",
              visibility: "öffentlich",
              internalNotes: "Allergieliste am Veranstaltungstag bereithalten.",
              creator: "Stiftungsteam",
              changed: "25.08.2026, 11:28",
            },
            {
              id: "demo-5",
              title: "Saisonal kochen: Kürbis",
              publicTitle: "Saisonal kochen: Kürbis",
              type: "kitchen",
              status: "Anfrage",
              start: "2026-09-22",
              end: "2026-09-22",
              startTime: "09:00",
              endTime: "12:00",
              institution: "Kita Regenbogen",
              institutionType: "Kindertagesstätte",
              state: "Brandenburg",
              postal: "14467",
              city: "Potsdam",
              street: "Birkenallee",
              house: "9",
              district: "",
              building: "Stiftungsküche",
              topic: "Kürbis, Farben und Texturen",
              participants: 24,
              audience: "Vorschule",
              description:
                "Eine erste Anfrage für eine farbenfrohe Küchenstunde mit Kürbis und saisonalen Zutaten.",
              publicDescription:
                "Eine farbenfrohe Küchenstunde mit Kürbis und saisonalen Zutaten.",
              contact: {
                first: "Romy",
                last: "Berg",
                role: "Leitung",
                company: "Kita Regenbogen",
                phone: "0331 201 77 51",
                mobile: "0171 612 99 30",
                email: "r.berg@example.org",
              },
              resource: "Stiftungsküche",
              visibility: "intern",
              internalNotes:
                "Anfrage eingegangen am 26.08. Noch keine Freigabe.",
              creator: "Diether E.",
              changed: "26.08.2026, 14:06",
            },
            {
              id: "demo-6",
              title: "Kochinsel der Nachhaltigkeit",
              publicTitle: "Kochinsel der Nachhaltigkeit",
              type: "kitchen",
              status: "abgesagt",
              start: "2026-09-18",
              end: "2026-09-18",
              startTime: "11:00",
              endTime: "15:00",
              institution: "Familienzentrum Mosaik",
              institutionType: "soziale Einrichtung",
              state: "Sachsen-Anhalt",
              postal: "39104",
              city: "Magdeburg",
              street: "Leipziger Straße",
              house: "31",
              district: "",
              building: "Stiftungsküche",
              topic: "Resteküche und klimafreundliche Teller",
              participants: 30,
              audience: "Familien",
              description:
                "Ein Workshop zu Resteküche und klimafreundlichen Lieblingsgerichten.",
              publicDescription:
                "Ein Workshop zu Resteküche und klimafreundlichen Lieblingsgerichten.",
              contact: {
                first: "Tabea",
                last: "Sommer",
                role: "Projektleitung",
                company: "Familienzentrum Mosaik",
                phone: "0391 442 80 16",
                mobile: "0151 330 45 82",
                email: "t.sommer@example.org",
              },
              resource: "Stiftungsküche",
              visibility: "öffentlich",
              internalNotes:
                "Abgesagt: Einrichtung musste den Termin verschieben.",
              creator: "Stiftungsteam",
              changed: "29.08.2026, 09:18",
            },
          ],
        };

        
        const esc = (value) =>
          String(value ?? "").replace(
            /[&<>'"]/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;",
              })[c],
          );
        const icon = (name, stroke = "currentColor") => {
          const paths = {
            bowl: '<path d="M4 10h16a8 8 0 0 1-16 0Z"/><path d="M7 19h10M9 6.5c1.5-1.3 4.5-1.3 6 0M12 4v2"/>',
            calendar:
              '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 9h18"/>',
            bus: '<path d="M5 17h14l1-7c.2-2-1.2-3-3-3H7c-1.8 0-3.2 1-3 3l1 7Z"/><path d="M4 12h16M7 17v2M17 17v2M7 14h.01M17 14h.01M7 7V5h10v2"/>',
            chef: '<path d="M7 19h10M9 19v-5h6v5M7 14h10v-3.3a3 3 0 0 0-2.1-2.85A3.5 3.5 0 0 0 8.1 9 3 3 0 0 0 7 14Z"/><path d="M10 6.5a2.8 2.8 0 0 1 5.2-.9"/>',
            chart: '<path d="M4 19V5M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/>',
            users:
              '<circle cx="9" cy="8" r="3"/><path d="M3 20c.4-3.4 2.5-5 6-5s5.6 1.6 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.9M18 15c2.1.4 3.3 1.7 3.7 3.8"/>',
            settings:
              '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1H3a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1A1.8 1.8 0 0 1 6.9 2.6l.1.1a1.8 1.8 0 0 0 3.1-1.3v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.1Z"/>',
            search:
              '<circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/>',
            plus: '<path d="M12 5v14M5 12h14"/>',
            left: '<path d="m15 18-6-6 6-6"/>',
            right: '<path d="m9 18 6-6-6-6"/>',
            chevron: '<path d="m7 10 5 5 5-5"/>',
            filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
            map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
            phone:
              '<path d="M6 3h3l1.5 4-2 1.3a14.2 14.2 0 0 0 5.2 5.2l1.3-2 4 1.5v3c0 1.1-.9 2-2 2C10.4 18 6 13.6 6 7c0-1.1 0-2.9 0-4Z"/>',
            mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
            edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
            copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
            close: '<path d="m6 6 12 12M18 6 6 18"/>',
            clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
            check: '<path d="m5 12 4 4L19 6"/>',
            alert:
              '<path d="M10.4 4.2 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.6 4.2a2 2 0 0 0-3.2 0Z"/><path d="M12 9v4M12 16h.01"/>',
            download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
            print:
              '<path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
            shield:
              '<path d="M12 3 20 6v5c0 5-3.4 8.1-8 10-4.6-1.9-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
            route:
              '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h4a4 4 0 0 0 4-4V9M16 6h-4a4 4 0 0 0-4 4v2"/>',
            trash:
              '<path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3"/>',
            more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
            leaf: '<path d="M20 4C9 4 4 9 4 16c0 2.8 2.2 4 4 4 7 0 12-5 12-16Z"/><path d="M4 20c2.5-4.5 6.3-7.7 11-10"/>',
          };
          return (
            '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="' +
            stroke +
            '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            (paths[name] || paths.calendar) +
            "</svg></span>"
          );
        };

        const parseDate = (key) => {
          const [y, m, d] = key.split("-").map(Number);
          return new Date(y, m - 1, d);
        };
        const keyDate = (date) =>
          [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");
        const formatDate = (key, opts = {}) =>
          parseDate(key).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: opts.year === false ? undefined : "numeric",
            ...opts,
          });
        const formatLong = (key) =>
          parseDate(key).toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        const mondayIndex = (date) => (date.getDay() + 6) % 7;
        const startOfWeek = (date) => {
          const d = new Date(date);
          d.setDate(d.getDate() - mondayIndex(d));
          return d;
        };
        const addDays = (date, amount) => {
          const d = new Date(date);
          d.setDate(d.getDate() + amount);
          return d;
        };
        const sameDay = (a, b) => keyDate(a) === keyDate(b);
        const monthTitle = (date) =>
          months[date.getMonth()] + " " + date.getFullYear();
        const typeLabel = (event) =>
          event.type === "bus" ? "Bus-Einsatz" : "Stiftungsküche";
        const typeIcon = (event) =>
          event.type === "bus" ? icon("bus") : icon("chef");
        const statusClass = (status) =>
          ({
            bestätigt: "confirmed",
            "vorläufig geplant": "planned",
            Anfrage: "request",
            durchgeführt: "done",
            abgesagt: "cancelled",
          })[status] || "planned";
        const isHiddenPublic = (event) =>
          state.mode === "public" && event.visibility === "intern";
        const visibleEvents = () => {
          const query = state.search.trim().toLowerCase();
          return state.events
            .filter((e) => {
              if (isHiddenPublic(e)) return false;
              if (state.type !== "all" && e.type !== state.type) return false;
              if (state.status !== "all" && e.status !== state.status)
                return false;
              if (state.region !== "all" && e.state !== state.region)
                return false;
              if (query) {
                const hay = [
                  e.title,
                  e.publicTitle,
                  e.institution,
                  e.city,
                  e.postal,
                  e.state,
                  e.topic,
                  e.status,
                  e.contact.first,
                  e.contact.last,
                ]
                  .join(" ")
                  .toLowerCase();
                if (!hay.includes(query)) return false;
              }
              return true;
            })
            .sort((a, b) =>
              (a.start + a.startTime).localeCompare(b.start + b.startTime),
            );
        };
        const eventsForDate = (date) =>
          visibleEvents().filter(
            (e) => e.start <= keyDate(date) && e.end >= keyDate(date),
          );
        const publicTitle = (event) =>
          state.mode === "public" ? event.publicTitle : event.title;
        const placeLabel = (event) =>
          state.mode === "public"
            ? event.city + " · " + event.state
            : event.institution + " · " + event.city;

        function renderShell() { 
          app.innerHTML = `
          <div class="app-shell">
            <aside class="sidebar">
              <div class="brand"><div class="brand-mark">${icon("bowl")}</div><div class="brand-copy"><strong>Essen-Wissen</strong><small>Stiftung Eildermann</small></div></div>
              <div class="nav-label">Arbeitsbereich</div>
              <nav class="nav" aria-label="Hauptnavigation">
                <button class="active" data-nav="calendar">${icon("calendar")}<span>Kalender</span><i class="nav-dot"></i></button>
                <button data-nav="statistics">${icon("chart")}<span>Auswertung</span><i class="nav-dot"></i></button>
                <button data-nav="people">${icon("users")}<span>Einrichtungen</span><i class="nav-dot"></i></button>
                <button data-nav="settings">${icon("settings")}<span>Einstellungen</span><i class="nav-dot"></i></button>
              </nav>
              <div class="sidebar-spacer"></div>
              <div class="privacy-card">${icon("shield")}<strong>Datenschutz im Blick</strong><p>Kontaktdaten bleiben intern. Die öffentliche Ansicht zeigt nur freigegebene Angaben.</p></div>
              <div class="demo-badge">DEMO-DATEN · 2026</div>
              <div id="login">
                <h2>Anmeldung</h2>
                <form id="login-form">
                <label>
                    E-Mail
                    <input type="email" id="login-email" required autocomplete="email" />
                    </label>
                <label>
                    Passwort <input type="password" id="login-password" required autocomplete="current-password" />
                </label>
                <button type="submit">Anmelden</button>
                </form>
                <div id="login-status"></div>
            </div>
            </aside>
            <main class="content">
              <header class="topbar"><div class="breadcrumbs"><span>Arbeitsbereich</span><b>›</b><b>Einsatzkalender</b></div><div class="top-actions"><div class="mode-switch" role="group" aria-label="Ansicht wählen"><button data-mode="internal" class="active">Intern</button><button data-mode="public">Öffentlich</button></div><div class="avatar" title="Diether Eildermann">DE</div></div></header>
              <section class="hero"><div><p class="eyebrow">Planen, kochen, Wirkung sehen</p><h1>Der Kalender, der<br><em>Bewegung</em> schafft.</h1><p class="hero-copy">Alle Bus-Einsätze und Küchenmomente an einem Ort. Klar genug für die Planung, offen genug für die Gemeinschaft.</p></div><button class="primary-btn" id="new-event">${icon("plus")} Neuen Termin anlegen</button></section>
              <section class="stats" id="stats"></section>
              <section class="toolbar" aria-label="Kalenderwerkzeuge">
                <div class="search-wrap">${icon("search")}<input id="search" class="search" placeholder="Einrichtung, Ort, Thema …" aria-label="Veranstaltungen durchsuchen" /></div>
                <select id="type-filter" class="filter-select" aria-label="Veranstaltungsart"><option value="all">Alle Arten</option><option value="bus">Bus-Einsatz</option><option value="kitchen">Stiftungsküche</option></select>
                <select id="status-filter" class="filter-select" aria-label="Status"><option value="all">Alle Status</option><option>bestätigt</option><option>vorläufig geplant</option><option>Anfrage</option><option>durchgeführt</option><option>abgesagt</option></select>
                <select id="region-filter" class="filter-select" aria-label="Bundesland"><option value="all">Alle Bundesländer</option><option>Berlin</option><option>Brandenburg</option><option>Sachsen</option><option>Sachsen-Anhalt</option></select>
                <span class="toolbar-divider"></span>
                <div class="view-switch" role="group" aria-label="Kalenderansicht"><button data-view="week">Woche</button><button data-view="month" class="active">Monat</button><button data-view="year">Jahr</button><button data-view="list">Liste</button></div>
                <button class="secondary-btn" id="print-btn">${icon("print")} Drucken</button>
              </section>
              <div class="workspace"><section class="calendar-card"><div id="calendar-header" class="calendar-header"></div><div id="calendar-body" class="calendar-body"></div></section><aside class="insight-rail" id="insight-rail"></aside></div>
            </main>
          </div>
          <div id="drawer-host"></div><div id="modal-host"></div><div id="toast-host"></div>`;
          bindShellEvents();
          bindLoginEvents();
          renderAll();
        }

        function bindLoginEvents() {
            const loginForm = document.getElementById("login-form");
            const loginStatus = document.getElementById("login-status");

            if (!loginForm) return;

            loginForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                loginStatus.textContent = "Anmeldung läuft …";

                const email = document.getElementById("login-email").value.trim();
                const password = document.getElementById("login-password").value;

                try {
                const res = await apiRequest("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    loginStatus.textContent =
                    (err && err.message) || `Anmeldung fehlgeschlagen (Status ${res.status})`;
                    return;
                }

                const data = await res.json();
                if (!data.token) {
                    loginStatus.textContent = "Antwort der API enthält kein Token.";
                    return;
                }

                setAuthToken(data.token);
                loginStatus.textContent = "Erfolgreich angemeldet.";

                if (data.user) {
                    renderCurrentUser(data.user);
                }

                // Nach erfolgreichem Login echte Daten laden
                await loadProtectedEvents();
                } catch (error) {
                console.error("Login-Fehler", error);
                loginStatus.textContent = "Technischer Fehler bei der Anmeldung.";
                }
            });
            }

            function renderCurrentUser(user) {
            const avatar = document.querySelector(".avatar");
            if (!avatar) return;

            const initials = (user.name || user.email || "").split("@")[0].split(" ")
                .map((part) => part[0] || "")
                .join("")
                .slice(0, 2)
                .toUpperCase();

            avatar.textContent = initials || "DE";
        }

        async function loadProtectedEvents() {
        try {
            const res = await apiRequest("/events", { method: "GET" });

            if (!res.ok) {
            console.error("Fehler beim Laden geschützter Events", res.status);
            return;
            }

            const data = await res.json();
            const events = data.items || data.events || [];

            // Erwartet: Struktur kompatibel zu den bisherigen Demo-Events
            // ggf. Mapping nötig, z. B.:
            // state.events = events.map(mapApiEventToFrontendShape);

            state.events = events; // wenn Backend bereits das passende Format liefert
            renderAll();
        } catch (error) {
            console.error("Fehler beim Laden geschützter Events", error);
        }
        }

        function bindShellEvents() {
          document
            .getElementById("new-event")
            .addEventListener("click", () => openForm());
          document
            .getElementById("print-btn")
            .addEventListener("click", () => window.print());
          document.getElementById("search").addEventListener("input", (e) => {
            state.search = e.target.value;
            renderAll();
          });
          document
            .getElementById("type-filter")
            .addEventListener("change", (e) => {
              state.type = e.target.value;
              renderAll();
            });
          document
            .getElementById("status-filter")
            .addEventListener("change", (e) => {
              state.status = e.target.value;
              renderAll();
            });
          document
            .getElementById("region-filter")
            .addEventListener("change", (e) => {
              state.region = e.target.value;
              renderAll();
            });
          document.querySelectorAll("[data-view]").forEach((btn) =>
            btn.addEventListener("click", () => {
              state.view = btn.dataset.view;
              renderAll();
            }),
          );
          document.querySelectorAll("[data-mode]").forEach((btn) =>
            btn.addEventListener("click", () => {
              state.mode = btn.dataset.mode;
              renderAll();
              showToast(
                state.mode === "public"
                  ? "Öffentliche, datensparsame Ansicht aktiv."
                  : "Interne Ansicht aktiv.",
              );
            }),
          );
          document
            .querySelectorAll("[data-nav]")
            .forEach((btn) =>
              btn.addEventListener("click", () =>
                showToast(
                  btn.dataset.nav === "calendar"
                    ? "Du bist bereits im Einsatzkalender."
                    : "Dieser Bereich ist für die nächste Ausbaustufe vorbereitet.",
                ),
              ),
            );
        }

        function renderAll() {
          document
            .querySelectorAll("[data-view]")
            .forEach((btn) =>
              btn.classList.toggle("active", btn.dataset.view === state.view),
            );
          document
            .querySelectorAll("[data-mode]")
            .forEach((btn) =>
              btn.classList.toggle("active", btn.dataset.mode === state.mode),
            );
          const search = document.getElementById("search");
          if (search && search.value !== state.search)
            search.value = state.search;
          const type = document.getElementById("type-filter");
          if (type) type.value = state.type;
          const status = document.getElementById("status-filter");
          if (status) status.value = state.status;
          const region = document.getElementById("region-filter");
          if (region) region.value = state.region;
          renderStats();
          renderCalendar();
          renderRail();
          if (state.selectedId) renderDrawer();
        }

        function renderStats() {
          const events = visibleEvents();
          const institutions = new Set(events.map((e) => e.institution)).size;
          const children = events.reduce(
            (sum, e) => sum + Number(e.participants || 0),
            0,
          );
          const next = events.find((e) => e.start >= keyDate(demoToday));
          document.getElementById("stats").innerHTML = `
          <div class="stat-card"><span class="stat-label">Termine im Filter</span><span class="stat-value">${events.length}</span><span class="stat-note">Demodaten</span></div>
          <div class="stat-card"><span class="stat-label">Bus-Einsätze</span><span class="stat-value">${events.filter((e) => e.type === "bus").length}</span><span class="stat-note">unterwegs</span></div>
          <div class="stat-card"><span class="stat-label">Einrichtungen</span><span class="stat-value">${institutions}</span><span class="stat-note">erreicht</span></div>
          <div class="stat-card"><span class="stat-label">Teilnehmende</span><span class="stat-value">${children}</span><span class="stat-note">geplant / erreicht</span></div>`;
        }

        function renderCalendar() {
          const title =
            state.view === "year"
              ? String(state.anchor.getFullYear())
              : state.view === "week"
                ? weekTitle()
                : state.view === "list"
                  ? "Kommende Veranstaltungen"
                  : monthTitle(state.anchor);
          const subtitle =
            state.view === "list"
              ? visibleEvents().length +
                " sichtbare Termine · sortiert nach Start"
              : state.mode === "public"
                ? "Öffentliche Ansicht · nur freigegebene Angaben"
                : "Interne Planung · vollständige Termininformationen";
          document.getElementById("calendar-header").innerHTML =
            `<div><div class="period-title">${title}</div><div class="period-subtitle">${subtitle}</div></div><div class="period-controls"><button class="today-btn" id="today-btn">Heute</button><button class="icon-btn" id="prev-btn" aria-label="Vorheriger Zeitraum">${icon("left")}</button><button class="icon-btn" id="next-btn" aria-label="Nächster Zeitraum">${icon("right")}</button></div>`;
          document.getElementById("today-btn").addEventListener("click", () => {
            state.anchor = new Date(demoToday);
            renderAll();
          });
          document
            .getElementById("prev-btn")
            .addEventListener("click", () => shiftPeriod(-1));
          document
            .getElementById("next-btn")
            .addEventListener("click", () => shiftPeriod(1));
          const body = document.getElementById("calendar-body");
          if (state.view === "month") body.innerHTML = renderMonth();
          if (state.view === "week") body.innerHTML = renderWeek();
          if (state.view === "year") body.innerHTML = renderYear();
          if (state.view === "list") body.innerHTML = renderList();
          bindViewEvents();
        }

        function shiftPeriod(amount) {
          const d = new Date(state.anchor);
          if (state.view === "week") d.setDate(d.getDate() + amount * 7);
          else if (state.view === "year")
            d.setFullYear(d.getFullYear() + amount);
          else d.setMonth(d.getMonth() + amount);
          state.anchor = d;
          renderAll();
        }
        function weekTitle() {
          const start = startOfWeek(state.anchor),
            end = addDays(start, 6);
          if (start.getMonth() === end.getMonth())
            return `${start.getDate()}.–${end.getDate()}. ${months[start.getMonth()]} ${start.getFullYear()}`;
          return `${start.getDate()}. ${monthShort[start.getMonth()]} – ${end.getDate()}. ${monthShort[end.getMonth()]} ${end.getFullYear()}`;
        }
        function eventChip(event) {
          const cancelled = event.status === "abgesagt" ? " cancelled" : "";
          return `<button class="event-chip ${event.type}${cancelled}" data-event-id="${event.id}" aria-label="${esc(publicTitle(event))}">${event.type === "bus" ? icon("bus") : icon("chef")}<span class="chip-time">${esc(event.startTime)}–${esc(event.endTime)}</span><span class="chip-title">${esc(publicTitle(event))}</span><span class="chip-place">${esc(placeLabel(event))}</span></button>`;
        }
        function renderMonth() {
          const y = state.anchor.getFullYear(),
            m = state.anchor.getMonth();
          const first = new Date(y, m, 1),
            days = new Date(y, m + 1, 0).getDate(),
            offset = mondayIndex(first);
          let html =
            '<div class="month-grid">' +
            weekdays.map((d) => `<div class="weekday">${d}</div>`).join("");
          const total = Math.ceil((offset + days) / 7) * 7;
          for (let i = 0; i < total; i++) {
            const day = i - offset + 1,
              date = new Date(y, m, day),
              inMonth = day >= 1 && day <= days;
            const key = keyDate(date),
              evs = inMonth ? eventsForDate(date) : [];
            html += `<div class="month-day ${inMonth ? "" : "is-muted"} ${sameDay(date, demoToday) ? "is-today" : ""}"><div class="day-number">${inMonth ? (sameDay(date, demoToday) ? `<span class="today-dot">${day}</span>` : `<span>${day}</span>`) : `<span>${date.getDate()}</span>`}</div><div class="day-events">${evs.slice(0, 3).map(eventChip).join("")}${evs.length > 3 ? `<button class="more-events" data-day="${key}">+${evs.length - 3} weitere</button>` : ""}</div></div>`;
          }
          return html + "</div>";
        }
        function renderWeek() {
          const start = startOfWeek(state.anchor),
            hours = [
              "08:00",
              "09:00",
              "10:00",
              "11:00",
              "12:00",
              "13:00",
              "14:00",
              "15:00",
              "16:00",
              "17:00",
            ];
          let html =
            '<div class="week-grid-wrap"><div class="week-grid"><div class="week-time-col"><div class="week-time-head"></div>' +
            hours.map((h) => `<div class="week-time">${h}</div>`).join("") +
            "</div>";
          for (let i = 0; i < 7; i++) {
            const d = addDays(start, i);
            html += `<div class="week-day-head ${sameDay(d, demoToday) ? "is-today" : ""}"><span>${weekdays[i]}</span><strong>${d.getDate()}</strong></div>`;
          }
          html +=
            '<div class="week-time-col"><div class="week-spacer"></div></div>';
          for (let i = 0; i < 7; i++) {
            const d = addDays(start, i),
              key = keyDate(d),
              evs = eventsForDate(d);
            html += `<div class="week-column"><div class="week-spacer"></div>${evs
              .map((e) => {
                const top = Math.max(
                  0,
                  (Number(e.startTime.slice(0, 2)) - 8) * 69 +
                    ((Number(e.startTime.slice(3)) - 0) / 60) * 69,
                );
                const height = Math.max(
                  58,
                  (Number(e.endTime.slice(0, 2)) -
                    Number(e.startTime.slice(0, 2)) +
                    (Number(e.endTime.slice(3)) -
                      Number(e.startTime.slice(3))) /
                      60) *
                    69,
                );
                return `<button class="week-event ${e.type} ${e.status === "abgesagt" ? "cancelled" : ""}" data-event-id="${e.id}" style="top:${top + 48}px;height:${height}px"><time>${esc(e.startTime)}–${esc(e.endTime)}</time><strong>${esc(publicTitle(e))}</strong><small>${esc(state.mode === "public" ? e.city : e.institution)}</small></button>`;
              })
              .join("")}</div>`;
          }
          return html + "</div></div>";
        }
        function renderYear() {
          const y = state.anchor.getFullYear(),
            events = visibleEvents(),
            byMonth = Array.from({ length: 12 }, () => 0);
          events.forEach((e) => {
            const d = parseDate(e.start);
            if (d.getFullYear() === y) byMonth[d.getMonth()]++;
          });
          let html = `<div class="year-view"><div class="year-summary"><p><strong>${events.filter((e) => parseDate(e.start).getFullYear() === y).length}</strong> Termine in ${y} · farbige Tage zeigen Ressourcen</p><span class="visibility-pill">${state.mode === "public" ? "Öffentlich" : "Intern"}</span></div><div class="year-mini-grid">`;
          for (let m = 0; m < 12; m++) {
            const first = new Date(y, m, 1),
              days = new Date(y, m + 1, 0).getDate(),
              off = mondayIndex(first),
              monthEvents = events.filter(
                (e) =>
                  parseDate(e.start).getFullYear() === y &&
                  parseDate(e.start).getMonth() === m,
              );
            let daysHtml = "";
            for (let i = 0; i < off; i++) daysHtml += "<span></span>";
            for (let d = 1; d <= days; d++) {
              const date = new Date(y, m, d),
                evs = monthEvents.filter(
                  (e) => e.start <= keyDate(date) && e.end >= keyDate(date),
                );
              const kinds = new Set(evs.map((e) => e.type));
              daysHtml += `<button class="mini-day ${kinds.size > 1 ? "has-both" : kinds.has("bus") ? "has-bus" : kinds.has("kitchen") ? "has-kitchen" : ""} ${sameDay(date, demoToday) ? "is-today" : ""}" data-mini-date="${keyDate(date)}">${d}</button>`;
            }
            html += `<div class="mini-month"><h4>${months[m]} <span style="color:#93a19a;font:9px 'Space Mono',monospace">${byMonth[m] ? "· " + byMonth[m] : ""}</span></h4><div class="mini-weekdays">${weekdays.map((d) => `<span>${d[0]}</span>`).join("")}</div><div class="mini-days">${daysHtml}</div></div>`;
          }
          return html + "</div></div>";
        }
        function renderList() {
          const events = visibleEvents();
          if (!events.length)
            return `<div class="empty-state">${icon("search")}<strong>Keine Termine gefunden</strong><p>Versuche einen anderen Suchbegriff oder setze die Filter zurück.</p></div>`;
          const grouped = {};
          events.forEach((e) => {
            const key = e.start.slice(0, 7);
            (grouped[key] ||= []).push(e);
          });
          let html = '<div class="list-view">';
          Object.keys(grouped)
            .sort()
            .forEach((key) => {
              const [y, m] = key.split("-").map(Number);
              html += `<section class="list-month"><h3 class="list-month-title">${months[m - 1]} ${y}</h3>`;
              grouped[key].forEach((e) => {
                html += `<div class="list-row"><div class="list-date">${formatDate(e.start, { year: false })}<small>${parseDate(e.start).toLocaleDateString("de-DE", { weekday: "short" })}</small></div><div class="list-main"><div class="list-title">${typeIcon(e)} ${esc(publicTitle(e))}</div><div class="list-meta">${esc(e.startTime)}–${esc(e.endTime)} · ${esc(placeLabel(e))}</div></div><div class="list-actions"><span class="type-pill ${e.type}">${e.type === "bus" ? "Bus" : "Küche"}</span><span class="status-pill ${statusClass(e.status)}">${esc(e.status)}</span><button class="icon-btn" data-event-id="${e.id}" aria-label="Termin öffnen">${icon("right")}</button></div></div>`;
              });
              html += "</section>";
            });
          return html + "</div>";
        }
        function bindViewEvents() {
          document.querySelectorAll("[data-event-id]").forEach((el) =>
            el.addEventListener("click", () => {
              state.selectedId = el.dataset.eventId;
              renderDrawer();
            }),
          );
          document.querySelectorAll("[data-mini-date]").forEach((el) =>
            el.addEventListener("click", () => {
              state.anchor = parseDate(el.dataset.miniDate);
              state.view = "month";
              renderAll();
            }),
          );
          document.querySelectorAll("[data-day]").forEach((el) =>
            el.addEventListener("click", () => {
              state.anchor = parseDate(el.dataset.day);
              state.view = "day";
              state.view = "month";
              renderAll();
            }),
          );
        }

        function renderRail() {
          const events = visibleEvents(),
            next =
              events.find(
                (e) => e.start >= keyDate(demoToday) && e.status !== "abgesagt",
              ) || events.find((e) => e.status !== "abgesagt");
          const busCount = events.filter(
              (e) => e.type === "bus" && e.status !== "abgesagt",
            ).length,
            kitchenCount = events.filter(
              (e) => e.type === "kitchen" && e.status !== "abgesagt",
            ).length,
            total = Math.max(1, busCount + kitchenCount);
          document.getElementById("insight-rail").innerHTML = `
          <section class="rail-card"><div class="rail-kicker">Als Nächstes</div>${next ? `<div class="next-date">${formatLong(next.start)} · ${next.startTime} Uhr</div><div class="next-title">${esc(publicTitle(next))}</div><div class="next-meta">${esc(placeLabel(next))}</div><button class="rail-link" style="margin-top:14px" data-event-id="${next.id}">Termin öffnen ${icon("right")}</button>` : "<h3>Alles ruhig.</h3><p>Für die aktuelle Auswahl stehen keine weiteren Termine an.</p>"}</section>
          <section class="rail-card"><div class="rail-kicker">Ressourcenblick</div><h3>${events.length} Einträge</h3><p>Belegung im aktuellen Filter – abgesagte Termine nicht eingerechnet.</p><div class="resource-row"><div class="resource-head"><span>${icon("bus")} Essen-Wissen Bus</span><span>${busCount}/${total}</span></div><div class="meter bus"><span style="width:${Math.round((busCount / total) * 100)}%"></span></div></div><div class="resource-row"><div class="resource-head"><span>${icon("chef")} Stiftungsküche</span><span>${kitchenCount}/${total}</span></div><div class="meter kitchen"><span style="width:${Math.round((kitchenCount / total) * 100)}%"></span></div></div></section>
          <section class="rail-card"><div class="rail-kicker">Orientierung</div><div class="legend"><div class="legend-item"><i class="legend-mark bus"></i> Bus-Einsatz</div><div class="legend-item"><i class="legend-mark kitchen"></i> Stiftungsküche</div><div class="legend-item"><i class="legend-mark today"></i> Heute · 31.08.2026</div></div><div class="small-note">${icon("shield")} Demo-Daten mit frei erfundenen Kontakten. Die öffentliche Ansicht blendet interne Einträge und persönliche Kontaktdaten aus.</div></section>`;
          document
            .querySelectorAll("#insight-rail [data-event-id]")
            .forEach((el) =>
              el.addEventListener("click", () => {
                state.selectedId = el.dataset.eventId;
                renderDrawer();
              }),
            );
        }

        function renderDrawer() {
          const event = state.events.find((e) => e.id === state.selectedId);
          if (!event) {
            document.getElementById("drawer-host").innerHTML = "";
            return;
          }
          const publicMode = state.mode === "public";
          const detail = publicMode
            ? `
          <div class="detail-block"><div class="detail-label">Öffentlich sichtbar</div><div class="detail-value">${esc(event.publicDescription || event.publicTitle)}</div></div>
          <div class="detail-block"><div class="detail-grid"><div class="detail-cell"><span>Datum</span><strong>${formatLong(event.start)}</strong></div><div class="detail-cell"><span>Uhrzeit</span><strong>${esc(event.startTime)}–${esc(event.endTime)} Uhr</strong></div><div class="detail-cell"><span>Veranstaltungsart</span><strong>${typeLabel(event)}</strong></div><div class="detail-cell"><span>Ort</span><strong>${esc(event.city)}, ${esc(event.state)}</strong></div></div></div>
          <div class="privacy-callout">${icon("shield")} Diese öffentliche Detailansicht enthält keine persönlichen Kontaktdaten, internen Notizen oder vollständige Adresse.</div>`
            : `
          <div class="detail-block"><div class="detail-label">Planung</div><div class="detail-grid"><div class="detail-cell"><span>Datum</span><strong>${formatLong(event.start)}</strong></div><div class="detail-cell"><span>Uhrzeit</span><strong>${esc(event.startTime)}–${esc(event.endTime)} Uhr</strong></div><div class="detail-cell"><span>Art</span><strong>${typeIcon(event)} ${typeLabel(event)}</strong></div><div class="detail-cell"><span>Ressource</span><strong>${esc(event.resource)}</strong></div><div class="detail-cell"><span>Teilnehmende</span><strong>${esc(event.participants)} · ${esc(event.audience)}</strong></div><div class="detail-cell"><span>Thema / Modul</span><strong>${esc(event.topic)}</strong></div></div></div>
          <div class="detail-block"><div class="detail-label">Einrichtung & Ort</div><div class="detail-value"><strong>${esc(event.institution)}</strong><br>${esc(event.institutionType)}<br><br>${esc(event.street)} ${esc(event.house)}<br>${esc(event.postal)} ${esc(event.city)}<br>${esc(event.state)}${event.building ? '<br><span style="color:#70837b;font-size:11px">' + esc(event.building) + "</span>" : ""}</div><button class="secondary-btn" id="route-btn" style="margin-top:12px">${icon("route")} Route öffnen</button></div>
          <div class="detail-block"><div class="detail-label">Beschreibung</div><div class="detail-value">${esc(event.description)}</div></div>
          <div class="detail-block"><div class="detail-label">Ansprechpartner</div><div class="detail-value"><strong>${esc(event.contact.first)} ${esc(event.contact.last)}</strong><br>${esc(event.contact.role)} · ${esc(event.contact.company)}</div><div class="detail-grid" style="margin-top:12px"><div class="detail-cell"><span>Telefon</span><a href="tel:${esc(event.contact.phone)}">${icon("phone")} ${esc(event.contact.phone)}</a></div><div class="detail-cell"><span>Mobil</span><a href="tel:${esc(event.contact.mobile)}">${icon("phone")} ${esc(event.contact.mobile)}</a></div><div class="detail-cell"><span>E-Mail</span><a href="mailto:${esc(event.contact.email)}">${icon("mail")} ${esc(event.contact.email)}</a></div><div class="detail-cell"><span>Zuletzt geändert</span><strong>${esc(event.changed)}</strong></div></div></div>
          <div class="detail-block"><div class="detail-label">Interne Notiz</div><div class="detail-value">${esc(event.internalNotes)}</div><div class="small-note">${icon("shield")} Nur in der internen Ansicht sichtbar.</div></div>`;
          document.getElementById("drawer-host").innerHTML =
            `<div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Termindetails"><div class="drawer-head"><div class="drawer-top"><span class="type-pill ${event.type}">${typeIcon(event)} ${typeLabel(event)}</span><button class="icon-btn" id="close-drawer" aria-label="Details schließen">${icon("close")}</button></div><h2>${esc(publicTitle(event))}</h2><p class="drawer-sub">${esc(placeLabel(event))}</p><div style="margin-top:12px"><span class="status-pill ${statusClass(event.status)}">${esc(event.status)}</span> <span class="visibility-pill">${publicMode ? "Öffentlich" : esc(event.visibility)}</span></div></div><div class="drawer-body">${detail}<div class="drawer-actions">${!publicMode ? `<button class="secondary-btn" id="edit-event">${icon("edit")} Bearbeiten</button><button class="secondary-btn" id="copy-event">${icon("copy")} Kopieren</button><button class="secondary-btn" id="cancel-event">${icon(event.status === "abgesagt" ? "check" : "close")} ${event.status === "abgesagt" ? "Wieder aktivieren" : "Absagen"}</button><button class="secondary-btn" id="delete-event">${icon("trash")} Löschen</button>` : ""}<button class="secondary-btn" id="ics-event">${icon("download")} ICS exportieren</button></div></div></aside>`;
          document
            .getElementById("close-drawer")
            .addEventListener("click", closeDrawer);
          document
            .getElementById("drawer-backdrop")
            .addEventListener("click", closeDrawer);
          document
            .getElementById("ics-event")
            .addEventListener("click", () => exportICS(event));
          if (!publicMode) {
            document
              .getElementById("edit-event")
              .addEventListener("click", () => openForm(event.id));
            document
              .getElementById("copy-event")
              .addEventListener("click", () => openForm(event.id, true));
            document
              .getElementById("cancel-event")
              .addEventListener("click", () => {
                event.status =
                  event.status === "abgesagt"
                    ? "vorläufig geplant"
                    : "abgesagt";
                event.changed = "gerade eben";
                renderAll();
                renderDrawer();
                showToast(
                  event.status === "abgesagt"
                    ? "Termin wurde abgesagt."
                    : "Termin ist wieder vorläufig geplant.",
                );
              });
            document
              .getElementById("delete-event")
              .addEventListener("click", () => {
                if (confirm("Diesen Demotermin wirklich löschen?")) {
                  state.events = state.events.filter((e) => e.id !== event.id);
                  closeDrawer();
                  renderAll();
                  showToast("Termin gelöscht.");
                }
              });
            document
              .getElementById("route-btn")
              .addEventListener("click", () => {
                const q = encodeURIComponent(
                  `${event.street} ${event.house}, ${event.postal} ${event.city}, ${event.state}`,
                );
                window.open(
                  "https://www.google.com/maps/search/?api=1&query=" + q,
                  "_blank",
                );
              });
          }
        }
        function closeDrawer() {
          state.selectedId = null;
          document.getElementById("drawer-host").innerHTML = "";
        }

        function openForm(eventId = null, copy = false) {
          state.modal = "form";
          state.editingId = copy ? null : eventId;
          const e = eventId ? state.events.find((x) => x.id === eventId) : null;
          document.getElementById("modal-host").innerHTML =
            `<div class="modal-backdrop" id="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${e && !copy ? "Termin bearbeiten" : "Neuen Termin anlegen"}"><div class="modal-head"><h2>${e && !copy ? "Termin bearbeiten" : "Neuen Termin anlegen"}</h2><button class="icon-btn" id="close-modal" aria-label="Dialog schließen">${icon("close")}</button></div><form id="event-form" class="modal-body"><div class="form-grid"><div class="field full"><label for="f-title">Titel <span class="req">*</span></label><input id="f-title" name="title" required value="${esc(e && !copy ? e.title : e ? e.title + " · Kopie" : "")}" placeholder="z. B. Gemüsehelden unterwegs"></div><div class="field"><label for="f-type">Veranstaltungsart <span class="req">*</span></label><select id="f-type" name="type"><option value="bus" ${e?.type === "bus" ? "selected" : ""}>Essen-Wissen Bus</option><option value="kitchen" ${e?.type === "kitchen" ? "selected" : ""}>Stiftungsküche</option></select></div><div class="field"><label for="f-status">Status</label><select id="f-status" name="status">${["Anfrage", "vorläufig geplant", "bestätigt", "durchgeführt", "abgesagt"].map((s) => `<option ${e?.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div><div class="field"><label for="f-start">Datum <span class="req">*</span></label><input id="f-start" name="start" type="date" required value="${e?.start || keyDate(state.anchor)}"></div><div class="field"><label for="f-end">Enddatum</label><input id="f-end" name="end" type="date" value="${e?.end || e?.start || keyDate(state.anchor)}"><span class="field-help">Für eintägige Termine gleich dem Startdatum.</span></div><div class="field"><label for="f-start-time">Beginn <span class="req">*</span></label><input id="f-start-time" name="startTime" type="time" required value="${e?.startTime || "09:00"}"></div><div class="field"><label for="f-end-time">Ende <span class="req">*</span></label><input id="f-end-time" name="endTime" type="time" required value="${e?.endTime || "12:00"}"></div><div class="field"><label for="f-resource">Ressource</label><select id="f-resource" name="resource"><option ${e?.resource === "Essen-Wissen Bus" ? "selected" : ""}>Essen-Wissen Bus</option><option ${e?.resource === "Stiftungsküche" ? "selected" : ""}>Stiftungsküche</option><option ${e?.resource === "Beide Ressourcen" ? "selected" : ""}>Beide Ressourcen</option><option ${e?.resource === "Keine feste Ressource" ? "selected" : ""}>Keine feste Ressource</option></select></div><div class="field"><label for="f-visibility">Sichtbarkeit</label><select id="f-visibility" name="visibility"><option ${e?.visibility === "öffentlich" ? "selected" : ""}>öffentlich</option><option ${e?.visibility === "teilweise öffentlich" ? "selected" : ""}>teilweise öffentlich</option><option ${e?.visibility === "intern" ? "selected" : ""}>intern</option></select></div><div class="field"><label for="f-repeat">Wiederholung</label><select id="f-repeat" name="repeat"><option value="none">Keine Wiederholung</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option><option value="yearly">Jährlich</option></select></div><div class="field"><label for="f-repeat-until">Wiederholung bis</label><input id="f-repeat-until" name="repeatUntil" type="date"><span class="field-help">Optional – erzeugt Demotermine bis zu diesem Datum.</span></div><div class="form-section-label">Einrichtung & Ort</div><div class="field full"><label for="f-institution">Begünstigte Einrichtung <span class="req">*</span></label><input id="f-institution" name="institution" required value="${esc(e?.institution || "")}" placeholder="Name der Einrichtung"></div><div class="field"><label for="f-institution-type">Einrichtungstyp</label><select id="f-institution-type" name="institutionType">${["Kindertagesstätte", "Grundschule", "weiterführende Schule", "Hort", "Jugendfreizeiteinrichtung", "Familienzentrum", "soziale Einrichtung", "Unternehmen", "öffentliche Veranstaltung", "sonstige Einrichtung"].map((s) => `<option ${e?.institutionType === s ? "selected" : ""}>${s}</option>`).join("")}</select></div><div class="field"><label for="f-state">Bundesland</label><select id="f-state" name="state">${["Berlin", "Brandenburg", "Sachsen", "Sachsen-Anhalt", "Thüringen", "Mecklenburg-Vorpommern"].map((s) => `<option ${e?.state === s ? "selected" : ""}>${s}</option>`).join("")}</select></div><div class="field"><label for="f-postal">Postleitzahl</label><input id="f-postal" name="postal" value="${esc(e?.postal || "")}" inputmode="numeric"></div><div class="field"><label for="f-city">Ort</label><input id="f-city" name="city" value="${esc(e?.city || "")}"></div><div class="field"><label for="f-street">Straße</label><input id="f-street" name="street" value="${esc(e?.street || "")}"></div><div class="field"><label for="f-house">Hausnummer</label><input id="f-house" name="house" value="${esc(e?.house || "")}"></div><div class="field full"><label for="f-building">Gebäude, Raum oder Schulhof</label><input id="f-building" name="building" value="${esc(e?.building || "")}"></div><div class="form-section-label">Inhalt & Kontakt</div><div class="field"><label for="f-topic">Thema / Modul</label><input id="f-topic" name="topic" value="${esc(e?.topic || "")}"></div><div class="field"><label for="f-participants">Teilnehmende</label><input id="f-participants" name="participants" type="number" min="0" value="${e?.participants || 0}"></div><div class="field full"><label for="f-audience">Zielgruppe / Klassenstufe</label><input id="f-audience" name="audience" value="${esc(e?.audience || "")}"></div><div class="field full"><label for="f-description">Kurzbeschreibung</label><textarea id="f-description" name="description">${esc(e?.description || "")}</textarea></div><div class="field full"><label for="f-public-description">Öffentliche Beschreibung</label><textarea id="f-public-description" name="publicDescription">${esc(e?.publicDescription || "")}</textarea><span class="field-help">Diese Fassung erscheint in der öffentlichen Ansicht. Keine Namen oder Kontaktdaten eintragen.</span></div><div class="field"><label for="f-contact-first">Ansprechpartner Vorname</label><input id="f-contact-first" name="contactFirst" value="${esc(e?.contact.first || "")}"></div><div class="field"><label for="f-contact-last">Ansprechpartner Nachname</label><input id="f-contact-last" name="contactLast" value="${esc(e?.contact.last || "")}"></div><div class="field"><label for="f-contact-role">Funktion</label><input id="f-contact-role" name="contactRole" value="${esc(e?.contact.role || "")}"></div><div class="field"><label for="f-contact-company">Einrichtung / Unternehmen</label><input id="f-contact-company" name="contactCompany" value="${esc(e?.contact.company || "")}"></div><div class="field"><label for="f-phone">Telefon</label><input id="f-phone" name="phone" type="tel" value="${esc(e?.contact.phone || "")}"></div><div class="field"><label for="f-mobile">Mobiltelefon</label><input id="f-mobile" name="mobile" type="tel" value="${esc(e?.contact.mobile || "")}"></div><div class="field"><label for="f-email">E-Mail</label><input id="f-email" name="email" type="email" value="${esc(e?.contact.email || "")}"></div><div class="field full"><label for="f-notes">Interne Notizen</label><textarea id="f-notes" name="internalNotes">${esc(e?.internalNotes || "")}</textarea><span class="field-help">Nur in der internen Planung sichtbar.</span></div><div id="conflict-alert" class="conflict-alert hidden">${icon("alert")}<div><strong>Ressource bereits belegt</strong><span id="conflict-text">Der Zeitraum überschneidet sich mit einem bestehenden Termin.</span></div></div></div><div class="modal-actions"><button type="button" class="secondary-btn" id="cancel-modal">Abbrechen</button><button type="submit" class="primary-btn">${icon("check")} ${e && !copy ? "Änderungen speichern" : "Termin anlegen"}</button></div></form></div></div>`;
          document
            .getElementById("close-modal")
            .addEventListener("click", closeModal);
          document
            .getElementById("cancel-modal")
            .addEventListener("click", closeModal);
          document
            .getElementById("modal-backdrop")
            .addEventListener("click", (e2) => {
              if (e2.target.id === "modal-backdrop") closeModal();
            });
          document
            .querySelectorAll("#event-form input, #event-form select")
            .forEach((el) => el.addEventListener("input", checkFormConflict));
          document
            .getElementById("event-form")
            .addEventListener("submit", saveForm);
          checkFormConflict();
        }
        function closeModal() {
          state.modal = null;
          document.getElementById("modal-host").innerHTML = "";
        }
        function formData() {
          const f = new FormData(document.getElementById("event-form"));
          return Object.fromEntries(f.entries());
        }
        function resourceMatches(resource, eventResource) {
          return (
            resource === "Beide Ressourcen" ||
            eventResource === "Beide Ressourcen" ||
            resource === eventResource
          );
        }
        function overlaps(aStart, aEnd, bStart, bEnd) {
          return aStart <= bEnd && bStart <= aEnd;
        }
        function findConflict(data) {
          if (!data.resource || data.resource === "Keine feste Ressource")
            return null;
          const current = state.editingId;
          return state.events.find(
            (e) =>
              e.id !== current &&
              resourceMatches(data.resource, e.resource) &&
              overlaps(
                data.start || "",
                data.end || data.start || "",
                e.start,
                e.end,
              ),
          );
        }
        function checkFormConflict() {
          const alert = document.getElementById("conflict-alert");
          if (!alert) return;
          const data = formData(),
            conflict = findConflict(data);
          alert.classList.toggle("hidden", !conflict);
          if (conflict)
            document.getElementById("conflict-text").textContent =
              `${conflict.title} belegt ${conflict.resource} am ${formatDate(conflict.start)} (${conflict.startTime}–${conflict.endTime} Uhr). Bitte Zeitraum oder Ressource anpassen.`;
        }
        function addMonths(date, amount) {
          const d = new Date(date);
          d.setMonth(d.getMonth() + amount);
          return d;
        }
        function addYears(date, amount) {
          const d = new Date(date);
          d.setFullYear(d.getFullYear() + amount);
          return d;
        }
        function saveForm(ev) {
          ev.preventDefault();
          const data = formData();
          if (data.end < data.start) {
            showToast("Das Enddatum darf nicht vor dem Startdatum liegen.");
            return;
          }
          if (data.endTime <= data.startTime && data.start === data.end) {
            showToast("Die Endzeit muss nach der Beginnzeit liegen.");
            return;
          }
          const conflict = findConflict(data);
          if (conflict) {
            checkFormConflict();
            showToast(
              "Doppelbuchung verhindert: Bitte Ressource oder Zeitpunkt ändern.",
            );
            return;
          }
          const editing = state.editingId
            ? state.events.find((e) => e.id === state.editingId)
            : null;
          const base = {
            id: editing ? editing.id : "user-" + Date.now(),
            title: data.title,
            publicTitle: data.publicDescription || data.title,
            type: data.type,
            status: data.status,
            start: data.start,
            end: data.end || data.start,
            startTime: data.startTime,
            endTime: data.endTime,
            institution: data.institution,
            institutionType: data.institutionType,
            state: data.state,
            postal: data.postal,
            city: data.city,
            street: data.street,
            house: data.house,
            district: "",
            building: data.building,
            topic: data.topic,
            participants: Number(data.participants || 0),
            audience: data.audience,
            description: data.description || "",
            publicDescription: data.publicDescription || data.title,
            contact: {
              first: data.contactFirst || "",
              last: data.contactLast || "",
              role: data.contactRole || "",
              company: data.contactCompany || data.institution,
              phone: data.phone || "",
              mobile: data.mobile || "",
              email: data.email || "",
            },
            resource: data.resource,
            visibility: data.visibility,
            internalNotes: data.internalNotes || "",
            creator: "Diether E.",
            changed: "gerade eben",
          };
          if (editing) {
            Object.assign(editing, base);
          } else {
            state.events.push(base);
            if (data.repeat !== "none" && data.repeatUntil) {
              let cursor = parseDate(data.start),
                until = parseDate(data.repeatUntil),
                count = 0;
              while (count < 52) {
                cursor =
                  data.repeat === "weekly"
                    ? addDays(cursor, 7)
                    : data.repeat === "monthly"
                      ? addMonths(cursor, 1)
                      : addYears(cursor, 1);
                if (cursor > until) break;
                const copy = {
                  ...base,
                  id: "user-" + Date.now() + "-" + count,
                  start: keyDate(cursor),
                  end: keyDate(cursor),
                  title: base.title + " · Serie",
                  publicTitle: base.publicTitle,
                };
                const c = findConflict({
                  ...data,
                  start: copy.start,
                  end: copy.end,
                });
                if (!c) state.events.push(copy);
                count++;
              }
            }
          }
          closeModal();
          renderAll();
          state.selectedId = base.id;
          renderDrawer();
          showToast(editing ? "Änderungen gespeichert." : "Termin angelegt.");
        }

        function exportICS(event) {
          const dt = (date, time) =>
            date.replaceAll("-", "") + "T" + time.replace(":", "") + "00";
          const ics = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Essen-Wissen//Kalender//DE",
            "CALSCALE:GREGORIAN",
            "BEGIN:VEVENT",
            "UID:" + event.id + "@essen-wissen.demo",
            "DTSTAMP:20260831T090000Z",
            "DTSTART;TZID=Europe/Berlin:" + dt(event.start, event.startTime),
            "DTEND;TZID=Europe/Berlin:" + dt(event.end, event.endTime),
            "SUMMARY:" + icsEscape(publicTitle(event)),
            "LOCATION:" +
              icsEscape(
                `${event.street} ${event.house}, ${event.postal} ${event.city}`,
              ),
            "DESCRIPTION:" +
              icsEscape(event.publicDescription || event.description),
            "END:VEVENT",
            "END:VCALENDAR",
          ].join("\r\n");
          downloadFile(
            "essen-wissen-termin.ics",
            ics,
            "text/calendar;charset=utf-8",
          );
          showToast("ICS-Datei wurde erstellt.");
        }
        function icsEscape(v) {
          return String(v || "")
            .replace(/\\/g, "\\\\")
            .replace(/;/g, "\\;")
            .replace(/,/g, "\\,")
            .replace(/\n/g, "\\n");
        }
        function downloadFile(name, content, type) {
          const blob = new Blob([content], { type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 500);
        }
        function showToast(message) {
          state.toast = message;
          const host = document.getElementById("toast-host");
          if (!host) return;
          host.innerHTML = `<div class="toast">${icon("check")} ${esc(message)}</div>`;
          setTimeout(() => {
            if (state.toast === message) {
              state.toast = "";
              host.innerHTML = "";
            }
          }, 3000);
        }

        renderShell();
      })();




