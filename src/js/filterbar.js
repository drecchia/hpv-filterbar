class ClassNames {
    static ROOT = 'hpv-filter-bar';
    static FLOATING_CONTENT = 'floating-content';
    static IS_READONLY = 'is-readonly';

    static PICKER_BTN = 'picker-btn';
    static PICKER_FLOATING_CONTENT = 'picker-floating-content';

    static SELECTOR_BTN = 'selector-btn';
    static SELECTOR_BTN_DISABLED = 'selector-btn-disabled';
    static SELECTOR_BTN_TEXT = 'selector-btn-text';
    static SELECTOR_BTN_ARROW_CONTAINER = 'selector-btn-arrow-container';
    static SELECTOR_BTN_ARROW = 'selector-btn-arrow';
    static SELECTOR_CONTENT_HEADER = 'filter-content-header';
    static SELECTOR_CONTENT_BODY = 'filter-content-body';
    static SELECTOR_CONTENT_ITEM = 'filter-content-item';
}

class HpvFilterBar {
    constructor(containerId, opts = {}) {
        this.options = {
            pickerBtnTitle: 'Select filter',
            attachDropdown: (source, target) => {},
            onToggleDropdown: (source, target) => {},
            ...opts
        };

        this.container = document.getElementById(containerId);
        this.filters = new Map();
        this.pickerBtn = null;
        this.init();
    }

    init() {
        // add class .hpv-filter-bar to container
        this.container.classList.add(ClassNames.ROOT);
        // create pickerBtn
        this.pickerBtn = new PickerBtn(this);
        // bubble events
        this.setupEventListeners();
    }

    setupEventListeners() {
        // listen for filter item click ( user is adding a filter to filter bar )
        this.container.addEventListener('pickerBtnItemSelection', (e) => {
            e.stopImmediatePropagation();

            const filterCtx = e.detail.filter;
            const selector = filterCtx.getSelector();

            if ( selector.reachedInstancesLimit() ) {
                console.log('Max instances reached for filter ' + filterCtx.getId());
                return;
            }

            // add to filter bar
            selector.addToScreen();
            // hide dropdown
            this.pickerBtn.toggleFloatingContentVisibility();

            // we have added last possible item
            if ( selector.reachedInstancesLimit() ) {
                this.pickerBtn.disableMenuEntry(filterCtx.getId());
            }
        });

        // listen for filter btn click ( user wants to display filter options )
        this.container.addEventListener('filterBtnItemSelection', (e) => {
            e.stopImmediatePropagation();
            
            const filterCtx = e.detail.filter;
            console.log('Opening dropdown for filter ' + filterCtx.getId());

            const el = filterCtx.getSelector().createDom();
            console.log(el);
        });
    }

    removeFilter(filterId) {
        const filter = this.filters.get(filterId);

        if ( filter ) {
            filter.removeFromScreen();
            this.filters.delete(filterId);
        }
    }

    addFilter(filter) {
        // set parent reference
        filter.setBar(this);
        // add to filters map
        this.filters.set(filter.getId(), filter);

        const filterPicker = filter.getPicker();
        filterPicker.setContext(filter);
        this.pickerBtn.addPicker(filterPicker);

        const filterSelector = filter.getSelector();
        filterSelector.setContext(filter);

        if ( filterSelector.options.immediateDisplay ) {
            filterSelector.addToScreen();
        }
    }

    getMergedRules() {
        return Array.from(this.filters.values()).reduce((acc, filter) => ({...acc, ...filter.getRules()}), {});
    }
}

class PickerBtn {
    constructor(parent) {
        this.parent = parent;
        this.options = parent.options;

        this.init();
    }

    init() {
        this.setupPickerBtn();
        this.setupFloatingContent();
    }

    setupPickerBtn() {
        const { pickerBtnTitle } = this.options;

        const pickerBtn = document.createElement('div');
        pickerBtn.classList.add(ClassNames.PICKER_BTN);
        pickerBtn.innerHTML = `<span title="${pickerBtnTitle}">
            <i class="fas fa-filter"></i>
        </span>`;
        
        pickerBtn.addEventListener('click', this.toggleFloatingContentVisibility.bind(this));

        this.parent.container.appendChild(pickerBtn);
    }

