document.querySelector('html').style.backgroundColor = '#000';

const obscuritasedStyleSheets = [];
const observer = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
        if (mutation.type !== 'childList') {
            continue;
        }
        for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }
            if (addedNode.tagName === 'LINK' && addedNode.getAttribute('rel') === 'stylesheet') {
                addedNode.addEventListener('load', function () {
                    darkenLink(this);
                });
            } else if (addedNode.tagName === 'STYLE') {
                darkenStyle(addedNode);
            }
        }
    }
});

let visibilityState = document.visibilityState;
document.addEventListener('visibilitychange', function() {
    visibilityState = document.visibilityState;
    if (visibilityState !== 'visible') {
        observer.disconnect();
    } else {
        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }
});

async function darkenStyle(style) {
    if (style.hasAttribute('data-obscuritas')) {
        return;
    }
    style.setAttribute('data-obscuritas', true);
    const darkenedStyle = document.createElement('style');
    darkenedStyle.setAttribute('data-obscuritas', true);

    if (!style.cssRules) {
        return;
    }

    await loop(Object.values(style.cssRules), function (cssRules) {
        for (const cssRule of cssRules) {
            if (cssRule.type !== CSSRule.STYLE_RULE) {
                continue;
            }
            for (const name in cssRule.style) {
                if (['color', '-webkit-text-fill-color', 'caret-color'].includes(name)) {
                    const color = lightenCssValue(cssRule.style[name]);
                    if (color !== cssRule.style[name]) {
                        darkenedStyle.insertRule(cssRule.selectorText + '{' + color + '}');
                    }
                } else if (name.indexOf('color') !== -1 || ['background'].includes(name)) {
                    const color = darkenCssValue(cssRule.style[name]);
                    if (color !== cssRule.style[name]) {
                        darkenedStyle.insertRule(cssRule.selectorText + '{' + color + '}');
                    }
                }
            }
        }
    });

    document.querySelector('head').appendChild(darkenedStyle);
}
function darkenCssValue(cssValue) {
    // https://gist.github.com/olmokramer/82ccce673f86db7cda5e
    return cssValue.replace(/(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\)|black|silver|gray|whitesmoke|maroon|red|purple|fuchsia|green|lime|olivedrab|yellow|navy|blue|teal|aquamarine|orange|aliceblue|antiquewhite|aqua|azure|beige|bisque|blanchedalmond|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|gainsboro|ghostwhite|goldenrod|gold|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavenderblush|lavender|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|limegreen|linen|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|oldlace|olive|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|thistle|tomato|turquoise|violet|wheat|white|yellowgreen|rebeccapurple)/ig, function (color) {
        const darkenedColor = darken(color);
        if (darkenedColor === 'none') {
            return color;
        } else {
            return darkenedColor;
        }
    });
}
function lightenCssValue(cssValue) {
    // https://gist.github.com/olmokramer/82ccce673f86db7cda5e
    return cssValue.replace(/(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\)|black|silver|gray|whitesmoke|maroon|red|purple|fuchsia|green|lime|olivedrab|yellow|navy|blue|teal|aquamarine|orange|aliceblue|antiquewhite|aqua|azure|beige|bisque|blanchedalmond|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|gainsboro|ghostwhite|goldenrod|gold|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavenderblush|lavender|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|limegreen|linen|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|oldlace|olive|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|thistle|tomato|turquoise|violet|wheat|white|yellowgreen|rebeccapurple)/ig, function (color) {
        const lightenedColor = lighten(color);
        if (lightenedColor === 'none') {
            return color;
        } else {
            return lightenedColor;
        }
    });
}

