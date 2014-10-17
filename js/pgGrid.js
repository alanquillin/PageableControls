
    /* pgGrid class definition
     * ================================= */

    var PGGrid = function (element, url, dataModel, options) {
        var that = this;
        this.$element = $(element);
        this.$element.empty();

        this.url = url;
        this.dataModel = dataModel || this.defaults.dataModel;

        // initialize and aggregate options
        this.options = $.extend({}, $.fn.pgGrid.defaults, options);

        // initialize properties
        this.item = this.options.item;
        this.childRowProperty = this.options.childRowProperty;
        this.expandedRowIds = [];
        this.sortColumn = this.options.sortColumn;
        this.sortDirection = this.options.sortDirection;
        this.dataTotalProperty = this.options.dataTotalProperty;
        this.dataItemProperty = this.options.dataItemProperty;
        this.padLeft = this.options.padLeft;
        this.itemIdProperty = this.options.itemIdProperty;
        this.showLoaderOnRefresh = Utils.getOption(this.options, "showLoaderOnRefresh", false);
        this.showTitle = Utils.getOption(this.options, "showTitle", true);
        this.showPager = Utils.getOption(this.options, "showPager", true);
        this.addGhostChildRowWhenCountIsNotEvent = Utils.getOption(this.options, "addGhostChildRowWhenCountIsNotEvent", true);

        // initialize methods
        this.getData = this.options.getData || this.getData;
        this.process = this.options.process || this.process;
        this.render = this.options.render || this.render;
        this.buildFooter = this.options.buildFooter || this.buildFooter;
        this.onSuccess = this.options.onSuccess || function(){ return; };
        this.onError = this.options.onError || function () { return; };
        this.buildQueryObject = this.options.buildQueryObject || this.buildQueryObject;
        this.rowFormatter = this.options.rowFormatter || function() {return;};

        // initialize objects
        this.$grid = $('<table class="pgGrid"><thead><tr></tr></thead><tbody></tbody></table>');
        this.$title = $(this.options.title);
        this.$initLoader = $(this.options.initLoader);
        this.$header = this.$grid.find('thead');
        this.$body = this.$grid.find('tbody');

        if(!this.options.pagerContainer){
            this.$footer = $('<tfoot><tr><td></td></tr></tfoot>');
            this.$footerRow = this.$footer.find('td:first').attr('colspan', this.dataModel.length);

            if(this.showPager)
                this.$grid.append(this.$footer);

            this.$pagerContainer = this.$footerRow;
        }
        else{
            this.$pagerContainer = this.options.pagerContainer;
        }

        // initialize pager
        this.pager = this.options.pager || new Pager({});
        $(this.pager).on('onRefresh', function(event, data){
            if(that.showLoaderOnRefresh){
                that.$initLoader.show();
            }
            that.refresh(data.currentPage, data.pageSize,
                function(d){ data.onComplete(d[that.dataTotalProperty]); });
        });

        // bind title, table
        this.$grid.addClass(this.options.gridClass);
        if(this.showTitle)
            this.$element.append(this.$title);
        this.$element.append(this.$initLoader);
        this.$initLoader.show();
        this.buildHeader();
        this.buildFooter();

        // load data
        this.hide();
        this.$element.append(this.$grid);
        this.pager.getPage();
    };

    PGGrid.prototype = {
        constructor: PGGrid,
        hide : function() {
            this.$grid.hide();
        },
        show: function() {
            this.$grid.show();
        },
        refresh: function(page, pageSize, onComplete){
            var that = this;
            var process = $.proxy(this.process, this);

            this.getData(page, pageSize, this.sortColumn, this.sortDirection,
                function(data, textStatus, jqXHR){
                    that.onSuccess(data, textStatus, jqXHR);
                    process(data);
                    that.show();
                    if(onComplete)
                        onComplete(data);
                    that.$initLoader.hide();
                }, this.onError);
        },
        getData: function(page, pageSize, sortCol, sortDir, onSuccess, onFail) {
            $.get(this.url, this.buildQueryObject(page, pageSize, sortCol, sortDir),
                onSuccess).fail(onFail);
        },
        buildQueryObject: function(page, pageSize, sortCol, sortDir) {
            return { page: page, limit: pageSize, sort_column: sortCol, sort_direction: sortDir };
        },
        process: function (data) {
            if (!data || !data[this.dataItemProperty] || !data[this.dataItemProperty].length) {
                return this.hide();
            }

            this.render(data);
            this.$element.trigger("OnDataLoadComplete", {});
            return this;
        },
        render: function(data) {
            this.buildBody(data);
            return this;
        },
        buildBody: function(data){
            this.$body.empty();

            for (var i in data[this.dataItemProperty]) {
                this.buildRow(data[this.dataItemProperty][i], 0);
            }
        },
        buildRow: function(item, childLevel, parentId){
            var that = this;
            var id = item[this.itemIdProperty];

            var $row = $("<tr></tr>")
                .attr('id', id)
                .on('mouseEnter', 'tbody tr', $.proxy(this.mouseEnter, this))
                .on('mouseLeave', 'tbody tr', $.proxy(this.mouseLeave, this));

            if(childLevel > 0) {
                if($.inArray(parentId, this.expandedRowIds) < 0)
                    $row.hide();
                $row.attr('data-parent-id', parentId);
            }

            this.buildCols(item, $row, childLevel);
            if(this.rowFormatter) {
                if(Utils.isFunction(this.rowFormatter))
                    this.rowFormatter($row, item);
                else if(Utils.isArray(this.rowFormatter)){
                    for(var i in this.rowFormatter){
                        if(this.rowFormatter[i] && Utils.isFunction(this.rowFormatter[i]))
                            this.rowFormatter[i]($row, item);
                    }
                }
            }
            this.$body.append($row);

            if (item.hasOwnProperty(this.childRowProperty) && item[this.childRowProperty] && item[this.childRowProperty].length) {
                var expander = $('<i class="'+ ($.inArray(id, this.expandedRowIds) >= 0 ? 'icon-chevron-down' : 'icon-chevron-right') + ' icon-active"></i>')
                    .on('click', function(){ that.toggleChildren($(this), id); });
                $row.find('td:first').prepend(expander);

                for(var i2 in item[this.childRowProperty]){
                    this.buildRow(item[this.childRowProperty][i2], childLevel + 1, id);
                }

                if(item[this.childRowProperty] && item[this.childRowProperty].length > 0 && item[this.childRowProperty].length % 2 !== 0){
                    var $ghostRow = $('<tr></tr>');
                    $ghostRow.hide();
                    this.$body.append($ghostRow);
                }
            }
        },
        buildCols: function(item, $row, childLevel){
            for(var i in this.dataModel){
                var model = this.dataModel[i];
                var $col = $('<td></td>');
                var val = item[model.index];
                if(typeof model.dataFormatter !== 'undefined') {
                    if(Utils.isArray(model.dataFormatter)){
                        for(var j in model.dataFormatter){
                            if(Utils.isFunction(model.dataFormatter[j]))
                                val = model.dataFormatter[j](val, item);
                        }
                    }
                    else if(Utils.isFunction(model.dataFormatter))
                        val = model.dataFormatter(val, item);
                }
                if(typeof model.cellFormatter !== 'undefined') {
                    if(Utils.isArray(model.cellFormatter)){
                        for(var j2 in model.cellFormatter){
                            if(Utils.isFunction(model.cellFormatter[j2]))
                                model.cellFormatter[j2](val, item, $col);
                        }
                    }
                    else if(Utils.isFunction(model.cellFormatter))
                        model.cellFormatter(val, item, $col);
                }
                $col.append(val);
                $row.append($col);
            }

            $row.find('td').first().css('padding-left', (16 * childLevel) + this.padLeft);
        },
        buildHeader: function(){
            var headerRow = this.$header.find('tr:first');
            headerRow.empty();

            var that = this;

            for(var i in this.dataModel){
                var hCol = $('<td></td>')
                    .html(this.dataModel[i].name);
                if(!this.dataModel[i].hasOwnProperty('sortable') || this.dataModel[i].sortable){
                    hCol.addClass('sortable')
                        .append($('<i class="icon"></i>'))
                        .attr('data-sort-index', this.dataModel[i].index)
                        .hover($.proxy(this.headerMouseIn, this), $.proxy(this.headerMouseOut, this))
                        .click($.proxy(this.headerClick, this));
                }
                headerRow.append(hCol);
            }
        },
        buildFooter: function(){
            if(this.showPager)
                this.$pagerContainer.append(this.pager.$container);
        },
        mouseEnter: function(e) {
            this.mousedover = true;
            $(e.currentTarget).addClass('active');
        },
        mouseLeave: function(e) {
            this.mousedover = false;
            $(e.currentTarget).removeClass('active');
        },
        toggleChildren: function(obj, parentId){
            var isCurrentlyExpanded = obj.hasClass('icon-chevron-down');

            if(!isCurrentlyExpanded){
                obj.removeClass('icon-chevron-right')
                    .addClass('icon-chevron-down');

                this.showChildRows(parentId);
                this.expandedRowIds.push(parentId);
            }
            else{
                obj.removeClass('icon-chevron-down')
                    .addClass('icon-chevron-right');

                this.hideChildRows(parentId);
                this.expandedRowIds.pop(parentId);
            }
        },
        showChildRows: function(parentId){
            var childRows = this.$body.find('tr[data-parent-id=' + parentId + ']');
            childRows.each(function(index, el){
                $(el).show();
            });
        },
        hideChildRows: function(parentId){
            var childRows = this.$body.find('tr[data-parent-id=' + parentId + ']');
            childRows.each(function(index, el){
                $(el).hide();
            });
        },
        headerMouseIn: function(e){
            var me = $(e.target);
            if (this.sortColumn == me.attr('data-sort-index'))
                return;
            me.find('i').addClass("icon-collapse");
        },
        headerMouseOut: function(e){
            var me = $(e.target);
            if (this.sortColumn == me.attr('data-sort-index'))
                return;
            me.find('i').removeClass("icon-collapse");
        },
        headerClick: function (e) {
            var me = $(e.target);
            me.find('i').removeClass(function (i, css) {
                return (css.match(/\bicon-\S+/g) || []).join(' ');
            });
            if (this.sortColumn == me.attr('data-sort-index')) {
                this.sortDirection = this.sortDirection == 'ASC' ? 'DESC' : 'ASC';
                me.find('i').addClass(this.sortDirection == 'ASC' ? 'icon-collapse' : 'icon-collapse-up');
            }
            else {
                me.closest('tr').find('i').removeClass(function (i, css) {
                    return (css.match(/\bicon-\S+/g) || []).join(' ');
                });
                this.sortColumn = me.attr('data-sort-index');
                this.sortDirection = "ASC";
                me.find('i').addClass('icon-collapse');
            }
            this.pager.refresh();
        }
    };


    /* pgGrid Plugin Definition
     * =========================== */

    $.fn.pgGrid = function(url, dataModel, options) {
        return this.each(function() {
            var $this = $(this);
            $this.data('pggrid', new PGGrid(this, url, dataModel, options));
        });
    };

    $.fn.pgGrid.defaults = {
        childRowProperty: 'children',
        dataModel: [
            { name: 'Id', index: 'id'},
            { name: 'Value', index: 'value'}
        ],
        dataTotalProperty: 'total',
        dataItemProperty: 'items',
        gridClass: 'table table-condensed table-bordered table-striped',
        initLoader: '<div><i class="icon-refresh icon-spin"></i> Loading data...</div>',
        initialPage: 1,
        item: '<tr></tr>',
        itemIdProperty: 'id',
        padLeft: 2,
        pageSize: 10,
        showLoaderOnRefresh: false,
        sortColumn: null,
        sortDirection: 'ASC',
        title: '<h4>Data</h4>',
        url: null
    };

    $.fn.pgGrid.Constructor = PGGrid;