    disableMenuEntry(id) {
        const menuEntry = document.getElementById(id + '-menu-entry');
        if ( !menuEntry ) return;
        menuEntry.classList.add(ClassNames.IS_READONLY);
    }

    enableMenuEntry(id) {
        const menuEntry = document.getElementById(id + '-menu-entry');
        if ( !menuEntry ) return;
        menuEntry.classList.remove(ClassNames.IS_READONLY);
    }

    setupFloatingContent() {
        // attach floating dropdown to filterPickerBtn
        const attachFn = this.options.attachDropdown;

        if (typeof attachFn === 'function') {
            // create a new div on document root
            const newNode = document.createElement('div');
            newNode.classList.add(ClassNames.FLOATING_CONTENT);
            newNode.classList.add(ClassNames.PICKER_FLOATING_CONTENT);

            // add html
            newNode.innerHTML += `<div class="${ClassNames.PICKER_FLOATING_CONTENT}">
                <div class="${ClassNames.SELECTOR_CONTENT_HEADER}">
                    <strong>Filtros</strong>
                </div>
                <div class="${ClassNames.SELECTOR_CONTENT_BODY}">
                </div>
            </div>`;

            // add to dom
            this.parent.container.appendChild(newNode);

            // get source element ( picker-filter-btn )
            const source = document.querySelector('.' + ClassNames.PICKER_BTN);

            // call the attach function to attach the dropdown to the new node, so we can be framework agnostic
            attachFn(source, newNode);
        }
    }

    addPicker(filterPicker) {
        // add to dropdown .filter-bar-main-dropdown-content
        const ddContent = document.querySelector('.' + ClassNames.PICKER_FLOATING_CONTENT);
        const listBody = ddContent.querySelector('.' + ClassNames.SELECTOR_CONTENT_BODY);

        if ( this.options.immediateDisplay ) {
            this.addToScreen();
        }

        listBody.appendChild(filterPicker.createMenuEntry());
    }

    toggleFloatingContentVisibility() {
        const ddContent = document.querySelector('.' + ClassNames.PICKER_FLOATING_CONTENT);
        ddContent.style.display = ddContent.style.display == 'block' ? 'none' : 'block';

        if ( this.options.onToggleDropdown ) {
            const source = document.querySelector('.' + ClassNames.PICKER_BTN);
            this.options.onToggleDropdown(source, ddContent);
        }
    }
}

class HpvPicker {
    constructor(opts = {}) {
        this.options = {
            label: 'Filter 1',
            faIcon: 'fas fa-globe',
            ...opts
        }
    }

    // reference to filterCtx
    setContext(filterCtx) {
        if ( ! filterCtx instanceof HpvFilterContext ) {
            throw new Error('Parent must be an instance of HpvFilterBar');
        }

        this.filterCtx = filterCtx;
    }

    createMenuEntry() {
        const { faIcon, label } = this.options;
        const contextId = this.filterCtx.getId();

        const pickerItem = document.createElement('a');
        pickerItem.id = contextId + '-menu-entry';
        pickerItem.href = '#';
        pickerItem.classList.add(ClassNames.SELECTOR_CONTENT_ITEM);
        pickerItem.innerHTML = `<i class="${faIcon}"></i> <span class="menu-text">${label}</span>`;

        pickerItem.addEventListener('click', (e) => {
            e.preventDefault();

            pickerItem.dispatchEvent(new CustomEvent('pickerBtnItemSelection', {
                detail: {
                    filter: this.filterCtx
                },
                bubbles: true,
                cancelable: true
            }));
        });

        return pickerItem;
    }
}

class HpvSelector {
    constructor(opts = {}) {
        this.options = {
            label: 'Selected',
            defaultText: 'All',
            immediateDisplay: false,
            disabledSelector: false,
            maxInstances: 100,
            onShowDropdown: () => {},
            onHideDropdown: () => {},
            createDom: (parent, filter) => {},
            ...opts
        }

        this.instances = 0;
        this.dom = null;
    }

    createDom() {
        if ( !this.dom && this.options.createDom ) {
            this.dom = this.options.createDom(this);
        }

        return this.dom;
    }

    reachedInstancesLimit() {
        return this.instances >= this.options.maxInstances;
    }

