/*
Copyright 2012 Igor Vaynberg

Version: 3.5.4 Timestamp: Sun Aug 30 13:30:32 EDT 2015

This software is licensed under the Apache License, Version 2.0 (the "Apache License") or the GNU
General Public License version 2 (the "GPL License"). You may choose either license to govern your
use of this software only upon the condition that you accept all of the terms of either the Apache
License or the GPL License.

You may obtain a copy of the Apache License and the GPL License at:

    http://www.apache.org/licenses/LICENSE-2.0
    http://www.gnu.org/licenses/gpl-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the
Apache License or the GPL License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the Apache License and the GPL License for
the specific language governing permissions and limitations under the Apache License and the GPL License.
*/

(function ($) {
    if(typeof $.fn.each2 == "undefined") {
        $.extend($.fn, {
            /*
            * 4-10 times faster .each replacement
            * use it carefully, as it overrides jQuery context of element on each iteration
            */
            each2 : function (c) {
                var j = $([0]), i = -1, l = this.length;
                while (
                    ++i < l
                    && (j.context = j[0] = this[i])
                    && c.call(j[0], i, j) !== false //"this"=DOM, i=index, j=jQuery object
                );
                return this;
            }
        });
    }
})(jQuery);

(function ($, undefined) {
    "use strict";
    /*global document, window, jQuery, console */

    if (window.Select2 !== undefined) {
        return;
    }

    var AbstractSelect2, SingleSelect2, MultiSelect2, nextUid, sizer,
        lastMousePosition={x:0,y:0}, $document, scrollBarDimensions,

    KEY = {
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        BACKSPACE: 8,
        DELETE: 46,
        isArrow: function (k) {
            k = k.which ? k.which : k;
            switch (k) {
            case KEY.LEFT:
            case KEY.RIGHT:
            case KEY.UP:
            case KEY.DOWN:
                return true;
            }
            return false;
        },
        isControl: function (e) {
            var k = e.which;
            switch (k) {
            case KEY.SHIFT:
            case KEY.CTRL:
            case KEY.ALT:
                return true;
            }

            if (e.metaKey) return true;

            return false;
        },
        isFunctionKey: function (k) {
            k = k.which ? k.which : k;
            return k >= 112 && k <= 123;
        }
    },
    MEASURE_SCROLLBAR_TEMPLATE = "<div class='select2-measure-scrollbar'></div>",

    DIACRITICS = {"\u24B6":"A","\uFF21":"A","\u00C0":"A","\u00C1":"A","\u00C2":"A","\u1EA6":"A","\u1EA4":"A","\u1EAA":"A","\u1EA8":"A","\u00C3":"A","\u0100":"A","\u0102":"A","\u1EB0":"A","\u1EAE":"A","\u1EB4":"A","\u1EB2":"A","\u0226":"A","\u01E0":"A","\u00C4":"A","\u01DE":"A","\u1EA2":"A","\u00C5":"A","\u01FA":"A","\u01CD":"A","\u0200":"A","\u0202":"A","\u1EA0":"A","\u1EAC":"A","\u1EB6":"A","\u1E00":"A","\u0104":"A","\u023A":"A","\u2C6F":"A","\uA732":"AA","\u00C6":"AE","\u01FC":"AE","\u01E2":"AE","\uA734":"AO","\uA736":"AU","\uA738":"AV","\uA73A":"AV","\uA73C":"AY","\u24B7":"B","\uFF22":"B","\u1E02":"B","\u1E04":"B","\u1E06":"B","\u0243":"B","\u0182":"B","\u0181":"B","\u24B8":"C","\uFF23":"C","\u0106":"C","\u0108":"C","\u010A":"C","\u010C":"C","\u00C7":"C","\u1E08":"C","\u0187":"C","\u023B":"C","\uA73E":"C","\u24B9":"D","\uFF24":"D","\u1E0A":"D","\u010E":"D","\u1E0C":"D","\u1E10":"D","\u1E12":"D","\u1E0E":"D","\u0110":"D","\u018B":"D","\u018A":"D","\u0189":"D","\uA779":"D","\u01F1":"DZ","\u01C4":"DZ","\u01F2":"Dz","\u01C5":"Dz","\u24BA":"E","\uFF25":"E","\u00C8":"E","\u00C9":"E","\u00CA":"E","\u1EC0":"E","\u1EBE":"E","\u1EC4":"E","\u1EC2":"E","\u1EBC":"E","\u0112":"E","\u1E14":"E","\u1E16":"E","\u0114":"E","\u0116":"E","\u00CB":"E","\u1EBA":"E","\u011A":"E","\u0204":"E","\u0206":"E","\u1EB8":"E","\u1EC6":"E","\u0228":"E","\u1E1C":"E","\u0118":"E","\u1E18":"E","\u1E1A":"E","\u0190":"E","\u018E":"E","\u24BB":"F","\uFF26":"F","\u1E1E":"F","\u0191":"F","\uA77B":"F","\u24BC":"G","\uFF27":"G","\u01F4":"G","\u011C":"G","\u1E20":"G","\u011E":"G","\u0120":"G","\u01E6":"G","\u0122":"G","\u01E4":"G","\u0193":"G","\uA7A0":"G","\uA77D":"G","\uA77E":"G","\u24BD":"H","\uFF28":"H","\u0124":"H","\u1E22":"H","\u1E26":"H","\u021E":"H","\u1E24":"H","\u1E28":"H","\u1E2A":"H","\u0126":"H","\u2C67":"H","\u2C75":"H","\uA78D":"H","\u24BE":"I","\uFF29":"I","\u00CC":"I","\u00CD":"I","\u00CE":"I","\u0128":"I","\u012A":"I","\u012C":"I","\u0130":"I","\u00CF":"I","\u1E2E":"I","\u1EC8":"I","\u01CF":"I","\u0208":"I","\u020A":"I","\u1ECA":"I","\u012E":"I","\u1E2C":"I","\u0197":"I","\u24BF":"J","\uFF2A":"J","\u0134":"J","\u0248":"J","\u24C0":"K","\uFF2B":"K","\u1E30":"K","\u01E8":"K","\u1E32":"K","\u0136":"K","\u1E34":"K","\u0198":"K","\u2C69":"K","\uA740":"K","\uA742":"K","\uA744":"K","\uA7A2":"K","\u24C1":"L","\uFF2C":"L","\u013F":"L","\u0139":"L","\u013D":"L","\u1E36":"L","\u1E38":"L","\u013B":"L","\u1E3C":"L","\u1E3A":"L","\u0141":"L","\u023D":"L","\u2C62":"L","\u2C60":"L","\uA748":"L","\uA746":"L","\uA780":"L","\u01C7":"LJ","\u01C8":"Lj","\u24C2":"M","\uFF2D":"M","\u1E3E":"M","\u1E40":"M","\u1E42":"M","\u2C6E":"M","\u019C":"M","\u24C3":"N","\uFF2E":"N","\u01F8":"N","\u0143":"N","\u00D1":"N","\u1E44":"N","\u0147":"N","\u1E46":"N","\u0145":"N","\u1E4A":"N","\u1E48":"N","\u0220":"N","\u019D":"N","\uA790":"N","\uA7A4":"N","\u01CA":"NJ","\u01CB":"Nj","\u24C4":"O","\uFF2F":"O","\u00D2":"O","\u00D3":"O","\u00D4":"O","\u1ED2":"O","\u1ED0":"O","\u1ED6":"O","\u1ED4":"O","\u00D5":"O","\u1E4C":"O","\u022C":"O","\u1E4E":"O","\u014C":"O","\u1E50":"O","\u1E52":"O","\u014E":"O","\u022E":"O","\u0230":"O","\u00D6":"O","\u022A":"O","\u1ECE":"O","\u0150":"O","\u01D1":"O","\u020C":"O","\u020E":"O","\u01A0":"O","\u1EDC":"O","\u1EDA":"O","\u1EE0":"O","\u1EDE":"O","\u1EE2":"O","\u1ECC":"O","\u1ED8":"O","\u01EA":"O","\u01EC":"O","\u00D8":"O","\u01FE":"O","\u0186":"O","\u019F":"O","\uA74A":"O","\uA74C":"O","\u01A2":"OI","\uA74E":"OO","\u0222":"OU","\u24C5":"P","\uFF30":"P","\u1E54":"P","\u1E56":"P","\u01A4":"P","\u2C63":"P","\uA750":"P","\uA752":"P","\uA754":"P","\u24C6":"Q","\uFF31":"Q","\uA756":"Q","\uA758":"Q","\u024A":"Q","\u24C7":"R","\uFF32":"R","\u0154":"R","\u1E58":"R","\u0158":"R","\u0210":"R","\u0212":"R","\u1E5A":"R","\u1E5C":"R","\u0156":"R","\u1E5E":"R","\u024C":"R","\u2C64":"R","\uA75A":"R","\uA7A6":"R","\uA782":"R","\u24C8":"S","\uFF33":"S","\u1E9E":"S","\u015A":"S","\u1E64":"S","\u015C":"S","\u1E60":"S","\u0160":"S","\u1E66":"S","\u1E62":"S","\u1E68":"S","\u0218":"S","\u015E":"S","\u2C7E":"S","\uA7A8":"S","\uA784":"S","\u24C9":"T","\uFF34":"T","\u1E6A":"T","\u0164":"T","\u1E6C":"T","\u021A":"T","\u0162":"T","\u1E70":"T","\u1E6E":"T","\u0166":"T","\u01AC":"T","\u01AE":"T","\u023E":"T","\uA786":"T","\uA728":"TZ","\u24CA":"U","\uFF35":"U","\u00D9":"U","\u00DA":"U","\u00DB":"U","\u0168":"U","\u1E78":"U","\u016A":"U","\u1E7A":"U","\u016C":"U","\u00DC":"U","\u01DB":"U","\u01D7":"U","\u01D5":"U","\u01D9":"U","\u1EE6":"U","\u016E":"U","\u0170":"U","\u01D3":"U","\u0214":"U","\u0216":"U","\u01AF":"U","\u1EEA":"U","\u1EE8":"U","\u1EEE":"U","\u1EEC":"U","\u1EF0":"U","\u1EE4":"U","\u1E72":"U","\u0172":"U","\u1E76":"U","\u1E74":"U","\u0244":"U","\u24CB":"V","\uFF36":"V","\u1E7C":"V","\u1E7E":"V","\u01B2":"V","\uA75E":"V","\u0245":"V","\uA760":"VY","\u24CC":"W","\uFF37":"W","\u1E80":"W","\u1E82":"W","\u0174":"W","\u1E86":"W","\u1E84":"W","\u1E88":"W","\u2C72":"W","\u24CD":"X","\uFF38":"X","\u1E8A":"X","\u1E8C":"X","\u24CE":"Y","\uFF39":"Y","\u1EF2":"Y","\u00DD":"Y","\u0176":"Y","\u1EF8":"Y","\u0232":"Y","\u1E8E":"Y","\u0178":"Y","\u1EF6":"Y","\u1EF4":"Y","\u01B3":"Y","\u024E":"Y","\u1EFE":"Y","\u24CF":"Z","\uFF3A":"Z","\u0179":"Z","\u1E90":"Z","\u017B":"Z","\u017D":"Z","\u1E92":"Z","\u1E94":"Z","\u01B5":"Z","\u0224":"Z","\u2C7F":"Z","\u2C6B":"Z","\uA762":"Z","\u24D0":"a","\uFF41":"a","\u1E9A":"a","\u00E0":"a","\u00E1":"a","\u00E2":"a","\u1EA7":"a","\u1EA5":"a","\u1EAB":"a","\u1EA9":"a","\u00E3":"a","\u0101":"a","\u0103":"a","\u1EB1":"a","\u1EAF":"a","\u1EB5":"a","\u1EB3":"a","\u0227":"a","\u01E1":"a","\u00E4":"a","\u01DF":"a","\u1EA3":"a","\u00E5":"a","\u01FB":"a","\u01CE":"a","\u0201":"a","\u0203":"a","\u1EA1":"a","\u1EAD":"a","\u1EB7":"a","\u1E01":"a","\u0105":"a","\u2C65":"a","\u0250":"a","\uA733":"aa","\u00E6":"ae","\u01FD":"ae","\u01E3":"ae","\uA735":"ao","\uA737":"au","\uA739":"av","\uA73B":"av","\uA73D":"ay","\u24D1":"b","\uFF42":"b","\u1E03":"b","\u1E05":"b","\u1E07":"b","\u0180":"b","\u0183":"b","\u0253":"b","\u24D2":"c","\uFF43":"c","\u0107":"c","\u0109":"c","\u010B":"c","\u010D":"c","\u00E7":"c","\u1E09":"c","\u0188":"c","\u023C":"c","\uA73F":"c","\u2184":"c","\u24D3":"d","\uFF44":"d","\u1E0B":"d","\u010F":"d","\u1E0D":"d","\u1E11":"d","\u1E13":"d","\u1E0F":"d","\u0111":"d","\u018C":"d","\u0256":"d","\u0257":"d","\uA77A":"d","\u01F3":"dz","\u01C6":"dz","\u24D4":"e","\uFF45":"e","\u00E8":"e","\u00E9":"e","\u00EA":"e","\u1EC1":"e","\u1EBF":"e","\u1EC5":"e","\u1EC3":"e","\u1EBD":"e","\u0113":"e","\u1E15":"e","\u1E17":"e","\u0115":"e","\u0117":"e","\u00EB":"e","\u1EBB":"e","\u011B":"e","\u0205":"e","\u0207":"e","\u1EB9":"e","\u1EC7":"e","\u0229":"e","\u1E1D":"e","\u0119":"e","\u1E19":"e","\u1E1B":"e","\u0247":"e","\u025B":"e","\u01DD":"e","\u24D5":"f","\uFF46":"f","\u1E1F":"f","\u0192":"f","\uA77C":"f","\u24D6":"g","\uFF47":"g","\u01F5":"g","\u011D":"g","\u1E21":"g","\u011F":"g","\u0121":"g","\u01E7":"g","\u0123":"g","\u01E5":"g","\u0260":"g","\uA7A1":"g","\u1D79":"g","\uA77F":"g","\u24D7":"h","\uFF48":"h","\u0125":"h","\u1E23":"h","\u1E27":"h","\u021F":"h","\u1E25":"h","\u1E29":"h","\u1E2B":"h","\u1E96":"h","\u0127":"h","\u2C68":"h","\u2C76":"h","\u0265":"h","\u0195":"hv","\u24D8":"i","\uFF49":"i","\u00EC":"i","\u00ED":"i","\u00EE":"i","\u0129":"i","\u012B":"i","\u012D":"i","\u00EF":"i","\u1E2F":"i","\u1EC9":"i","\u01D0":"i","\u0209":"i","\u020B":"i","\u1ECB":"i","\u012F":"i","\u1E2D":"i","\u0268":"i","\u0131":"i","\u24D9":"j","\uFF4A":"j","\u0135":"j","\u01F0":"j","\u0249":"j","\u24DA":"k","\uFF4B":"k","\u1E31":"k","\u01E9":"k","\u1E33":"k","\u0137":"k","\u1E35":"k","\u0199":"k","\u2C6A":"k","\uA741":"k","\uA743":"k","\uA745":"k","\uA7A3":"k","\u24DB":"l","\uFF4C":"l","\u0140":"l","\u013A":"l","\u013E":"l","\u1E37":"l","\u1E39":"l","\u013C":"l","\u1E3D":"l","\u1E3B":"l","\u017F":"l","\u0142":"l","\u019A":"l","\u026B":"l","\u2C61":"l","\uA749":"l","\uA781":"l","\uA747":"l","\u01C9":"lj","\u24DC":"m","\uFF4D":"m","\u1E3F":"m","\u1E41":"m","\u1E43":"m","\u0271":"m","\u026F":"m","\u24DD":"n","\uFF4E":"n","\u01F9":"n","\u0144":"n","\u00F1":"n","\u1E45":"n","\u0148":"n","\u1E47":"n","\u0146":"n","\u1E4B":"n","\u1E49":"n","\u019E":"n","\u0272":"n","\u0149":"n","\uA791":"n","\uA7A5":"n","\u01CC":"nj","\u24DE":"o","\uFF4F":"o","\u00F2":"o","\u00F3":"o","\u00F4":"o","\u1ED3":"o","\u1ED1":"o","\u1ED7":"o","\u1ED5":"o","\u00F5":"o","\u1E4D":"o","\u022D":"o","\u1E4F":"o","\u014D":"o","\u1E51":"o","\u1E53":"o","\u014F":"o","\u022F":"o","\u0231":"o","\u00F6":"o","\u022B":"o","\u1ECF":"o","\u0151":"o","\u01D2":"o","\u020D":"o","\u020F":"o","\u01A1":"o","\u1EDD":"o","\u1EDB":"o","\u1EE1":"o","\u1EDF":"o","\u1EE3":"o","\u1ECD":"o","\u1ED9":"o","\u01EB":"o","\u01ED":"o","\u00F8":"o","\u01FF":"o","\u0254":"o","\uA74B":"o","\uA74D":"o","\u0275":"o","\u01A3":"oi","\u0223":"ou","\uA74F":"oo","\u24DF":"p","\uFF50":"p","\u1E55":"p","\u1E57":"p","\u01A5":"p","\u1D7D":"p","\uA751":"p","\uA753":"p","\uA755":"p","\u24E0":"q","\uFF51":"q","\u024B":"q","\uA757":"q","\uA759":"q","\u24E1":"r","\uFF52":"r","\u0155":"r","\u1E59":"r","\u0159":"r","\u0211":"r","\u0213":"r","\u1E5B":"r","\u1E5D":"r","\u0157":"r","\u1E5F":"r","\u024D":"r","\u027D":"r","\uA75B":"r","\uA7A7":"r","\uA783":"r","\u24E2":"s","\uFF53":"s","\u00DF":"s","\u015B":"s","\u1E65":"s","\u015D":"s","\u1E61":"s","\u0161":"s","\u1E67":"s","\u1E63":"s","\u1E69":"s","\u0219":"s","\u015F":"s","\u023F":"s","\uA7A9":"s","\uA785":"s","\u1E9B":"s","\u24E3":"t","\uFF54":"t","\u1E6B":"t","\u1E97":"t","\u0165":"t","\u1E6D":"t","\u021B":"t","\u0163":"t","\u1E71":"t","\u1E6F":"t","\u0167":"t","\u01AD":"t","\u0288":"t","\u2C66":"t","\uA787":"t","\uA729":"tz","\u24E4":"u","\uFF55":"u","\u00F9":"u","\u00FA":"u","\u00FB":"u","\u0169":"u","\u1E79":"u","\u016B":"u","\u1E7B":"u","\u016D":"u","\u00FC":"u","\u01DC":"u","\u01D8":"u","\u01D6":"u","\u01DA":"u","\u1EE7":"u","\u016F":"u","\u0171":"u","\u01D4":"u","\u0215":"u","\u0217":"u","\u01B0":"u","\u1EEB":"u","\u1EE9":"u","\u1EEF":"u","\u1EED":"u","\u1EF1":"u","\u1EE5":"u","\u1E73":"u","\u0173":"u","\u1E77":"u","\u1E75":"u","\u0289":"u","\u24E5":"v","\uFF56":"v","\u1E7D":"v","\u1E7F":"v","\u028B":"v","\uA75F":"v","\u028C":"v","\uA761":"vy","\u24E6":"w","\uFF57":"w","\u1E81":"w","\u1E83":"w","\u0175":"w","\u1E87":"w","\u1E85":"w","\u1E98":"w","\u1E89":"w","\u2C73":"w","\u24E7":"x","\uFF58":"x","\u1E8B":"x","\u1E8D":"x","\u24E8":"y","\uFF59":"y","\u1EF3":"y","\u00FD":"y","\u0177":"y","\u1EF9":"y","\u0233":"y","\u1E8F":"y","\u00FF":"y","\u1EF7":"y","\u1E99":"y","\u1EF5":"y","\u01B4":"y","\u024F":"y","\u1EFF":"y","\u24E9":"z","\uFF5A":"z","\u017A":"z","\u1E91":"z","\u017C":"z","\u017E":"z","\u1E93":"z","\u1E95":"z","\u01B6":"z","\u0225":"z","\u0240":"z","\u2C6C":"z","\uA763":"z","\u0386":"\u0391","\u0388":"\u0395","\u0389":"\u0397","\u038A":"\u0399","\u03AA":"\u0399","\u038C":"\u039F","\u038E":"\u03A5","\u03AB":"\u03A5","\u038F":"\u03A9","\u03AC":"\u03B1","\u03AD":"\u03B5","\u03AE":"\u03B7","\u03AF":"\u03B9","\u03CA":"\u03B9","\u0390":"\u03B9","\u03CC":"\u03BF","\u03CD":"\u03C5","\u03CB":"\u03C5","\u03B0":"\u03C5","\u03C9":"\u03C9","\u03C2":"\u03C3"};

    $document = $(document);

    nextUid=(function() { var counter=1; return function() { return counter++; }; }());


    function reinsertElement(element) {
        var placeholder = $(document.createTextNode(''));

        element.before(placeholder);
        placeholder.before(element);
        placeholder.remove();
    }

    function stripDiacritics(str) {
        // Used 'uni range + named function' from http://jsperf.com/diacritics/18
        function match(a) {
            return DIACRITICS[a] || a;
        }

        return str.replace(/[^\u0000-\u007E]/g, match);
    }

    function indexOf(value, array) {
        var i = 0, l = array.length;
        for (; i < l; i = i + 1) {
            if (equal(value, array[i])) return i;
        }
        return -1;
    }

    function measureScrollbar () {
        var $template = $( MEASURE_SCROLLBAR_TEMPLATE );
        $template.appendTo(document.body);

        var dim = {
            width: $template.width() - $template[0].clientWidth,
            height: $template.height() - $template[0].clientHeight
        };
        $template.remove();

        return dim;
    }

    /**
     * Compares equality of a and b
     * @param a
     * @param b
     */
    function equal(a, b) {
        if (a === b) return true;
        if (a === undefined || b === undefined) return false;
        if (a === null || b === null) return false;
        // Check whether 'a' or 'b' is a string (primitive or object).
        // The concatenation of an empty string (+'') converts its argument to a string's primitive.
        if (a.constructor === String) return a+'' === b+''; // a+'' - in case 'a' is a String object
        if (b.constructor === String) return b+'' === a+''; // b+'' - in case 'b' is a String object
        return false;
    }

    /**
     * Splits the string into an array of values, transforming each value. An empty array is returned for nulls or empty
     * strings
     * @param string
     * @param separator
     */
    function splitVal(string, separator, transform) {
        var val, i, l;
        if (string === null || string.length < 1) return [];
        val = string.split(separator);
        for (i = 0, l = val.length; i < l; i = i + 1) val[i] = transform(val[i]);
        return val;
    }

    function getSideBorderPadding(element) {
        return element.outerWidth(false) - element.width();
    }

    function installKeyUpChangeEvent(element) {
        var key="keyup-change-value";
        element.on("keydown", function () {
            if ($.data(element, key) === undefined) {
                $.data(element, key, element.val());
            }
        });
        element.on("keyup", function () {
            var val= $.data(element, key);
            if (val !== undefined && element.val() !== val) {
                $.removeData(element, key);
                element.trigger("keyup-change");
            }
        });
    }


    /**
     * filters mouse events so an event is fired only if the mouse moved.
     *
     * filters out mouse events that occur when mouse is stationary but
     * the elements under the pointer are scrolled.
     */
    function installFilteredMouseMove(element) {
        element.on("mousemove", function (e) {
            var lastpos = lastMousePosition;
            if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
                $(e.target).trigger("mousemove-filtered", e);
            }
        });
    }

    /**
     * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
     * within the last quietMillis milliseconds.
     *
     * @param quietMillis number of milliseconds to wait before invoking fn
     * @param fn function to be debounced
     * @param ctx object to be used as this reference within fn
     * @return debounced version of fn
     */
    function debounce(quietMillis, fn, ctx) {
        ctx = ctx || undefined;
        var timeout;
        return function () {
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function() {
                fn.apply(ctx, args);
            }, quietMillis);
        };
    }

    function installDebouncedScroll(threshold, element) {
        var notify = debounce(threshold, function (e) { element.trigger("scroll-debounced", e);});
        element.on("scroll", function (e) {
            if (indexOf(e.target, element.get()) >= 0) notify(e);
        });
    }

    function focus($el) {
        if ($el[0] === document.activeElement) return;

        /* set the focus in a 0 timeout - that way the focus is set after the processing
            of the current event has finished - which seems like the only reliable way
            to set focus */
        window.setTimeout(function() {
            var el=$el[0], pos=$el.val().length, range;

            $el.focus();

            /* make sure el received focus so we do not error out when trying to manipulate the caret.
                sometimes modals or others listeners may steal it after its set */
            var isVisible = (el.offsetWidth > 0 || el.offsetHeight > 0);
            if (isVisible && el === document.activeElement) {

                /* after the focus is set move the caret to the end, necessary when we val()
                    just before setting focus */
                if(el.setSelectionRange)
                {
                    el.setSelectionRange(pos, pos);
                }
                else if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                }
            }
        }, 0);
    }

    function getCursorInfo(el) {
        el = $(el)[0];
        var offset = 0;
        var length = 0;
        if ('selectionStart' in el) {
            offset = el.selectionStart;
            length = el.selectionEnd - offset;
        } else if ('selection' in document) {
            el.focus();
            var sel = document.selection.createRange();
            length = document.selection.createRange().text.length;
            sel.moveStart('character', -el.value.length);
            offset = sel.text.length - length;
        }
        return { offset: offset, length: length };
    }

    function killEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    function killEventImmediately(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function measureTextWidth(e) {
        if (!sizer){
            var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
            sizer = $(document.createElement("div")).css({
                position: "absolute",
                left: "-10000px",
                top: "-10000px",
                display: "none",
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                fontStyle: style.fontStyle,
                fontWeight: style.fontWeight,
                letterSpacing: style.letterSpacing,
                textTransform: style.textTransform,
                whiteSpace: "nowrap"
            });
            sizer.attr("class","select2-sizer");
            $(document.body).append(sizer);
        }
        sizer.text(e.val());
        return sizer.width();
    }

    function syncCssClasses(dest, src, adapter) {
        var classes, replacements = [], adapted;

        classes = $.trim(dest.attr("class"));

        if (classes) {
            classes = '' + classes; // for IE which returns object

            $(classes.split(/\s+/)).each2(function() {
                if (this.indexOf("select2-") === 0) {
                    replacements.push(this);
                }
            });
        }

        classes = $.trim(src.attr("class"));

        if (classes) {
            classes = '' + classes; // for IE which returns object

            $(classes.split(/\s+/)).each2(function() {
                if (this.indexOf("select2-") !== 0) {
                    adapted = adapter(this);

                    if (adapted) {
                        replacements.push(adapted);
                    }
                }
            });
        }

        dest.attr("class", replacements.join(" "));
    }


    function markMatch(text, term, markup, escapeMarkup) {
        var match=stripDiacritics(text.toUpperCase()).indexOf(stripDiacritics(term.toUpperCase())),
            tl=term.length;

        if (match<0) {
            markup.push(escapeMarkup(text));
            return;
        }

        markup.push(escapeMarkup(text.substring(0, match)));
        markup.push("<span class='select2-match'>");
        markup.push(escapeMarkup(text.substring(match, match + tl)));
        markup.push("</span>");
        markup.push(escapeMarkup(text.substring(match + tl, text.length)));
    }

    function defaultEscapeMarkup(markup) {
        var replace_map = {
            '\\': '&#92;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#47;'
        };

        return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
            return replace_map[match];
        });
    }

    /**
     * Produces an ajax-based query function
     *
     * @param options object containing configuration parameters
     * @param options.params parameter map for the transport ajax call, can contain such options as cache, jsonpCallback, etc. see $.ajax
     * @param options.transport function that will be used to execute the ajax request. must be compatible with parameters supported by $.ajax
     * @param options.url url for the data
     * @param options.data a function(searchTerm, pageNumber, context) that should return an object containing query string parameters for the above url.
     * @param options.dataType request data type: ajax, jsonp, other datatypes supported by jQuery's $.ajax function or the transport function if specified
     * @param options.quietMillis (optional) milliseconds to wait before making the ajaxRequest, helps debounce the ajax function if invoked too often
     * @param options.results a function(remoteData, pageNumber, query) that converts data returned form the remote request to the format expected by Select2.
     *      The expected format is an object containing the following keys:
     *      results array of objects that will be used as choices
     *      more (optional) boolean indicating whether there are more results available
     *      Example: {results:[{id:1, text:'Red'},{id:2, text:'Blue'}], more:true}
     */
    function ajax(options) {
        var timeout, // current scheduled but not yet executed request
            handler = null,
            quietMillis = options.quietMillis || 100,
            ajaxUrl = options.url,
            self = this;

        return function (query) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                var data = options.data, // ajax data function
                    url = ajaxUrl, // ajax url string or function
                    transport = options.transport || $.fn.select2.ajaxDefaults.transport,
                    // deprecated - to be removed in 4.0  - use params instead
                    deprecated = {
                        type: options.type || 'GET', // set type of request (GET or POST)
                        cache: options.cache || false,
                        jsonpCallback: options.jsonpCallback||undefined,
                        dataType: options.dataType||"json"
                    },
                    params = $.extend({}, $.fn.select2.ajaxDefaults.params, deprecated);

                data = data ? data.call(self, query.term, query.page, query.context) : null;
                url = (typeof url === 'function') ? url.call(self, query.term, query.page, query.context) : url;

                if (handler && typeof handler.abort === "function") { handler.abort(); }

                if (options.params) {
                    if ($.isFunction(options.params)) {
                        $.extend(params, options.params.call(self));
                    } else {
                        $.extend(params, options.params);
                    }
                }

                $.extend(params, {
                    url: url,
                    dataType: options.dataType,
                    data: data,
                    success: function (data) {
                        // TODO - replace query.page with query so users have access to term, page, etc.
                        // added query as third paramter to keep backwards compatibility
                        var results = options.results(data, query.page, query);
                        query.callback(results);
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        var results = {
                            hasError: true,
                            jqXHR: jqXHR,
                            textStatus: textStatus,
                            errorThrown: errorThrown
                        };

                        query.callback(results);
                    }
                });
                handler = transport.call(self, params);
            }, quietMillis);
        };
    }

    /**
     * Produces a query function that works with a local array
     *
     * @param options object containing configuration parameters. The options parameter can either be an array or an
     * object.
     *
     * If the array form is used it is assumed that it contains objects with 'id' and 'text' keys.
     *
     * If the object form is used it is assumed that it contains 'data' and 'text' keys. The 'data' key should contain
     * an array of objects that will be used as choices. These objects must contain at least an 'id' key. The 'text'
     * key can either be a String in which case it is expected that each element in the 'data' array has a key with the
     * value of 'text' which will be used to match choices. Alternatively, text can be a function(item) that can extract
     * the text.
     */
    function local(options) {
        var data = options, // data elements
            dataText,
            tmp,
            text = function (item) { return ""+item.text; }; // function used to retrieve the text portion of a data item that is matched against the search

         if ($.isArray(data)) {
            tmp = data;
            data = { results: tmp };
        }

         if ($.isFunction(data) === false) {
            tmp = data;
            data = function() { return tmp; };
        }

        var dataItem = data();
        if (dataItem.text) {
            text = dataItem.text;
            // if text is not a function we assume it to be a key name
            if (!$.isFunction(text)) {
                dataText = dataItem.text; // we need to store this in a separate variable because in the next step data gets reset and data.text is no longer available
                text = function (item) { return item[dataText]; };
            }
        }

        return function (query) {
            var t = query.term, filtered = { results: [] }, process;
            if (t === "") {
                query.callback(data());
                return;
            }

            process = function(datum, collection) {
                var group, attr;
                datum = datum[0];
                if (datum.children) {
                    group = {};
                    for (attr in datum) {
                        if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                    }
                    group.children=[];
                    $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                    if (group.children.length || query.matcher(t, text(group), datum)) {
                        collection.push(group);
                    }
                } else {
                    if (query.matcher(t, text(datum), datum)) {
                        collection.push(datum);
                    }
                }
            };

            $(data().results).each2(function(i, datum) { process(datum, filtered.results); });
            query.callback(filtered);
        };
    }

    // TODO javadoc
    function tags(data) {
        var isFunc = $.isFunction(data);
        return function (query) {
            var t = query.term, filtered = {results: []};
            var result = isFunc ? data(query) : data;
            if ($.isArray(result)) {
                $(result).each(function () {
                    var isObject = this.text !== undefined,
                        text = isObject ? this.text : this;
                    if (t === "" || query.matcher(t, text)) {
                        filtered.results.push(isObject ? this : {id: this, text: this});
                    }
                });
                query.callback(filtered);
            }
        };
    }

    /**
     * Checks if the formatter function should be used.
     *
     * Throws an error if it is not a function. Returns true if it should be used,
     * false if no formatting should be performed.
     *
     * @param formatter
     */
    function checkFormatter(formatter, formatterName) {
        if ($.isFunction(formatter)) return true;
        if (!formatter) return false;
        if (typeof(formatter) === 'string') return true;
        throw new Error(formatterName +" must be a string, function, or falsy value");
    }

  /**
   * Returns a given value
   * If given a function, returns its output
   *
   * @param val string|function
   * @param context value of "this" to be passed to function
   * @returns {*}
   */
    function evaluate(val, context) {
        if ($.isFunction(val)) {
            var args = Array.prototype.slice.call(arguments, 2);
            return val.apply(context, args);
        }
        return val;
    }

    function countResults(results) {
        var count = 0;
        $.each(results, function(i, item) {
            if (item.children) {
                count += countResults(item.children);
            } else {
                count++;
            }
        });
        return count;
    }

    /**
     * Default tokenizer. This function uses breaks the input on substring match of any string from the
     * opts.tokenSeparators array and uses opts.createSearchChoice to create the choice object. Both of those
     * two options have to be defined in order for the tokenizer to work.
     *
     * @param input text user has typed so far or pasted into the search field
     * @param selection currently selected choices
     * @param selectCallback function(choice) callback tho add the choice to selection
     * @param opts select2's opts
     * @return undefined/null to leave the current input unchanged, or a string to change the input to the returned value
     */
    function defaultTokenizer(input, selection, selectCallback, opts) {
        var original = input, // store the original so we can compare and know if we need to tell the search to update its text
            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
            token, // token
            index, // position at which the separator was found
            i, l, // looping variables
            separator; // the matched separator

        if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

        while (true) {
            index = -1;

            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
                separator = opts.tokenSeparators[i];
                index = input.indexOf(separator);
                if (index >= 0) break;
            }

            if (index < 0) break; // did not find any token separator in the input string, bail

            token = input.substring(0, index);
            input = input.substring(index + separator.length);

            if (token.length > 0) {
                token = opts.createSearchChoice.call(this, token, selection);
                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
                    dupe = false;
                    for (i = 0, l = selection.length; i < l; i++) {
                        if (equal(opts.id(token), opts.id(selection[i]))) {
                            dupe = true; break;
                        }
                    }

                    if (!dupe) selectCallback(token);
                }
            }
        }

        if (original!==input) return input;
    }

    function cleanupJQueryElements() {
        var self = this;

        $.each(arguments, function (i, element) {
            self[element].remove();
            self[element] = null;
        });
    }

    /**
     * Creates a new class
     *
     * @param superClass
     * @param methods
     */
    function clazz(SuperClass, methods) {
        var constructor = function () {};
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    }

    AbstractSelect2 = clazz(Object, {

        // abstract
        bind: function (func) {
            var self = this;
            return function () {
                func.apply(self, arguments);
            };
        },

        // abstract
        init: function (opts) {
            var results, search, resultsSelector = ".select2-results";

            // prepare options
            this.opts = opts = this.prepareOpts(opts);

            this.id=opts.id;

            // destroy if called on an existing component
            if (opts.element.data("select2") !== undefined &&
                opts.element.data("select2") !== null) {
                opts.element.data("select2").destroy();
            }

            this.container = this.createContainer();

            this.liveRegion = $('.select2-hidden-accessible');
            if (this.liveRegion.length == 0) {
                this.liveRegion = $("<span>", {
                        role: "status",
                        "aria-live": "polite"
                    })
                    .addClass("select2-hidden-accessible")
                    .appendTo(document.body);
            }

            this.containerId="s2id_"+(opts.element.attr("id") || "autogen"+nextUid());
            this.containerEventName= this.containerId
                .replace(/([.])/g, '_')
                .replace(/([;&,\-\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
            this.container.attr("id", this.containerId);

            this.container.attr("title", opts.element.attr("title"));

            this.body = $(document.body);

            syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);

            this.container.attr("style", opts.element.attr("style"));
            this.container.css(evaluate(opts.containerCss, this.opts.element));
            this.container.addClass(evaluate(opts.containerCssClass, this.opts.element));

            this.elementTabIndex = this.opts.element.attr("tabindex");

            // swap container for the element
            this.opts.element
                .data("select2", this)
                .attr("tabindex", "-1")
                .before(this.container)
                .on("click.select2", killEvent); // do not leak click events

            this.container.data("select2", this);

            this.dropdown = this.container.find(".select2-drop");

            syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);

            this.dropdown.addClass(evaluate(opts.dropdownCssClass, this.opts.element));
            this.dropdown.data("select2", this);
            this.dropdown.on("click", killEvent);

            this.results = results = this.container.find(resultsSelector);
            this.search = search = this.container.find("input.select2-input");

            this.queryCount = 0;
            this.resultsPage = 0;
            this.context = null;

            // initialize the container
            this.initContainer();

            this.container.on("click", killEvent);

            installFilteredMouseMove(this.results);

            this.dropdown.on("mousemove-filtered", resultsSelector, this.bind(this.highlightUnderEvent));
            this.dropdown.on("touchstart touchmove touchend", resultsSelector, this.bind(function (event) {
                this._touchEvent = true;
                this.highlightUnderEvent(event);
            }));
            this.dropdown.on("touchmove", resultsSelector, this.bind(this.touchMoved));
            this.dropdown.on("touchstart touchend", resultsSelector, this.bind(this.clearTouchMoved));

            // Waiting for a click event on touch devices to select option and hide dropdown
            // otherwise click will be triggered on an underlying element
            this.dropdown.on('click', this.bind(function (event) {
                if (this._touchEvent) {
                    this._touchEvent = false;
                    this.selectHighlighted();
                }
            }));

            installDebouncedScroll(80, this.results);
            this.dropdown.on("scroll-debounced", resultsSelector, this.bind(this.loadMoreIfNeeded));

            // do not propagate change event from the search field out of the component
            $(this.container).on("change", ".select2-input", function(e) {e.stopPropagation();});
            $(this.dropdown).on("change", ".select2-input", function(e) {e.stopPropagation();});

            // if jquery.mousewheel plugin is installed we can prevent out-of-bounds scrolling of results via mousewheel
            if ($.fn.mousewheel) {
                results.mousewheel(function (e, delta, deltaX, deltaY) {
                    var top = results.scrollTop();
                    if (deltaY > 0 && top - deltaY <= 0) {
                        results.scrollTop(0);
                        killEvent(e);
                    } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
                        results.scrollTop(results.get(0).scrollHeight - results.height());
                        killEvent(e);
                    }
                });
            }

            installKeyUpChangeEvent(search);
            search.on("keyup-change input paste", this.bind(this.updateResults));
            search.on("focus", function () { search.addClass("select2-focused"); });
            search.on("blur", function () { search.removeClass("select2-focused");});

            this.dropdown.on("mouseup", resultsSelector, this.bind(function (e) {
                if ($(e.target).closest(".select2-result-selectable").length > 0) {
                    this.highlightUnderEvent(e);
                    this.selectHighlighted(e);
                }
            }));

            // trap all mouse events from leaving the dropdown. sometimes there may be a modal that is listening
            // for mouse events outside of itself so it can close itself. since the dropdown is now outside the select2's
            // dom it will trigger the popup close, which is not what we want
            // focusin can cause focus wars between modals and select2 since the dropdown is outside the modal.
            this.dropdown.on("click mouseup mousedown touchstart touchend focusin", function (e) { e.stopPropagation(); });

            this.lastSearchTerm = undefined;

            if ($.isFunction(this.opts.initSelection)) {
                // initialize selection based on the current value of the source element
                this.initSelection();

                // if the user has provided a function that can set selection based on the value of the source element
                // we monitor the change event on the element and trigger it, allowing for two way synchronization
                this.monitorSource();
            }

            if (opts.maximumInputLength !== null) {
                this.search.attr("maxlength", opts.maximumInputLength);
            }

            var disabled = opts.element.prop("disabled");
            if (disabled === undefined) disabled = false;
            this.enable(!disabled);

            var readonly = opts.element.prop("readonly");
            if (readonly === undefined) readonly = false;
            this.readonly(readonly);

            // Calculate size of scrollbar
            scrollBarDimensions = scrollBarDimensions || measureScrollbar();

            this.autofocus = opts.element.prop("autofocus");
            opts.element.prop("autofocus", false);
            if (this.autofocus) this.focus();

            this.search.attr("placeholder", opts.searchInputPlaceholder);
        },

        // abstract
        destroy: function () {
            var element=this.opts.element, select2 = element.data("select2"), self = this;

            this.close();

            if (element.length && element[0].detachEvent && self._sync) {
                element.each(function () {
                    if (self._sync) {
                        this.detachEvent("onpropertychange", self._sync);
                    }
                });
            }
            if (this.propertyObserver) {
                this.propertyObserver.disconnect();
                this.propertyObserver = null;
            }
            this._sync = null;

            if (select2 !== undefined) {
                select2.container.remove();
                select2.liveRegion.remove();
                select2.dropdown.remove();
                element.removeData("select2")
                    .off(".select2");
                if (!element.is("input[type='hidden']")) {
                    element
                        .show()
                        .prop("autofocus", this.autofocus || false);
                    if (this.elementTabIndex) {
                        element.attr({tabindex: this.elementTabIndex});
                    } else {
                        element.removeAttr("tabindex");
                    }
                    element.show();
                } else {
                    element.css("display", "");
                }
            }

            cleanupJQueryElements.call(this,
                "container",
                "liveRegion",
                "dropdown",
                "results",
                "search"
            );
        },

        // abstract
        optionToData: function(element) {
            if (element.is("option")) {
                return {
                    id:element.prop("value"),
                    text:element.text(),
                    element: element.get(),
                    css: element.attr("class"),
                    disabled: element.prop("disabled"),
                    locked: equal(element.attr("locked"), "locked") || equal(element.data("locked"), true)
                };
            } else if (element.is("optgroup")) {
                return {
                    text:element.attr("label"),
                    children:[],
                    element: element.get(),
                    css: element.attr("class")
                };
            }
        },

        // abstract
        prepareOpts: function (opts) {
            var element, select, idKey, ajaxUrl, self = this;

            element = opts.element;

            if (element.get(0).tagName.toLowerCase() === "select") {
                this.select = select = opts.element;
            }

            if (select) {
                // these options are not allowed when attached to a select because they are picked up off the element itself
                $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                    if (this in opts) {
                        throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
                    }
                });
            }

            opts.debug = opts.debug || $.fn.select2.defaults.debug;

            // Warnings for options renamed/removed in Select2 4.0.0
            // Only when it's enabled through debug mode
            if (opts.debug && console && console.warn) {
                // id was removed
                if (opts.id != null) {
                    console.warn(
                        'Select2: The `id` option has been removed in Select2 4.0.0, ' +
                        'consider renaming your `id` property or mapping the property before your data makes it to Select2. ' +
                        'You can read more at https://select2.github.io/announcements-4.0.html#changed-id'
                    );
                }

                // text was removed
                if (opts.text != null) {
                    console.warn(
                        'Select2: The `text` option has been removed in Select2 4.0.0, ' +
                        'consider renaming your `text` property or mapping the property before your data makes it to Select2. ' +
                        'You can read more at https://select2.github.io/announcements-4.0.html#changed-id'
                    );
                }

                // sortResults was renamed to results
                if (opts.sortResults != null) {
                    console.warn(
                        'Select2: the `sortResults` option has been renamed to `sorter` in Select2 4.0.0. '
                    );
                }

                // selectOnBlur was renamed to selectOnClose
                if (opts.selectOnBlur != null) {
                    console.warn(
                        'Select2: The `selectOnBlur` option has been renamed to `selectOnClose` in Select2 4.0.0.'
                    );
                }

                // ajax.results was renamed to ajax.processResults
                if (opts.ajax != null && opts.ajax.results != null) {
                    console.warn(
                        'Select2: The `ajax.results` option has been renamed to `ajax.processResults` in Select2 4.0.0.'
                    );
                }

                // format* options were renamed to language.*
                if (opts.formatNoResults != null) {
                    console.warn(
                        'Select2: The `formatNoResults` option has been renamed to `language.noResults` in Select2 4.0.0.'
                    );
                }
                if (opts.formatSearching != null) {
                    console.warn(
                        'Select2: The `formatSearching` option has been renamed to `language.searching` in Select2 4.0.0.'
                    );
                }
                if (opts.formatInputTooShort != null) {
                    console.warn(
                        'Select2: The `formatInputTooShort` option has been renamed to `language.inputTooShort` in Select2 4.0.0.'
                    );
                }
                if (opts.formatInputTooLong != null) {
                    console.warn(
                        'Select2: The `formatInputTooLong` option has been renamed to `language.inputTooLong` in Select2 4.0.0.'
                    );
                }
                if (opts.formatLoading != null) {
                    console.warn(
                        'Select2: The `formatLoading` option has been renamed to `language.loadingMore` in Select2 4.0.0.'
                    );
                }
                if (opts.formatSelectionTooBig != null) {
                    console.warn(
                        'Select2: The `formatSelectionTooBig` option has been renamed to `language.maximumSelected` in Select2 4.0.0.'
                    );
                }

                if (opts.element.data('select2Tags')) {
                    console.warn(
                        'Select2: The `data-select2-tags` attribute has been renamed to `data-tags` in Select2 4.0.0.'
                    );
                }
            }

            // Aliasing options renamed in Select2 4.0.0

            // data-select2-tags -> data-tags
            if (opts.element.data('tags') != null) {
                var elemTags = opts.element.data('tags');

                // data-tags should actually be a boolean
                if (!$.isArray(elemTags)) {
                    elemTags = [];
                }

                opts.element.data('select2Tags', elemTags);
            }

            // sortResults -> sorter
            if (opts.sorter != null) {
                opts.sortResults = opts.sorter;
            }

            // selectOnBlur -> selectOnClose
            if (opts.selectOnClose != null) {
                opts.selectOnBlur = opts.selectOnClose;
            }

            // ajax.results -> ajax.processResults
            if (opts.ajax != null) {
                if ($.isFunction(opts.ajax.processResults)) {
                    opts.ajax.results = opts.ajax.processResults;
                }
            }

            // Formatters/language options
            if (opts.language != null) {
                var lang = opts.language;

                // formatNoMatches -> language.noMatches
                if ($.isFunction(lang.noMatches)) {
                    opts.formatNoMatches = lang.noMatches;
                }

                // formatSearching -> language.searching
                if ($.isFunction(lang.searching)) {
                    opts.formatSearching = lang.searching;
                }

                // formatInputTooShort -> language.inputTooShort
                if ($.isFunction(lang.inputTooShort)) {
                    opts.formatInputTooShort = lang.inputTooShort;
                }

                // formatInputTooLong -> language.inputTooLong
                if ($.isFunction(lang.inputTooLong)) {
                    opts.formatInputTooLong = lang.inputTooLong;
                }

                // formatLoading -> language.loadingMore
                if ($.isFunction(lang.loadingMore)) {
                    opts.formatLoading = lang.loadingMore;
                }

                // formatSelectionTooBig -> language.maximumSelected
                if ($.isFunction(lang.maximumSelected)) {
                    opts.formatSelectionTooBig = lang.maximumSelected;
                }
            }

            opts = $.extend({}, {
                populateResults: function(container, results, query) {
                    var populate, id=this.opts.id, liveRegion=this.liveRegion;

                    populate=function(results, container, depth) {

                        var i, l, result, selectable, disabled, compound, node, label, innerContainer, formatted;

                        results = opts.sortResults(results, container, query);

                        // collect the created nodes for bulk append
                        var nodes = [];
                        for (i = 0, l = results.length; i < l; i = i + 1) {

                            result=results[i];

                            disabled = (result.disabled === true);
                            selectable = (!disabled) && (id(result) !== undefined);

                            compound=result.children && result.children.length > 0;

                            node=$("<li></li>");
                            node.addClass("select2-results-dept-"+depth);
                            node.addClass("select2-result");
                            node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                            if (disabled) { node.addClass("select2-disabled"); }
                            if (compound) { node.addClass("select2-result-with-children"); }
                            node.addClass(self.opts.formatResultCssClass(result));
                            node.attr("role", "presentation");

                            label=$(document.createElement("div"));
                            label.addClass("select2-result-label");
                            label.attr("id", "select2-result-label-" + nextUid());
                            label.attr("role", "option");

                            formatted=opts.formatResult(result, label, query, self.opts.escapeMarkup);
                            if (formatted!==undefined) {
                                label.html(formatted);
                                node.append(label);
                            }


                            if (compound) {
                                innerContainer=$("<ul></ul>");
                                innerContainer.addClass("select2-result-sub");
                                populate(result.children, innerContainer, depth+1);
                                node.append(innerContainer);
                            }

                            node.data("select2-data", result);
                            nodes.push(node[0]);
                        }

                        // bulk append the created nodes
                        container.append(nodes);
                        liveRegion.text(opts.formatMatches(results.length));
                    };

                    populate(results, container, 0);
                }
            }, $.fn.select2.defaults, opts);

            if (typeof(opts.id) !== "function") {
                idKey = opts.id;
                opts.id = function (e) { return e[idKey]; };
            }

            if ($.isArray(opts.element.data("select2Tags"))) {
                if ("tags" in opts) {
                    throw "tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + opts.element.attr("id");
                }
                opts.tags=opts.element.data("select2Tags");
            }

            if (select) {
                opts.query = this.bind(function (query) {
                    var data = { results: [], more: false },
                        term = query.term,
                        children, placeholderOption, process;

                    process=function(element, collection) {
                        var group;
                        if (element.is("option")) {
                            if (query.matcher(term, element.text(), element)) {
                                collection.push(self.optionToData(element));
                            }
                        } else if (element.is("optgroup")) {
                            group=self.optionToData(element);
                            element.children().each2(function(i, elm) { process(elm, group.children); });
                            if (group.children.length>0) {
                                collection.push(group);
                            }
                        }
                    };

                    children=element.children();

                    // ignore the placeholder option if there is one
                    if (this.getPlaceholder() !== undefined && children.length > 0) {
                        placeholderOption = this.getPlaceholderOption();
                        if (placeholderOption) {
                            children=children.not(placeholderOption);
                        }
                    }

                    children.each2(function(i, elm) { process(elm, data.results); });

                    query.callback(data);
                });
                // this is needed because inside val() we construct choices from options and their id is hardcoded
                opts.id=function(e) { return e.id; };
            } else {
                if (!("query" in opts)) {
                    if ("ajax" in opts) {
                        ajaxUrl = opts.element.data("ajax-url");
                        if (ajaxUrl && ajaxUrl.length > 0) {
                            opts.ajax.url = ajaxUrl;
                        }
                        opts.query = ajax.call(opts.element, opts.ajax);
                    } else if ("data" in opts) {
                        opts.query = local(opts.data);
                    } else if ("tags" in opts) {
                        opts.query = tags(opts.tags);
                        if (opts.createSearchChoice === undefined) {
                            opts.createSearchChoice = function (term) { return {id: $.trim(term), text: $.trim(term)}; };
                        }
                        if (opts.initSelection === undefined) {
                            opts.initSelection = function (element, callback) {
                                var data = [];
                                $(splitVal(element.val(), opts.separator, opts.transformVal)).each(function () {
                                    var obj = { id: this, text: this },
                                        tags = opts.tags;
                                    if ($.isFunction(tags)) tags=tags();
                                    $(tags).each(function() { if (equal(this.id, obj.id)) { obj = this; return false; } });
                                    data.push(obj);
                                });

                                callback(data);
                            };
                        }
                    }
                }
            }
            if (typeof(opts.query) !== "function") {
                throw "query function not defined for Select2 " + opts.element.attr("id");
            }

            if (opts.createSearchChoicePosition === 'top') {
                opts.createSearchChoicePosition = function(list, item) { list.unshift(item); };
            }
            else if (opts.createSearchChoicePosition === 'bottom') {
                opts.createSearchChoicePosition = function(list, item) { list.push(item); };
            }
            else if (typeof(opts.createSearchChoicePosition) !== "function")  {
                throw "invalid createSearchChoicePosition option must be 'top', 'bottom' or a custom function";
            }

            return opts;
        },

        /**
         * Monitor the original element for changes and update select2 accordingly
         */
        // abstract
        monitorSource: function () {
            var el = this.opts.element, observer, self = this;

            el.on("change.select2", this.bind(function (e) {
                if (this.opts.element.data("select2-change-triggered") !== true) {
                    this.initSelection();
                }
            }));

            this._sync = this.bind(function () {

                // sync enabled state
                var disabled = el.prop("disabled");
                if (disabled === undefined) disabled = false;
                this.enable(!disabled);

                var readonly = el.prop("readonly");
                if (readonly === undefined) readonly = false;
                this.readonly(readonly);

                if (this.container) {
                    syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
                    this.container.addClass(evaluate(this.opts.containerCssClass, this.opts.element));
                }

                if (this.dropdown) {
                    syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
                    this.dropdown.addClass(evaluate(this.opts.dropdownCssClass, this.opts.element));
                }

            });

            // IE8-10 (IE9/10 won't fire propertyChange via attachEventListener)
            if (el.length && el[0].attachEvent) {
                el.each(function() {
                    this.attachEvent("onpropertychange", self._sync);
                });
            }

            // safari, chrome, firefox, IE11
            observer = window.MutationObserver || window.WebKitMutationObserver|| window.MozMutationObserver;
            if (observer !== undefined) {
                if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }
                this.propertyObserver = new observer(function (mutations) {
                    $.each(mutations, self._sync);
                });
                this.propertyObserver.observe(el.get(0), { attributes:true, subtree:false });
            }
        },

        // abstract
        triggerSelect: function(data) {
            var evt = $.Event("select2-selecting", { val: this.id(data), object: data, choice: data });
            this.opts.element.trigger(evt);
            return !evt.isDefaultPrevented();
        },

        /**
         * Triggers the change event on the source element
         */
        // abstract
        triggerChange: function (details) {

            details = details || {};
            details= $.extend({}, details, { type: "change", val: this.val() });
            // prevents recursive triggering
            this.opts.element.data("select2-change-triggered", true);
            this.opts.element.trigger(details);
            this.opts.element.data("select2-change-triggered", false);

            // some validation frameworks ignore the change event and listen instead to keyup, click for selects
            // so here we trigger the click event manually
            this.opts.element.click();

            // ValidationEngine ignores the change event and listens instead to blur
            // so here we trigger the blur event manually if so desired
            if (this.opts.blurOnChange)
                this.opts.element.blur();
        },

        //abstract
        isInterfaceEnabled: function()
        {
            return this.enabledInterface === true;
        },

        // abstract
        enableInterface: function() {
            var enabled = this._enabled && !this._readonly,
                disabled = !enabled;

            if (enabled === this.enabledInterface) return false;

            this.container.toggleClass("select2-container-disabled", disabled);
            this.close();
            this.enabledInterface = enabled;

            return true;
        },

        // abstract
        enable: function(enabled) {
            if (enabled === undefined) enabled = true;
            if (this._enabled === enabled) return;
            this._enabled = enabled;

            this.opts.element.prop("disabled", !enabled);
            this.enableInterface();
        },

        // abstract
        disable: function() {
            this.enable(false);
        },

        // abstract
        readonly: function(enabled) {
            if (enabled === undefined) enabled = false;
            if (this._readonly === enabled) return;
            this._readonly = enabled;

            this.opts.element.prop("readonly", enabled);
            this.enableInterface();
        },

        // abstract
        opened: function () {
            return (this.container) ? this.container.hasClass("select2-dropdown-open") : false;
        },

        // abstract
        positionDropdown: function() {
            var $dropdown = this.dropdown,
                container = this.container,
                offset = container.offset(),
                height = container.outerHeight(false),
                width = container.outerWidth(false),
                dropHeight = $dropdown.outerHeight(false),
                $window = $(window),
                windowWidth = $window.width(),
                windowHeight = $window.height(),
                viewPortRight = $window.scrollLeft() + windowWidth,
                viewportBottom = $window.scrollTop() + windowHeight,
                dropTop = offset.top + height,
                dropLeft = offset.left,
                enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
                enoughRoomAbove = (offset.top - dropHeight) >= $window.scrollTop(),
                dropWidth = $dropdown.outerWidth(false),
                enoughRoomOnRight = function() {
                    return dropLeft + dropWidth <= viewPortRight;
                },
                enoughRoomOnLeft = function() {
                    return offset.left + viewPortRight + container.outerWidth(false)  > dropWidth;
                },
                aboveNow = $dropdown.hasClass("select2-drop-above"),
                bodyOffset,
                above,
                changeDirection,
                css,
                resultsListNode;

            // always prefer the current above/below alignment, unless there is not enough room
            if (aboveNow) {
                above = true;
                if (!enoughRoomAbove && enoughRoomBelow) {
                    changeDirection = true;
                    above = false;
                }
            } else {
                above = false;
                if (!enoughRoomBelow && enoughRoomAbove) {
                    changeDirection = true;
                    above = true;
                }
            }

            //if we are changing direction we need to get positions when dropdown is hidden;
            if (changeDirection) {
                $dropdown.hide();
                offset = this.container.offset();
                height = this.container.outerHeight(false);
                width = this.container.outerWidth(false);
                dropHeight = $dropdown.outerHeight(false);
                viewPortRight = $window.scrollLeft() + windowWidth;
                viewportBottom = $window.scrollTop() + windowHeight;
                dropTop = offset.top + height;
                dropLeft = offset.left;
                dropWidth = $dropdown.outerWidth(false);
                $dropdown.show();

                // fix so the cursor does not move to the left within the search-textbox in IE
                this.focusSearch();
            }

            if (this.opts.dropdownAutoWidth) {
                resultsListNode = $('.select2-results', $dropdown)[0];
                $dropdown.addClass('select2-drop-auto-width');
                $dropdown.css('width', '');
                // Add scrollbar width to dropdown if vertical scrollbar is present
                dropWidth = $dropdown.outerWidth(false) + (resultsListNode.scrollHeight === resultsListNode.clientHeight ? 0 : scrollBarDimensions.width);
                dropWidth > width ? width = dropWidth : dropWidth = width;
                dropHeight = $dropdown.outerHeight(false);
            }
            else {
                this.container.removeClass('select2-drop-auto-width');
            }

            //console.log("below/ droptop:", dropTop, "dropHeight", dropHeight, "sum", (dropTop+dropHeight)+" viewport bottom", viewportBottom, "enough?", enoughRoomBelow);
            //console.log("above/ offset.top", offset.top, "dropHeight", dropHeight, "top", (offset.top-dropHeight), "scrollTop", this.body.scrollTop(), "enough?", enoughRoomAbove);

            // fix positioning when body has an offset and is not position: static
            if (this.body.css('position') !== 'static') {
                bodyOffset = this.body.offset();
                dropTop -= bodyOffset.top;
                dropLeft -= bodyOffset.left;
            }

            if (!enoughRoomOnRight() && enoughRoomOnLeft()) {
                dropLeft = offset.left + this.container.outerWidth(false) - dropWidth;
            }

            css =  {
                left: dropLeft,
                width: width
            };

            if (above) {
                this.container.addClass("select2-drop-above");
                $dropdown.addClass("select2-drop-above");
                dropHeight = $dropdown.outerHeight(false);
                css.top = offset.top - dropHeight;
                css.bottom = 'auto';
            }
            else {
                css.top = dropTop;
                css.bottom = 'auto';
                this.container.removeClass("select2-drop-above");
                $dropdown.removeClass("select2-drop-above");
            }
            css = $.extend(css, evaluate(this.opts.dropdownCss, this.opts.element));

            $dropdown.css(css);
        },

        // abstract
        shouldOpen: function() {
            var event;

            if (this.opened()) return false;

            if (this._enabled === false || this._readonly === true) return false;

            event = $.Event("select2-opening");
            this.opts.element.trigger(event);
            return !event.isDefaultPrevented();
        },

        // abstract
        clearDropdownAlignmentPreference: function() {
            // clear the classes used to figure out the preference of where the dropdown should be opened
            this.container.removeClass("select2-drop-above");
            this.dropdown.removeClass("select2-drop-above");
        },

        /**
         * Opens the dropdown
         *
         * @return {Boolean} whether or not dropdown was opened. This method will return false if, for example,
         * the dropdown is already open, or if the 'open' event listener on the element called preventDefault().
         */
        // abstract
        open: function () {

            if (!this.shouldOpen()) return false;

            this.opening();

            // Only bind the document mousemove when the dropdown is visible
            $document.on("mousemove.select2Event", function (e) {
                lastMousePosition.x = e.pageX;
                lastMousePosition.y = e.pageY;
            });

            return true;
        },

        /**
         * Performs the opening of the dropdown
         */
        // abstract
        opening: function() {
            var cid = this.containerEventName,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid,
                mask;

            this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

            this.clearDropdownAlignmentPreference();

            if(this.dropdown[0] !== this.body.children().last()[0]) {
                this.dropdown.detach().appendTo(this.body);
            }

            // create the dropdown mask if doesn't already exist
            mask = $("#select2-drop-mask");
            if (mask.length === 0) {
                mask = $(document.createElement("div"));
                mask.attr("id","select2-drop-mask").attr("class","select2-drop-mask");
                mask.hide();
                mask.appendTo(this.body);
                mask.on("mousedown touchstart click", function (e) {
                    // Prevent IE from generating a click event on the body
                    reinsertElement(mask);

                    var dropdown = $("#select2-drop"), self;
                    if (dropdown.length > 0) {
                        self=dropdown.data("select2");
                        if (self.opts.selectOnBlur) {
                            self.selectHighlighted({noFocus: true});
                        }
                        self.close();
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }

            // ensure the mask is always right before the dropdown
            if (this.dropdown.prev()[0] !== mask[0]) {
                this.dropdown.before(mask);
            }

            // move the global id to the correct dropdown
            $("#select2-drop").removeAttr("id");
            this.dropdown.attr("id", "select2-drop");

            // show the elements
            mask.show();

            this.positionDropdown();
            this.dropdown.show();
            this.positionDropdown();

            this.dropdown.addClass("select2-drop-active");

            // attach listeners to events that can change the position of the container and thus require
            // the position of the dropdown to be updated as well so it does not come unglued from the container
            var that = this;
            this.container.parents().add(window).each(function () {
                $(this).on(resize+" "+scroll+" "+orient, function (e) {
                    if (that.opened()) that.positionDropdown();
                });
            });


        },

        // abstract
        close: function () {
            if (!this.opened()) return;

            var cid = this.containerEventName,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid;

            // unbind event listeners
            this.container.parents().add(window).each(function () { $(this).off(scroll).off(resize).off(orient); });

            this.clearDropdownAlignmentPreference();

            $("#select2-drop-mask").hide();
            this.dropdown.removeAttr("id"); // only the active dropdown has the select2-drop id
            this.dropdown.hide();
            this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
            this.results.empty();

            // Now that the dropdown is closed, unbind the global document mousemove event
            $document.off("mousemove.select2Event");

            this.clearSearch();
            this.search.removeClass("select2-active");

            // Remove the aria active descendant for highlighted element
            this.search.removeAttr("aria-activedescendant");
            this.opts.element.trigger($.Event("select2-close"));
        },

        /**
         * Opens control, sets input value, and updates results.
         */
        // abstract
        externalSearch: function (term) {
            this.open();
            this.search.val(term);
            this.updateResults(false);
        },

        // abstract
        clearSearch: function () {

        },

        /**
         * @return {Boolean} Whether or not search value was changed.
         * @private
         */
        prefillNextSearchTerm: function () {
            // initializes search's value with nextSearchTerm (if defined by user)
            // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
            if(this.search.val() !== "") {
                return false;
            }

            var nextSearchTerm = this.opts.nextSearchTerm(this.data(), this.lastSearchTerm);
            if(nextSearchTerm !== undefined){
                this.search.val(nextSearchTerm);
                this.search.select();
                return true;
            }

            return false;
        },

        //abstract
        getMaximumSelectionSize: function() {
            return evaluate(this.opts.maximumSelectionSize, this.opts.element);
        },

        // abstract
        ensureHighlightVisible: function () {
            var results = this.results, children, index, child, hb, rb, y, more, topOffset;

            index = this.highlight();

            if (index < 0) return;

            if (index == 0) {

                // if the first element is highlighted scroll all the way to the top,
                // that way any unselectable headers above it will also be scrolled
                // into view

                results.scrollTop(0);
                return;
            }

            children = this.findHighlightableChoices().find('.select2-result-label');

            child = $(children[index]);

            topOffset = (child.offset() || {}).top || 0;

            hb = topOffset + child.outerHeight(true);

            // if this is the last child lets also make sure select2-more-results is visible
            if (index === children.length - 1) {
                more = results.find("li.select2-more-results");
                if (more.length > 0) {
                    hb = more.offset().top + more.outerHeight(true);
                }
            }

            rb = results.offset().top + results.outerHeight(false);
            if (hb > rb) {
                results.scrollTop(results.scrollTop() + (hb - rb));
            }
            y = topOffset - results.offset().top;

            // make sure the top of the element is visible
            if (y < 0 && child.css('display') != 'none' ) {
                results.scrollTop(results.scrollTop() + y); // y is negative
            }
        },

        // abstract
        findHighlightableChoices: function() {
            return this.results.find(".select2-result-selectable:not(.select2-disabled):not(.select2-selected)");
        },

        // abstract
        moveHighlight: function (delta) {
            var choices = this.findHighlightableChoices(),
                index = this.highlight();

            while (index > -1 && index < choices.length) {
                index += delta;
                var choice = $(choices[index]);
                if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled") && !choice.hasClass("select2-selected")) {
                    this.highlight(index);
                    break;
                }
            }
        },

        // abstract
        highlight: function (index) {
            var choices = this.findHighlightableChoices(),
                choice,
                data;

            if (arguments.length === 0) {
                return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
            }

            if (index >= choices.length) index = choices.length - 1;
            if (index < 0) index = 0;

            this.removeHighlight();

            choice = $(choices[index]);
            choice.addClass("select2-highlighted");

            // ensure assistive technology can determine the active choice
            this.search.attr("aria-activedescendant", choice.find(".select2-result-label").attr("id"));

            this.ensureHighlightVisible();

            this.liveRegion.text(choice.text());

            data = choice.data("select2-data");
            if (data) {
                this.opts.element.trigger({ type: "select2-highlight", val: this.id(data), choice: data });
            }
        },

        removeHighlight: function() {
            this.results.find(".select2-highlighted").removeClass("select2-highlighted");
        },

        touchMoved: function() {
            this._touchMoved = true;
        },

        clearTouchMoved: function() {
          this._touchMoved = false;
        },

        // abstract
        countSelectableResults: function() {
            return this.findHighlightableChoices().length;
        },

        // abstract
        highlightUnderEvent: function (event) {
            var el = $(event.target).closest(".select2-result-selectable");
            if (el.length > 0 && !el.is(".select2-highlighted")) {
                var choices = this.findHighlightableChoices();
                this.highlight(choices.index(el));
            } else if (el.length == 0) {
                // if we are over an unselectable item remove all highlights
                this.removeHighlight();
            }
        },

        // abstract
        loadMoreIfNeeded: function () {
            var results = this.results,
                more = results.find("li.select2-more-results"),
                below, // pixels the element is below the scroll fold, below==0 is when the element is starting to be visible
                page = this.resultsPage + 1,
                self=this,
                term=this.search.val(),
                context=this.context;

            if (more.length === 0) return;
            below = more.offset().top - results.offset().top - results.height();

            if (below <= this.opts.loadMorePadding) {
                more.addClass("select2-active");
                this.opts.query({
                        element: this.opts.element,
                        term: term,
                        page: page,
                        context: context,
                        matcher: this.opts.matcher,
                        callback: this.bind(function (data) {

                    // ignore a response if the select2 has been closed before it was received
                    if (!self.opened()) return;


                    self.opts.populateResults.call(this, results, data.results, {term: term, page: page, context:context});
                    self.postprocessResults(data, false, false);

                    if (data.more===true) {
                        more.detach().appendTo(results).html(self.opts.escapeMarkup(evaluate(self.opts.formatLoadMore, self.opts.element, page+1)));
                        window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                    } else {
                        more.remove();
                    }
                    self.positionDropdown();
                    self.resultsPage = page;
                    self.context = data.context;
                    this.opts.element.trigger({ type: "select2-loaded", items: data });
                })});
            }
        },

        /**
         * Default tokenizer function which does nothing
         */
        tokenize: function() {

        },

        /**
         * @param initial whether or not this is the call to this method right after the dropdown has been opened
         */
        // abstract
        updateResults: function (initial) {
            var search = this.search,
                results = this.results,
                opts = this.opts,
                data,
                self = this,
                input,
                term = search.val(),
                lastTerm = $.data(this.container, "select2-last-term"),
                // sequence number used to drop out-of-order responses
                queryNumber;

            // prevent duplicate queries against the same term
            if (initial !== true && lastTerm && equal(term, lastTerm)) return;

            $.data(this.container, "select2-last-term", term);

            // if the search is currently hidden we do not alter the results
            if (initial !== true && (this.showSearchInput === false || !this.opened())) {
                return;
            }

            function postRender() {
                search.removeClass("select2-active");
                self.positionDropdown();
                if (results.find('.select2-no-results,.select2-selection-limit,.select2-searching').length) {
                    self.liveRegion.text(results.text());
                }
                else {
                    self.liveRegion.text(self.opts.formatMatches(results.find('.select2-result-selectable:not(".select2-selected")').length));
                }
            }

            function render(html) {
                results.html(html);
                postRender();
            }

            queryNumber = ++this.queryCount;

            var maxSelSize = this.getMaximumSelectionSize();
            if (maxSelSize >=1) {
                data = this.data();
                if ($.isArray(data) && data.length >= maxSelSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
                    render("<li class='select2-selection-limit'>" + evaluate(opts.formatSelectionTooBig, opts.element, maxSelSize) + "</li>");
                    return;
                }
            }

            if (search.val().length < opts.minimumInputLength) {
                if (checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooShort, opts.element, search.val(), opts.minimumInputLength) + "</li>");
                } else {
                    render("");
                }
                if (initial && this.showSearch) this.showSearch(true);
                return;
            }

            if (opts.maximumInputLength && search.val().length > opts.maximumInputLength) {
                if (checkFormatter(opts.formatInputTooLong, "formatInputTooLong")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooLong, opts.element, search.val(), opts.maximumInputLength) + "</li>");
                } else {
                    render("");
                }
                return;
            }

            if (opts.formatSearching && this.findHighlightableChoices().length === 0) {
                render("<li class='select2-searching'>" + evaluate(opts.formatSearching, opts.element) + "</li>");
            }

            search.addClass("select2-active");

            this.removeHighlight();

            // give the tokenizer a chance to pre-process the input
            input = this.tokenize();
            if (input != undefined && input != null) {
                search.val(input);
            }

            this.resultsPage = 1;

            opts.query({
                element: opts.element,
                    term: search.val(),
                    page: this.resultsPage,
                    context: null,
                    matcher: opts.matcher,
                    callback: this.bind(function (data) {
                var def; // default choice

                // ignore old responses
                if (queryNumber != this.queryCount) {
                  return;
                }

                // ignore a response if the select2 has been closed before it was received
                if (!this.opened()) {
                    this.search.removeClass("select2-active");
                    return;
                }

                // handle ajax error
                if(data.hasError !== undefined && checkFormatter(opts.formatAjaxError, "formatAjaxError")) {
                    render("<li class='select2-ajax-error'>" + evaluate(opts.formatAjaxError, opts.element, data.jqXHR, data.textStatus, data.errorThrown) + "</li>");
                    return;
                }

                // save context, if any
                this.context = (data.context===undefined) ? null : data.context;
                // create a default choice and prepend it to the list
                if (this.opts.createSearchChoice && search.val() !== "") {
                    def = this.opts.createSearchChoice.call(self, search.val(), data.results);
                    if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
                        if ($(data.results).filter(
                            function () {
                                return equal(self.id(this), self.id(def));
                            }).length === 0) {
                            this.opts.createSearchChoicePosition(data.results, def);
                        }
                    }
                }

                if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatNoMatches, opts.element, search.val()) + "</li>");
                    if(this.showSearch){
                        this.showSearch(search.val());
                    }
                    return;
                }

                results.empty();
                self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

                if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
                    results.append("<li class='select2-more-results'>" + opts.escapeMarkup(evaluate(opts.formatLoadMore, opts.element, this.resultsPage)) + "</li>");
                    window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                }

                this.postprocessResults(data, initial);

                postRender();

                this.opts.element.trigger({ type: "select2-loaded", items: data });
            })});
        },

        // abstract
        cancel: function () {
            this.close();
        },

        // abstract
        blur: function () {
            // if selectOnBlur == true, select the currently highlighted option
            if (this.opts.selectOnBlur)
                this.selectHighlighted({noFocus: true});

            this.close();
            this.container.removeClass("select2-container-active");
            // synonymous to .is(':focus'), which is available in jquery >= 1.6
            if (this.search[0] === document.activeElement) { this.search.blur(); }
            this.clearSearch();
            this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
        },

        // abstract
        focusSearch: function () {
            focus(this.search);
        },

        // abstract
        selectHighlighted: function (options) {
            if (this._touchMoved) {
              this.clearTouchMoved();
              return;
            }
            var index=this.highlight(),
                highlighted=this.results.find(".select2-highlighted"),
                data = highlighted.closest('.select2-result').data("select2-data");

            if (data) {
                this.highlight(index);
                this.onSelect(data, options);
            } else if (options && options.noFocus) {
                this.close();
            }
        },

        // abstract
        getPlaceholder: function () {
            var placeholderOption;
            return this.opts.element.attr("placeholder") ||
                this.opts.element.attr("data-placeholder") || // jquery 1.4 compat
                this.opts.element.data("placeholder") ||
                this.opts.placeholder ||
                ((placeholderOption = this.getPlaceholderOption()) !== undefined ? placeholderOption.text() : undefined);
        },

        // abstract
        getPlaceholderOption: function() {
            if (this.select) {
                var firstOption = this.select.children('option').first();
                if (this.opts.placeholderOption !== undefined ) {
                    //Determine the placeholder option based on the specified placeholderOption setting
                    return (this.opts.placeholderOption === "first" && firstOption) ||
                           (typeof this.opts.placeholderOption === "function" && this.opts.placeholderOption(this.select));
                } else if ($.trim(firstOption.text()) === "" && firstOption.val() === "") {
                    //No explicit placeholder option specified, use the first if it's blank
                    return firstOption;
                }
            }
        },

        /**
         * Get the desired width for the container element.  This is
         * derived first from option `width` passed to select2, then
         * the inline 'style' on the original element, and finally
         * falls back to the jQuery calculated element width.
         */
        // abstract
        initContainerWidth: function () {
            function resolveContainerWidth() {
                var style, attrs, matches, i, l, attr;

                if (this.opts.width === "off") {
                    return null;
                } else if (this.opts.width === "element"){
                    return this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px';
                } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
                    // check if there is inline style on the element that contains width
                    style = this.opts.element.attr('style');
                    if (typeof(style) === "string") {
                        attrs = style.split(';');
                        for (i = 0, l = attrs.length; i < l; i = i + 1) {
                            attr = attrs[i].replace(/\s/g, '');
                            matches = attr.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i);
                            if (matches !== null && matches.length >= 1)
                                return matches[1];
                        }
                    }

                    if (this.opts.width === "resolve") {
                        // next check if css('width') can resolve a width that is percent based, this is sometimes possible
                        // when attached to input type=hidden or elements hidden via css
                        style = this.opts.element.css('width');
                        if (style.indexOf("%") > 0) return style;

                        // finally, fallback on the calculated width of the element
                        return (this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px');
                    }

                    return null;
                } else if ($.isFunction(this.opts.width)) {
                    return this.opts.width();
                } else {
                    return this.opts.width;
               }
            };

            var width = resolveContainerWidth.call(this);
            if (width !== null) {
                this.container.css("width", width);
            }
        }
    });

    SingleSelect2 = clazz(AbstractSelect2, {

        // single

        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container"
            }).html([
                "<a href='javascript:void(0)' class='select2-choice' tabindex='-1'>",
                "   <span class='select2-chosen'>&#160;</span><abbr class='select2-search-choice-close'></abbr>",
                "   <span class='select2-arrow' role='presentation'><b role='presentation'></b></span>",
                "</a>",
                "<label for='' class='select2-offscreen'></label>",
                "<input class='select2-focusser select2-offscreen' type='text' aria-haspopup='true' role='button' />",
                "<div class='select2-drop select2-display-none'>",
                "   <div class='select2-search'>",
                "       <label for='' class='select2-offscreen'></label>",
                "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input' role='combobox' aria-expanded='true'",
                "       aria-autocomplete='list' />",
                "   </div>",
                "   <ul class='select2-results' role='listbox'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // single
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.focusser.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // single
        opening: function () {
            var el, range, len;

            if (this.opts.minimumResultsForSearch >= 0) {
                this.showSearch(true);
            }

            this.parent.opening.apply(this, arguments);

            if (this.showSearchInput !== false) {
                // IE appends focusser.val() at the end of field :/ so we manually insert it at the beginning using a range
                // all other browsers handle this just fine

                this.search.val(this.focusser.val());
            }
            if (this.opts.shouldFocusInput(this)) {
                this.search.focus();
                // move the cursor to the end after focussing, otherwise it will be at the beginning and
                // new text will appear *before* focusser.val()
                el = this.search.get(0);
                if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                } else if (el.setSelectionRange) {
                    len = this.search.val().length;
                    el.setSelectionRange(len, len);
                }
            }

            this.prefillNextSearchTerm();

            this.focusser.prop("disabled", true).val("");
            this.updateResults(true);
            this.opts.element.trigger($.Event("select2-open"));
        },

        // single
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);

            this.focusser.prop("disabled", false);

            if (this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }
        },

        // single
        focus: function () {
            if (this.opened()) {
                this.close();
            } else {
                this.focusser.prop("disabled", false);
                if (this.opts.shouldFocusInput(this)) {
                    this.focusser.focus();
                }
            }
        },

        // single
        isFocused: function () {
            return this.container.hasClass("select2-container-active");
        },

        // single
        cancel: function () {
            this.parent.cancel.apply(this, arguments);
            this.focusser.prop("disabled", false);

            if (this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }
        },

        // single
        destroy: function() {
            $("label[for='" + this.focusser.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);

            cleanupJQueryElements.call(this,
                "selection",
                "focusser"
            );
        },

        // single
        initContainer: function () {

            var selection,
                container = this.container,
                dropdown = this.dropdown,
                idSuffix = nextUid(),
                elementLabel;

            if (this.opts.minimumResultsForSearch < 0) {
                this.showSearch(false);
            } else {
                this.showSearch(true);
            }

            this.selection = selection = container.find(".select2-choice");

            this.focusser = container.find(".select2-focusser");

            // add aria associations
            selection.find(".select2-chosen").attr("id", "select2-chosen-"+idSuffix);
            this.focusser.attr("aria-labelledby", "select2-chosen-"+idSuffix);
            this.results.attr("id", "select2-results-"+idSuffix);
            this.search.attr("aria-owns", "select2-results-"+idSuffix);

            // rewrite labels from original element to focusser
            this.focusser.attr("id", "s2id_autogen"+idSuffix);

            elementLabel = $("label[for='" + this.opts.element.attr("id") + "']");
            this.opts.element.on('focus.select2', this.bind(function () { this.focus(); }));

            this.focusser.prev()
                .text(elementLabel.text())
                .attr('for', this.focusser.attr('id'));

            // Ensure the original element retains an accessible name
            var originalTitle = this.opts.element.attr("title");
            this.opts.element.attr("title", (originalTitle || elementLabel.text()));

            this.focusser.attr("tabindex", this.elementTabIndex);

            // write label for search field using the label from the focusser element
            this.search.attr("id", this.focusser.attr('id') + '_search');

            this.search.prev()
                .text($("label[for='" + this.focusser.attr('id') + "']").text())
                .attr('for', this.search.attr('id'));

            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                // filter 229 keyCodes (input method editor is processing key input)
                if (229 == e.keyCode) return;

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                    return;
                }

                switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus: true});
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                }
            }));

            this.search.on("blur", this.bind(function(e) {
                // a workaround for chrome to keep the search field focussed when the scroll bar is used to scroll the dropdown.
                // without this the search field loses focus which is annoying
                if (document.activeElement === this.body.get(0)) {
                    window.setTimeout(this.bind(function() {
                        if (this.opened() && this.results && this.results.length > 1) {
                            this.search.focus();
                        }
                    }), 0);
                }
            }));

            this.focusser.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DOWN || e.which == KEY.UP
                    || (e.which == KEY.ENTER && this.opts.openOnEnter)) {

                    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

                    this.open();
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DELETE || e.which == KEY.BACKSPACE) {
                    if (this.opts.allowClear) {
                        this.clear();
                    }
                    killEvent(e);
                    return;
                }
            }));


            installKeyUpChangeEvent(this.focusser);
            this.focusser.on("keyup-change input", this.bind(function(e) {
                if (this.opts.minimumResultsForSearch >= 0) {
                    e.stopPropagation();
                    if (this.opened()) return;
                    this.open();
                }
            }));

            selection.on("mousedown touchstart", "abbr", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) {
                    return;
                }

                this.clear();
                killEventImmediately(e);
                this.close();

                if (this.selection) {
                    this.selection.focus();
                }
            }));

            selection.on("mousedown touchstart", this.bind(function (e) {
                // Prevent IE from generating a click event on the body
                reinsertElement(selection);

                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }

                if (this.opened()) {
                    this.close();
                } else if (this.isInterfaceEnabled()) {
                    this.open();
                }

                killEvent(e);
            }));

            dropdown.on("mousedown touchstart", this.bind(function() {
                if (this.opts.shouldFocusInput(this)) {
                    this.search.focus();
                }
            }));

            selection.on("focus", this.bind(function(e) {
                killEvent(e);
            }));

            this.focusser.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            })).on("blur", this.bind(function() {
                if (!this.opened()) {
                    this.container.removeClass("select2-container-active");
                    this.opts.element.trigger($.Event("select2-blur"));
                }
            }));
            this.search.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            }));

            this.initContainerWidth();
            this.opts.element.hide();
            this.setPlaceholder();

        },

        // single
        clear: function(triggerChange) {
            var data=this.selection.data("select2-data");
            if (data) { // guard against queued quick consecutive clicks
                var evt = $.Event("select2-clearing");
                this.opts.element.trigger(evt);
                if (evt.isDefaultPrevented()) {
                    return;
                }
                var placeholderOption = this.getPlaceholderOption();
                this.opts.element.val(placeholderOption ? placeholderOption.val() : "");
                this.selection.find(".select2-chosen").empty();
                this.selection.removeData("select2-data");
                this.setPlaceholder();

                if (triggerChange !== false){
                    this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
                    this.triggerChange({removed:data});
                }
            }
        },

        /**
         * Sets selection based on source element's value
         */
        // single
        initSelection: function () {
            var selected;
            if (this.isPlaceholderOptionSelected()) {
                this.updateSelection(null);
                this.close();
                this.setPlaceholder();
            } else {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(selected){
                    if (selected !== undefined && selected !== null) {
                        self.updateSelection(selected);
                        self.close();
                        self.setPlaceholder();
                        self.lastSearchTerm = self.search.val();
                    }
                });
            }
        },

        isPlaceholderOptionSelected: function() {
            var placeholderOption;
            if (this.getPlaceholder() === undefined) return false; // no placeholder specified so no option should be considered
            return ((placeholderOption = this.getPlaceholderOption()) !== undefined && placeholderOption.prop("selected"))
                || (this.opts.element.val() === "")
                || (this.opts.element.val() === undefined)
                || (this.opts.element.val() === null);
        },

        // single
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {
                    var selected = element.find("option").filter(function() { return this.selected && !this.disabled });
                    // a single select box always has a value, no need to null check 'selected'
                    callback(self.optionToData(selected));
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var id = element.val();
                    //search in data by id, storing the actual matching item
                    var match = null;
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = equal(id, opts.id(el));
                            if (is_match) {
                                match = el;
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            callback(match);
                        }
                    });
                };
            }

            return opts;
        },

        // single
        getPlaceholder: function() {
            // if a placeholder is specified on a single select without a valid placeholder option ignore it
            if (this.select) {
                if (this.getPlaceholderOption() === undefined) {
                    return undefined;
                }
            }

            return this.parent.getPlaceholder.apply(this, arguments);
        },

        // single
        setPlaceholder: function () {
            var placeholder = this.getPlaceholder();

            if (this.isPlaceholderOptionSelected() && placeholder !== undefined) {

                // check for a placeholder option if attached to a select
                if (this.select && this.getPlaceholderOption() === undefined) return;

                this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(placeholder));

                this.selection.addClass("select2-default");

                this.container.removeClass("select2-allowclear");
            }
        },

        // single
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var selected = 0, self = this, showSearchInput = true;

            // find the selected element in the result list

            this.findHighlightableChoices().each2(function (i, elm) {
                if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
                    selected = i;
                    return false;
                }
            });

            // and highlight it
            if (noHighlightUpdate !== false) {
                if (initial === true && selected >= 0) {
                    this.highlight(selected);
                } else {
                    this.highlight(0);
                }
            }

            // hide the search box if this is the first we got the results and there are enough of them for search

            if (initial === true) {
                var min = this.opts.minimumResultsForSearch;
                if (min >= 0) {
                    this.showSearch(countResults(data.results) >= min);
                }
            }
        },

        // single
        showSearch: function(showSearchInput) {
            if (this.showSearchInput === showSearchInput) return;

            this.showSearchInput = showSearchInput;

            this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !showSearchInput);
            this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !showSearchInput);
            //add "select2-with-searchbox" to the container if search box is shown
            $(this.dropdown, this.container).toggleClass("select2-with-searchbox", showSearchInput);
        },

        // single
        onSelect: function (data, options) {

            if (!this.triggerSelect(data)) { return; }

            var old = this.opts.element.val(),
                oldData = this.data();

            this.opts.element.val(this.id(data));
            this.updateSelection(data);

            this.opts.element.trigger({ type: "select2-selected", val: this.id(data), choice: data });

            this.lastSearchTerm = this.search.val();
            this.close();

            if ((!options || !options.noFocus) && this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }

            if (!equal(old, this.id(data))) {
                this.triggerChange({ added: data, removed: oldData });
            }
        },

        // single
        updateSelection: function (data) {

            var container=this.selection.find(".select2-chosen"), formatted, cssClass;

            this.selection.data("select2-data", data);

            container.empty();
            if (data !== null) {
                formatted=this.opts.formatSelection(data, container, this.opts.escapeMarkup);
            }
            if (formatted !== undefined) {
                container.append(formatted);
            }
            cssClass=this.opts.formatSelectionCssClass(data, container);
            if (cssClass !== undefined) {
                container.addClass(cssClass);
            }

            this.selection.removeClass("select2-default");

            if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
                this.container.addClass("select2-allowclear");
            }
        },

        // single
        val: function () {
            var val,
                triggerChange = false,
                data = null,
                self = this,
                oldData = this.data();

            if (arguments.length === 0) {
                return this.opts.element.val();
            }

            val = arguments[0];

            if (arguments.length > 1) {
                triggerChange = arguments[1];

                if (this.opts.debug && console && console.warn) {
                    console.warn(
                        'Select2: The second option to `select2("val")` is not supported in Select2 4.0.0. ' +
                        'The `change` event will always be triggered in 4.0.0.'
                    );
                }
            }

            if (this.select) {
                if (this.opts.debug && console && console.warn) {
                    console.warn(
                        'Select2: Setting the value on a <select> using `select2("val")` is no longer supported in 4.0.0. ' +
                        'You can use the `.val(newValue).trigger("change")` method provided by jQuery instead.'
                    );
                }

                this.select
                    .val(val)
                    .find("option").filter(function() { return this.selected }).each2(function (i, elm) {
                        data = self.optionToData(elm);
                        return false;
                    });
                this.updateSelection(data);
                this.setPlaceholder();
                if (triggerChange) {
                    this.triggerChange({added: data, removed:oldData});
                }
            } else {
                // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
                if (!val && val !== 0) {
                    this.clear(triggerChange);
                    return;
                }
                if (this.opts.initSelection === undefined) {
                    throw new Error("cannot call val() if initSelection() is not defined");
                }
                this.opts.element.val(val);
                this.opts.initSelection(this.opts.element, function(data){
                    self.opts.element.val(!data ? "" : self.id(data));
                    self.updateSelection(data);
                    self.setPlaceholder();
                    if (triggerChange) {
                        self.triggerChange({added: data, removed:oldData});
                    }
                });
            }
        },

        // single
        clearSearch: function () {
            this.search.val("");
            this.focusser.val("");
        },

        // single
        data: function(value) {
            var data,
                triggerChange = false;

            if (arguments.length === 0) {
                data = this.selection.data("select2-data");
                if (data == undefined) data = null;
                return data;
            } else {
                if (this.opts.debug && console && console.warn) {
                    console.warn(
                        'Select2: The `select2("data")` method can no longer set selected values in 4.0.0, ' +
                        'consider using the `.val()` method instead.'
                    );
                }

                if (arguments.length > 1) {
                    triggerChange = arguments[1];
                }
                if (!value) {
                    this.clear(triggerChange);
                } else {
                    data = this.data();
                    this.opts.element.val(!value ? "" : this.id(value));
                    this.updateSelection(value);
                    if (triggerChange) {
                        this.triggerChange({added: value, removed:data});
                    }
                }
            }
        }
    });

    MultiSelect2 = clazz(AbstractSelect2, {

        // multi
        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container select2-container-multi"
            }).html([
                "<ul class='select2-choices'>",
                "  <li class='select2-search-field'>",
                "    <label for='' class='select2-offscreen'></label>",
                "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>",
                "  </li>",
                "</ul>",
                "<div class='select2-drop select2-drop-multi select2-display-none'>",
                "   <ul class='select2-results'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // multi
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            // TODO validate placeholder is a string if specified
            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {

                    var data = [];

                    element.find("option").filter(function() { return this.selected && !this.disabled }).each2(function (i, elm) {
                        data.push(self.optionToData(elm));
                    });
                    callback(data);
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var ids = splitVal(element.val(), opts.separator, opts.transformVal);
                    //search in data by array of ids, storing matching items in a list
                    var matches = [];
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = $.grep(ids, function(id) {
                                return equal(id, opts.id(el));
                            }).length;
                            if (is_match) {
                                matches.push(el);
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            // reorder matches based on the order they appear in the ids array because right now
                            // they are in the order in which they appear in data array
                            var ordered = [];
                            for (var i = 0; i < ids.length; i++) {
                                var id = ids[i];
                                for (var j = 0; j < matches.length; j++) {
                                    var match = matches[j];
                                    if (equal(id, opts.id(match))) {
                                        ordered.push(match);
                                        matches.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                            callback(ordered);
                        }
                    });
                };
            }

            return opts;
        },

        // multi
        selectChoice: function (choice) {

            var selected = this.container.find(".select2-search-choice-focus");
            if (selected.length && choice && choice[0] == selected[0]) {

            } else {
                if (selected.length) {
                    this.opts.element.trigger("choice-deselected", selected);
                }
                selected.removeClass("select2-search-choice-focus");
                if (choice && choice.length) {
                    this.close();
                    choice.addClass("select2-search-choice-focus");
                    this.opts.element.trigger("choice-selected", choice);
                }
            }
        },

        // multi
        destroy: function() {
            $("label[for='" + this.search.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);

            cleanupJQueryElements.call(this,
                "searchContainer",
                "selection"
            );
        },

        // multi
        initContainer: function () {

            var selector = ".select2-choices", selection;

            this.searchContainer = this.container.find(".select2-search-field");
            this.selection = selection = this.container.find(selector);

            var _this = this;
            this.selection.on("click", ".select2-container:not(.select2-container-disabled) .select2-search-choice:not(.select2-locked)", function (e) {
                _this.search[0].focus();
                _this.selectChoice($(this));
            });

            // rewrite labels from original element to focusser
            this.search.attr("id", "s2id_autogen"+nextUid());

            this.search.prev()
                .text($("label[for='" + this.opts.element.attr("id") + "']").text())
                .attr('for', this.search.attr('id'));
            this.opts.element.on('focus.select2', this.bind(function () { this.focus(); }));

            this.search.on("input paste", this.bind(function() {
                if (this.search.attr('placeholder') && this.search.val().length == 0) return;
                if (!this.isInterfaceEnabled()) return;
                if (!this.opened()) {
                    this.open();
                }
            }));

            this.search.attr("tabindex", this.elementTabIndex);

            this.keydowns = 0;
            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                ++this.keydowns;
                var selected = selection.find(".select2-search-choice-focus");
                var prev = selected.prev(".select2-search-choice:not(.select2-locked)");
                var next = selected.next(".select2-search-choice:not(.select2-locked)");
                var pos = getCursorInfo(this.search);

                if (selected.length &&
                    (e.which == KEY.LEFT || e.which == KEY.RIGHT || e.which == KEY.BACKSPACE || e.which == KEY.DELETE || e.which == KEY.ENTER)) {
                    var selectedChoice = selected;
                    if (e.which == KEY.LEFT && prev.length) {
                        selectedChoice = prev;
                    }
                    else if (e.which == KEY.RIGHT) {
                        selectedChoice = next.length ? next : null;
                    }
                    else if (e.which === KEY.BACKSPACE) {
                        if (this.unselect(selected.first())) {
                            this.search.width(10);
                            selectedChoice = prev.length ? prev : next;
                        }
                    } else if (e.which == KEY.DELETE) {
                        if (this.unselect(selected.first())) {
                            this.search.width(10);
                            selectedChoice = next.length ? next : null;
                        }
                    } else if (e.which == KEY.ENTER) {
                        selectedChoice = null;
                    }

                    this.selectChoice(selectedChoice);
                    killEvent(e);
                    if (!selectedChoice || !selectedChoice.length) {
                        this.open();
                    }
                    return;
                } else if (((e.which === KEY.BACKSPACE && this.keydowns == 1)
                    || e.which == KEY.LEFT) && (pos.offset == 0 && !pos.length)) {

                    this.selectChoice(selection.find(".select2-search-choice:not(.select2-locked)").last());
                    killEvent(e);
                    return;
                } else {
                    this.selectChoice(null);
                }

                if (this.opened()) {
                    switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus:true});
                        this.close();
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                    }
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
                    return;
                }

                if (e.which === KEY.ENTER) {
                    if (this.opts.openOnEnter === false) {
                        return;
                    } else if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
                        return;
                    }
                }

                this.open();

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                }

                if (e.which === KEY.ENTER) {
                    // prevent form from being submitted
                    killEvent(e);
                }

            }));

            this.search.on("keyup", this.bind(function (e) {
                this.keydowns = 0;
                this.resizeSearch();
            })
            );

            this.search.on("blur", this.bind(function(e) {
                this.container.removeClass("select2-container-active");
                this.search.removeClass("select2-focused");
                this.selectChoice(null);
                if (!this.opened()) this.clearSearch();
                e.stopImmediatePropagation();
                this.opts.element.trigger($.Event("select2-blur"));
            }));

            this.container.on("click", selector, this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                if ($(e.target).closest(".select2-search-choice").length > 0) {
                    // clicked inside a select2 search choice, do not open
                    return;
                }
                this.selectChoice(null);
                this.clearPlaceholder();
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.open();
                this.focusSearch();
                e.preventDefault();
            }));

            this.container.on("focus", selector, this.bind(function () {
                if (!this.isInterfaceEnabled()) return;
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
                this.clearPlaceholder();
            }));

            this.initContainerWidth();
            this.opts.element.hide();

            // set the placeholder if necessary
            this.clearSearch();
        },

        // multi
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.search.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // multi
        initSelection: function () {
            var data;
            if (this.opts.element.val() === "" && this.opts.element.text() === "") {
                this.updateSelection([]);
                this.close();
                // set the placeholder if necessary
                this.clearSearch();
            }
            if (this.select || this.opts.element.val() !== "") {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(data){
                    if (data !== undefined && data !== null) {
                        self.updateSelection(data);
                        self.close();
                        // set the placeholder if necessary
                        self.clearSearch();
                    }
                });
            }
        },

        // multi
        clearSearch: function () {
            var placeholder = this.getPlaceholder(),
                maxWidth = this.getMaxSearchWidth();

            if (placeholder !== undefined  && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
                this.search.val(placeholder).addClass("select2-default");
                // stretch the search box to full width of the container so as much of the placeholder is visible as possible
                // we could call this.resizeSearch(), but we do not because that requires a sizer and we do not want to create one so early because of a firefox bug, see #944
                this.search.width(maxWidth > 0 ? maxWidth : this.container.css("width"));
            } else {
                this.search.val("").width(10);
            }
        },

        // multi
        clearPlaceholder: function () {
            if (this.search.hasClass("select2-default")) {
                this.search.val("").removeClass("select2-default");
            }
        },

        // multi
        opening: function () {
            this.clearPlaceholder(); // should be done before super so placeholder is not used to search
            this.resizeSearch();

            this.parent.opening.apply(this, arguments);

            this.focusSearch();

            this.prefillNextSearchTerm();
            this.updateResults(true);

            if (this.opts.shouldFocusInput(this)) {
                this.search.focus();
            }
            this.opts.element.trigger($.Event("select2-open"));
        },

        // multi
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);
        },

        // multi
        focus: function () {
            this.close();
            this.search.focus();
        },

        // multi
        isFocused: function () {
            return this.search.hasClass("select2-focused");
        },

        // multi
        updateSelection: function (data) {
            var ids = {}, filtered = [], self = this;

            // filter out duplicates
            $(data).each(function () {
                if (!(self.id(this) in ids)) {
                    ids[self.id(this)] = 0;
                    filtered.push(this);
                }
            });

            this.selection.find(".select2-search-choice").remove();
            this.addSelectedChoice(filtered);
            self.postprocessResults();
        },

        // multi
        tokenize: function() {
            var input = this.search.val();
            input = this.opts.tokenizer.call(this, input, this.data(), this.bind(this.onSelect), this.opts);
            if (input != null && input != undefined) {
                this.search.val(input);
                if (input.length > 0) {
                    this.open();
                }
            }

        },

        // multi
        onSelect: function (data, options) {

            if (!this.triggerSelect(data) || data.text === "") { return; }

            this.addSelectedChoice(data);

            this.opts.element.trigger({ type: "selected", val: this.id(data), choice: data });

            // keep track of the search's value before it gets cleared
            this.lastSearchTerm = this.search.val();

            this.clearSearch();
            this.updateResults();

            if (this.select || !this.opts.closeOnSelect) this.postprocessResults(data, false, this.opts.closeOnSelect===true);

            if (this.opts.closeOnSelect) {
                this.close();
                this.search.width(10);
            } else {
                if (this.countSelectableResults()>0) {
                    this.search.width(10);
                    this.resizeSearch();
                    if (this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize()) {
                        // if we reached max selection size repaint the results so choices
                        // are replaced with the max selection reached message
                        this.updateResults(true);
                    } else {
                        // initializes search's value with nextSearchTerm and update search result
                        if (this.prefillNextSearchTerm()) {
                            this.updateResults();
                        }
                    }
                    this.positionDropdown();
                } else {
                    // if nothing left to select close
                    this.close();
                    this.search.width(10);
                }
            }

            // since its not possible to select an element that has already been
            // added we do not need to check if this is a new element before firing change
            this.triggerChange({ added: data });

            if (!options || !options.noFocus)
                this.focusSearch();
        },

        // multi
        cancel: function () {
            this.close();
            this.focusSearch();
        },

        addSelectedChoice: function (data) {
            var val = this.getVal(), self = this;
            $(data).each(function () {
                val.push(self.createChoice(this));
            });
            this.setVal(val);
        },

        createChoice: function (data) {
            var enableChoice = !data.locked,
                enabledItem = $(
                    "<li class='select2-search-choice'>" +
                    "    <div></div>" +
                    "    <a href='#' class='select2-search-choice-close' tabindex='-1'></a>" +
                    "</li>"),
                disabledItem = $(
                    "<li class='select2-search-choice select2-locked'>" +
                    "<div></div>" +
                    "</li>");
            var choice = enableChoice ? enabledItem : disabledItem,
                id = this.id(data),
                formatted,
                cssClass;

            formatted=this.opts.formatSelection(data, choice.find("div"), this.opts.escapeMarkup);
            if (formatted != undefined) {
                choice.find("div").replaceWith($("<div></div>").html(formatted));
            }
            cssClass=this.opts.formatSelectionCssClass(data, choice.find("div"));
            if (cssClass != undefined) {
                choice.addClass(cssClass);
            }

            if(enableChoice){
              choice.find(".select2-search-choice-close")
                  .on("mousedown", killEvent)
                  .on("click dblclick", this.bind(function (e) {
                  if (!this.isInterfaceEnabled()) return;

                  this.unselect($(e.target));
                  this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                  killEvent(e);
                  this.close();
                  this.focusSearch();
              })).on("focus", this.bind(function () {
                  if (!this.isInterfaceEnabled()) return;
                  this.container.addClass("select2-container-active");
                  this.dropdown.addClass("select2-drop-active");
              }));
            }

            choice.data("select2-data", data);
            choice.insertBefore(this.searchContainer);

            return id;
        },

        // multi
        unselect: function (selected) {
            var val = this.getVal(),
                data,
                index;
            selected = selected.closest(".select2-search-choice");

            if (selected.length === 0) {
                throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
            }

            data = selected.data("select2-data");

            if (!data) {
                // prevent a race condition when the 'x' is clicked really fast repeatedly the event can be queued
                // and invoked on an element already removed
                return;
            }

            var evt = $.Event("select2-removing");
            evt.val = this.id(data);
            evt.choice = data;
            this.opts.element.trigger(evt);

            if (evt.isDefaultPrevented()) {
                return false;
            }

            while((index = indexOf(this.id(data), val)) >= 0) {
                val.splice(index, 1);
                this.setVal(val);
                if (this.select) this.postprocessResults();
            }

            selected.remove();

            this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
            this.triggerChange({ removed: data });

            return true;
        },

        // multi
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var val = this.getVal(),
                choices = this.results.find(".select2-result"),
                compound = this.results.find(".select2-result-with-children"),
                self = this;

            choices.each2(function (i, choice) {
                var id = self.id(choice.data("select2-data"));
                if (indexOf(id, val) >= 0) {
                    choice.addClass("select2-selected");
                    // mark all children of the selected parent as selected
                    choice.find(".select2-result-selectable").addClass("select2-selected");
                }
            });

            compound.each2(function(i, choice) {
                // hide an optgroup if it doesn't have any selectable children
                if (!choice.is('.select2-result-selectable')
                    && choice.find(".select2-result-selectable:not(.select2-selected)").length === 0) {
                    choice.addClass("select2-selected");
                }
            });

            if (this.highlight() == -1 && noHighlightUpdate !== false && this.opts.closeOnSelect === true){
                self.highlight(0);
            }

            //If all results are chosen render formatNoMatches
            if(!this.opts.createSearchChoice && !choices.filter('.select2-result:not(.select2-selected)').length > 0){
                if(!data || data && !data.more && this.results.find(".select2-no-results").length === 0) {
                    if (checkFormatter(self.opts.formatNoMatches, "formatNoMatches")) {
                        this.results.append("<li class='select2-no-results'>" + evaluate(self.opts.formatNoMatches, self.opts.element, self.search.val()) + "</li>");
                    }
                }
            }

        },

        // multi
        getMaxSearchWidth: function() {
            return this.selection.width() - getSideBorderPadding(this.search);
        },

        // multi
        resizeSearch: function () {
            var minimumWidth, left, maxWidth, containerLeft, searchWidth,
                sideBorderPadding = getSideBorderPadding(this.search);

            minimumWidth = measureTextWidth(this.search) + 10;

            left = this.search.offset().left;

            maxWidth = this.selection.width();
            containerLeft = this.selection.offset().left;

            searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;

            if (searchWidth < minimumWidth) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth < 40) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth <= 0) {
              searchWidth = minimumWidth;
            }

            this.search.width(Math.floor(searchWidth));
        },

        // multi
        getVal: function () {
            var val;
            if (this.select) {
                val = this.select.val();
                return val === null ? [] : val;
            } else {
                val = this.opts.element.val();
                return splitVal(val, this.opts.separator, this.opts.transformVal);
            }
        },

        // multi
        setVal: function (val) {
            if (this.select) {
                this.select.val(val);
            } else {
                var unique = [], valMap = {};
                // filter out duplicates
                $(val).each(function () {
                    if (!(this in valMap)) {
                        unique.push(this);
                        valMap[this] = 0;
                    }
                });
                this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
            }
        },

        // multi
        buildChangeDetails: function (old, current) {
            var current = current.slice(0),
                old = old.slice(0);

            // remove intersection from each array
            for (var i = 0; i < current.length; i++) {
                for (var j = 0; j < old.length; j++) {
                    if (equal(this.opts.id(current[i]), this.opts.id(old[j]))) {
                        current.splice(i, 1);
                        i--;
                        old.splice(j, 1);
                        break;
                    }
                }
            }

            return {added: current, removed: old};
        },


        // multi
        val: function (val, triggerChange) {
            var oldData, self=this;

            if (arguments.length === 0) {
                return this.getVal();
            }

            oldData=this.data();
            if (!oldData.length) oldData=[];

            // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
            if (!val && val !== 0) {
                this.opts.element.val("");
                this.updateSelection([]);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange({added: this.data(), removed: oldData});
                }
                return;
            }

            // val is a list of ids
            this.setVal(val);

            if (this.select) {
                this.opts.initSelection(this.select, this.bind(this.updateSelection));
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(oldData, this.data()));
                }
            } else {
                if (this.opts.initSelection === undefined) {
                    throw new Error("val() cannot be called if initSelection() is not defined");
                }

                this.opts.initSelection(this.opts.element, function(data){
                    var ids=$.map(data, self.id);
                    self.setVal(ids);
                    self.updateSelection(data);
                    self.clearSearch();
                    if (triggerChange) {
                        self.triggerChange(self.buildChangeDetails(oldData, self.data()));
                    }
                });
            }
            this.clearSearch();
        },

        // multi
        onSortStart: function() {
            if (this.select) {
                throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
            }

            // collapse search field into 0 width so its container can be collapsed as well
            this.search.width(0);
            // hide the container
            this.searchContainer.hide();
        },

        // multi
        onSortEnd:function() {

            var val=[], self=this;

            // show search and move it to the end of the list
            this.searchContainer.show();
            // make sure the search container is the last item in the list
            this.searchContainer.appendTo(this.searchContainer.parent());
            // since we collapsed the width in dragStarted, we resize it here
            this.resizeSearch();

            // update selection
            this.selection.find(".select2-search-choice").each(function() {
                val.push(self.opts.id($(this).data("select2-data")));
            });
            this.setVal(val);
            this.triggerChange();
        },

        // multi
        data: function(values, triggerChange) {
            var self=this, ids, old;
            if (arguments.length === 0) {
                 return this.selection
                     .children(".select2-search-choice")
                     .map(function() { return $(this).data("select2-data"); })
                     .get();
            } else {
                old = this.data();
                if (!values) { values = []; }
                ids = $.map(values, function(e) { return self.opts.id(e); });
                this.setVal(ids);
                this.updateSelection(values);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(old, this.data()));
                }
            }
        }
    });

    $.fn.select2 = function () {

        var args = Array.prototype.slice.call(arguments, 0),
            opts,
            select2,
            method, value, multiple,
            allowedMethods = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "dropdown", "onSortStart", "onSortEnd", "enable", "disable", "readonly", "positionDropdown", "data", "search"],
            valueMethods = ["opened", "isFocused", "container", "dropdown"],
            propertyMethods = ["val", "data"],
            methodsMap = { search: "externalSearch" };

        this.each(function () {
            if (args.length === 0 || typeof(args[0]) === "object") {
                opts = args.length === 0 ? {} : $.extend({}, args[0]);
                opts.element = $(this);

                if (opts.element.get(0).tagName.toLowerCase() === "select") {
                    multiple = opts.element.prop("multiple");
                } else {
                    multiple = opts.multiple || false;
                    if ("tags" in opts) {opts.multiple = multiple = true;}
                }

                select2 = multiple ? new window.Select2["class"].multi() : new window.Select2["class"].single();
                select2.init(opts);
            } else if (typeof(args[0]) === "string") {

                if (indexOf(args[0], allowedMethods) < 0) {
                    throw "Unknown method: " + args[0];
                }

                value = undefined;
                select2 = $(this).data("select2");
                if (select2 === undefined) return;

                method=args[0];

                if (method === "container") {
                    value = select2.container;
                } else if (method === "dropdown") {
                    value = select2.dropdown;
                } else {
                    if (methodsMap[method]) method = methodsMap[method];

                    value = select2[method].apply(select2, args.slice(1));
                }
                if (indexOf(args[0], valueMethods) >= 0
                    || (indexOf(args[0], propertyMethods) >= 0 && args.length == 1)) {
                    return false; // abort the iteration, ready to return first matched value
                }
            } else {
                throw "Invalid arguments to select2 plugin: " + args;
            }
        });
        return (value === undefined) ? this : value;
    };

    // plugin defaults, accessible to users
    $.fn.select2.defaults = {
        debug: false,
        width: "copy",
        loadMorePadding: 0,
        closeOnSelect: true,
        openOnEnter: true,
        containerCss: {},
        dropdownCss: {},
        containerCssClass: "",
        dropdownCssClass: "",
        formatResult: function(result, container, query, escapeMarkup) {
            var markup=[];
            markMatch(this.text(result), query.term, markup, escapeMarkup);
            return markup.join("");
        },
        transformVal: function(val) {
            return $.trim(val);
        },
        formatSelection: function (data, container, escapeMarkup) {
            return data ? escapeMarkup(this.text(data)) : undefined;
        },
        sortResults: function (results, container, query) {
            return results;
        },
        formatResultCssClass: function(data) {return data.css;},
        formatSelectionCssClass: function(data, container) {return undefined;},
        minimumResultsForSearch: 0,
        minimumInputLength: 0,
        maximumInputLength: null,
        maximumSelectionSize: 0,
        id: function (e) { return e == undefined ? null : e.id; },
        text: function (e) {
          if (e && this.data && this.data.text) {
            if ($.isFunction(this.data.text)) {
              return this.data.text(e);
            } else {
              return e[this.data.text];
            }
          } else {
            return e.text;
          }
        },
        matcher: function(term, text) {
            return stripDiacritics(''+text).toUpperCase().indexOf(stripDiacritics(''+term).toUpperCase()) >= 0;
        },
        separator: ",",
        tokenSeparators: [],
        tokenizer: defaultTokenizer,
        escapeMarkup: defaultEscapeMarkup,
        blurOnChange: false,
        selectOnBlur: false,
        adaptContainerCssClass: function(c) { return c; },
        adaptDropdownCssClass: function(c) { return null; },
        nextSearchTerm: function(selectedObject, currentSearchTerm) { return undefined; },
        searchInputPlaceholder: '',
        createSearchChoicePosition: 'top',
        shouldFocusInput: function (instance) {
            // Attempt to detect touch devices
            var supportsTouchEvents = (('ontouchstart' in window) ||
                                       (navigator.msMaxTouchPoints > 0));

            // Only devices which support touch events should be special cased
            if (!supportsTouchEvents) {
                return true;
            }

            // Never focus the input if search is disabled
            if (instance.opts.minimumResultsForSearch < 0) {
                return false;
            }

            return true;
        }
    };

    $.fn.select2.locales = [];

    $.fn.select2.locales['en'] = {
         formatMatches: function (matches) { if (matches === 1) { return "One result is available, press enter to select it."; } return matches + " results are available, use up and down arrow keys to navigate."; },
         formatNoMatches: function () { return "No matches found"; },
         formatAjaxError: function (jqXHR, textStatus, errorThrown) { return "Loading failed"; },
         formatInputTooShort: function (input, min) { var n = min - input.length; return "Please enter " + n + " or more character" + (n == 1 ? "" : "s"); },
         formatInputTooLong: function (input, max) { var n = input.length - max; return "Please delete " + n + " character" + (n == 1 ? "" : "s"); },
         formatSelectionTooBig: function (limit) { return "You can only select " + limit + " item" + (limit == 1 ? "" : "s"); },
         formatLoadMore: function (pageNumber) { return "Loading more results…"; },
         formatSearching: function () { return "Searching…"; }
    };

    $.extend($.fn.select2.defaults, $.fn.select2.locales['en']);

    $.fn.select2.ajaxDefaults = {
        transport: $.ajax,
        params: {
            type: "GET",
            cache: false,
            dataType: "json"
        }
    };

    // exports
    window.Select2 = {
        query: {
            ajax: ajax,
            local: local,
            tags: tags
        }, util: {
            debounce: debounce,
            markMatch: markMatch,
            escapeMarkup: defaultEscapeMarkup,
            stripDiacritics: stripDiacritics
        }, "class": {
            "abstract": AbstractSelect2,
            "single": SingleSelect2,
            "multi": MultiSelect2
        }
    };

}(jQuery));
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof self !== "undefined") {
        self.Q = definition();

    } else {
        throw new Error("This environment was not anticiapted by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});
(function() {
  this.CurrencyConverter = (function() {
    function CurrencyConverter(value, options) {
      this.value = value;
      if (options == null) {
        options = {};
      }
      if (typeof options.precision === 'undefined') {
        this.precision = 2;
      } else {
        this.precision = options.precision;
      }
      this.unit = options.unit != null ? options.unit : '$';
      this.suffix = options.suffix != null ? options.suffix : '';
    }

    CurrencyConverter.prototype.commaSeparated = function() {
      return this.absoluteToFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    CurrencyConverter.prototype.absoluteToFixed = function() {
      return (Math.abs(this.value)).toFixed(this.precision);
    };

    CurrencyConverter.prototype.toString = function() {
      return "" + (this._negativeSign()) + this.unit + (this.commaSeparated()) + this.suffix;
    };

    CurrencyConverter.prototype._negativeSign = function() {
      if (this.value < 0) {
        return "-";
      } else {
        return "";
      }
    };

    return CurrencyConverter;

  })();

}).call(this);
(function() {
  this.AbstractRecurlyCoupon = (function() {
    function AbstractRecurlyCoupon(coupon, price) {
      this.coupon = coupon;
      this.price = price;
      this.currencySymbol = this.price.currency.symbol;
    }

    AbstractRecurlyCoupon.prototype.getAmountValue = function() {
      return this.coupon.value / 100.00;
    };

    AbstractRecurlyCoupon.prototype.toString = function() {
      return "discount";
    };

    AbstractRecurlyCoupon.prototype.valueAppliedToSubtotal = function() {
      return this.price.now.subtotal - this.getAmountValue();
    };

    return AbstractRecurlyCoupon;

  })();

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.RecurlyAmountCoupon = (function(_super) {
    __extends(RecurlyAmountCoupon, _super);

    function RecurlyAmountCoupon() {
      return RecurlyAmountCoupon.__super__.constructor.apply(this, arguments);
    }

    return RecurlyAmountCoupon;

  })(AbstractRecurlyCoupon);

}).call(this);
(function() {
  this.RecurlyCouponFactory = (function() {
    function RecurlyCouponFactory(coupon, price) {
      this.coupon = coupon;
      this.price = price;
      this.type = this.coupon.coupon_type;
    }

    RecurlyCouponFactory.prototype.constructCoupon = function() {
      if (this.type === "percent") {
        return new RecurlyPercentCoupon(this.coupon, this.price);
      } else if (this.type) {
        return new RecurlyAmountCoupon(this.coupon, this.price);
      } else {
        return new RecurlyNullCoupon;
      }
    };

    return RecurlyCouponFactory;

  })();

}).call(this);
(function() {
  this.RecurlyMonthlyPrice = (function() {
    function RecurlyMonthlyPrice(currentPrice, humanResources, nonHumanresources) {
      this.currentPrice = currentPrice;
      this.humanResources = humanResources;
      this.nonHumanresources = nonHumanresources;
      this.pricePerHumanResource = this.currentPricePerHumanResource();
      this.pricePerNonHumanResource = this.currentPricePerNonHumanResource();
      this.total = this.currentTotal();
      this.humanResourceTotal = this.totalHumanResourcePrice();
      this.nonHumanResourceTotal = this.totalNonHumanResourcePrice();
      this.currencySymbol = this.currentPrice.currency.symbol;
      this.totalForYear = this.totalPriceForYear();
    }

    RecurlyMonthlyPrice.prototype.currentPricePerHumanResource = function() {
      return +this.currentPrice.addons["human"];
    };

    RecurlyMonthlyPrice.prototype.currentPricePerNonHumanResource = function() {
      return +this.currentPrice.addons["non_human"];
    };

    RecurlyMonthlyPrice.prototype.currentTotal = function() {
      return this.currentPrice.now.subtotal;
    };

    RecurlyMonthlyPrice.prototype.totalHumanResourcePrice = function() {
      return this.currentPricePerHumanResource() * this.humanResources;
    };

    RecurlyMonthlyPrice.prototype.totalNonHumanResourcePrice = function() {
      return this.currentPricePerNonHumanResource() * this.nonHumanresources;
    };

    RecurlyMonthlyPrice.prototype.totalPriceForYear = function() {
      return this.total * 12;
    };

    RecurlyMonthlyPrice.prototype.subscriptionNowTotal = function() {
      return this.currentPrice.now.total;
    };

    RecurlyMonthlyPrice.prototype.subscriptionNowTax = function() {
      return this.currentPrice.now.tax;
    };

    RecurlyMonthlyPrice.prototype.subscriptionNowSubtotal = function() {
      return this.currentPrice.now.subtotal;
    };

    RecurlyMonthlyPrice.prototype.subscriptionNextTotal = function() {
      return this.currentPrice.next.total;
    };

    RecurlyMonthlyPrice.prototype.currentTotalPerMonth = function() {
      return this.subscriptionNowTotal();
    };

    RecurlyMonthlyPrice.prototype.currentTaxRate = function() {
      var tax, taxes;
      taxes = _.map(this.currentPrice.taxes, (function(_this) {
        return function(tax) {
          return (tax.rate * 100).toString() + '%';
        };
      })(this));
      tax = taxes[0];
      if (!tax) {
        tax = "0%";
      }
      return tax;
    };

    RecurlyMonthlyPrice.prototype.currentTaxRateToF = function() {
      return this.currentTaxRate().split("%")[0] / 100.0;
    };

    return RecurlyMonthlyPrice;

  })();

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.RecurlyNullCoupon = (function(_super) {
    __extends(RecurlyNullCoupon, _super);

    function RecurlyNullCoupon() {}

    RecurlyNullCoupon.prototype.getAmountValue = function() {
      return 0;
    };

    RecurlyNullCoupon.prototype.toString = function() {
      return "";
    };

    return RecurlyNullCoupon;

  })(AbstractRecurlyCoupon);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.RecurlyPercentCoupon = (function(_super) {
    __extends(RecurlyPercentCoupon, _super);

    function RecurlyPercentCoupon(coupon, price) {
      this.coupon = coupon;
      this.price = price;
      this.rate = this.coupon.value / 100.00;
      this.currencySymbol = this.price.currency.symbol;
    }

    RecurlyPercentCoupon.prototype.getAmountValue = function() {
      return this.rate * this.price.now.subtotal;
    };

    RecurlyPercentCoupon.prototype.toString = function() {
      return "(" + this.coupon.value + "%) discount";
    };

    RecurlyPercentCoupon.prototype.valueAppliedToSubtotal = function() {
      return this.price.now.subtotal * (1 - this.rate);
    };

    RecurlyPercentCoupon.prototype._discountPercent = function() {
      return (this.rate * 100).toFixed(0);
    };

    return RecurlyPercentCoupon;

  })(AbstractRecurlyCoupon);

}).call(this);
(function() {
  this.RecurlyPricingPlan = (function() {
    function RecurlyPricingPlan(planCode, humanResources, nonHumanResources, country, vatNumber) {
      this.planCode = planCode;
      this.humanResources = humanResources;
      this.nonHumanResources = nonHumanResources;
      this.country = country != null ? country : null;
      this.vatNumber = vatNumber != null ? vatNumber : null;
      this.monthlyPricingPromise = this.createPricingPromise("_monthly");
      this.annualPricingPromise = this.createPricingPromise("_annual");
      this.rawPricingPromise = this.createPricingPromise(this.getPaymentPeriod());
    }

    RecurlyPricingPlan.prototype.createPricingPromise = function(paymentPeriod, composer) {
      if (composer == null) {
        composer = function() {};
      }
      return Q.Promise((function(_this) {
        return function(resolve, reject, notify) {
          var pricingPromise;
          pricingPromise = recurly.Pricing();
          pricingPromise = pricingPromise.plan(_this.getPlanType() + paymentPeriod, {
            quantity: 0
          }).currency("USD").addon("human", {
            quantity: _this.humanResources
          }).addon("non_human", {
            quantity: _this.nonHumanResources
          }).address({
            country: _this.country
          }).tax({
            tax_code: 'digital',
            vat_number: _this.vatNumber
          });
          composer(pricingPromise);
          pricingPromise.done(function() {
            return resolve.apply(_this, arguments);
          });
          return pricingPromise["catch"](function() {
            return reject.apply(_this, arguments);
          });
        };
      })(this));
    };

    RecurlyPricingPlan.prototype.getPaymentPeriod = function() {
      return "_" + this.planCode.split("_")[1];
    };

    RecurlyPricingPlan.prototype.getPlanType = function() {
      return this.planCode.split("_")[0];
    };

    RecurlyPricingPlan.prototype.bindCatch = function(callback) {
      this.monthlyPricingPromise["catch"]((function(_this) {
        return function() {
          return callback();
        };
      })(this));
      this.annualPricingPromise["catch"]((function(_this) {
        return function() {
          return callback();
        };
      })(this));
      return this.rawPricingPromise["catch"]((function(_this) {
        return function() {
          return callback();
        };
      })(this));
    };

    return RecurlyPricingPlan;

  })();

}).call(this);
(function() {
  this.AbstractCreditCardView = (function() {
    function AbstractCreditCardView() {}

    AbstractCreditCardView.prototype._getErrorFields = function() {
      return {
        first_name: 'your first name',
        last_name: 'your last name',
        number: 'your credit card number',
        month: 'your credit card expiry month (MM)',
        year: 'your credit card expiry year (YY)',
        cvv: 'the card security number - 3 digits on the back for Visa/Mastercard/Discover cards or 4 digits on the front for American Express',
        address1: 'the first line of your address',
        city: 'your city',
        country: 'your country',
        postal_code: 'your ZIP/Postcode',
        state: 'your state',
        vat_number: 'a valid VAT number'
      };
    };

    AbstractCreditCardView.prototype._getEuCountries = function() {
      return ['AT', 'BE', 'BG', 'CY', 'CZ', 'DK', 'EE', 'ES', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'HR'];
    };

    AbstractCreditCardView.prototype.displayError = function(field) {
      if (field === "month" || field === "year") {
        return $(".js-expiry-error").show();
      } else if (field === "cvv") {
        return $(".js-cc-expiry-errors").show();
      } else if (field === "country") {
        return $("select[data-recurly='" + field + "']").addClass("rg-error").after("<span class='" + field + " rg-error'>Please enter " + this.errorFields[field] + "</span>");
      } else {
        return $("input[data-recurly='" + field + "']").addClass("rg-error").after("<span class='" + field + " rg-error'>Please enter " + this.errorFields[field] + "</span>");
      }
    };

    return AbstractCreditCardView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.ActiveBillingHeaderView = (function() {
    function ActiveBillingHeaderView(accountStats, amountElement, detailsElement, humanResourcesElement, nonHumanResourcesElement) {
      this.accountStats = accountStats;
      this.amountElement = amountElement;
      this.detailsElement = detailsElement;
      this.humanResourcesElement = humanResourcesElement;
      this.nonHumanResourcesElement = nonHumanResourcesElement;
      this._nextPaymentOnAccountWithCreditBalance = __bind(this._nextPaymentOnAccountWithCreditBalance, this);
      this.recurlyPricingPlan = new RecurlyPricingPlan(this.accountStats.planCode, this.accountStats.humans, this.accountStats.nonHumans, this.accountStats.country, this.accountStats.vatNumber);
      this.promise = this.recurlyPricingPlan.createPricingPromise(this.recurlyPricingPlan.getPaymentPeriod(), function(promise) {
        return promise.address({
          country: this.accountStats.country
        });
      });
    }

    ActiveBillingHeaderView.prototype.render = function() {
      this.displayNumberOfResources();
      return this.displayNextPayment();
    };

    ActiveBillingHeaderView.prototype.displayNextPayment = function() {
      return this.promise.done((function(_this) {
        return function(price) {
          var converter, coupon, currencySymbol, nextAmount;
          currencySymbol = price.currency.symbol;
          coupon = new RecurlyCouponFactory(_this.accountStats.couponDiscount, price).constructCoupon();
          nextAmount = Math.max(0, _this._calculateNextPayment(price, coupon));
          converter = new CurrencyConverter(nextAmount, {
            unit: currencySymbol
          });
          if (_this.accountStats.suspended) {
            $(_this.amountElement).text("" + (converter.toString()) + " overdue");
          } else {
            $(_this.amountElement).text("" + (converter.toString()) + " on " + _this.accountStats.paymentDate);
          }
          return $(_this.detailsElement).text(_this.detailsElementText(currencySymbol, price, coupon));
        };
      })(this));
    };

    ActiveBillingHeaderView.prototype._calculateNextPayment = function(price, coupon) {
      if (this.accountStats.currentRecurlyBalance < 0) {
        return this._nextPaymentOnAccountWithCreditBalance(price, coupon);
      } else {
        return this.totalAmount(price, coupon) + +this.accountStats.pendingCharges + +this.accountStats.pastDueAmount;
      }
    };

    ActiveBillingHeaderView.prototype._nextPaymentOnAccountWithCreditBalance = function(price, coupon) {
      var subtotal, total;
      subtotal = this.subTotal(price, coupon) + +this.accountStats.currentRecurlyBalance;
      total = +subtotal + +(+subtotal * this.taxRate(price));
      return +(+total + +this.accountStats.pendingCharges + +this.accountStats.pastDueAmount);
    };

    ActiveBillingHeaderView.prototype.discountCouponText = function(coupon) {
      var deductions;
      deductions = [];
      if (coupon.getAmountValue() > 0) {
        deductions.push(this._addDiscountText(coupon));
      }
      if (this.accountStats.currentRecurlyBalance < 0) {
        deductions.push("credit");
      }
      if (deductions.length === 0) {
        return "";
      } else {
        return " " + deductions.join("/");
      }
    };

    ActiveBillingHeaderView.prototype._addDiscountText = function(coupon) {
      if (this.accountStats.currentRecurlyBalance === 0) {
        return coupon.toString();
      } else {
        return "discount";
      }
    };

    ActiveBillingHeaderView.prototype.taxRate = function(price) {
      var tax;
      tax = price.taxes[0];
      if (tax) {
        return +tax.rate;
      } else {
        return 0;
      }
    };

    ActiveBillingHeaderView.prototype.addonTotal = function(price) {
      return +price.now.addons;
    };

    ActiveBillingHeaderView.prototype.discountTotal = function(coupon) {
      return coupon.getAmountValue();
    };

    ActiveBillingHeaderView.prototype.subTotal = function(price, coupon) {
      return +(this.addonTotal(price) - this.discountTotal(coupon));
    };

    ActiveBillingHeaderView.prototype.taxTotal = function(price, coupon) {
      return +(this.subTotal(price, coupon) * this.taxRate(price));
    };

    ActiveBillingHeaderView.prototype.totalAmount = function(price, coupon) {
      return +(this.subTotal(price, coupon) + this.taxTotal(price, coupon));
    };

    ActiveBillingHeaderView.prototype.detailsElementText = function(symbol, price, coupon) {
      var addonConverter, lessAmountConverter;
      addonConverter = new CurrencyConverter(this.preLessAmount(price, coupon), {
        unit: symbol
      });
      lessAmountConverter = new CurrencyConverter(this.lessAmount(coupon, price), {
        unit: symbol
      });
      if (this.lessAmount(coupon, price) !== 0) {
        return "(" + (addonConverter.toString()) + " - " + (lessAmountConverter.toString()) + (this.discountCouponText(coupon)) + (this.vatText(price)) + (this.otherCostsText()) + ")";
      }
    };

    ActiveBillingHeaderView.prototype.preLessAmount = function(price, coupon) {
      return this.addonTotal(price, coupon);
    };

    ActiveBillingHeaderView.prototype.otherCostsText = function() {
      var text;
      text = "";
      if (+this.accountStats.pendingCharges > 0) {
        text += " + pending charges";
      }
      if (+this.accountStats.pastDueAmount > 0) {
        text += " + past due invoices";
      }
      return text;
    };

    ActiveBillingHeaderView.prototype.lessAmount = function(coupon, price) {
      if (this.accountStats.currentRecurlyBalance < 0) {
        return this.discountTotal(coupon) + Math.abs(this.accountStats.currentRecurlyBalance);
      } else {
        return this.discountTotal(coupon);
      }
    };

    ActiveBillingHeaderView.prototype.vatText = function(price) {
      if (this.taxRate(price) > 0) {
        return " + VAT";
      } else {
        return "";
      }
    };

    ActiveBillingHeaderView.prototype.displayNumberOfResources = function() {
      $(this.humanResourcesElement).text(this.pluralizePeople());
      return $(this.nonHumanResourcesElement).text(this.pluralizeNonHumanResources());
    };

    ActiveBillingHeaderView.prototype.pluralizePeople = function() {
      if (this.accountStats.humans !== 1) {
        return "" + this.accountStats.humans + " people";
      } else {
        return "" + this.accountStats.humans + " person";
      }
    };

    ActiveBillingHeaderView.prototype.pluralizeNonHumanResources = function() {
      if (this.accountStats.nonHumans !== 1) {
        return "" + this.accountStats.nonHumans + " non-human resources";
      } else {
        return "" + this.accountStats.nonHumans + " non-human resource";
      }
    };

    return ActiveBillingHeaderView;

  })();

}).call(this);
(function() {
  this.ApiBatchResourcesInteraction = (function() {
    function ApiBatchResourcesInteraction(options) {
      this.ids = options.resourceInstanceIds;
      this.action = options.action;
      this.subdomain = options.subdomain;
      this.errorCallback = options.errorCallback;
    }

    ApiBatchResourcesInteraction.prototype.execute = function() {
      return $.ajax({
        type: "PUT",
        url: "/v1/" + this.subdomain + "/resources/" + this.action,
        data: {
          resource_instance_ids: this.ids
        },
        error: (function(_this) {
          return function() {
            return _this.errorCallback(_this.ids);
          };
        })(this)
      });
    };

    return ApiBatchResourcesInteraction;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.CalculateCostsModalView = (function() {
    function CalculateCostsModalView(pricingPlan, period) {
      this.pricingPlan = pricingPlan;
      this.period = period;
      this.calculateTotalPerMonth = __bind(this.calculateTotalPerMonth, this);
      this.setPrices = __bind(this.setPrices, this);
      this.setCurrentPrice = __bind(this.setCurrentPrice, this);
      this.getAnnualPrice = __bind(this.getAnnualPrice, this);
      this.getMonthlyPrice = __bind(this.getMonthlyPrice, this);
      this.togglePeriodInput = __bind(this.togglePeriodInput, this);
      this.monthlyPricingPromise = this.pricingPlan.monthlyPricingPromise;
      this.annualPricingPromise = this.pricingPlan.annualPricingPromise;
    }

    CalculateCostsModalView.prototype.renderView = function() {
      this.showSpinner();
      if ($('.js-billing-toggle-main').find(".tgl-light").prop("checked")) {
        this.period = new RecurlyPaymentPeriod("monthly");
      } else {
        this.period = new RecurlyPaymentPeriod("annual");
      }
      this.displayPrices();
      return this._bindEvents();
    };

    CalculateCostsModalView.prototype.displayPrices = function() {
      return this.getMonthlyPrice().then(this.getAnnualPrice).then(this.setCurrentPrice).then(this.setPrices).then(this.togglePeriodInput).then(this.hideSpinner)["catch"]((function(_this) {
        return function(err) {
          return _this.showTemporaryError();
        };
      })(this));
    };

    CalculateCostsModalView.prototype.showTemporaryError = function() {
      $(".js-pricing-spinner").hide();
      $(".js-calculate-plan-costs").hide();
      return $(".js-temporary-error").show();
    };

    CalculateCostsModalView.prototype._bindEvents = function() {
      this._togglePeriod();
      this._changeHumanCount();
      this._changeNonHumanCount();
      return this._startMyTrial();
    };

    CalculateCostsModalView.prototype._startMyTrial = function() {
      return $(".js-start-my-trial").on("click", function(e) {
        e.preventDefault();
        return $(".js-calculate-plan-costs").hide();
      });
    };

    CalculateCostsModalView.prototype._changeHumanCount = function() {
      return $(".js-human-resources").on("input", (function(_this) {
        return function() {
          return _this.setTotalAmounts();
        };
      })(this));
    };

    CalculateCostsModalView.prototype._changeNonHumanCount = function() {
      return $(".js-non-human-resources").on("input", (function(_this) {
        return function() {
          return _this.setTotalAmounts();
        };
      })(this));
    };

    CalculateCostsModalView.prototype.togglePeriodInput = function() {
      if (this.period.isMonthly()) {
        $(".js-signup-form").find(".tgl-light").prop("checked", true);
        $(".js-signup-form").find(".js-annual-option").removeClass("is--bold");
        $(".js-signup-form").find(".js-monthly-option").addClass("is--bold");
      } else {
        $(".js-signup-form").find(".tgl-light").prop("checked", false);
        $(".js-signup-form").find(".js-annual-option").addClass("is--bold");
        $(".js-signup-form").find(".js-monthly-option").removeClass("is--bold");
      }
      this.setCurrentPrice();
      this.setPrices();
      return Q.delay(200);
    };

    CalculateCostsModalView.prototype._togglePeriod = function() {
      $(".js-signup-form .js-toggle-price").off();
      return $(".js-signup-form .js-toggle-price").on("click", (function(_this) {
        return function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (_this.period.isMonthly()) {
            _this.period = new RecurlyPaymentPeriod("annual");
          } else {
            _this.period = new RecurlyPaymentPeriod("monthly");
          }
          return _this.togglePeriodInput();
        };
      })(this));
    };

    CalculateCostsModalView.prototype.getMonthlyPrice = function() {
      return this.monthlyPricingPromise.then((function(_this) {
        return function(price) {
          return _this.monthlyPrice = price;
        };
      })(this));
    };

    CalculateCostsModalView.prototype.getAnnualPrice = function() {
      return this.annualPricingPromise.then((function(_this) {
        return function(price) {
          return _this.annualPrice = price;
        };
      })(this));
    };

    CalculateCostsModalView.prototype.setCurrentPrice = function() {
      if (this.period.isAnnual()) {
        this.pricePerHuman = (this.annualPrice.addons["human"] / 12).toFixed(2);
        this.pricePerNonHuman = (this.annualPrice.addons["non_human"] / 12).toFixed(2);
        return this.symbol = this.annualPrice.currency.symbol;
      } else {
        this.pricePerHuman = this.monthlyPrice.addons["human"];
        this.pricePerNonHuman = this.monthlyPrice.addons["non_human"];
        return this.symbol = this.monthlyPrice.currency.symbol;
      }
    };

    CalculateCostsModalView.prototype.setPrices = function() {
      $(".js-human-price").text(this.pricePerHuman);
      $(".js-non-human-price").text(this.pricePerNonHuman);
      return this.setTotalAmounts();
    };

    CalculateCostsModalView.prototype.setTotalAmounts = function() {
      var monthlyAmount, yearlyAmount;
      if (this.period.isAnnual()) {
        monthlyAmount = new CurrencyConverter(this.calculateTotalPerMonth(), {
          unit: this.symbol
        });
        yearlyAmount = new CurrencyConverter(+this.calculateTotalPerMonth() * 12, {
          unit: this.symbol
        });
        $(".js-total-per-month").text("" + (monthlyAmount.toString()) + " per month");
        return $(".js-total-per-year").text("" + (yearlyAmount.toString()) + " paid annually");
      } else {
        yearlyAmount = new CurrencyConverter(+this.calculateTotalPerMonth(), {
          unit: this.symbol
        });
        $(".js-total-per-month").text("No annual discount");
        return $(".js-total-per-year").text("" + (yearlyAmount.toString()) + " paid monthly");
      }
    };

    CalculateCostsModalView.prototype.calculateTotalPerMonth = function() {
      var humanCount, nonHumanCount;
      humanCount = $(".js-human-resources").val();
      nonHumanCount = $(".js-non-human-resources").val();
      if (!($.isNumeric(humanCount) && humanCount > 0)) {
        humanCount = 0;
      }
      if (!($.isNumeric(nonHumanCount) && nonHumanCount > 0)) {
        nonHumanCount = 0;
      }
      return ((humanCount * this.pricePerHuman) + (nonHumanCount * this.pricePerNonHuman)).toFixed(2);
    };

    CalculateCostsModalView.prototype.showSpinner = function() {
      return $(".js-pricing-spinner").show();
    };

    CalculateCostsModalView.prototype.hideSpinner = function() {
      $(".js-pricing-spinner").hide();
      return $(".js-calculate-plan-costs").css("visibility", "visible");
    };

    return CalculateCostsModalView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.ChangePlanView = (function() {
    function ChangePlanView(oldPricingPlan, newPricingPlan, period, daysLeft, accountStats, timeLeft, timeInPeriod, viewEl) {
      this.oldPricingPlan = oldPricingPlan;
      this.newPricingPlan = newPricingPlan;
      this.period = period;
      this.daysLeft = daysLeft;
      this.accountStats = accountStats;
      this.timeLeft = timeLeft;
      this.timeInPeriod = timeInPeriod;
      this.viewEl = viewEl;
      this.amountRemaining = __bind(this.amountRemaining, this);
      this.setAmounts = __bind(this.setAmounts, this);
      this.getNewPrice = __bind(this.getNewPrice, this);
      this.getOldPrice = __bind(this.getOldPrice, this);
      this.humanResources = this.accountStats.humanResources;
      this.nonHumanResources = this.accountStats.nonHumanResources;
      this.couponDiscount = this.accountStats.couponDiscount;
      this.el = $(this.viewEl);
    }

    ChangePlanView.prototype.renderPrices = function() {
      this.bindRecurlyDownEventPage();
      return this.getOldPrice().then(this.getNewPrice).then(this.setAmounts).then(this.hideSpinner);
    };

    ChangePlanView.prototype.getOldPrice = function() {
      if (this.period.isAnnual()) {
        return this.getOldAnnualPrice();
      } else {
        return this.getOldMonthlyPrice();
      }
    };

    ChangePlanView.prototype.bindRecurlyDownEventPage = function() {
      this.oldPricingPlan.bindCatch(this.showTemporaryError);
      return this.newPricingPlan.bindCatch(this.showTemporaryError);
    };

    ChangePlanView.prototype.showTemporaryError = function() {
      $(".js-pricing-spinner").hide();
      $(".js-change-plan-content").hide();
      return $(".js-temporary-error").show();
    };

    ChangePlanView.prototype.getOldAnnualPrice = function() {
      return this.oldPricingPlan.annualPricingPromise.then((function(_this) {
        return function(price) {
          return _this.oldPrice = new RecurlyAnnualPrice(price, _this.humanResources, _this.nonHumanResources);
        };
      })(this));
    };

    ChangePlanView.prototype.getOldMonthlyPrice = function() {
      return this.oldPricingPlan.monthlyPricingPromise.then((function(_this) {
        return function(price) {
          return _this.oldPrice = new RecurlyMonthlyPrice(price, _this.humanResources, _this.nonHumanResources);
        };
      })(this));
    };

    ChangePlanView.prototype.getNewPrice = function() {
      if (this.period.isAnnual()) {
        return this.getNewAnnualPrice();
      } else {
        return this.getNewMonthlyPrice();
      }
    };

    ChangePlanView.prototype.getNewAnnualPrice = function() {
      return this.newPricingPlan.annualPricingPromise.then((function(_this) {
        return function(price) {
          return _this.newPrice = new RecurlyAnnualPrice(price, _this.humanResources, _this.nonHumanResources);
        };
      })(this));
    };

    ChangePlanView.prototype.getNewMonthlyPrice = function() {
      return this.newPricingPlan.monthlyPricingPromise.then((function(_this) {
        return function(price) {
          return _this.newPrice = new RecurlyMonthlyPrice(price, _this.humanResources, _this.nonHumanResources);
        };
      })(this));
    };

    ChangePlanView.prototype.setAmounts = function() {
      var action, balance, charges, costForRemainingPeriod, creditCharacter, credits, newCostTotal, totalPaid, totalUsed;
      this.coupon = new RecurlyCouponFactory(this.couponDiscount, this.oldPrice.currentPrice).constructCoupon();
      if (this.couponDiscount.value && this.couponDiscount.name.match(/early signup discount/)) {
        totalPaid = this._calculateTotalPaidOnSignup();
      } else {
        totalPaid = +(this.oldPrice.subscriptionNextTotal());
      }
      totalUsed = +(this.oldPrice.subscriptionNextTotal()) - this.amountRemaining(this.oldPrice.subscriptionNextTotal());
      costForRemainingPeriod = +this.amountRemaining(this.newPrice.subscriptionNextTotal());
      newCostTotal = (totalUsed + costForRemainingPeriod).toFixed(2);
      balance = +newCostTotal - +totalPaid;
      charges = +costForRemainingPeriod;
      credits = totalPaid - totalUsed;
      if (balance > 0) {
        action = "to be charged";
        creditCharacter = "";
      } else {
        action = "credit";
        creditCharacter = "-";
      }
      this.el.find(".js-credit-amount").text(this._convertToCurrency(credits, this.newPrice.currencySymbol));
      this.el.find(".js-charges-amount").text(this._convertToCurrency(charges, this.newPrice.currencySymbol, creditCharacter));
      this.el.find(".js-balance-only").text(this._convertToCurrency(Math.abs(balance), this.newPrice.currencySymbol));
      this.el.find(".js-balance-amount").text(this._convertToCurrency(Math.abs(balance), this.newPrice.currencySymbol, '', " " + action));
      return this.el.find(".js-days-left").text(RecurlyBillingView.getDaysLeftText(this.daysLeft));
    };

    ChangePlanView.prototype._convertToCurrency = function(amount, symbol, prependString, appendString) {
      var converter;
      if (prependString == null) {
        prependString = '';
      }
      if (appendString == null) {
        appendString = '';
      }
      converter = new CurrencyConverter(amount, {
        unit: symbol
      });
      return prependString + converter.toString() + appendString;
    };

    ChangePlanView.prototype.amountRemaining = function(price) {
      return (price * this.timeLeft / this.timeInPeriod).toFixed(2);
    };

    ChangePlanView.prototype.hideSpinner = function() {
      $(".js-pricing-spinner").hide();
      return $(".js-change-plan-content").css("visibility", "visible");
    };

    ChangePlanView.prototype._calculateTotalPaidOnSignup = function() {
      return (this.coupon.valueAppliedToSubtotal() * (1.0 + this.oldPrice.currentTaxRateToF())).toFixed(2);
    };

    return ChangePlanView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.ChangeSubscriptionPeriodView = (function() {
    function ChangeSubscriptionPeriodView(newPeriod, oldPeriod, recurlyPrice, humanResources, nonHumanResources, daysLeft) {
      this.newPeriod = newPeriod;
      this.oldPeriod = oldPeriod;
      this.recurlyPrice = recurlyPrice;
      this.humanResources = humanResources;
      this.nonHumanResources = nonHumanResources;
      this.daysLeft = daysLeft;
      this.setPrices = __bind(this.setPrices, this);
      this.getAnnualPrice = __bind(this.getAnnualPrice, this);
      this.getMonthlyPrice = __bind(this.getMonthlyPrice, this);
      this.monthlyPromise = this.recurlyPrice.monthlyPricingPromise;
      this.annualPromise = this.recurlyPrice.annualPricingPromise;
    }

    ChangeSubscriptionPeriodView.prototype.render = function() {
      this.catchRecurlyTemporaryError();
      return this.setChosenPeriod();
    };

    ChangeSubscriptionPeriodView.prototype.setChosenPeriod = function() {
      if (this.newPeriod.isAnnual()) {
        return this.getAnnualPrice().then(this.getMonthlyPrice).then(this.setPrices);
      } else {
        return this.getMonthlyPrice().then(this.getAnnualPrice).then(this.setPrices);
      }
    };

    ChangeSubscriptionPeriodView.prototype.getMonthlyPrice = function() {
      return this.monthlyPromise.then((function(_this) {
        return function(price) {
          return _this.monthlyPrice = new RecurlyMonthlyPrice(price, _this.humanResources, _this.nonHumanResources);
        };
      })(this));
    };

    ChangeSubscriptionPeriodView.prototype.getAnnualPrice = function() {
      return this.annualPromise.then((function(_this) {
        return function(price) {
          return _this.annualPrice = new RecurlyAnnualPrice(price, _this.humanResources, _this.nonHumanResources);
        };
      })(this));
    };

    ChangeSubscriptionPeriodView.prototype.catchRecurlyTemporaryError = function() {
      return this.recurlyPrice.bindCatch(this.showTemporaryError);
    };

    ChangeSubscriptionPeriodView.prototype.setPrices = function() {
      var newPrice, oldPrice, price;
      newPrice = this.getPeriodPrice();
      oldPrice = this.getOldPeriodPrice();
      $(".js-price-human-new").text(this._convertToCurrency(newPrice.currentPricePerHumanResource(), newPrice.currencySymbol, " ", " "));
      $(".js-price-human-old").text(this._convertToCurrency(oldPrice.currentPricePerHumanResource(), oldPrice.currencySymbol));
      $(".js-price-non-human-new").text(this._convertToCurrency(newPrice.currentPricePerNonHumanResource(), newPrice.currencySymbol, " ", " "));
      $(".js-amount-to-credit").text(this._convertToCurrency(this._amountToCredit(oldPrice.subscriptionNextTotal()), newPrice.currencySymbol, " ", " "));
      $(".js-price-non-human-old").text(this._convertToCurrency(oldPrice.currentPricePerNonHumanResource(), oldPrice.currencySymbol));
      $(".js-total-human-price").text(this._convertToCurrency(newPrice.totalHumanResourcePrice(), newPrice.currencySymbol, " "));
      $(".js-total-non-human-price").text(this._convertToCurrency(newPrice.totalNonHumanResourcePrice(), newPrice.currencySymbol, " "));
      $(".js-total-monthly").text(this._convertToCurrency(newPrice.currentTotalPerMonth(), newPrice.currencySymbol, " "));
      $(".js-annual-subtotal").text(this._convertToCurrency(newPrice.subscriptionNowSubtotal(), newPrice.currencySymbol, " "));
      this.setVatAmount(newPrice);
      this.setSubtotalAmount(newPrice);
      this.setCreditAmount(oldPrice, newPrice);
      $(".js-total").text(this._convertToCurrency(this._calculateTotalCost(newPrice, oldPrice), newPrice.currencySymbol, " "));
      if (this.oldPeriod.isAnnual()) {
        price = +newPrice.subscriptionNowSubtotal() * 2;
      } else {
        price = +oldPrice.subscriptionNowSubtotal() * 2;
      }
      $(".js-discount-amount").text(this._convertToCurrency(price, newPrice.currencySymbol, " ", " "));
      $(".js-days-left").text(RecurlyBillingView.getDaysLeftText(this.daysLeft));
      return this.hideSpinner();
    };

    ChangeSubscriptionPeriodView.prototype._amountToCredit = function(periodPrice) {
      return (periodPrice * this.daysLeft / this.oldPeriod.daysInPeriod()).toFixed(2);
    };

    ChangeSubscriptionPeriodView.prototype._convertToCurrency = function(amount, symbol, prependString, appendString) {
      var converter;
      if (prependString == null) {
        prependString = '';
      }
      if (appendString == null) {
        appendString = '';
      }
      converter = new CurrencyConverter(+amount, {
        unit: symbol
      });
      return prependString + converter.toString() + appendString;
    };

    ChangeSubscriptionPeriodView.prototype.setSubtotalAmount = function(price) {
      if (this.newPeriod.isAnnual()) {
        if (+price.subscriptionNowTax() !== 0) {
          $(".js-subtotal").text(" " + this._convertToCurrency((+price.subscriptionNowSubtotal() + +price.subscriptionNowTax()).toFixed(2), price.currencySymbol));
        } else {
          $(".js-subtotal-row").hide();
        }
        return;
      }
      return $(".js-subtotal").text(" " + this._convertToCurrency(price.subscriptionNowSubtotal(), price.currencySymbol));
    };

    ChangeSubscriptionPeriodView.prototype.setVatAmount = function(price) {
      if (+price.subscriptionNowTax() !== 0) {
        $(".js-vat").text(" " + this._convertToCurrency(price.subscriptionNowTax(), price.currencySymbol));
        return $(".js-vat-rate").text(" (@" + price.currentTaxRate() + ")");
      } else {
        return $(".js-tax-row").hide();
      }
    };

    ChangeSubscriptionPeriodView.prototype.setCreditAmount = function(oldPrice, newPrice) {
      if (+this._amountToCredit(oldPrice.subscriptionNextTotal()) !== 0) {
        return $(".js-credit").text(" " + this._convertToCurrency(this._amountToCredit(oldPrice.subscriptionNextTotal()), newPrice.currencySymbol));
      } else {
        return $(".js-credit-row").hide();
      }
    };

    ChangeSubscriptionPeriodView.prototype._calculateTotalCost = function(newPrice, oldPrice) {
      var total;
      total = (+newPrice.subscriptionNowTotal() - +this._amountToCredit(oldPrice.subscriptionNextTotal())).toFixed(2);
      if (total >= 0) {
        return total;
      } else {
        return "0.00";
      }
    };

    ChangeSubscriptionPeriodView.prototype.getPeriodPrice = function() {
      if (this.newPeriod.isAnnual()) {
        return this.annualPrice;
      } else {
        return this.monthlyPrice;
      }
    };

    ChangeSubscriptionPeriodView.prototype.getOldPeriodPrice = function() {
      if (this.newPeriod.isAnnual()) {
        return this.monthlyPrice;
      } else {
        return this.annualPrice;
      }
    };

    ChangeSubscriptionPeriodView.prototype.showTemporaryError = function() {
      $(".js-pricing-spinner").hide();
      $(".js-modal-content").hide();
      return $(".js-temporary-error").show();
    };

    ChangeSubscriptionPeriodView.prototype.showSpinner = function() {
      return $(".js-pricing-spinner").show();
    };

    ChangeSubscriptionPeriodView.prototype.hideSpinner = function() {
      $(".js-pricing-spinner").hide();
      return $(".js-modal-content").css("visibility", "visible");
    };

    return ChangeSubscriptionPeriodView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.EditResourcesView = (function() {
    function EditResourcesView(subdomain, resourcesSummary, editResourcesModal) {
      this.subdomain = subdomain;
      this.resourcesSummary = resourcesSummary;
      this.editResourcesModal = editResourcesModal;
      this.callApiAction = __bind(this.callApiAction, this);
      this.showResources = __bind(this.showResources, this);
      this.hideResources = __bind(this.hideResources, this);
      this._repositionResourcesSummary = __bind(this._repositionResourcesSummary, this);
      this.el = $(this.editResourcesModal);
    }

    EditResourcesView.prototype.render = function() {
      this._updateHeaderTotal();
      return this._bindEvents();
    };

    EditResourcesView.prototype._bindEvents = function() {
      this._bindShowResourcesSummary();
      this._bindSelectAll();
      this._bindSelectNone();
      this._initialHideActionButtons();
      this.showOrHideActionsOnSelect();
      this._bindArchiveAction();
      return this._bindDeleteAction();
    };

    EditResourcesView.prototype._bindShowResourcesSummary = function() {
      return $(".js-edit-resources-link").on("click", (function(_this) {
        return function() {
          $(".js-edit-resources").modal({
            backdrop: true
          });
          if (localStorage.userUndestandsResourceEdit) {
            return $(_this.resourcesSummary).hide();
          } else {
            localStorage.userUndestandsResourceEdit = true;
            $(_this.resourcesSummary).modal({
              backdrop: true
            });
            return _this._repositionResourcesSummary();
          }
        };
      })(this));
    };

    EditResourcesView.prototype._repositionResourcesSummary = function() {
      var newModalHeight, offsetTop;
      newModalHeight = ($(".js-edit-resources").outerHeight() - $(this.resourcesSummary).outerHeight()) / 2;
      offsetTop = $(".js-edit-resources").offset().top - $(window).scrollTop();
      newModalHeight = newModalHeight + offsetTop;
      return $(this.resourcesSummary).css("top", newModalHeight);
    };

    EditResourcesView.prototype._bindSelectAll = function() {
      return this.el.find(".js-select-all").on("click", (function(_this) {
        return function() {
          _this.el.find(".js-resource-item:not(:hidden)").addClass("is-selected");
          return _this.showOrHideActions();
        };
      })(this));
    };

    EditResourcesView.prototype._bindSelectNone = function() {
      return this.el.find(".js-select-none").on("click", (function(_this) {
        return function() {
          _this.el.find(".js-resource-item:not(:hidden)").removeClass("is-selected");
          return _this.showOrHideActions();
        };
      })(this));
    };

    EditResourcesView.prototype._initialHideActionButtons = function() {
      return this.el.find(".js-select-buttons").hide();
    };

    EditResourcesView.prototype.showOrHideActionsOnSelect = function() {
      var view;
      view = this;
      return this.el.find(".js-resource-item").on("click", function() {
        $(this).toggleClass("is-selected");
        return view.showOrHideActions();
      });
    };

    EditResourcesView.prototype.showOrHideActions = function() {
      if (this.linkIds().length) {
        return this.el.find(".js-select-buttons").show();
      } else {
        return this.el.find(".js-select-buttons").hide();
      }
    };

    EditResourcesView.prototype._idOfSelectedBox = function(checkbox) {
      if ($(checkbox).prop("checked")) {
        return $(checkbox).data("resource-id");
      }
    };

    EditResourcesView.prototype._hideResource = function(id) {
      this.el.find(".js-resource-container[data-resource-id='" + id + "']").hide();
      return this.el.find(".js-resource-item[data-resource-id='" + id + "']").hide();
    };

    EditResourcesView.prototype._deselectResources = function() {
      this.el.find(".js-resource-item").removeClass("is-selected");
      return this.showOrHideActions();
    };

    EditResourcesView.prototype._uncheckResources = function() {
      this.el.find(".js-checkbox").prop("checked", false);
      return this.showOrHideActions();
    };

    EditResourcesView.prototype._showResource = function(id) {
      this.el.find(".js-resource-container[data-resource-id='" + id + "']").show();
      return this.el.find(".js-resource-item[data-resource-id='" + id + "']").show();
    };

    EditResourcesView.prototype.linkIds = function() {
      return _.compact(_.map(this.el.find(".js-resource-item"), (function(_this) {
        return function(anchor) {
          return _this._idOfSelectedLink(anchor);
        };
      })(this)));
    };

    EditResourcesView.prototype._idOfSelectedLink = function(anchor) {
      if ($(anchor).hasClass("is-selected")) {
        return $(anchor).data("resource-id");
      }
    };

    EditResourcesView.prototype.selectBoxIds = function() {
      return _.compact(_.map(this.el.find(".js-checkbox"), (function(_this) {
        return function(checkbox) {
          return _this._idOfSelectedBox(checkbox);
        };
      })(this)));
    };

    EditResourcesView.prototype.hideResources = function(ids) {
      return _.each(ids, (function(_this) {
        return function(anchorResourceId) {
          return _this._hideResource(anchorResourceId);
        };
      })(this));
    };

    EditResourcesView.prototype.showResources = function(ids) {
      return _.each(ids, (function(_this) {
        return function(anchorResourceId) {
          return _this._showResource(anchorResourceId);
        };
      })(this));
    };

    EditResourcesView.prototype.callApiAction = function(action) {
      var batchInteration;
      batchInteration = new ApiBatchResourcesInteraction({
        resourceInstanceIds: this.linkIds(),
        action: action,
        subdomain: this.subdomain,
        errorCallback: this.showResources
      });
      return batchInteration.execute();
    };

    EditResourcesView.prototype.archiveMessage = function() {
      if (this.linkIds().length === 1) {
        return "Are you sure you want to archive this resource?";
      } else if (this.linkIds().length > 1) {
        return "Are you sure you want to archive these resources?";
      }
    };

    EditResourcesView.prototype.deleteMessage = function() {
      if (this.linkIds().length === 1) {
        return "Are you sure you want to delete this resource?";
      } else if (this.linkIds().length > 1) {
        return "Are you sure you want to delete these resources?";
      }
    };

    EditResourcesView.prototype._bindArchiveAction = function() {
      return this.el.find(".js-archive").on("click", (function(_this) {
        return function() {
          if (_this.linkIds().length && confirm(_this.archiveMessage())) {
            _this.hideResources(_this.linkIds());
            _this.callApiAction("batch_archive");
            _this._updateAccountStats();
            _this._updateHeaders();
            _this._updateHeaderTotal();
            return _this._deselectResources();
          }
        };
      })(this));
    };

    EditResourcesView.prototype._bindDeleteAction = function() {
      return this.el.find(".js-delete").on("click", (function(_this) {
        return function() {
          if (_this.linkIds().length && confirm(_this.deleteMessage())) {
            _this.hideResources(_this.linkIds());
            _this.callApiAction("batch_destroy");
            _this._updateAccountStats();
            _this._updateHeaders();
            _this._updateHeaderTotal();
            return _this._deselectResources();
          }
        };
      })(this));
    };

    EditResourcesView.prototype._updateHeaders = function() {
      if (accountStats.trialEnded) {
        return this._updateTrialEndedHeader();
      } else {
        return this._updatePaymentsAndResources();
      }
    };

    EditResourcesView.prototype._updateTrialEndedHeader = function() {
      var trialEndedBillingHeaderView;
      trialEndedBillingHeaderView = new TrialEndedBillingHeaderView(accountStats, ".js-resource-header");
      return trialEndedBillingHeaderView.render();
    };

    EditResourcesView.prototype._updateAccountStats = function() {
      var humanCount, nonHumanCount;
      humanCount = _.reject($("[data-resource-type='human']"), function(element) {
        return !$(element).hasClass("is-selected");
      }).length;
      nonHumanCount = _.reject($("[data-resource-type='non_human']"), function(element) {
        return !$(element).hasClass("is-selected");
      }).length;
      accountStats.humans = accountStats.humans - humanCount;
      return accountStats.nonHumans = accountStats.nonHumans - nonHumanCount;
    };

    EditResourcesView.prototype._updatePaymentsAndResources = function() {
      var activeBillingHeaderView;
      activeBillingHeaderView = new ActiveBillingHeaderView(accountStats, ".js-next-payment-amount", ".js-next-payment-details", ".js-header-human-resources", ".js-header-non-human-resources");
      return activeBillingHeaderView.render();
    };

    EditResourcesView.prototype._updateHeaderTotal = function() {
      return $(".js-edit-resources-header").text("" + (this.pluralizePeople(accountStats.humans)) + " and " + (this.pluralizeNonHumanResources(accountStats.nonHumans)));
    };

    EditResourcesView.prototype.pluralizePeople = function(humans) {
      if (humans !== 1) {
        return "" + humans + " people";
      } else {
        return "" + humans + " person";
      }
    };

    EditResourcesView.prototype.pluralizeNonHumanResources = function(nonHumans) {
      if (nonHumans !== 1) {
        return "" + nonHumans + " non-human resources";
      } else {
        return "" + nonHumans + " non-human resource";
      }
    };

    return EditResourcesView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.PaymentTotalsView = (function() {
    function PaymentTotalsView(pricingPlan, accountStats, period, element) {
      this.pricingPlan = pricingPlan;
      this.accountStats = accountStats;
      this.period = period;
      this.element = element;
      this.displayTotalsWithDiscountAndVat = __bind(this.displayTotalsWithDiscountAndVat, this);
      this.promise = this.pricingPlan.createPricingPromise(this.pricingPlan.getPaymentPeriod(), function(promise) {
        return promise.address({
          country: this.accountStats.country
        });
      });
    }

    PaymentTotalsView.prototype.renderPrices = function() {
      return this.setPrice().then(this.displayTotalsWithDiscountAndVat)["catch"](function(err) {
        return console.log(err);
      });
    };

    PaymentTotalsView.prototype.setPrice = function() {
      return this.promise.then((function(_this) {
        return function(price) {
          _this.coupon = new RecurlyCouponFactory(_this.accountStats.couponDiscount, price).constructCoupon();
          _this.price = price;
          return _this.currencySymbol = price.currency.symbol;
        };
      })(this));
    };

    PaymentTotalsView.prototype.displayTotalsWithDiscountAndVat = function() {
      this.displayDiscount();
      this.displayVatAmount();
      this.displayCreditAmount();
      this.displayTotalAfterTax();
      return this.hideSpinner();
    };

    PaymentTotalsView.prototype.displayVatAmount = function() {
      if (this.taxRate() > 0) {
        $(".js-tax-header").text("" + this.accountStats.country + " VAT " + (this.taxRate() * 100) + "%");
        return $(".js-tax-amount").text(this.amountWithCurrency(this.taxAmount()));
      } else {
        return $(".js-tax-row").hide();
      }
    };

    PaymentTotalsView.prototype.taxAmount = function() {
      return Math.max(0, (+this.price.now.addons - this.coupon.getAmountValue()) * this.taxRate());
    };

    PaymentTotalsView.prototype.taxRate = function() {
      var tax;
      tax = this.price.taxes[0];
      if (tax) {
        return +tax.rate;
      } else {
        return 0;
      }
    };

    PaymentTotalsView.prototype.displayCreditAmount = function() {
      var creditAmount;
      creditAmount = +this.price.now.addons - this.coupon.getAmountValue();
      if (creditAmount < 0) {
        return $(".js-credit-amount").text(this.amountWithCurrency(Math.abs(creditAmount)));
      } else {
        return $(".js-credit-row").hide();
      }
    };

    PaymentTotalsView.prototype.displayTotalAfterTax = function() {
      if (this.taxRate() > 0 || this.coupon.getAmountValue() > 0) {
        return $(".js-total-amount").text(this.amountWithCurrency(this.totalAfterTaxAmount()));
      } else {
        return $(".js-final-total").hide();
      }
    };

    PaymentTotalsView.prototype.totalAfterTaxAmount = function() {
      return Math.max(0, +this.price.now.addons - this.coupon.getAmountValue() + this.taxAmount());
    };

    PaymentTotalsView.prototype.displayDiscount = function() {
      if (this.coupon.getAmountValue() > 0) {
        this.setDiscountHeaderText();
        return $(".js-discount-amount").text("-" + (this.amountWithCurrency(this.coupon.getAmountValue())));
      } else {
        return $(".js-discount-row").hide();
      }
    };

    PaymentTotalsView.prototype.setDiscountHeaderText = function() {
      if (this.accountStats.couponDiscount.name.indexOf("early signup discount") !== -1 && this.accountStats.couponDiscount.coupon_type === "percent") {
        return $(".js-discount-header").text("Discount (" + (this.coupon._discountPercent()) + "% early purchase)");
      } else if (this.accountStats.couponDiscount.coupon_type === "percent") {
        return $(".js-discount-header").text("Discount (" + (this.coupon._discountPercent()) + "%" + (this._setCouponDescriptionForPercentage()) + ")");
      } else {
        return $(".js-discount-header").text("Discount (" + (this._setCouponDescriptionForAmount()) + ")");
      }
    };

    PaymentTotalsView.prototype._setCouponDescriptionForPercentage = function() {
      if (this.accountStats.couponDiscount.description && this.accountStats.couponDiscount.description !== "") {
        return " " + this.accountStats.couponDiscount.description;
      } else {
        return " off coupon";
      }
    };

    PaymentTotalsView.prototype._setCouponDescriptionForAmount = function() {
      if (this.accountStats.couponDiscount.description && this.accountStats.couponDiscount.description !== "") {
        return this.accountStats.couponDiscount.description;
      } else {
        return "" + (this.amountWithCurrency(this.coupon.getAmountValue())) + " off coupon";
      }
    };

    PaymentTotalsView.prototype.hideSpinner = function() {
      $(".js-pricing-spinner").hide();
      return this.element.css("visibility", "visible");
    };

    PaymentTotalsView.prototype.amountWithCurrency = function(amount) {
      var converter;
      converter = new CurrencyConverter(+amount, {
        unit: this.currencySymbol
      });
      return converter.toString();
    };

    return PaymentTotalsView;

  })();

}).call(this);
(function() {
  this.PopoverEventBinder = (function() {
    function PopoverEventBinder() {}

    PopoverEventBinder.prototype.bindEvents = function() {
      this.bindShowCouponPopover();
      this.bindHideCouponPopover();
      this.bindPreventEventPropagation();
      this.bindShowChargesDetailsPopover();
      this.bindHideChargesDetailsPopover();
      return this.bindDetailsAndPaymentModalHandling();
    };

    PopoverEventBinder.prototype.bindShowCouponPopover = function() {
      return $(".js-got-coupon").on("click", function(e) {
        e.preventDefault();
        $(".js-coupon-dropdown .rg-error").remove();
        $(".js-coupon-dropdown").toggleClass("open");
        return e.stopPropagation();
      });
    };

    PopoverEventBinder.prototype.bindHideCouponPopover = function() {
      return $(".billing-form").on("click", function() {
        $('input.btn').prop('disabled', false);
        return $(".js-coupon-dropdown").removeClass("open");
      });
    };

    PopoverEventBinder.prototype.bindPreventEventPropagation = function() {
      $(".js-coupon-dropdown").on("click", function(e) {
        e.preventDefault();
        return e.stopPropagation();
      });
      return $(".js-details-popup").on("click", function(e) {
        e.preventDefault();
        return e.stopPropagation();
      });
    };

    PopoverEventBinder.prototype.bindShowChargesDetailsPopover = function() {
      return $(".js-view-charges-details").on("click", function(e) {
        e.preventDefault();
        $(".js-details-popup").show();
        return e.stopPropagation();
      });
    };

    PopoverEventBinder.prototype.bindHideChargesDetailsPopover = function() {
      return $(".billing-form").on("click", function() {
        if ($(".js-details-popup").css("display") !== "none") {
          return $(".js-details-popup").hide();
        }
      });
    };

    PopoverEventBinder.prototype.bindDetailsAndPaymentModalHandling = function() {
      $(".plan-details-dropdown .dropdown-menu").on("click", function(e) {
        e.preventDefault();
        return e.stopPropagation();
      });
      return this._preventDetailsPopoverFromClosing();
    };

    PopoverEventBinder.prototype._preventDetailsPopoverFromClosing = function() {
      $(".modal-backdrop").off();
      return $(".modal-backdrop").on("click", function(e) {
        if ($(e.target).hasClass("js-open-details-popover")) {
          return;
        }
        if ($(".js-popover-trigger").hasClass("open")) {
          return;
        }
        if ($(e.target).hasClass("modal-backdrop")) {
          return $("#modal").modal("hide");
        }
      });
    };

    return PopoverEventBinder;

  })();

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.RecurlyAnnualPrice = (function(_super) {
    __extends(RecurlyAnnualPrice, _super);

    function RecurlyAnnualPrice(currentPrice, humanResources, nonHumanresources) {
      this.currentPrice = currentPrice;
      this.humanResources = humanResources;
      this.nonHumanresources = nonHumanresources;
      this.pricePerHumanResource = this.currentPricePerHumanResource();
      this.pricePerNonHumanResource = this.currentPricePerNonHumanResource();
      this.total = this.currentTotal();
      this.humanResourceTotal = this.totalHumanResourcePrice();
      this.nonHumanResourceTotal = this.totalNonHumanResourcePrice();
      this.currencySymbol = this.currentPrice.currency.symbol;
      this.totalPerMonth = this.currentTotalPerMonth();
    }

    RecurlyAnnualPrice.prototype.currentPricePerHumanResource = function() {
      return +this.currentPrice.addons["human"] / 12;
    };

    RecurlyAnnualPrice.prototype.currentPricePerNonHumanResource = function() {
      return +this.currentPrice.addons["non_human"] / 12;
    };

    RecurlyAnnualPrice.prototype.currentTotal = function() {
      return RecurlyAnnualPrice.__super__.currentTotal.apply(this, arguments);
    };

    RecurlyAnnualPrice.prototype.totalHumanResourcePrice = function() {
      return RecurlyAnnualPrice.__super__.totalHumanResourcePrice.apply(this, arguments);
    };

    RecurlyAnnualPrice.prototype.totalNonHumanResourcePrice = function() {
      return RecurlyAnnualPrice.__super__.totalNonHumanResourcePrice.apply(this, arguments);
    };

    RecurlyAnnualPrice.prototype.currentTotalPerMonth = function() {
      return this.currentTotal() / 12;
    };

    return RecurlyAnnualPrice;

  })(this.RecurlyMonthlyPrice);

}).call(this);
(function() {
  this.RecurlyBillingView = {
    getDaysLeftText: function(daysLeft) {
      if (daysLeft > 1) {
        return "" + daysLeft + " days ";
      } else {
        return "" + daysLeft + " day ";
      }
    }
  };

}).call(this);
(function() {
  this.RecurlyPaymentPeriod = (function() {
    function RecurlyPaymentPeriod(period, daysInPaymentPeriod) {
      this.period = period;
      this.daysInPaymentPeriod = daysInPaymentPeriod != null ? daysInPaymentPeriod : null;
    }

    RecurlyPaymentPeriod.prototype.isAnnual = function() {
      return this.period === "annual";
    };

    RecurlyPaymentPeriod.prototype.isMonthly = function() {
      return this.period === "monthly";
    };

    RecurlyPaymentPeriod.prototype.daysInPeriod = function() {
      return this.daysInPaymentPeriod;
    };

    return RecurlyPaymentPeriod;

  })();

}).call(this);
(function() {
  this.TrialEndedBillingHeaderView = (function() {
    function TrialEndedBillingHeaderView(accountStats, element) {
      this.accountStats = accountStats;
      this.element = element;
    }

    TrialEndedBillingHeaderView.prototype.render = function() {
      return $(this.element).text("Your account has " + (this.pluralizePeople()) + " and " + (this.pluralizeNonHumanResources()));
    };

    TrialEndedBillingHeaderView.prototype.pluralizePeople = function() {
      if (this.accountStats.humans !== 1) {
        return "" + this.accountStats.humans + " people";
      } else {
        return "" + this.accountStats.humans + " person";
      }
    };

    TrialEndedBillingHeaderView.prototype.pluralizeNonHumanResources = function() {
      if (this.accountStats.nonHumans !== 1) {
        return "" + this.accountStats.nonHumans + " non-human resources";
      } else {
        return "" + this.accountStats.nonHumans + " non-human resource";
      }
    };

    return TrialEndedBillingHeaderView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.UpdateCreditCardView = (function(_super) {
    __extends(UpdateCreditCardView, _super);

    function UpdateCreditCardView(recurlyBillingInfoPresent) {
      this.recurlyBillingInfoPresent = recurlyBillingInfoPresent != null ? recurlyBillingInfoPresent : null;
      this._cancelAjax = __bind(this._cancelAjax, this);
      this._clearAndHideCCDetailsEntries = __bind(this._clearAndHideCCDetailsEntries, this);
      this.errorFields = this._getErrorFields();
    }

    UpdateCreditCardView.prototype.bindEvents = function() {
      this._bindDisplayCCDetails();
      this._bindHideCCDetails();
      this._bindFormSubmit();
      this._bindValidations();
      this._bindCancelEdit();
      this._bindOpenEditModal();
      return this._bindCloseModalEvents();
    };

    UpdateCreditCardView.prototype.removeErrors = function() {
      $('input').removeClass('rg-error');
      $(".js-payment-error").hide();
      $('.rg-error:not(.js-payment-error):not(.js-expiry-error):not(.cvv)').remove();
      $(".js-cc-expiry-errors").hide();
      return $(".js-expiry-error").hide();
    };

    UpdateCreditCardView.prototype.handleErrors = function(err) {
      var errorsMarkup;
      if (err.message === "Timeout") {
        return this.showTemporaryError();
      } else {
        errorsMarkup = $.map(_.uniq(err.fields), (function(_this) {
          return function(field) {
            if (_this.cardExpired(field)) {
              return $(".js-expiry-error").show();
            } else if (field === "number") {
              return _this.displayNumberError();
            } else {
              return _this.displayError(field);
            }
          };
        })(this));
        return this._enableSubmit();
      }
    };

    UpdateCreditCardView.prototype.handleInvalidCVVErrors = function(field) {
      var errorDiv;
      errorDiv = $(document.createElement("div")).addClass("js-cc-expiry-errors");
      $(".cc-cvv-and-expiry").append(errorDiv);
      return errorDiv.append($(document.createElement("div")).addClass("cvv").addClass("rg-error").text("Please enter a valid card expiry " + field));
    };

    UpdateCreditCardView.prototype.displayNumberError = function() {
      return $("input[data-recurly='number']").addClass("error").parent().append("<span class='number rg-error'>Please enter " + this.errorFields["number"] + "</span>");
    };

    UpdateCreditCardView.prototype.cardExpired = function(field) {
      return (field === "month" || field === "year") && ($("#billing_month").val() !== "" && $("#billing_year").val() !== "");
    };

    UpdateCreditCardView.prototype.showTemporaryError = function() {
      $(".js-current-cc-details").hide();
      $(".js-billing-form").hide();
      return $(".js-temporary-error").show();
    };

    UpdateCreditCardView.prototype._bindOpenEditModal = function() {
      $(".js-change-card-details-dropdown").on("click", (function(_this) {
        return function(e) {
          _this._showEditModalEnableScrolling();
          $(".js-billing-actions").dropdown("toggle");
          return e.preventDefault();
        };
      })(this));
      return $(".js-change-card-details").on("click", (function(_this) {
        return function() {
          return _this._showEditModalEnableScrolling();
        };
      })(this));
    };

    UpdateCreditCardView.prototype._bindCloseModalEvents = function() {
      return $(".js-update-credit-card-modal").on("hidden", (function(_this) {
        return function() {
          _this._clearAndHideCCDetailsEntries();
          _this._removeNonCCErrors();
          return _this._cancelAjax();
        };
      })(this));
    };

    UpdateCreditCardView.prototype._showEditModalEnableScrolling = function() {
      return $(".js-update-credit-card-modal").css("position", "absolute").modal("show");
    };

    UpdateCreditCardView.prototype._bindDisplayCCDetails = function() {
      return $(".js-show-cc-fields").on("click", (function(_this) {
        return function() {
          $(".js-cc-details").show();
          $(".js-current-cc-details").hide();
          return _this._removeCCDetailsErrors();
        };
      })(this));
    };

    UpdateCreditCardView.prototype._removeCCDetailsErrors = function() {
      $(".js-cc-expiry-errors").hide();
      $(".js-expiry-error").hide();
      $("span.number.rg-error").remove();
      return $("input[data-recurly='number']").removeClass("error");
    };

    UpdateCreditCardView.prototype._removeNonCCErrors = function() {
      $(".js-update-credit-card-modal span.rg-error").remove();
      return $("input").removeClass("rg-error");
    };

    UpdateCreditCardView.prototype._bindHideCCDetails = function() {
      return $(".js-hide-cc-fields").on("click", (function(_this) {
        return function() {
          return _this._clearAndHideCCDetailsEntries();
        };
      })(this));
    };

    UpdateCreditCardView.prototype._clearAndHideCCDetailsEntries = function() {
      if (this.recurlyBillingInfoPresent) {
        $(".js-cc-details").hide();
      }
      $(".js-cc-details input").val("");
      $(".js-current-cc-details").show();
      return this._removeCCDetailsErrors();
    };

    UpdateCreditCardView.prototype._bindValidations = function() {
      $('#billing_number').on('change', (function(_this) {
        return function() {
          return _this._deferBlur(_this._validateCreditCard);
        };
      })(this));
      $('#billing_cvv').on('change', (function(_this) {
        return function() {
          return _this._deferBlur(_this._validateCVV);
        };
      })(this));
      return $('#billing_country').on('change', (function(_this) {
        return function() {
          return _this._deferBlur(_this._validateState);
        };
      })(this));
    };

    UpdateCreditCardView.prototype._validateState = function() {
      var state;
      state = $("#billing_state");
      if (state.val() === "") {
        if ($('#billing_country').val() === 'US') {
          return state.attr("placeholder", "State").val("").focus().blur();
        } else {
          return state.attr("placeholder", "State (optional)").val("").focus().blur();
        }
      }
    };

    UpdateCreditCardView.prototype._validateCreditCard = function() {
      $('.number.rg-error').remove();
      if (recurly.validate.cardNumber($('#billing_number').val())) {
        this._enableSubmit();
        return;
      }
      $("input[data-recurly='number']").addClass("error");
      $(".js-cc-inputs").after("<div class='number rg-error'>Please enter a valid credit card number</div>");
      return this._disableSubmit();
    };

    UpdateCreditCardView.prototype._validateCVV = function() {
      var errorDiv;
      $(".cvv.rg-error").remove();
      $(".js-expiry-error").hide();
      if (recurly.validate.cvv($('#billing_cvv').val())) {
        this._enableSubmit();
        return;
      }
      if ($("#billing_cvv").val() === "") {
        this.displayError('cvv');
      } else {
        errorDiv = $(document.createElement("div")).addClass("js-cc-expiry-errors");
        $(".cc-cvv-and-expiry").append(errorDiv);
        errorDiv.append($(document.createElement("div")).addClass("cvv").addClass("rg-error").text("Please enter a valid security code"));
      }
      return this._disableSubmit();
    };

    UpdateCreditCardView.prototype._bindFormSubmit = function() {
      var view;
      view = this;
      return $('.js-update-card-form').on('submit', function(e) {
        var form;
        e.preventDefault();
        e.stopPropagation();
        view.removeErrors();
        view.abortRedirect = false;
        view._disableSubmit();
        form = this;
        return recurly.token(form, function(recurlyError) {
          if (recurlyError) {
            recurlyError = view.addOptionalValidationAttributes(recurlyError);
            view.handleErrors(recurlyError);
            if ($(".js-cc-details").css("display") === "none" && $(".rg-error:visible").length === 0) {
              view._disableSubmit();
              return view._submitForm();
            }
          } else {
            return view._submitForm();
          }
        });
      });
    };

    UpdateCreditCardView.prototype._submitForm = function() {
      return $.ajax({
        url: "/recurly",
        type: "PUT",
        data: {
          billing: this._formData()
        },
        dataType: 'json',
        success: (function(_this) {
          return function(response) {
            if (!_this.abortRedirect) {
              return window.location = "/billing";
            } else {
              return _this._enableSubmit();
            }
          };
        })(this),
        error: (function(_this) {
          return function(response) {
            var fields;
            if (response.responseJSON.error) {
              $(".js-payment-error").show();
              $(".js-payment-error-text").text(response.responseJSON.error);
            } else {
              fields = response.responseJSON;
              _this.handleErrors({
                fields: _.keys(fields)
              });
            }
            return _this._enableSubmit();
          };
        })(this)
      });
    };

    UpdateCreditCardView.prototype._formData = function() {
      return {
        token_id: $("#billing_token_id").val(),
        first_name: $("#billing_first_name").val(),
        last_name: $("#billing_last_name").val(),
        address1: $("#billing_address1").val(),
        address2: $("#billing_address2").val(),
        city: $("#billing_city").val(),
        state: $("#billing_state").val(),
        zip: $("#billing_zip").val(),
        country: $("#billing_country").val(),
        vat_number: $("#billing_vat_number").val()
      };
    };

    UpdateCreditCardView.prototype._bindCancelEdit = function() {
      $('.js-cancel-credit-edit').off();
      return $('.js-cancel-credit-edit').on('click', (function(_this) {
        return function(e) {
          e.preventDefault();
          _this.cancelled = true;
          $('#billing_number').val('');
          return _this._clearAndHideCCDetailsEntries();
        };
      })(this));
    };

    UpdateCreditCardView.prototype._cancelAjax = function() {
      return this.abortRedirect = true;
    };

    UpdateCreditCardView.prototype.addOptionalValidationAttributes = function(recurlyError) {
      if ($("#billing_cvv").val() === "") {
        recurlyError.fields.push("cvv");
      }
      if ($("#billing_address1").val() === "") {
        recurlyError.fields.push("address1");
      }
      if ($("#billing_city").val() === "") {
        recurlyError.fields.push("city");
      }
      if ($("#billing_zip").val() === "") {
        recurlyError.fields.push("postal_code");
      }
      if ($("#billing_country").val() === 'US' && $("#billing_state").val() === "") {
        recurlyError.fields.push("state");
      }
      return recurlyError;
    };

    UpdateCreditCardView.prototype._deferBlur = function(f) {
      return Q.delay(50, (function(_this) {
        return function() {
          if (_this.cancelled) {
            return _this.cancelled = false;
          } else {
            return f();
          }
        };
      })(this));
    };

    UpdateCreditCardView.prototype._disableSubmit = function() {
      var button;
      button = $('input.js-update-credit-card');
      button.attr("disabled", "disabled");
      return button.val(button.data("disable-with"));
    };

    UpdateCreditCardView.prototype._enableSubmit = function() {
      var button;
      button = $('input.js-update-credit-card');
      button.attr('disabled', false);
      return button.val("Update");
    };

    return UpdateCreditCardView;

  })(AbstractCreditCardView);

}).call(this);
(function() {
  $(function() {
    $(".js-payment-result").modal("show");
    return $(".js-payment-result-close").on("click", function() {
      return $('.js-payment-result').modal('hide');
    });
  });

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.PaymentPeriodView = (function() {
    function PaymentPeriodView(recurlyPrice, period, humanResources, nonHumanResources, signupDiscount) {
      this.recurlyPrice = recurlyPrice;
      this.period = period;
      this.humanResources = humanResources;
      this.nonHumanResources = nonHumanResources;
      this.signupDiscount = signupDiscount;
      this.setAnnualPrices = __bind(this.setAnnualPrices, this);
      this.setMonthlyPrices = __bind(this.setMonthlyPrices, this);
      this.monthlyPromise = this.recurlyPrice.monthlyPricingPromise;
      this.annualPromise = this.recurlyPrice.annualPricingPromise;
      this.currencySymbol = this.recurlyPrice.currencySymbol;
    }

    PaymentPeriodView.prototype.renderPrices = function() {
      this._bindEvents();
      this.showSpinner();
      this._setChosenPeriod();
      return this.setMonthlyPrices().then(this.setAnnualPrices);
    };

    PaymentPeriodView.prototype.setMonthlyPrices = function() {
      return this.monthlyPromise.then((function(_this) {
        return function(price) {
          _this.monthlyPrice = new RecurlyMonthlyPrice(price, _this.humanResources, _this.nonHumanResources);
          _this.currencySymbol = _this.monthlyPrice.currencySymbol;
          _this.setMonthlyBreakDown();
          _this.setMonthlySignupDiscount();
          return _this.setMonthlyTotalAfterDiscount();
        };
      })(this));
    };

    PaymentPeriodView.prototype.setAnnualPrices = function() {
      return this.annualPromise.then((function(_this) {
        return function(price) {
          _this.annualPrice = new RecurlyAnnualPrice(price, _this.humanResources, _this.nonHumanResources);
          _this.currencySymbol = _this.annualPrice.currencySymbol;
          _this.setAnnualBreakDown();
          _this.setAnnualTotal();
          _this.setAnnualDiscount();
          _this.setAnnualSignupDiscount();
          _this.setAnnualTotalAfterDiscount();
          return _this.hideSpinner();
        };
      })(this));
    };

    PaymentPeriodView.prototype.setMonthlySignupDiscount = function() {
      if (this.signupDiscount > 0) {
        this.monthlyDiscountAmount = this.monthlyPrice.total * this.signupDiscount;
        $(".js-monthly-discount-row").show();
        $(".js-monthly-discount-percentage").text("Discount (" + (this.signupDiscount * 100) + "% early purchase)");
        return $(".js-monthly-discount-amount").text("-" + (this.amountWithCurrency(this.monthlyDiscountAmount)));
      } else {
        return $(".js-monthly-discount-row").hide();
      }
    };

    PaymentPeriodView.prototype.setMonthlyTotalAfterDiscount = function() {
      if (this.signupDiscount > 0) {
        $(".js-monthly-total-with-discount-row").show();
        return $(".js-monthly-total-with-discount").text(this.amountWithCurrency(this.monthlyPrice.total - this.monthlyDiscountAmount));
      } else {
        return $(".js-monthly-total-with-discount-row").hide();
      }
    };

    PaymentPeriodView.prototype.setAnnualSignupDiscount = function() {
      if (this.signupDiscount > 0) {
        this.annualDiscountAmount = this.annualPrice.total * this.signupDiscount;
        $(".js-annual-discount-row").show();
        $(".js-annual-discount-percentage").text("Discount (" + (this.signupDiscount * 100) + "% early purchase)");
        return $(".js-annual-discount-amount").text("-" + (this.amountWithCurrency(this.annualDiscountAmount)));
      } else {
        return $(".js-annual-discount-row").hide();
      }
    };

    PaymentPeriodView.prototype.setAnnualTotalAfterDiscount = function() {
      if (this.signupDiscount > 0) {
        $(".js-annual-total-with-discount-row").show();
        return $(".js-annual-total-with-discount").text(this.amountWithCurrency(this.annualPrice.total - this.annualDiscountAmount));
      } else {
        return $(".js-annual-total-with-discount-row").hide();
      }
    };

    PaymentPeriodView.prototype.showTemporaryError = function() {
      $(".js-period-info").hide();
      $('.js-pricing-period').hide();
      $(".js-pricing-spinner").hide();
      return $(".js-temporary-error").show();
    };

    PaymentPeriodView.prototype._setChosenPeriod = function() {
      if (this.period.isAnnual()) {
        return this.showAnnualPaymentPeriod();
      } else {
        return this.showMonthlyPaymentPeriod();
      }
    };

    PaymentPeriodView.prototype.setMonthlyBreakDown = function() {
      var element, pricePerHumanResource, pricePerNonHumanResource, totalHumanResourcePrice, totalNonHumanResourcePrice, totalPrice;
      element = $(".js-modal-monthly");
      pricePerHumanResource = this.monthlyPrice.pricePerHumanResource;
      pricePerNonHumanResource = this.monthlyPrice.pricePerNonHumanResource;
      totalHumanResourcePrice = this.monthlyPrice.humanResourceTotal;
      totalNonHumanResourcePrice = this.monthlyPrice.nonHumanResourceTotal;
      totalPrice = this.monthlyPrice.total;
      return this.fillPricingBreakDown(element, pricePerHumanResource, pricePerNonHumanResource, totalHumanResourcePrice, totalNonHumanResourcePrice, totalPrice);
    };

    PaymentPeriodView.prototype.setAnnualBreakDown = function() {
      var element, pricePerHumanResource, pricePerNonHumanResource, totalHumanResourcePrice, totalNonHumanResourcePrice, totalPrice;
      element = $(".js-modal-annual");
      pricePerHumanResource = this.annualPrice.pricePerHumanResource;
      pricePerNonHumanResource = this.annualPrice.pricePerNonHumanResource;
      totalHumanResourcePrice = this.annualPrice.humanResourceTotal;
      totalNonHumanResourcePrice = this.annualPrice.nonHumanResourceTotal;
      totalPrice = this.annualPrice.totalPerMonth;
      return this.fillPricingBreakDown(element, pricePerHumanResource, pricePerNonHumanResource, totalHumanResourcePrice, totalNonHumanResourcePrice, totalPrice);
    };

    PaymentPeriodView.prototype.catchRecurlyTemporaryError = function() {
      return this.recurlyPrice.bindCatch(this.showTemporaryError);
    };

    PaymentPeriodView.prototype._bindEvents = function() {
      this._bindCloseModal();
      this.catchRecurlyTemporaryError();
      $(".js-change-to-monthly").on('click', (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.changeToMonthly();
        };
      })(this));
      return $(".js-change-to-annual").on('click', (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.changeToAnnual();
        };
      })(this));
    };

    PaymentPeriodView.prototype._bindCloseModal = function() {
      return $("#modal").one("hidden.bs.modal", function() {
        return localStorage.removeItem("payment-form");
      });
    };

    PaymentPeriodView.prototype.amountWithCurrency = function(amount) {
      var converter;
      converter = new CurrencyConverter(+amount, {
        unit: this.currencySymbol
      });
      return converter.toString();
    };

    PaymentPeriodView.prototype.setAnnualDiscount = function() {
      var savedAmount;
      savedAmount = this.monthlyPrice.totalForYear - this.annualPrice.total;
      return $(".js-saving-annual.js-saved-per-year").text("Save " + (this.amountWithCurrency(savedAmount)) + " per year");
    };

    PaymentPeriodView.prototype.setAnnualTotal = function() {
      return $(".js-total-year-price").text(this.amountWithCurrency(this.annualPrice.total));
    };

    PaymentPeriodView.prototype.fillPricingBreakDown = function(element, pricePerHumanResource, pricePerNonHumanResource, totalHumanResourcePrice, totalNonHumanResourcePrice, totalPrice) {
      element.find(".js-price-human-resources").text(this.amountWithCurrency(pricePerHumanResource));
      element.find(".js-price-non-human-resources").text("+ " + (this.amountWithCurrency(pricePerNonHumanResource)) + " per non-human resource, per month");
      element.find(".js-total-human-resource-price").text(this.amountWithCurrency(pricePerHumanResource * this.humanResources));
      element.find(".js-total-non-human-resource-price").text(this.amountWithCurrency(pricePerNonHumanResource * this.nonHumanResources));
      return element.find(".js-total-price").text(this.amountWithCurrency(totalPrice));
    };

    PaymentPeriodView.prototype.showMonthlyPaymentPeriod = function() {
      $(".js-plan-annual").hide();
      return $(".js-plan-monthly").show();
    };

    PaymentPeriodView.prototype.showAnnualPaymentPeriod = function() {
      $(".js-plan-monthly").hide();
      return $(".js-plan-annual").show();
    };

    PaymentPeriodView.prototype.changeToMonthly = function() {
      this.changePlanCodeToMonthly();
      $("#payment_period").val("monthly");
      return this.showMonthlyPaymentPeriod();
    };

    PaymentPeriodView.prototype.changeToAnnual = function() {
      this.changePlanCodeToAnnual();
      $("#payment_period").val("annual");
      return this.showAnnualPaymentPeriod();
    };

    PaymentPeriodView.prototype.changePlanCodeToAnnual = function() {
      var planCode;
      planCode = this.getBasePlanCodeValue();
      return $("#plan_code").val(planCode + "_annual");
    };

    PaymentPeriodView.prototype.changePlanCodeToMonthly = function() {
      var planCode;
      planCode = this.getBasePlanCodeValue();
      return $("#plan_code").val(planCode + "_monthly");
    };

    PaymentPeriodView.prototype.getBasePlanCodeValue = function() {
      return $("#plan_code").val().split("_")[0];
    };

    PaymentPeriodView.prototype.showSpinner = function() {
      return $(".js-pricing-spinner").show();
    };

    PaymentPeriodView.prototype.hideSpinner = function() {
      $(".js-pricing-spinner").hide();
      return $(".js-pricing-period").css("visibility", "visible");
    };

    return PaymentPeriodView;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.PaymentDetailsView = (function(_super) {
    var paymentFormKey;

    __extends(PaymentDetailsView, _super);

    paymentFormKey = "payment-form";

    function PaymentDetailsView(planCode, recurlyPricingPlan, humanResources, nonHumanResources, discountPercentage, migratingFromOldToNewPlan) {
      this.planCode = planCode;
      this.recurlyPricingPlan = recurlyPricingPlan;
      this.humanResources = humanResources;
      this.nonHumanResources = nonHumanResources;
      this.discountPercentage = discountPercentage;
      this.migratingFromOldToNewPlan = migratingFromOldToNewPlan;
      this._validateCoupon = __bind(this._validateCoupon, this);
      this._validateCouponCallback = __bind(this._validateCouponCallback, this);
      this.checkForAndValidateCoupon = __bind(this.checkForAndValidateCoupon, this);
      this._getPricingPlan = __bind(this._getPricingPlan, this);
      this.euCountries = this._getEuCountries();
      this.errorFields = this._getErrorFields();
      this.hideSpinnerCall = _.debounce(((function(_this) {
        return function() {
          return _this.hideSpinner();
        };
      })(this)), 2000);
    }

    PaymentDetailsView.prototype.renderPrices = function() {
      var f;
      this.showSpinner();
      $(".js-coupon-dropdown").removeClass("open");
      $(".js-details-popup.modal").hide();
      this._bindEvents();
      this._bindValidations();
      this._bindFormPersist();
      f = _.debounce(((function(_this) {
        return function() {
          return _this.displayPrices();
        };
      })(this)), 100);
      this.recurlyPricingPlan.on("change", (function(_this) {
        return function(price) {
          _this.price = price;
          return f();
        };
      })(this));
      if ($("#payment_coupon").val() || this.discountPercentage > 0) {
        return this.getCountryCode().then(this.checkForAndValidateCoupon);
      } else {
        return this.getCountryCode().then(this._getPricingPlan);
      }
    };

    PaymentDetailsView.prototype.displayPrices = function() {
      this._setAddonTotal(this.price);
      this._setDiscountAmount(this.price);
      this._setVatAmount(this.price);
      this._setTotalAmount(this.price);
      this._setCreditAmount(this.price);
      this.displayTotalPrice(this.price);
      return this.hideSpinnerCall();
    };

    PaymentDetailsView.prototype._bindFormPersist = function() {
      var $field, applyFunc, formData, key, value, _ref;
      if (localStorage[paymentFormKey] == null) {
        localStorage[paymentFormKey] = JSON.stringify({});
      }
      formData = JSON.parse(localStorage[paymentFormKey]);
      for (key in formData) {
        value = formData[key];
        $field = $("#payment-form #" + key);
        if ($field && $field.attr('type') === 'checkbox') {
          $field.prop("checked", value);
        } else {
          $field.val(value);
        }
      }
      if (formData["payment_country"]) {
        if ((_ref = this.xhr) != null) {
          _ref.abort();
        }
      }
      applyFunc = function(e) {
        $field = $(this);
        value = $field.attr('type') === 'checkbox' ? $field.prop('checked') : $field.val();
        formData[$(this).attr("id")] = value;
        return localStorage[paymentFormKey] = JSON.stringify(formData);
      };
      $("input[type=text]:not(.js-pci-details), select", "#payment-form").on("input", applyFunc);
      return $("input[type=checkbox]").on("change", applyFunc);
    };

    PaymentDetailsView.prototype._bindValidations = function() {
      $('#payment_credit_card_number').on('change', (function(_this) {
        return function() {
          return _this._validateCreditCard();
        };
      })(this));
      $('#payment_cvv').on('change', (function(_this) {
        return function() {
          return _this._validateCVV();
        };
      })(this));
      $('.js-apply-vat').on('click', (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this._validateVatAndGetPricingPlan();
        };
      })(this));
      return $('.js-validate_coupon').on('click', (function(_this) {
        return function(event) {
          return _this.checkForAndValidateCoupon();
        };
      })(this));
    };

    PaymentDetailsView.prototype._validateVatNumber = function() {
      var countryCode, vatNumber;
      vatNumber = $("#payment_vat_number").val();
      countryCode = $("#payment_country").val();
      return Q.Promise(function(resolve, reject, notify) {
        return $.ajax("/vat-number-validation", {
          data: {
            vat_number: vatNumber,
            country: countryCode
          }
        }).done(function() {
          return resolve.apply(null, arguments);
        }).fail(function() {
          return reject.apply(null, arguments);
        });
      });
    };

    PaymentDetailsView.prototype._validateVatAndGetPricingPlan = function() {
      this.showSpinner();
      return this._validateVatNumber().then((function(_this) {
        return function() {
          $(".payment_vat_number span.rg-error").remove();
          $(".payment_vat_number .rg-error").removeClass("rg-error");
          return _this._getPricingPlan().done(function() {
            return _this.hideSpinnerCall();
          });
        };
      })(this))["catch"]((function(_this) {
        return function() {
          $(".payment_vat_number span.rg-error").remove();
          $(".payment_vat_number .rg-error").removeClass("rg-error");
          _this.displayError("vat_number");
          return _this._getPricingPlan().done(function() {
            return _this.hideSpinnerCall();
          });
        };
      })(this));
    };

    PaymentDetailsView.prototype._validateCreditCard = function() {
      $(".number.rg-error").remove();
      if (recurly.validate.cardNumber($('#payment_credit_card_number').val())) {
        this._enableSubmit();
        return;
      }
      $("input[data-recurly='number']").addClass("error").after("<span class='number rg-error'>Please enter a valid credit card number</span>");
      return this._disableSubmitWithoutText();
    };

    PaymentDetailsView.prototype._validateCVV = function() {
      $(".js-cc-expiry-errors").hide();
      if (recurly.validate.cvv($('#payment_cvv').val())) {
        this._enableSubmit();
        return;
      }
      if ($("#payment_cvv").val() === "") {
        this.displayError("cvv");
      } else {
        $("input[data-recurly='cvv']").addClass("error").after("<span class='cvv rg-error'>Please enter a valid security code</span>");
      }
      return this._disableSubmitWithoutText();
    };

    PaymentDetailsView.prototype.displayTotalPrice = function(price) {
      var displayedPrice;
      displayedPrice = new CurrencyConverter(price.now.addons, {
        unit: price.currency.symbol
      }).toString();
      if (this.planCode.indexOf("annual") === -1) {
        return $(".js-total-price").text("" + displayedPrice + " per month");
      } else {
        return $(".js-total-price").text("" + displayedPrice + " per year - including 2 months free!");
      }
    };

    PaymentDetailsView.prototype._bindEvents = function() {
      var view;
      view = this;
      this._bindPreventCouponFromSubmittingForm();
      $('.js-payment-form').on('submit', function(e) {
        var form;
        e.preventDefault();
        $("#payment_vat_number:not(.rg-error)").val($("#payment_vat_number:not(.rg-error):visible").val());
        form = this;
        view.removeErrors();
        if (view.termsAccepted()) {
          view._disableSubmitWithText();
          return view._subscribeToPlan(form);
        } else {
          return view.displayTermsError();
        }
      });
      this._displayVatField();
      this.bindPopverEvents();
      this._cancelAjaxOnClick();
      return this._bindCloseModal();
    };

    PaymentDetailsView.prototype._bindCloseModal = function() {
      $("#modal").one("hidden.bs.modal", function() {
        return localStorage.removeItem(paymentFormKey);
      });
      return $(".js-payment-back").one("click", function() {
        return $("#modal").off("hidden.bs.modal");
      });
    };

    PaymentDetailsView.prototype._bindPreventCouponFromSubmittingForm = function() {
      return $('#payment_coupon').on('keydown', function(e) {
        if (e.keyCode === 13) {
          e.stopPropagation();
          e.preventDefault();
          return $(".js-validate_coupon").trigger("click");
        }
      });
    };

    PaymentDetailsView.prototype._subscribeToPlan = function(form) {
      if (this.migratingFromOldToNewPlan) {
        delete localStorage[paymentFormKey];
        return this._submitForm();
      } else {
        return this._requestRecurlyTokenAndSubmit(form);
      }
    };

    PaymentDetailsView.prototype._requestRecurlyTokenAndSubmit = function(form) {
      $("#payment_coupon").val(this.largestCouponCode);
      return recurly.token(form, (function(_this) {
        return function(recurlyError) {
          if (recurlyError) {
            recurlyError = _this.addOptionalValidationAttributes(recurlyError);
            return _this.handleErrors(recurlyError);
          } else {
            _this.stripNameAttributes();
            delete localStorage[paymentFormKey];
            return _this._submitForm();
          }
        };
      })(this));
    };

    PaymentDetailsView.prototype._submitForm = function() {
      return $.ajax({
        url: "/recurly",
        type: "POST",
        data: {
          payment: this._formData()
        },
        dataType: 'json',
        success: function(response) {
          return window.location = response.redirect_to;
        },
        error: (function(_this) {
          return function(response) {
            $(".js-payment-error").show();
            $(".js-payment-error-text").text(response.responseJSON.error);
            return _this._enableSubmit();
          };
        })(this)
      });
    };

    PaymentDetailsView.prototype._formData = function() {
      return {
        recurly_token: $("#payment_recurly-token").val(),
        coupon: $("#payment_coupon").val(),
        plan_code: $("#payment_plan_code").val()
      };
    };

    PaymentDetailsView.prototype._cancelAjaxOnClick = function() {
      return $("body").on("click", function() {
        if (this.xhr && this.xhr.readystate !== 4) {
          return this.xhr.abort();
        }
      });
    };

    PaymentDetailsView.prototype.bindPopverEvents = function() {
      var popoverEventBinder;
      popoverEventBinder = new PopoverEventBinder;
      return popoverEventBinder.bindEvents();
    };

    PaymentDetailsView.prototype.addOptionalValidationAttributes = function(recurlyError) {
      if ($("#payment_cvv").val() === "") {
        recurlyError.fields.push("cvv");
      }
      if ($("#payment_address1").val() === "") {
        recurlyError.fields.push("address1");
      }
      recurlyError.fields = _.unique(recurlyError.fields);
      return recurlyError;
    };

    PaymentDetailsView.prototype.stripNameAttributes = function() {
      var inputs;
      inputs = $("input:not(#payment_recurly-token, #payment_plan_code, #payment_coupon)");
      inputs.each(function(num, input) {
        return $(input).removeAttr("name");
      });
      return $("select#payment_country").removeAttr("name");
    };

    PaymentDetailsView.prototype.termsAccepted = function() {
      return $("input#understand_automated_charges").prop("checked");
    };

    PaymentDetailsView.prototype.removeErrors = function() {
      $('input').removeClass('rg-error');
      $(".js-payment-error").hide();
      $(".js-cc-expiry-errors").hide();
      $('span.rg-error:not(.js-expiry-error)').remove();
      $('.understand_automated_charges.rg-error').hide();
      return $('.js-expiry-error').hide();
    };

    PaymentDetailsView.prototype._setAddonTotal = function(price) {
      var subtotalAmount;
      subtotalAmount = new CurrencyConverter(price.now.addons, {
        unit: price.currency.symbol
      }).toString();
      return $('.js-addon-total').text("" + subtotalAmount);
    };

    PaymentDetailsView.prototype._displayVatField = function() {
      return $('#payment_country').on('change init', (function(_this) {
        return function() {
          _this._showVATFieldIfInEU();
          return _this._validateVatAndGetPricingPlan();
        };
      })(this));
    };

    PaymentDetailsView.prototype._getPricingPlan = function(callback) {
      if (callback == null) {
        callback = false;
      }
      return Q.Promise((function(_this) {
        return function(resolve, reject) {
          _this.showSpinner();
          return _this.recurlyPricingPlan.plan(_this.planCode, {
            quantity: 0
          }).currency('USD').coupon((_this.largestCouponCode ? _this.largestCouponCode : $('#payment_coupon').val()), callback).address({
            country: $('#payment_country').val()
          }).tax({
            tax_code: 'digital',
            vat_number: $("#payment_vat_number:not(.rg-error)").val(),
            region: $('#payment_country').val()
          }).addon('human', {
            quantity: _this.humanResources
          }).addon('non_human', {
            quantity: _this.nonHumanResources
          })["catch"](function() {
            _this.showTemporaryError();
            return reject();
          }).done(function() {
            return resolve();
          });
        };
      })(this));
    };

    PaymentDetailsView.prototype._setVatAmount = function(price) {
      var taxRate, taxRates, vatAmount;
      taxRates = _.map(price.taxes, (function(_this) {
        return function(tax) {
          return tax.rate;
        };
      })(this));
      taxRate = taxRates[0];
      if (taxRate) {
        vatAmount = new CurrencyConverter(price.now.tax, {
          unit: price.currency.symbol
        }).toString();
        $(".js-country-vat").text("" + ($('#payment_country').val()) + " VAT " + (taxRate * 100) + "%");
        return $('.js-tax').text("" + vatAmount);
      } else {
        $(".js-country-vat").text("");
        return $('.js-tax').text("");
      }
    };

    PaymentDetailsView.prototype._setDiscountAmount = function(price) {
      var discountAmount;
      if (+price.now.discount > 0) {
        $(".js-discount-header").show();
        discountAmount = new CurrencyConverter(price.now.discount, {
          unit: price.currency.symbol
        }).toString();
        return $('.js-discount').text("" + discountAmount);
      } else {
        return $(".js-discount-header").hide();
      }
    };

    PaymentDetailsView.prototype.checkForAndValidateCoupon = function() {
      var couponCode;
      $(".js-coupon-dropdown .rg-error").remove();
      couponCode = $('#payment_coupon').val();
      this.showSpinner();
      if (couponCode.length === 0) {
        $(".coupon .rg-error").remove();
        return this._getLargestCoupon(couponCode);
      } else {
        return $.getJSON("/coupon-validation?coupon_code=" + couponCode).then((function(_this) {
          return function(valid) {
            $(".coupon .rg-error").remove();
            if (valid) {
              return _this.applyCoupon();
            } else {
              $(".js-validate_coupon").after($(document.createElement("span")).addClass("rg-error").text("Please enter a valid coupon code"));
              if (_this.applied) {
                return _this.hideSpinnerCall();
              } else {
                return _this._getLargestCoupon(couponCode);
              }
            }
          };
        })(this));
      }
    };

    PaymentDetailsView.prototype.applyCoupon = function() {
      var couponCode;
      couponCode = $('#payment_coupon').val();
      if (couponCode || this.discountPercentage > 0) {
        this._disableSubmitWithText();
        this.showSpinner();
        return this._getLargestCoupon(couponCode);
      } else {
        $("#payment_coupon").after($(document.createElement("span")).addClass("rg-error").text("Please enter a coupon code"));
        return this._disableSubmitWithoutText();
      }
    };

    PaymentDetailsView.prototype._getLargestCoupon = function(couponCode) {
      this.applied = true;
      return $.ajax({
        type: "GET",
        url: "/largest_coupon",
        data: {
          current_coupon_code: this.appliedCouponCode,
          coupon_code: couponCode,
          plan_code: this.planCode
        },
        success: (function(_this) {
          return function(response) {
            _this.largestCouponCode = response.largest_coupon_code;
            return _this._validateCoupon();
          };
        })(this),
        error: (function(_this) {
          return function() {
            _this.largestCouponCode = couponCode;
            return _this._validateCoupon();
          };
        })(this),
        complete: (function(_this) {
          return function() {
            _this.appliedCouponCode = _this.largestCouponCode;
            if (_this.appliedCouponCode && _this.appliedCouponCode.length) {
              if (!_this._isTrialDiscount()) {
                return $('#payment_coupon').val(_this.appliedCouponCode);
              }
            }
          };
        })(this)
      });
    };

    PaymentDetailsView.prototype._isTrialDiscount = function() {
      var _ref;
      return (_ref = this.appliedCouponCode) != null ? _ref.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) : void 0;
    };

    PaymentDetailsView.prototype._setTotalAmount = function(price) {
      var totalAmount;
      totalAmount = new CurrencyConverter(price.now.total, {
        unit: price.currency.symbol
      }).toString();
      return $('.js-total').text("" + totalAmount);
    };

    PaymentDetailsView.prototype._setCreditAmount = function(price) {
      var creditAmount, formatedCreditAmount;
      creditAmount = price.now.addons - price.now.discount;
      if (creditAmount < 0) {
        formatedCreditAmount = new CurrencyConverter(creditAmount, {
          unit: price.currency.symbol
        }).toString();
        $('.js-credit').text("" + formatedCreditAmount);
        return $('.js-credit-row').show();
      } else {
        return $('.js-credit-row').hide();
      }
    };

    PaymentDetailsView.prototype._validateCouponCallback = function(err, res) {
      if (err || !res) {
        $('.js-coupon-dropdown .rg-error').remove();
        $(".js-validate_coupon").after($(document.createElement("span")).addClass("rg-error").text("Coupon code is invalid"));
        if ($("#payment_coupon").val().length) {
          $(".js-coupon-dropdown").addClass("open");
          return this._disableSubmitWithoutText();
        }
      } else {
        $(".js-coupon-dropdown").removeClass("open");
        return this._enableSubmit();
      }
    };

    PaymentDetailsView.prototype._validateCoupon = function() {
      return this._getPricingPlan(this._validateCouponCallback);
    };

    PaymentDetailsView.prototype._getErrorFields = function() {
      return _.extend(PaymentDetailsView.__super__._getErrorFields.apply(this, arguments), {
        coupon: 'a coupon code'
      });
    };

    PaymentDetailsView.prototype.getCountryCode = function() {
      return Q.Promise((function(_this) {
        return function(resolve, reject, notify) {
          return _this.xhr = $.ajax({
            url: "https://ipinfo.io?token=e543e059e587b3",
            dataType: "json",
            success: function(response) {
              return $("#payment_country").val(response.country);
            },
            complete: function() {
              _this._showVATFieldIfInEU();
              return resolve();
            }
          });
        };
      })(this));
    };

    PaymentDetailsView.prototype._showVATFieldIfInEU = function() {
      if (this.euCountries.indexOf($("#payment_country").val()) !== -1) {
        return $('.js-vat-input').show();
      } else {
        return $('.js-vat-input').hide();
      }
    };

    PaymentDetailsView.prototype.displayTermsError = function() {
      $("input#understand_automated_charges").addClass("rg-error");
      return $(".understand_automated_charges.rg-error").show();
    };

    PaymentDetailsView.prototype.handleErrors = function(err) {
      if (err.message === "Timeout") {
        return this.showTemporaryError();
      } else {
        $.map(err.fields, (function(_this) {
          return function(field) {
            if (_this.cardExpired(field)) {
              return $(".js-expiry-error").show();
            } else {
              return _this.displayError(field);
            }
          };
        })(this));
        return this._enableSubmit();
      }
    };

    PaymentDetailsView.prototype.cardExpired = function(field) {
      return (field === "month" || field === "year") && ($("#payment_month").val() !== "" && $("#payment_year").val() !== "");
    };

    PaymentDetailsView.prototype.showSpinner = function() {
      $(".js-total-cost-spinner").show();
      return $(".js-total-cost").hide();
    };

    PaymentDetailsView.prototype.showTemporaryError = function() {
      $(".js-billing-form").hide();
      $('.js-pricing-period').hide();
      $('.js-payment-header').hide();
      $(".js-total-cost-spinner").hide();
      return $(".js-temporary-error").show();
    };

    PaymentDetailsView.prototype.hideSpinner = function() {
      $(".js-total-cost-spinner").hide();
      return $(".js-total-cost").show();
    };

    PaymentDetailsView.prototype._disableSubmitWithText = function() {
      return $('.js-subscribe-button').attr("disabled", "disabled").addClass("disabled").val("Busy, please wait...");
    };

    PaymentDetailsView.prototype._disableSubmitWithoutText = function() {
      return $('.js-subscribe-button').attr("disabled", "disabled").addClass("disabled");
    };

    PaymentDetailsView.prototype._enableSubmit = function() {
      return $('.js-subscribe-button').removeAttr('disabled').removeClass("disabled").val("Subscribe");
    };

    return PaymentDetailsView;

  })(AbstractCreditCardView);

}).call(this);
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));
(function() {
  var SavingsCalculator;

  SavingsCalculator = (function() {
    function SavingsCalculator(people, minutesSaved, rate, daysPerMonth) {
      this.people = people;
      this.minutesSaved = minutesSaved;
      this.rate = rate;
      this.daysPerMonth = daysPerMonth != null ? daysPerMonth : 20;
    }

    SavingsCalculator.prototype.calculate = function() {
      return {
        perPersonSaving: this._calculatePerPersonSaving(),
        totalCostSavedMonthly: this._calculateTotalCostSavedMonthly(),
        totalTimeSavedMonthly: this._calculateTotalTimeSavedMonthly(),
        isValid: this._validate()
      };
    };

    SavingsCalculator.prototype._calculatePerPersonSaving = function() {
      return this.minutesSaved / 60 * this.rate * this.daysPerMonth;
    };

    SavingsCalculator.prototype._calculateTotalCostSavedMonthly = function() {
      return this._calculatePerPersonSaving() * this.people;
    };

    SavingsCalculator.prototype._calculateTotalTimeSavedMonthly = function() {
      return this.people * this.daysPerMonth * this.minutesSaved / 60;
    };

    SavingsCalculator.prototype._validate = function() {
      return this.people > 0 && this.minutesSaved > 0 && this.rate > 0 && this.daysPerMonth > 0;
    };

    return SavingsCalculator;

  })();

  $(function() {
    var addToolTip, checkPlanPeriod, convertUnits, removeToolTip, replaceSavingsResults, toggleBoldOption, togglePaymentPeriod, toggleSelectedPaymentPeriod;
    $(".pricing-content-block.monthly").hide();
    $('.js-toggle-price').on('click', function() {
      toggleBoldOption();
      toggleSelectedPaymentPeriod();
      return togglePaymentPeriod();
    });
    toggleBoldOption = function() {
      $('.js-annual-option').toggleClass('is--bold');
      return $('.js-monthly-option').toggleClass('is--bold');
    };
    toggleSelectedPaymentPeriod = function() {
      $('.pricing-content-block.annual').toggle();
      return $('.pricing-content-block.monthly').toggle();
    };
    togglePaymentPeriod = function() {
      var period;
      period = new RecurlyPaymentPeriod($("#payment_period").val());
      if (period.isAnnual()) {
        return $("#payment_period").val("monthly");
      } else {
        return $("#payment_period").val("annual");
      }
    };
    checkPlanPeriod = function() {
      var period;
      period = new RecurlyPaymentPeriod($(".js-period-toggler").data("current-plan"));
      if (period.isMonthly()) {
        return toggleSelectedPaymentPeriod();
      }
    };
    checkPlanPeriod();
    convertUnits = function(field, $el) {
      var converter, prefix, suffix;
      suffix = $el.data('suffix') || "";
      prefix = $el.data('prefix') || "";
      converter = new CurrencyConverter(field, {
        precision: 0,
        unit: prefix,
        suffix: suffix
      });
      return converter.toString();
    };
    replaceSavingsResults = function(result) {
      var k, v, _results;
      _results = [];
      for (k in result) {
        v = result[k];
        $("section.js-savings-calculator [data-field=" + k + "]").text(function() {
          var $el;
          $el = $(this);
          return convertUnits(v, $el);
        });
        if (v.toString().length > 8) {
          addToolTip(k, v);
        } else {
          removeToolTip(k);
        }
        _results.push($("section.js-savings-calculator [data-field=" + k + "]").removeAttr("title"));
      }
      return _results;
    };
    addToolTip = function(field, value) {
      $("section.js-savings-calculator [data-field=" + field + "]").attr("data-original-title", function() {
        var $el;
        $el = $(this);
        return convertUnits(value, $el);
      });
      $("section.js-savings-calculator [data-field=" + field + "]").attr("title", function() {
        var $el;
        $el = $(this);
        return convertUnits(value, $el);
      });
      return $("section.js-savings-calculator [data-field=" + field + "]").tooltip();
    };
    removeToolTip = function(field) {
      return $("section.js-savings-calculator [data-field=" + field + "]").removeAttr("data-original-title");
    };
    return $('section.js-savings-calculator').on('input', function() {
      var calculator, hours, minutes, people, rate, result;
      people = +$('#savings_people_count').val();
      hours = +$('#savings_hours').val();
      minutes = +$('#savings_minutes').val();
      rate = +$('#savings_rate').val();
      calculator = new SavingsCalculator(people, (hours * 60) + minutes, rate);
      result = calculator.calculate();
      if (result.isValid) {
        $('section.js-savings-calculator span.rg-error').hide();
        return replaceSavingsResults(result);
      } else {
        return $('section.js-savings-calculator span.rg-error').show();
      }
    });
  });

  $(document).ready(function() {
    var date, diffTime, duration, now, updateTimer;
    date = moment($('.js-countdown').data('ending-date')).unix();
    now = moment().unix();
    diffTime = date - now;
    duration = moment.duration(diffTime * 1000, 'milliseconds');
    updateTimer = function() {
      duration = moment.duration(duration - 1000, 'milliseconds');
      if (duration.asMilliseconds() < 0) {
        return;
      }
      $('.js-countdown .days-count').text(duration.days());
      $('.js-countdown .hours-count').text(duration.hours());
      $('.js-countdown .minutes-count').text(duration.minutes());
      return $('.js-countdown .seconds-count').text(duration.seconds());
    };
    setInterval(updateTimer, 1000);
    return updateTimer();
  });

}).call(this);
