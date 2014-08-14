
    /* pgGrid class definition
     * ================================= */

    var PGGrid = function (element, options) {
        var that = this;
        this.$element = $(element);

        // initialize and aggregate options
        this.options = $.extend({}, $.fn.pgGrid.defaults, options);

        // initialize properties
        this.item = this.options.item;
        this.dataModel = this.options.dataModel;
        this.childRowProperty = this.options.childRowProperty;
        this.expandedRowIds = new Array();
        this.sortColumn = this.options.sortColumn;
        this.sortDirection = this.options.sortDirection;
        this.url = this.options.url;
        this.dataTotalProperty = this.options.dataTotalProperty;
        this.dataItemProperty = this.options.dataItemProperty;
        this.padLeft = this.options.padLeft;
        this.itemIdProperty = this.options.itemIdProperty;
        this.showTitle = Utils.getOption(this.options, "showTitle", true);
        this.showPager = Utils.getOption(this.options, "showPager", true);

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

            return this.render(data);
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
            this.rowFormatter($row, item);
            this.$body.append($row);

            if (item.hasOwnProperty(this.childRowProperty) && item[this.childRowProperty] && item[this.childRowProperty].length) {
                var expander = $('<i class="'+ ($.inArray(id, this.expandedRowIds) >= 0 ? 'icon-chevron-down' : 'icon-chevron-right') + ' icon-active"></i>')
                    .on('click', function(){ that.toggleChildren($(this), id); });
                $row.find('td:first').prepend(expander);

                for(var i in item[this.childRowProperty]){
                    this.buildRow(item[this.childRowProperty][i], childLevel + 1, id);
                }
            }
        },
        buildCols: function(item, $row, childLevel){
            for(var i in this.dataModel){
                var model = this.dataModel[i];
                var $col = $('<td></td>');
                var val = item[model.index];
                if(typeof model.dataFormatter !== 'undefined')
                    val = model.dataFormatter(val, item);
                if(typeof model.cellFormatter !== 'undefined')
                    val = model.cellFormatter(val, item, $col);
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
                        .hover(function () {
                            var me = $(this);
                            if (that.sortColumn == me.attr('data-sort-index'))
                                return;
                            me.find('i').addClass("icon-collapse");
                        }, function () {
                            var me = $(this);
                            if (that.sortColumn == me.attr('data-sort-index'))
                                return;
                            me.find('i').removeClass("icon-collapse");
                        })
                        .click(function () {
                            var me = $(this);
                            me.find('i').removeClass(function (i, css) {
                                return (css.match(/\bicon-\S+/g) || []).join(' ');
                            });
                            if (that.sortColumn == me.attr('data-sort-index')) {
                                that.sortDirection = that.sortDirection == 'ASC' ? 'DESC' : 'ASC';
                                me.find('i').addClass(that.sortDirection == 'ASC' ? 'icon-collapse' : 'icon-collapse-up');
                            }
                            else {
                                me.closest('tr').find('i').removeClass(function (i, css) {
                                    return (css.match(/\bicon-\S+/g) || []).join(' ');
                                });
                                that.sortColumn = me.attr('data-sort-index');
                                that.sortDirection = "ASC";
                                me.find('i').addClass('icon-collapse');
                            }
                            that.pager.refresh();
                        });
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
            childRows.each(function(index, el){$(el).show()});
        },
        hideChildRows: function(parentId){
            var childRows = this.$body.find('tr[data-parent-id=' + parentId + ']');
            childRows.each(function(index, el){$(el).hide()});
        }
    };


    /* pgGrid Plugin Definition
     * =========================== */

    $.fn.pgGrid = function(option) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data('pggrid'),
                options = typeof option == 'object' && option;
            if (!data) $this.data('pggrid', (data = new PGGrid(this, options)));
            if (typeof option == 'string') data[option]();
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
        sortColumn: null,
        sortDirection: 'ASC',
        title: '<h4>Data</h4>',
        url: null
    };

    $.fn.pgGrid.Constructor = PGGrid;
