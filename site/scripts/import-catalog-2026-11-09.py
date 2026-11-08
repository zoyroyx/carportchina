"""Editorial import of the owner's 8 November export; repeatable by stable slug.

Only the explicitly mapped vehicle messages/photos are published, never chat text.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
rows = []


def add(slug, brand, model, year, trim, status, stock, order, photos, message,
        description, specs=(), equipment=(), mileage=None, reference=None, vat=False):
    rows.append(dict(slug=slug, brand=brand, model=model, year=year, trim=trim,
                     status=status, stock=stock, order=order, photos=photos,
                     message=message, description=description, specs=specs,
                     equipment=equipment, mileage=mileage, reference=reference, vat=vat))


add('ram-1500-rebel-2026', 'RAM', '1500 Rebel', 2026, 'Rebel-GT Package', 'in_stock', 8800000, 8500000,
    [122,121,120,119,118],239350,
    'RAM 1500 Rebel с пакетом Rebel-GT. Пневмоподвеска, панорамная крыша и аудиосистема Harman Kardon. В наличии в Москве; доступен также привоз под заказ.',
    [('Двигатель','3,0 л · бензин'),('Мощность','420 л.с.')],
    ['Пневмоподвеска','Панорамная крыша и люк','Внедорожный круиз-контроль','Подрулевые переключатели','Harman Kardon','Экран для пассажира','Apple CarPlay и Android Auto','Беспроводная зарядка двух телефонов','Подогрев передних и задних сидений','Подогрев руля'])
add('audi-q2-35-tfsi-2026','Audi','Q2',2026,'35 TFSI S tronic Luxury','in_stock',3500000,3200000,
    [124,123,125],239356,'Компактный Audi Q2 в комплектации Luxury с коробкой S tronic. Серый кузов и чёрный салон. Доступны покупка из наличия и заказ автомобиля. Статус активации ЭПТС подтвердим перед покупкой.')
add('bmw-x1-25li-2026','BMW','X1',2026,'25Li M Sport Shadow Edition','in_stock',5700000,5300000,
    [131,127],239364,'BMW X1 25Li в исполнении M Sport Shadow Edition. Белый кузов, чёрный салон. По предложению документы готовы, ЭПТС действующий, утильсбор списан.',
    [('Цвет кузова','Белый'),('Цвет салона','Чёрный')])
add('audi-q5l-2026','Audi','Q5L',2026,'Предмаксимальная комплектация','in_stock',6700000,6300000,
    [132],239371,'Audi Q5L с зелёным кузовом и чёрным салоном. Пневмоподвеска, аудиосистема Bang & Olufsen и колёсные диски R21.',
    [('Двигатель','Бензин'),('Цвет кузова','Зелёный'),('Цвет салона','Чёрный')],['Пневмоподвеска','Bang & Olufsen','Колёсные диски R21'])
add('honda-civic-fun-2026','Honda','Civic',2026,'Fun · 180 Turbo','in_stock',3030000,2700000,
    [133],239373,'Honda Civic Fun с турбированным бензиновым двигателем и вариатором. Белый кузов, чёрный салон.',
    [('Двигатель','1,5 л · бензин'),('Коробка передач','CVT'),('Цвет кузова','Белый'),('Цвет салона','Чёрный')])
add('mazda-cx-5-zhishang-pro-2026','Mazda','CX-5',2026,'Zhishang Pro','in_stock',3200000,2800000,
    [134],239375,'Mazda CX-5 в комплектации Zhishang Pro. Синий кузов, чёрный тканевый салон и бензиновый двигатель.',
    [('Двигатель','Бензин'),('Цвет кузова','Синий'),('Салон','Чёрный · ткань')])
add('bmw-x3-xdrive30l-2025','BMW','X3',2025,'xDrive30L Leading M Sport','in_stock',6700000,6500000,
    [137,136],239382,'BMW X3 xDrive30L в комплектации Leading M Sport. Чёрный кузов и салон, бензиновый двигатель, полный привод.',
    [('Двигатель','Бензин'),('Привод','Полный'),('Цвет кузова','Чёрный'),('Цвет салона','Чёрный')])
add('xiaomi-yu7-max-2026','Xiaomi','YU7',2026,'Max','in_stock',10500000,10300000,
    [139,138,140,141,142,143,144,150,145,146,147,148,149,151,152],239390,
    'Новый электрический Xiaomi YU7 Max с полным приводом. В подборке представлены оранжевое и зелёное исполнения. В наличии в Москве; доступен привоз под заказ.',
    [('Силовая установка','Электрическая'),('Привод','Полный')],mileage=0)
for year,status,stock,order in [(2025,'in_stock',8500000,None),(2026,'to_order',None,9800000)]:
    add(f'denza-n9-black-knight-{year}','Denza','N9',year,'Black Knight',status,stock,order,
        [154,153,156,157,155,158,159],239410,
        'Denza N9 в исполнении Black Knight. Чёрный кузов, просторный светлый салон и отдельные кресла второго ряда.' + (' Автомобиль 2025 года из наличия.' if year==2025 else ' Автомобиль 2026 года под заказ.'),
        [('Цвет кузова','Чёрный')])
add('byd-leopard-8-2025','BYD','Leopard 8',2025,'2.0 Hybrid','to_order',None,8280000,
    [161,162,163,164,160],239416,'Новый BYD Leopard 8 — внедорожник с гибридной силовой установкой. Поставка автомобиля из Китая под заказ.',
    [('Двигатель','2,0 л · гибрид'),('Мощность','700 л.с.')],mileage=0)
# "Titanium 5" in the export is the photographed Fang Cheng Bao / Leopard 5.
# Manufacturer: https://www.fangchengbao.com/bao5 (checked 2026-11-09).
for year,status,stock,order in [(2025,'in_stock',6000000,None),(2026,'to_order',None,7800000)]:
    add(f'byd-leopard-5-{year}','BYD','Leopard 5',year,'1.5 Hybrid · AWD',status,stock,order,
        [169,168,166,165,167],239422,'Гибридный BYD Leopard 5 с полным приводом. Новый автомобиль без пробега.' + (' Автомобиль 2025 года в наличии, документы подготовлены.' if year==2025 else ' Автомобиль 2026 года под заказ.'),
        [('Двигатель','1,5 л · гибрид'),('Мощность','687 л.с.'),('Привод','Полный')],mileage=0)
add('byd-tang-l-lidar-flagship-2025','BYD','Tang L',2025,'LiDAR Flagship','unknown',None,None,
    [178,176,175,177,174,171,170,172,173],239434,'BYD Tang L LiDAR Flagship с кожаным салоном. Цена в предложении указана без НДС; доступен вариант покупки с НДС по отдельному расчёту.',
    [('Двигатель','1,5 л'),('Коробка передач','Автоматическая'),('Салон','Кожа')],reference=5100000,vat=True)
for year,status,stock,order in [(2025,'in_stock',6000000,None),(2026,'to_order',None,7500000)]:
    add(f'byd-titanium-7-{year}','BYD','Titanium 7',year,'1.5 Hybrid · AWD',status,stock,order,
        [180,179,181],239438,'Новый BYD Titanium 7 с гибридной силовой установкой и полным приводом.' + (' Автомобиль 2025 года в наличии, документы подготовлены.' if year==2025 else ' Поставка автомобиля 2026 года под заказ.'),
        [('Двигатель','1,5 л · гибрид'),('Мощность','687 л.с.'),('Привод','Полный')],mileage=0)
add('xiaomi-skynomad-n90-max-2026','Xiaomi','SkyNomad N90',2026,'Max · 7 мест','in_stock',10600000,None,
    [182],239440,'Семиместный Xiaomi SkyNomad N90 Max с гибридной силовой установкой, полным приводом и пневмоподвеской. Просторный трансформируемый салон для дальних поездок.',
    [('Двигатель','1,5 л · турбо · гибрид'),('Мощность','422 л.с.'),('Привод','Полный'),('Мест','7'),('Батарея','76 кВт·ч'),('Общий запас хода','До 1 705 км · CLTC'),('Электрический запас хода','До 464 км · CLTC'),('Разгон 0–100 км/ч','5,9 с')],
    ['Пневмоподвеска','Панорамная крыша','Подогрев, вентиляция и массаж сидений','Мультимедиа 16,1″','Проекционный дисплей HUD','Экран для задних пассажиров 21,4″','Встроенный холодильник','Камеры кругового обзора','LiDAR и ассистенты водителя'])
# Photo 183 is a BMW X3 collage, not the X5 offered in the adjoining message.
add('bmw-x5-xdrive40d-2026','BMW','X5',2026,'xDrive40d · Европа','in_transit',None,None,
    [],239442,'Европейский BMW X5 xDrive40d в пути в Москву и доступен к бронированию. По предложению ожидается в конце ноября 2026 года; дату прибытия подтвердим при обращении.',
    [('Двигатель','Дизель'),('Привод','Полный')],reference=18500000)
add('mercedes-benz-gls-450-2026','Mercedes-Benz','GLS 450',2026,'Европейская версия','in_stock',18890000,None,
    [188,187,184,185,186],239449,'Mercedes-Benz GLS 450 европейской версии. Зелёный кузов, чёрный салон. В наличии в Москве с документами.',
    [('Двигатель','Бензин'),('Цвет кузова','Зелёный'),('Цвет салона','Чёрный')])
add('rolls-royce-cullinan-2021','Rolls-Royce','Cullinan',2021,'Дилерский РФ','unknown',None,None,
    [198,197,196,190,191,189,192,193,194,195],239460,
    'Rolls-Royce Cullinan дилерской поставки в РФ. Один владелец, без окрасов по предложению. Пробег 21 500 км. Цена при наличной оплате — от 29 млн ₽; вариант с НДС — от 33,6 млн ₽.',
    [('Владельцев','1'),('Исполнение','Дилерский РФ')],mileage=21500,reference=29000000,vat=True)
add('rolls-royce-cullinan-black-badge-2025','Rolls-Royce','Cullinan',2025,'Black Badge','in_stock',68000000,None,
    [199,201,200,202,203,204],239467,'Rolls-Royce Cullinan Black Badge европейской версии. Тёмно-синий кузов и небесно-голубой салон. Пробег 700 км; защитная плёнка снаружи и внутри.',
    [('Двигатель','6,8 л · бензин'),('Мощность','600 л.с.'),('Цвет кузова','Тёмно-синий'),('Цвет салона','Небесно-голубой')],['Black Badge','Защитная плёнка кузова и салона'],mileage=700)
add('land-rover-range-rover-velar-2025','Land Rover','Range Rover Velar',2025,'Dynamic SE','unknown',None,None,
    [205],239469,'Range Rover Velar Dynamic SE с бензиновым двигателем. Белый кузов и чёрный салон.',
    [('Двигатель','Бензин'),('Цвет кузова','Белый'),('Цвет салона','Чёрный')],reference=8650000)
add('porsche-cayenne-2025','Porsche','Cayenne',2025,'SportDesign','in_stock',14900000,None,
    [206],239471,'Porsche Cayenne с пакетом SportDesign. Чёрный кузов и салон, выпуск июль 2025 года. В наличии в Москве; по предложению ЭПТС действующий, утильсбор списан.',
    [('Выпуск','Июль 2025'),('Цвет кузова','Чёрный'),('Цвет салона','Чёрный')],
    ['SportDesign','Колёсные диски R22, стиль 911','Пневмоподвеска','Матричная LED-оптика','Проекционный дисплей HUD','Адаптивный круиз-контроль','Руль GT с подогревом','Комфортные сиденья: 14 регулировок и память','Подогрев и вентиляция передних и задних сидений','Камеры и видеорегистраторы спереди и сзади','BOSE','Четырёхзонный климат-контроль','Доводчики дверей'])

offers = json.loads((ROOT/'data/offers.json').read_text(encoding='utf-8'))
slugs = {r['slug'] for r in rows}
offers = [o for o in offers if o['slug'] not in slugs]
manifest = []
for r in rows:
    gallery = []
    for number in r['photos']:
        source = next((ROOT/'ChatExport_2026-11-08/photos').glob(f'photo_{number}@*.jpg'))
        dest = f'/photos/catalog/{r["slug"]}/{number}.webp'
        gallery.append(dict(src=dest, alt=f'{r["brand"]} {r["model"]} — фото {len(gallery)+1}'))
        manifest.append(dict(source=source.relative_to(ROOT).as_posix(),dest='public'+dest))
    o = dict(id=r['slug'],slug=r['slug'],title=f'{r["brand"]} {r["model"]}',brand=r['brand'],model=r['model'],year=r['year'],trim=r['trim'],
             publication='published',registrationMarket='RF',priceKind='on_request',amountMinor=None,currency='RUB',validUntil=None,
             fullCostsConfirmed=False,termsApproved=False,estimateBasis=None,vatConfirmed=r['vat'],image=gallery[0]['src'] if gallery else None,
             gallery=gallery,description=r['description'],availability=r['status'],
             availabilityNote='Статус по предложению от 08.11.2026. Доступность выбранного автомобиля подтвердим при обращении.',
             sourcePrice=dict(fromRub=r['stock'] or r['order'] or r['reference'],date='2026-11-08',note='Цена по предложению. Итоговая стоимость и условия покупки подтверждаются индивидуально.'),
             photoNote='Фотографии из предложения. Цвет и оснащение выбранного автомобиля уточняются при обращении.' if gallery else 'Фотографии выбранного автомобиля предоставим по запросу.',
             specifications=[dict(label=k,value=v) for k,v in r['specs']],
             highlights=[v for k,v in r['specs'][:3]] or [r['trim']],updatedAt='2026-11-09')
    if r['stock']: o['stockPriceRub']=r['stock']
    if r['order']: o['orderPriceRub']=r['order']
    if r['mileage'] is not None: o['mileageKm']=r['mileage']
    if r['equipment']: o['equipment']=[dict(title='Оснащение',items=r['equipment'])]
    if r['slug']=='byd-tang-l-lidar-flagship-2025': o['sourcePrice']['note']='Цена от 5 100 000 ₽ без НДС. Вариант покупки с НДС рассчитывается отдельно.'
    if r['slug']=='rolls-royce-cullinan-2021': o['sourcePrice']['note']='При наличной оплате — от 29 000 000 ₽. Вариант с НДС — от 33 600 000 ₽.'
    offers.append(o)
    manifest.append(dict(offer=r['slug'],message=f'message{r["message"]}',date='2026-11-08'))
(ROOT/'data/offers.json').write_text(json.dumps(offers,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
output=ROOT/'output/catalog-import-2026-11-09';output.mkdir(parents=True,exist_ok=True)
(output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(rows)} added offers; {len(offers)} total; {sum(bool(o["photos"]) for o in rows)} new galleries')
