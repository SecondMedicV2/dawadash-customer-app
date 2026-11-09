export function secureServiceUrl(input) {
  const url = new URL(input);
  const loopback = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((!loopback && url.protocol !== 'https:') || url.username || url.password) {
    throw new Error('A secure service URL is required.');
  }
  return url;
}
