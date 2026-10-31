/* ============================================================
   VeqIR — layout.js
   The shell the composer wraps around every component: the reactive
   core, the localStorage data layer, the demo seed, shared helpers
   and the router, then the components themselves.
   ============================================================ */

/* {{reactivity-js}} */

/* ---- The data layer ----
   One localStorage key per model, holding that model's JSON array.
   Relations are ids (products.category_id → categories.id), joined in
   the helpers below rather than in storage. Ids are local and
   monotonic, mirroring a database auto-increment, so the same code
   keeps working when a back end lands behind //online markers. See
   the models in the README. */

function loadLocal(model) {
    try {
        return JSON.parse(localStorage.getItem(model)) || [];
    } catch (e) {
        return [];                      // storage blocked or corrupt → empty
    }
}

function saveLocal(model, rows) {
    try {
        localStorage.setItem(model, JSON.stringify(rows));
    } catch (e) { /* storage blocked → the page still works, nothing persists */ }
}

function nextLocalId(model) {
    return loadLocal(model).reduce(function (max, row) {
        return row.id > max ? row.id : max;
    }, 0) + 1;
}

/* {{demo-js}} */

/* ---- Catalogue lookups ---- */

function byPosition(a, b) { return a.position - b.position; }

function categories() { return loadLocal("categories").sort(byPosition); }
function products() { return loadLocal("products").sort(byPosition); }
function shippingMethods() { return loadLocal("shipping_methods").sort(byPosition); }

function findBy(model, key, value) {
    return loadLocal(model).filter(function (row) { return row[key] === value; })[0];
}

function productById(id) { return findBy("products", "id", id); }
function productBySlug(slug) { return findBy("products", "slug", slug); }
function categoryById(id) { return findBy("categories", "id", id); }
function categoryBySlug(slug) { return findBy("categories", "slug", slug); }
function shippingById(id) { return findBy("shipping_methods", "id", id); }
function orderByNumber(number) { return findBy("orders", "number", number); }

function specsOf(productId) {
    return loadLocal("specs").filter(function (s) { return s.product_id === productId; }).sort(byPosition);
}

/* ---- Shared helpers ---- */

var CURRENCY = "$";

function money(amount) { return CURRENCY + Number(amount).toFixed(2); }

/* Round to whole cents, so sums of prices store as 9.3, not 9.2999…. */
function cents(amount) { return Math.round(amount * 100) / 100; }

/* VeqIR's own devices are drawn on blue, everything else on black. */
function isHouse(p) {
    var c = categoryById(p.category_id);
    return !!(c && c.house);
}

function stockLabel(p) {
    if (p.stock <= 0) return "Out of stock";
    if (p.stock <= 5) return "Only " + p.stock + " left";
    return "In stock";
}

/* The first two spec values, as a one-line summary under a card. */
function specLine(p) {
    return specsOf(p.id).slice(0, 2).map(function (s) { return s.value; }).join(" · ");
}

/* The price slider's top stop: $100, or higher if the range grows. */
function priceCap() {
    return products().reduce(function (max, p) { return Math.max(max, Math.ceil(p.price)); }, 100);
}

/* What a shipping method costs on a given subtotal. */
function shippingCost(method, subtotal) {
    if (!method) return 0;
    return method.free_over !== null && subtotal >= method.free_over ? 0 : method.price;
}

/* The free-shipping threshold the cart drawer counts towards. */
function freeThreshold() {
    var m = shippingMethods().filter(function (s) { return s.free_over !== null; })[0];
    return m ? m.free_over : null;
}

var ICON_SEARCH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>';
var ICON_CART = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 4h2l2.4 11h11l2-8H6.2"></path><circle cx="9" cy="20" r="1.4"></circle><circle cx="18" cy="20" r="1.4"></circle></svg>';

/* ---- Addresses ----
   Every view has a path under the site's base (the <base href> the
   build writes):  ""  all parts · "<category>"  one category ·
   "parts/<product>"  a part · "checkout" · "order/<number>"  a placed
   order. GitHub Pages has no routing, so the build also publishes the
   page as 404.html: any deep path loads it and applyRoute() reads the
   path. Opened from disk (file://) there are no paths, only views. */

