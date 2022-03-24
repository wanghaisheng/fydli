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
    path
  } = event;

  const {
    data,
    error
  } = await supabase
    .from(process.env.SUPABASE_TABLE)
    .select('short, long, disabled')
    .eq('short', path.slice(1))
    // Only get a link that is enabled
    .is('disabled', false)
    // Make sure only one is returned
    .single()

  /**
   * Return error page
   */
  if (urlDetails === null) {

    console.log(error);

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
   * Return with location header
   * plus fallback html
   */
  return {
    statusCode: 301,
    headers: {
      location: data.long,
    },
    body: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Redirection... | ${process.env.SITE_TITLE}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" type="text/css" href="/assets/styles.css">
        <meta http-equiv="refresh" content="0; url=${data.long}">
      </head>
      <body>
        <main>
          <h1>${process.env.SITE_TITLE}</h1>
          <p>Redirecting to <code>${data.long}</code>.</p>
          <script>window.location = ${data.long}</script>
        </main>
      </body>
    </html>`
  };

};
