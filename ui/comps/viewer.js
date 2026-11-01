/* ---- viewer — a part's 3D model: orbit, zoom, and its layers ----

   The product page leaves an empty `[data-viewer="<id>"]` tile for a
   part with meshes. A WebGL canvas cannot live inside a template —
   every re-render of `product` (a quantity step, say) would replace
   it — so the viewer owns one long-lived <figure> built here, and
   moves it into that tile after each render. The figure shows the
   part's still until the model is in, and stays on the still if
   three.js or a mesh cannot load.

   three.js comes from the CDN (pinned in layout.html's import map) and
   is only fetched the first time a model is shown. The `viewer` mount
   is the bar under the canvas: one chip per layer, to hide it or see
   through it. */

var VIEWER_SEE_THROUGH = 0.2;          // a see-through layer's opacity

var viewerFigure = document.createElement("figure");
viewerFigure.className = "viewer";
viewerFigure.innerHTML = '<img class="viewer__still" alt="">' +
    '<div class="viewer__stage"></div><div class="viewer__bar"></div>';

function viewerTemplate(state) {
    if (state.status === "loading") return '<span class="viewer__note">Loading 3D model…</span>';
    if (state.status === "failed") return '<span class="viewer__note">3D view unavailable</span>';
    if (state.status !== "live") return "";
    var chips = state.layers.map(function (l, i) {
        return '<span class="layer' + (l.on ? '' : ' layer--off') + '">' +
                   '<button type="button" class="layer__show" onclick="viewerToggle(' + i + ')" aria-pressed="' + l.on + '" ' +
                       'title="Show or hide the ' + esc(l.name) + '">' +
                       '<span class="layer__swatch" style="background:' + esc(l.color) + '"></span>' + esc(l.name) +
                   '</button>' +
                   '<button type="button" class="layer__ghost" onclick="viewerGhost(' + i + ')" aria-pressed="' + l.ghost + '" ' +
                       'title="See through the ' + esc(l.name) + '" aria-label="See through the ' + esc(l.name) + '">◐</button>' +
               '</span>';
    }).join("");
    return '<div class="layers">' + chips + '</div>' +
           '<span class="viewer__note">Drag to turn · scroll to zoom · ' +
               '<button type="button" class="link-btn" onclick="viewerReset()">reset</button></span>';
}

var viewer = mount(
    viewerFigure.querySelector(".viewer__bar"),
    { product: null, status: "idle", layers: [] },
    viewerTemplate
);

/* The three.js side: loaded once, then one scene whose model group is
   swapped per part. Models are cached by product id. */
var viewer3d = null;                    // { THREE, STLLoader, renderer, scene, camera, controls }
var viewerThree = null;                 // the promise of viewer3d
var viewerModels = {};                  // product id → promise of { group, parts, radius }

function viewerLoadThree() {
    if (viewerThree) return viewerThree;
    viewerThree = Promise.all([
        import("three"),
        import("three/addons/loaders/STLLoader.js"),
        import("three/addons/controls/OrbitControls.js")
    ]).then(function (m) {
        var THREE = m[0];
        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        viewerFigure.querySelector(".viewer__stage").appendChild(renderer.domElement);

        var scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.5));
        var sun = new THREE.DirectionalLight(0xffffff, 1.7);
        sun.position.set(1, -1.4, 2);
        scene.add(sun);

        var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
        camera.up.set(0, 0, 1);         // the models are z up
        var controls = new m[2].OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;

        viewer3d = { THREE: THREE, STLLoader: m[1].STLLoader, renderer: renderer,
                     scene: scene, camera: camera, controls: controls, model: null };
        return viewer3d;
    });
    return viewerThree;
}

function viewerLoadModel(id) {
    if (viewerModels[id]) return viewerModels[id];
    var v = viewer3d, THREE = v.THREE, loader = new v.STLLoader();
    var rows = meshesOf(id);
    viewerModels[id] = Promise.all(rows.map(function (m) { return loader.loadAsync(m.file); }))
        .then(function (geometries) {
            var box = new THREE.Box3();
            geometries.forEach(function (g) { g.computeBoundingBox(); box.union(g.boundingBox); });
            var centre = box.getCenter(new THREE.Vector3());
            var group = new THREE.Group();
            var parts = geometries.map(function (geometry, i) {
                geometry.translate(-centre.x, -centre.y, -centre.z);
                geometry.computeVertexNormals();
                var material = new THREE.MeshStandardMaterial({ color: rows[i].color, metalness: 0.2, roughness: 0.55 });
                var mesh = new THREE.Mesh(geometry, material);
                var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30),
                    new THREE.LineBasicMaterial({ color: 0x0b0b0c, transparent: true, opacity: 0.45 }));
                group.add(mesh, edges);
                return { mesh: mesh, edges: edges, material: material };
            });
            return { group: group, parts: parts, radius: box.getSize(new THREE.Vector3()).length() / 2 };
        })
        .catch(function (e) { delete viewerModels[id]; throw e; });
    return viewerModels[id];
}

