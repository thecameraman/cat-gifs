/**
 * Auto-generate gifs.json from Reddit RSS, but ONLY include GIFs that load successfully.
 * No API keys. GitHub Action safe. Stable.
 */

import Parser from "rss-parser";
import fs from "fs";
import fetch from "node-fetch";

const parser = new Parser();

// Subreddits to scrape GIFs from
const subreddits = [
  "catgifs",
  "CatMemes",
  "Kittens",
  "cats",
  "CatPictures",
];

// Checks if GIF URL is valid (200 OK)
async function urlWorks(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function scrapeRedditForGifs() {
  let collected = [];

  for (const sub of subreddits) {
    try {
      const feed = await parser.parseURL(`https://www.reddit.com/r/${sub}/.rss`);

      feed.items.forEach(item => {
        const regex = /https:\/\/i\.redd\.it\/[A-Za-z0-9]+\.gif/;
        const match = item.content?.match(regex) || item.link?.match(regex);

        if (match) {
          collected.push(match[0]);
        }
      });

    } catch (err) {
      console.log(`Failed subreddit ${sub}:`, err.message);
    }
  }

  // Deduplicate
  collected = [...new Set(collected)];

  console.log(`Found ${collected.length} GIF candidates. Checking availability...`);

  // Validate URLs
  const working = [];
  for (const url of collected) {
    const ok = await urlWorks(url);
    if (ok) {
      working.push(url);
      console.log("✔ OK:", url);
    } else {
      console.log("✖ Bad:", url);
    }
  }

  const output = {
    updated: new Date().toISOString(),
    count: working.length,
    gifs: working
  };

  fs.writeFileSync("gifs.json", JSON.stringify(output, null, 2));

  console.log("Saved", working.length, "working GIFs.");
}

scrapeRedditForGifs();
