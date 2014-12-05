/*! intercept.js 0.0.1 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root['$it'] = factory;
    }
})(this, function (options) {

    "use strict";

    var op = Object.prototype;

    var firefox = !!window.netscape;

    var go = firefox ? 'blur' : 'focusout';

    //forms集合
    var ruleArray = {};

    //简单过滤后的dom,以及初始状态
    var controller = {};

    var flawless = [];

    var it = function (selector) {
        var self = it.prototype,
            elements = [];
        if (typeof selector === 'string') {
            elements = $.toArray(document.querySelectorAll(selector));
        } else if (typeof selector === 'object' && selector.attributes) {
            elements = [selector];
        }
        self._elem = elements;
        return self;
    }

    ////////////////////
    // 为it添加工具方法 //
    ////////////////////

    it.prototype = {

        version: '0.0.1',

        constructor: it,

        trim: function (str) {
            return str.replace(/^\s+|\s+$/g, '');
        },

        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        mixIn: function (target) {
            for (var i = 0, arg, args = arguments; arg = args[i++];) {
                if (arg !== target) {
                    for (var prop in arg) {
                        target[prop] = arg[prop];
                    }
                }
            }
            return target;
        },
        toArray: function (iterable) {
            if ('\v' == 'v') {
                var len = iterable.length, arr = new Array(len);
                while (len--)
                    arr[len] = iterable[len];
                return arr;
            }
            return [].slice.call(iterable);
        },
        getItAttr: function (attrs) {
            var itA = [], i = 0, attr,
                chaos = $.toArray(attrs);
            while (attr = chaos[i++]) {
                var nodeName = attr.nodeName;
                (nodeName.charAt(2) === '-' && nodeName.slice(0, 2) === 'it') && itA.push(attr);
            }
            return itA;
        },
        camelize: function (target) {
            return target.replace(/[-][^-]/g, function(match) {
                return match.charAt(1).toUpperCase();
            });
        }
    }

    ////////////////////
    // 为it添加基础方法 //
    ////////////////////
    /* form--初始化 */
    it.prototype.init = function () {
        var formCollection = document.forms;
        if (!formCollection.length)return;
        loop : for (var i = 0, el; el = formCollection[i++];) {
            var elAttr = el.getAttribute('it-controller');
            if (typeof elAttr === 'string') {
                if (!!$.trim(elAttr)) {
                    ruleArray[elAttr] = el;
                } else {
                    ruleArray = el;
                    break loop;
                }
            }
        }
        //获得整洁的it字段
        $.getNeatField();
    }

    //获取纯洁处理对象
    it.prototype.getNeatField = function () {
        if (!$.isEmptyObject(ruleArray)) {
            ruleArray = ruleArray.nodeName ? {'it': ruleArray} : ruleArray;
            for (var prop in ruleArray) {
                var frChild = ruleArray[prop].elements;
                controller[prop] = {};
                controller[prop]['status'] = false;
                controller[prop]['elem'] = [];
                for (var i = 0, el; el = frChild[i++];) {
                    if ($.filterType(el)) {
                        controller[prop]['elem'].push(el);
                    }
                }
            }
        } else {
            throw new SyntaxError('请确认表单form标签已有"it-controller"属性!');
        }
    }

    //简单的serialize
    it.prototype.filterType = function (node) {
        switch (node.type) {
            case undefined:
            case 'file':
            case 'submit':
            case 'reset':
            case 'button':
            case 'fieldset':
            case  'radio':
            case  'checkbox':
                break;
            default:
                if (node.name.length) {
                    return true;
                }
        }
    }

    /* formelements 事件捆绑 */
    it.prototype.events = function () {
        controller && void function () {
            var prop, el;
            for (prop in controller) {
                var i = 0;
                while (el = controller[prop]['elem'][i++]) {
                    switch (el.type) {
                        case 'select-one':
                        case 'select-multiple':
                            void function (p) {
                                $.watch(p, el.name, el);
                                it(el).on('change', function () {
                                    var me = this;
                                    $scope[p + '$' + me.name] = me.value;
                                    $scope.$digest();
                                });
                            }(prop);
                            break;
                        default:
                            void function (p) {
                                $.watch(p, el.name, el);
                                it(el).on(go, function () {
                                    var me = this;
                                    $scope[p + '$' + me.name] = me.value;
                                    $scope.$digest();
                                });
                            }(prop);
                    }
                }
            }
        }();
    }
    /*   绑定watch  */
    it.prototype.watch = function (controller, name, elem) {
        $scope.$watch(function () {
            return $scope[controller + '$' + name];
        }, function (newValue) {
            var itArray = $.getItAttr(elem.attributes),
                i= 0,node;
                while(node=itArray[i++]){
                    var filterName = $.camelize(node.nodeName),
                        isVia = $scope.$filter[filterName] && $scope.$filter[filterName](newValue,node.value),
                        control = controller;
                    if(isVia){
                        console.log(newValue)
                    }else{

                    }

                }

            //执行过滤行为
        });
    }

    it.prototype.on = function (event, fn) {
        var self = this,
            elements = self._elem;
        for (var i = 0, el; el = elements[i++];) {
            if (document.addEventListener) {
                el.addEventListener(event, fn, false);
            } else if (document.attachEvent) {
                el.attachEvent('on' + event, fn);
            }
        }
    }

    it.prototype.ready = function (callback) {
        var fired = false;

        function trigger() {
            if (fired) return;
            fired = true;
            callback();
        }

        if (document.readyState === 'complete') {
            setTimeout(trigger);
        } else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', trigger, false);
            window.addEventListener('load', trigger, false);
        } else {
            document.attachEvent('onreadystatechange', function () {
                if (document.readyState === 'complete') {
                    trigger();
                }
            });
        }
    }

    //////////////
    //   watch  //
    //////////////

    var Scope = function () {
        this.$$watchers = [];
    }

    Scope.prototype.$watch = function (watchExp, listener) {
        this.$$watchers.push({
            watchExp: watchExp,
            listener: listener || function () {
            }
        });
    }

    Scope.prototype.$digest = function () {
        var dirty;
        do {
            var i = 0, watcher;
            dirty = false;
            while (watcher = this.$$watchers[i++]) {
                var newValue = watcher.watchExp(),
                    oldValue = watcher.last;
                oldValue !== newValue && (
                    watcher.listener(newValue),
                        dirty = true,
                        watcher.last = newValue
                    );
            }
        } while (dirty);
    }

    Scope.prototype.$filter = {
        'itMaxlength': function () {
            var args = $.toArray(arguments);
            return args[0].length <= (+args[1]);
        }
    }


    //////////////
    //   实例化  //
    //////////////

    var $ = new it();
    var $scope = new Scope();
    var defaults = {
        'clearOriginal': true
    }

    //合并基础配置
    $.mixIn(defaults, options.base);

    $.ready(function () {
        //初始化获得纯净form-elements
        $.init();
        //绑定事件处理
        $.events();

    });

    //返回公共对象
    return {'version': $.version, 'url': 'qingdou.me'}

});


