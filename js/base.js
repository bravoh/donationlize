Liberapay = {
    avatar_default_url: "https://liberapay.com/assets/avatar-default.png?etag=.HVo94CoZcTTgapsS2xMStQ~~"
};

/**********************************************************************/
/*                             10-base.js                             */
/**********************************************************************/

Liberapay.getCookie = function(key) {
    var o = new RegExp("(?:^|; ?)" + escape(key) + "=([^;]+)").exec(document.cookie);
    if (!o) return null;
    var value = o[1];
    if (value.charAt(0) === '"') value = value.slice(1, -1);
    return unescape(value);
}

Liberapay.init = function() {
    // https://docs.djangoproject.com/en/dev/ref/contrib/csrf/#ajax
    jQuery.ajaxSetup({
        beforeSend: function(xhr, settings) {
            var safeMethod = (/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type));
            if (!safeMethod && !settings.crossDomain) {
                // We have to avoid httponly on the csrf_token cookie because of this.
                xhr.setRequestHeader("X-CSRF-TOKEN", Liberapay.getCookie('csrf_token'));
            }
        }
    });

    Liberapay.forms.jsSubmit();

    // http://stackoverflow.com/questions/7131909/facebook-callback-appends-to-return-url
    if (window.location.hash == '#_=_') {
        window.location.hash = ''; // leaves a # behind
    }

    var success_re = /([?&])success=[^&]*/;
    if (success_re.test(location.search)) {
        history.replaceState(null, null,
            location.pathname+
            location.search.replace(success_re, '$1').replace(/[\?&]$/, '')+
            location.hash
        );
    }
    $('.notification .close').click(function(){ $(this).parent().fadeOut() });

    Liberapay.auto_tail_log();
    Liberapay.charts.init();
    Liberapay.identity_docs_init();
    Liberapay.lookup.init();
    Liberapay.payments.init();
    Liberapay.s3_uploader_init();
    Liberapay.stripe_init();

    $('div[href]').css('cursor', 'pointer').on('click auxclick', function(event) {
        if (event.target.tagName == 'A') {
            // Ignore clicks on links
            return;
        }
        if (event.button == 2) {
            // Ignore right clicks
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        var url = this.getAttribute('href');
        if (event.type == 'click' && event.ctrlKey ||
            event.type == 'auxclick' && event.button == 1) {
            window.open(url);
        } else {
            location.href = url;
        }
    });

    $('.dropdown.dropdown-hover').removeClass('dropdown-hover');

    $('.dropdown-toggle-form').click(function() {
        var $this = $(this);
        setTimeout(function() {
            $this.siblings('.dropdown-menu').find('input').eq(0).focus();
        }, 10);
    });

    var grid_float_breakpoint = 768;
    $('.navbar-nav > li > .dropdown-toggle').click(function(e) {
        if ($('html').width() < grid_float_breakpoint) {
            $('.navbar-collapse').collapse('hide');
        }
    });

    var amount_re = /\?(.*&)*amount=(.*?)(&|$)/;
    var period_re = /\?(.*&)*period=(.*?)(&|$)/;
    $('a.amount-btn').each(function() {
        $(this).data('href', this.getAttribute('href')).attr('href', null);
    }).click(function(e) {
        var href = $(this).data('href');
        $('#amount').val(amount_re.exec(href)[2]);
        var period = period_re.exec(href);
        period = (period ? period[2] : 'weekly') || 'weekly';
        $('select[name=period] > option').filter(
            function () { return this.getAttribute('value') === period }
        ).prop('selected', true);
        history.pushState(null, null, location.pathname + href + location.hash);
    });

    $('input[data-required-if-checked]').each(function() {
        var $this = $(this);
        var $requirer = $($this.attr('data-required-if-checked'));
        $this.parents('form').find('input').on('change', function() {
            $this.prop('required', $requirer.prop('checked'));
        });
        $requirer.trigger('change');
    });

    $('[data-toggle="tooltip"]').tooltip();

    $('.radio input:not([type="radio"]), .radio-group input:not([type="radio"])').on('click change', function(event) {
        if (event.type == 'click' && event.clientX == 0 && event.clientY == 0) {
            return  // This click event seems to be fake
        } else if (event.type != 'click' && this.value == '') {
            return  // Don't act on non-click events when the <input> is empty
        }
        $(this).parents('label').children('input[type="radio"]').prop('checked', true).trigger('change');
    });
    $('.radio-group .list-group-item > label').on('click', function(event) {
        if (event.clientX == 0 && event.clientY == 0) {
            return  // This click event seems to be fake
        }
        $(this).children('input[type="radio"]').prop('checked', true).trigger('change');
    });

    $('[data-toggle="enable"]').on('change', function() {
        var $checkbox = $(this);
        var $target = $($checkbox.data('target'));
        $target.prop('disabled', !$checkbox.prop('checked'));
    });

    $('[data-email]').one('mouseover click', function () {
        $(this).attr('href', 'mailto:'+$(this).data('email'));
    });
    $('[data-email-reveal]').one('click', function () {
        $(this).html($(this).data('email-reveal'));
    });

    $('button[data-action="reload"]').on('click', function() {
        location.reload();
    });
};

$(function(){ Liberapay.init(); });

Liberapay.error = function(jqXHR, textStatus, errorThrown) {
    var msg = null;
    if (jqXHR.responseText > "") {
        try {
            msg = JSON.parse(jqXHR.responseText).error_message_long;
        } catch(exc) {}
    }
    if (typeof msg != "string" || msg.length == 0) {
        msg = "An error occurred (" + (errorThrown || textStatus || jqXHR.status) + ").\n" +
              "Please contact support@liberapay.com if the problem persists.";
    }
    Liberapay.notification(msg, 'error', -1);
}

Liberapay.wrap = function(f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch (e) {
            console.log(e);
            Liberapay.notification(e, 'error', -1);
        }
    }
};

Liberapay.jsonml = function(jsonml) {
    var node  = document.createElement(jsonml[0]);

    jQuery.each(jsonml, function(j, v) {
        if (j === 0 || typeof v === 'undefined') return;

        switch (v.constructor) {
            case Object:
                for (var p in v)
                    node.setAttribute(p, v[p]);
                break;

            case Array: node.appendChild(Liberapay.jsonml(v)); break;

            default: node.appendChild(document.createTextNode(v.toString())); break;
        }
    });

    return node;
};

(function($) {
    return $.fn.center = function(position) {
        return this.each(function() {
            var e = $(this);
            var pos = e.css('position');
            if (pos != 'absolute' && pos != 'fixed' || position && pos != position) {
                e.css('position', position || 'absolute');
            }
            e.css({
                left: '50%',
                top: '50%',
                margin: '-' + (e.innerHeight() / 2) + 'px 0 0 -' + (e.innerWidth() / 2) + 'px'
            });
        });
    };
})(jQuery);

/**********************************************************************/
/*                         avatar-fallback.js                         */
/**********************************************************************/

/* This is a temporary hack. There is no reliable cross-browser way to replace
 * broken images. However we can remove the need for this by proxying images:
 * https://github.com/liberapay/liberapay.com/issues/202
 */
$('img.avatar').on('error', function () {
    this.src = Liberapay.avatar_default_url;
});
$('img.avatar').each(function () {
    if (this.complete && this.naturalWidth === 0) {
        this.src = Liberapay.avatar_default_url;
    }
});

/**********************************************************************/
/*                             charts.js                              */
/**********************************************************************/

Liberapay.charts = {};

Liberapay.charts.init = function() {
    $('[data-charts]').each(function () {
        var url = $(this).data('charts');
        if (this.tagName == 'BUTTON') {
            var $container = $($(this).data('charts-container'));
            $(this).click(function() {
                $(this).attr('disabled', '').prop('disabled');
                Liberapay.charts.load(url, $container);
            });
        } else {
            Liberapay.charts.load(url, $(this));
        }
    });
}

Liberapay.charts.load = function(url, $container) {
    jQuery.get(url, function(series) {
        $(function() {
            Liberapay.charts.make(series, $container);
        });
    }).fail(Liberapay.error);
}

Liberapay.charts.make = function(series, $container) {
    if (series.length) {
        $('.chart-wrapper').show();
    } else {
        if (!!$container.data('msg-empty')) {
            $container.append($('<span>').text(' '+$container.data('msg-empty')));
        }
        return;
    }

    function parsePoint(o) {
        return parseFloat(o ? o.amount || o : 0);
    }

    // Reverse the series.
    // ===================
    // For historical reasons the API is descending when we want ascending.

    series.reverse();

    // Gather charts.
    // ==============
    // Sniff the first element to determine what data points are available, and
    // then search the page for chart containers matching each data point
    // variable name.

    var charts = Object.keys(series[0]).map(function(name) {
        return $('[data-chart=' + name + ']');
    }).filter(function(c) { return c.length });


    var H = $('.chart').height() - 20;
    var W = (1 / series.length).toFixed(10) * $('.chart').width();
    var skip = 0;
    if (W < 5) {
        var keep = Math.floor($('.chart').width() / 5);
        skip = series.length - keep;
        series = series.slice(-keep);
    }
    W = W > 10 ? '10px' : (W < 5 ? '5px' : Math.floor(W)+'px');


    // Compute maxes and scales.
    // =========================

    var maxes = charts.map(function(chart) {
        return series.reduce(function(previous, current) {
            return Math.max(previous, parsePoint(current[chart.data('chart')]));
        }, 0);
    });

    var scales = maxes.map(function(max) {
        return Math.ceil(max / 100) * 100; // round to nearest hundred
    });

    // Draw bars.
    // ==========

    charts.forEach(function(chart, chart_index) {
        chart.css('min-width', (series.length * 5) + 'px');
        series.forEach(function(point, index) {
            var y = parsePoint(point[chart.data('chart')]);
            var bar = $('<div>').addClass('bar');
            var shaded = $('<div>').addClass('shaded');
            shaded.html('<span class="y-label">'+ y.toFixed() +'</span>');
            if (index < series.length / 2) {
                bar.addClass('left');
            }
            bar.append(shaded);

            var xTick = $('<span>').addClass('x-tick');
            xTick.text(point.date);
            bar.append(xTick);

            // Display a max flag (only once)
            if (y === maxes[chart_index] && !chart.data('max-applied')) {
                bar.addClass('flagged');
                chart.data('max-applied', true);
            }

            bar.css('width', W);

            var h = y / scales[chart_index] * H;
            if (y > 0) h = Math.max(h, 1); // make sure only true 0 is 0 height
            shaded.css('height', h);

            bar.click(function() {
                $(this).toggleClass('flagged');
            });
            chart.append(bar);
        });
    });
};

