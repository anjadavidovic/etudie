'use strict';
const $ = s => document.querySelector(s), app = $('#app'), modal = $('#modal');
const KEY = 'etudie-v1', uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const day = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, today = () => day(new Date()), date = s => new Date(s + 'T12:00:00'), add = (s, n) => {
    let d = date(s);
    d.setDate(d.getDate() + n);
    return day(d);
}, diff = (a, b) => Math.round((Date.UTC(...b.split('-').map((x, i) => +x - (i === 1 ? 1 : 0))) - Date.UTC(...a.split('-').map((x, i) => +x - (i === 1 ? 1 : 0)))) / 86400000), fmt = s => date(s).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' }), week = s => add(s, -((date(s).getDay() + 6) % 7)), dur = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + m % 60 + ' min' : ''}` : `${m} min`;
let db;
try {
    db = JSON.parse(localStorage.getItem(KEY)) || { profiles: [], active: null };
}
catch {
    db = { profiles: [], active: null };
}
;
let page = 'home', draft = null, toastId, timer = { mode: 'focus', left: 1500, end: null, cycles: 0 }, cal = today();
const profile = () => db.profiles.find(x => x.id === db.active), save = () => {
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
    }
    catch {
        notify('Podaci nisu sačuvani: lokalno skladište nije dostupno.');
    }
}, notify = m => {
    let t = $('#toast');
    t.textContent = m;
    t.style.display = 'block';
    clearTimeout(toastId);
    toastId = setTimeout(() => t.style.display = 'none', 3800);
}, all = () => profile()?.subjects.flatMap(s => [...s.tasks, ...(s.unscheduled || [])].map(t => ({ ...t, subject: s.name, sid: s.id, unscheduled: !s.tasks.includes(t) }))) || [], pct = ts => ts.length ? Math.round(ts.filter(t => t.done).length / ts.length * 100) : 0;
const icons = { home: 'M3 10 12 3l9 7v10h-6v-6H9v6H3z', plan: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16', focus: 'M12 7v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18', stats: 'M4 20V10 M10 20V4 M16 20v-8 M22 20H2', profiles: 'M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M2 21v-3a7 7 0 0 1 14 0v3 M17 4a4 4 0 0 1 0 7 M19 15a5 5 0 0 1 3 6', notes: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5', moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11' };
Object.assign(icons, { flash: 'M4 4h13v15H4z M17 7h3v14H7', garden: 'M12 22V10 M12 15Q2 15 3 5Q12 5 12 15 M12 10Q12 2 21 3Q21 12 12 10', settings: 'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M6 6l2 2 M16 16l2 2 M6 18l2-2 M16 8l2-2 M12 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10', help: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M9 9a3 3 0 1 1 4 3l-1 2 M12 17h.01' });
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[k]}"/></svg>`, brand = () => `<button type="button" class="brand" data-act="book" aria-label="étudie — okreni stranicu" title="Okreni stranicu"><svg viewBox="0 0 76 60" aria-hidden="true">
<path d="M5 16L5 48Q23 43 38 54Q53 43 71 48V16" fill="#52634f" stroke="#52634f" stroke-width="3" stroke-linejoin="round"/>
<path d="M9 13Q25 8 38 23V50Q24 37 9 43Z" fill="#fff9f6" stroke="#a0a68e"/>
<path d="M67 13Q51 8 38 23V50Q52 37 67 43Z" fill="#fff9f6" stroke="#a0a68e"/>
<path d="M12 9Q26 5 37 21V46Q24 34 12 39Z" fill="#d38e9c"/>
<path d="M64 9Q50 5 39 21V46Q52 34 64 39Z" fill="#89977d"/>
<g stroke="#fff9f6" stroke-width="1.5" opacity=".8" fill="none"><path d="M17 17Q26 16 32 23M17 23Q26 22 32 29M44 23Q52 16 59 17M44 29Q52 22 59 23"/></g>
<path class="book-page" d="M63 10Q49 6 39 21V46Q51 34 63 39Z" fill="#f3c0c8" stroke="#d38e9c" stroke-width=".7"/>
<path class="book-star" d="M63 0l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#a0a68e"/>
</svg><span>étudie.</span></button>`;
const navs = [['home', 'Početna'], ['plan', 'Plan učenja'], ['focus', 'Fokus'], ['stats', 'Statistika'], ['notes', 'Beleške'], ['flash', 'Flash kartice'], ['garden', 'Bašta znanja']], avatars = ['🌷', '🌿', '🦋', '🌙', '🌸', '🍓', '🐈', '☕'], quotes = ['Mali koraci danas vode do velikih rezultata sutra.', 'Napredak je važniji od savršenstva.', 'Svaka stranica je korak bliže cilju.', 'Uči svojim tempom. I mali trud se računa.', 'Odmor je deo produktivnosti.'];
// Kratko uputstvo, dostupno i nakon prvog ulaska na profil.
const tutorialSteps = [
    ['Dobro došli u étudie!', '🌷', 'Tvoj profil čuva predmete, beleške i napredak na ovom uređaju. Preko avatara možeš promeniti profil.'],
    ['Napravi plan učenja', '📚', 'Na početnoj izaberi + Predmet. Unesi datum ispita, sate, težinu, znanje, dane učenja i konkretne aktivnosti. Pregledaj i prihvati predlog plana.'],
    ['Uči dan po dan', '✓', 'U sekciji Planirano za danas označi završene aktivnosti. Propuštene aktivnosti aplikacija pokušava da prerasporedi do ispita.'],
    ['Vreme za fokus', '⏱', 'Otvori Fokus, klikni na minute da podesiš trajanje i pokreni Pomodoro. Završene fokus sesije ulaze u statistiku.'],
    ['Prati svoj napredak', '✦', 'U Statistici prati rezultate, a u Beleškama zapisuj ideje. Mesec pored avatara menja temu. Uputstvo možeš ponovo otvoriti iz bočne navigacije.']
];
let tutorialIndex = 0;
function showTutorial(index = 0) {
    tutorialIndex = Math.max(0, Math.min(index, tutorialSteps.length - 1));
    const [title, symbol, description] = tutorialSteps[tutorialIndex];
    const last = tutorialIndex === tutorialSteps.length - 1;
    // Kartica se kreira samo jednom; naredni koraci menjaju sadržaj postojećih elemenata.
    if (!modal.open || !modal.querySelector('.tutorial')) {
        showModal(`<section class="tutorial tutorial-stable"><div class="tutorial-top"><small id="tutorialCount"></small><button class="ghost" data-act="tutorialfinish" aria-label="Zatvori uputstvo">×</button></div><div class="tutorial-symbol" id="tutorialSymbol" aria-hidden="true">🌷</div><div class="tutorial-copy" aria-live="polite"><h2 id="tutorialTitle"></h2><p class="muted" id="tutorialDescription"></p></div><div class="tutorial-dots" aria-hidden="true">${tutorialSteps.map(() => '<i></i>').join('')}</div><div class="actions"><button class="ghost" data-act="tutorialfinish">Preskoči</button><button class="ghost" id="tutorialBack" data-act="tutorialprev">Nazad</button><button id="tutorialForward" data-act="tutorialnext">Dalje →</button></div></section>`);
        modal.classList.add('tutorial-dialog');
    }
    $('#tutorialCount').textContent = `UPOZNAJ ÉTUDIE · ${tutorialIndex + 1}/${tutorialSteps.length}`;
    $('#tutorialTitle').textContent = title;
    $('#tutorialDescription').textContent = description;
    // Simbol i raspored ostaju isti kroz sve korake.
    modal.querySelectorAll('.tutorial-dots i').forEach((dot, i) => dot.classList.toggle('current', i === tutorialIndex));
    $('#tutorialBack').disabled = tutorialIndex === 0;
    const next = $('#tutorialForward');
    next.textContent = last ? 'Započni učenje' : 'Dalje →';
    next.dataset.act = last ? 'tutorialfinish' : 'tutorialnext';
    if (profile()) {
        profile().tutorialSeen = true;
        save();
    }
}
function maybeTutorial() {
    if (profile() && !profile().tutorialSeen) showTutorial();
}
function animateBook(button) {
    button.classList.remove('turning');
    void button.offsetWidth;
    button.classList.add('turning');
}
function switchPage(p) {
    if (p === 'profiles') { stopAmbient(); flashIndex = 0; flashFlipped = false; selectedDate = today(); }
    page = p;
    if (p === 'profiles') {
        stopTimer();
        db.active = null;
        save();
    }
    render();
}
// Mobilni meni ostaje isti element pri promeni stranice, da bi klizanje bilo vidljivo.
function mobileNavigation() {
    const items = [...navs, ['settings', 'Podešavanja'], ['help', 'Uputstvo']];
    const nav = document.createElement('nav');
    nav.className = 'mobile-carousel';
    nav.setAttribute('aria-label', 'Mobilna navigacija');
    nav.innerHTML = items.map(([key, label]) => `
        <button type="button" data-act="${key === 'help' ? 'tutorial' : 'nav'}"
            data-id="${key}" title="${label}">${icon(key)}<span>${label}</span></button>
    `).join('');
    return nav;
}
function centerMobileNavigation(nav, animate = false) {
    if (!nav || !nav.clientWidth) return;
    const active = nav.querySelector('.active');
    if (!active) return;
    const left = active.offsetLeft + active.offsetWidth / 2 - nav.clientWidth / 2;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left, behavior: animate && !reduced && !document.body.classList.contains('no-motion') ? 'smooth' : 'instant' });
}
function updateMobileNavigation(previous) {
    const nav = previous || mobileNavigation();
    const oldPage = nav.dataset.page;
    const selected = page === 'profiles' ? 'home' : page;
    nav.querySelectorAll('button').forEach(button => {
        const active = button.dataset.id === selected;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });
    nav.dataset.page = selected;
    const holder = document.createElement('div');
    holder.className = 'mobile-nav-holder';
    holder.append(nav);
    app.querySelector('.shell').append(holder);
    // Sačuvaj prethodni položaj tokom ponovnog iscrtavanja sadržaja.
    if (previous) nav.scrollLeft = Number(nav.dataset.scroll || 0);
    centerMobileNavigation(nav, !!previous && oldPage !== selected);
}
window.addEventListener('resize', () => centerMobileNavigation(app.querySelector('.mobile-carousel')));

function render() {
    const previousNav = app.querySelector('.mobile-carousel');
    if (previousNav) previousNav.dataset.scroll = previousNav.scrollLeft;
    let p = profile();
    document.body.classList.toggle('dark', !!p?.dark);
    document.body.classList.toggle('no-motion', p?.preferences?.animations === false);
    if (!p) {
        app.innerHTML = `<section class="profiles"><div class="profilewrap">${brand()}<div class="tagline">Znanje cveta.</div><h1>Ko danas uči?</h1><p class="muted">Izaberi svoj lokalni profil i nastavi tamo gde si stao/la.</p><div class="profilegrid">${db.profiles.map(x => `<button class="profilecard" data-act="login" data-id="${x.id}"><span class="avatar" data-avatar="${esc(x.avatar)}"><span class="avatar-art">${esc(x.avatar)}</span></span><strong>${esc(x.name)}</strong><small>${x.subjects.length} predmeta</small></button>`).join('')}</div><button data-act="newprofile">＋ Kreiraj profil</button><p class="muted subtle" style="margin-top:20px">Podaci se čuvaju samo u ovom pregledaču.</p></div></section>`;
        return;
    }
    let titles = { home: ['Zdravo, ' + p.name + '!', 'Danas je odličan dan za mali korak napred.'], plan: ['Moj plan učenja', 'Organizuj ispite i prilagodi učenje svom tempu.'], focus: ['Vreme za fokus', 'Jedna sesija, jedan mali korak.'], notes: ['Lične beleške', 'Tvoje ideje, podsetnici i važne stvari na jednom mestu.'], stats: ['Tvoj napredak', 'Pogledaj koliko si do sada postigao/la.'], flash: ['Flash kartice', 'Pretvori materijal u pitanja za ponavljanje.'], garden: ['Bašta znanja', 'Neguj svoje znanje, korak po korak.'], settings: ['Podešavanja', 'Prilagodi svoj prostor za učenje.'] };
    let [title, sub] = titles[page] || titles.home;
    app.innerHTML = `<div class="shell"><aside class="sidebar"><div>${brand()}<div class="tagline">Znanje cveta.</div></div><nav class="nav" aria-label="Glavna navigacija">${navs.map(([k, l]) => `<button data-act="nav" data-id="${k}" class="${page === k ? 'active' : ''}" title="${l}">${icon(k)}<span>${l}</span></button>`).join('')}</nav><nav class="nav bottom"><button data-act="nav" data-id="settings" class="${page === 'settings' ? 'active' : ''}">${icon('settings')}<span>Podešavanja</span></button><button data-act="tutorial">${icon('help')}<span>Uputstvo</span></button></nav></aside><main class="main"><header class="top"><div><h1>${esc(title)}</h1><p class="muted">${esc(sub)}</p></div><div class="row header-tools"><button class="ghost header-icon theme-toggle" data-act="theme" aria-label="${p.dark ? 'Uključi svetlu temu' : 'Uključi tamnu temu'}" title="Promeni temu" aria-pressed="${!!p.dark}">${icon('moon')}</button><div class="profile-menu-wrap"><button type="button" class="avatar" data-avatar="${esc(p.avatar)}" data-act="profilemenu" aria-label="Meni profila" aria-expanded="false" aria-controls="profileMenu"><span class="avatar-art">${esc(p.avatar)}</span></button><div id="profileMenu" class="profile-menu" hidden><div class="profile-menu-heading"><strong>${esc(p.name)}</strong><small>Lokalni profil</small></div><button data-act="nav" data-id="profiles">${icon('profiles')} Promeni profil</button><button data-act="nav" data-id="settings">${icon('settings')} Podešavanja</button><button class="profile-logout" data-act="logout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4H4v16h6 M10 12h11 M17 8l4 4-4 4"/></svg> Odjavi se</button></div></div></div></header>${({ home: home, plan: plans, focus: focus, stats: stats, notes: notes, flash: flashPage, garden: gardenPage, settings: settingsPage }[page] || home)()}</main></div>`;
    updateMobileNavigation(previousNav);
    if (page === 'focus')
        paintTimer();
}
// Lične beleške se čuvaju zasebno za svaki lokalni profil.
function taskRow(t) {
    return `<label class="task task-clickable ${t.done ? 'done' : ''}"><input type="checkbox" aria-label="Označi ${esc(t.label)} kao završeno" data-task="${t.id}" data-sid="${t.sid}" ${t.done ? 'checked' : ''}><div class="grow"><strong class="taskname">${esc(t.label)}</strong><div class="muted subtle">${esc(t.subject)} · ${dur(t.minutes)}</div></div>${t.done ? '<span class="pill">Završeno</span>' : ''}</label>`;
}
function streak() {
    let set = new Set(all().filter(t => t.done && t.completed).map(t => t.completed));
    let d = set.has(today()) ? today() : add(today(), -1), n = 0;
    while (set.has(d)) {
        n++;
        d = add(d, -1);
    }
    return n;
}
function quote() {
    if (profile()?.preferences?.motivation === false) return '';
    return `<div class="card quote"><small>✦ Podsetnik za danas</small><p>„${quotes[Math.abs(diff('2020-01-01', today())) % quotes.length]}“</p></div>`;
}
function home() {
    let ts = all().filter(t => t.date === today() && !t.unscheduled), next = profile().subjects.filter(s => s.exam >= today()).sort((a, b) => a.exam.localeCompare(b.exam))[0];
    return `<div class="grid"><div class="stack"><div class="card hero"><div><p>🔥 Kontinuitet učenja</p><strong>${streak()} dana</strong><p class="muted">Svaki dan se računa.</p></div><div class="spark">✧</div></div><section class="card"><div class="row between"><h2>Planirano za danas</h2><button data-act="newsubject">＋ Predmet</button></div><p class="muted">${ts.filter(t => t.done).length}/${ts.length} završeno · ${dur(ts.reduce((a, t) => a + t.minutes, 0))}</p><div class="progress"><i style="width:${pct(ts)}%"></i></div>${ts.length ? ts.map(taskRow).join('') : '<div class="empty">Danas nema planiranih aktivnosti. Dodaj predmet ili uživaj u predahu. 🌿</div>'}</section><section class="card"><div class="row between"><h2>Moji predmeti</h2><button class="ghost" data-act="nav" data-id="plan">Svi predmeti →</button></div>${profile().subjects.length ? profile().subjects.map(s => `<div class="task subject-clickable" data-act="viewplan" data-id="${s.id}" role="button" tabindex="0"><div class="grow"><strong>${esc(s.name)}</strong><div class="muted subtle">Ispit: ${fmt(s.exam)}</div><div class="progress"><i style="width:${pct([...s.tasks, ...(s.unscheduled || [])])}%"></i></div></div><span>${pct([...s.tasks, ...(s.unscheduled || [])])}%</span></div>`).join('') : '<div class="empty">Još nema predmeta.</div>'}</section></div><div class="stack">${quote()}<div class="card"><h3>🎓 Sledeći ispit</h3>${next ? `<h2 style="margin:10px 0">${esc(next.name)}</h2><span class="pill">${diff(today(), next.exam) === 0 ? 'Danas' : diff(today(), next.exam) + ' dana do ispita'}</span><p class="muted" style="margin-top:8px">${fmt(next.exam)}</p>` : '<p class="muted">Nema zakazanih ispita.</p>'}</div>${calendar()}<div class="card"><h3>Vreme za fokus</h3><p class="muted" style="margin:8px 0">${modes.focus} minuta učenja, pa zaslužena pauza.</p><button data-act="nav" data-id="focus">Pokreni Pomodoro →</button></div></div></div>`;
}
function plans() {
    let ss = profile().subjects;
    return `<div class="row between" style="margin-bottom:18px"><p class="muted">${ss.length} aktivnih predmeta</p><button data-act="newsubject">＋ Dodaj predmet</button></div>${ss.length ? `<div class="subjectlist">${ss.map(s => `<section class="card subject subject-clickable" data-act="viewplan" data-id="${s.id}"><div class="row between"><h2>${esc(s.name)}</h2><span class="pill">${s.exam < today() ? 'Ispit prošao' : diff(today(), s.exam) + ' dana'}</span></div><p class="muted">${fmt(s.exam)} · ${s.hours} h nedeljno</p><p class="subtle">${typeNames[s.type]} · Težina ${s.difficulty}/5 · Znanje ${s.knowledge}/5</p><div class="progress"><i style="width:${pct([...s.tasks, ...(s.unscheduled || [])])}%"></i></div><small>${pct([...s.tasks, ...(s.unscheduled || [])])}% završeno</small>${s.unscheduled?.length ? `<div class="notice">${s.unscheduled.length} sesija nije moguće smestiti pre ispita u raspoloživo vreme.</div>` : ''}<div class="row"><button data-act="viewplan" data-id="${s.id}">Otvori plan</button><button class="ghost" data-act="edit" data-id="${s.id}">Izmeni</button><button class="danger" data-act="delete" data-id="${s.id}" aria-label="Obriši predmet">×</button></div></section>`).join('')}</div>` : '<div class="card empty">Dodaj prvi predmet i generiši personalizovani plan učenja.</div>'}`;
}
const typeNames = { theory: 'Teorijski', practice: 'Praktični', mixed: 'Kombinovani' }, dayNames = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
// Planiranje: raspoloživi termini i personalizovane sesije.
function slots(s, from, existing = []) {
    let out = [], used = {};
    for (let t of existing) {
        let w = week(t.date);
        used[w] = (used[w] || 0) + t.minutes;
    }
    let daily = Math.ceil(s.hours * 60 / s.days.length), cap = Math.round(s.hours * 60);
    for (let d = from; d < s.exam; d = add(d, 1)) {
        if (!s.days.includes(date(d).getDay()))
            continue;
        let w = week(d), already = existing.filter(t => t.date === d).reduce((a, t) => a + t.minutes, 0), remaining = Math.min(daily - already, cap - (used[w] || 0));
        while (remaining > 0) {
            let m = Math.min(s.session, remaining);
            out.push({ date: d, minutes: m });
            remaining -= m;
            used[w] = (used[w] || 0) + m;
        }
    }
    return out;
}
function generate(s, existing = []) {
    let sl = slots(s, today(), existing), labels = s.type === 'theory' ? ['Čitanje i razumevanje gradiva', 'Aktivno prisećanje i beleške', 'Ponavljanje teorije', 'Provera znanja'] : s.type === 'practice' ? ['Pregled postupaka i primera', 'Vežbanje zadataka', 'Samostalno rešavanje zadataka', 'Probni ispit'] : ['Učenje teorije i beleške', 'Vežbanje praktičnih zadataka', 'Ponavljanje i povezivanje gradiva', 'Provera znanja'];
    let start = Math.max(.12, Math.min(.6, .30 + (s.difficulty - s.knowledge) * .065));
    return sl.map((t, i) => {
        let f = i / Math.max(1, sl.length - 1), k = sl.length === 1 ? 2 : f < start ? 0 : f < .72 ? 1 : f < .90 ? 2 : 3;
        return { ...t, id: uid(), label: labels[k], done: false };
    });
}
// Reorganizacija: prvo rezerviši buduće konkretne aktivnosti.
function reorganize() {
    if (profile()?.preferences?.reorganize === false) return false;
    let changed = 0, p = profile();
    if (!p)
        return 0;
    for (let s of p.subjects) {
        let late = s.tasks.filter(t => !t.done && t.date < today());
        if (!late.length)
            continue;
        let backlog = [...(s.unscheduled || []), ...late], done = s.tasks.filter(t => t.done), pending = s.tasks.filter(t => !t.done && t.date >= today());
        let work = [...backlog, ...pending], scheduled = [], unscheduled = [], usedWeek = {}, usedDay = {};
        for (let t of done) {
            let w = week(t.date);
            usedWeek[w] = (usedWeek[w] || 0) + t.minutes;
            usedDay[t.date] = (usedDay[t.date] || 0) + t.minutes;
        }
        let days = [];
        for (let d = today(); d < s.exam; d = add(d, 1))
            if (s.days.includes(date(d).getDay()))
                days.push(d);
        let cap = Math.round(s.hours * 60), daily = Math.min(720, Math.max(s.session, Math.ceil(cap / s.days.length) * 2));
        work.sort((a, b) => Number(!!b.custom && b.date >= today()) - Number(!!a.custom && a.date >= today()));
        for (let t of work) {
            let d = (t.custom && t.date >= today() && days.includes(t.date) && (usedWeek[week(t.date)] || 0) + t.minutes <= cap && (usedDay[t.date] || 0) + t.minutes <= Math.max(daily, t.minutes)) ? t.date : days.find(d => (usedWeek[week(d)] || 0) + t.minutes <= cap && (usedDay[d] || 0) + t.minutes <= (t.custom ? Math.max(daily, t.minutes) : daily));
            if (d) {
                scheduled.push({ ...t, date: d });
                usedWeek[week(d)] = (usedWeek[week(d)] || 0) + t.minutes;
                usedDay[d] = (usedDay[d] || 0) + t.minutes;
            }
            else
                unscheduled.push(t);
        }
        s.tasks = [...done, ...scheduled].sort((a, b) => a.date.localeCompare(b.date));
        s.unscheduled = unscheduled;
        s.customActivities = (s.customActivities || []).map(a => {
            const t = scheduled.find(t => t.id === a.id);
            return t ? { ...a, date: t.date } : a;
        });
        changed += late.length;
    }
    if (changed)
        save();
    return changed;
}
function showModal(html) {
    modal.classList.remove("tutorial-dialog", "flash-fullscreen");
    modal.innerHTML = html;
    if (!modal.open)
        modal.showModal();
}
function closeModal() {
    const wasReview = modal.classList.contains("flash-fullscreen");
    modal.classList.remove("tutorial-dialog", "flash-fullscreen");
    modal.close();
    draft = null;
    if (wasReview) render();
}
// Unos konkretnih aktivnosti koje imaju prednost nad opštim sesijama.
function activityRow(a = {}) {
    return `<div class="activityrow"><input name="activityName" aria-label="Naziv aktivnosti" placeholder="Npr. Uraditi zadatke" maxlength="120" value="${esc(a.label || '')}" required><input name="activityDate" aria-label="Datum aktivnosti" type="date" value="${esc(a.date || today())}" required><input name="activityMinutes" aria-label="Trajanje aktivnosti u minutima" type="number" min="5" max="720" value="${a.minutes || 45}" required><input name="activityId" type="hidden" value="${esc(a.id || uid())}"><button type="button" class="danger" data-act="removeactivity" aria-label="Ukloni aktivnost">×</button></div>`;
}
function subjectForm(s) {
    draft = null;
    let v = s || { name: '', exam: add(today(), 14), hours: 8, difficulty: 3, knowledge: 2, type: 'mixed', days: [1, 2, 3, 4, 5], session: 45 };
    showModal(`<div class="row between"><h2>${s ? 'Izmeni predmet' : 'Novi predmet'}</h2><button class="ghost" data-act="close">×</button></div><p class="muted" style="margin-bottom:20px">Plan ćemo prilagoditi tvojim odgovorima.</p><form id="subjectForm" data-id="${s?.id || ''}"><div class="formgrid"><div class="field"><label for="name">Naziv predmeta</label><input id="name" name="name" required maxlength="100" value="${esc(v.name)}" placeholder="npr. Poslovne finansije"></div><div class="field"><label for="exam">Datum ispita</label><input id="exam" name="exam" type="date" required min="${add(today(), 1)}" max="${add(today(), 365)}" value="${v.exam}"></div><div class="field"><label for="hours">Sati nedeljno za ovaj predmet</label><input id="hours" name="hours" type="number" min="0.5" max="84" step="0.5" required value="${v.hours}"></div><div class="field"><label for="session">Trajanje sesije (min)</label><input id="session" name="session" type="number" min="15" max="180" step="5" required value="${v.session}"></div><div class="field"><label for="difficulty">Težina predmeta: <output id="difficultyOut">${v.difficulty}</output>/5</label><input name="difficulty" id="difficulty" type="range" min="1" max="5" value="${v.difficulty}"><small>1 – lak · 5 – veoma težak</small></div><div class="field"><label for="knowledge">Trenutno znanje: <output id="knowledgeOut">${v.knowledge}</output>/5</label><input name="knowledge" id="knowledge" type="range" min="1" max="5" value="${v.knowledge}"><small>1 – početnik · 5 – odlično</small></div><div class="field full"><label for="type">Tip predmeta</label><select name="type" id="type">${Object.entries(typeNames).map(([k, l]) => `<option value="${k}" ${v.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="field full"><label>Dani kada želiš da učiš</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label><input type="checkbox" name="days" value="${d}" ${v.days.includes(d) ? 'checked' : ''}><span>${dayNames[d]}</span></label>`).join('')}</div></div></div><div class="customactivities"><h3>Konkretne aktivnosti</h3><p class="muted subtle">Dodaj naziv, datum i trajanje (min). Aktivnosti ulaze u raspoloživo vreme za predmet.</p><div id="activityRows">${(v.customActivities || []).map(activityRow).join('')}</div><button type="button" class="ghost" data-act="addactivity">＋ Dodaj aktivnost</button></div><p class="error" id="formError" role="alert"></p><div class="actions"><button type="button" class="ghost" data-act="close">Otkaži</button><button type="submit">Generiši predlog plana</button></div></form>`);
}
function grouped(s) {
    let groups = {};
    for (let t of s.tasks) {
        (groups[t.date] ??= []).push({ ...t, subject: s.name, sid: s.id });
    }
    return Object.entries(groups).map(([d, ts]) => `<div class="daygroup"><h3>${fmt(d)} ${d === today() ? '· danas' : ''}</h3>${ts.map(taskRow).join('')}</div>`).join('');
}
function preview(s) {
    draft = s;
    showModal(`<h2>Predlog plana: ${esc(s.name)}</h2><p class="muted">${s.tasks.length} sesija · ${dur(s.tasks.reduce((a, t) => a + t.minutes, 0))} · do ${fmt(s.exam)}</p><div class="notice">Plan je prilagođen težini, znanju, tipu predmeta i odabranim danima. Tvoje konkretne aktivnosti imaju prednost, a preostalo vreme popunjavaju predložene sesije.</div><div class="scroll">${grouped(s).replace(/type="checkbox"/g, 'type="checkbox" disabled')}</div><div class="actions"><button class="ghost" data-act="backdraft">Nazad</button><button data-act="accept">Prihvati plan</button></div>`);
}
function stats() {
    let ts = all(), p = profile(), done = ts.filter(t => t.done), min = p.logs.reduce((a, l) => a + l.minutes, 0), planned = done.reduce((a, t) => a + t.minutes, 0), days = Array.from({ length: 7 }, (_, i) => add(today(), i - 6)), vals = days.map(d => p.logs.filter(l => l.date === d).reduce((a, l) => a + l.minutes, 0)), max = Math.max(60, ...vals);
    return `<div class="metrics">${[['Napredak', pct(ts) + '%', '✓'], ['Fokus vreme', dur(min), '◷'], ['Završene aktivnosti', done.length + '/' + ts.length, '☑'], ['Kontinuitet', streak() + ' dana', '🔥']].map(([l, v, i]) => `<div class="card metric"><span class="badgeicon">${i}</span><strong>${v}</strong><small>${l}</small></div>`).join('')}</div><div class="grid"><div class="card"><h2>Fokus tokom poslednjih 7 dana</h2><p class="muted">Vreme iz završenih Pomodoro sesija</p><div class="chart">${vals.map((v, i) => `<div class="barcol"><span>${v}m</span><div class="bar" style="height:${v / max * 75}%"></div><span>${dayNames[date(days[i]).getDay()]}</span></div>`).join('')}</div></div><div class="card"><h2>Napredak po predmetima</h2>${p.subjects.map(s => `<div style="margin-top:14px"><div class="row between"><strong>${esc(s.name)}</strong><small>${pct([...s.tasks, ...(s.unscheduled || [])])}%</small></div><div class="progress"><i style="width:${pct([...s.tasks, ...(s.unscheduled || [])])}%"></i></div></div>`).join('') || '<p class="empty">Nema predmeta.</p>'}</div><div class="card"><h3>Planirano vreme završenih aktivnosti</h3><h2>${dur(planned)}</h2><p class="muted">Procena prema planu, ne stvarno izmereno vreme.</p></div>${quote()}</div>`;
}
// Pomodoro: trajanje po režimu i evidencija fokus sesija.
const modes = { focus: 25, short: 5, long: 15 };
function focus() {
    return `<div class="grid"><div class="card timerwrap"><div class="row between"><h2>Pomodoro</h2></div><div class="row timercontrols" style="margin-top:20px">${Object.entries({ focus: 'Fokus', short: 'Kratka pauza', long: 'Duga pauza' }).map(([k, l]) => `<button class="${timer.mode === k ? 'secondary' : 'ghost'}" data-act="mode" data-id="${k}">${l}</button>`).join('')}</div><div class="timer" id="ring" style="--angle:0deg"><div class="timerinner"><span>✦</span><span id="timerLabel">Fokus</span><button class="clockedit" id="clock" data-act="timeredit" title="Promeni trajanje" aria-label="Promeni trajanje tajmera">25:00</button><small>Klikni na vreme za izmenu</small><small>${timer.cycles} završenih fokus sesija</small></div></div><div class="row timercontrols"><button data-act="timerstart" id="start">▶ Započni</button><button class="ghost" data-act="timerreset">↻ Resetuj</button></div></div><div class="stack"><div class="card"><h2>Kako funkcioniše?</h2><div class="task row between"><span>Fokus</span><strong>${modes.focus} min</strong></div><div class="task row between"><span>Kratka pauza</span><strong>${modes.short} min</strong></div><div class="task row between"><span>Duga pauza</span><strong>${modes.long} min</strong></div><p class="muted subtle">Posle četiri fokus sesije predlažemo dugu pauzu. Završene fokus sesije ulaze u statistiku.</p></div>${ambientPanel()}${quote()}</div></div>`;
}
function paintTimer() {
    if (!$('#clock'))
        return;
    let m = Math.floor(timer.left / 60), s = timer.left % 60;
    $('#clock').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $('#ring').style.setProperty('--angle', `${360 * (1 - timer.left / (modes[timer.mode] * 60))}deg`);
    $('#timerLabel').textContent = { focus: 'Fokus', short: 'Kratka pauza', long: 'Duga pauza' }[timer.mode];
    $('#start').textContent = timer.end ? 'Ⅱ Pauziraj' : '▶ Započni';
    $('#clock').disabled = !!timer.end;
}
function stopTimer() {
    timer = { mode: 'focus', left: 1500, end: null, cycles: 0 };
    Object.assign(modes, { focus: 25, short: 5, long: 15 });
}
function loadTimer() {
    Object.assign(modes, { focus: 25, short: 5, long: 15 }, profile()?.timerSettings || {});
    timer.left = modes.focus * 60;
}
function tick() {
    if (!timer.end)
        return;
    timer.left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
    if (timer.left === 0) {
        timer.end = null;
        if (timer.mode === 'focus' && profile()) {
            profile().logs.push({ date: today(), minutes: modes.focus });
            timer.cycles++;
            save();
            notify('Bravo! Fokus sesija je završena. Vreme za pauzu.');
            timer.mode = timer.cycles % 4 === 0 ? 'long' : 'short';
        }
        else {
            notify('Pauza je završena. Spreman/a za novu sesiju?');
            timer.mode = 'focus';
        }
        timer.left = modes[timer.mode] * 60;
        render();
    }
    paintTimer();
}
setInterval(tick, 250);
app.addEventListener('click', action);
modal.addEventListener('click', action);
// Meni profila: zatvaranje izvan menija ili tasterom Escape.
function toggleProfileMenu(force) {
    const menu = $('#profileMenu');
    const trigger = app.querySelector('[data-act="profilemenu"]');
    if (!menu || !trigger) return;
    const open = typeof force === 'boolean' ? force : menu.hidden;
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', event => {
    if (!event.target.closest('.profile-menu-wrap')) toggleProfileMenu(false);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#profileMenu') && !$('#profileMenu').hidden) {
        toggleProfileMenu(false);
        app.querySelector('[data-act="profilemenu"]')?.focus();
    }
    if (event.target.matches('.subject-clickable[role="button"]') && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        event.target.click();
    }
});
// Obrada klikova i navigacije.
function action(e) {
    let b = e.target.closest('[data-act]');
    if (!b)
        return;
    let a = b.dataset.act, id = b.dataset.id, p = profile(), s = p?.subjects.find(x => x.id === id);
    if (extraAction(a, id, b)) return;
    switch (a) {
        case 'profilemenu':
            toggleProfileMenu();
            break;
        case 'logout':
            switchPage('profiles');
            break;
        case 'book':
            animateBook(b);
            break;
        case 'tutorial':
            showTutorial();
            break;
        case 'tutorialnext':
            showTutorial(tutorialIndex + 1);
            break;
        case 'tutorialprev':
            showTutorial(tutorialIndex - 1);
            break;
        case 'tutorialfinish':
            closeModal();
            break;
        case 'login':
            db.active = id;
            loadTimer();
            page = 'home';
            cal = today();
            save();
            if (reorganize())
                notify('Propuštene aktivnosti su reorganizovane.');
            render();
            maybeTutorial();
            break;
        case 'newprofile':
            showModal(`<h2>Kreiraj lokalni profil</h2><form id="profileForm"><div class="field" style="margin-top:15px"><label for="profileName">Tvoje ime</label><input id="profileName" name="name" required maxlength="40" placeholder="Unesi ime"></div><div class="field" style="margin-top:15px"><label for="avatar">Izaberi avatar</label><select id="avatar" name="avatar">${avatars.map(x => `<option>${x}</option>`).join('')}</select></div><div class="actions"><button type="button" class="ghost" data-act="close">Otkaži</button><button>Kreiraj profil</button></div></form>`);
            break;
        case 'nav':
            switchPage(id);
            break;
        case 'theme':
            p.dark = !p.dark;
            save();
            render();
            break;
        case 'addactivity':
            $('#activityRows').insertAdjacentHTML('beforeend', activityRow());
            break;
        case 'removeactivity':
            b.closest('.activityrow').remove();
            break;
        case 'newsubject':
            subjectForm();
            break;
        case 'edit':
            subjectForm(s);
            break;
        case 'close':
            closeModal();
            break;
        case 'backdraft': {
            let d = draft;
            subjectForm(d);
            break;
        }
        case 'accept':
            if (draft) {
                let i = p.subjects.findIndex(x => x.id === draft.id);
                if (i >= 0)
                    p.subjects[i] = draft;
                else
                    p.subjects.push(draft);
                save();
                closeModal();
                page = 'home';
                render();
                notify('Plan je prihvaćen!');
            }
            break;
        case 'viewplan':
            viewPlan(s);
            break;
        case 'delete':
            showModal(`<h2>Obrisati predmet?</h2><p>Plan i aktivnosti za ${esc(s.name)} biće trajno obrisani.</p><div class="actions"><button class="ghost" data-act="close">Otkaži</button><button class="danger" data-act="confirmdelete" data-id="${id}">Obriši</button></div>`);
            break;
        case 'confirmdelete':
            p.subjects = p.subjects.filter(x => x.id !== id);
            save();
            closeModal();
            render();
            break;
        case 'month': {
            if (calendarMode === 'week') { cal = add(cal, Number(id) * 7); selectedDate=cal; render(); break; }
            let d = date(cal);
            d.setDate(1);
            d.setMonth(d.getMonth() + Number(id));
            cal = day(d);
            selectedDate=cal;
            render();
            break;
        }
        case 'timeredit':
            if (!timer.end)
                showModal(`<h2>Trajanje sesije</h2><form id="timerForm"><div class="field"><label for="timerMinutes">Broj minuta (1–180)</label><input id="timerMinutes" name="minutes" type="number" min="1" max="180" required value="${modes[timer.mode]}"></div><div class="actions"><button type="button" class="ghost" data-act="close">Otkaži</button><button>Sačuvaj</button></div></form>`);
            break;
        case 'mode':
            timer.mode = id;
            timer.left = modes[id] * 60;
            timer.end = null;
            render();
            break;
        case 'timerstart':
            if (timer.end) {
                tick();
                timer.end = null;
            }
            else
                timer.end = Date.now() + timer.left * 1000;
            paintTimer();
            break;
        case 'timerreset':
            timer.end = null;
            timer.left = modes[timer.mode] * 60;
            paintTimer();
            break;
        case 'reorg':
            reorganize();
            save();
            closeModal();
            render();
            notify('Plan je proveren i ažuriran.');
            break;
    }
}
function viewPlan(s) {
    showModal(`<div class="row between"><h2>${esc(s.name)}</h2><button class="ghost" data-act="close">×</button></div><p class="muted">Ispit: ${fmt(s.exam)} · ${pct([...s.tasks, ...(s.unscheduled || [])])}% završeno</p>${s.unscheduled?.length ? `<div class="notice">Preostalo ${s.unscheduled.length} sesija bez termina (${dur(s.unscheduled.reduce((a, t) => a + t.minutes, 0))}). Povećaj raspoloživo vreme ili dodaj dane učenja izmenom plana.</div>` : ''}<div class="scroll">${grouped(s) || '<p class="empty">Nema aktivnosti.</p>'}</div><div class="actions"><button class="ghost" data-act="reorg">Reorganizuj plan</button><button data-act="close">Zatvori</button></div>`);
}
modal.addEventListener('submit', e => {
    e.preventDefault();
    let f = e.target, fd = new FormData(f);
    if (f.id === 'timerForm') {
        const m = Number(fd.get('minutes'));
        if (!Number.isInteger(m) || m < 1 || m > 180)
            return;
        modes[timer.mode] = m;
        timer.left = m * 60;
        timer.end = null;
        profile().timerSettings = { ...modes };
        save();
        closeModal();
        render();
        return;
    }
    if (f.id === 'profileForm') {
        let name = fd.get('name').trim();
        if (!name)
            return;
        let p = { id: uid(), name, avatar: fd.get('avatar'), dark: false, subjects: [], logs: [] };
        db.profiles.push(p);
        db.active = p.id;
        loadTimer();
        save();
        closeModal();
        page = 'home';
        render();
        maybeTutorial();
        return;
    }
    if (f.id === 'subjectForm') {
        let old = profile().subjects.find(s => s.id === f.dataset.id), s = { id: old?.id || uid(), name: fd.get('name').trim(), exam: fd.get('exam'), hours: +fd.get('hours'), difficulty: +fd.get('difficulty'), knowledge: +fd.get('knowledge'), type: fd.get('type'), days: fd.getAll('days').map(Number), session: +fd.get('session'), tasks: [], unscheduled: [] };
        let err = $('#formError');
        if (!s.name || !s.days.length || s.exam <= today()) {
            err.textContent = 'Unesi naziv, budući datum ispita i odaberi bar jedan dan.';
            return;
        }
        let done = old?.tasks.filter(t => t.done) || [];
        const names = fd.getAll('activityName'), dates = fd.getAll('activityDate'), minutes = fd.getAll('activityMinutes'), ids = fd.getAll('activityId');
        s.customActivities = names.map((label, i) => ({ id: ids[i], label: label.trim(), date: dates[i], minutes: Number(minutes[i]), custom: true, done: false }));
        const fixed = s.customActivities.filter(a => !done.some(t => t.id === a.id));
        const used = {};
        for (const t of [...done, ...fixed]) {
            const w = week(t.date);
            used[w] = (used[w] || 0) + t.minutes;
        }
        if (fixed.some(a => !a.label || a.date < today() || a.date >= s.exam || !s.days.includes(date(a.date).getDay()) || !Number.isInteger(a.minutes) || a.minutes < 5 || a.minutes > 720) || fixed.some(a => used[week(a.date)] > Math.round(s.hours * 60))) {
            err.textContent = 'Proveri aktivnosti: datum mora biti pre ispita, na odabran dan učenja, a ukupno vreme ne sme preći nedeljni limit.';
            return;
        }
        s.tasks = [...done, ...fixed, ...generate(s, [...done, ...fixed])].sort((a, b) => a.date.localeCompare(b.date));
        if (!s.tasks.some(t => !t.done)) {
            err.textContent = 'Nema raspoloživih dana pre ispita. Promeni datum ili dane učenja.';
            return;
        }
        preview(s);
    }
});
modal.addEventListener('input', e => {
    if (['difficulty', 'knowledge'].includes(e.target.id))
        $('#' + e.target.id + 'Out').value = e.target.value;
});
function change(e) {
    let el = e.target;
    if (!el.dataset.task || draft)
        return;
    let s = profile().subjects.find(x => x.id === el.dataset.sid), t = s?.tasks.find(x => x.id === el.dataset.task);
    if (!t)
        return;
    if (t.date > today()) {
        el.checked = t.done;
        notify('Aktivnost možeš završiti na planirani dan ili kasnije.');
        return;
    }
    t.done = el.checked;
    t.completed = t.done ? today() : null;
    save();
    render();
    if (modal.open)
        viewPlan(s);
    if (t.done)
        notify('Bravo! Još jedan korak do cilja. ✨');
}
app.addEventListener('change', change);
modal.addEventListener('change', change);
modal.addEventListener('close', () => {
    draft = null;
    if (modal.classList.contains('flash-fullscreen')) { modal.classList.remove('flash-fullscreen'); render(); }
});
modal.addEventListener('keydown', e => {
    if (!modal.classList.contains('flash-fullscreen')) return;
    if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); extraAction('flashmove', e.key === 'ArrowLeft' ? '-1' : '1'); }
});
let lastDay = today();
setInterval(() => {
    if (today() !== lastDay) {
        lastDay = today();
        if (profile()) {
            reorganize();
            render();
        }
    }
}, 30000);
window.addEventListener('focus', () => {
    if (profile() && reorganize()) {
        render();
        notify('Plan je reorganizovan.');
    }
});
// V4: kalendar, tabla beleški, kartice, bašta i podešavanja.
let calendarMode = 'month', selectedDate = today();
function calendar() {
    const d = date(cal);
    d.setDate(1);
    const start = calendarMode === 'week' ? week(cal) : week(day(d));
    const count = calendarMode === 'week' ? 7 : Math.ceil(((d.getDay()+6)%7 + new Date(d.getFullYear(), d.getMonth()+1, 0).getDate())/7)*7;
    const tasks = all().filter(t => !t.unscheduled);
    const exams = profile().subjects;
    const cells = Array.from({length:count}, (_,i) => {
        const key = add(start,i), dt = date(key), has = tasks.some(t=>t.date===key), exam = exams.some(s=>s.exam===key);
        return `<button class="calday ${key===today()?'today':''} ${key===selectedDate?'selected':''} ${calendarMode==='month'&&dt.getMonth()!==d.getMonth()?'outside':''}" data-act="calday" data-id="${key}" aria-label="${fmt(key)}" aria-pressed="${key===selectedDate}">${dt.getDate()}<span class="caldots">${has?'<i></i>':''}${exam?'<i class="examdot"></i>':''}</span></button>`;
    }).join('');
    const selected = tasks.filter(t=>t.date===selectedDate);
    const heading = calendarMode==='week' ? `${fmt(start)} – ${fmt(add(start,6))}` : d.toLocaleDateString('sr-Latn-RS',{month:'long',year:'numeric'});
    return `<section class="card"><div class="row between"><h3>Kalendar učenja</h3><button class="ghost compact" data-act="caltoday">Danas</button></div><div class="row caltabs"><button class="${calendarMode==='month'?'secondary':'ghost'}" data-act="calmode" data-id="month">Mesec</button><button class="${calendarMode==='week'?'secondary':'ghost'}" data-act="calmode" data-id="week">Nedelja</button></div><div class="row between"><button class="ghost compact" data-act="month" data-id="-1" aria-label="Prethodni period">‹</button><small>${heading}</small><button class="ghost compact" data-act="month" data-id="1" aria-label="Sledeći period">›</button></div><div class="calendar">${['Po','Ut','Sr','Če','Pe','Su','Ne'].map(x=>`<span class="muted">${x}</span>`).join('')}${cells}</div><small>● Aktivnost · <span style="color:var(--rose)">● Ispit</span></small><div class="daygroup"><h3>${fmt(selectedDate)}</h3>${exams.filter(s=>s.exam===selectedDate).map(s=>`<p class="pill">🎓 ${esc(s.name)}</p>`).join('')}${selected.map(taskRow).join('') || '<p class="muted subtle">Nema aktivnosti za ovaj dan.</p>'}</div></section>`;
}
function noteList() {
    const p = profile();
    if (!Array.isArray(p.noteCards)) {
        p.noteCards = p.notes ? [{id:uid(),title:'Moje beleške',body:p.notes,color:0,updated:today()}] : [];
        save();
    }
    return p.noteCards;
}
function notes() {
    const list = noteList();
    return `<div class="row between section-tools"><p class="muted">${list.length} beleški · automatsko čuvanje</p><button data-act="noteadd">＋ Nova beleška</button></div><div class="noteboard">${list.map(n=>`<article class="card note-card tint-${Number(n.color)||0}"><div class="row between"><small>${esc(n.updated)}</small><button class="ghost compact" data-act="notedel" data-id="${n.id}" aria-label="Obriši belešku">×</button></div><input class="note-title" data-note="${n.id}" data-field="title" aria-label="Naslov beleške" placeholder="Naslov" value="${esc(n.title)}" maxlength="100"><textarea data-note="${n.id}" data-field="body" aria-label="Tekst beleške" placeholder="Zapiši nešto..." rows="7">${esc(n.body)}</textarea><div class="row">${[0,1,2,3].map(c=>`<button class="swatch tint-${c}" data-act="notecolor" data-id="${n.id}:${c}" aria-label="Boja ${c+1}" aria-pressed="${n.color===c}"></button>`).join('')}</div></article>`).join('') || '<div class="card empty">Tvoja tabla je prazna. Dodaj prvu belešku. ✦</div>'}</div>`;
}
function cards() { return profile().flashCards ||= []; }
let flashIndex=0, flashFlipped=false;
function flashPage() {
    const p=profile(), list=cards(), c=list[flashIndex%Math.max(1,list.length)];
    return `<div class="grid"><div class="stack"><section class="card"><h2>Materijal za učenje</h2><p class="muted">Učitaj PDF, Word (.docx), TXT, MD ili CSV ili nalepi tekst. Običan tekst je dovoljan; kartice možeš naknadno urediti. Za PDF i Word potreban je internet pri učitavanju biblioteka.</p><input id="materialFile" type="file" accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" aria-label="Učitaj materijal"><textarea id="materialText" rows="8" placeholder="Nalepi materijal...">${esc(p.material||'')}</textarea><div class="row"><button data-act="flashgenerate">Generiši kartice</button><button class="ghost" data-act="flashadd">＋ Ručno dodaj</button></div><small>Tekst se obrađuje u pregledaču. Kartice iz običnog teksta koriste dopunjavanje rečenica; nije AI analiza.</small></section><section class="card"><h2>Moje kartice (${list.length})</h2>${list.map(x=>`<div class="task"><div class="grow"><strong>${esc(x.q)}</strong><p class="muted subtle">${esc(x.a)}</p></div><button class="ghost compact" data-act="flashedit" data-id="${x.id}">Izmeni</button><button class="danger compact" data-act="flashdel" data-id="${x.id}" aria-label="Obriši karticu">×</button></div>`).join('')||'<p class="empty">Još nema kartica.</p>'}</section></div><section class="card flash-review"><div class="row between"><h2>Ponavljanje</h2>${c?'<button class="secondary" data-act="flashopen">⛶ Započni učenje</button>':''}</div>${c?`<small>Kartica ${flashIndex%list.length+1} / ${list.length}</small><button class="flash-face ${flashFlipped?'flipped':''}" data-act="flashopen"><small>${flashFlipped?'ODGOVOR':'PITANJE'}</small><strong>${esc(flashFlipped?c.a:c.q)}</strong><span>Klikni za prikaz preko celog ekrana ⛶</span></button><div class="row between"><button class="ghost" data-act="flashmove" data-id="-1">‹ Prethodna</button><button data-act="flashmove" data-id="1">Sledeća ›</button></div>`:'<p class="empty">Dodaj kartice i započni ponavljanje.</p>'}</section></div>`;
}
function plant(stage, animated = false) {
    const names = ['Seme', 'Klica', 'Biljka', 'Cvet'];
    const stemHeight = [110, 72, 42, 32][stage];
    const stem = `<path class="plant-stem" pathLength="1" d="M80 110Q73 85 80 ${stemHeight}" stroke="#71866a" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const leaves = `<g class="plant-leaves lower"><path d="M79 94Q43 93 45 72Q70 70 79 94M80 83Q108 58 113 77Q108 94 80 83" fill="#a0a68e"/></g>`;
    const upper = `<g class="plant-leaves upper"><path d="M79 65Q48 63 51 43Q73 43 79 65M80 56Q109 35 112 49Q108 66 80 56" fill="#7d9671"/></g>`;
    const petals = Array.from({length: 5}, (_, i) => `<g transform="rotate(${i * 72} 80 33)"><ellipse class="plant-petal" style="--petal-delay:${1.3 + i * .09}s" cx="80" cy="17" rx="11" ry="17" fill="#d38e9c"/></g>`).join('');
    const flower = `<g class="plant-flower">${petals}<circle class="plant-center" cx="80" cy="33" r="10" fill="#edca82"/></g>`;
    const growth = stage === 0 ? '<ellipse class="plant-seed" cx="80" cy="104" rx="7" ry="4" fill="#bf9d67"/>' : stem + leaves + (stage >= 2 ? upper : '') + (stage === 3 ? flower : '');
    return `<svg class="plant ${animated ? 'plant-animated' : ''}" viewBox="0 0 160 175" role="img" aria-label="${names[stage]}"><ellipse cx="80" cy="160" rx="46" ry="7" fill="#0001"/><path d="M46 115H114L103 157H57Z" fill="#d39d98"/><ellipse cx="80" cy="110" rx="34" ry="5" fill="#806b55"/>${growth}<rect x="41" y="111" width="78" height="11" rx="4" fill="#e0b4ae"/></svg>`;
}
// Svaki prihvaćeni plan ima zasebnu biljku; računamo i neraspoređene aktivnosti.
function gardenProgress(subject) {
    const tasks = [...subject.tasks, ...(subject.unscheduled || [])];
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const progress = total ? Math.floor(done / total * 100) : 0;
    const stage = total && done === total ? 3 : progress >= 50 ? 2 : done > 0 ? 1 : 0;
    return { done, total, progress, stage };
}
function gardenPage() {
    const subjects = profile().subjects.filter(s => s.exam >= today());
    const names = ['Seme', 'Klica', 'Biljka', 'Cvet'];
    return `<section class="card garden-intro"><h2>Svaki predmet, jedna biljka 🌱</h2><p class="muted">Biljka klija posle prve završene aktivnosti, raste na polovini plana i cveta kada završiš sve aktivnosti.</p></section>${subjects.length ? `<div class="subject-garden">${subjects.map(s => {
        const {done,total,progress,stage} = gardenProgress(s);
        return `<section class="card garden-subject"><h2>${esc(s.name)}</h2><small>Ispit: ${fmt(s.exam)}</small>${plant(stage,true)}<span class="pill">${names[stage]}</span><p>${done} / ${total} aktivnosti · ${progress}%</p><div class="progress"><i style="width:${progress}%"></i></div><p class="muted">${stage===3?'Tvoj cvet je procvetao!':!total?'Plan još nema aktivnosti.':`Još ${total-done} aktivnosti do cveta.`}</p></section>`;
    }).join('')}</div>` : '<section class="card empty">Nema aktivnih planova. Dodaj predmet da zasadiš svoju biljku. <button data-act="newsubject">＋ Predmet</button></section>'}`;
}
// Režim ponavljanja zauzima ceo vidljivi prozor, bez bočne navigacije.
function openFlashReview() {
    const list = cards();
    if (!list.length) return;
    flashIndex = ((flashIndex % list.length) + list.length) % list.length;
    const c = list[flashIndex];
    if (!modal.open || !modal.classList.contains('flash-fullscreen')) {
        showModal(`<section class="flash-study"><header class="row between"><div><small>ÉTUDIE · PONAVLJANJE</small><h2>Flash kartice</h2></div><button class="ghost" data-act="close" aria-label="Zatvori ponavljanje">✕ Zatvori</button></header><p id="reviewCount" class="muted"></p><button id="reviewFace" class="flash-face" data-act="flashflip"><small id="reviewSide"></small><strong id="reviewText"></strong><span>Klikni za okretanje ↻</span></button><div class="row between review-controls"><button class="ghost" data-act="flashmove" data-id="-1">‹ Prethodna</button><button data-act="flashmove" data-id="1">Sledeća ›</button></div><small class="muted">Strelice za kretanje · Esc za izlaz</small></section>`);
        modal.classList.add('flash-fullscreen');
    }
    $('#reviewCount').textContent = `Kartica ${flashIndex + 1} / ${list.length}`;
    $('#reviewSide').textContent = flashFlipped ? 'ODGOVOR' : 'PITANJE';
    $('#reviewText').textContent = flashFlipped ? c.a : c.q;
    $('#reviewFace').classList.toggle('flipped', flashFlipped);
}
function deleteActiveProfile() {
    const p = profile();
    if (!p) return;
    if (!confirm(`Trajno obrisati profil „${p.name}” i sve njegove predmete, beleške, kartice i statistiku? Ostali profili ostaju sačuvani.`)) return;
    stopAmbient();
    stopTimer();
    db.profiles = db.profiles.filter(item => item.id !== p.id);
    switchPage('profiles');
    notify('Profil je obrisan.');
}
function settingsPage() {
    const p=profile(), pref=p.preferences||{};
    return `<div class="grid"><section class="card"><h2>Moj profil</h2><form id="settingsForm"><div class="field"><label for="editName">Ime</label><input id="editName" name="name" value="${esc(p.name)}" maxlength="40" required></div><div class="field"><label for="editAvatar">Avatar</label><select id="editAvatar" name="avatar">${avatars.map(a=>`<option ${a===p.avatar?'selected':''}>${a}</option>`).join('')}</select></div><button>Sačuvaj profil</button></form><button class="ghost" data-act="nav" data-id="profiles">Promeni profil</button><div class="delete-profile"><h3>Brisanje profila</h3><p class="muted subtle">Trajno uklanja sve podatke ovog profila sa uređaja.</p><button class="danger" data-act="deleteprofile">Obriši profil</button></div></section><section class="card"><h2>Izgled i učenje</h2>${[['animations','Animacije'],['motivation','Motivacione poruke'],['reorganize','Automatska reorganizacija']].map(([k,l])=>`<label class="setting-row"><span>${l}</span><input type="checkbox" data-pref="${k}" ${pref[k]!==false?'checked':''}></label>`).join('')}<label class="setting-row"><span>Tamna tema</span><input type="checkbox" data-pref="dark" ${p.dark?'checked':''}></label></section></div>`;
}
// Ambijentalni zvukovi: tri zasebna lokalna audio zapisa.
let ambientAudio = null, ambientKind = 'off', ambientVolume = .25;
function ambientPanel() {
    return `<section class="card"><h2>Ambijentalni zvukovi</h2><p class="muted subtle">Izaberi zvuk za koncentraciju.</p><div class="sound-grid">${[['rain','🌧️','Kiša'],['wind','🍃','Vetar'],['waves','🌊','Talasi'],['off','🔇','Tišina']].map(([k,i,l])=>`<button class="${ambientKind===k?'secondary':'ghost'}" data-act="ambient" data-id="${k}" aria-pressed="${ambientKind===k}"><span>${i}</span>${l}</button>`).join('')}</div><label for="ambientVolume">Jačina zvuka</label><input id="ambientVolume" type="range" min="0" max="100" value="${Math.round(ambientVolume*100)}"></section>`;
}
function stopAmbient() {
    if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio = null;
    }
    ambientKind = 'off';
}
async function playAmbient(kind) {
    stopAmbient();
    if (kind === 'off') { render(); return; }
    if (!['rain', 'wind', 'waves'].includes(kind)) return;
    const audio = new Audio(`audio/${kind}.mp3`);
    audio.loop = true;
    audio.volume = ambientVolume;
    ambientAudio = audio;
    ambientKind = kind;
    try {
        await audio.play();
        if (ambientAudio === audio) render();
    } catch {
        if (ambientAudio !== audio) return;
        stopAmbient();
        render();
        notify('Zvuk nije dostupan u ovom pregledaču.');
    }
}
// Uvoz materijala: biblioteke se učitavaju samo kada su potrebne.
let wordLibrary;
function loadWordLibrary() {
    if (window.mammoth) return Promise.resolve(window.mammoth);
    if (!wordLibrary) wordLibrary = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js';
        script.onload = () => window.mammoth ? resolve(window.mammoth) : reject(new Error('Word biblioteka nije dostupna.'));
        script.onerror = () => { script.remove(); reject(new Error('Word biblioteka nije učitana. Proveri internet.')); };
        document.head.append(script);
    }).catch(error => { wordLibrary = null; throw error; });
    return wordLibrary;
}
async function readMaterial(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['txt', 'md', 'csv'].includes(ext)) return file.text();
    if (ext === 'docx') {
        const mammoth = await loadWordLibrary();
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        return result.value;
    }
    if (ext === 'pdf') {
        let pdfjs;
        try { pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs'); }
        catch { throw new Error('PDF biblioteka nije učitana. Proveri internet.'); }
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
        try {
            const pages = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const content = await (await pdf.getPage(i)).getTextContent();
                pages.push(content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join(''));
            }
            return pages.join('\n\n');
        } finally { await pdf.destroy(); }
    }
    throw new Error('Podržani formati: PDF, DOCX, TXT, MD i CSV.');
}
// Iz definicija pravimo direktne kartice, a iz običnog teksta kartice za dopunjavanje.
function makeFlashCards(text) {
    const result = [];
    for (const line of text.split(/\n+/)) {
        const match = line.match(/^\s*(.{1,160}?)(\?|\s+[–—-]\s+|:)(\s*\S.*)$/);
        if (match) {
            result.push({ q: match[1].trim() + (match[2] === '?' ? '?' : ''), a: match[3].trim() });
            continue;
        }
        for (const sentence of line.match(/[^.!?]+[.!?]?/g) || []) {
            const clean = sentence.trim();
            if (clean.length < 35 || clean.length > 700) continue;
            const words = [...clean.matchAll(/[\p{L}]{5,}/gu)];
            if (!words.length) continue;
            const word = words.find(w => w.index > 10) || words[0];
            result.push({ q: clean.slice(0, word.index) + '_____' + clean.slice(word.index + word[0].length), a: word[0] });
        }
        if (result.length >= 100) break;
    }
    return result.slice(0, 100);
}
function flashForm(c) {
    showModal(`<h2>${c?'Izmeni':'Nova'} kartica</h2><form id="flashForm" data-id="${c?.id||''}"><div class="field"><label>Pitanje<input name="q" required value="${esc(c?.q||'')}"></label></div><div class="field"><label>Odgovor<textarea name="a" required rows="5">${esc(c?.a||'')}</textarea></label></div><div class="actions"><button type="button" class="ghost" data-act="close">Otkaži</button><button>Sačuvaj</button></div></form>`);
}
function extraAction(a,id,b) {
    const p=profile();
    switch(a){
        case 'calmode': calendarMode=id;selectedDate=cal;render();return true;
        case 'calday': selectedDate=id;cal=id;render();return true;
        case 'caltoday': selectedDate=cal=today();render();return true;
        case 'noteadd': noteList().unshift({id:uid(),title:'',body:'',color:0,updated:today()});save();render();$('.note-title')?.focus();return true;
        case 'notedel': if(confirm('Obrisati ovu belešku?')){p.noteCards=noteList().filter(n=>n.id!==id);save();render();}return true;
        case 'notecolor': {const [key,c]=id.split(':');const n=noteList().find(n=>n.id===key);if(n)n.color=+c;save();render();return true;}
        case 'flashadd': flashForm();return true;
        case 'flashedit': flashForm(cards().find(c=>c.id===id));return true;
        case 'flashdel': if(confirm('Obrisati karticu?')){p.flashCards=cards().filter(c=>c.id!==id);flashIndex=0;flashFlipped=false;save();render();}return true;
        case 'deleteprofile': deleteActiveProfile(); return true;
        case 'flashopen': flashFlipped = false; openFlashReview(); return true;
        case 'flashflip': flashFlipped=!flashFlipped; if(modal.classList.contains('flash-fullscreen')) openFlashReview(); else render(); return true;
        case 'flashmove': if(!cards().length) return true; flashIndex=(flashIndex+Number(id)+cards().length)%cards().length; flashFlipped=false; if(modal.classList.contains('flash-fullscreen')) openFlashReview(); else render(); return true;
        case 'flashgenerate': {
            const text = $('#materialText').value.trim();
            const proposals = makeFlashCards(text);
            let count = 0;
            for (const item of proposals) {
                if (!cards().some(c => c.q === item.q && c.a === item.a)) {
                    cards().push({ id: uid(), ...item });
                    count++;
                }
            }
            p.material = text;
            save(); render();
            notify(count ? `Dodato ${count} kartica.` : 'Nema novih kartica. Dodaj više teksta ili kreiraj karticu ručno.');
            return true;
        }
        case 'ambient': playAmbient(id);return true;
        default:return false;
    }
}
app.addEventListener('input',e=>{
    const el=e.target,p=profile();if(!p)return;
    if(el.dataset.note){const n=noteList().find(n=>n.id===el.dataset.note);if(n){n[el.dataset.field]=el.value;n.updated=today();save();}}
    if(el.id==='materialText'){p.material=el.value;save();}
    if(el.id==='ambientVolume'){ambientVolume=+el.value/100;if (ambientAudio) ambientAudio.volume = ambientVolume;}
});
app.addEventListener('change',async e=>{
    const el=e.target,p=profile();if(!p)return;
    if(el.dataset.pref){if(el.dataset.pref==='dark')p.dark=el.checked;else (p.preferences||={})[el.dataset.pref]=el.checked;if(el.dataset.pref==='reorganize'&&el.checked)reorganize();save();render();}
    if (el.id === 'materialFile' && el.files[0]) {
        const file = el.files[0];
        if (file.size > 20 * 1024 * 1024) { notify('Fajl može imati najviše 20 MB.'); el.value = ''; return; }
        el.disabled = true;
        notify('Čitanje materijala…');
        try {
            const content = (await readMaterial(file)).trim();
            if (profile() !== p) return;
            if (!content) throw new Error('Dokument nema čitljiv tekst. Za skenirani PDF potreban je OCR.');
            if (content.length > 500000) throw new Error('Materijal je predugačak. Podeli ga na manje delove.');
            p.material = content;
            save();
            if (page === 'flash') render();
            notify('Materijal je učitan. Klikni na Generiši kartice.');
        } catch (error) {
            if (profile() === p) notify(error.message || 'Fajl nije moguće pročitati.');
        } finally { el.disabled = false; el.value = ''; }
    }
});
app.addEventListener('submit',e=>{if(e.target.id==='settingsForm'){e.preventDefault();const f=new FormData(e.target),name=f.get('name').trim();if(!name)return;profile().name=name;profile().avatar=f.get('avatar');save();render();notify('Podešavanja su sačuvana.');}});
modal.addEventListener('submit',e=>{if(e.target.id==='flashForm'){e.preventDefault();const f=new FormData(e.target),q=f.get('q').trim(),a=f.get('a').trim();if(!q||!a)return;const c=cards().find(c=>c.id===e.target.dataset.id);if(c)Object.assign(c,{q,a});else cards().push({id:uid(),q,a});save();closeModal();render();}});

if (profile()) {
    loadTimer();
    reorganize();
}
render();
maybeTutorial();
