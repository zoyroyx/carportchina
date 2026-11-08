import { useEffect, useId, useRef, useState } from "react";

export const promos = [
  {
    id: "ferrari", label: "Ferrari", kicker: "Эксклюзивная квота CarPort China",
    title: "Ferrari 849 Testarossa Spider",
    description: "Одна квота. Ваша конфигурация. Поставка летом 2027.",
    compact: "Одна квота · лето 2027",
    image: "ferrari-849", alt: "Ferrari 849 Testarossa Spider, рекламная композиция",
    links: [{ label: "Открыть предложение", href: "/ferrari-849-testarossa-spider/" }],
  },
  {
    id: "residency", label: "ПМЖ", kicker: "Два направления. Один партнёр.",
    title: "ПМЖ в Беларуси и Кыргызстане",
    description: "Сопровождение, документы и вопросы автомобиля.",
    compact: "Документы и сопровождение",
    image: "residency", alt: "Рекламная композиция: автомобиль, Минск и горы Кыргызстана",
    links: [{ label: "Беларусь", href: "/services/pmzh-belarus/" }, { label: "Кыргызстан", href: "/services/pmzh-kyrgyzstan/" }],
  },
  {
    id: "service", label: "Обслуживание", kicker: "Забота о каждом километре",
    title: "Полное обслуживание",
    description: "Сервис, запчасти, русификация и защита кузова.",
    compact: "Сервис, запчасти и защита кузова",
    image: "service", alt: "Рекламная иллюстрация обслуживания автомобиля в мастерской",
    links: [{ label: "Выбрать услугу", href: "/services/" }],
  },

] as const;

export function PromoBanners() {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const running = !paused && !hovered && !focused && !reduced && visible && pageVisible;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (root.current) observer.observe(root.current);
    return () => { motion.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setActive(value => (value + 1) % promos.length), 7000);
    return () => window.clearTimeout(timer);
  }, [running, active]);

  const select = (index: number) => { setActive(index); setPaused(true); };
  return <section ref={root} className="promo-banners" aria-label="Предложения CarPort China" aria-roledescription="карусель"
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="promo-stage" id={`${id}-slides`}>
      {promos.map((promo, index) => <article key={promo.id} className={`promo-slide promo-${promo.id}${active === index ? " is-active" : ""}`} inert={active !== index} aria-hidden={active !== index} aria-label={`${index + 1} из ${promos.length}: ${promo.label}`} aria-roledescription="слайд">
        <img className="promo-photo" src={`/photos/promos/${promo.image}-1920.webp`} srcSet={`/photos/promos/${promo.image}-960.webp 960w, /photos/promos/${promo.image}-1920.webp 1920w`} sizes="(max-width: 640px) 100vw, 80vw" width={2172} height={724} alt={promo.alt} fetchPriority={index === 0 ? "high" : "low"} decoding="async" />
        <div className="promo-shade" aria-hidden="true" />
        <div className="promo-copy"><span className="promo-kicker">{promo.kicker}</span><h2>{promo.title}</h2><p className="promo-description">{promo.description}</p><p className="promo-compact">{promo.compact}</p>
          <div className="promo-links">{promo.links.map(link => <a key={link.href} href={link.href}>{link.label}<span aria-hidden="true">↗</span></a>)}</div>
        </div>
      </article>)}
    </div>
    <div className="promo-controls">
      <button type="button" className="promo-arrow" aria-label="Предыдущий баннер" aria-controls={`${id}-slides`} onClick={() => select((active + promos.length - 1) % promos.length)}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg></button>
      <button type="button" className="promo-arrow" aria-label="Следующий баннер" aria-controls={`${id}-slides`} onClick={() => select((active + 1) % promos.length)}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m10 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg></button>
      {!reduced && <button className="promo-pause" type="button" aria-label={paused ? "Включить смену баннеров" : "Приостановить смену баннеров"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">{paused ? <path d="m6 3 11 7-11 7Z" fill="currentColor" /> : <path d="M6 3v14M14 3v14" stroke="currentColor" strokeWidth="3" />}</svg>
      </button>}
    </div>
  </section>;
}
