const DEBUG = false;

document.querySelector('html').style.backgroundColor = '#000';

let visibilityState = document.visibilityState;
document.addEventListener('visibilitychange', function() {
    visibilityState = document.visibilityState;
});

function observe(callback) {
    observe.originalApis = {
        setTimeout: setTimeout,
        setInterval: setInterval,
        requestAnimationFrame: requestAnimationFrame,
        Promise: Promise,
    };

    setTimeout = function (fn, ms) {
        return observe.originalApis.setTimeout.bind(window)(function () {
            fn();
            callback();
        }, ms);
    };
    setInterval = function (fn, ms) {
        return observe.originalApis.setInterval.bind(window)(function () {
            fn();
            callback();
        }, ms);
    };
    requestAnimationFrame = function (fn) {
        return observe.originalApis.requestAnimationFrame.bind(window)(function () {
            fn();
            callback();
        });
    };
    Promise = class Promise extends observe.originalApis.Promise {
        constructor(executor) {
            super((resolve, reject) => {
                try {
                    executor(resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
        }
        then(onResolved, onRejected) {
            return super.then(val => {
                const result = typeof(onResolved) === 'function' ? onResolved(val) : val;
                callback();
                return result;
            }, onRejected);
        }
        catch(onRejected) {
            return super.catch(val => {
                const result = onRejected(val);
                callback();
                return result;
            });
        }
    };

    window.addEventListener('DOMContentLoaded', function () {
        callback();
    });
    window.addEventListener('load', function () {
        callback();
    });
}

let elements = [];
const NUMBER_OF_ELEMENTS_WAS_PROCESSED_AT_ONCE = 500;
let current = 0;

let running = false;
let queued = false;
let queuedMilliseconds;
const DEBOUNCE_MILLISECONDS = 10000;
observe(async function () {
    debounce(async function () {
        if (!visibilityState || queued) {
            return;
        }

        if (running) {
            queued = true;
            queuedMilliseconds = Date.now();
            while (running) {
                await timeout(function () {}, 1000);
            }
            await timeout(function () {}, DEBOUNCE_MILLISECONDS - (Date.now() - queuedMilliseconds));
            queued = false;
        }

        running = true;
        requiredRefresh = false;
        document.querySelector('html').style.backgroundColor = '#000';
        elements = Array.apply(null, document.querySelectorAll('*:not([data-obscuritas-colored])'));
        Array.apply(null, document.querySelectorAll('iframe')).forEach(iframe => {
            if (iframe && iframe.contentDocument) {
                elements = elements.concat(Array.apply(null, iframe.contentDocument.querySelectorAll('*:not([data-obscuritas-colored])')));
            }
        });
        current = 0;
        await timeout(tick, 0);
        running = false;
    }, DEBOUNCE_MILLISECONDS)();
});

function debounce(fn, interval) {
    let timerId;
    let first = true;
    return function () {
        clearTimeout(timerId);
        const context = this;
        const args = arguments;
        timerId = observe.originalApis.setTimeout.bind(window)(function () {
            fn.apply(context, args);
        }, first ? 0 : interval);
        first = false;
    };
}

async function timeout(fn, ms) {
    DEBUG ?? console.log('timeout');
    await new observe.originalApis.Promise(resolve => observe.originalApis.setTimeout.bind(window)(resolve, ms));
    return await fn();
}

const FOREGROUND_COLOR_PROPERTIES = [
    'color',
    'caret-color',
    '-webkit-text-fill-color',
];
const BACKGROUND_COLOR_PROPERTIES = [
    'border-left-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'background-color',
];
const DEFAULT_VALUES = [
    'inherit',
    'initial',
    'unset',
    '',
];
const IGNORE_DEFAULT_VALUE_PROPERTIES = [
    '-webkit-text-fill-color',
];
async function tick() {
    DEBUG ?? console.log('tick', elements.length, current);
    if (elements.length <= current) {
        isRunning = false;
        return;
    }
    for (let i = current; i < current + NUMBER_OF_ELEMENTS_WAS_PROCESSED_AT_ONCE && i < elements.length; i++) {
        const computedStyles = window.getComputedStyle(elements[i]);
        for (const propertyName of BACKGROUND_COLOR_PROPERTIES) {
            if (IGNORE_DEFAULT_VALUE_PROPERTIES.includes(propertyName) && DEFAULT_VALUES.includes(elements[i].style[propertyName])) {
                continue;
            }
            const color = darken(computedStyles[propertyName], propertyName);
            if (color !== 'none') {
                elements[i].style[propertyName] = color + '';
            }
        }
        for (const propertyName of FOREGROUND_COLOR_PROPERTIES) {
            if (IGNORE_DEFAULT_VALUE_PROPERTIES.includes(propertyName) && DEFAULT_VALUES.includes(elements[i].style[propertyName])) {
                continue;
            }
            const color = lighten(computedStyles[propertyName]);
            if (color !== 'none') {
                elements[i].style[propertyName] = color + '';
            }
        }
        elements[i].setAttribute('data-obscuritas-colored', true);
    }
    current += NUMBER_OF_ELEMENTS_WAS_PROCESSED_AT_ONCE;
    await timeout(tick, 0);
}

function lighten(color) {
    const rgba = getRgba(color);
    if (rgba === undefined || rgba[3] === 0) {
        return 'none';
    }
    const beforeHsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
    const beforeHsv = rgbToHsv(rgba[0], rgba[1], rgba[2]);
    const MORE_LIGHT_FACTOR = 5;
    beforeHsl[2] = (beforeHsl[2] + MORE_LIGHT_FACTOR - 1) / MORE_LIGHT_FACTOR;
    const lightenRgb = hslToRgb(beforeHsl[0], beforeHsl[1], beforeHsl[2]);
    const afterHsv = rgbToHsv(lightenRgb[0], lightenRgb[1], lightenRgb[2]);
    afterHsv[1] = (beforeHsv[1] + afterHsv[1]) / 2;
    const rgb = hsvToRgb(afterHsv[0], afterHsv[1], afterHsv[2]);
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + rgba[3] + ')';
}
function darken(color, propertyName) {
    const rgba = getRgba(color);
    if (rgba === undefined || rgba[3] === 0) {
        return 'none';
    }
    const hsv = rgbToHsv(rgba[0], rgba[1], rgba[2]);
    const MORE_DARK_FACTOR = propertyName.indexOf('border') >= 0 ? 3 : 6.2;
    hsv[2] = hsv[2] / (MORE_DARK_FACTOR / mapRange(Math.pow(hsv[1], 10), 0, 1, 1, MORE_DARK_FACTOR));
    const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + rgba[3] + ')';
}

function mapRange(f, beforeMin, beforeMax, afterMin, afterMax) {
    return afterMin + (afterMax - afterMin) * ((f - beforeMin) / (beforeMax - beforeMin));
}
function rgbToHsv(r, g, b) {
    // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h, s, v];
}
function hsvToRgb(h, s, v) {
    // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function hslToRgb(h, s, l) {
    // https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToHsl(r,g,b)
{
    // https://stackoverflow.com/questions/2348597/why-doesnt-this-javascript-rgb-to-hsl-code-work
    r = r / 255;
    g = g / 255;
    b = b / 255;
    let a=Math.max(r,g,b), n=a-Math.min(r,g,b), f=(1-Math.abs(a+a-n-1));
    let h= n && ((a==r) ? (g-b)/n : ((a==g) ? 2+(b-r)/n : 4+(r-g)/n));
    return [60*(h<0?h+6:h) / 360, f ? n/f : 0, (a+a-n)/2];
}
function getRgba(color)
{
    // https://stackoverflow.com/questions/34980574/how-to-extract-color-values-from-rgb-string-in-javascript
    if (color === '')
        return;
    if (color.toLowerCase() === 'transparent')
        return [0, 0, 0, 0];
    if (color[0] === '#')
    {
        if (color.length < 7)
        {
            // convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
            color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
        }
        return [parseInt(color.substr(1, 2), 16),
            parseInt(color.substr(3, 2), 16),
            parseInt(color.substr(5, 2), 16),
            color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
    }
    if (!document.body) {
        return color;
    }
    if (color.indexOf('rgb') === -1)
    {
        // convert named colors
        var temp_elem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
        var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
        temp_elem.style.color = flag;
        if (temp_elem.style.color !== flag) {
            document.body.removeChild(temp_elem);
            return; // color set failed - some monstrous css rule is probably taking over the color of our object
        }
        temp_elem.style.color = color;
        if (temp_elem.style.color === flag || temp_elem.style.color === '') {
            document.body.removeChild(temp_elem);
            return; // color parse failed
        }
        color = getComputedStyle(temp_elem).color;
        document.body.removeChild(temp_elem);
    }
    if (color.indexOf('rgb') === 0)
    {
        if (color.indexOf('rgba') === -1)
            color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
        return color.match(/[\.\d]+/g).map(function (a)
        {
            return +a
        });
    }
}

function baseUrl() {
    // https://stackoverflow.com/questions/25203124/how-to-get-base-url-with-jquery-or-javascript
    return window.location.protocol + '//' + window.location.host + '/' + window.location.pathname.split('/')[1];
}
function absoluteUrl(path) {
    // https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
    const stack = baseUrl().split('/');
    const parts = path.split('/');
    stack.pop();
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '.' || parts[i] === '')
            continue;
        if (parts[i] === '..')
            stack.pop();
        else
            stack.push(parts[i]);
    }
    return stack.join('/');
}

async function loop(array, callback) {
    let i = 0;
    await fn();
    async function fn() {
        if (i >= array.length) {
            return;
        }
        callback(array.slice(i, i + 100 > array.length ? array.length : i + 100));
        i += 100;
        await timeout(tick, 0);
    }
}
