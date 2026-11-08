import { describe, it, expect } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { existsSync } from 'node:fs';
import records from '../data/offers.json';
import { OfferSchema, catalogQuery, publicationIssues, type Offer } from '../packages/contracts/offers';
import { render } from '../apps/web/entry-server';
import { buildSeo } from '../apps/server/seo';
const offers=records as Offer[], now=Date.parse('2026-11-07');
describe('November catalog import',()=>{
 it('publishes unique valid offers with local photos when available',()=>{
  expect(offers).toHaveLength(42);expect(new Set(offers.map(o=>o.slug)).size).toBe(offers.length);
  for(const o of offers){expect(Value.Check(OfferSchema,o)).toBe(true);expect(publicationIssues(o)).toEqual([]);for(const p of o.gallery??[])expect(existsSync('public'+p.src)).toBe(true);}
 });
 it('prioritizes available cars on catalog and homepage',()=>{
  const result=catalogQuery(offers,new URLSearchParams(),now);
  const count=offers.filter(o=>o.availability==='in_stock').length;
  expect(result.slice(0,count).every(o=>o.availability==='in_stock')).toBe(true);
  const home=render({url:'/',offers,now}).html;
  expect(home).toContain('/cars/'+result[0].slug+'/');
 });
 it('combines availability with search, budget, and explicit price sorting',()=>{
  const result=catalogQuery(offers,new URLSearchParams('availability=in_stock&q=Toyota&budget=4500000&sort=price_asc'),now);
  expect(result.map(o=>o.model)).toEqual(['RAV4','Camry 85']);
 });
 it('includes dual-price models under order filter without inventing stock',()=>{
  const result=catalogQuery(offers,new URLSearchParams('availability=to_order'),now);
  expect(result.some(o=>o.model==='Camry 85')).toBe(true);
  expect(result.some(o=>o.model==='Trumpchi S9')).toBe(false);
  expect(catalogQuery(offers,new URLSearchParams('availability=in_transit'),now).map(o=>o.model)).toEqual(['Land Cruiser 300','X5']);
 });
 it('uses the later ZEEKR quote and preserves both purchase prices',()=>{
  const o=offers.find(o=>o.model==='8X')!;
  expect(o.stockPriceRub).toBe(12100000);expect(o.orderPriceRub).toBe(11700000);
  const html=render({url:`/cars/${o.slug}/`,offers,now}).html;
  expect(html).toContain('В наличии');expect(html).toContain('Под заказ');expect(html).toContain('12 100 000');
 });
 it('does not turn reference prices into confirmed structured offers',()=>{
  for(const o of offers){const seo=buildSeo({url:`/cars/${o.slug}/`,offers,now},true);expect(seo.head).not.toContain('"@type":"Offer"');}
  expect(buildSeo({url:'/cars/?availability=in_stock',offers,now},true).robots).toBe('noindex, follow');
 });
 it('uses order price for budget, sorting and the primary displayed amount in order mode',()=>{
  const result=catalogQuery(offers,new URLSearchParams('availability=to_order&q=Toyota&budget=4000000'),now);
  expect(result.map(o=>o.model)).toEqual(['RAV4']);
  const html=render({url:'/cars/?availability=to_order&q=Toyota&budget=4000000',offers,now}).html;
  expect(html).toContain('3 900 000');
  expect(html.indexOf('3 900 000')).toBeLessThan(html.indexOf('4 100 000'));
  expect(catalogQuery(offers,new URLSearchParams('availability=in_stock&q=Toyota&budget=4000000'),now)).toEqual([]);
 });

});
