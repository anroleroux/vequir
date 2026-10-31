/* ---- listing — the catalogue grid with category, price and sort ---- */

var SORTS = [["featured", "Featured"], ["low", "Price ↑"], ["high", "Price ↓"]];

function listingProducts(state) {
    var cat = state.cat && categoryBySlug(state.cat);
    var list = products().filter(function (p) {
        return (!cat || p.category_id === cat.id) && p.price <= state.maxPrice;
    });
    if (state.sort === "low") list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "high") list.sort(function (a, b) { return b.price - a.price; });
    return list;
}

function categoryChip(slug, label, count, on) {
    return '<a class="chip' + (on ? ' chip--on' : '') + '" ' +
               linkAttrs(categoryPath(slug), "openList(" + (slug ? "'" + esc(slug) + "'" : "null") + ")") + '>' +
               esc(label) + '<span class="chip__count">' + count + '</span></a>';
}

function productCard(p) {
    var cat = categoryById(p.category_id);
    var link = linkAttrs(productPath(p), "openProduct(" + p.id + ")");
    return '<article class="card">' +
               '<a class="tile' + (isHouse(p) ? ' tile--house' : '') + '" ' + link + ' tabindex="-1" aria-hidden="true">' +
                   '<span class="tile__cat">' + esc(cat ? cat.name : "") + '</span>' +
                   '<span class="tile__code">' + esc(p.code) + '</span>' +
                   (p.stock <= 5 ? '<span class="tile__flag">' + stockLabel(p) + '</span>' : '') +
               '</a>' +
               '<div class="card__body">' +
                   '<div class="card__text">' +
                       '<a class="card__name" ' + link + '>' + esc(p.name) + '</a>' +
                       '<span class="card__spec">' + esc(specLine(p)) + '</span>' +
                       '<span class="card__price">' + money(p.price) + '</span>' +
                   '</div>' +
                   '<button class="add-btn" type="button" onclick="quickAdd(' + p.id + ')" ' +
                       'aria-label="Add ' + esc(p.name) + ' to cart"' + (p.stock > 0 ? '' : ' disabled') + '>+</button>' +
               '</div>' +
           '</article>';
}

function listingTemplate(state) {
    if (!state.visible) return "";
    var cat = state.cat && categoryBySlug(state.cat);
    var all = products();
    var list = listingProducts(state);
    var cap = priceCap();

    var chips = categoryChip(null, "All parts", all.length, !cat) +
        categories().map(function (c) {
            var n = all.filter(function (p) { return p.category_id === c.id; }).length;
            return categoryChip(c.slug, c.name, n, cat && cat.id === c.id);
        }).join("");

    var sorts = SORTS.map(function (s) {
        return '<button type="button" class="' + (state.sort === s[0] ? 'is-on' : '') + '" ' +
                   'onclick="listing.sort = \'' + s[0] + '\'" aria-pressed="' + (state.sort === s[0]) + '">' + s[1] + '</button>';
    }).join("");

    // The slider only re-renders the list when it is let go (onchange);
    // while dragging, oninput just updates the figure beside it.
    var slider = '<label class="price-filter">' +
            '<span>PRICE ≤</span>' +
            '<input type="range" min="2" max="' + cap + '" step="1" value="' + state.maxPrice + '" ' +
                'oninput="this.nextElementSibling.textContent = money(this.value).replace(/\\.00$/, \'\')" ' +
                'onchange="listing.maxPrice = Number(this.value)" aria-label="Maximum price">' +
            '<span class="price-filter__value">' + CURRENCY + state.maxPrice + '</span>' +
        '</label>';

    var empty = list.length ? "" :
        '<div class="empty">' +
            '<p>Nothing under ' + CURRENCY + state.maxPrice + '.</p>' +
            '<button class="btn btn--small" type="button" onclick="listing.maxPrice = priceCap()">Reset price</button>' +
        '</div>';

    return '<section class="view view--list">' +
               '<div class="list-head">' +
                   '<h1 class="display">' + esc(cat ? cat.name : "All parts") + '</h1>' +
                   '<span class="list-head__count">' + list.length + ' parts</span>' +
               '</div>' +
               '<div class="toolbar">' +
                   '<nav class="chips" aria-label="Categories">' + chips + '</nav>' +
                   '<div class="toolbar__group">' + slider +
                       '<div class="segmented" role="group" aria-label="Sort">' + sorts + '</div>' +
                   '</div>' +
               '</div>' +
               empty +
               '<div class="grid">' + list.map(productCard).join("") + '</div>' +
           '</section>';
}

var listing = mount(
    document.getElementById("listing"),
    { visible: false, cat: null, maxPrice: 100, sort: "featured" },
    listingTemplate
);

/* The + on a card: one in the cart and a toast, without leaving. */
function quickAdd(id) {
    var p = productById(id);
    if (!p || p.stock <= 0) return;
    if (addToCart(id, 1)) showToast(p.code);
}