/**********************************************************************/
/*                             colors.js                              */
/**********************************************************************/

function rgb_to_hex(color) {
    rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*1)?\)$/);
    if (rgb != null) {
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }
    return color;
}

/**********************************************************************/
/*                              forms.js                              */
/**********************************************************************/

Liberapay.forms = {};

Liberapay.forms.clearInvalid = function($form) {
    $form.find('.invalid').removeClass('invalid');
    $form.find('.abnormal').removeClass('abnormal');
};

Liberapay.forms.focusInvalid = function($form) {
    $form.find('.invalid, .abnormal').eq(0).focus();
};

Liberapay.forms.setInvalid = function($input, invalid) {
    $input.toggleClass('invalid', invalid);
    if (!!$input.attr('title') && $input.nextAll('.invalid-msg').length == 0) {
        $input.after($('<span class="invalid-msg">').text($input.attr('title')));
    }
};

Liberapay.forms.setValidity = function($input, validity) {
    $input.toggleClass('invalid', validity == 'invalid');
    $input.toggleClass('abnormal', validity == 'abnormal');
};

Liberapay.forms.jsSubmit = function() {
    // Initialize forms with the `js-submit` class
    function submit(e) {
        var form = this.form || this;
        var $form = $(form);
        if ($form.data('bypass-js-submit') === 'on') {
            setTimeout(function () { $form.data('bypass-js-submit', 'off') }, 100);
            return
        }
        e.preventDefault();
        if (form.reportValidity && form.reportValidity() == false) return;
        var target = $form.attr('action');
        var js_only = target.substr(0, 11) == 'javascript:';
        var data = $form.serializeArray();
        if (js_only) {
            // workaround for http://stackoverflow.com/q/11424037/2729778
            $form.find('input[type="checkbox"]').each(function () {
                var $input = $(this);
                if (!$input.prop('checked')) {
                    data.push({name: $input.attr('name'), value: 'off'});
                }
            });
        }
        var button = this.tagName == 'BUTTON' ? this : null;
        if (this.tagName == 'BUTTON') {
            data.push({name: this.name, value: this.value});
        }
        var $inputs = $form.find(':not(:disabled)');
        $inputs.prop('disabled', true);
        jQuery.ajax({
            url: js_only ? target.substr(11) : target,
            type: 'POST',
            data: data,
            dataType: 'json',
            success: Liberapay.forms.success($form, $inputs, button),
            error: function (jqXHR, textStatus, errorThrown) {
                $inputs.prop('disabled', false);
                var msg = null;
                if (jqXHR.responseText > "") {
                    try {
                        msg = JSON.parse(jqXHR.responseText).error_message_long;
                    } catch(exc) {
                        if (!js_only) {
                            $form.data('bypass-js-submit', 'on');
                            if (button) {
                                $(button).click();
                            } else {
                                $form.submit();
                            }
                            $inputs.prop('disabled', true);
                            return
                        }
                    }
                }
                if (typeof msg != "string" || msg.length == 0) {
                    msg = "An error occurred (" + (errorThrown || textStatus || jqXHR.status) + ").\n" +
                          "Please contact support@liberapay.com if the problem persists.";
                }
                Liberapay.notification(msg, 'error', -1);
            },
        });
    }
    $('.js-submit').submit(submit);
    $('.js-submit button').filter(':not([type]), [type="submit"]').click(submit);
    // Prevent accidental double-submits of non-JS forms
    $('form:not(.js-submit):not([action^="javascript:"])').on('submit', function (e) {
        // Check that the form hasn't already been submitted recently
        var $form = $(this);
        if ($form.data('js-submit-disable')) {
            e.preventDefault();
            return false;
        }
        // Prevent submitting again
        $form.data('js-submit-disable', true);
        var $inputs = $form.find(':not(:disabled)');
        setTimeout(function () { $inputs.prop('disabled', true); }, 100);
        // Unlock if the user comes back to the page
        $(window).on('focus pageshow', function () {
            $form.data('js-submit-disable', false);
            $inputs.prop('disabled', false);
        });
    });
};

Liberapay.forms.success = function($form, $inputs, button) { return function(data) {
    $inputs.prop('disabled', false);
    if (data.confirm) {
        if (window.confirm(data.confirm)) {
            $form.append('<input type="hidden" name="confirmed" value="true" />');
            $form.submit();
        }
        return;
    }
    $inputs.filter('[type=password]').val('');
    var on_success = $form.data('on-success');
    if (on_success && on_success.substr(0, 8) == 'fadeOut:') {
        var $e = $(button).parents(on_success.substr(8)).eq(0);
        return $e.fadeOut(null, $e.remove);
    }
    var msg = data && data.msg || $form.data('success');
    var on_success = $form.data('on-success');
    if (msg && on_success != 'reload') {
        Liberapay.notification(msg, 'success');
    } else {
        window.location.href = window.location.href;
    }
}};

/**********************************************************************/
/*                              iban.js                               */
/**********************************************************************/

// https://github.com/arhs/iban.js

