import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const filePrefix = 'frizerski-salon_vukomerec-36-zagreb_hair-by-marie';
const snapshotPattern = new RegExp(`^${filePrefix}_(\\d{4,})_\\d{8}T\\d{6}[+-]\\d{4}\\.csv$`);
const columns = [
  'kategorija',
  'naziv_usluge',
  'maloprodajna_cijena_eur',
  'poseban_oblik_prodaje',
  'naziv_posebnog_oblika_prodaje',
  'sidrena_cijena_eur',
  'datum_sidrene_cijene',
  'valuta',
];

const digest = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value;
}

function isoDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date.`);
  }
  return value;
}

// Work in integer cents so amounts such as 0.50 never lose precision.
export function euroAmount(value, field = 'Price') {
  const match = typeof value === 'string' && value.trim().match(/^(\d+)(?:[.,](\d{1,2}))?\s*€?$/u);
  if (!match) throw new Error(`${field} must be a non-negative EUR amount with at most two decimal places.`);
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${field} is too large.`);
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

export function csvField(value) {
  const text = String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createPriceCsv(pricing) {
  isoDate(pricing?.anchorDate, 'anchorDate');
  requiredText(pricing.anchorDateLabel, 'anchorDateLabel');
  if (!Array.isArray(pricing.categories) || pricing.categories.length === 0) {
    throw new Error('categories must be a non-empty array.');
  }
  const categoryIds = new Set();
  const rows = [];
  for (const category of pricing.categories) {
    const id = requiredText(category.id, 'Category ID');
    const label = requiredText(category.label, `Category ${id} label`);
    if (categoryIds.has(id)) throw new Error(`Duplicate category ID: ${id}.`);
    categoryIds.add(id);
    if (!Array.isArray(category.services) || category.services.length === 0) {
      throw new Error(`Category ${id} must contain services.`);
    }
    const serviceNames = new Set();
    for (const service of category.services) {
      const name = requiredText(service.name, `Service in ${id}`);
      if (serviceNames.has(name)) throw new Error(`Duplicate service in ${id}: ${name}.`);
      serviceNames.add(name);
      const retail = euroAmount(service.price, `${name} current price`);
      const anchor = euroAmount(service.anchorPrice, `${name} anchor price`);
      const anchorDate = service.anchorDate === undefined
        ? pricing.anchorDate : isoDate(service.anchorDate, `${name} anchor date`);
      if (service.discountApplied !== undefined && typeof service.discountApplied !== 'boolean') {
        throw new Error(`${name} discountApplied must be true or false.`);
      }
      const discounted = service.discountApplied ?? false;
      const discountName = discounted
        ? requiredText(service.discountName, `${name} discountName`) : '';
      if (!discounted && service.discountName) {
        throw new Error(`${name} has a discountName but discountApplied is false.`);
      }
      rows.push([label, name, retail, discounted, discountName, anchor, anchorDate, 'EUR']);
    }
  }
  const csv = [columns, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
  return { csv, serviceCount: rows.length, sha256: digest(csv) };
}

function zagrebTimestamp(now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const offset = parts.timeZoneName === 'GMT' ? '+00:00' : parts.timeZoneName.replace('GMT', '');
  return {
    filename: `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}${offset.replace(':', '')}`,
    iso: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`,
    dateLabel: `${Number(parts.day)}. ${Number(parts.month)}. ${parts.year}.`,
  };
}

async function readManifest(path) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, lists: [] };
    throw error;
  }
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.lists)) {
    throw new Error('Invalid price-lists.json manifest. Expected schemaVersion 1 and lists array.');
  }
  return manifest;
}

async function verifyArchives(manifest, csvDirectory) {
  const filenames = new Set();
  let previousSequence = Infinity;
  for (const entry of manifest.lists) {
    const match = typeof entry.filename === 'string' && entry.filename.match(snapshotPattern);
    if (!match || !Number.isSafeInteger(entry.sequence) || entry.sequence < 1
      || entry.sequence !== Number(match[1]) || entry.sequence >= previousSequence
      || filenames.has(entry.filename) || entry.url !== `/cjenici/${entry.filename}`
      || !/^[a-f0-9]{64}$/.test(entry.sha256)
      || !Number.isSafeInteger(entry.serviceCount) || entry.serviceCount < 1
      || !Number.isFinite(Date.parse(entry.publishedAt))) {
      throw new Error('Invalid snapshot entry in price-lists.json; keep snapshots newest first.');
    }
    isoDate(entry.anchorDate, 'Snapshot anchorDate');
    requiredText(entry.publishedAtZagreb, 'Snapshot publishedAtZagreb');
    requiredText(entry.publishedDateLabel, 'Snapshot publishedDateLabel');
    filenames.add(entry.filename);
    previousSequence = entry.sequence;
    let contents;
    try {
      contents = await readFile(join(csvDirectory, entry.filename), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Missing archived CSV: ${entry.filename}. Restore the committed file before exporting.`);
      }
      throw error;
    }
    if (digest(contents) !== entry.sha256) {
      throw new Error(`CSV snapshot was modified: ${entry.filename}. Restore the archive; export price changes as a new snapshot.`);
    }
  }
}

