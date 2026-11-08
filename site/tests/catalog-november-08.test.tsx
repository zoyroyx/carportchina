import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import records from '../data/offers.json';
import covers from '../data/catalog-covers.json';
import { VehicleCard } from '../apps/web/automotive';
import { catalogQuery, type Offer } from '../packages/contracts/offers';

const offers = records as Offer[];
const added = offers.filter(o => o.updatedAt === '2026-11-09');
const find = (slug: string) => offers.find(o => o.slug === slug)!;

describe('8 November vehicle export', () => {
  it('imports all 23 offers and keeps different-year stock/order prices separate', () => {
    expect(added).toHaveLength(23);
    for (const [model, stock, order] of [['denza-n9-black-knight',8500000,9800000],['byd-leopard-5',6000000,7800000],['byd-titanium-7',6000000,7500000]] as const) {
      expect(find(model+'-2025')).toMatchObject({year:2025,availability:'in_stock',stockPriceRub:stock});
      expect(find(model+'-2025').orderPriceRub).toBeUndefined();
      expect(find(model+'-2026')).toMatchObject({year:2026,availability:'to_order',orderPriceRub:order});
      expect(find(model+'-2026').stockPriceRub).toBeUndefined();
    }
  });

  it('keeps corrected year, used-car mileage and source quote distinctions', () => {
    expect(find('xiaomi-yu7-max-2026')).toMatchObject({year:2026,mileageKm:0});
    expect(find('rolls-royce-cullinan-2021')).toMatchObject({mileageKm:21500,sourcePrice:{fromRub:29000000}});
    expect(find('rolls-royce-cullinan-black-badge-2025')).toMatchObject({mileageKm:700,stockPriceRub:68000000});
    expect(find('byd-tang-l-lidar-flagship-2025').sourcePrice?.note).toContain('без НДС');
    expect(find('honda-civic-fun-2026').stockPriceRub).toBe(3030000);
  });

  it('excludes unrelated photos and handles the X5 without a misleading X3 image', () => {
    expect(find('audi-q2-35-tfsi-2026').gallery?.some(p => p.src.endsWith('/118.webp'))).toBe(false);
    expect(find('bmw-x1-25li-2026').gallery?.some(p => /\/(128|129|130)\.webp$/.test(p.src))).toBe(false);
    const x5=find('bmw-x5-xdrive40d-2026');
    expect(x5).toMatchObject({availability:'in_transit',image:null,gallery:[]});
    const card=renderToStaticMarkup(<VehicleCard offer={x5} now={Date.now()} />);
    expect(card).toContain('Фотографии по запросу');
    expect(card).not.toContain('Фотографий: 0');
  });

  it('uses uniform responsive covers and finds new cars through existing filters', () => {
    for(const offer of added.filter(o=>o.image)) {
      const cover=(covers as Record<string,{width:number;height:number;src:string;srcSet:string}>)[offer.slug];
      expect(cover).toMatchObject({width:640,height:400});
      expect(existsSync('public'+cover.src)).toBe(true);
      expect(cover.srcSet).toContain('960w');
    }
    const result=catalogQuery(offers,new URLSearchParams('brand=Audi&availability=to_order&budget=3500000'),Date.now());
    expect(result.map(o=>o.slug)).toEqual(['audi-q2-35-tfsi-2026']);
  });
});