(function(exports){

    // Array.prototype.map polyfill
    // code from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map
    if (!Array.prototype.map){
        Array.prototype.map = function(fun /*, thisArg */){
            "use strict";

            if (this === void 0 || this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function")
                throw new TypeError();

            var res = new Array(len);
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++)
            {
                // NOTE: Absolute correctness would demand Object.defineProperty
                //       be used.  But this method is fairly new, and failure is
                //       possible only if Object.prototype or Array.prototype
                //       has a property |i| (very unlikely), so use a less-correct
                //       but more portable alternative.
                if (i in t)
                    res[i] = fun.call(thisArg, t[i], i, t);
            }

            return res;
        };
    }

    var A = 'A'.charCodeAt(0),
        Z = 'Z'.charCodeAt(0);

    /**
     * Prepare an IBAN for mod 97 computation by moving the first 4 chars to the end and transforming the letters to
     * numbers (A = 10, B = 11, ..., Z = 35), as specified in ISO13616.
     *
     * @param {string} iban the IBAN
     * @returns {string} the prepared IBAN
     */
    function iso13616Prepare(iban) {
        iban = iban.toUpperCase();
        iban = iban.substr(4) + iban.substr(0,4);

        return iban.split('').map(function(n){
            var code = n.charCodeAt(0);
            if (code >= A && code <= Z){
                // A = 10, B = 11, ... Z = 35
                return code - A + 10;
            } else {
                return n;
            }
        }).join('');
    }

    /**
     * Calculates the MOD 97 10 of the passed IBAN as specified in ISO7064.
     *
     * @param iban
     * @returns {number}
     */
    function iso7064Mod97_10(iban) {
        var remainder = iban,
            block;

        while (remainder.length > 2){
            block = remainder.slice(0, 9);
            remainder = parseInt(block, 10) % 97 + remainder.slice(block.length);
        }

        return parseInt(remainder, 10) % 97;
    }

    /**
     * Parse the BBAN structure used to configure each IBAN Specification and returns a matching regular expression.
     * A structure is composed of blocks of 3 characters (one letter and 2 digits). Each block represents
     * a logical group in the typical representation of the BBAN. For each group, the letter indicates which characters
     * are allowed in this group and the following 2-digits number tells the length of the group.
     *
     * @param {string} structure the structure to parse
     * @returns {RegExp}
     */
    function parseStructure(structure){
        // split in blocks of 3 chars
        var regex = structure.match(/(.{3})/g).map(function(block){

            // parse each structure block (1-char + 2-digits)
            var format,
                pattern = block.slice(0, 1),
                repeats = parseInt(block.slice(1), 10);

            switch (pattern){
                case "A": format = "0-9A-Za-z"; break;
                case "B": format = "0-9A-Z"; break;
                case "C": format = "A-Za-z"; break;
                case "F": format = "0-9"; break;
                case "L": format = "a-z"; break;
                case "U": format = "A-Z"; break;
                case "W": format = "0-9a-z"; break;
            }

            return '([' + format + ']{' + repeats + '})';
        });

        return new RegExp('^' + regex.join('') + '$');
    }

    /**
     * Create a new Specification for a valid IBAN number.
     *
     * @param countryCode the code of the country
     * @param length the length of the IBAN
     * @param structure the structure of the undernying BBAN (for validation and formatting)
     * @param example an example valid IBAN
     * @constructor
     */
    function Specification(countryCode, length, structure, example){

        this.countryCode = countryCode;
        this.length = length;
        this.structure = structure;
        this.example = example;
    }

    /**
     * Lazy-loaded regex (parse the structure and construct the regular expression the first time we need it for validation)
     */
    Specification.prototype._regex = function(){
        return this._cachedRegex || (this._cachedRegex = parseStructure(this.structure))
    };

    /**
     * Check if the passed iban is valid according to this specification.
     *
     * @param {String} iban the iban to validate
     * @returns {boolean} true if valid, false otherwise
     */
    Specification.prototype.isValid = function(iban){
        return this.length == iban.length
            && this.countryCode === iban.slice(0,2)
            && this._regex().test(iban.slice(4))
            && iso7064Mod97_10(iso13616Prepare(iban)) == 1;
    };

    /**
     * Convert the passed IBAN to a country-specific BBAN.
     *
     * @param iban the IBAN to convert
     * @param separator the separator to use between BBAN blocks
     * @returns {string} the BBAN
     */
    Specification.prototype.toBBAN = function(iban, separator) {
        return this._regex().exec(iban.slice(4)).slice(1).join(separator);
    };

    /**
     * Convert the passed BBAN to an IBAN for this country specification.
     * Please note that <i>"generation of the IBAN shall be the exclusive responsibility of the bank/branch servicing the account"</i>.
     * This method implements the preferred algorithm described in http://en.wikipedia.org/wiki/International_Bank_Account_Number#Generating_IBAN_check_digits
     *
     * @param bban the BBAN to convert to IBAN
     * @returns {string} the IBAN
     */
    Specification.prototype.fromBBAN = function(bban) {
        if (!this.isValidBBAN(bban)){
            throw new Error('Invalid BBAN');
        }

        var remainder = iso7064Mod97_10(iso13616Prepare(this.countryCode + '00' + bban)),
            checkDigit = ('0' + (98 - remainder)).slice(-2);

        return this.countryCode + checkDigit + bban;
    };

    /**
     * Check of the passed BBAN is valid.
     * This function only checks the format of the BBAN (length and matching the letetr/number specs) but does not
     * verify the check digit.
     *
     * @param bban the BBAN to validate
     * @returns {boolean} true if the passed bban is a valid BBAN according to this specification, false otherwise
     */
    Specification.prototype.isValidBBAN = function(bban) {
        return this.length - 4 == bban.length
            && this._regex().test(bban);
    };

    var countries = {};

    function addSpecification(IBAN){
        countries[IBAN.countryCode] = IBAN;
    }

    addSpecification(new Specification("AD", 24, "F04F04A12",          "AD1200012030200359100100"));
    addSpecification(new Specification("AE", 23, "F03F16",             "AE070331234567890123456"));
    addSpecification(new Specification("AL", 28, "F08A16",             "AL47212110090000000235698741"));
    addSpecification(new Specification("AT", 20, "F05F11",             "AT611904300234573201"));
    addSpecification(new Specification("AZ", 28, "U04A20",             "AZ21NABZ00000000137010001944"));
    addSpecification(new Specification("BA", 20, "F03F03F08F02",       "BA391290079401028494"));
    addSpecification(new Specification("BE", 16, "F03F07F02",          "BE68539007547034"));
    addSpecification(new Specification("BG", 22, "U04F04F02A08",       "BG80BNBG96611020345678"));
    addSpecification(new Specification("BH", 22, "U04A14",             "BH67BMAG00001299123456"));
    addSpecification(new Specification("BR", 29, "F08F05F10U01A01",    "BR9700360305000010009795493P1"));
    addSpecification(new Specification("CH", 21, "F05A12",             "CH9300762011623852957"));
    addSpecification(new Specification("CR", 21, "F03F14",             "CR0515202001026284066"));
    addSpecification(new Specification("CY", 28, "F03F05A16",          "CY17002001280000001200527600"));
    addSpecification(new Specification("CZ", 24, "F04F06F10",          "CZ6508000000192000145399"));
    addSpecification(new Specification("DE", 22, "F08F10",             "DE89370400440532013000"));
    addSpecification(new Specification("DK", 18, "F04F09F01",          "DK5000400440116243"));
    addSpecification(new Specification("DO", 28, "U04F20",             "DO28BAGR00000001212453611324"));
    addSpecification(new Specification("EE", 20, "F02F02F11F01",       "EE382200221020145685"));
    addSpecification(new Specification("ES", 24, "F04F04F01F01F10",    "ES9121000418450200051332"));
    addSpecification(new Specification("FI", 18, "F06F07F01",          "FI2112345600000785"));
    addSpecification(new Specification("FO", 18, "F04F09F01",          "FO6264600001631634"));
    addSpecification(new Specification("FR", 27, "F05F05A11F02",       "FR1420041010050500013M02606"));
    addSpecification(new Specification("GB", 22, "U04F06F08",          "GB29NWBK60161331926819"));
    addSpecification(new Specification("GE", 22, "U02F16",             "GE29NB0000000101904917"));
    addSpecification(new Specification("GI", 23, "U04A15",             "GI75NWBK000000007099453"));
    addSpecification(new Specification("GL", 18, "F04F09F01",          "GL8964710001000206"));
    addSpecification(new Specification("GR", 27, "F03F04A16",          "GR1601101250000000012300695"));
    addSpecification(new Specification("GT", 28, "A04A20",             "GT82TRAJ01020000001210029690"));
    addSpecification(new Specification("HR", 21, "F07F10",             "HR1210010051863000160"));
    addSpecification(new Specification("HU", 28, "F03F04F01F15F01",    "HU42117730161111101800000000"));
    addSpecification(new Specification("IE", 22, "U04F06F08",          "IE29AIBK93115212345678"));
    addSpecification(new Specification("IL", 23, "F03F03F13",          "IL620108000000099999999"));
    addSpecification(new Specification("IS", 26, "F04F02F06F10",       "IS140159260076545510730339"));
    addSpecification(new Specification("IT", 27, "U01F05F05A12",       "IT60X0542811101000000123456"));
    addSpecification(new Specification("KW", 30, "U04A22",             "KW81CBKU0000000000001234560101"));
    addSpecification(new Specification("KZ", 20, "F03A13",             "KZ86125KZT5004100100"));
    addSpecification(new Specification("LB", 28, "F04A20",             "LB62099900000001001901229114"));
    addSpecification(new Specification("LI", 21, "F05A12",             "LI21088100002324013AA"));
    addSpecification(new Specification("LT", 20, "F05F11",             "LT121000011101001000"));
    addSpecification(new Specification("LU", 20, "F03A13",             "LU280019400644750000"));
    addSpecification(new Specification("LV", 21, "U04A13",             "LV80BANK0000435195001"));
    addSpecification(new Specification("MC", 27, "F05F05A11F02",       "MC5811222000010123456789030"));
    addSpecification(new Specification("MD", 24, "U02F18",             "MD24AG000225100013104168"));
    addSpecification(new Specification("ME", 22, "F03F13F02",          "ME25505000012345678951"));
    addSpecification(new Specification("MK", 19, "F03A10F02",          "MK07250120000058984"));
    addSpecification(new Specification("MR", 27, "F05F05F11F02",       "MR1300020001010000123456753"));
    addSpecification(new Specification("MT", 31, "U04F05A18",          "MT84MALT011000012345MTLCAST001S"));
    addSpecification(new Specification("MU", 30, "U04F02F02F12F03U03", "MU17BOMM0101101030300200000MUR"));
    addSpecification(new Specification("NL", 18, "U04F10",             "NL91ABNA0417164300"));
    addSpecification(new Specification("NO", 15, "F04F06F01",          "NO9386011117947"));
    addSpecification(new Specification("PK", 24, "U04A16",             "PK36SCBL0000001123456702"));
    addSpecification(new Specification("PL", 28, "F08F16",             "PL61109010140000071219812874"));
    addSpecification(new Specification("PS", 29, "U04A21",             "PS92PALS000000000400123456702"));
    addSpecification(new Specification("PT", 25, "F04F04F11F02",       "PT50000201231234567890154"));
    addSpecification(new Specification("RO", 24, "U04A16",             "RO49AAAA1B31007593840000"));
    addSpecification(new Specification("RS", 22, "F03F13F02",          "RS35260005601001611379"));
    addSpecification(new Specification("SA", 24, "F02A18",             "SA0380000000608010167519"));
    addSpecification(new Specification("SE", 24, "F03F16F01",          "SE4550000000058398257466"));
    addSpecification(new Specification("SI", 19, "F05F08F02",          "SI56263300012039086"));
    addSpecification(new Specification("SK", 24, "F04F06F10",          "SK3112000000198742637541"));
    addSpecification(new Specification("SM", 27, "U01F05F05A12",       "SM86U0322509800000000270100"));
    addSpecification(new Specification("TN", 24, "F02F03F13F02",       "TN5910006035183598478831"));
    addSpecification(new Specification("TR", 26, "F05A01A16",          "TR330006100519786457841326"));
    addSpecification(new Specification("VG", 24, "U04F16",             "VG96VPVG0000012345678901"));

    // Angola
    addSpecification(new Specification("AO", 25, "F21",                "AO69123456789012345678901"));
    // Burkina
    addSpecification(new Specification("BF", 27, "F23",                "BF2312345678901234567890123"));
    // Burundi
    addSpecification(new Specification("BI", 16, "F12",                "BI41123456789012"));
    // Benin
    addSpecification(new Specification("BJ", 28, "F24",                "BJ39123456789012345678901234"));
    // Ivory
    addSpecification(new Specification("CI", 28, "U01F23",             "CI17A12345678901234567890123"));
    // Cameron
    addSpecification(new Specification("CM", 27, "F23",                "CM9012345678901234567890123"));
    // Cape Verde
    addSpecification(new Specification("CV", 25, "F21",                "CV30123456789012345678901"));
    // Algeria
    addSpecification(new Specification("DZ", 24, "F20",                "DZ8612345678901234567890"));
    // Iran
    addSpecification(new Specification("IR", 26, "F22",                "IR861234568790123456789012"));
    // Jordan
    addSpecification(new Specification("JO", 30, "A04F22",             "JO15AAAA1234567890123456789012"));
    // Madagascar
    addSpecification(new Specification("MG", 27, "F23",                "MG1812345678901234567890123"));
    // Mali
    addSpecification(new Specification("ML", 28, "U01F23",             "ML15A12345678901234567890123"));
    // Mozambique
    addSpecification(new Specification("MZ", 25, "F21",                "MZ25123456789012345678901"));
    // Quatar
    addSpecification(new Specification("QA", 29, "U04A21",             "QA30AAAA123456789012345678901"));
    // Senegal
    addSpecification(new Specification("SN", 28, "U01F23",             "SN52A12345678901234567890123"));
    // Ukraine
    addSpecification(new Specification("UA", 29, "F25",                "UA511234567890123456789012345"));

    var NON_ALPHANUM = /[^a-zA-Z0-9]/g,
        EVERY_FOUR_CHARS =/(.{4})(?!$)/g;

    /**
     * Utility function to check if a variable is a String.
     *
     * @param v
     * @returns {boolean} true if the passed variable is a String, false otherwise.
     */
    function isString(v){
        return (typeof v == 'string' || v instanceof String);
    }

    /**
     * Check if an IBAN is valid.
     *
     * @param {String} iban the IBAN to validate.
     * @returns {boolean} true if the passed IBAN is valid, false otherwise
     */
    exports.isValid = function(iban){
        if (!isString(iban)){
            return false;
        }
        iban = this.electronicFormat(iban);
        var countryStructure = countries[iban.slice(0,2)];
        return !!countryStructure && countryStructure.isValid(iban);
    };

    /**
     * Convert an IBAN to a BBAN.
     *
     * @param iban
     * @param {String} [separator] the separator to use between the blocks of the BBAN, defaults to ' '
     * @returns {string|*}
     */
    exports.toBBAN = function(iban, separator){
        if (typeof separator == 'undefined'){
            separator = ' ';
        }
        iban = this.electronicFormat(iban);
        var countryStructure = countries[iban.slice(0,2)];
        if (!countryStructure) {
            throw new Error('No country with code ' + iban.slice(0,2));
        }
        return countryStructure.toBBAN(iban, separator);
    };

    /**
     * Convert the passed BBAN to an IBAN for this country specification.
     * Please note that <i>"generation of the IBAN shall be the exclusive responsibility of the bank/branch servicing the account"</i>.
     * This method implements the preferred algorithm described in http://en.wikipedia.org/wiki/International_Bank_Account_Number#Generating_IBAN_check_digits
     *
     * @param countryCode the country of the BBAN
     * @param bban the BBAN to convert to IBAN
     * @returns {string} the IBAN
     */
    exports.fromBBAN = function(countryCode, bban){
        var countryStructure = countries[countryCode];
        if (!countryStructure) {
            throw new Error('No country with code ' + countryCode);
        }
        return countryStructure.fromBBAN(this.electronicFormat(bban));
    };

    /**
     * Check the validity of the passed BBAN.
     *
     * @param countryCode the country of the BBAN
     * @param bban the BBAN to check the validity of
     */
    exports.isValidBBAN = function(countryCode, bban){
        if (!isString(bban)){
            return false;
        }
        var countryStructure = countries[countryCode];
        return countryStructure && countryStructure.isValidBBAN(this.electronicFormat(bban));
    };

    /**
     *
     * @param iban
     * @param separator
     * @returns {string}
     */
    exports.printFormat = function(iban, separator){
        if (typeof separator == 'undefined'){
            separator = ' ';
        }
        return this.electronicFormat(iban).replace(EVERY_FOUR_CHARS, "$1" + separator);
    };

    /**
     *
     * @param iban
     * @returns {string}
     */
    exports.electronicFormat = function(iban){
        return iban.replace(NON_ALPHANUM, '').toUpperCase();
    };

    /**
     * An object containing all the known IBAN specifications.
     */
    exports.countries = countries;

})(typeof exports == 'undefined' ? this.IBAN = {} : exports);

