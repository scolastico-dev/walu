export async function reloadApp(): Promise<void> {
  const index = await fetch('/index.html', { cache: 'no-store' });
  if (!index.ok) throw new Error('Failed to fetch index.html');
  const text = await index.text();
  try {
    document.open();
    document.write(text);
    document.close();
  } catch (e) {
    console.warn('[WALU] Document write failed:', e);
    console.log('[WALU] Using document.body fallback for reload...');
    const currentHeadElements = document.head.querySelectorAll('script, link[rel="stylesheet"], style');
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(text, 'text/html');
    const newBodyContent = newDoc.body.innerHTML;
    document.body.innerHTML = newBodyContent;
    currentHeadElements.forEach(el => {
      const clonedEl = el.cloneNode(true);
      document.body.appendChild(clonedEl);
    });
    document.head.innerHTML = '';
  }
}
