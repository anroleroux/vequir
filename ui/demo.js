/* ============================================================
   demo.js — the offline seed.

   Fills the catalogue models (categories, products, specs,
   shipping_methods) in localStorage so a visitor lands on a stocked
   shop. They are reseeded whenever DEMO_VERSION changes, so an edit
   here reaches browsers that already hold an older copy. The
   shopper's own models (cart_items, orders, order_items) are never
   touched — those only ever come from using the shop.

   dev-only: once an online build exists it reads the real back end
   and this file stays out of its map. Keep the rows in step with the
   models documented in the README.
   ============================================================ */

var DEMO_VERSION = 1;

/* Specs are their own model (one row per label/value, ordered by
   `position`); they are written inline here only to keep the seed
   readable, and flattened into the `specs` key below. */
var DEMO_PRODUCTS = [
    { id: 1, category_id: 1, slug: "esp32s3", name: "ESP32-S3 DevKit", code: "ESP32-S3", price: 14.9, stock: 42,
      blurb: "Two cores, Wi‑Fi, BLE and native USB. Enough brains for almost anything.",
      specs: [["Core", "Dual Xtensa LX7, 240 MHz"], ["Flash / PSRAM", "8 MB / 8 MB"], ["Wireless", "Wi‑Fi 4, BLE 5"], ["GPIO", "45"], ["Logic level", "3.3 V"], ["USB", "Native, USB‑C"]] },
    { id: 2, category_id: 1, slug: "rp2040", name: "RP2040 Zero", code: "RP2040", price: 6.5, stock: 120,
      blurb: "Thumbnail-sized, dual-core, PIO-powered.",
      specs: [["Core", "Dual Cortex‑M0+, 133 MHz"], ["Flash", "2 MB"], ["SRAM", "264 KB"], ["GPIO", "29"], ["Logic level", "3.3 V"], ["Size", "23.5 × 18 mm"]] },
    { id: 3, category_id: 1, slug: "nano", name: "ATmega328P Nano", code: "ATMEGA 328P", price: 8.9, stock: 4,
      blurb: "The classic. Breadboard-friendly and impossible to kill.",
      specs: [["Core", "AVR, 16 MHz"], ["Flash", "32 KB"], ["SRAM", "2 KB"], ["GPIO", "22"], ["Logic level", "5 V"], ["USB", "CH340, USB‑C"]] },
    { id: 4, category_id: 1, slug: "stm32", name: "STM32F411 Black Pill", code: "STM32 F411", price: 11.4, stock: 31,
      blurb: "Cortex‑M4 with FPU. Serious speed, tiny board.",
      specs: [["Core", "Cortex‑M4F, 100 MHz"], ["Flash", "512 KB"], ["SRAM", "128 KB"], ["GPIO", "36"], ["Logic level", "3.3 V"], ["Debug", "SWD"]] },
    { id: 5, category_id: 1, slug: "nrf52", name: "nRF52840 Feather", code: "nRF 52840", price: 24, stock: 0,
      blurb: "Bluetooth LE done properly. LiPo charging built in.",
      specs: [["Core", "Cortex‑M4F, 64 MHz"], ["Flash", "1 MB"], ["Wireless", "BLE 5.3, Thread, Zigbee"], ["GPIO", "21"], ["Logic level", "3.3 V"], ["Battery", "JST‑PH, 500 mA charger"]] },
    { id: 6, category_id: 2, slug: "buck", name: "MP1584 Buck 3A", code: "MP1584", price: 3.2, stock: 200,
      blurb: "Step it down. Efficiently.",
      specs: [["Input", "4.5 – 28 V"], ["Output", "0.8 – 20 V, adj."], ["Current", "3 A max"], ["Efficiency", "up to 92%"], ["Switching", "1.5 MHz"], ["Size", "22 × 17 mm"]] },
    { id: 7, category_id: 2, slug: "boost", name: "MT3608 Boost 2A", code: "MT3608", price: 2.4, stock: 160,
      blurb: "Step it up. From one cell to 28 V.",
      specs: [["Input", "2 – 24 V"], ["Output", "up to 28 V, adj."], ["Current", "2 A max"], ["Efficiency", "up to 93%"], ["Switching", "1.2 MHz"], ["Size", "36 × 17 mm"]] },
    { id: 8, category_id: 2, slug: "tp4056", name: "LiPo Charger USB‑C", code: "TP4056", price: 2.1, stock: 3,
      blurb: "Single-cell charging with protection. USB‑C in.",
      specs: [["Input", "5 V, USB‑C"], ["Charge current", "1 A, adj."], ["Cutoff", "4.2 V ±1%"], ["Protection", "DW01A + FS8205"], ["Indicators", "Charge / Done LED"], ["Size", "28 × 17 mm"]] },
    { id: 9, category_id: 2, slug: "psu", name: "Bench PSU 30V 5A", code: "PSU‑305", price: 79, stock: 12,
      blurb: "Linear-quiet, switching-efficient. CV/CC with four-digit readout.",
      specs: [["Output", "0 – 30 V, 0 – 5 A"], ["Mode", "CV / CC"], ["Ripple", "< 10 mVpp"], ["Display", "4-digit V / A"], ["Protection", "OCP, OVP, OTP"], ["Weight", "2.1 kg"]] },
    { id: 10, category_id: 3, slug: "iron", name: "Soldering Station 90W", code: "TS‑90", price: 64, stock: 18,
      blurb: "Hot in 8 seconds. Holds temp under load.",
      specs: [["Power", "90 W"], ["Range", "150 – 450 °C"], ["Heat-up", "≈ 8 s to 350 °C"], ["Tips", "T12 compatible"], ["ESD", "Grounded tip"], ["Display", "OLED"]] },
    { id: 11, category_id: 3, slug: "dmm", name: "Auto‑Range Multimeter", code: "DMM‑6000", price: 39, stock: 25,
      blurb: "True RMS, 6000 counts. Measures V, I and R — naturally.",
      specs: [["Counts", "6000"], ["DC V", "600 mV – 600 V"], ["Current", "up to 10 A"], ["Resistance", "600 Ω – 60 MΩ"], ["True RMS", "Yes"], ["Safety", "CAT III 600 V"]] },
    { id: 12, category_id: 3, slug: "logic", name: "Logic Analyzer 8ch", code: "LA‑8", price: 18.5, stock: 40,
      blurb: "Eight channels, 24 MHz. Decode I²C, SPI, UART and more.",
      specs: [["Channels", "8"], ["Sample rate", "24 MS/s"], ["Input", "0 – 5 V"], ["Protocols", "I²C, SPI, UART, CAN"], ["Software", "sigrok / PulseView"], ["Connection", "USB‑C"]] },
    { id: 13, category_id: 3, slug: "bb", name: "Breadboard 830", code: "BB‑830", price: 4.9, stock: 300,
      blurb: "830 tie points. Grips tight, releases clean.",
      specs: [["Tie points", "830"], ["Power rails", "4"], ["Contacts", "Phosphor bronze"], ["Wire gauge", "20 – 29 AWG"], ["Backing", "Adhesive"], ["Size", "165 × 55 mm"]] },
    { id: 14, category_id: 4, slug: "load", name: "VeqIR Ω‑1 Electronic Load", code: "Ω‑1", price: 89, stock: 7,
      blurb: "Constant current, power and resistance. Test every supply you own.",
      specs: [["Modes", "CC, CP, CR"], ["Rating", "0 – 30 V, 0 – 10 A, 150 W"], ["Resolution", "1 mA / 10 mV"], ["Cooling", "Active, temp-controlled"], ["Interface", "USB‑C serial"], ["Display", "2\" IPS"]] },
    { id: 15, category_id: 4, slug: "meter", name: "VeqIR Spark USB Meter", code: "SPARK", price: 29, stock: 54,
      blurb: "In-line V, A and W for any USB‑C cable. PD sniffing included.",
      specs: [["Range", "4 – 48 V, 0 – 6 A"], ["Accuracy", "±0.5%"], ["Protocols", "USB PD 3.1, QC"], ["Logging", "10k samples"], ["Display", "0.96\" OLED"], ["Size", "42 × 18 mm"]] },
    { id: 16, category_id: 4, slug: "node", name: "VeqIR Node N1", code: "NODE N1", price: 34, stock: 2,
      blurb: "Battery sensor node. Sleeps at 8 µA, wakes on anything.",
      specs: [["MCU", "ESP32‑C6"], ["Wireless", "Wi‑Fi 6, BLE, Thread"], ["Sleep current", "8 µA"], ["Sensors", "Temp, RH, pressure, light"], ["Battery", "18650 holder"], ["Expansion", "Qwiic / STEMMA"]] },
    { id: 17, category_id: 4, slug: "pulse", name: "VeqIR Pulse Generator", code: "PULSE", price: 59, stock: 15,
      blurb: "Square, sine, triangle — and anything you can draw.",
      specs: [["Channels", "2"], ["Bandwidth", "10 MHz sine"], ["Sample rate", "125 MS/s"], ["Amplitude", "±10 V"], ["Waveforms", "4 + arbitrary"], ["Interface", "USB‑C, rotary"]] }
];

