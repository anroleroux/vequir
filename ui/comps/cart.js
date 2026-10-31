/* ---- cart — the drawer, and the cart_items model behind it ---- */

function cartCount() {
    return cart.items.reduce(function (n, row) { return n + row.qty; }, 0);
}

function cartSubtotal() {
    return cart.items.reduce(function (t, row) {
        var p = productById(row.product_id);
        return t + (p ? p.price * row.qty : 0);
    }, 0);
}

function cartRow(productId) {
    return cart.items.filter(function (row) { return row.product_id === productId; })[0];
}

/* How many more of a part can go in the cart before it outruns stock. */
function roomFor(productId) {
    var p = productById(productId);
    var row = cartRow(productId);
    return p ? p.stock - (row ? row.qty : 0) : 0;
}

/* Save the cart and refresh everything that shows it. The product and
   checkout views read the cart but don't own it, so they are nudged
   with `rev`. */
function persistCart() {
    saveLocal("cart_items", JSON.parse(JSON.stringify(cart.items)));
    header.count = cartCount();
    product.rev = (product.rev || 0) + 1;
    checkout.rev = (checkout.rev || 0) + 1;
}

/* Load the saved cart, dropping parts that have left the catalogue and
   trimming any line to the stock there is. */
function restoreCart() {
    cart.items = loadLocal("cart_items").filter(function (row) {
        var p = productById(row.product_id);
        if (!p || p.stock <= 0) return false;
        row.qty = Math.min(row.qty, p.stock);
        return row.qty > 0;
    });
    persistCart();
}

/* Add n of a part, up to its stock. Returns how many were added. */
function addToCart(productId, n) {
    var add = Math.min(n, roomFor(productId));
    if (add <= 0) return 0;
    var row = cartRow(productId);
    if (row) {
        row.qty += add;
    } else {
        cart.items.push({ id: nextLocalId("cart_items"), product_id: productId, qty: add });
    }
    persistCart();
    return add;
}

function stepLine(id, step) {
    var row = cart.items.filter(function (r) { return r.id === id; })[0];
    if (!row) return;
    if (step > 0 && roomFor(row.product_id) <= 0) return;
    row.qty += step;
    if (row.qty <= 0) return removeLine(id);
    persistCart();
}

function removeLine(id) {
    cart.items = cart.items.filter(function (r) { return r.id !== id; });
    persistCart();
}

function emptyCart() {
    cart.items = [];
    persistCart();
}

function openCart() {
    hideToast();
    cart.open = true;
    document.body.classList.add("is-locked");
}

function closeCart() {
    if (!cart.open) return;
    cart.open = false;
    document.body.classList.remove("is-locked");
}

function cartLine(row) {
    var p = productById(row.product_id);
    if (!p) return "";
    return '<div class="line">' +
               '<a class="thumb thumb--m' + (isHouse(p) ? ' thumb--house' : '') + '" ' +
                   linkAttrs(productPath(p), "openProduct(" + p.id + ")") + '>' + esc(p.code) + '</a>' +
               '<div class="line__body">' +
                   '<div class="line__top">' +
                       '<span class="line__name">' + esc(p.name) + '</span>' +
                       '<span class="line__amount">' + money(p.price * row.qty) + '</span>' +
                   '</div>' +
                   '<div class="line__bottom">' +
                       '<div class="mini-stepper">' +
                           '<button type="button" onclick="stepLine(' + row.id + ', -1)" aria-label="One fewer">−</button>' +
                           '<span>' + row.qty + '</span>' +
                           '<button type="button" onclick="stepLine(' + row.id + ', 1)" aria-label="One more"' +
                               (roomFor(p.id) <= 0 ? ' disabled' : '') + '>+</button>' +
                       '</div>' +
                       '<button class="line__remove" type="button" onclick="removeLine(' + row.id + ')">Remove</button>' +
                   '</div>' +
               '</div>' +
           '</div>';
}

function freeShippingBar(subtotal) {
    var threshold = freeThreshold();
    if (threshold === null) return "";
    var free = subtotal >= threshold;
    var pct = Math.min(100, subtotal / threshold * 100);
    return '<div class="free">' +
               '<span class="free__label">' +
                   (free ? 'Free shipping unlocked.' : money(threshold - subtotal) + ' to free shipping') + '</span>' +
               '<div class="free__track"><div class="free__fill" style="width:' + pct + '%"></div></div>' +
           '</div>';
}

function cartTemplate(state) {
    if (!state.open) return "";
    var count = cartCount();
    var subtotal = cartSubtotal();

    var body = count === 0
        ? '<div class="drawer__empty">' +
              '<span>Open<br>circuit.</span>' +
              '<button class="btn btn--blue btn--small" type="button" onclick="openList(null)">Find parts</button>' +
          '</div>'
        : '<div class="drawer__lines">' + state.items.map(cartLine).join("") + '</div>' +
          '<div class="drawer__foot">' +
              freeShippingBar(subtotal) +
              '<div class="subtotal"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
              '<button class="btn btn--blue btn--tall btn--invert" type="button" onclick="openCheckout()">Checkout →</button>' +
          '</div>';

    return '<div class="drawer" onclick="closeCart()">' +
               '<aside class="drawer__panel" role="dialog" aria-modal="true" aria-label="Cart" onclick="event.stopPropagation()">' +
                   '<div class="drawer__head">' +
                       '<span class="drawer__title">Cart <span class="drawer__count">' + count + '</span></span>' +
                       '<button class="drawer__close" type="button" onclick="closeCart()" aria-label="Close">✕</button>' +
                   '</div>' +
                   body +
               '</aside>' +
           '</div>';
}

var cart = mount(
    document.getElementById("cart"),
    { open: false, items: [] },
    cartTemplate
);