/**********************************************************************/
/*                          identity-docs.js                          */
/**********************************************************************/


Liberapay.identity_docs_init = function () {

    var $form = $('#identity-form-2');
    if ($form.length === 0) return;
    var form = $form.get(0);
    var $form_submit_button = $('#identity-form-2 button').filter(':not([type]), [type="submit"]');
    var $inputs = $form.find(':not(:disabled)').filter(function () {
        return $(this).parents('.fine-uploader').length == 0
    });

    var uploaders = [];
    $('.fine-uploader').each(function () {
        // https://docs.fineuploader.com/api/options.html
        var uploader = new qq.FineUploader({
            element: this,
            template: document.getElementById('qq-template'),
            autoUpload: false,
            request: {
                endpoint: $form.data('upload-url'),
                params: {
                    action: 'add_page',
                    csrf_token: Liberapay.getCookie('csrf_token'),
                },
            },
            validation: {
                allowedExtensions: $form.data('allowed-extensions').split(', '),
                sizeLimit: $form.data('doc-max-size'),
            },
            display: {
                fileSizeOnSubmit: true,
            },
            text: {
                fileInputTitle: '',
            },
            callbacks: {
                onAllComplete: function (successes, failures) {
                    if (successes.length > 0 && failures.length == 0) {
                        validate_doc(uploader, uploader._options.request.params.doc_id)
                    }
                },
                onSubmitted: function () {
                    $form_submit_button.prop('disabled', false);
                },
            },
        });
        uploader._doc_type_ = $(this).attr('name');
        uploaders.push(uploader);
    });

    function create_doc(uploader, doc_type) {
        jQuery.ajax({
            url: uploader._options.request.endpoint,
            type: 'POST',
            data: {action: 'create_doc', 'doc_type': doc_type},
            dataType: 'json',
            success: function (data) {
                uploader._options.request.params.doc_id = data.doc_id;
                uploader.uploadStoredFiles();
            },
            error: [
                function () { $inputs.prop('disabled', false); },
                Liberapay.error,
            ],
        });
    }

    function validate_doc(uploader, doc_id) {
        jQuery.ajax({
            url: uploader._options.request.endpoint,
            type: 'POST',
            data: {action: 'validate_doc', 'doc_id': doc_id},
            dataType: 'json',
            success: function (data) {
                uploader._allComplete_ = true;
                var allComplete = true;
                $.each(uploaders, function () {
                    if (!this._allComplete_) {
                        allComplete = false;
                    }
                });
                if (allComplete === true) {
                    window.location.href = window.location.href;
                }
            },
            error: [
                function () { $inputs.prop('disabled', false); },
                Liberapay.error,
            ],
        });
    }

    function submit(e, confirmed) {
        e.preventDefault();
        if (!confirmed && form.reportValidity && form.reportValidity() == false) return;
        var data = $form.serializeArray();
        $inputs.prop('disabled', true);
        jQuery.ajax({
            url: '',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function (data) {
                $inputs.prop('disabled', false);
                if (data.confirm) {
                    if (window.confirm(data.confirm)) {
                        $form.append('<input type="hidden" name="confirmed" value="true" />');
                        return submit(e, true);
                    };
                    return;
                }
                var count = 0;
                $.each(uploaders, function (i, uploader) {
                    if (uploader._storedIds.length !== 0) {
                        count += uploader._storedIds.length;
                        if (uploader._options.request.params.doc_id) {
                            uploader.uploadStoredFiles();
                        } else {
                            create_doc(uploader, uploader._doc_type_);
                        }
                    }
                });
                if (count == 0) {
                    window.location.href = window.location.href;
                }
            },
            error: [
                function () { $inputs.prop('disabled', false); },
                Liberapay.error,
            ],
        });
    }
    $form.submit(submit);
    $form_submit_button.click(submit);

};

/**********************************************************************/
/*                             lookup.js                              */
/**********************************************************************/

Liberapay.lookup = {};

Liberapay.lookup.init = function() {
    $('form.username-lookup').each(function() {
        var $form = $(this);
        var $input = $form.find('input[name="username"]');
        var $results = $form.find('.lookup-results');
        $results.css('width', $input.css('width'));

        var lookup_timeout = null;
        function lookup() {
            if (lookup_timeout) clearTimeout(lookup_timeout);
            var query = $(this).val();
            if (query.length < 3)
                $results.empty();
            else {
                lookup_timeout = setTimeout(function() {
                    jQuery.get("/search.json", {scope: 'usernames', q: query}).success(drawLookupResults);
                }, 300);
            }
        }

        function drawLookupResults(results) {
            var items = [];
            var results = results.usernames;
            for (var i=0, len=results.length; i<len; i++) {
                var result = results[i];
                items.push(Liberapay.jsonml(
                    ['li', {"data-id": result.id}, result.username]
                ));
            }
            $results.html(items);
        }

        function selectLookupResult() {
            $input.val($(this).html()).focus();
            $results.empty();
        }

        $results.on('click', 'li', selectLookupResult);
        $input.keyup(lookup);
    });
};

/**********************************************************************/
/*                            mangopay.js                             */
/**********************************************************************/

// https://github.com/Mangopay/cardregistration-js-kit (MODIFIED)