function seedDemo() {
    var stale = Number(localStorage.getItem("demo_version")) !== DEMO_VERSION;

    if (stale || !localStorage.getItem("categories")) {
        saveLocal("categories", [
            { id: 1, slug: "microcontrollers", name: "Microcontrollers", house: false, position: 1 },
            { id: 2, slug: "power", name: "Power", house: false, position: 2 },
            { id: 3, slug: "tools", name: "Tools", house: false, position: 3 },
            { id: 4, slug: "veqir-devices", name: "VeqIR devices", house: true, position: 4 }
        ]);
    }

    if (stale || !localStorage.getItem("products")) {
        saveLocal("products", DEMO_PRODUCTS.map(function (p) {
            return { id: p.id, category_id: p.category_id, slug: p.slug, name: p.name, code: p.code,
                     price: p.price, stock: p.stock, blurb: p.blurb, position: p.id };
        }));
    }

    if (stale || !localStorage.getItem("specs")) {
        var specs = [];
        DEMO_PRODUCTS.forEach(function (p) {
            p.specs.forEach(function (s, i) {
                specs.push({ id: specs.length + 1, product_id: p.id, label: s[0], value: s[1], position: i + 1 });
            });
        });
        saveLocal("specs", specs);
    }

    if (stale || !localStorage.getItem("shipping_methods")) {
        saveLocal("shipping_methods", [
            { id: 1, name: "Standard", eta: "3–5 days", price: 4.9, free_over: 50, position: 1 },
            { id: 2, name: "Express", eta: "Next day", price: 12.9, free_over: null, position: 2 }
        ]);
    }

    try { localStorage.setItem("demo_version", String(DEMO_VERSION)); } catch (e) { /* blocked */ }
}
