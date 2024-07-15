class HpvFilterBar {
    constructor(containerId, opts) {
        const defaultOpts = {
            filterBtnTitle: 'Select filter',
            attachDropdown: () => {},
        };

        this.options = Object.assign({}, defaultOpts, opts);
        this.container = document.getElementById(containerId);
        this.filters = new Map();
        this.activeFilters = [];

        this.rootClass = 'hpv-filter-bar';
        this.filterBtnClass = 'trigger-btn';
        this.floatingContentClass = 'floating-content';
        
        this.filterBtnFloatingContentClass = 'floating-content-trigger-btn';

        this.init();
    }

    setupMainContainer() {
        // add class .hpv-filter-bar to container
        this.container.classList.add(this.rootClass);
    }

    setupMainTriggerBtn() {
        const filterBtn = document.createElement('div');
        filterBtn.classList.add(this.filterBtnClass);
        filterBtn.innerHTML = `<span title="${this.options.filterBtnTitle}">
            <i class="fas fa-filter"></i>
        </span>`;
        
        filterBtn.addEventListener('click', this.toggleMainFilterFloatingContentVisibility.bind(this));

        this.container.appendChild(filterBtn);
    }

    setupMainTriggerFloatingContent() {
        // attach floating dropdown to filterTriggerBtn
        const attachFn = this.options.attachDropdown;

        if (typeof attachFn === 'function') {
            // create a new div on document root
            const newNode = document.createElement('div');
            newNode.classList.add(this.floatingContentClass);
            newNode.classList.add(this.filterBtnFloatingContentClass);

            // add html
            newNode.innerHTML += `<div class="main-filter-content">
                <div class="filter-content-header">
                    <strong>Filtros</strong>
                </div>
                <div class="filter-content-body">
                </div>
            </div>`;

            // add to dom
            this.container.appendChild(newNode);

            // get source element ( main-filter-btn )
            const source = document.querySelector('.' + this.filterBtnClass);
            console.log(source);

            // call the attach function to attach the dropdown to the new node, so we can be framework agnostic
            attachFn(source, newNode);
        }
    }

    init() {
        this.setupMainContainer();
        this.setupMainTriggerBtn();
        this.setupMainTriggerFloatingContent();
    }

    toggleMainFilterFloatingContentVisibility() {
        const ddContent = document.querySelector('.' + this.filterBtnFloatingContentClass);
        ddContent.style.display = ddContent.style.display == 'block' ? 'none' : 'block';
    }

    addFilter(filter) {
        filter.setParent(this);
        this.filters.set(filter.getId(), filter);

        // add to dropdown .filter-bar-main-dropdown-content
        const ddContent = document.querySelector('.' + this.filterBtnFloatingContentClass);
        const listBody = ddContent.querySelector('.filter-content-body');

        const filterItem = document.createElement('a');
        filterItem.href = '#';
        filterItem.classList.add('filter-content-item');
        filterItem.innerHTML = `<i class="${filter.getFaIcon()}"></i> <span class="menu-text">${filter.getLabel()}</span>`;

        filterItem.addEventListener('click', (e) => {
            e.preventDefault();
            filter.addToScreen();
        });

        if ( filter.options.immediateDisplay ) {
            filter.addToScreen();
        }

        listBody.appendChild(filterItem);
    }

    getRules() {

    }
}

class FilterBarFilter {
    constructor(opts) {
        this.defaultOptions = {
            immediateDisplay: false,
            uniqueInstance: true,
            // fire call back when filter is added to filterBar
            onAddToBar: () => {},
            // fire call back when filter is removed from filterBar and user no longer can interact with it
            onRemoveFromBar: () => {},
            // fire call back when filter clicked and dropdown is opened
            onOpenDropDown: () => {},
            // fire call back when filter clicked and dropdown is closed
            onCloseDropDown: () => {},
            // allow custom dom creation implementation
            onCreateDom: () => {},
            // allow custom rules extraction implementation
            onGetRules: () => {},
        }

        // generate random id if not provided
        if (!opts.id) {
            opts.id = 'filter-' + Math.random().toString(36).substring(7);
        }

        this.options = Object.assign({}, this.defaultOptions, opts);
        this.parent = null;
    }

    getId() {
        return this.options.id;
    }

    getLabel() {
        return this.options.label;
    }

    getFaIcon() {
        return this.options.faIcon;
    }

    // reference to filterBar
    setParent(parent) {
        this.parent = parent;
    }

    // fire the action to add filter to filterBar
    addToScreen() {
        // Add filter to filterBar, so user can see it and interact with it
        console.log(`Adding filter ${this.options.id} to screen`);
        this.options.onAddToBar(this.parent, this);
    }

    // get inner rules for remote filter from current element
    getRules() {
        return {};
    }
}