var BASE = new URL(document.baseURI).pathname;
var ROUTING = location.protocol !== "file:";
var SITE_TITLE = document.title;
var applyingRoute = false;

function categoryPath(slug) { return slug || ""; }
function productPath(p) { return "parts/" + p.slug; }

/* Record a view's path in the address bar — unless the view is being
   shown *because of* the address bar. */
function go(path, replace) {
    if (ROUTING && !applyingRoute && BASE + path !== location.pathname) {
        history[replace ? "replaceState" : "pushState"](null, "", BASE + path);
    }
}

function setTitle(title) {
    document.title = title ? title + " — VeqIR" : SITE_TITLE;
}

/* An <a> into the site: a real href (so new-tab and copy-link work)
   whose plain click navigates in place. `call` is the JS to run. */
function linkAttrs(path, call) {
    return 'href="' + esc(path || "./") + '" onclick="return follow(event, function () { ' + call + '; })"';
}

function follow(event, view) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) return true;
    event.preventDefault();
    view();
    return false;
}

/* Show whatever the address bar names. Runs on load and on
   back/forward. */
function applyRoute() {
    var path = "";
    if (ROUTING) {
        path = decodeURIComponent(location.pathname.indexOf(BASE) === 0
            ? location.pathname.slice(BASE.length) : location.pathname);
    }
    var parts = path.replace(/^\/+|\/+$/g, "").replace(/^index\.html$/, "").split("/").filter(Boolean);

    applyingRoute = true;
    try {
        if (parts[0] === "checkout") return showCheckout();
        if (parts[0] === "order" && parts[1] && orderByNumber(parts[1])) return showDone(parts[1]);
        if (parts[0] === "parts" && parts[1]) {
            var p = productBySlug(parts[1]);
            if (p) return showProduct(p.id);
        }
        var c = parts[0] && categoryBySlug(parts[0]);
        showList(c ? c.slug : null);
    } finally {
        applyingRoute = false;
    }
}

window.addEventListener("popstate", applyRoute);

/* ---- Views ----
   Four mounts share <main>: `listing`, `product`, `checkout` and
   `done`. Each renders nothing unless it is the current view, so
   switching is a few assignments. show*() switch the view; the open*()
   the page calls also move the address bar and the scroll. */

function hideViews() {
    listing.visible = false;
    product.current = null;
    checkout.visible = false;
    done.number = null;
    closeCart();
    closeSearch();
}

function showList(slug) {
    hideViews();
    listing.cat = slug;
    listing.visible = true;
    var c = slug && categoryBySlug(slug);
    setTitle(c ? c.name : null);
}

function showProduct(id) {
    hideViews();
    product.qty = 1;
    product.current = id;
    setTitle(productById(id).name);
}

function showCheckout() {
    hideViews();
    checkout.visible = true;
    setTitle("Checkout");
}

function showDone(number) {
    hideViews();
    done.number = number;
    setTitle("Order " + number);
}

function openList(slug) {
    showList(slug);
    go(categoryPath(slug));
    window.scrollTo({ top: 0 });
}

function openProduct(id) {
    showProduct(id);
    go(productPath(productById(id)));
    window.scrollTo({ top: 0 });
}

function openCheckout() {
    showCheckout();
    go("checkout");
    window.scrollTo({ top: 0 });
}

function openDone(number) {
    showDone(number);
    go("order/" + number, true);        // back from the receipt skips the spent checkout
    window.scrollTo({ top: 0 });
}

/* {{header-js}} */
/* {{listing-js}} */
/* {{product-js}} */
/* {{checkout-js}} */
/* {{done-js}} */
/* {{cart-js}} */
/* {{search-js}} */
/* {{toast-js}} */

/* ---- Keys ----  "/" opens search, Escape closes whatever is open. */

window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeSearch();
        closeCart();
    }
    var typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName);
    if (e.key === "/" && !typing) {
        e.preventDefault();
        openSearch();
    }
});

/* ---- Start ---- */

function start() {
    seedDemo();
    listing.maxPrice = priceCap();
    restoreCart();
    applyRoute();
}

start();
