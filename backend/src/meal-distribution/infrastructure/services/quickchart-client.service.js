const DEFAULT_BASE_URL = 'https://quickchart.io';
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Fetches a chart PNG buffer from QuickChart.
 * Uses POST to avoid URL-length limits on complex configs.
 *
 * @param {object} chartJsConfig  - A Chart.js v2/v3 config object.
 * @param {object} [options]
 * @param {number} [options.width=500]
 * @param {number} [options.height=300]
 * @param {string} [options.backgroundColor='#ffffff']
 * @param {'png'|'webp'} [options.format='png']
 * @returns {Promise<Buffer|null>}  PNG buffer, or null on failure.
 */
export async function fetchChartImage(chartJsConfig, options = {}) {
  const {
    width = 500,
    height = 300,
    backgroundColor = '#ffffff',
    format = 'png',
  } = options;

  const baseUrl = process.env.QUICKCHART_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const url = `${baseUrl}/chart`;

  const body = {
    chart: chartJsConfig,
    width,
    height,
    backgroundColor,
    format,
    devicePixelRatio: 2,
  };

  const apiKey = process.env.QUICKCHART_API_KEY?.trim();
  if (apiKey) {
    body.key = apiKey;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.error(`[QuickChart] ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('[QuickChart] failed:', err?.message || err);
    return null;
  }
}
