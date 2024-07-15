class HpvFilterBar {
    constructor(containerId, opts) {
        const defaultOpts = {
            filterBtnTitle: 'Select filter',
            attachDropdown: (source, target) => {},
            onToggleDropdown: (source, target) => {},
        };

        this.options = Object.assign({}, defaultOpts, opts);
        this.container = document.getElementById(containerId);
        this.filters = new Map();

        this.rootClass = 'hpv-filter-bar';
        this.floatingContentClass = 'floating-content';        
        this.filterBtnClass = 'master-btn';
        this.filterBtnFloatingContentClass = 'floating-content-master-btn';

        this.filterBtn = null;
        this.init();
    }

    init() {
        this.setupMainContainer();
        this.setupFilterBtn();
    }

    setupFilterBtn() {
        this.filterBtn = new MasterBtn(this);
    }

    setupMainContainer() {
        // add class .hpv-filter-bar to container
        this.container.classList.add(this.rootClass);
    }

    addFilter(filter) {
        filter.setParent(this);
        this.filters.set(filter.getId(), filter);

        const menuEntry = filter.createMenuEntry();
        this.filterBtn.addMenuEntry(menuEntry);

        if ( filter.options.immediateDisplay ) {
            filter.addToScreen();
        }
    }

    getMergedRules() {
        return {};
    }
}

class MasterBtn {
    constructor(parent) {
        this.parent = parent;
        this.options = parent.options;

        this.init();
    }

    init() {
        this.setupMasterBtn();
        this.setupMasterFloatingContent();
    }

    setupMasterBtn() {
        const { filterBtnTitle } = this.options;
        const { filterBtnClass } = this.parent;

        const filterBtn = document.createElement('div');
        filterBtn.classList.add(filterBtnClass);
        filterBtn.innerHTML = `<span title="${filterBtnTitle}">
            <i class="fas fa-filter"></i>
        </span>`;
        
        filterBtn.addEventListener('click', this.toggleMainFilterFloatingContentVisibility.bind(this));

        this.parent.container.appendChild(filterBtn);
    }

    disableMenuEntry(id) {
        const menuEntry = document.getElementById(id + '-menu-entry');
        if ( !menuEntry ) return;
        menuEntry.classList.add('is-readonly');
    }

    enableMenuEntry(id) {
        const menuEntry = document.getElementById(id + '-menu-entry');
        if ( !menuEntry ) return;
        menuEntry.classList.remove('is-readonly');
    }

    setupMasterFloatingContent() {
        // attach floating dropdown to filterMasterBtn
        const attachFn = this.options.attachDropdown;
        const { floatingContentClass, filterBtnFloatingContentClass, filterBtnClass } = this.parent;

        if (typeof attachFn === 'function') {
            // create a new div on document root
            const newNode = document.createElement('div');
            newNode.classList.add(floatingContentClass);
            newNode.classList.add(filterBtnFloatingContentClass);

            // add html
            newNode.innerHTML += `<div class="master-filter-content">
                <div class="filter-content-header">
                    <strong>Filtros</strong>
                </div>
                <div class="filter-content-body">
                </div>
            </div>`;

            // add to dom
            this.parent.container.appendChild(newNode);

            // get source element ( master-filter-btn )
            const source = document.querySelector('.' + filterBtnClass);

            // call the attach function to attach the dropdown to the new node, so we can be framework agnostic
            attachFn(source, newNode);
        }
    }

    addMenuEntry(filterItem) {
        const { filterBtnFloatingContentClass } = this.parent;

        // add to dropdown .filter-bar-main-dropdown-content
        const ddContent = document.querySelector('.' + filterBtnFloatingContentClass);
        const listBody = ddContent.querySelector('.filter-content-body');

        if ( this.options.immediateDisplay ) {
            this.addToScreen();
        }

        listBody.appendChild(filterItem);
    }

    toggleMainFilterFloatingContentVisibility() {
        const { filterBtnFloatingContentClass, filterBtnClass } = this.parent;

        const ddContent = document.querySelector('.' + filterBtnFloatingContentClass);
        ddContent.style.display = ddContent.style.display == 'block' ? 'none' : 'block';

        if ( this.options.onToggleDropdown ) {
            const source = document.querySelector('.' + filterBtnClass);
            this.options.onToggleDropdown(source, ddContent);
        }
    }
}

