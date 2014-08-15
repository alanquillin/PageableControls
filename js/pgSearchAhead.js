
    /* pgSearchAhead class definition
     * ================================= */

    var PGSearchAhead = function (element, options) {
        var that = this;
        this.options = $.extend({}, $.fn.pgSearchAhead.defaults, options);

        // initialize methods
        this.highlighter = this.options.highlighter || this.highlighter;
        this.search = this.options.search || this.search;
        this.process = this.options.process || this.process;
        this.render = this.options.render || this.render;
        this.buildFooter = this.options.buildFooter || this.buildFooter;
        this.buildQueryObject = this.options.buildQueryObject || this.buildQueryObject;

        // initialize objects
        this.$element = $(element);
        this.$menu = $(this.options.menu);

        // initialize properties
        this.shown = false;
        this.loaded = false;
        this.url = this.options.url;
        this.item = this.options.item;
        this.footer = this.options.footer;
        this.minLength = this.options.minLength;
        this.itemIdProperty = this.options.itemIdProperty;
        this.itemContentProperty = this.options.itemContentProperty;
        this.itemsProperty = this.options.itemsProperty;
        this.totalProperty = this.options.totalProperty;

        this.pager = this.options.pager || new Pager({});
        $(this.pager).on('onRefresh', function(event, data){
            var wasPagedRequest = this.isPagedRequest;
            this.isPagedRequest = true;
            that.search(data.currentPage, data.pageSize, wasPagedRequest, function(d){ data.onComplete(d[that.totalProperty]); });
        });

        // start
        this.setListeners();
        this.buildFooter();
    };

    PGSearchAhead.prototype = {

        constructor: PGSearchAhead,

        select: function () {
            var selectedItem = this.$menu.find('.active');
            var val = selectedItem.data('data-value');
            if (Utils.isNullOrWhitespace(val))
                return;

            this.$element.trigger("onItemSelected", val);
            return this.hide();
        },
        show: function () {
            var pos = $.extend({}, this.$element.position(), {
                height: this.$element[0].offsetHeight
            });

            this.$menu
                .insertAfter(this.$element)
                .css({
                    top: pos.top + pos.height,
                    left: pos.left
                })
                .show();

            this.shown = true;
            return this;
        },
        hide: function () {
            this.$menu.hide();
            this.shown = false;
            return this;
        },
        abort: function(){
            if (this.req)
                try{ this.req.abort(); } catch (e) {}
            return this;
        },
        search: function (page, limit, isPagedRequest, onComplete) {
            var query = this.$element.val();

            this.abort();

            if (!query || query.length < this.minLength) {
                return this.shown ? this.hide() : this;
            }

            var that = this;
            this.searchStarted(query);

            this.req = $.get(this.url, this.buildQueryObject(query, page, limit),
                function ( data, textStatus, jqXHR) {
                    if (typeof (data) === 'undefined' || !data || data.error) {
                        that.searchFailed(jqXHR, textStatus, data.error);
                        return;
                    }

                    if(query != that.$element.val())
                        return null;

                    that.searchComplete(data);

                    if(onComplete)
                        onComplete(data);

                    that.process(data, query, isPagedRequest);
                    this.req = null;
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    that.searchFailed(jqXHR, textStatus, errorThrown);
                    return that;
                });
            return this;
        },
        buildQueryObject: function(query, page, limit){
            return { query: query, page: page, limit: limit };
        },
        searchStarted: function(query){
            this.$element.trigger('onSearchStarted', query);
        },
        searchComplete: function(data){
            this.$element.trigger('onSearchComplete', data);
        },
        searchFailed: function(jqXHR, textStatus, errorThrown){
            if (textStatus == 'abort')
                return;

            this.$element.trigger('onSearchFailed', errorThrown);
        },
        process: function (data, query, isPagedRequest) {
            var items = data[this.itemsProperty];
            if (!items.length) {
                return this.shown ? this.hide() : this;
            }

            this.render(items, query, data[this.totalProperty], !isPagedRequest);
            this.loaded = true;
            return this.show();
        },
        highlighter: function (item, query) {
            if(typeof(item) == 'object') {
                if(!item.hasOwnProperty(this.itemContentProperty))
                    return null;

                item[this.itemContentProperty] = this.highlighter(item[this.itemContentProperty], query);
                return item[this.itemContentProperty];
            }

            query = query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong class="highlight">' + match + '</strong>';
            });
        },
        render: function (items, query, total, selectFirstItem) {
            var that = this;

            items = $(items).map(function (i, item) {
                i = $(that.item).data('data-value', item);
                i.find('a').html(that.highlighter(item, query));
                return i[0];
            });

            if(selectFirstItem)
                items.first().addClass('active');

            var $ul = this.$menu.find('ul');
            $ul.find('li:not(.search_footer)').remove();
            $ul.prepend(items);
            var $footer = $ul.find('li.search_footer');
            if(total > items.length)
                $footer.show();
            else
                $footer.hide();
            return this;
        },
        next: function (event) {
            var active = this.$menu.find('.active').removeClass('active');
            next = active.next();

            if (!next.length)
                next = $(this.$menu.find('li')[0]);

            next.addClass('active');
            return this;
        },
        prev: function (event) {
            var active = this.$menu.find('.active').removeClass('active');
            prev = active.prev();

            if (!prev.length)
                prev = this.$menu.find('li').last();

            prev.addClass('active');
            return this;
        },
        setListeners: function () {
            this.$element
                .on('focus',    $.proxy(this.focus, this))
                .on('blur',     $.proxy(this.blur, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',    $.proxy(this.keyup, this));

            if (this.eventSupported('keydown')) {
                this.$element.on('keydown', $.proxy(this.keydown, this));
            }

            this.$menu
                .on('click', $.proxy(this.click, this))
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
                .on('mouseleave', 'li', $.proxy(this.mouseleave, this));
        },
        eventSupported: function(eventName) {
            var isSupported = eventName in this.$element;
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;');
                isSupported = typeof this.$element[eventName] === 'function';
            }
            return isSupported;
        },
        move: function (e) {
            if (!this.shown) return;

            switch(e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault();
                    break;

                case 38: // up arrow
                    e.preventDefault();
                    this.prev();
                    break;

                case 40: // down arrow
                    e.preventDefault();
                    this.next();
                    break;
            }

            e.stopPropagation();
            return this;
        },
        keydown: function (e) {
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27]);
            return this.move(e);
        },
        keypress: function (e) {
            if (this.suppressKeyPressRepeat) return;
            return this.move(e);
        },
        keyup: function (e) {
            switch(e.keyCode) {
                case 40: // down arrow
                case 38: // up arrow
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break;

                case 9: // tab
                case 13: // enter
                    if (!this.shown) return;
                    this.select();
                    break;

                case 27: // escape
                    if (!this.shown) return;
                    this.hide();
                    break;

                default:
                    this.loaded = false;
                    this.isPagedRequest = false;
                    this.pager.reset();
                    this.pager.refresh();
                    break;
            }

            e.stopPropagation();
            e.preventDefault();
            return this;
        },
        focus: function (e) {
            this.focused = true;
            if(this.loaded) this.show();
            return this;
        },
        blur: function (e) {
            this.focused = false;
            if (!this.mousedover && this.shown) {
                this.hide();
                this.abort();
            }
            return this;
        },
        click: function (e) {
            e.stopPropagation();
            e.preventDefault();
            this.select();
        },
        mouseenter: function (e) {
            this.mousedover = true;
            this.$menu.find('.active').removeClass('active');
            var target = $(e.currentTarget);
            if(!target.hasClass('search_footer'))
                target.addClass('active');
            return this;
        },
        mouseleave: function (e) {
            this.mousedover = false;
            if (!this.focused && this.shown) this.hide();
            return this;
        },
        buildFooter: function(){
            var $footer = $(this.footer)
                .on('click', $.proxy(function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    this.$element.focus();
                }, this))
                .append(this.pager.$container);
            this.$menu.find('ul').append($footer);
            return this;
        }
    };


    /* pgSearchAhead Plugin Definition
     * =========================== */

     $.fn.pgSearchAhead = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('pgSearchAhead'),
                options = typeof option == 'object' && option;
            if (!data) $this.data('pgSearchAhead', (data = new PGSearchAhead(this, options)));
            if (typeof option == 'string') data[option]();
        });
    };

    $.fn.pgSearchAhead.defaults = {
        menu: '<div class="search-results dropdown-menu pgSearchAhead"><ul></ul></div>',
        item: '<li><a href="#"></a></li>',
        footer: '<li class="search_footer"></li>',
        itemIdProperty: 'id',
        itemContentProperty: 'content',
        totalProperty: 'total',
        itemsProperty: 'items',
        minLength: 3,
        url: null
    };

    $.fn.pgSearchAhead.Constructor = PGSearchAhead;