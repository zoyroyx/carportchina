import { useEffect, useRef, useState } from "react";
import type { Offer } from "../../packages/contracts/offers";
import { requestCopy } from "./request-copy";
import { trackJourney } from "./analytics";
import { consentVersion } from "./legal-content";

export function Request({ title = "Обсудим ваш автомобиль", type = "general_selection", fields = ["Модель или пожелания", "Бюджет, если определились"], country, requestId = "request", offer }: {
  title?: string; type?: string; fields?: string[]; country?: string; requestId?: string; offer?: Offer;
}) {
  const copy = requestCopy[type] ?? requestCopy.general_selection!;
  const [ready, setReady] = useState(false);
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const token = useRef<string | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    setReady(true);
    if (type === "contact" && new URLSearchParams(window.location.search).get("topic") === "ferrari") setTopic("Квота на Ferrari");
  }, [type]);
  return <section className="request section" id={requestId}>
    <div><h2>{title}</h2><p>{copy[0]}</p><p className="form-note">Оставьте телефон или почту — свяжемся с вами и уточним детали.</p></div>
    <form aria-label={title} onSubmit={async (event) => {
      event.preventDefault();
      if (busy.current || status === "sent") return;
      busy.current = true;
      const data = new FormData(event.currentTarget);
      setStatus("sending"); setMessage("");
      try {
        if (!token.current) {
          const response = await fetch("/api/request.php", { credentials: "same-origin", cache: "no-store" });
          const result = await response.json();
          if (!response.ok || typeof result.token !== "string") throw new Error("Не удалось подключиться. Попробуйте ещё раз или напишите нам на почту.");
          token.current = result.token;
        }
        const response = await fetch("/api/request.php", {
          method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.current, name: data.get("name"), contact: data.get("contact"), consent: data.get("consent") === "on", consentVersion, website: data.get("website"), type, page: window.location.pathname, details: Object.fromEntries([...data.entries()].filter(([key]) => !["name", "contact", "consent", "website"].includes(key))) }),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          if (response.status === 403) token.current = null;
          throw new Error(result.message || "Не удалось отправить заявку. Попробуйте ещё раз или напишите на corp@carportchina.ru.");
        }
        setStatus("sent"); setMessage(`Заявка №${result.id} отправлена. Мы свяжемся с вами по указанному контакту.`);
        trackJourney("request_sent", { offerId: offer?.id, service: type });
      } catch (error) {
        setStatus("error"); setMessage(error instanceof Error && /[А-Яа-яЁё]/.test(error.message) ? error.message : "Не удалось отправить заявку. Проверьте соединение и повторите попытку или напишите на corp@carportchina.ru.");
      } finally { busy.current = false; }
    }} aria-busy={status === "sending"}>
      <fieldset disabled={!ready || status === "sending" || status === "sent"}>
        <legend className="sr-only">Заявка и контакт для ответа</legend>
        {offer && <><input type="hidden" name="Автомобиль" value={offer.title} /><input type="hidden" name="Код предложения" value={offer.id} /><p className="request-context">Автомобиль: <strong>{offer.title}</strong></p></>}
        {country && <input type="hidden" name="Страна" value={country} />}
        <div className="form-grid">
          <label>Ваше имя<input className="ym-disable-keys" name="name" autoComplete="name" maxLength={80} required placeholder="Как к вам обращаться" /></label>
          <label>Телефон или email<input className="ym-disable-keys" name="contact" autoComplete="on" maxLength={120} required minLength={5} placeholder="+7 … или name@example.ru" /></label>
          {fields.map((field, index) => <label key={field}>{field}<input className="ym-disable-keys" name={field} defaultValue={field === "Тема обращения" ? topic : undefined} type={field === "Ссылка на вашу конфигурацию" ? "url" : "text"} maxLength={field === "Ссылка на вашу конфигурацию" ? 2000 : 200} placeholder={field === "Ссылка на вашу конфигурацию" ? "https://carconfigurator.ferrari.com/…" : index === 0 ? "Укажите, если знаете" : "Необязательно"} /></label>)}
        </div>
        <label>Комментарий<textarea className="ym-disable-keys" name="Комментарий" maxLength={2000} rows={3} placeholder={copy[1]} /></label>
        <div className="request-trap" aria-hidden="true"><label>Ваш сайт<input className="ym-disable-keys" name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="request-consent"><input type="checkbox" name="consent" required /><span>Даю <a href="/consent/" target="_blank" rel="noreferrer">согласие на обработку персональных данных</a> для рассмотрения обращения и подготовки ответа.</span></label>
        <p className="request-policy">Порядок обработки и ваши права — в <a href="/privacy/" target="_blank" rel="noreferrer">Политике обработки персональных данных</a>.</p>
        <button className="button" type="submit">{status === "sending" ? "Отправляем…" : status === "sent" ? "Заявка отправлена ✓" : "Отправить заявку ↗"}</button>
      </fieldset>
      {message && <div className={`request-result ym-hide-content ${status}`} role={status === "error" ? "alert" : "status"}>{message}{status === "error" && <p><a href="mailto:corp@carportchina.ru">Написать на почту ↗</a></p>}</div>}
      <noscript>Для отправки формы включите JavaScript или напишите на <a href="mailto:corp@carportchina.ru">corp@carportchina.ru</a>.</noscript>
    </form>
  </section>;
}