var mangoPay = {


    /**
     * Handles card registration process
     */
    cardRegistration: {


        /**
         * MangoPay API base URL. The default value uses sandbox envronment.
         *
         * Set it to https://api.mangopay.com to enable production environment
         */
        baseURL: "https://api.sandbox.mangopay.com",


        /**
         * MangoPay Client ID to use with the MangoPay API
         *
         * Set it to your Client ID you use for MangoPay API
         */
        clientId : "",


        /**
         * Initialize card registration object
         * 
         * @param {object} cardRegisterData Card pre-registration data {Id, cardRegistrationURL, preregistrationData, accessKey}
         */
        init: function(cardRegisterData) {

            this._cardRegisterData = cardRegisterData;

        },


        /**
         * Processes card registration and calls success or error callback
         *
         * @param {object} cardData Sensitive card details {cardNumber, cardType, cardExpirationDate, cardCvx}
         * @param {function} successCallback A function to invoke when the card registration succeeds. It will receive CardRegistration object.
         * @param {function} errorCallback A function to invoke when the the card registration fails. It will receive an error object {ResultCode, ResultMessage}. 
         */
        registerCard: function(cardData, successCallback, errorCallback) {

            // Browser is not capable of making cross-origin Ajax calls
            if (!mangoPay.browser.corsSupport()) {
                errorCallback({
                    "ResultCode": "009999",
                    "ResultMessage": "Browser does not support making cross-origin Ajax calls"
                });
                return;
            }

            // Validate card data
            // var isCardValid = mangoPay.cardRegistration._validateCardData(cardData);
            // if (isCardValid !== true) {
            //     errorCallback(isCardValid);
            //     return;
            // };

            // Try to register card in two steps: get Payline token and then finish card registration with MangoPay API
            mangoPay.cardRegistration._tokenizeCard(
                cardData,
                mangoPay.cardRegistration._finishRegistration,
                successCallback,
                errorCallback
            );

        },


        /**
         * PRIVATE. Validates card data. Returns true if card data is valid or a message string otherwise
         *
         * @param {object} cardData Sensitive card details {cardNumber, cardType, cardExpirationDate, cardCvx}
         */
        _validateCardData: function(cardData) {

            // Validate card number
            var isCardValid = mangoPay._validation._cardNumberValidator._validate(cardData.cardNumber);
            if (isCardValid !== true) return isCardValid;

            // Validate expiration date
            var isDateValid = mangoPay._validation._expirationDateValidator._validate(cardData.cardExpirationDate, new Date());
            if (isDateValid !== true) return isDateValid;

            // Validate card CVx based on card type
            var isCvvValid = mangoPay._validation._cvvValidator._validate(cardData.cardCvx, cardData.cardType);
            if (isCvvValid !== true) return isCvvValid;

            // The data looks good
            return true;

        },


        /**
         * PRIVATE. Gets Payline token for the card
         *
         * @param {object} cardData Sensitive card details {cardNumber, cardExpirationDate, cardCvx, cardType}
         * @param {function} resultCallback A function to invoke when getting the token succeeds
         * @param {function} successCallback A function to invoke when card registration succeeds
         * @param {function} errorCallback A function to invoke when card registration fails
         */
        _tokenizeCard: function(cardData, resultCallback, successCallback, errorCallback) {

            // Get Payline token
            mangoPay._networking._ajax({

                // Payline expects POST
                type: "post",

                // Payline service URL obtained from the mangoPay.cardRegistration.init() call
                url: this._cardRegisterData.cardRegistrationURL,

                // Force CORS
                crossDomain: true,

                // Sensitive card data plus pre-registration data and access key received from the mangoPay.cardRegistration.init() call
                data: {
                    data: this._cardRegisterData.preregistrationData,
                    accessKeyRef: this._cardRegisterData.accessKey,
                    cardNumber: cardData.cardNumber,
                    cardExpirationDate: cardData.cardExpirationDate,
                    cardCvx: cardData.cardCvx
                },

                // Forward response to the return URL
                success: function(data, xmlhttp) {

                    var dataToSend = "";

                    // Something wrong, no data came back from Payline
                    if (data === null) {
                        errorCallback({
                            "ResultCode": "001599", 
                            "ResultMessage": "Token processing error",
                            "xmlhttp": xmlhttp
                        });
                        return;
                    }

                    // Prepare data to send in the second step
                    dataToSend = {
                        Id: mangoPay.cardRegistration._cardRegisterData.Id,
                        RegistrationData: data
                    };

                    // Complete card regisration with MangoPay API
                    resultCallback(dataToSend, successCallback, errorCallback);

                },

                // Invoke error callback
                error: function(xmlhttp) {
                    if (xmlhttp.ResultCode) return errorCallback(xmlhttp);
                    errorCallback({
                        "ResultCode": "001599", 
                        "ResultMessage": "Token processing error",
                        "xmlhttp": xmlhttp
                    });
                    return;
                }

            });

        },


        /**
         * PRIVATE. Finishes card registration using the encrypted Payline token data
         *
         * @param {object} paylineData Object {Id, RegistrationData} with card registration resource id and payline token data
         * @param {function} successCallback A function to invoke when the card registration call succeeds
         * @param {function} errorCallback A function to invoke when the card registration call fails
         */
        _finishRegistration: function(paylineData, successCallback, errorCallback) {

            // Use MangoPay API call to complete card regisration
            mangoPay._networking._ajax({

                // This call exceptionally uses POST for browser compatibility (for IE 8 and 9)
                type: "post",

                // Force CORS
                crossDomain: true,

                // URL to MangoPay API CardRegistration resource
                url: mangoPay.cardRegistration.baseURL + '/v2/' + mangoPay.cardRegistration.clientId + '/CardRegistrations/' + paylineData.Id,

                // Payline card registration data along CardRegistration resource id
                data: paylineData,

                // Invoke the user supplied success or error handler here
                success: function(data, xmlhttp) {

                    // Parse API reponse
                    try {
                       data = JSON.parse(data);
                    }
                    catch(err) {
                        errorCallback({
                            "ResultCode": "101699",
                            "ResultMessage": "CardRegistration should return a valid JSON response",
                            "xmlhttp": xmlhttp
                        });
                        return;
                    }

                    // Invoke user supplied success or error callbacks
                    if (data.ResultCode === "000000") {
                        successCallback(data);
                    } else {
                        errorCallback(data);
                    }

                },

                // Forward error to user supplied callback
                error: function(xmlhttp) {

                    if (xmlhttp.ResultCode) return errorCallback(xmlhttp);

                    var message = "CardRegistration error";

                    // Try to get API error message
                    if (xmlhttp.response) {
                        try {
                            var responseParsed = JSON.parse(xmlhttp.response);
                            if (responseParsed.Message) {
                                message = responseParsed.Message;
                            }
                        }
                        catch(err) {}
                    }

                    // Invoke user supplied error callback
                    errorCallback({
                        "ResultCode": "101699", 
                        "ResultMessage": message,
                        "xmlhttp": xmlhttp
                    });

                }

            });

        }


    },


    /**
     * PRIVATE. Includes various validation code (private)
     */
    _validation: {


        /**
         * PRIVATE. Card CVx validation
         */
        _cvvValidator: {


            /**
             * PRIVATE. Validates CVV code
             *
             * @param {string} cvv Card CVx to check
             * @param {string} cardType Type of card to check (AMEX or CB_VISA_MASTERCARD)
             */
            _validate: function(cvv, cardType) {

               if(cardType === "MAESTRO") {
                   return true;
               }
               cvv = cvv ? cvv.trim() : "";
               cardType = cardType ? cardType.trim() : "";

               // CVV is 3 to 4 digits for AMEX cards and 3 digits for all other cards
               if (mangoPay._validation._helpers._validateNumericOnly(cvv) === true) {
                    if (cardType === "AMEX" && (cvv.length === 3 || cvv.length === 4)) {
                        return true;
                    }
                    if (cardType === "CB_VISA_MASTERCARD" && cvv.length === 3) {
                        return true;
                    }
               }

               // Invalid format
               return {
                   "ResultCode": "105204",
                   "ResultMessage": "CVV_FORMAT_ERROR"
               };

            }


        },


        /**
         * PRIVATE. Card expiration validation
         */
        _expirationDateValidator: {


            /**
             * PRIVATE. Validates date code in mmyy format
             *
             * @param {string} cardDate Card expiration date to check
             */
            _validate: function(cardDate, currentDate) {

               cardDate = cardDate ? cardDate.trim() : "";

               // Requires 2 digit for month and 2 digits for year
               if (cardDate.length === 4) {

                   var year = parseInt(cardDate.substr(2,2),10) + 2000;
                   var month = parseInt(cardDate.substr(0,2),10);

                   if (month > 0 && month <= 12) {

                        var currentYear = currentDate.getFullYear();
                        if (currentYear < year)
                            return true;
                        
                        if (currentYear === year)
                        {
                            var currentMonth = currentDate.getMonth() + 1;
                            if (currentMonth <= month)
                                return true;
                        }

                       // Date is in the past
                       return {
                           "ResultCode": "105203",
                           "ResultMessage": "PAST_EXPIRY_DATE_ERROR"
                       };

                    }
               }

               // Date does not look correct
               return {
                   "ResultCode": "105203",
                   "ResultMessage": "EXPIRY_DATE_FORMAT_ERROR"
               };
            }


        },


        /**
         * PRIVATE. Card number validation
         */
        _cardNumberValidator: {


            /**
             * PRIVATE. Validates card number
             *
             * @param {string} cardNumber Card number to check
             */
            _validate: function(cardNumber) {

               cardNumber = cardNumber ? cardNumber.trim() : "";

               // Check for numbers only
               if (mangoPay._validation._helpers._validateNumericOnly(cardNumber) === false) {
                   return {
                       "ResultCode": "105202",
                       "ResultMessage": "CARD_NUMBER_FORMAT_ERROR"
                   };
               }

               // Compute and validate check digit
               if (this._validateCheckDigit(cardNumber) === false) {
                   return {
                       "ResultCode": "105202",
                       "ResultMessage": "CARD_NUMBER_FORMAT_ERROR"
                   };
               }

               // Number seems ok
               return true;

            },


            /**
             * PRIVATE. Validates card number check digit
             *
             * @param {string} cardNumber Card number to check
             */
            _validateCheckDigit: function(cardNumber) {

                // From https://stackoverflow.com/questions/12310837/implementation-of-luhn-algorithm
                var nCheck = 0;
                var nDigit = 0;
                var bEven = false;

                var value = cardNumber.replace(/\D/g, "");

                for (var n = value.length - 1; n >= 0; n--) {
                    var cDigit = value.charAt(n),
                        nDigit = parseInt(cDigit, 10);
                    if (bEven) {
                        if ((nDigit *= 2) > 9) nDigit -= 9;
                    }
                    nCheck += nDigit;
                    bEven = !bEven;
                }

                return (nCheck % 10) === 0;

            },

        },


        /**
         * PRIVATE. Validation helpers
         */
        _helpers: {


            /**
             * PRIVATE. Validates if given string contain only numbers
             * @param {string} input numeric string to check
             */
            _validateNumericOnly: function(input) {

                var numbers = /^[0-9]+$/;

                if(input.match(numbers)) {
                    return true;  
                }

                return false;

            }


        }


    },


    /**
     * PRIVATE. Networking stuff
     */
    _networking: {


        /**
         * PRIVATE. Performs an asynchronous HTTP (Ajax) request
         *
         * @param {object} settings {type, crossDomain, url, data, success, error}
         */
        _ajax: function(settings) {

            // XMLHttpRequest object
            var xmlhttp = new XMLHttpRequest();

            // Put together input data as string
            var parameters = "";
            for (var key in settings.data) {
                parameters += (parameters.length > 0 ? '&' : '') + key + "=" + encodeURIComponent(settings.data[key]);
            }

            // URL to hit, with parameters added for GET request
            var url = settings.url;
            if (settings.type === "get") {
                url = settings.url + (settings.url.indexOf("?") > -1 ? '&' : '?') + parameters;
            }

            // Cross-domain requests in IE 7, 8 and 9 using XDomainRequest
            if (settings.crossDomain && !("withCredentials" in xmlhttp) && window.XDomainRequest) {
                xdr = new XDomainRequest();
                xdr.onerror = function() {
                    settings.error(xdr);
                };
                xdr.onload = function() {
                    settings.success(xdr.responseText, xdr);
                };
                xdr.open(settings.type, url);
                xdr.send(settings.type === "post" ? parameters : null);
                return;
            }

            // Attach success and error handlers
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4) {
                    if (/^2[0-9][0-9]$/.test(xmlhttp.status)) {
                        settings.success(xmlhttp.responseText, xmlhttp);
                    } else {
                        settings.error(xmlhttp, xmlhttp.status, xmlhttp.statusText);
                    }
                }
            };

            // Open connection
            try {
                xmlhttp.open(settings.type, url, true);
            } catch (e) {
                if (settings.crossDomain)
                    return settings.error({ResultCode: "1000000", ResultMessage: "CORS_FAIL"});
                else
                    return settings.error({ResultCode: "1000001", ResultMessage: "XHR_FAIL"});
            }

            // Send extra header for POST request
            if (settings.type === "post") {
                xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            }

            // Send data
            try {
                xmlhttp.send(settings.type === "post" ? parameters : null);
            } catch (e) {
                if (settings.crossDomain)
                    return settings.error({ResultCode: "1000000", ResultMessage: "CORS_FAIL"});
                else
                    return settings.error({ResultCode: "1000001", ResultMessage: "XHR_FAIL"});
            }

        },


    },


    /**
     * Browser support querying
     */
    browser: {


        /**
         * Returns true if browser is capable of making cross-origin Ajax calls
         */
        corsSupport: function() {

            // IE 10 and above, Firefox, Chrome, Opera etc.
            if ("withCredentials" in new XMLHttpRequest()) {
                return true;
            }

            // IE 8 and IE 9
            if (window.XDomainRequest) {
                return true;
            }

            return false;

        }


    }


};


