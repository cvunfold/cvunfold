import Link from "next/link";
import { ArrowIcon, CheckIcon, LockIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";

const checks = [
  ["Wpływ i rezultaty", "Czy pokazujesz efekty, a nie tylko obowiązki."],
  ["Ownership", "Czy widać samodzielność i zakres decyzji."],
  ["Techniczna wiarygodność", "Czy technologie mają kontekst i uzasadnienie."],
  ["Architektura", "Czy pokazujesz skalę, jakość i trade-offy."],
  ["Współpraca", "Czy widać pracę z produktem i zespołem."],
  ["Jasność", "Czy najważniejsze sygnały da się znaleźć szybko."],
];

export default function LandingPage() {
  return <main>
    <header className="site-header container"><Logo/><nav aria-label="Główna nawigacja"><a href="#jak">Jak to działa</a><a href="#sprawdzamy">Co sprawdzamy</a><a href="#cennik">Cennik</a><a href="#faq">FAQ</a></nav><Link className="button small" href="/pl/analiza">Sprawdź swoje CV</Link></header>
    <section className="hero container">
      <div className="hero-copy"><h1>Masz doświadczenie.<br/>Czy widać je <em>w Twoim CV?</em></h1><p>Zobacz, jakie pierwsze wrażenie może zrobić Twoje CV na rekruterze lub hiring managerze. Otrzymaj konkretną, opartą na dowodach diagnozę.</p><Link className="button" href="/pl/analiza">Sprawdź swoje CV <ArrowIcon/></Link><div className="trust-line"><span><LockIcon/> Prywatnie</span><span>Bez konta</span><span>Bez wymyślania faktów</span></div></div>
      <div className="hero-report" aria-label="Podgląd raportu CVUnfold"><div className="paper"><div className="paper-head">TWOJE CV</div><b>Jan Kowalski</b><small>Frontend Developer</small>{[72,92,65,84,58,76].map((width,i)=><i key={i} style={{width:`${width}%`}}/>)}<h4>DOŚWIADCZENIE</h4>{[90,70,80,55].map((width,i)=><i key={`b${i}`} style={{width:`${width}%`}}/>)}</div><div className="preview-analysis"><span>ANALIZA CVUNFOLD</span><ScoreRing score={72} compact/><ul><li>Wiarygodny profil techniczny</li><li>Niejasny zakres ownershipu</li><li>Za mało widocznych rezultatów</li></ul></div></div>
    </section>
    <section className="seconds section-band"><div className="container"><div><h2>Pierwsze 20 sekund</h2><p>Tyle często wystarcza, by powstało pierwsze wrażenie. Pokazujemy je krok po kroku — bez udawania prawdziwej decyzji rekrutacyjnej.</p></div><ol><li><b>5 s</b><span>Co od razu przyciąga uwagę</span></li><li><b>10 s</b><span>Jak interpretowane jest doświadczenie</span></li><li><b>20 s</b><span>Jaki obraz kandydata powstaje</span></li></ol></div></section>
    <section id="sprawdzamy" className="section container"><h2>Co naprawdę sprawdzamy</h2><div className="check-grid">{checks.map(([title,copy])=><article key={title}><CheckIcon/><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></section>
    <section id="jak" className="section section-band"><div className="container"><h2>Jak działa CVUnfold</h2><ol className="steps"><li><b>01</b><h3>Prześlij CV</h3><p>Tekstowy PDF lub DOCX, po polsku albo angielsku.</p></li><li><b>02</b><h3>Analizujemy dowody</h3><p>Maskujemy kontaktowe PII i szukamy konkretnych sygnałów.</p></li><li><b>03</b><h3>Zobacz pierwsze wrażenie</h3><p>Wynik i największy problem otrzymujesz bezpłatnie.</p></li><li><b>04</b><h3>Wdróż poprawki</h3><p>Pełny raport daje priorytety i bezpieczne sugestie.</p></li></ol></div></section>
    <section className="section split container"><div><h2>To nie jest kolejny ATS checker</h2><p>Nie sprawdzamy tylko, czy robot przeczyta dokument. Analizujemy, czy człowiek zrozumie Twój poziom, zakres odpowiedzialności i wartość, którą wnosisz.</p></div><ul className="line-list"><li><CheckIcon/>Ocena nastawiona na człowieka, nie tylko algorytm</li><li><CheckIcon/>Każda ważna uwaga wskazuje dowód z CV</li><li><CheckIcon/>Wagi dopasowane do deklarowanego poziomu</li></ul></section>
    <section className="promise section-band"><div className="container"><LockIcon/><div><h2>Nigdy nie wymyślamy Twojego doświadczenia</h2><p>Gdy brakuje faktu, pytamy o niego lub zostawiamy jawny placeholder. Nie dopiszemy liczb, technologii ani ownershipu, których nie ma w dokumencie.</p></div></div></section>
    <section className="section demo container"><div><h2>Przykładowy raport</h2><p>Od pierwszych 20 sekund po konkretne dowody, priorytety i sugestie, które nie zmieniają faktów.</p><Link className="text-link" href="/pl/analiza">Zobacz raport na swoim CV <ArrowIcon/></Link></div><div className="demo-score"><ScoreRing score={72}/><div>{checks.slice(0,5).map(([label],i)=><div key={label}><span>{label}</span><b>{[58,68,82,65,74][i]}</b></div>)}</div></div></section>
    <section id="cennik" className="pricing section-band"><div className="container"><h2>Prosty cennik</h2><div className="price-row"><article><span>Pełna analiza CV</span><strong>29 zł</strong><p>Wszystkie problemy, dowody, sugestie i plan działania.</p><Link className="button" href="/pl/analiza">Wybieram <ArrowIcon/></Link></article><article><span>Analiza CV + dopasowanie do oferty</span><strong>39 zł</strong><p>Pełna analiza oraz rozróżnienie brakującej umiejętności od brakującego dowodu.</p><Link className="button" href="/pl/analiza?job=1">Wybieram <ArrowIcon/></Link></article></div><small>Płatność jednorazowa. Bez subskrypcji.</small></div></section>
    <section className="privacy container"><LockIcon/><div><h2>Twoje CV nie zostaje z nami</h2><p>Plik źródłowy usuwamy po analizie. Raport znika domyślnie po 30 dniach, a Ty możesz usunąć go natychmiast.</p></div></section>
    <section id="faq" className="section section-band"><div className="container"><h2>Najczęstsze pytania</h2><div className="faq-grid">{[["Jakie pliki mogę przesłać?","Tekstowy PDF lub DOCX do 8 MB. Skanów nie odczytujemy w MVP."],["Czy analiza ocenia mnie?","Nie. Ocenia sygnały widoczne w samym dokumencie."],["Czy moje CV trafia do pracodawców?","Nie. CVUnfold pomaga kandydatowi i nie jest narzędziem screeningu."],["Czy sugestie dopisują fakty?","Nie. Każdy brakujący fakt jest oznaczony jako luka lub pytanie."]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
    <footer className="footer container"><Logo/><p>Merytoryczna analiza CV wspierana przez AI.</p><span>© {new Date().getFullYear()} CVUnfold</span></footer>
    {process.env.MOCK_MODE === "true" ? <div className="dev-badge">DEV · MOCK MODE</div> : null}
  </main>;
}
