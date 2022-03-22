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
  } = event;
  
  // Remove leading /
  const short = path.slice(1);
  
  // Get details
  const urlDetails = await getUrlDetails(short);

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

  // Determine/Build URL to redirect to
  const toUrl = (() => {

    const url = new URL(long);

    // Short URL has search parameters
    // e.g. fyd.li/sh0rt?some=thing&and=this
    if (Object.keys(queryStringParameters).length > 0) {
      
      Object.keys(queryStringParameters).forEach(key => {
        
        // Possible to modify default key/value pairs
        if (url.searchParams.has(key)) {
          url.searchParams.set(key, queryStringParameters[key])
        }
        // Append additional key/value pairs
        else {
          url.searchParams.append(key, queryStringParameters[key])
        }
      })
    }

    // Return the url string
    return url.href;

  })({ long } = urlDetails, queryStringParameters);

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
        <title>Redirecting... | ${process.env.SITE_TITLE}</title>
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
