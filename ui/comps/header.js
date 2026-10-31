/* ---- header — logo, search trigger and the cart count ---- */

function headerTemplate(state) {
    return '<div class="bar">' +
               '<a class="logo" ' + linkAttrs("", "openList(null)") + ' aria-label="VequIR — all parts">' +
                   'V<span class="logo__eq">equ</span>IR</a>' +
               '<button class="search-trigger" type="button" onclick="openSearch()">' +
                   ICON_SEARCH +
                   '<span class="search-trigger__label">Search parts</span>' +
                   '<kbd>/</kbd>' +
               '</button>' +
               '<button class="cart-btn" type="button" onclick="openCart()" aria-label="Cart, ' + state.count + ' items">' +
                   ICON_CART + '<span>' + state.count + '</span>' +
               '</button>' +
           '</div>';
}

var header = mount(
    document.getElementById("site-header"),
    { count: 0 },
    headerTemplate
);
