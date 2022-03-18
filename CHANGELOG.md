# CHANGELOG

## v0.2.0

This version adds the ability for the link creator to remove links from service without sign up / log in. This keeps the service anonymous as no personal details *(i.e. name, email address)* are ever known or stored.

  ### Key Notes

  - Added code to generate user ID using [`crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) and save to [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage) to `index.html`;
  - ID is sent with all link creation requests (will fail without);
  - Added `list.html` for user to manage links they have created, retrieved via `link-list.js` function; client-side JS renders list;    
    ***Caveat:** if local storage is deleted, user ID is regenerated and all previous links lost to use (though they still work)*
  - Links do not get deleted, only **disabled**. This is to stop the possibility that a deleted code could get created again (because using random generation);    
    ***Caveat:** As site rebuilds are trigger hourly/daily/weekly/etc. the link will still redirect until the next rebuild;*
  - Updated SQL to add `user_id`;

  ### New/Updates Functions/Files
  
  - `link-list.js` (new): retrieve list of user-created links;
  - `update-code.js` (new): update (by disabling) a user-created link;
  - `new-link.js` (updated): added `user_id` sending;
  - `link-list.html` (new): list user-created link, allow *deletion*;
  - `assets/styles.ccs` (updated): styling for link list page.

**†Note:** Safari *(macOS/iOS)* only supports `crypto.randomUUID()` from 15.4 as per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID#browser_compatibility).
**‡Note:** Never written a CHANGELOG before, so excuse me if I screwed it up! 🙃

## v0.1.0

Initial Release
