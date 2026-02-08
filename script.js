document.addEventListener("DOMContentLoaded", () => {

let bom = {};
let svgElement = null;
let svgContent = null;
let currentVariant = "ALL";

let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

/* ================= CSV PARSER ================= */
function parseCSV(text) {
    const rows = [];
    const lines = text.split("\n");

    lines.forEach(line => {
        const result = [];
        let current = "";
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') insideQuotes = !insideQuotes;
            else if (char === "," && !insideQuotes) {
                result.push(current);
                current = "";
            } else current += char;
        }
        result.push(current);
        rows.push(result);
    });
    return rows;
}

/* ================= LOAD BOM ================= */
fetch("BOM.csv")
.then(r => r.text())
.then(text => {
    const rows = parseCSV(text);
    rows.shift();

    rows.forEach(cols => {
        const refs = cols[0];
        const value = cols[2];
        const dnp = cols[5];
        const footprint = cols[6];
        const datasheet = cols[7];

        if (!refs) return;

        refs.replace(/"/g, "")
            .split(",")
            .map(r => r.trim())
            .forEach(ref => {
                bom[ref] = {
                    value,
                    footprint,
                    datasheet,
                    dnp: dnp && dnp.toLowerCase() === "yes"
                };
            });
    });

    loadSVG();
});

/* ================= LOAD SVG ================= */
function loadSVG() {

    fetch("schematic.svg")
    .then(r => r.text())
    .then(svgText => {

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        svgElement = svgDoc.documentElement;

        // Fix KiCad SVG viewport
        const width = svgElement.getAttribute("width");
        const height = svgElement.getAttribute("height");
        if (!svgElement.getAttribute("viewBox") && width && height) {
            svgElement.setAttribute("viewBox", `0 0 ${parseFloat(width)} ${parseFloat(height)}`);
        }

        // Create zoom group
        svgContent = document.createElementNS("http://www.w3.org/2000/svg", "g");
        while (svgElement.firstChild) svgContent.appendChild(svgElement.firstChild);
        svgElement.appendChild(svgContent);

        document.getElementById("schematicContainer").appendChild(svgElement);

        requestAnimationFrame(() => {
            autoFitSVG();
            createHotspots();
        });

        // Variant dropdown
        document.getElementById("variantSelect").addEventListener("change", e => {
            currentVariant = e.target.value;
            svgContent.querySelectorAll("rect").forEach(r => r.remove());
            createHotspots();
        });

        addZoomAndPan();

    });
}

/* ================= AUTO FIT ================= */
function autoFitSVG() {
    const container = document.getElementById("schematicContainer");
    const bbox = svgContent.getBBox();
    if (!bbox.width) return;

    zoom = Math.min(
        container.clientWidth / bbox.width,
        container.clientHeight / bbox.height
    ) * 0.9;

    panX = 0;
    panY = 0;
    updateTransform();
}

/* ================= TRANSFORM ================= */
function updateTransform() {
    svgContent.setAttribute(
        "transform",
        `translate(${panX}, ${panY}) scale(${zoom})`
    );
}

/* ================= ZOOM + PAN ================= */
function addZoomAndPan() {

    const container = document.getElementById("schematicContainer");

    container.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        zoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
        updateTransform();
    });

    container.addEventListener("mousedown", (e) => {
        isPanning = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        container.style.cursor = "grabbing";
    });

    container.addEventListener("mousemove", (e) => {
        if (!isPanning) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
    });

    container.addEventListener("mouseup", () => {
        isPanning = false;
        container.style.cursor = "grab";
    });

    container.addEventListener("mouseleave", () => {
        isPanning = false;
        container.style.cursor = "grab";
    });
}

/* ================= HOTSPOTS ================= */
function createHotspots() {

    const texts = svgContent.querySelectorAll("text");

    texts.forEach(t => {
        const label = t.textContent.trim();
        if (!/^[A-Z]+\d+$/.test(label)) return;

        if (bom[label] && bom[label].dnp && currentVariant === "DNP") return;

        const bbox = t.getBBox();
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        rect.setAttribute("x", bbox.x - 10);
        rect.setAttribute("y", bbox.y - 10);
        rect.setAttribute("width", bbox.width + 20);
        rect.setAttribute("height", bbox.height + 20);
        rect.setAttribute("opacity", "0.001");

        if (bom[label] && bom[label].dnp) {
            rect.setAttribute("fill", "grey");
            rect.setAttribute("opacity", "0.35");
        }

        rect.addEventListener("click", () => openPopup(label));
        svgContent.appendChild(rect);
    });
}

/* ================= POPUP ================= */
function openPopup(ref) {
    if (bom[ref] && bom[ref].dnp && currentVariant === "DNP") return;

    const part = bom[ref] || {};
    document.getElementById("card").innerHTML = `
        <h2>${ref}</h2>
        <p><b>Value:</b> ${part.value || "Unknown"}</p>
        <p><b>Footprint:</b> ${part.footprint || "Unknown"}</p>
        <button onclick="window.open('${part.datasheet || "#"}','_blank')">Datasheet</button>
    `;
    document.getElementById("popup").style.display = "block";
}

window.closePopup = function() {
    document.getElementById("popup").style.display = "none";
}

});
