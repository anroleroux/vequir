/* ---- search — the overlay's results ----
   The overlay and its input are static markup in layout.html, so
   typing never loses focus to a re-render; this mounts the results
   list beneath it and re-renders as `search.query` changes. */

function searchResults(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    return products().filter(function (p) {
        var c = categoryById(p.category_id);
        var hay = [p.name, p.code, c ? c.name : ""].concat(specsOf(p.id).map(function (s) { return s.value; }));
        return hay.join(" ").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 7);
}

function searchTemplate(state) {
    var results = searchResults(state.query);
    if (state.query.trim() && !results.length) {
        return '<p class="search__none">No current flowing. Try another term.</p>';
    }
    return '<div class="results">' + results.map(function (p) {
        var c = categoryById(p.category_id);
        return '<a class="result" ' + linkAttrs(productPath(p), "openProduct(" + p.id + ")") + '>' +
                   '<span class="' + tileClass(p) + '">' + tileArt(p) + '</span>' +
                   '<span class="result__text"><span class="result__name">' + esc(p.name) + '</span>' +
                       '<span class="result__cat">' + esc(c ? c.name : "") + '</span></span>' +
                   '<span class="result__price">' + money(p.price) + '</span>' +
               '</a>';
    }).join("") + '</div>';
}

var search = mount(
    document.getElementById("search-results"),
    { query: "" },
    searchTemplate
);

function openSearch() {
    closeCart();
    var box = document.getElementById("search");
    box.hidden = false;
    document.body.classList.add("is-locked");
    var input = document.getElementById("search-input");
    input.focus();
    input.select();
}

function closeSearch() {
    var box = document.getElementById("search");
    if (box.hidden) return;
    box.hidden = true;
    document.body.classList.remove("is-locked");
}

/* Enter opens the first hit. */
function searchKey(event) {
    if (event.key !== "Enter") return;
    var first = searchResults(search.query)[0];
    if (first) openProduct(first.id);
}
