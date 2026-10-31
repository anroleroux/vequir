/* ---- done — the order receipt ---- */

function doneTemplate(state) {
    if (!state.number) return "";
    return '<section class="done">' +
               '<span class="done__no">ORDER ' + esc(state.number) + '</span>' +
               '<h1 class="display">Circuit<br>closed.</h1>' +
               '<p>Confirmation sent. Ships within 24h.</p>' +
               '<a class="btn" ' + linkAttrs("", "openList(null)") + '>Keep shopping</a>' +
           '</section>';
}

var done = mount(
    document.getElementById("done"),
    { number: null },
    doneTemplate
);