// for older browsers define trim function (IE 8)
if(! String.prototype.trim){  
    String.prototype.trim = function(){  
        return this.replace(/^\s+|\s+$/g,'');  
    };
}


/**********************************************************************/
/*                          notification.js                           */
/**********************************************************************/

/**
 * Display a notification
 * Valid notification types are "error" and "success".
 */
Liberapay.notification = function(text, type, timeout) {
    if (text.length === 0) return;

    var type = type || 'notice';
    var timeout = timeout || (type == 'error' ? 10000 : 5000);

    var dialog = ['div', { 'class': 'notification notification-' + type }, text];
    var $dialog = $(Liberapay.jsonml(dialog));

    if (!$('#notification-area-bottom').length)
        $('body').append('<div id="notification-area-bottom"></div>');

    $('#notification-area-bottom').prepend($dialog);

    function close() {
        $dialog.fadeOut(null, $dialog.remove);
    }

    $dialog.append($('<span class="close">&times;</span>').click(close));
    if (timeout > 0) setTimeout(close, timeout);
};

/**********************************************************************/
/*                          payment-cards.js                          */
/**********************************************************************/

// https://github.com/liberapay/payment-cards.js

var PaymentCards = function () {

    var defaultSpacing = [4, 8, 12];
    var dinersSpacing = [4, 10];

    // https://en.wikipedia.org/wiki/Issuer_identification_number
    var rangesArray = [
        {
            brand: 'American Express',
            pattern: /^3[47]/,
            spacing: dinersSpacing,
            panLengths: [15],
            cvnLengths: [4]
        },
        {
            brand: 'Diners Club',
            pattern: /^(30[0-5]|3095|3[689])/,
            spacing: dinersSpacing,
            panLengths: [14, 15, 16, 17, 18, 19],
            cvnLengths: [3]
        },
        {
            brand: 'Discover',
            pattern: /^(6011|64[4-9]|65)/,
            spacing: defaultSpacing,
            panLengths: [16, 17, 18, 19],
            cvnLengths: [3]
        },
        {
            brand: 'JCB',
            pattern: /^35/,
            spacing: defaultSpacing,
            panLengths: [16],
            cvnLengths: [3]
        },
        {
            brand: 'Maestro',
            pattern: /^(50|5[6-8]|6)/,
            spacing: defaultSpacing,
            panLengths: [12, 13, 14, 15, 16, 17, 18, 19],
            cvnLengths: [3]
        },
        {
            brand: 'MasterCard',
            pattern: /^(5[1-5]|222[1-9]|2[3-6]|27[0-1]|2720)/,
            spacing: defaultSpacing,
            panLengths: [16],
            cvnLengths: [3]
        },
        {
            brand: 'Visa',
            pattern: /^4/,
            spacing: defaultSpacing,
            panLengths: [13, 16, 19],
            cvnLengths: [3]
        }
    ];

    function getRange(cardNumber) {
        var range, j, len;
        cardNumber = (cardNumber + '').replace(/\D/g, '');
        for (j = 0, len = rangesArray.length; j < len; j++) {
            range = rangesArray[j];
            if (range.pattern.test(cardNumber)) {
                return range;
            }
        }
    }

    function getSpacing(cardNumber) {
        var range = getRange(cardNumber);
        return range ? range.spacing : null;
    }

    function restrictNumeric(input, maxLength, formatter) {
        if (!input.addEventListener) return;
        input.addEventListener('keypress', function(e) {
            if (e.metaKey || e.ctrlKey || e.which < 32) {
                // Don't interfere with things like copy-pasting
                return;
            }
            if (input.value.replace(/\D/g, '').length === maxLength) {
                // Enforce maxLength
                if (input.selectionStart != input.selectionEnd) {
                    // Allow overwriting selected digits
                    return;
                }
                return e.preventDefault();
            }
            if (/^\d+$/.test(String.fromCharCode(e.which)) == false) {
                // Reject non-numeric characters
                return e.preventDefault();
            }
        }, false);
        if (!formatter) {
            return;
        }
        input.addEventListener('input', function () {
            var newValue = input.value;
            var newValueFormatted = formatter(newValue.replace(/\D/g, ''));
            if (newValueFormatted != newValue) {
                var pos = input.selectionStart;
                input.value = newValueFormatted;
                if (pos == newValue.length) return;
                // Restore cursor position
                // To determine the correct offset we count the number of digits
                // up to the cursor position, then we loop through the new
                // formatted string until we reach the same number of digits.
                pos = newValue.slice(0, pos).replace(/\D/g, '').length;
                var newPos = 0, len = newValueFormatted.length;
                for (var nDigits = 0; newPos < len && nDigits < pos; newPos++) {
                    if (/\d/.test(newValueFormatted.charAt(newPos))) nDigits++;
                }
                input.selectionStart = newPos; input.selectionEnd = newPos;
            }
        }, false);
    }

    function addSeparators(string, positions, separator) {
        var parts = [];
        var j = 0;
        var slen = string.length;
        for (var i=0; i<positions.length && slen >= positions[i]; i++) {
            // This loop adds all the complete parts in the array
            parts.push(string.slice(j, positions[i]));
            j = positions[i];
        }
        // This adds whatever's left, unless it's an empty string
        var leftover = string.slice(j);
        if (leftover.length > 0) parts.push(leftover);
        return parts.join(separator);
    }

    function formatInputs(panInput, expiryInput, cvnInput) {
        restrictNumeric(panInput, 19, function (inputValue) {
            var spacing = getSpacing(inputValue) || defaultSpacing;
            return addSeparators(inputValue, spacing, ' ');
        });
        restrictNumeric(expiryInput, 6, function (inputValue) {
            return addSeparators(inputValue, [2], '/');
        });
        restrictNumeric(cvnInput, 4);
    }

    function luhnCheck(num) {
        num = num.replace(/\D/g, "");
        var digit;
        var sum = 0;
        var even = false;
        for (var n = num.length - 1; n >= 0; n--) {
            digit = parseInt(num.charAt(n), 10);
            if (even) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            even = !even;
        }
        return sum % 10 === 0;
    }

    function e(value, status, message, subfield) {
        return {value: value, status: status, message: message, subfield: subfield}
    }

    function checkExpiry(expiry) {
        if (expiry.length == 0) {
            return e(expiry, 'empty');
        }
        split = expiry.split(/\D/g);
        if (split.length != 2 || split[0].length != 2) {
            return e(expiry, 'invalid', 'bad format');
        }
        month = parseInt(split[0], 10);
        year = parseInt(split[1], 10);
        if (month % 1 !== 0) {
            return e(expiry, 'invalid', 'not an integer', 'month');
        }
        if (year % 1 !== 0) {
            return e(expiry, 'invalid', 'not an integer', 'year');
        }
        if (month < 1 || month > 12) {
            return e(expiry, 'invalid', 'out of range', 'month');
        }
        var currentDate = new Date();
        var currentYear = currentDate.getFullYear();
        if (year < 100) year = year + Math.floor(currentYear / 100) * 100;
        if (year < currentYear) {
            return e(expiry, 'invalid', 'in the past', 'year');
        }
        if (year == currentYear) {
            var currentMonth = currentDate.getMonth() + 1;
            if (month < currentMonth) {
                return e(expiry, 'invalid', 'in the past', 'month');
            }
        }
        return e(expiry.replace(/\D/g, ''), 'valid');
    }

    function checkCard(pan, expiry, cvn) {
        var range = getRange(pan);
        var r = {expiry: checkExpiry(expiry), range: range};
        if (pan.length == 0) r.pan = e(pan, 'empty');
        else if (pan.length < 8) r.pan = e(pan, 'invalid', 'too short');
        else if (pan.length > 19) r.pan = e(pan, 'invalid', 'too long');
        else if (!luhnCheck(pan)) r.pan = e(pan, 'abnormal', 'luhn check failure');
        if (cvn.length == 0) r.cvn = e(cvn, 'empty');
        else if (cvn.length < 3) r.cvn = e(cvn, 'abnormal', 'too short');
        if (!range) {
            r.pan = r.pan || e(pan, null);
            r.cvn = r.cvn || e(cvn, null);
            return r;
        }
        if (!r.pan && range.panLengths.indexOf(pan.length) == -1) {
            r.pan = e(pan, 'abnormal', 'bad length');
        }
        if (!r.cvn && range.cvnLengths.indexOf(cvn.length) == -1) {
            r.cvn = e(cvn, 'abnormal', 'bad length');
        }
        r.pan = r.pan || e(pan, 'valid');
        r.cvn = r.cvn || e(cvn, 'valid');
        return r;
    }

    function Form(panInput, expiryInput, cvnInput) {
        formatInputs(panInput, expiryInput, cvnInput);
        this.inputs = {pan: panInput, expiry: expiryInput, cvn: cvnInput};
        return this;
    }

    Form.prototype.check = function () {
        var r = checkCard(
            this.inputs.pan.value.replace(/\D/g, ''),
            this.inputs.expiry.value,
            this.inputs.cvn.value.replace(/\D/g, '')
        );
        r.brand = r.range ? r.range.brand : null;
        return r;
    }

    return {
        addSeparators: addSeparators,
        checkCard: checkCard,
        checkExpiry: checkExpiry,
        formatInputs: formatInputs,
        getSpacing: getSpacing,
        getRange: getRange,
        luhnCheck: luhnCheck,
        rangesArray: rangesArray,
        restrictNumeric: restrictNumeric,
        Form: Form,
    };
}();

/**********************************************************************/
/*                            payments.js                             */
/**********************************************************************/

/* Bank Account and Credit Card forms
 *
 * These two forms share some common wiring under the Liberapay.payments
 * namespace, and each has unique code under the Liberapay.payments.{cc,ba}
 * namespaces. Each form gets its own page so we only instantiate one of these
 * at a time.
 *
 */

