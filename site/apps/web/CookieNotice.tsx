import { useEffect, useState } from "react";

const acceptanceKey = "carport-cookie-notice-accepted-v1";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(acceptanceKey) !== "true");
    } catch {
      setVisible(true);
    }
    const syncAcceptance = (event: StorageEvent) => {
      if (event.key === acceptanceKey || event.key === null) {
        setVisible(event.newValue !== "true");
      }
    };
    window.addEventListener("storage", syncAcceptance);
    return () => window.removeEventListener("storage", syncAcceptance);
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(acceptanceKey, "true");
    } catch {
      // The notice can still be dismissed when browser storage is unavailable.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-notice" aria-label="Конфиденциальность и cookies">
      <p>
        Продолжая пользоваться сайтом, вы соглашаетесь с{" "}
        <a href="/privacy/">политикой конфиденциальности</a> и использованием
        файлов cookie.
      </p>
      <button className="button" type="button" onClick={accept}>
        Принять
      </button>
    </aside>
  );
}
