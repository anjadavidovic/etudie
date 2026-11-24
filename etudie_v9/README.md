# étudie. — Znanje cveta.

## Pokretanje u VS Code
1. Raspakuj ZIP i otvori folder `etudie_v3` (File → Open Folder).
2. Otvori `index.html` pomoću ekstenzije Live Server (desni klik → Open with Live Server). Alternativno, otvori index.html u pregledaču; ponašanje localStorage kod file:// zavisi od pregledača.
3. Kreiraj profil i dodaj predmet. Nema instalacije npm paketa, servera aplikacije, baze ili API ključa.

## Fajlovi
- index.html — osnovna struktura
- style.css — pastelni responzivni dizajn i tamna tema
- script.js — profili, planiranje, statistika, tajmer i čuvanje podataka

## Kako radi plan
Sati nedeljno se odnose na pojedinačni predmet, ne na zbir svih predmeta. Plan se raspoređuje na izabrane dane pre datuma ispita, po kalendarskim nedeljama. Kraće sesije su moguće kada preostalo vreme nije dovoljno za punu sesiju. Tip predmeta određuje vrstu aktivnosti, a razlika između težine i znanja menja udeo početne faze učenja. Predlog mora biti prihvaćen. Datum ispita je od sutra do godinu dana unapred.

Pri otvaranju aplikacije, povratku u prozor ili promeni dana dok je otvorena, propuštene aktivnosti se preraspoređuju zajedno sa budućim, uz ograničenje sati po predmetu. Ako nema dovoljno kapaciteta, neplanirane sesije ostaju evidentirane i prikazuje se upozorenje. Izmena predmeta generiše novi plan za preostalo vreme, uz očuvanje završenih aktivnosti. Aplikacija ne zna sadržaj udžbenika, pa su aktivnosti generičke. Planovi različitih predmeta nisu vremenski usklađeni na nivou celog dana.

## Podaci
LocalStorage odvaja predmete, statistiku i temu po profilima. Profili nisu bezbedna autentifikacija i podaci nisu sinhronizovani između uređaja. Brisanje podataka pregledača uklanja profile. Pomodoro meri 25-minutne sesije i beleži samo završene fokus sesije; aktivni tajmer ne preživljava ponovno učitavanje ili promenu profila. Statistika razlikuje izmereno fokus vreme od procenjenog trajanja završenih zadataka.

## Provere
JavaScript sintaksa i osnovni algoritamski testovi (raspoloživi dani, nedeljni limit, očuvanje zadataka prilikom reorganizacije) prošli su. Interaktivni test u Chromium-u nije bilo moguće pokrenuti zbog blokade navigacije u okruženju za izradu; preporučeno je ručno testiranje u lokalnom pregledaču.


## Verzija 2
- Lične beleške se automatski čuvaju po profilu.
- Klik na broj minuta u Pomodoro tajmeru otvara podešavanje trajanja (1–180 min), kada tajmer nije pokrenut. Podešavanja su lokalna po profilu.
- Pri kreiranju ili izmeni predmeta moguće je dodati konkretne aktivnosti sa datumom i trajanjem. Datum mora biti odabrani dan učenja pre ispita, a trajanje ulazi u nedeljni limit. Preostalo vreme se popunjava generičkim sesijama.
- Slogan: Uči svojim tempom.
- Zadržan je postojeći ključ localStorage radi kompatibilnosti sa prethodnim profilima na istoj adresi aplikacije.

## Verzija 3
- Mala ikonica meseca pored avatara, dostupna i na telefonu.
- SVG logo knjige sa animacijom okretanja stranice na klik, bez spoljnih resursa.
- Suptilne animacije i hover efekti; poštuje sistemsko podešavanje smanjenog kretanja.
- Novo uputstvo u pet koraka, prikazuje se prvi put po profilu i ponovo preko dugmeta ?.
- Novi slogan: Znanje cveta.
- Zadržan je ključ lokalnih podataka.