Liberapay.payments = {};


// Common code
// ===========

Liberapay.payments.init = function() {
    var $form = $('form#payin, form#payout');
    if ($form.length === 0) return;
    $('fieldset.hidden').prop('disabled', true);
    $('button[data-modify]').click(function() {
        var $btn = $(this);
        $($btn.data('modify')).removeClass('hidden').prop('disabled', false);
        $btn.parent().addClass('hidden');
    });
    Liberapay.payments.user_slug = $form.data('user-slug');
    $form.submit(Liberapay.payments.submit);
    $('select.country').on('change', function () {
        var newValue = $(this).val();
        $(this).data('value-was-copied', null);
        if (this.name != 'CountryOfResidence') return;
        $('select.country').val(function (i, value) {
            if (value == '' || $(this).data('value-was-copied')) {
                $(this).data('value-was-copied', true);
                return newValue;
            }
            return value;
        })
    });
    Liberapay.payments.ba.init();
    Liberapay.payments.cc.init();
}

Liberapay.payments.wrap = function(f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch (e) {
            Liberapay.payments.cc.onError({ResultCode: "1999999", ResultMessage: e})
        }
    }
};

Liberapay.payments.submit = Liberapay.payments.wrap(function(e) {
    e.preventDefault();
    var step2;
    if ($('#bank-account:not(.hidden)').length) step2 = Liberapay.payments.ba.submit;
    if ($('#credit-card:not(.hidden)').length) step2 = Liberapay.payments.cc.submit;

    $('#loading-indicator').remove();
    if (step2 || $('#identity').length) {
        var $bg = $('<div id="loading-indicator">').css({
            'background-color': 'rgba(0, 0, 0, 0.5)',
            'bottom': 0,
            'left': 0,
            'position': 'fixed',
            'right': 0,
            'top': 0,
            'z-index': 1040,
        }).appendTo($('body'));
        var $loading = $('<div class="alert alert-info">');
        $loading.text($(this).data('msg-loading'));
        $loading.appendTo($bg).center('fixed');
    }

    step2 = step2 || Liberapay.payments.onSuccess;
    if ($('#identity').length) {
        Liberapay.payments.id.submit(step2);
    } else {
        step2();
    }
});

Liberapay.payments.error = function(jqXHR, textStatus, errorThrown) {
    $('#loading-indicator').remove();
    if (jqXHR) Liberapay.error(jqXHR, textStatus, errorThrown);
};

Liberapay.payments.onSuccess = function(data) {
    if (data && data.route_id) {
        $('#amount input[name="route_id"]').val(data.route_id);
    }
    $('#amount').parents('form').off('submit');  // prevents infinite loop
    var $form = $('#amount').wrap('<form action="" method="POST">').parent();
    var addr = $('#billing-address').attr('disabled', false).serializeArray();
    $.each(addr, function () {
        $('<input type="hidden">').attr('name', this.name).val(this.value).appendTo($form);
    });
    $form.submit();
};


// Identity
// ========

Liberapay.payments.id = {};

Liberapay.payments.id.submit = function(success) {
    var data = $('#identity').serializeArray();
    jQuery.ajax({
        url: '/'+Liberapay.payments.user_slug+'/identity',
        type: 'POST',
        data: data,
        dataType: 'json',
        success: success,
        error: Liberapay.payments.error,
    });
}


// Bank Accounts
// =============

Liberapay.payments.ba = {};

Liberapay.payments.ba.init = function() {
    if ($('#bank-account').length === 0) return;
    $('fieldset.tab-pane:not(.active)').prop('disabled', true);
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $($(e.target).attr('href')).prop('disabled', false);
        $($(e.relatedTarget).attr('href')).prop('disabled', true);
    });
    $('input[inputmode="numeric"]').each(function() {
        var $input = $(this);
        var maxdigits = $input.attr('maxdigits') || $input.attr('digits');
        PaymentCards.restrictNumeric(this, +maxdigits);
    });
};

Liberapay.payments.ba.submit = function () {
    var $ba = $('#bank-account');
    Liberapay.forms.clearInvalid($ba);

    var $iban = $('input[name="IBAN"]');
    var is_iban_invalid = $('#iban').prop('disabled') === false && IBAN.isValid($iban.val()) === false;
    Liberapay.forms.setInvalid($iban, is_iban_invalid);

    var $bban = $('#bban input[name="AccountNumber"]');
    var country = $('#bban select[name="Country"]').val();
    var is_bban_invalid = $('#bban').prop('disabled') === false && IBAN.isValidBBAN(country, $bban.val()) === false;
    Liberapay.forms.setInvalid($bban, is_bban_invalid);

    var invalids = 0;
    $('input[inputmode="numeric"]').each(function() {
        var $input = $(this);
        if ($input.parents(':disabled').length) return;
        var digits = $input.attr('digits');
        var maxdigits = $input.attr('maxdigits') || digits;
        var mindigits = $input.attr('mindigits') || digits;
        var length = $input.val().replace(/[^\d]/g, "").length;
        if (!(/^[\d\s]+$/.test($input.val())) ||
            maxdigits && length > maxdigits ||
            mindigits && length < mindigits) {
            invalids++;
            Liberapay.forms.setInvalid($input, true);
        } else {
            Liberapay.forms.setInvalid($input, false);
        }
    });

    if (is_bban_invalid || is_iban_invalid || invalids) {
        Liberapay.forms.focusInvalid($ba);
        return Liberapay.payments.error();
    }

    var data = $ba.serializeArray();
    // remove values of controls that are inside a disabled fieldset
    var data2 = [];
    $.each(data, function(i, item) {
        var $element = $ba.find('[name="'+item.name+'"]').filter(function() {
            return $(this).prop('value') == item.value;
        });
        if ($element.length != 1) console.error("$element.length = " + $element.length);
        var $disabled = $element.parents('fieldset:disabled');
        if ($disabled.length == 0) data2.push(item);
    })
    data = data2;
    jQuery.ajax({
        url: '/'+Liberapay.payments.user_slug+'/routes/bank-account.json',
        type: 'POST',
        data: data,
        dataType: 'json',
        success: Liberapay.payments.onSuccess,
        error: Liberapay.payments.error,
    });
};


// Credit Cards
// ============

Liberapay.payments.cc = {};

Liberapay.payments.cc.check = function() {
    Liberapay.forms.clearInvalid($('#credit-card'));

    var card = Liberapay.payments.cc.form.check();
    if (card.pan.status == null) card.pan.status = 'abnormal';
    if (card.cvn.status == null) card.cvn.status = 'valid';

    Liberapay.forms.setValidity($('#card_number'), card.pan.status);
    Liberapay.forms.setValidity($('#expiration_date'), card.expiry.status);
    Liberapay.forms.setValidity($('#cvv'), card.cvn.status);

    return card;
}

Liberapay.payments.cc.init = function() {
    var $fieldset = $('#credit-card');
    if ($fieldset.length === 0) return;
    mangoPay.cardRegistration.baseURL = $fieldset.data('mangopay-url');
    mangoPay.cardRegistration.clientId = $fieldset.data('mangopay-id');

    var form = new PaymentCards.Form(
        document.querySelector('#card_number'),
        document.querySelector('#expiration_date'),
        document.querySelector('#cvv')
    );
    Liberapay.payments.cc.form = form;

    function onBlur() {
        var card = Liberapay.payments.cc.check();
        $('.card-brand').text(card.brand);
    }
    form.inputs.pan.addEventListener('blur', onBlur);
    form.inputs.expiry.addEventListener('blur', onBlur);
    form.inputs.cvn.addEventListener('blur', onBlur);

    form.inputs.pan.addEventListener('input', function () {
        $('.card-brand').text('');
    });
};

Liberapay.payments.cc.onError = function(response) {
    Liberapay.payments.error();
    var debugInfo = '';
    if (response.ResultMessage == 'CORS_FAIL') {
        var msg = $('#credit-card').data('msg-cors-fail');
    } else {
        var msg = response.ResultMessage;
        var xhr = response.xmlhttp;
        if (xhr && xhr.status === 0) {
            var msg = $('#credit-card').data('msg-cors-fail');
        } else if (xhr) {
            var text = xhr.responseText;
            text = text && text.length > 200 ? text.slice(0, 200) + '...' : text;
            debugInfo = {status: xhr.status, responseText: text};
            debugInfo = ' (Debug info: '+JSON.stringify(debugInfo)+')';
        }
    }
    Liberapay.notification(msg + ' (Error code: '+response.ResultCode+')' + debugInfo, 'error', -1);
};

Liberapay.payments.cc.submit = function() {

    var card = Liberapay.payments.cc.check();
    if (card.pan.status != 'valid' || card.expiry.status != 'valid' || card.cvn.status != 'valid') {
        if (!confirm($('#credit-card').data('msg-confirm-submit'))) {
            Liberapay.payments.error();
            Liberapay.forms.focusInvalid($('#credit-card'));
            return false;
        }
    }

    var cardData = {
        cardNumber: card.pan.value,
        cardCvx: card.cvn.value,
        cardExpirationDate: card.expiry.value,
    };

    jQuery.ajax({
        url: '/'+Liberapay.payments.user_slug+'/routes/credit-card.json',
        type: "POST",
        data: {CardType: 'CB_VISA_MASTERCARD', Currency: $('#credit-card').data('currency')},
        dataType: "json",
        success: Liberapay.payments.cc.register(cardData),
        error: Liberapay.payments.error,
    });
    return false;
};

Liberapay.payments.cc.register = function (cardData) {
    return Liberapay.payments.wrap(function (cardRegistrationData) {
        cardRegistrationData.Id = cardRegistrationData.id;
        delete cardRegistrationData.id;
        mangoPay.cardRegistration.init(cardRegistrationData);
        mangoPay.cardRegistration.registerCard(cardData, Liberapay.payments.cc.associate, Liberapay.payments.cc.onError);
    })
};

Liberapay.payments.cc.associate = function (response) {
    /* The request to tokenize the card succeeded. Now we need to associate it
     * to the participant in our DB.
     */
    jQuery.ajax({
        url: '/'+Liberapay.payments.user_slug+'/routes/credit-card.json',
        type: "POST",
        data: {CardId: response.CardId, keep: $('input#keep').prop('checked')},
        dataType: "json",
        success: Liberapay.payments.onSuccess,
        error: Liberapay.payments.error,
    });
};