    // reference to filterCtx
    setContext(filterCtx) {
        if ( ! filterCtx instanceof HpvFilterContext ) {
            throw new Error('Parent must be an instance of HpvFilterBar');
        }

        this.filterCtx = filterCtx;
    }

    // fire the action to add filter to filterBar
    addToScreen() {
        this.instances++;
        const contextId = this.filterCtx.getId();

        // Add selector to filterBar, so user can see it and interact with it
        console.log(`Adding selector ${contextId} to screen`);

        const filterSelectorBtn = document.createElement('div');
        filterSelectorBtn.classList.add(ClassNames.SELECTOR_BTN);
        filterSelectorBtn.id = contextId + '-selector-btn-' + this.instances;

        const filterSelectorText = document.createElement('span');
        filterSelectorText.classList.add(ClassNames.SELECTOR_BTN_TEXT);
        filterSelectorText.innerText = this.options.label;

        const filterSelectorArrowContainer = document.createElement('div');
        filterSelectorArrowContainer.classList.add(ClassNames.SELECTOR_BTN_ARROW_CONTAINER);

        const filterSelectorArrow = document.createElement('span');
        filterSelectorArrow.classList.add(ClassNames.SELECTOR_BTN_ARROW);

        filterSelectorBtn.appendChild(filterSelectorText);

        if ( !this.options.disabledSelector ) {
            filterSelectorArrowContainer.appendChild(filterSelectorArrow);
            filterSelectorBtn.appendChild(filterSelectorArrowContainer);
        } else {
            filterSelectorBtn.classList.add(ClassNames.SELECTOR_BTN_DISABLED);
        }

        // get position of picker-btn
        const pickerBtn = document.querySelector('.' + ClassNames.PICKER_BTN);

        // add filterSelectorBtn before pickerBtn
        pickerBtn.parentNode.insertBefore(filterSelectorBtn, pickerBtn);

        if ( !this.options.disabledSelector ) {
            // add click listener to filterSelectorBtn
            filterSelectorBtn.addEventListener('click', (e) => {
                e.preventDefault();

                filterSelectorBtn.dispatchEvent(new CustomEvent('filterBtnItemSelection', {
                    detail: {
                        filter: this.filterCtx
                    },
                    bubbles: true,
                    cancelable: true
                }));
            });
        }

        // fire call back
        //this.options.onAddToBar(this.parent, this);

        // this.processMaxInstances();
    }
}

class HpvFilterContext {
    constructor(opts = {}) {
        this.options = {
            picker: new HpvPicker(),
            selector: new HpvSelector(),
            ...opts
        }

        // generate random id if not provided
        if (!opts.id) {
            opts.id = 'filter-' + Math.random().toString(36).substring(7);
        }

        this.parent = null;
        // count how many instances of this filter are in the filterBar
        this.instances = 0;
        this.allowMoreInstances = true;
    }

    getId() {
        return this.options.id;
    }

    getLabel() {
        return this.options.picker.label;
    }

    getFaIcon() {
        return this.options.picker.faIcon;
    }

    getPicker() {
        return this.options.picker;
    }

    getSelector() {
        return this.options.selector;
    }

    // reference to filterBar
    setBar(parent) {
        if ( ! parent instanceof HpvFilterBar ) {
            throw new Error('Parent must be an instance of HpvFilterBar');
        }

        this.parent = parent;
    }

    processMaxInstances() {
        if ( this.options.uniqueInstance ) {
            if ( this.instances == 1 ) {
                this.allowMoreInstances = false;
                this.parent.pickerBtn.disableMenuEntry(this.options.id);
            } else {
                this.allowMoreInstances = true;
                this.parent.pickerBtn.enableMenuEntry(this.options.id);
            }
        }
    }

    removeFromScreen() {
        // Remove filter from filterBar, so user can no longer interact with it
        console.log(`Removing filter ${this.options.id} from screen`);

        const filterSelectorBtn = document.getElementById(this.options.id + '-selector-btn');
        filterSelectorBtn.remove();

        this.instances--;

        if ( this.options.onRemoveFromBar ) {
            this.options.onRemoveFromBar(this.parent, this);
        }

        this.processMaxInstances();
    }

    // get inner rules for remote filter from current element
    getRules() {
        return {};
    }
}