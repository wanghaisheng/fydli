//
// redir.js
// - Redirect function for short URLs not yet in `_redirects`
//
// SPDX-License-Identifier: Jam
//

import { createClient } from '@supabase/supabase-js';
// Use for local testing
// import 'dotenv/config';

// Configure Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Get URL details from Supabase
async function getUrlDetails(short) {

  const {
    data,
    error
  } = await supabase
    .from(process.env.SUPABASE_TABLE)
    .select('short, long, disabled')
    .eq('short', short)
    // Only get a link that is enabled
    .is('disabled', false)
    // Make sure only one is returned
    .single()

  return (error !== null) ? null : data;

};

/**
 * Main
 */
exports.handler = async (event) => {

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 200,
      headers: {
        Allow: "GET"
      },
      body: "Method Not Allowed"
    };
  }

  /**
   * Need `path` (this is the shortURL) and `rawQuery` which is any querystring
   * appended to the short URL (plus queryStringParameters).
   */
  const {
    path,
    queryStringParameters,
    rawQuery
  } = event;
  
  // Remove leading /
  const short = path.slice(1);
  
  // Get details
  const urlDetails = await getUrlDetails(short);

  // console.log(urlDetails)

  /**
   * Return error page
   */
  if (urlDetails === null) {

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <title>404 Not Found | ${process.env.SITE_TITLE}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width">
          <link rel="stylesheet" type="text/css" href="/assets/styles.css">
        </head>
        <body>
          <main>
            <h1>${process.env.SITE_TITLE}</h1>
            <p>Oops! ${path} isn't a valid URL.</p>
            ${ String(process.env.PUBLIC_SITE) === "true" ? `<p><a href="/" title="Shorten a URL">Shorten one</a></p>`:`` }
          </main>
        </body>
      </html>`
    };
  }

  /**
   * Re: `toUrl`
   * 
   * This mimics (as best possible), the behaviour of redirects on Netlify.
   * If the long URL contains a search string, any search string appended to
   * the short URL is dropped. If a long URL does not contain a search string
   * any search string on the short URL is appended to the long URL prior to
   * redirecting.
   * 
   * Example:
   * Long:   https://example.com?some=value&and=another
   * Short:  https://fyd.lig/short?this=value&that=thing
   * Redirects to: https://example.com?some=value&and=another
   * 
   * Example:
   * Long:   https://example.com
   * Short:  https://fyd.li/short?some=value&and=another&this=value&that=thing
   * Redirects to: https://example.com?some=value&and=another&this=value&that=thing
   * 
   * It is possible to append query strings, but this requires defining them in
   * the _redirects file e.g.
   * 
   * /short   some=:q and=:a   https://example.com?some=:q&and=:a
   * 
   * such that
   * https://fyd.li/short?some=thing&and=another
   * is redirected to
   * https://example.com/?some=thing&and=another
   * 
   * If these query strings are present on the short URL, the redirect will in
   * turn fail because they are required conditions.
   * 
   * While it is possible to have `toUrl` account for these and the build script
   * to generate these rules (and alternate rules for when they fail) it also
   * requires a more complex form and function for submitting links. This I have
   * made (and use) elsewhere, but for the purposes of this site, I feel keeping
   * things simple is best.
   * 
   * Best practice: Don't submit a long URL that has a search string to allow
   *     adding search strings to a short URL that will work.
   */
  const toUrl = (() => {

    // Original long URL does not have a search string in it
    if (!urlDetails.long.includes('?') && rawQuery.length > 0) {

      // Append rawQuerty to long URL
      return long.concat('?', rawQuery);

    }

    // There is a search in the original long URL
    return long;

  })({ long } = urlDetails, queryStringParameters, rawQuery);

  /**
   * Return with location header
   * plus fallback html
   */
  return {
    statusCode: 302,
    headers: {
      location: toUrl,
    },
    body: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Redirection... | ${process.env.SITE_TITLE}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" type="text/css" href="/assets/styles.css">
        <meta http-equiv="refresh" content="0; url=${toUrl}">
      </head>
      <body>
        <main>
          <h1>${process.env.SITE_TITLE}</h1>
          <p>Redirecting to <code>${toUrl}</code>.</p>
          <script>window.location = ${toUrl}</script>
        </main>
      </body>
    </html>`
  };

};
