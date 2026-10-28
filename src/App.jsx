import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrands, fetchOffers, resetOffers, resetSearch } from './store.js';
import { getBrands, getOffers } from './normalize.js';

function Loading({ text }) {
  return <div className="status loading" role="status"><span className="spinner" aria-hidden="true" />{text}</div>;
}

function ErrorMessage({ message, onRetry }) {
  return <div className="status error" role="alert"><span>{message}</span><button type="button" onClick={onRetry}>Повторить</button></div>;
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(number) : '—';
}

export function App() {
  const dispatch = useDispatch();
  const state = useSelector((root) => root.parts);
  const [number, setNumber] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const trimmedNumber = number.trim();
  const brands = getBrands(state.brands);
  const offers = getOffers(state.offers);

  useEffect(() => {
    if (!trimmedNumber) return;
    const timer = setTimeout(() => { promise = dispatch(fetchBrands(trimmedNumber)); }, 450);
    let promise;
    return () => { clearTimeout(timer); promise?.abort(); };
  }, [dispatch, trimmedNumber]);

  useEffect(() => {
    if (!trimmedNumber || !selectedBrand) return;
    const promise = dispatch(fetchOffers({ number: trimmedNumber, brand: selectedBrand }));
    return () => promise.abort();
  }, [dispatch, trimmedNumber, selectedBrand]);

  function onNumberChange(event) {
    setNumber(event.target.value);
    setSelectedBrand('');
    dispatch(resetSearch());
  }

  function onBrandChange(event) {
    setSelectedBrand(event.target.value);
    dispatch(resetOffers());
  }

  return <main className="container">
    <header className="header">
      <p className="eyebrow">Подбор номенклатуры</p>
      <h1>Поиск автозапчастей и аналогов</h1>
      <p className="intro">Введите артикул, выберите производителя и просмотрите предложения по складам.</p>
    </header>

    <section className="panel" aria-labelledby="article-heading">
      <div className="step-heading"><span className="step">1</span><h2 id="article-heading">Артикул и производитель</h2></div>
      <label htmlFor="number">Артикул детали</label>
      <input id="number" name="number" type="text" value={number} onChange={onNumberChange} placeholder="Введите номер детали" autoComplete="off" />
      {trimmedNumber && state.brandsStatus === 'loading' && <Loading text="Ищем производителей…" />}
      {trimmedNumber && state.brandsStatus === 'failed' && <ErrorMessage message={state.brandsError} onRetry={() => dispatch(fetchBrands(trimmedNumber))} />}
      {trimmedNumber && state.brandsStatus === 'succeeded' && brands.length === 0 && <p className="status empty">По этому артикулу производители не найдены.</p>}
      {brands.length > 0 && <div className="brand-field">
        <label htmlFor="brand">Производитель</label>
        <select id="brand" value={selectedBrand} onChange={onBrandChange}>
          <option value="">Выберите производителя</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
      </div>}
    </section>

    {selectedBrand && <section className="panel" aria-labelledby="offers-heading">
      <div className="step-heading"><span className="step">2</span><h2 id="offers-heading">Аналоги и предложения</h2></div>
      <p className="selection">Артикул: <strong>{trimmedNumber}</strong> · Производитель: <strong>{selectedBrand}</strong></p>
      {state.offersStatus === 'loading' && <Loading text="Загружаем предложения…" />}
      {state.offersStatus === 'failed' && <ErrorMessage message={state.offersError} onRetry={() => dispatch(fetchOffers({ number: trimmedNumber, brand: selectedBrand }))} />}
      {state.offersStatus === 'succeeded' && offers.length === 0 && <p className="status empty">Аналоги и предложения не найдены.</p>}
      {state.offersStatus === 'succeeded' && offers.length > 0 && <div className="table-wrap"><table>
        <thead><tr><th>Название / производитель</th><th>Артикул</th><th>Цена</th><th>Остаток</th><th>Склад</th></tr></thead>
        <tbody>{offers.map((offer) => <tr key={offer.id}>
          <td><strong>{offer.name}</strong><span className="secondary">{offer.brand}</span></td>
          <td>{offer.number}</td>
          <td>{offer.price == null ? '—' : formatNumber(offer.price)}</td>
          <td>{offer.stock == null ? '—' : formatNumber(offer.stock)}</td>
          <td>{offer.warehouse}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>}
  </main>;
}