function darkenLink(link) {
    for (const styleSheet of document.styleSheets) {
        if (styleSheet.href === absoluteUrl(link.getAttribute('href'))) {
            darkenStyleSheet(styleSheet);
        }
    }
}
async function darkenStyleSheet(styleSheet) {
    if (obscuritasedStyleSheets.includes(styleSheet)) {
        return;
    }

    if (!styleSheet.cssRules) {
        return;
    }

    await loop(Object.values(styleSheet.cssRules), function (cssRules) {
        for (const cssRule of cssRules) {
            if (cssRule.type !== CSSRule.STYLE_RULE) {
                continue;
            }
            for (const name in cssRule.style) {
                if (['color', '-webkit-text-fill-color', 'caret-color'].includes(name)) {
                    const color = lighten(cssRule.style[name]);
                    if (color !== 'none') {
                        cssRule.style[name] = color;
                    }
                } else if (name.indexOf('color') !== -1 || ['background'].includes(name)) {
                    const color = darken(cssRule.style[name]);
                    if (color !== 'none') {
                        cssRule.style[name] = color;
                    }
                }
            }
        }
    });

    obscuritasedStyleSheets.push(styleSheet);
}

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
    /*
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
              const result = onResolved(val);
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
    */

    window.addEventListener('DOMContentLoaded', function () {
        console.log('DOMContentLoaded');
        callback();
    });
    window.addEventListener('load', function () {
        console.log('load');
        callback();
    });
}

let elements = [];
const n = 10;
let current = 0;
let isRunning = false;
observe(async function () {
    console.log('observed');
    debounce(async function () {
        if (visibilityState && !isRunning) {
            isRunning = true;
            requiredRefresh = false;
            document.querySelector('html').style.backgroundColor = '#000';
            elements = Array.apply(null, document.querySelectorAll('*'));
            Array.apply(null, document.querySelectorAll('iframe')).forEach(iframe => {
                if (iframe && iframe.contentDocument) {
                    elements = elements.concat(Array.apply(null, iframe.contentDocument.querySelectorAll('*')));
                }
            });
            current = 0;
            await timeout(tick, 0);
            isRunning = false;
        }
    }, 1000)();
});

function debounce(fn, interval) {
    let timerId;
    return function () {
        clearTimeout(timerId);
        const context = this;
        const args = arguments;
        timerId = observe.originalApis.setTimeout.bind(window)(function () {
            fn.apply(context, args);
        }, interval);
    };
}

async function timeout(fn, ms) {
    console.log('timeout');
    await new Promise(resolve => observe.originalApis.setTimeout.bind(window)(resolve, ms));
    return await fn();
}

async function tick() {
    console.log('tick', elements.length, current);
    if (elements.length <= current) {
        isRunning = false;
        return;
    }
    for (let i = current; i < current + n && i < elements.length; i++) {
        const styles = window.getComputedStyle(elements[i]);
        for (const name in styles) {
            if (['color', '-webkit-text-fill-color', 'caret-color'].includes(name)) {
                const color = lighten(styles[name]);
                if (color !== 'none') {
                    elements[i].style[name] = color + '';
                }
            } else if (name.indexOf('color') !== -1) {
                const color = darken(styles[name]);
                if (color !== 'none') {
                    elements[i].style[name] = color + '';
                }
            }
        }
    }
    current += n;
    await timeout(tick, 50);
}

function lighten(color) {
    const rgba = getRgba(color);
    if (rgba === undefined || rgba[3] === 0) {
        return 'none';
    }
    const hsl = rgb2hsl(rgba[0], rgba[1], rgba[2]);
    if (hsl[2] < 0.5) {
        // hsl[2] = 1 - (1 - hsl[2]) / 2;
        hsl[2] = 1 - hsl[2];
        // hsl[2] = 1 - hsl[2];
    } else {
        return 'none';
    }
    const rgb = hsl2rgb(hsl[0], hsl[1], hsl[2]);
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + rgba[3] + ')';
}
function darken(color) {
    const rgba = getRgba(color);
    if (rgba === undefined || rgba[3] === 0) {
        return 'none';
    }
    const hsl = rgb2hsl(rgba[0], rgba[1], rgba[2]);
    hsl[1] = hsl[1] / 2;
    if (hsl[2] > 0.5) {
        // hsl[2] = 1 - hsl[2];
        hsl[2] -= 0.85;
        hsl[2] = hsl[2] < 0 ? 0 : hsl[2];
    } else {
        return 'none';
    }
    const rgb = hsl2rgb(hsl[0], hsl[1], hsl[2]);
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + rgba[3] + ')';
}

function hsl2rgb(h, s, l) {
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
function rgb2hsl(r,g,b)
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
