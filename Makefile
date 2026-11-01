# ============================================================
#  VequIR — single-file build (unframe method)
#
#  The composer (make/tpl.mk) first inlines the reactive core, the
#  demo seed and every component into one script, then streams
#  ui/layout.html and inlines that script and the CSS into a single
#  static ui/dist/index.html — no bundler, no npm, just make + awk +
#  sed. That file plus ui/img and ui/models (the 3D parts' meshes)
#  is what GitHub Pages serves.
#
#    dev  offline: any //online code is stripped and the shop runs
#         from localStorage seeded by ui/demo.js. This is the only
#         build for now — there is no back end yet, so stg/prd are
#         added when one lands.
# ============================================================

BUILD_DIR := ui/dist
SRC       := ui/layout.html
MAP       := make/web.map
JS_MAP    := make/js.map
COMPS     := $(wildcard ui/comps/*.js)
IMGS      := $(wildcard ui/img/* ui/img/*/*)
MODELS    := $(wildcard ui/models/*/*.stl)
DEPS      := $(SRC) ui/layout.css ui/layout.js ui/reactivity.js ui/demo.js $(COMPS) $(MAP) $(JS_MAP) $(IMGS) $(MODELS)

# Where the build is served from — written into <base href>, which the
# router and every relative URL resolve against. The default suits a
# local static server at the repo root; the Pages workflow passes
# BASE=/veqir/ (anroleroux.co.za/veqir).
dev: BASE ?= /ui/dist/

# the compose macro (vendored from the unframe kit; no submodule needed)
include make/tpl.mk

.PHONY: all dev clean

all: dev

## dev — offline single-file build, seeded from ui/demo.js
dev: $(DEPS)
	@mkdir -p $(BUILD_DIR)/img
	$(call compose,ui/layout.js,$(JS_MAP),$(BUILD_DIR)/index.js)
	@sed -i '/\/\/online-start/,/\/\/online-end/d; /\/\/online$$/d' $(BUILD_DIR)/index.js
	$(call compose,$(SRC),$(MAP),$(BUILD_DIR)/index.html)
	@rm -f $(BUILD_DIR)/index.js
	@sed -i 's#{{base}}#$(BASE)#' $(BUILD_DIR)/index.html
	@cp $(BUILD_DIR)/index.html $(BUILD_DIR)/404.html
	@cp -R ui/img/. $(BUILD_DIR)/img/
	@rm -rf $(BUILD_DIR)/models && cp -R ui/models $(BUILD_DIR)/models
	@echo "dev: offline build (base $(BASE)) → $(BUILD_DIR)/index.html"

## clean — remove the generated output
clean:
	@rm -rf $(BUILD_DIR)
