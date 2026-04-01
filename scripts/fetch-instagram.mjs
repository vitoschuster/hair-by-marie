#!/usr/bin/env node
/**
 * Fetches recent posts from a public Instagram profile and downloads
 * images to public/instagram/. Run with: pnpm fetch-instagram
 *
 * No credentials required — works with public profiles.
 * Re-run periodically to refresh the gallery.
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'instagram');
const DATA_FILE = join(ROOT, 'src', 'data', 'instagram.json');
const USERNAME = 'hair__by__marie__';
const MAX_POSTS = 12;

// Browser-like headers to access the public profile
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'X-IG-App-ID': '936619743392459',
  'X-ASBD-ID': '198387',
  'X-IG-WWW-Claim': '0',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Origin': 'https://www.instagram.com',
  'Referer': `https://www.instagram.com/${USERNAME}/`,
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      console.warn(`  Attempt ${i + 1} failed: HTTP ${res.status}`);
    } catch (err) {
      console.warn(`  Attempt ${i + 1} error: ${err.message}`);
    }
    if (i < retries - 1) await sleep(2000 * (i + 1));
  }
  return null;
}

async function fetchInstagramPosts() {
  console.log(`\nFetching Instagram profile: @${USERNAME}\n`);

  // Primary endpoint (works for public profiles)
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`;

  const res = await fetchWithRetry(url, { headers: HEADERS });

  if (!res) {
    throw new Error(
      'Could not reach Instagram API. Try running from a different network or add a VPN. ' +
      'Instagram rate-limits CI/CD IPs — run this script locally and commit the images.'
    );
  }

  const json = await res.json();

  const user = json?.data?.user;
  if (!user) {
    throw new Error(
      'Unexpected API response shape. Instagram may have changed their API. ' +
      `Got: ${JSON.stringify(json).slice(0, 300)}`
    );
  }

  const edges = user.edge_owner_to_timeline_media?.edges ?? [];
  console.log(`Found ${edges.length} posts. Taking first ${MAX_POSTS}.\n`);

  return edges.slice(0, MAX_POSTS).map((edge) => {
    const node = edge.node;
    // For carousel posts, use first image; for video, use thumbnail
    const src =
      node.__typename === 'GraphVideo'
        ? node.thumbnail_src
        : node.display_url;
    return {
      id: node.id,
      shortcode: node.shortcode,
      url: `https://www.instagram.com/p/${node.shortcode}/`,
      src,
      alt: node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 120) || 'Hair by Marie',
      timestamp: node.taken_at_timestamp,
      isVideo: node.__typename === 'GraphVideo',
    };
  });
}

async function downloadImage(post, index) {
  const filename = `${String(index + 1).padStart(2, '0')}-${post.id}.jpg`;
  const filepath = join(OUT_DIR, filename);

  // Skip if already downloaded
  if (existsSync(filepath)) {
    console.log(`  [skip] ${filename} — already exists`);
    return filename;
  }

  const res = await fetchWithRetry(post.src, {
    headers: {
      'User-Agent': HEADERS['User-Agent'],
      'Referer': 'https://www.instagram.com/',
    },
  });

  if (!res) {
    console.warn(`  [fail] Could not download image for post ${post.shortcode}`);
    return null;
  }

  const buffer = await res.arrayBuffer();
  await writeFile(filepath, Buffer.from(buffer));
  console.log(`  [ok]   ${filename}`);
  return filename;
}

async function run() {
  // Ensure output directories exist
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(join(ROOT, 'src', 'data'), { recursive: true });

  let posts;
  try {
    posts = await fetchInstagramPosts();
  } catch (err) {
    console.error(`\nError fetching Instagram: ${err.message}\n`);
    process.exit(1);
  }

  console.log('Downloading images...\n');
  const results = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const filename = await downloadImage(post, i);
    results.push({
      ...post,
      // Replace remote src with local path
      localSrc: filename ? `/instagram/${filename}` : post.src,
      downloaded: !!filename,
    });
    // Polite delay between downloads
    if (i < posts.length - 1) await sleep(300);
  }

  // Write data file for the Gallery component
  const data = {
    username: USERNAME,
    fetchedAt: new Date().toISOString(),
    posts: results.map(({ id, shortcode, url, localSrc, alt, timestamp, isVideo }) => ({
      id, shortcode, url, src: localSrc, alt, timestamp, isVideo,
    })),
  };

  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\nWrote ${results.length} posts to src/data/instagram.json`);
  console.log(`Images saved to public/instagram/\n`);
  console.log('Run `git add public/instagram src/data/instagram.json && git commit -m "Update Instagram gallery"` to commit.\n');
}

run();
