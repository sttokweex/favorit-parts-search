import test from 'node:test';
import assert from 'node:assert/strict';
import { getBrands, getOffers } from '../src/normalize.js';

test('первый этап извлекает уникальных производителей из goods', () => {
  assert.deepEqual(getBrands({ goods: [{ brand: 'MEYLE' }, { brand: 'NGK' }, { brand: 'MEYLE' }] }), ['MEYLE', 'NGK']);
  assert.deepEqual(getBrands({ goods: {} }), []);
});

test('второй этап выводит аналог и предложения по каждому складу с ценой склада', () => {
  const data = { goods: {
    goodsID: '1', brand: 'MEYLE', number: '7160500039S', name: 'Деталь', price: 999,
    warehouses: [{ id: 'a', price: 120, stock: 3 }, { id: 'b', price: 130, stock: 5 }],
    analogues: [{ goodsID: '2', brand: 'NGK', number: '2', name: 'Аналог', warehouses: [{ id: 'c', price: 90, stock: 4 }] }],
  } };
  const offers = getOffers(data);
  assert.equal(offers.length, 3);
  assert.deepEqual(offers.map((offer) => offer.price), [120, 130, 90]);
  assert.deepEqual(offers.map((offer) => offer.stock), [3, 5, 4]);
  assert.equal(offers[2].brand, 'NGK');
});

test('товар без складов не получает цену из устаревшего поля goods.price', () => {
  assert.deepEqual(getOffers({ goods: { brand: 'MEYLE', number: '1', price: 999, count: 0 } }).map((item) => [item.price, item.stock]), [[null, 0]]);
});