export async function exportPrices({ rootDir = projectRoot, checkOnly = false, force = false, now = new Date() } = {}) {
  if (checkOnly && force) throw new Error('--check and --force cannot be combined.');
  const pricing = JSON.parse(await readFile(join(rootDir, 'src/data/pricing.json'), 'utf8'));
  const current = createPriceCsv(pricing);
  const manifestPath = join(rootDir, 'src/data/price-lists.json');
  const csvDirectory = join(rootDir, 'public/cjenici');
  const manifest = await readManifest(manifestPath);
  await verifyArchives(manifest, csvDirectory);
  const latest = manifest.lists[0];
  const upToDate = latest?.sha256 === current.sha256
    && latest.serviceCount === current.serviceCount && latest.anchorDate === pricing.anchorDate;
  if (checkOnly) {
    if (!upToDate) throw new Error('CSV price list is missing or stale. Run pnpm export-prices, then commit the CSV and metadata.');
    return { status: 'checked', serviceCount: current.serviceCount, entry: latest };
  }
  if (upToDate && !force) return { status: 'unchanged', serviceCount: current.serviceCount, entry: latest };

  const sequence = (latest?.sequence ?? 0) + 1;
  const timestamp = zagrebTimestamp(now);
  const filename = `${filePrefix}_${String(sequence).padStart(4, '0')}_${timestamp.filename}.csv`;
  const entry = {
    sequence,
    filename,
    url: `/cjenici/${filename}`,
    publishedAt: now.toISOString(),
    publishedAtZagreb: timestamp.iso,
    publishedDateLabel: timestamp.dateLabel,
    serviceCount: current.serviceCount,
    anchorDate: pricing.anchorDate,
    sha256: current.sha256,
  };
  await mkdir(csvDirectory, { recursive: true });
  const csvPath = join(csvDirectory, filename);
  await writeFile(csvPath, current.csv, { encoding: 'utf8', flag: 'wx' });
  const temporaryManifest = `${manifestPath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryManifest, JSON.stringify({ ...manifest, lists: [entry, ...manifest.lists] }, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    await rename(temporaryManifest, manifestPath);
  } catch (error) {
    await rm(temporaryManifest, { force: true });
    await rm(csvPath, { force: true });
    throw error;
  }
  return { status: 'exported', serviceCount: current.serviceCount, entry };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node scripts/export-prices.mjs [--check | --force]\nExports changed prices only. --force publishes a new snapshot even without a price change.');
  } else {
    try {
      if (args.some((arg) => !['--check', '--force'].includes(arg))) throw new Error('Unknown option. Use --help for usage.');
      const result = await exportPrices({ checkOnly: args.includes('--check'), force: args.includes('--force') });
      console.log(`Price CSV ${result.status}: ${result.serviceCount} services — ${result.entry.url}`);
    } catch (error) {
      console.error(`Price CSV: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
