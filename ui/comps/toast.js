/* ---- toast — "+1 <part>" after a quick add ---- */

var toastTimer = null;

function toastTemplate(state) {
    if (!state.text) return "";
    return '<div class="toast" role="status">' +
               '<span>+1 ' + esc(state.text) + '</span>' +
               '<button type="button" onclick="openCart()">View cart</button>' +
           '</div>';
}

var toast = mount(
    document.getElementById("toast"),
    { text: null },
    toastTemplate
);

function showToast(text) {
    toast.text = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 1800);
}

function hideToast() {
    clearTimeout(toastTimer);
    toast.text = null;
}