## Verzija 4.0
- Profili su dostupni preko avatara; podešavanja i uputstvo su na dnu navigacije. Na telefonu navigacija se horizontalno pomera.
- Kalendar: mesečni/nedeljni prikaz, izbor dana, oznake ispita i aktivnosti.
- Tabla beleški: posebne kartice sa naslovom, tekstom, bojom i automatskim čuvanjem. Stara beleška se prenosi u prvu karticu.
- Flash kartice: učitavanje TXT/MD/CSV (do 500 KB), lepljenje teksta, lokalno prepoznavanje parova Pojam: definicija ili Pitanje? odgovor, ručno dodavanje/izmena/brisanje, okretanje kartica. PDF i DOCX nisu direktno podržani. Nema AI servisa.
- Bašta: faze na 0/5/15/30 trenutno završenih aktivnosti. Brisanje predmeta ili poništavanje aktivnosti utiče na rast.
- Fokus: sintetički ambijentalni zvukovi kiše, vetra i talasa preko Web Audio API-ja, kontrola jačine i tišina. Zvuk se zaustavlja pri izlasku iz profila.
- Podešavanja: ime, avatar, tema, animacije, motivacija i automatska reorganizacija.
- Svi podaci ostaju u LocalStorage; nema sinhronizacije među uređajima.

## Verzija 5.0
- Tutorijal zadržava isti okvir, simbol i dugmad; menjaju se tekst i oznaka koraka.
- Avatari imaju različite hover animacije (leptir leti, biljke se njišu itd.). Poštuje se isključivanje animacija.
- Materijal: PDF sa tekstom, DOCX, TXT, MD, CSV (do 20 MB; izdvojeni tekst do 500.000 znakova). PDF.js 4.10.38 i Mammoth 1.9.0 učitavaju se sa jsDelivr samo po potrebi, uz internet. Dokument se obrađuje lokalno u pregledaču. Stari DOC i skenirani PDF bez tekstualnog sloja nisu podržani.
- Kartice iz običnog teksta nastaju dopunjavanjem rečenica, uz postojeće prepoznavanje definicija. Rezultat nije AI analiza i može se ručno urediti.
- Provera: JavaScript sintaksa i osnovni test generisanja kartica. Uvoz PDF/DOCX i animacije nisu provereni u pravom pregledaču.

## Verzija 6.0
- Ambijentalni zvukovi koriste tri različita lokalna MP3 zapisa, generisana digitalnom sintezom (nisu terenski snimci). Kiša ima pojedinačne udare kapljica, vetar nalete, a talasi periodične prelome i povlačenje vode. Zapisi se ponavljaju, bez interneta.
- Glavna biljka u bašti animira rast stabljike, listova i latica pri otvaranju prikaza. Pragovi napretka ostaju isti. Podešavanje animacija i sistemska opcija smanjenog kretanja se poštuju.
- Audio folder mora ostati uz ostale fajlove.


## Verzija 7.0
- Flash kartice: režim ponavljanja preko celog prozora, strelice za kretanje, Esc za izlaz.
- Kiša: novi, tiši sintetički zvuk, sa mekanim sitnim kapima bez grmljavine.
- Podešavanja: brisanje aktivnog lokalnog profila uz potvrdu; ostali profili se ne menjaju.
- Bašta: posebna biljka za svaki aktivni predmet (datum ispita nije prošao). Seme na početku, klica posle prve aktivnosti, biljka na 50%, cvet na 100%. Neraspoređene aktivnosti ulaze u ukupan broj.

## Verzija 8.0
- Mobilna navigacija: klizna traka, aktivna ikonica se automatski centrira i uvećava; ručno prevlačenje ostaje dostupno.
- Avatar u zaglavlju je centriran unutar kružnog dugmeta.
- Desktop navigacija i LocalStorage ključ ostaju isti.

## Verzija 9.0
- Zadržana mobilna klizna navigacija i centriran avatar iz V8.
- Avatar otvara meni za promenu profila, podešavanja i odjavu. Oba izlaza na izbor profila čuvaju lokalne podatke.
- Klik na ceo red aktivnosti aktivira njegov checkbox (nativni HTML label).
- Klik na karticu predmeta ili red predmeta na početnoj otvara plan; zasebna dugmad za izmenu i brisanje ostaju nezavisna.
