function asArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object');
  if (value && typeof value === 'object' && Object.keys(value).length) return [value];
  return [];
}

export function getGoods(data) {
  return asArray(data?.goods).filter((item) => item.brand || item.number || item.name || item.goodsID);
}

export function getBrands(data) {
  return [...new Set(getGoods(data).map((item) => String(item.brand || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ru'));
}

export function getOffers(data) {
  const goods = getGoods(data);
  const products = goods.flatMap((item) => [item, ...asArray(item.analogues)]);
  return products.flatMap((item, productIndex) => {
    const warehouses = asArray(item.warehouses);
    const offerWarehouses = warehouses.length ? warehouses : [null];
    return offerWarehouses.map((warehouse, warehouseIndex) => ({
      id: `${item.goodsID || item.brand || productIndex}-${productIndex}-${warehouse?.id || warehouseIndex}`,
      name: item.name || '—',
      brand: item.brand || '—',
      number: item.number || '—',
      price: warehouse?.price ?? null,
      stock: warehouse?.stock ?? (warehouses.length ? null : 0),
      warehouse: warehouse?.code || warehouse?.id || '—',
    }));
  });
}
