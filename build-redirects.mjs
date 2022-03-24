//
// build-redirects.js
// - Function to add new link to Supabase
//
// SPDX-License-Identifier: Jam
//

/**
 * Generate a `_redirects` file (and other things should the need arise.)
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
// Use for local testing
// import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY, // Public key
);

/**
 * Get short URLs from Supabase
 * 
 * Supabase will return 1000 records by default. If more than 1000 records
 * exist this script will require modifying to accommodate multiple calls to
 * retreive all records.
 */
async function getAllUrls() {

  const {
    data,
    error
  } = await supabase
    .from(process.env.SUPABASE_TABLE)
    .select('short, long, disabled')
    // Only get links that aren't disabled.
    .is('disabled', false)

  return (error !== null) ? error : data;
}

/**
 * Main function
 */
export async function buildRedirects(outDir) {

  const urls = await getAllUrls();

  // An error was received
  if (urls.message) {
    console.log("Error retreiving URLs");
    console.log(urls.message);
    return false;
  }

  // Got data, continue
  let redirects = "";
  
  /**
   * Force redirection of `netlify.app` sub-domain to main domain.
   * Could use a `:splat` if desired
   * 
   * UNCOMMENT THIS LINE ONLY IF YOU ARE USING A CUSTOM DOMAIN.
   */
  // redirects = redirects.concat('https://', process.env.SITE_NAME, '.netlify.app/*   ', process.env.URL, "    301!\n");
  
  // Now add short URLs
  urls.forEach(url => {
    redirects = redirects.concat("/", url.short.padEnd(10, ' '), url.long, "\n")
  });

  // Write out new _redirects file
  fs.writeFileSync(`${outDir}/_redirects`, redirects, (err) => {
    if (err) {
      console.error(`error writing to file ${outDir}/_redirects.`);
      return false;
    }
  });
};