/**********************************************************************/
/*                               s3.js                                */
/**********************************************************************/

// https://blog.fineuploader.com/2013/08/16/fine-uploader-s3-upload-directly-to-amazon-s3-from-your-browser/

Liberapay.s3_uploader_init = function () {

    var $form = $('#invoice-form');
    if ($form.length === 0) return;

    var base_path = $form.data('base-path');
    var uploader = new qq.s3.FineUploader({
        element: document.getElementById('fine-uploader'),
        template: document.getElementById('qq-template'),
        autoUpload: false,
        request: {
            endpoint: $form.data('s3-endpoint'),
            accessKey: $form.data('s3-access-key'),
        },
        objectProperties: {
            region: $form.data('s3-region'),
            key: function (fileId) {
                var filename = uploader.getName(fileId);
                return 'invoice_docs/' + uploader._invoice_id + '/' + filename
            },
        },
        signature: {
            endpoint: base_path + 'add-file?step=sign',
            version: 4,
            customHeaders: custom_headers,
        },
        uploadSuccess: {
            endpoint: base_path + 'add-file?step=success',
            customHeaders: custom_headers,
        },
        validation: {
            allowedExtensions: $form.data('allowed-extensions').split(', '),
            itemLimit: $form.data('item-limit'),
            sizeLimit: $form.data('max-size'),
        },
        display: {
            fileSizeOnSubmit: true,
        },
        text: {
            fileInputTitle: '',
        },
        callbacks: {
            onAllComplete: function (successes, failures) {
                if (successes.length > 0 && failures.length == 0 && uploader._invoice_id) {
                    window.location.href = base_path + uploader._invoice_id;
                }
            },
            onSubmitted: function () {
                $('#invoice-form button').filter(':not([type]), [type="submit"]').prop('disabled', false);
            },
        },
    });

    var already_uploaded = $form.data('already-uploaded');
    if (already_uploaded.length > 0) {
        uploader.addInitialFiles(already_uploaded);
    }

    function custom_headers() { return {
        'X-CSRF-TOKEN': Liberapay.getCookie('csrf_token'),
        'X-Invoice-Id': uploader._invoice_id,
    }}

    function submit(e) {
        e.preventDefault();
        var form = $form.get(0);
        if (form.reportValidity && form.reportValidity() == false) return;
        var $inputs = $form.find(':not(:disabled)').filter(function () {
            return $(this).parents('#fine-uploader').length == 0
        });
        var data = $form.serializeArray();
        $inputs.prop('disabled', true);
        jQuery.ajax({
            url: '',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function(data) {
                uploader._invoice_id = data.invoice_id;
                history.pushState(null, null, location.pathname + '?id=' + data.invoice_id);
                return upload_docs()
            },
            error: [
                function () { $inputs.prop('disabled', false); },
                Liberapay.error,
            ],
        });
    }
    $('#invoice-form').submit(submit);
    $('#invoice-form button').filter(':not([type]), [type="submit"]').click(submit);

    function upload_docs() {
        if (uploader._storedIds.length !== 0) {
            uploader.uploadStoredFiles();
        } else {
            window.location.href = base_path + uploader._invoice_id;
        }
    }

};

/**********************************************************************/
/*                             stripe.js                              */
/**********************************************************************/

Liberapay.stripe_init = function() {
    var $form = $('form#stripe');
    if ($form.length === 1) Liberapay.stripe_form_init($form);
    var $next_action = $('#stripe_next_action');
    if ($next_action.length === 1) Liberapay.stripe_next_action($next_action);
};

Liberapay.stripe_form_init = function($form) {
    $('fieldset.hidden').prop('disabled', true);
    $('button[data-modify]').click(function() {
        var $btn = $(this);
        $($btn.data('modify')).removeClass('hidden').prop('disabled', false);
        $btn.parent().addClass('hidden');
    });

    var $container = $('#stripe-element');
    var stripe = Stripe($form.data('stripe-pk'));
    var elements = stripe.elements();
    var element_type = $container.data('type');
    var options = {style: {
        base: {
            color: rgb_to_hex($container.css('color')),
            fontFamily: $container.css('font-family'),
            fontSize: $container.css('font-size'),
            lineHeight: $container.css('line-height'),
        }
    }};
    if (element_type == 'iban') {
        options.supportedCountries = ['SEPA'];
    }
    var element = elements.create(element_type, options);
    element.mount('#stripe-element');
    var $errorElement = $('#stripe-errors');
    element.addEventListener('change', function(event) {
        if (event.error) {
            $errorElement.text(event.error.message);
        } else {
            $errorElement.text('');
        }
    });

    var submitting = false;
    $form.submit(Liberapay.wrap(function(e) {
        if ($form.data('js-submit-disable')) {
            e.preventDefault();
            return false;
        }
        if (submitting) {
            submitting = false;
            // Prevent submitting again
            $form.data('js-submit-disable', true);
            var $inputs = $form.find(':not(:disabled)');
            setTimeout(function () { $inputs.prop('disabled', true); }, 100);
            // Unlock if the user comes back to the page
            $(window).on('focus pageshow', function () {
                $form.data('js-submit-disable', false);
                $inputs.prop('disabled', false);
            });
            return;
        }
        e.preventDefault();
        if ($container.parents('.hidden').length > 0) {
            submitting = true;
            $form.submit();
            return;
        }
        if (element_type == 'iban') {
            var tokenData = {};
            tokenData.currency = 'EUR';
            tokenData.account_holder_name = $form.find('input[name="owner.name"]').val();
            stripe.createToken(element, tokenData).then(Liberapay.wrap(function(result) {
                if (result.error) {
                    $errorElement.text(result.error.message);
                } else {
                    submitting = true;
                    $form.find('input[name="route"]').remove();
                    $form.find('input[name="token"]').remove();
                    var $hidden_input = $('<input type="hidden" name="token">');
                    $hidden_input.val(result.token.id);
                    $form.append($hidden_input);
                    $form.submit();
                }
            }));
        } else if (element_type == 'card') {
            var pmData = {
                billing_details: {
                    address: {
                        city: $form.find('input[name="owner.address.city"]').val(),
                        country: $form.find('input[name="owner.address.country"]').val(),
                        line1: $form.find('input[name="owner.address.line1"]').val(),
                        line2: $form.find('input[name="owner.address.line2"]').val(),
                        postal_code: $form.find('input[name="owner.address.postal_code"]').val(),
                        state: $form.find('input[name="owner.address.state"]').val(),
                    },
                    email: $form.find('input[name="owner.email"]').val(),
                    name: $form.find('input[name="owner.name"]').val(),
                }
            };
            stripe.createPaymentMethod('card', element, pmData).then(Liberapay.wrap(function(result) {
                if (result.error) {
                    $errorElement.text(result.error.message);
                } else {
                    submitting = true;
                    $form.find('input[name="route"]').remove();
                    $form.find('input[name="stripe_pm_id"]').remove();
                    var $hidden_input = $('<input type="hidden" name="stripe_pm_id">');
                    $hidden_input.val(result.paymentMethod.id);
                    $form.append($hidden_input);
                    $form.submit();
                }
            }));
        }
    }));
    $form.attr('action', '');
};

Liberapay.stripe_next_action = function ($next_action) {
    stripe.handleCardAction($next_action.data('client_secret')).then(function (result) {
        if (result.error) {
            $next_action.addClass('alert alert-danger').text(result.error.message);
        } else {
            window.location.reload();
        }
    })
};

/**********************************************************************/
/*                            tail_log.js                             */
/**********************************************************************/


Liberapay.stream_lines = function(url, data_cb, error_cb) {
    var delay = 2000;
    function fetch_lines(first_pos) {
        jQuery.ajax({
            url: url,
            headers: {Range: 'x-lines='+first_pos+'-'},
        }).done(function(data, textStatus, xhr) {
            var file_is_partial = false;
            var final = true;
            var next_pos = first_pos;
            if (xhr.status == 206) {
                var cr = xhr.getResponseHeader('Content-Range') || '';
                if (cr.slice(0, 8) != 'x-lines ') {
                    return error_cb("The server sent a range of unknown format.", xhr);
                }
                var r = /x-lines (\d+)-(-?\d+)\/(\d+|\*)/.exec(cr);
                if (!r) {
                    return error_cb("The server sent an invalid range.", xhr);
                }
                var r1 = parseInt(r[1]), r2 = parseInt(r[2]), r3 = parseInt(r[3]);
                if (data.length > 0 && r2 < r1) {
                    return error_cb("The server sent an invalid range.", xhr);
                }
                if (r1 != first_pos) {
                    return error_cb("The server didn't send the requested range.", xhr);
                }
                if (r[3] == '*') {
                    file_is_partial = true;
                }
                if (file_is_partial || r2 < r3 - 1) {
                    final = false;
                    next_pos = r2 + 1;
                }
            }
            if (data.length == 0) {
                if (delay < 32000) {
                    delay = delay * 2;
                }
            } else if (delay > 2000) {
                delay = 2000;
            }
            if (!final) {
                setTimeout(function(){ fetch_lines(next_pos); }, delay);
            }
            return data_cb(data, final, file_is_partial, status, xhr);
        }).fail(function(xhr, textStatus, errorThrown) {
            error_cb(xhr.responseText + " (" + (errorThrown || textStatus) + ")", xhr);
        });
    }
    fetch_lines(0);
};

Liberapay.tail_log = function($pre) {
    var file_was_partial = false;
    Liberapay.stream_lines($pre.data('log-url'), function(data, final, file_is_partial){
        $pre.append(document.createTextNode(data));
        if (final && file_was_partial) {
            Liberapay.notification($pre.data('msg-success'), 'success', -1);
        }
        if (file_is_partial || file_was_partial) {
            $('html').scrollTop($pre.offset().top + $pre.outerHeight(true) - $('html').outerHeight() + 50);
        }
        file_was_partial = file_is_partial;
    }, function(msg, xhr){
        Liberapay.notification(msg, 'error', -1);
        if (xhr.status == 500) {
            $($pre.data('rerun')).removeClass('hidden');
        }
    });
};

Liberapay.auto_tail_log = function () {
    $('[data-log-url]').each(function () { Liberapay.tail_log($(this)); });
}