/* Show part `id` in the figure (already in its tile). */
function viewerShow(id) {
    var p = productById(id);
    var still = viewerFigure.querySelector(".viewer__still");
    // a re-render of the same part (a quantity step) keeps what is there
    if (viewer.product === id && viewer.status !== "failed") return viewerStart();
    viewer.product = id;
    viewer.layers = [];
    viewer.status = "loading";
    viewerFigure.classList.remove("is-live");
    if (p.image) still.src = p.image; else still.removeAttribute("src");
    still.alt = p.name;

    viewerLoadThree().then(function () { return viewerLoadModel(id); }).then(function (model) {
        if (viewer.product !== id) return;              // moved on while loading
        var v = viewer3d;
        if (v.model) v.scene.remove(v.model.group);
        v.model = model;
        v.scene.add(model.group);
        v.camera.near = model.radius / 100;
        v.camera.far = model.radius * 100;
        viewer.layers = meshesOf(id).map(function (m, i) {
            var part = model.parts[i];
            return { name: m.name, color: m.color, on: part.mesh.visible, ghost: part.material.transparent };
        });
        viewer.status = "live";
        viewerFigure.classList.add("is-live");
        viewerStart();
        viewerReset();
    }).catch(function () {
        if (viewer.product === id) viewer.status = "failed";
    });
}

function viewerStart() {
    var v = viewer3d;
    if (!v) return;
    v.renderer.setAnimationLoop(function () {
        viewerResize();
        v.controls.update();
        v.renderer.render(v.scene, v.camera);
    });
}

function viewerStop() {
    if (viewer3d) viewer3d.renderer.setAnimationLoop(null);
}

function viewerResize() {
    var v = viewer3d, canvas = v.renderer.domElement;
    var w = canvas.clientWidth, h = canvas.clientHeight, r = v.renderer.getPixelRatio();
    if (!w || !h) return;
    if (canvas.width !== Math.floor(w * r) || canvas.height !== Math.floor(h * r)) {
        v.renderer.setSize(w, h, false);
        v.camera.aspect = w / h;
        v.camera.updateProjectionMatrix();
    }
}

/* Back off until the model's bounding sphere fits the narrower field
   of view, looking from front-right and above. */
function viewerReset() {
    var v = viewer3d;
    if (!v || !v.model) return;
    viewerResize();
    var THREE = v.THREE;
    var vfov = THREE.MathUtils.degToRad(v.camera.fov);
    var hfov = 2 * Math.atan(Math.tan(vfov / 2) * v.camera.aspect);
    var distance = v.model.radius * 1.05 / Math.sin(Math.min(vfov, hfov) / 2);
    v.camera.position.copy(new THREE.Vector3(0.62, -0.95, 0.55).normalize().multiplyScalar(distance));
    v.controls.target.set(0, 0, 0);
    v.controls.update();
}

function viewerToggle(i) {
    var part = viewer3d.model.parts[i];
    part.mesh.visible = part.edges.visible = !part.mesh.visible;
    viewer.layers[i].on = part.mesh.visible;
}

function viewerGhost(i) {
    var part = viewer3d.model.parts[i], on = !part.material.transparent;
    part.material.transparent = on;
    part.material.opacity = on ? VIEWER_SEE_THROUGH : 1;
    part.material.depthWrite = !on;     // so what is behind still draws
    part.material.needsUpdate = true;
    part.edges.material.opacity = on ? 0.15 : 0.45;
    viewer.layers[i].ghost = on;
}

/* After each product render: move the figure into the empty tile, or
   stop drawing when the page no longer has one. */
new MutationObserver(function () {
    var slot = document.querySelector("#product [data-viewer]");
    if (!slot) return viewerStop();
    slot.appendChild(viewerFigure);
    viewerShow(Number(slot.getAttribute("data-viewer")));
}).observe(document.getElementById("product"), { childList: true });
