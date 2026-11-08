import { useState } from "react";
import { Request } from "./Request";
import { ferrariConfigurator, ferrariPhotos, ferrariSource } from "./ferrari-content";

function FerrariGallery() {
  const [selected, setSelected] = useState(0);
  const photo = ferrariPhotos[selected];
  return <section className="ferrari-gallery section" aria-label="Фотографии Ferrari">
    <div className="ferrari-section-heading"><h2>Характер в каждой детали</h2><span>{String(selected + 1).padStart(2, "0")} / 09</span></div>
    <div className="ferrari-gallery-stage">
      <img src={`/photos/ferrari/photo-${photo.id}-1200.webp`} width="1080" height="1280" alt={photo.caption} loading="lazy" decoding="async" />
      <button type="button" className="ferrari-gallery-arrow previous" aria-label="Предыдущее фото Ferrari" onClick={() => setSelected(index => (index + ferrariPhotos.length - 1) % ferrariPhotos.length)}>←</button>
      <button type="button" className="ferrari-gallery-arrow next" aria-label="Следующее фото Ferrari" onClick={() => setSelected(index => (index + 1) % ferrariPhotos.length)}>→</button>
    </div>
    <div className="ferrari-gallery-caption" aria-live="polite">{photo.caption}</div>
    <div className="ferrari-thumbnails" role="group" aria-label="Выбор фотографии Ferrari">
      {ferrariPhotos.map((item, index) => <button type="button" key={item.id} aria-label={`Фото ${index + 1}: ${item.caption}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><img src={`/photos/ferrari/photo-${item.id}-320.webp`} alt="" width="90" height="80" loading="lazy" /></button>)}
    </div>
  </section>;
}

export function FerrariPage() {
  return <div className="ferrari-page">
    <section className="ferrari-hero">
      <div className="ferrari-hero-copy">
        <span className="ferrari-eyebrow">Эксклюзивная квота CarPort China</span>
        <h1><span>Ferrari</span>849 Testarossa <em>Spider</em></h1>
        <p className="ferrari-hero-lead">Одна квота. Ваша конфигурация.<br />Поставка летом 2027.</p>
        <p className="ferrari-hero-description">Создайте автомобиль, в котором каждая деталь выбрана вами. CarPort China организует заказ и поставку Ferrari 2027 года.</p>
        <div className="ferrari-hero-actions"><a className="button" href="#ferrari-request">Обсудить квоту <span aria-hidden="true">↗</span></a><a className="ferrari-config-link" href={ferrariConfigurator} target="_blank" rel="noopener noreferrer">Конфигуратор Ferrari <span aria-hidden="true">↗</span></a></div>
      </div>
      <figure className="ferrari-hero-photo"><img src="/photos/ferrari/photo-6-1200.webp" alt="Белый Ferrari Spider с красными акцентами, вид спереди" width="1080" height="1242" fetchPriority="high" /><figcaption>2027 / Индивидуальная конфигурация</figcaption></figure>
    </section>

    <section className="ferrari-allocation section">
      <div><span className="ferrari-section-label">Возможность, которую выбирают заранее</span><h2>Один автомобиль.<br />И только ваш выбор.</h2></div>
      <div><p className="ferrari-large-copy">У CarPort China открыта одна квота на Ferrari 849 Testarossa Spider с поставкой летом 2027 года.</p><p>Цвет кузова, отделка салона, колёсные диски, карбоновые элементы: соберите собственное сочетание в конфигураторе Ferrari. Мы обсудим выбранную спецификацию, подготовим персональное предложение и согласуем оформление заказа.</p><a className="text-link" href="#ferrari-request">Получить персональное предложение ↗</a></div>
    </section>

    <section className="ferrari-design-story">
      <figure><img src="/photos/ferrari/photo-3-1200.webp" alt="Карбоновая аэродинамика и красный кузов Ferrari" width="1075" height="1280" loading="lazy" /></figure>
      <div><span className="ferrari-section-label">Легендарное имя. Новая энергия.</span><h2>Эмоции без крыши.<br />Точность без компромиссов.</h2><p>V8 biturbo и три электромотора дают суммарно 1050 л. с. Жёсткая складная крыша открывается за 14 секунд. 849 Testarossa Spider соединяет мощь гибридного суперкара с ощущением открытого пространства.</p><a className="ferrari-source" href={ferrariSource} target="_blank" rel="noopener noreferrer">Характеристики Ferrari ↗</a></div>
    </section>

    <FerrariGallery />

    <section className="ferrari-configurator section" id="configurator">
      <div className="ferrari-configurator-copy"><span className="ferrari-section-label">Выберите цвет. Добавьте свой характер.</span><h2>Создайте свой Ferrari</h2><p>Откройте официальный конфигуратор и создайте свою версию 849 Testarossa Spider. Сохраните ссылку на результат и отправьте её нам: продолжим разговор уже о вашем автомобиле.</p><a className="button" href={ferrariConfigurator} target="_blank" rel="noopener noreferrer">Собрать свою конфигурацию <span aria-hidden="true">↗</span></a><span className="ferrari-external-note">Откроется сайт Ferrari в новой вкладке.</span></div>
      <figure><img src="/photos/ferrari/photo-4-1200.webp" alt="Руль Ferrari, карбон и красные элементы салона" width="1053" height="1280" loading="lazy" /></figure>
    </section>

    <ol className="ferrari-steps">
      <li><span>01</span><div><h3>Выберите свою спецификацию</h3><p>Соберите автомобиль в конфигураторе или обсудите пожелания с нами.</p></div></li>
      <li><span>02</span><div><h3>Согласуйте условия заказа</h3><p>Получите расчёт, состав поставки и порядок закрепления квоты.</p></div></li>
      <li><span>03</span><div><h3>Встречайте свой Ferrari</h3><p>Сопровождение заказа и поставка автомобиля летом 2027 года.</p></div></li>
    </ol>
    <Request title="Ваша квота на Ferrari" type="ferrari_allocation" requestId="ferrari-request" fields={["Ссылка на вашу конфигурацию", "Пожелания к автомобилю"]} />
  </div>;
}
