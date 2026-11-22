
const device = document.querySelector(".device");
const stage = document.querySelector(".device-stage");
const page = document.querySelector(".page");

function fitDevice() {
    if (!device || !stage || !page) return;

    const baseWidth = 480;
    const maxScale = 1.15;
    const minScale = 0.55;

    const bodyStyle = getComputedStyle(document.body);

    const availableWidth =
        document.body.clientWidth -
        parseFloat(bodyStyle.paddingLeft) -
        parseFloat(bodyStyle.paddingRight);

    const heading = document.querySelector(".app-heading");
    const footnote = document.querySelector(".device-footnote");
    const footer = document.querySelector(".page-footer");

    const headingHeight = heading?.offsetHeight || 0;
    const footnoteHeight = footnote?.offsetHeight || 0;
    const footerHeight = footer?.offsetHeight || 0;

    const bodyPadding =
        parseFloat(bodyStyle.paddingTop) +
        parseFloat(bodyStyle.paddingBottom);

    const reservedHeight =
        headingHeight +
        footnoteHeight +
        footerHeight +
        bodyPadding +
        65;

    const availableHeight = window.innerHeight - reservedHeight;

    const currentZoom = parseFloat(
        getComputedStyle(device).zoom
    ) || 1;

    const naturalHeight =
        device.getBoundingClientRect().height / currentZoom;

    const widthScale = availableWidth / baseWidth;
    const heightScale = availableHeight / naturalHeight;

    const scale = Math.max(
        minScale,
        Math.min(maxScale, widthScale, heightScale)
    );

    /*
    device.style.setProperty("--device-scale", scale);
    device.style.zoom = scale;
    */
    device.style.setProperty("--device-scale", scale);
}

window.addEventListener("resize", fitDevice);
window.addEventListener("orientationchange", fitDevice);

window.addEventListener("load", fitDevice);

