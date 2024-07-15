class ClassNames {
    static ROOT = 'hpv-filter-bar';
    static FLOATING_CONTENT = 'floating-content';
    static IS_READONLY = 'is-readonly';

    static PICKER_BTN = 'picker-btn';
    static PICKER_FLOATING_CONTENT = 'picker-filter-content';

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
        // listen for filter btn click ( user wants to display filter options )
        this.container.addEventListener('filterBtnItemSelection', (e) => {
            e.stopImmediatePropagation();
            
            const filter = e.detail.filter;
            console.log('Opening dropdown for filter ' + filter.getId());
        });

        // listen for filter item click ( user is adding a filter to filter bar )
        this.container.addEventListener('pickerBtnItemSelection', (e) => {
            e.stopImmediatePropagation();

            const filter = e.detail.filter;
            // add to filter bar
            filter.addToScreen();
            // hide dropdown
            this.pickerBtn.toggleFloatingContentVisibility();
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
        filter.setBar(this);
        this.filters.set(filter.getId(), filter);

        const menuEntry = filter.createMenuEntry();
        this.pickerBtn.addMenuEntry(menuEntry);

        if ( filter.options.immediateDisplay ) {
            filter.addToScreen();
        }
    }

    getMergedRules() {
        return Array.from(this.filters.values()).reduce((acc, filter) => ({...acc, ...filter.getRules()}), {});
    }
}

class FilterBtn {
    constructor(parent) {
        this.parent = parent;
        this.options = parent.options;

        this.init();
    }

    init() {
        
    }

    setupFloatingContent() {
    }

    toggleFloatingContentVisibility() {
    }

    addMenuEntry(filterItem) {
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

    addMenuEntry(filterItem) {
        // add to dropdown .filter-bar-main-dropdown-content
        const ddContent = document.querySelector('.' + ClassNames.PICKER_FLOATING_CONTENT);
        const listBody = ddContent.querySelector('.' + ClassNames.SELECTOR_CONTENT_BODY);

        if ( this.options.immediateDisplay ) {
            this.addToScreen();
        }

        listBody.appendChild(filterItem);
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

class HpvFilterContext {
    constructor(opts = {}) {
        this.options = {
            immediateDisplay: false,
            uniqueInstance: true,
            disabledSelector: false,
            picker: {},
            selector: {},
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

    // reference to filterBar
    setBar(parent) {
        if ( ! parent instanceof HpvFilterBar ) {
            throw new Error('Parent must be an instance of HpvFilterBar');
        }

        this.parent = parent;
    }

    createMenuEntry() {
        const filterItem = document.createElement('a');
        filterItem.id = this.options.id + '-menu-entry';
        filterItem.href = '#';
        filterItem.classList.add(ClassNames.SELECTOR_CONTENT_ITEM);
        filterItem.innerHTML = `<i class="${this.getFaIcon()}"></i> <span class="menu-text">${this.getLabel()}</span>`;

        filterItem.addEventListener('click', (e) => {
            e.preventDefault();

            filterItem.dispatchEvent(new CustomEvent('pickerBtnItemSelection', {
                detail: {
                    filter: this
                },
                bubbles: true,
                cancelable: true
            }));
        });

        return filterItem;
    }

    // fire the action to add filter to filterBar
    addToScreen() {
        if ( !this.allowMoreInstances ) {
            console.log(`Filter ${this.options.id} is unique and already added to screen`);
            return;
        }

        this.instances++;

        // Add filter to filterBar, so user can see it and interact with it
        console.log(`Adding filter ${this.options.id} to screen`);

        const filterSelectorBtn = document.createElement('div');
        filterSelectorBtn.classList.add(ClassNames.SELECTOR_BTN);
        filterSelectorBtn.id = this.options.id + '-selector-btn';

        const filterSelectorText = document.createElement('span');
        filterSelectorText.classList.add(ClassNames.SELECTOR_BTN_TEXT);
        filterSelectorText.innerText = this.options.picker.label;

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
                        filter: this
                    },
                    bubbles: true,
                    cancelable: true
                }));
            });
        }

        this.options.onAddToBar(this.parent, this);

        this.processMaxInstances();
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