class FilterBarFilter {
    constructor(opts) {
        this.defaultOptions = {
            immediateDisplay: false,
            uniqueInstance: true,
            // fire call back when filter is added to filterBar
            onAddToBar: (filterbar, filter) => {},
            // fire call back when filter is removed from filterBar and user no longer can interact with it
            onRemoveFromBar: (filterbar, filter) => {},
            // fire call back when filter clicked and dropdown is opened
            onOpenDropDown: (filterbar, filter) => {},
            // fire call back when filter clicked and dropdown is closed
            onCloseDropDown: (filterbar, filter) => {},
            // allow custom dom creation implementation
            onCreateDom: (filterbar, filter) => {},
            // allow custom rules extraction implementation
            onGetRules: (filterbar, filter) => {},
        }

        // generate random id if not provided
        if (!opts.id) {
            opts.id = 'filter-' + Math.random().toString(36).substring(7);
        }

        this.options = Object.assign({}, this.defaultOptions, opts);
        this.parent = null;
        // count how many instances of this filter are in the filterBar
        this.filterInstances = 0;
        this.allowMoreInstances = true;
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

    createMenuEntry() {
        const filterItem = document.createElement('a');
        filterItem.id = this.options.id + '-menu-entry';
        filterItem.href = '#';
        filterItem.classList.add('filter-content-item');
        filterItem.innerHTML = `<i class="${this.getFaIcon()}"></i> <span class="menu-text">${this.getLabel()}</span>`;

        filterItem.addEventListener('click', (e) => {
            e.preventDefault();
            // add to filter bar
            this.addToScreen();
            // hide dropdown
            this.parent.filterBtn.toggleMainFilterFloatingContentVisibility();
        });

        return filterItem;
    }

    // fire the action to add filter to filterBar
    addToScreen() {
        if ( !this.allowMoreInstances ) {
            console.log(`Filter ${this.options.id} is unique and already added to screen`);
            return;
        }

        this.filterInstances++;

        // Add filter to filterBar, so user can see it and interact with it
        console.log(`Adding filter ${this.options.id} to screen`);

        const filterSelectorBtn = document.createElement('div');
        filterSelectorBtn.classList.add('selector-btn');
        filterSelectorBtn.id = this.options.id + '-selector-btn';

        const filterSelectorText = document.createElement('span');
        filterSelectorText.classList.add('selector-btn-text');
        filterSelectorText.innerText = this.options.label;

        const filterSelectorArrowContainer = document.createElement('div');
        filterSelectorArrowContainer.classList.add('selector-btn-arrow-container');

        const filterSelectorArrow = document.createElement('span');
        filterSelectorArrow.classList.add('selector-btn-arrow');

        filterSelectorArrowContainer.appendChild(filterSelectorArrow);
        filterSelectorBtn.appendChild(filterSelectorText);
        filterSelectorBtn.appendChild(filterSelectorArrowContainer);

        // get position of master-btn
        const masterBtn = document.querySelector('.' + this.parent.filterBtnClass);

        // add filterSelectorBtn before masterBtn
        masterBtn.parentNode.insertBefore(filterSelectorBtn, masterBtn);

        this.options.onAddToBar(this.parent, this);

        this.processMaxInstances();
    }

    processMaxInstances() {
        if ( this.options.uniqueInstance ) {
            if ( this.filterInstances == 1 ) {
                this.allowMoreInstances = false;
                this.parent.filterBtn.disableMenuEntry(this.options.id);
            } else {
                this.allowMoreInstances = true;
                this.parent.filterBtn.enableMenuEntry(this.options.id);
            }
        }
    }

    removeFromScreen() {
        // Remove filter from filterBar, so user can no longer interact with it
        console.log(`Removing filter ${this.options.id} from screen`);

        const filterSelectorBtn = document.getElementById(this.options.id + '-selector-btn');
        filterSelectorBtn.remove();

        this.filterInstances--;

        this.options.onRemoveFromBar(this.parent, this);

        this.processMaxInstances();
    }

    // get inner rules for remote filter from current element
    getRules() {
        return {};
    }
}