var Pager = (function () {

    "use strict"; // jshint ;_;


    /* pgGrid class definition
     * ================================= */

    function Pager(options) {
        var that = this;
        // initialize and aggregate options
        this.options = $.extend({}, {}, options);

        // initialize properties
        this.reset();
        this.pageSize = Utils.getOption(this.options, "pageSize", 10);
        this.pageSizes = Utils.getOption(this.options, "pageSizes", [{text:"10", value: 10}, {text:"20", value: 20}, {text:"30", value: 30}, {text:"All", value: -1}]);
        this.showPageSizeSelector = Utils.getOption(this.options, "showPageSizeSelector", true);
        this.sortColumn = Utils.getOption(this.options, "sortColumn", null);
        this.sortDirection = Utils.getOption(this.options, "sortDirection", "ASC");

        // initialize methods
        this.render = this.options.render || this.render;
        this.setFooter = this.options.setFooter || this.setFooter;

        // initialize objects
        this.$container = $(this.options.container || '<div class="pull-left pager_container"></div>');
        this.$refreshBtn = $(this.options.refreshBtn || '<i class="icon-refresh icon-active"></i>')
            .on('click', function(){that.refresh()});
        this.$loader = $(this.options.loader || '<i class="icon-refresh icon-spin"></i>');
        this.$startBtn = $(this.options.startBtn || '<i class="icon-fast-backward icon-disabled"></i>');
        this.$backBtn  = $(this.options.backBtn || '<i class="icon-backward icon-disabled"></i>');
        this.$nextBtn = $(this.options.nextBtn || '<i class="icon-forward icon-disabled"></i>');
        this.$endBtn  = $(this.options.endBtn || '<i class="icon-fast-forward icon-disabled"></i>');
        this.$pageCountText = $(this.options.pageCountText || '<span>1</span>');
        this.$pageSelector = $(this.options.pageSelector || '<select class="page-size-selector"></select>')
            .on('change', function(){that.changePage(that.$pageSelector.val())});
        this.$pageSizeSelector = $(this.options.pageSizeSelector || '<select class="page-size-selector"></select>').
            on('change', function(){that.changePageSize(that.$pageSizeSelector.val())});

        this.render();
    }

    $.extend(Pager.prototype, {
        render: function(){
            this.$startBtn.appendTo(this.$container);
            this.$backBtn.appendTo(this.$container);

            $('<span class="page-size-selector-container">Page&nbsp;</span>')
                .append(this.$pageSelector)
                .append('&nbsp;of&nbsp;')
                .append(this.$pageCountText)
                .appendTo(this.$container);

            this.$nextBtn.appendTo(this.$container);
            this.$endBtn.appendTo(this.$container);
            this.$refreshBtn.appendTo(this.$container);
            this.$loader.appendTo(this.$container);

            if(this.showPageSizeSelector){
                for(var i in this.pageSizes){
                    var pageSize = this.pageSizes[i];
                    this.$pageSizeSelector.append($('<option></option>')
                        .attr('value', pageSize.value)
                        .text(pageSize.text));
                }
                $('<span class="page-size-selector-container"></span>')
                    .append('<span>Page&nbsp;Size:&nbsp;</span>')
                    .append(this.$pageSizeSelector)
                    .appendTo(this.$container);
            }
        },
        setFooter: function(totalRecords) {
            var totalPages = this.pageSize == -1 ? 1 : Math.ceil(totalRecords / this.pageSize);
            this.$pageSelector.text(this.currentPage);
            this.$pageCountText.text(totalPages);

            this.disableButtons();

            var that = this;
            if(this.currentPage > 1){
                this.enableButton(this.$startBtn, function(){ that.getPage(1); });

                this.enableButton(this.$backBtn, function(){ that.prevPage(); });
            }

            if(this.currentPage < totalPages){
                this.enableButton(this.$endBtn, function(){ that.getPage(totalPages); });

                this.enableButton(this.$nextBtn, function(){ that.nextPage(); });
            }

            for(var i = 1; i <= totalPages; i++){
                var option = $('<option></option>').attr('value', i).text(i);
                if(i == this.currentPage)
                    option.attr('selected', 'selected');

                this.$pageSelector.append(option);
            }
        },
        nextPage: function() {
            this.getPage(this.currentPage + 1);
        },
        prevPage: function() {
            this.getPage(this.currentPage - 1);
        },
        reset: function(){
            this.currentPage = this.options.intialPage || 1;
        },
        refresh: function() {
            var that = this;
            this.showLoader();
            this.disableButtons();
            this.$pageSelector.attr('disabled', 'disabled');
            this.$pageSizeSelector.attr('disabled', 'disabled');
            $(this).trigger('onRefresh', {
                currentPage: this.currentPage,
                pageSize: this.pageSize,
                onComplete: function(totalRecords){
                    that.$pageSelector.removeAttr('disabled');
                    that.$pageSizeSelector.removeAttr('disabled');
                    that.setFooter(totalRecords);
                    that.hideLoader();}
            })
        },
        getPage: function(page){
            if(!page)
                page = this.currentPage;
            this.currentPage = page;
            this.refresh();
        },
        changePage: function(page) {
            this.currentPage = page;
            this.refresh();
        },
        changePageSize: function(pageSize) {
            this.pageSize = pageSize;
            this.currentPage = 1;
            this.refresh();
        },
        showLoader: function(){
            this.$refreshBtn.hide();
            this.$loader.show();
        },
        hideLoader: function(){
            this.$refreshBtn.show();
            this.$loader.hide();
        },
        disableButtons: function(){
            this.disableButton(this.$startBtn);
            this.disableButton(this.$backBtn);
            this.disableButton(this.$nextBtn);
            this.disableButton(this.$endBtn);
        },
        disableButton: function(btn){
            btn.off();
            btn.removeClass('icon-active')
                .addClass('icon-disabled');
        },
        enableButton: function(btn, fn){
            btn.removeClass('icon-disabled')
                .addClass('icon-active')
                .on('click', fn);
        }
    });

    return Pager;
})();