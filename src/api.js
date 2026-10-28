export async function searchParts({ number, brand }, signal) {
  const params = new URLSearchParams({ number });
  if (brand) params.set('brand', brand);
  let response;
  try {
    response = await fetch(`/api/search?${params}`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Не удалось подключиться к серверу приложения');
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Сервер вернул некорректный ответ'); }
  if (!response.ok || data?.error) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Ошибка сервиса запчастей');
  }
  return data;
}
