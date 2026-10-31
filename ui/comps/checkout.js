/* ---- checkout — contact, shipping, payment and the order summary ----

   Typed values live in `_draft`, which the reactive core never watches:
   typing doesn't re-render, and picking a shipping method (which does)
   writes the typed values straight back into the fields. */

function draftField(name, label, attrs, classes) {
    var value = checkout._draft[name] || "";
    return '<label class="field ' + (classes || "") + '">' + label +
               '<input name="' + name + '" value="' + esc(value) + '" ' + attrs + ' ' +
                   'oninput="checkout._draft.' + name + ' = this.value">' +
           '</label>';
}

function checkoutTemplate(state) {
    if (!state.visible) return "";
    var subtotal = cartSubtotal();
    var count = cartCount();
    var method = shippingById(state.ship) || shippingMethods()[0];
    var ship = shippingCost(method, subtotal);

    var options = shippingMethods().map(function (m) {
        var cost = shippingCost(m, subtotal);
        return '<button type="button" class="ship-opt' + (method && m.id === method.id ? ' is-on' : '') + '" ' +
                   'onclick="checkout.ship = ' + m.id + '" aria-pressed="' + (method && m.id === method.id) + '">' +
                   '<span class="ship-opt__text"><span class="ship-opt__name">' + esc(m.name) + '</span>' +
                       '<span class="ship-opt__eta">' + esc(m.eta) + '</span></span>' +
                   '<span class="ship-opt__price">' + (cost ? money(cost) : 'Free') + '</span>' +
               '</button>';
    }).join("");

    var lines = cart.items.map(function (row) {
        var p = productById(row.product_id);
        if (!p) return "";
        return '<div class="summary__line">' +
                   '<div class="thumb thumb--s' + (isHouse(p) ? ' thumb--house' : '') + '">' + esc(p.code) + '</div>' +
                   '<span class="summary__name">' + esc(p.name) + ' <span class="summary__qty">×' + row.qty + '</span></span>' +
                   '<span class="summary__amount">' + money(p.price * row.qty) + '</span>' +
               '</div>';
    }).join("");

    return '<section class="view view--checkout">' +
               '<div class="checkout-head">' +
                   '<h1 class="display">Checkout</h1>' +
                   '<a class="back-link" ' + linkAttrs("", "openList(null)") + '>← Keep shopping</a>' +
               '</div>' +
               '<form class="checkout" onsubmit="placeOrder(event)">' +
                   '<div class="checkout__fields">' +
                       '<fieldset class="fieldset fieldset--one">' +
                           '<legend class="label">01 — Contact</legend>' +
                           draftField("email", "Email", 'type="email" required placeholder="you@lab.dev" autocomplete="email"') +
                       '</fieldset>' +
                       '<fieldset class="fieldset">' +
                           '<legend class="label">02 — Shipping</legend>' +
                           draftField("name", "Full name", 'required autocomplete="name"', "wide") +
                           draftField("address", "Address", 'required autocomplete="street-address"', "wide") +
                           draftField("city", "City", 'required autocomplete="address-level2"') +
                           draftField("postcode", "Postcode", 'required autocomplete="postal-code"') +
                           '<div class="ship-opts wide">' + options + '</div>' +
                       '</fieldset>' +
                       '<fieldset class="fieldset">' +
                           '<legend class="label">03 — Payment</legend>' +
                           draftField("card", "Card number", 'required inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="cc-number"', "field--mono wide") +
                           draftField("expiry", "Expiry", 'required placeholder="MM / YY" autocomplete="cc-exp"', "field--mono") +
                           draftField("cvc", "CVC", 'required inputmode="numeric" placeholder="123" autocomplete="cc-csc"', "field--mono") +
                           '<p class="pay-note">Demo shop — no payment is taken and card details are never stored.</p>' +
                       '</fieldset>' +
                   '</div>' +
                   '<aside class="summary">' +
                       '<h2 class="label">Order — ' + count + ' items</h2>' +
                       lines +
                       '<div class="summary__sums">' +
                           '<div><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
                           '<div><span>Shipping</span><span>' + (ship ? money(ship) : 'Free') + '</span></div>' +
                       '</div>' +
                       '<div class="summary__total"><span>Total</span><span>' + money(subtotal + ship) + '</span></div>' +
                       '<button class="btn btn--blue btn--tall btn--invert" type="submit"' + (count ? '' : ' disabled') + '>Place order</button>' +
                   '</aside>' +
               '</form>' +
           '</section>';
}

var checkout = mount(
    document.getElementById("checkout"),
    { visible: false, ship: 1, _draft: {} },
    checkoutTemplate
);

/* An order number nobody else in this browser has had. */
function newOrderNumber() {
    var n;
    do { n = "VQ-" + Math.floor(100000 + Math.random() * 900000); } while (orderByNumber(n));
    return n;
}

/* Record the order and its lines locally, take the parts out of stock,
   empty the cart and show the receipt. Card fields are read by nobody. */
function placeOrder(event) {
    event.preventDefault();
    if (!cart.items.length) return;
    var d = checkout._draft;
    var subtotal = cents(cartSubtotal());
    var method = shippingById(checkout.ship) || shippingMethods()[0];
    var ship = shippingCost(method, subtotal);
    var orderId = nextLocalId("orders");
    var number = newOrderNumber();

    var orders = loadLocal("orders");
    orders.push({
        id: orderId, number: number,
        email: d.email || "", name: d.name || "", address: d.address || "",
        city: d.city || "", postcode: d.postcode || "",
        shipping_method_id: method ? method.id : null,
        subtotal: subtotal, shipping: ship, total: cents(subtotal + ship),
        created_at: new Date().toISOString()
    });
    saveLocal("orders", orders);

    var items = loadLocal("order_items");
    var stock = loadLocal("products");
    cart.items.forEach(function (row) {
        var p = productById(row.product_id);
        items.push({ id: (items.length ? items[items.length - 1].id : 0) + 1, order_id: orderId,
                     product_id: row.product_id, qty: row.qty, price: p.price });
        stock.forEach(function (s) { if (s.id === row.product_id) s.stock = Math.max(0, s.stock - row.qty); });
    });
    saveLocal("order_items", items);
    saveLocal("products", stock);

    checkout._draft = {};
    emptyCart();
    openDone(number);
}
