export async function reloadApp(): Promise<void> {
  const index = await fetch('/index.html', { cache: 'no-store' });
  if (!index.ok) throw new Error('Failed to fetch index.html');
  const text = await index.text();
  document.body.innerHTML = text;
}
