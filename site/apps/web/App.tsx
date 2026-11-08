import { FerrariPage } from "./FerrariPage";
import { PromoBanners } from "./PromoBanners";
import { DataNotice } from "./DataNotice";
import { legalOperator } from "./legal-content";
import { Request } from "./Request";
import { ClientReviews } from "./ClientReviews";
import { serviceSelling } from "./service-selling";
import { ServicePhoto } from "./ServicePhoto";
import { ThemeToggle } from "./ThemeToggle";
import { RouteBackground } from "./RouteBackground";
import { HeroSlideshow } from "./HeroSlideshow";
import { FleetActivity } from "./FleetActivity";
import type { CompanyContent } from "../../packages/contracts/company";
import { HomeBenefits, HomeServices } from "./home-sections";
import {
  CompanyProof,
  VehicleCard,
  VehicleDetails,
  PurchaseProcess,
  ProposalContents,
} from "./automotive";
import { trackJourney } from "./analytics";
import { useState, useEffect, useRef, useId } from "react";
import {
  serviceGuidance,
  serviceAgreements,
} from "./request-copy";
import { services, titleFor, purchaseQuestions, type Service } from "./content";
import {
  offerForPath,
  catalogQuery,
  filterOffers,
  type Offer,
} from "../../packages/contracts/offers";
export interface AppProps {
  url: string;
  offers: Offer[];
  now: number;
  company?: CompanyContent;
}
const navigationItems = [
  ["/cars/", "Автомобили"],
  ["/services/", "Услуги"],
  ["/business/", "Для бизнеса"],
  ["/about/", "О компании"],
  ["/reviews/", "Отзывы"],
  ["/contacts/", "Контакты"],
];
const Arrow = () => <span aria-hidden="true">↗</span>;
function LinkButton({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <a className={`button ${secondary ? "secondary" : ""}`} href={href}>
      {children}
      <Arrow />
    </a>
  );
}
const serviceNavLabels: Record<string, string> = {
  "service-warranty": "Сервис и гарантия",
  parts: "Запчасти",
  russification: "Русификация и адаптация",
  film: "Защита кузова плёнкой",
  "trade-in": "Трейд-ин",
  "credit-insurance": "Кредит и страхование",
  "pmzh-belarus": "ПМЖ в Беларуси",
  "pmzh-kyrgyzstan": "ПМЖ в Киргизии",
};
function ServicesNavigation({ path }: { path: string }) {
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setExpanded(false);
    };
    const layout = window.matchMedia("(min-width: 1024px)");
    const resize = () => {
      if (!layout.matches) {
        if (root.current?.contains(document.activeElement))
          document
            .querySelector<HTMLButtonElement>(".car-menu-button")
            ?.focus();
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    layout.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      layout.removeEventListener("change", resize);
    };
  }, [expanded]);
  return (
    <div
      className="desktop-disclosure"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setExpanded(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded) {
          event.preventDefault();
          setExpanded(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        className="desktop-disclosure-trigger"
        ref={trigger}
        aria-expanded={expanded}
        aria-controls={panelId}
        data-active={path.startsWith("/services/") || undefined}
        onClick={() => setExpanded(!expanded)}
      >
        Услуги <span className="navigation-plus" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className={`desktop-dropdown ${expanded ? "is-open" : ""}`}
        inert={!expanded}
        aria-hidden={!expanded}
      >
        <a
          className="dropdown-overview"
          href="/services/"
          aria-current={path === "/services/" ? "page" : undefined}
        >
          Все услуги <Arrow />
        </a>
        {services.map((service) => {
          const href = `/services/${service.slug}/`;
          return (
            <a
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              {serviceNavLabels[service.slug] ?? service.title}
              <Arrow />
            </a>
          );
        })}
      </div>
    </div>
  );
}
function Header({ path }: { path: string }) {
  const carMaskId = useId();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const desktopNav = useRef<HTMLElement>(null);
  useEffect(() => {
    const wideScreen = window.matchMedia("(min-width: 1024px)");
    const switchLayout = () => {
      if (!wideScreen.matches) return;
      const focusInDrawer = document
        .getElementById("navigation-panel")
        ?.contains(document.activeElement);
      if (focusInDrawer || document.activeElement === menuButton.current)
        desktopNav.current?.querySelector("a")?.focus();
      setOpen(false);
    };
    wideScreen.addEventListener("change", switchLayout);
    return () => wideScreen.removeEventListener("change", switchLayout);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <>
      <a className="skip" href="#main">
        К содержанию
      </a>
      <header
        className="site-header wrap"
        ref={headerRef}
        onBlur={(event) => {
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget as Node)
          )
            setOpen(false);
        }}
      >
        <a className="logo" href="/" aria-label="CarPort China — главная">
          <span className="brand-symbol" aria-hidden="true" />
          <span className="brand-name">
            CarPort <span className="brand-country">China</span>
          </span>
        </a>
        <nav
          ref={desktopNav}
          className="desktop-navigation"
          aria-label="Основная навигация"
        >
          {navigationItems.map(([href, label]) =>
            href === "/services/" ? (
              <ServicesNavigation key={href} path={path} />
            ) : (
              <a
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
                data-active={path.startsWith(href) || undefined}
              >
                {label}
              </a>
            ),
          )}
        </nav>
        <ThemeToggle />
        <a className="header-order text-link" href="/cars/#request">
          Подобрать авто <Arrow />
        </a>
        <button
          ref={menuButton}
          className="car-menu-button"
          aria-expanded={open}
          aria-controls="navigation-panel"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen(!open)}
        >
          <svg
            viewBox="0 0 128 56"
            aria-hidden="true"
            className="car-menu-icon"
          >
            <defs>
              <mask
                id={carMaskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="128"
                height="56"
              >
                <rect width="128" height="56" fill="white" />
                <g fill="black">
                  <path d="M31 24 Q43 16 51 15 L53 25 Q41 25 31 24 Z M57 14 Q72 10 83 18 L94 26 L58 25 Z" />
                  <circle cx="28" cy="44" r="12" />
                  <circle cx="101" cy="44" r="12" />
                  <path d="M5 30 H12 L11 32 H5 Z M113 31 L122 35 H115 Z" />
                </g>
                <g stroke="black" strokeWidth="3.2" strokeLinecap="round">
                  <path className="car-slot car-slot-top" d="M49 32 H78" />
                  <path className="car-slot car-slot-middle" d="M49 38 H78" />
                  <path className="car-slot car-slot-bottom" d="M49 44 H78" />
                </g>
              </mask>
            </defs>
            <g className="car-silhouette" fill="currentColor">
              <path
                mask={`url(#${carMaskId})`}
                d="M4 34 Q4 31 9 28 L9 24 L5 22 Q4 20 7 20 L24 22 L15 25 Q24 25 35 20 Q56 8 72 10 Q85 11 99 27 Q116 28 125 37 L122 43 L126 47 Q125 49 113 49 H15 Q6 49 4 44 L2 39 Z"
              />
              <path
                fillRule="evenodd"
                d="M38 44 A10 10 0 1 1 18 44 A10 10 0 1 1 38 44 Z M33 44 A5 5 0 1 0 23 44 A5 5 0 1 0 33 44 Z M111 44 A10 10 0 1 1 91 44 A10 10 0 1 1 111 44 Z M106 44 A5 5 0 1 0 96 44 A5 5 0 1 0 106 44 Z"
              />
            </g>
          </svg>
        </button>
        <div
          id="navigation-panel"
          className={`navigation-panel ${open ? "is-open" : ""}`}
          inert={!open}
          aria-hidden={!open}
        >
          <div className="navigation-intro">
            <span className="navigation-kicker">CarPort China</span>
            <p>
              Выбор автомобиля
              <br />и регулярное обслуживание.
            </p>
            <a className="button" href="/cars/#request">
              Обсудить подбор <Arrow />
            </a>
          </div>
          <nav aria-label="Основная навигация" className="navigation-links">
            {navigationItems.map(([href, label], index) => (
              <a
                key={href}
                href={href}
                style={{ "--link-index": index } as React.CSSProperties}
                aria-current={path === href ? "page" : undefined}
                data-active={path.startsWith(href) || undefined}
              >
                {label}
                <Arrow />
              </a>
            ))}
          </nav>
          <div className="navigation-bottom">
            <a href="/reviews/" className="text-link">
              Отзывы довольных клиентов <Arrow />
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
function Footer({ company }: { company?: CompanyContent }) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-layout">
        <div className="footer-brand">
          <a
            className="footer-logo"
            href="/"
            aria-label="CarPort China — главная"
          >
            <span className="brand-symbol" aria-hidden="true" />
            <span>
              CarPort <span className="brand-country">China</span>
            </span>
          </a>
          <p>
            Выбор автомобиля
            <br />и регулярное обслуживание.
          </p>
          <span className="footer-signature">Выбор. Покупка. Поддержка.</span>
        </div>
        <nav className="footer-links" aria-label="Автомобили в подвале">
          <h2>Автомобили</h2>
          <a href="/cars/">Каталог</a>
          <a href="/cars/#request">Подобрать автомобиль</a>
          <a href="/business/">Юридическим лицам</a>
        </nav>
        <nav className="footer-links" aria-label="Компания в подвале">
          <h2>Компания</h2>
          <a href="/about/">О компании</a>
          <a href="/reviews/">Выдачи и отзывы</a>
          <a href="/contacts/">Контакты</a>
          <a href="/services/">Все услуги</a>
        </nav>
        <nav
          className="footer-links footer-documents"
          aria-label="Документы в подвале"
        >
          <h2>Документы</h2>
          <a href="/privacy/">Политика обработки персональных данных</a>
          <a href="/consent/">Согласие на обработку персональных данных</a>
          {company?.contacts?.phone && (
            <a href={`tel:${company.contacts.phone}`}>
              {company.contacts.phone}
            </a>
          )}
          {company?.contacts?.email && <a href={`mailto:${company.contacts.email}`}>{company.contacts.email}</a>}
        </nav>
        <div className="footer-meta">
          <span>© 2026 CarPort China</span>
          <p>
            Стоимость и условия уточняются по выбранному автомобилю.
          </p>
          <p>
            {company?.contacts?.legalName ??
              "По вопросам сотрудничества — corp@carportchina.ru."}
          </p>
        </div>
      </div>
    </footer>
  );
}
function Intro({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`intro ${className}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}
function FAQ({ items }: { items: [string, string][] }) {
  return (
    <div className="faq">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
function Documents() {
  return (
    <section className="documents section compact-documents" id="documents">
      <h2>Оформление для России</h2>
      <div className="document-disclosures">
        {[
          [
            "Полный утильсбор",
            "Для постановки на учёт в РФ",
            "Полный утильсбор включаем в состав предложения. Расчёт и подтверждение оплаты проверяются по конкретному автомобилю перед сделкой.",
          ],
          [
            "ЭПТС и документы",
            "Комплект к передаче автомобиля",
            "Согласуем документы для российского учёта. Проверяем статус ЭПТС и комплект к передаче автомобиля.",
          ],
          [
            "Условия в договоре",
            "Стоимость и ответственность",
            "Фиксируем состав стоимости и обязательства по отсутствию доплат для покупателя. Порядок расчётов и ответственность сторон прописываем в договоре.",
          ],
        ].map(([title, subtitle, text]) => (
          <details key={title}>
            <summary>
              <span>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </span>
              <span className="disclosure-plus" aria-hidden="true">
                +
              </span>
            </summary>
            <p>{text}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
function ServiceList({
  all = false,
  level = 3,
}: {
  all?: boolean;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="service-list">
      {services.slice(0, all ? 8 : 4).map((s) => (
        <a href={`/services/${s.slug}/`} key={s.slug}>
          <span>
            <small>{s.short}</small>
            <Heading>{s.title}</Heading>
          </span>
          <Arrow />
        </a>
      ))}
    </div>
  );
}
function Home({ offers, now, company }: AppProps) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">CarPort China · автомобили и сервис</span>
          <h1>
            Подберём и привезём <em>ваш автомобиль.</em>
          </h1>
          <p className="lead">
            Найдём автомобиль под ваши пожелания или поможем выбрать из
            каталога. Доставка, оформление и свой сервис.
          </p>
          <div className="actions">
            <LinkButton href="/cars/#request">Подобрать автомобиль</LinkButton>
            <LinkButton href="/cars/" secondary>
              Открыть каталог
            </LinkButton>
          </div>
          <p className="hero-caption">Китай · Корея · ОАЭ · Европа</p>
        </div>
        <HeroSlideshow />
      </section>
      <FleetActivity />
      <HomeBenefits />
      <section className="section catalog-preview">
        <div className="section-head">
          <div>
            <h2>Авто из каталога или подбор под вас</h2>
          </div>
          <a className="text-link" href="/cars/">
            Перейти в каталог <Arrow />
          </a>
        </div>
        <p className="lead">
          Смотрите предложения в каталоге или расскажите, какой автомобиль
          ищете. Подберём варианты под ваши задачи, комплектацию и бюджет.
        </p>
        {filterOffers(offers).length ? (
          <div className="vehicle-grid">
            {catalogQuery(offers, new URLSearchParams(), now)
              .slice(0, 4)
              .map((o) => (
                <VehicleCard key={o.id} offer={o} now={now} />
              ))}
          </div>
        ) : (
          <div className="catalog-preparation">
            <p>
              Проверяем автомобили перед публикацией. В каталоге появятся
              фотографии, комплектации и цены.
            </p>
            <a className="text-link" href="/cars/#request">
              Подготовить пожелания к автомобилю ↗
            </a>
          </div>
        )}
        <div className="catalog-preview-footer"><a className="text-link" href="/cars/">Весь каталог <Arrow /></a></div>
      </section>
      <ClientReviews />
      <CompanyProof company={company} />
      <PurchaseProcess />
      <Documents />
      <section className="section home-services">
        <div className="section-head">
          <div>
            <h2>Услуги от профессионалов</h2>
          </div>
          <a className="text-link" href="/services/">
            Все услуги <Arrow />
          </a>
        </div>
        <HomeServices />
      </section>
      <section className="business-banner">
        <span className="eyebrow">Юридическим лицам</span>
        <h2>Автомобиль для задач бизнеса</h2>
        <p>
          Обсудите предложение для компании, возможность покупки с НДС и
          документы для бухгалтерии.
        </p>
        <LinkButton href="/business/" secondary>
          Условия для бизнеса
        </LinkButton>
      </section>
      <Request />
    </>
  );
}
function Catalog({ url, offers, now }: AppProps) {
  const [params, setParams] = useState(() => new URL(url, "http://local").searchParams);
  function updateFilters(next: URLSearchParams) {
    setParams(next);
    const query = next.toString();
    window.history.replaceState(window.history.state, "", `/cars/${query ? "?" + query : ""}${window.location.hash}`);
  }
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    updateFilters(next);
  }
  function resetFilters() { updateFilters(new URLSearchParams()); }
  useEffect(() => {
    const restore = () => {
      const next = new URLSearchParams(window.location.search);
      setParams(next);
      if (next.get("brand") || next.get("sort") || next.get("vat")) setMoreFilters(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const brand = params.get("brand") ?? "";
  const vat = params.get("vat") === "true";
  const [moreFilters, setMoreFilters] = useState(
    !!brand || vat || !!params.get("sort"),
  );
  const filtered = catalogQuery(offers, params, now);
  const hasFilters = ["q", "brand", "vat", "budget", "availability", "sort"].some(
    (key) => !!params.get(key),
  );
  useEffect(() => {
    trackJourney("catalog_view");
  }, []);
  return (
    <>
      <div className="catalog-heading"><Intro eyebrow="Каталог" title="Автомобили">
        Сначала — автомобили в наличии. Выберите готовый вариант или сравните
        стоимость поставки под заказ.
      </Intro><p className="catalog-update-note">Каталог постоянно пополняется новыми моделями. Не нашли свой автомобиль? <a href="#request">Расскажите, что ищете ↗</a></p></div>
      <form
        className="filters catalog-filters"
        aria-label="Фильтр автомобилей"
        method="get"
        action="/cars/"
        onSubmit={e => { e.preventDefault(); trackJourney("catalog_filter"); }}
      >
        <fieldset className="availability-filter">
          <legend>Способ покупки</legend>
          {[["", "Все автомобили"], ["in_stock", "В наличии"], ["to_order", "Под заказ"], ["in_transit", "В пути"]].map(([value, label]) => (
            <label key={value}><input type="radio" name="availability" value={value} checked={(params.get("availability") ?? "") === value} onChange={() => setFilter("availability", value)} /><span>{label}</span></label>
          ))}
        </fieldset>
        <label className="catalog-search">
          Марка или модель
          <input
            name="q"
            type="search"
            maxLength={100}
            value={params.get("q") ?? ""}
            onChange={e => setFilter("q", e.target.value)}
            placeholder="Toyota, ZEEKR, Monjaro"
          />
        </label>
        <label>
          Бюджет, ₽
          <input
            name="budget"
            type="number"
            min="1"
            max="9999999999"
            step="1"
            value={params.get("budget") ?? ""}
            onChange={e => setFilter("budget", e.target.value)}
            inputMode="numeric"
            placeholder="Без ограничения"
          />
        </label>
        <button
          type="button"
          className="catalog-filter-toggle text-link"
          aria-expanded={moreFilters}
          aria-controls="catalog-more"
          onClick={() => setMoreFilters(!moreFilters)}
        >
          {moreFilters
            ? "Скрыть дополнительные фильтры"
            : "Марка, сортировка и НДС"}
        </button>
        <div id="catalog-more" className="catalog-more" data-open={moreFilters}>
          <label>
            Марка
            <select name="brand" aria-label="Марка" value={brand} onChange={e => setFilter("brand", e.target.value)}>
              <option value="">Все марки</option>
              {[...new Set(filterOffers(offers).map((o) => o.brand))].map(
                (b) => (
                  <option key={b}>{b}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Сортировка
            <select name="sort" aria-label="Сортировка" value={params.get("sort") ?? ""} onChange={e => setFilter("sort", e.target.value)}>
              <option value="">Сначала в наличии</option>
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
              <option value="year_desc">Сначала новее</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="vat"
              value="true"
              checked={vat}
              onChange={e => setFilter("vat", e.target.checked ? "true" : "")}
            />
            Продажа с НДС
          </label>
        </div>
        <div className="catalog-filter-actions"><button className="button">Показать</button>
        <a href="/cars/" className="text-link" onClick={e => { e.preventDefault(); resetFilters(); }}>Сбросить</a></div>
      </form>
      <p className="catalog-price-note">Цены по предложениям поставщика. Итоговую стоимость и наличие подтвердим при обращении.{params.get("availability") === "to_order" ? " Бюджет и сортировка учитывают цену под заказ." : " Для доступных машин указан бюджет покупки из наличия."}</p>
      <p className="catalog-count" role="status">
        Автомобилей: {filtered.length}
        {hasFilters ? " по выбранным условиям" : ""}
      </p>
      <div>
        {filtered.length ? (
          <section aria-label="Автомобили в каталоге">
            <h2 className="sr-only">Автомобили в каталоге</h2>
            <div className="vehicle-grid">
              {filtered.map((o) => (
                <VehicleCard key={o.id} offer={o} now={now} purchaseMode={params.get("availability") ?? ""} />
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">
              ↗
            </span>
            <h2>
              {offers.length
                ? "По этим условиям нет предложений"
                : "Готовим каталог автомобилей"}
            </h2>
            <p>
              {offers.length
                ? "Попробуйте изменить фильтры или расскажите, какой автомобиль ищете."
                : "Проверяем данные перед публикацией. Здесь появятся реальные автомобили, актуальные цены и сведения об оформлении."}
            </p>
            <div className="actions">
              {hasFilters && (
                <button type="button" className="button secondary" onClick={resetFilters}>Сбросить фильтры</button>
              )}
              <LinkButton href="#request">Подготовить пожелания</LinkButton>
            </div>
          </div>
        )}
      </div>
      <section className="section" id="questions">
        <h2>Частые вопросы</h2>
        <FAQ items={purchaseQuestions} />
      </section>
      <Request title="Поможем выбрать автомобиль" />
    </>
  );
}
function ServicePage({
  service: s,
  company,
}: {
  service: Service;
  company?: CompanyContent;
}) {
  return (
    <>
      <section className="service-hero">
        <div>
          <Intro eyebrow="Услуги CarPort China" title={s.title}>
            {s.intro}
          </Intro>
          <div className="actions">
            <LinkButton href="#request">{s.cta}</LinkButton>
            <a className="text-link" href="/services/">
              Все услуги
            </a>
          </div>
        </div>
        <ServicePhoto slug={s.slug} prominent />
      </section>
      <section
        className="section service-reasons"
        aria-labelledby="service-reasons-title"
      >
        <h2 id="service-reasons-title">Почему CarPort China</h2>
        <div className="service-reasons-grid">
          {serviceSelling[s.slug].benefits.map(([title, text], index) => (
            <article key={title}>
              <span className="service-reason-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <a className="text-link" href="#request">
          {s.cta} <Arrow />
        </a>
      </section>
      {(s.type === "service" || s.type === "credit") && (
        <nav className="service-scenarios" aria-label="Выберите тип обращения">
          {(s.type === "service"
            ? [
                ["#request", "Обслуживание", "Плановые работы и диагностика"],
                [
                  "#warranty-request",
                  "Гарантийное обращение",
                  "Неисправность и условия программы",
                ],
                [
                  "/services/parts/",
                  "Запчасти",
                  "Подбор детали и совместимость",
                ],
              ]
            : [
                ["#request", "Кредит", "Взнос, срок и индивидуальный расчёт"],
                [
                  "#insurance-request",
                  "Страхование",
                  "Вид полиса и нужное покрытие",
                ],
              ]
          ).map(([href, title, detail]) => (
            <a key={href} href={href}>
              <strong>
                {title}
                <Arrow />
              </strong>
              <span>{detail}</span>
            </a>
          ))}
        </nav>
      )}
      {s.type === "residency" && (
        <p className="notice residency">
          Условия ПМЖ и регистрации рассматриваются отдельно от предложений с
          оформлением для РФ. Российская итоговая цена к этому сценарию не
          применяется.
        </p>
      )}
      <section className="section service-preparation" aria-labelledby="service-process-title">
        <header className="service-preparation-header">
          <h2 id="service-process-title">{serviceGuidance[s.type]?.[0] ?? "Получите решение под вашу задачу"}</h2>
          <p className="lead">{serviceGuidance[s.type]?.[1]}</p>
        </header>
        <ol className="service-process-steps">
          {(serviceAgreements[s.type] ?? []).map(([heading, detail], index) => (
            <li key={heading}>
              <span className="service-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{heading}</h3><p>{detail}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <section
        className="section service-guarantees"
        aria-labelledby="service-guarantees-title"
      >
        <div>
          <h2 id="service-guarantees-title">Гарантии и поддержка</h2>
        </div>
        <div>
          <p>{serviceSelling[s.slug].guarantee}</p>
          <a
            className="text-link"
            href={serviceSelling[s.slug].href ?? "#request"}
          >
            {serviceSelling[s.slug].action} <Arrow />
          </a>
        </div>
      </section>
      <section className="section">
        <h2>Частые вопросы</h2>
        <FAQ items={s.questions} />
        <a className="text-link faq-action" href="#request">
          Обсудить мою задачу <Arrow />
        </a>
      </section>
      <CompanyProof company={company} kind="service" serviceSlug={s.slug} />
      <Request
        title={s.cta}
        type={s.type}
        fields={s.fields}
        country={
          s.slug === "pmzh-belarus"
            ? "BY"
            : s.slug === "pmzh-kyrgyzstan"
              ? "KG"
              : undefined
        }
      />
      {s.type === "service" && (
        <div id="warranty">
          <Request
            title="Гарантийное обращение"
            type="warranty"
            requestId="warranty-request"
            fields={["Модель автомобиля", "Описание ситуации"]}
          />
        </div>
      )}
      {s.type === "credit" && (
        <Request
          title="Запросить условия страхования"
          type="insurance"
          requestId="insurance-request"
          fields={["Автомобиль", "Вид полиса, если известен"]}
        />
      )}
    </>
  );
}
function CompanyExpertise() {
  return <section className="section company-expertise">
    <div><span className="eyebrow">Опыт CarPort China</span><h2>Более пяти лет<br />на автомобильном рынке</h2><p>Профессиональный подход при выборе комплектации, оформлении покупки и дальнейшем обслуживании.</p></div>
    <div className="company-expertise-points">
      <article><h3>Разбираемся в деталях</h3><p>Помогаем сравнить комплектации, оснащение и условия покупки под ваши задачи.</p></article>
      <article><h3>Понятные условия сделки</h3><p>Объясняем состав стоимости, проверяем документы и фиксируем договорённости в договоре.</p></article>
      <article><h3>Поддержка после покупки</h3><p>Сервис, запчасти и адаптация автомобиля. Остаёмся рядом и после передачи ключей.</p></article>
    </div>
  </section>;
}
function CompanyPhoto() {
  return <figure className="company-hero-photo"><ServicePhoto slug="team" prominent /><figcaption>Визуализация команды CarPort China</figcaption></figure>;
}
function Other({ path, company }: { path: string; company?: CompanyContent }) {
  if (path === "/business/")
    return (
      <>
        <section className="company-hero"><div><Intro eyebrow="Для юридических лиц" title="Автомобили для бизнеса">
          Подбор под задачи компании. Возможность покупки с НДС, продавец и
          комплект документов уточняются по конкретному предложению.
        </Intro>
        <div className="actions">
          <LinkButton href="/cars/?vat=true">Автомобили с НДС</LinkButton>
          <LinkButton href="/cars/" secondary>
            Весь каталог
          </LinkButton>
        </div>
        <div className="business-vat-benefit">
          <h2>Покупка с возможностью вычета НДС</h2>
          <p>Подберём автомобиль с НДС и комплектом документов для вашей бухгалтерии. Вычет возможен при наличии права на него, использовании автомобиля в облагаемой НДС деятельности и соблюдении требований к учёту и документам.</p>
        </div>
        </div><figure className="company-hero-photo"><ServicePhoto slug="business" prominent /><figcaption>Автомобили для компании · визуализация</figcaption></figure></section>
        <CompanyExpertise />
        <ProposalContents />
        <Request
          title="Подготовить запрос КП"
          type="business_vat"
          fields={["Компания", "Модель или бюджет", "Количество автомобилей"]}
        />
      </>
    );
  if (path === "/services/")
    return (
      <>
        <Intro
          eyebrow="Покупка и обслуживание"
          title="Всё для вашего автомобиля"
        >
          Подбор деталей, адаптация системы и забота об автомобиле. Выберите
          услугу, чтобы обсудить состав работ и условия.
        </Intro>
        <section
          className="home-services service-directory"
          aria-label="Все услуги"
        >
          <HomeServices all level={2} />
        </section>
        <Request
          title="Поможем выбрать услугу"
          type="contact"
          fields={[
            "Услуга или ваш вопрос",
            "Модель автомобиля, если применимо",
          ]}
        />
      </>
    );
  if (path === "/about/")
    return (
      <>
        <section className="company-hero"><div><Intro eyebrow="О CarPort China" title="Выбор, покупка и обслуживание">
          Объединяем подбор автомобиля, покупку и дальнейшую поддержку. Чтобы у
          каждого следующего шага был понятный адресат.
        </Intro>
        <div className="actions"><LinkButton href="/cars/">Выбрать автомобиль</LinkButton></div>
        </div><CompanyPhoto /></section>
        <CompanyExpertise />
        <div className="about-statement">
          <h2>
            Выбирайте автомобиль.
            <br />
            Доверьте нам детали.
          </h2>
          <p>
            Комплектация, состав цены, документы, обслуживание. Наша задача —
            помочь вам разобраться в этих вопросах при выборе автомобиля и
            вернуться за поддержкой после выдачи.
          </p>
        </div>
        <CompanyProof company={company} kind="team" />
        <ServiceList level={2} />
        <section className="section">
          <LinkButton href="/contacts/">Контакты компании</LinkButton>
        </section>
        <Request />
      </>
    );
  if (path === "/reviews/" || path === "/deliveries/")
    return <><Intro className="reviews-heading" eyebrow="Опыт наших клиентов" title="Отзывы довольных клиентов">Видеоотзывы и фотографии с выдачи автомобилей.</Intro><ClientReviews full /><Request /></>;
  if (path === "/contacts/" && company?.contacts) {
    const c = company.contacts;
    return (
      <>
        <Intro eyebrow="CarPort China" title="Контакты">
          Выберите удобный способ связи.
        </Intro>
        <div className="contact-details">
          {c.phone && <a className="contact-phone" href={`tel:${c.phone}`}>{c.phone}</a>}
          {c.email && <div className="contact-email"><span>Почта для заявок и вопросов</span><a href={`mailto:${c.email}`}>{c.email} ↗</a></div>}
          {c.hours && <p>{c.hours}</p>}
          {c.address && <p>{c.address}</p>}
          {c.messenger && (
            <a className="button" href={c.messenger}>
              Написать
            </a>
          )}
          {c.legalName && <h2>{c.legalName}</h2>}
          {c.requisites && <p>{c.requisites}</p>}
        </div>
        <section className="section data-notice" aria-labelledby="company-details-title">
          <h2 id="company-details-title">Реквизиты компании</h2>
          <dl className="legal-requisites">
            <div><dt>Оператор сайта</dt><dd>{legalOperator.name} · {legalOperator.group}</dd></div>
            <div><dt>ИНН / КПП</dt><dd>{legalOperator.inn} / {legalOperator.kpp}</dd></div>
            <div><dt>ОГРН</dt><dd>{legalOperator.ogrn}</dd></div>
            <div><dt>Юридический адрес</dt><dd>{legalOperator.address}</dd></div>
          </dl>
        </section>
        <Request
          title="О чём хотите поговорить?"
          type="contact"
          fields={["Тема обращения"]}
        />
      </>
    );
  }
  if (path === "/contacts/")
    return (
      <>
        <Intro eyebrow="На связи" title="Контакты">
          Офис, сервис и удобный способ обсудить ваш вопрос.
        </Intro>
        <div className="choice-grid">
          {["Офис", "Сервис", "Способы связи"].map((h) => (
            <article className="choice" key={h}>
              <h2>{h}</h2>
              <p>
                {h === "Способы связи"
                  ? "Проверенные телефон и адреса мессенджеров будут добавлены перед запуском."
                  : "Адрес и часы работы готовятся к публикации."}
              </p>
            </article>
          ))}
        </div>
        <Request
          title="О чём хотите поговорить?"
          type="contact"
          fields={["Тема обращения"]}
        />
      </>
    );
  if (path === "/privacy/" || path === "/consent/") return <><Intro eyebrow="Документы" title={titleFor(path)!} /><DataNotice consent={path === "/consent/"} /></>;
  return (
    <>
      <Intro
        eyebrow="Документы"
        title={titleFor(path) ?? "Страница не найдена"}
      />
      <div className="empty-state">
        <h2>Документ готовится</h2>
        <p>
          Информация готовится к публикации. По вопросам обращайтесь на corp@carportchina.ru.
        </p>
        <a className="text-link" href="/">
          На главную
        </a>
      </div>
    </>
  );
}
export function App(props: AppProps) {
  const path = new URL(props.url, "http://local").pathname;
  const service = services.find((s) => path === `/services/${s.slug}/`);
  const vehicle = offerForPath(props.offers, path);
  const pageTitle = vehicle?.title ?? titleFor(path);
  const known = !!pageTitle;
  return (
    <>
      <RouteBackground key={path} />
      <Header path={path} />
      <main className="wrap" id="main">
        {known && !["/privacy/", "/consent/", "/ferrari-849-testarossa-spider/"].includes(path) && <PromoBanners />}
        {path !== "/" && (
          <nav aria-label="Хлебные крошки" className="breadcrumbs">
            <ol>
              <li>
                <a href="/">Главная</a>
              </li>
              {service && (
                <li>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    /
                  </span>
                  <a href="/services/">Услуги</a>
                </li>
              )}
              {vehicle && (
                <li>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    /
                  </span>
                  <a href="/cars/">Автомобили</a>
                </li>
              )}
              <li>
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
                <span className="breadcrumb-current" aria-current="page">
                  {pageTitle ?? "Страница не найдена"}
                </span>
              </li>
            </ol>
          </nav>
        )}
        {!known ? (
          <>
            <Intro eyebrow="Ошибка 404" title="Здесь пока нет страницы">
              Возможно, адрес изменился. Вернитесь в каталог или на главную.
            </Intro>
            <LinkButton href="/cars/">В каталог</LinkButton>
          </>
        ) : path === "/" ? (
          <Home {...props} />
        ) : path === "/cars/" ? (
          <Catalog {...props} />
        ) : path === "/ferrari-849-testarossa-spider/" ? (
          <FerrariPage />
        ) : vehicle ? (
          <>
            <VehicleDetails offer={vehicle} now={props.now} />
            <section className="section">
              <h2>Поддержка после покупки</h2>
              <ServiceList />
            </section>
            <Request
              title="Предложение по автомобилю"
              offer={vehicle}
              fields={["Вопрос или пожелания"]}
            />
          </>
        ) : service ? (
          <ServicePage service={service} company={props.company} />
        ) : (
          <Other path={path} company={props.company} />
        )}
      </main>
      <Footer company={props.company} />
    </>
  );
}
