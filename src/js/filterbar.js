const HpvFilterBar = {
    // --------------------------------------------------------------------------------------------------------------------
    CssClassName: {
        ROOT: 'hpv-filter-bar',
        IS_READONLY: 'is-readonly',
        
        FLOATING_CONTENT: 'floating-content',
        FLOATING_CONTENT_HEADER: 'floating-content-header',
        FLOATING_CONTENT_BODY: 'floating-content-body',
        
        ICON_BTN: 'icon-btn',
        PICKER_BTN: 'picker-btn',
        PICKER_ITEM: 'filter-content-item',
        PICKER_FLOATING_CONTENT: 'picker-floating-content',

        SELECTOR_BTN: 'selector-btn',
        SELECTOR_BTN_DISABLED: 'selector-btn-disabled',
        SELECTOR_BTN_TEXT: 'selector-btn-text',
        SELECTOR_BTN_ARROW_CONTAINER: 'selector-btn-arrow-container',
        SELECTOR_BTN_ARROW: 'selector-btn-arrow',
    },

    // --------------------------------------------------------------------------------------------------------------------
    Bar: class {
        constructor(containerId, opts = {}) {
            this.options = {
                pickerBtnTitle: 'Select filter',
                attachDropdown: (source, target) => {},
                afterToggleDropdown: (source, target) => {},
                afterCreated: (bar) => {},
                afterRemoveSelector: (bar, filterCtx) => {},
                onFilterAdded: (bar, filterCtx) => {},
                onFiltersAdded: (bar, filters) => {},
                ...opts
            };

            this.container = document.getElementById(containerId);
            this.filters = new Map();
            this.pickerBtn = null;

            this.init();
        }

        init() {
            // add class .hpv-filter-bar to container
            this.container.classList.add(HpvFilterBar.CssClassName.ROOT);
            // create pickerBtn
            this.pickerBtn = new HpvFilterBar.PickerBtn(this);
            // bubble events
            this.setupEventListeners();
            // fire created callback
            this.doCallbackCreatedEvent();
        }

        doCallbackCreatedEvent() {
            if ( this.options.afterCreated && this.options.afterCreated instanceof Function ) {
                this.options.afterCreated(this);
            }
        }

        setupEventListeners() {
            // listen for filter item click ( user is adding a filter to filter bar )
            this.container.addEventListener('pickerBtnItemSelection', (e) => {
                e.stopImmediatePropagation();

                const filterCtx = e.detail.filter;
                const selector = filterCtx.getSelector();

                if (filterCtx.reachedInstancesLimit()) {
                    console.error('Max instances reached for filter ' + filterCtx.getId());
                    return;
                }

                // add to filter bar
                selector.addToScreen();
                filterCtx.instances++;

                // hide dropdown
                this.pickerBtn.toggleFloatingContentVisibility();

                // we have added last possible item
                if (filterCtx.reachedInstancesLimit()) {
                    this.pickerBtn.disableMenuEntry(filterCtx.getId());
                }
            });

            // listen for filter btn click ( user wants to display filter options )
            this.container.addEventListener('filterBtnItemSelection', (e) => {
                e.stopImmediatePropagation();

                const filterCtx = e.detail.filter;
                console.log('Opening dropdown for filter ' + filterCtx.getId());

                // 1. call filterCtx.getSelector().constructSelectorFloatingContent() to get the dom element
                const selector = filterCtx.getSelector();
                const el = selector.constructSelectorFloatingContent();
                if (!el) return;

                // get parent of el
                const parent = el.parentNode;
                let wrapperNode = null;

                // if parent has class .floating-content
                if (parent && parent.classList.contains(HpvFilterBar.CssClassName.FLOATING_CONTENT_BODY)) {
                    // no need to create new node
                    wrapperNode = parent.parentNode;
                } else {
                    // create new node
                    wrapperNode = document.createElement('div');
                    wrapperNode.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT, filterCtx.getId() + '-floating-content');

                    // -- Header
                    const contentHeader = document.createElement('div');
                    contentHeader.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT_HEADER);

                    const strong = document.createElement('strong');
                    strong.innerHTML = selector.options.floatingContentTitle || 'Filtros';

                    contentHeader.appendChild(strong);

                    if ( selector.options.removable ) {
                        const removeSelectorEl = document.createElement('div');
                        removeSelectorEl.classList.add('remove-selector');
                        // on click
                        removeSelectorEl.addEventListener('click', () => {
                            this.removeSelector(filterCtx.getId());
                            wrapperNode.style.display = wrapperNode.style.display == 'block' ? 'none' : 'block';
                        });

                        // add to header
                        contentHeader.appendChild(removeSelectorEl);
                    }

                    wrapperNode.appendChild(contentHeader);

                    // -- Body
                    const contentBody = document.createElement('div');
                    contentBody.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT_BODY);
                    
                    wrapperNode.appendChild(contentBody);

                    // 4. add to floating div
                    contentBody.appendChild(el);
                    // 5. add to dom
                    this.container.appendChild(wrapperNode);

                }

                // 3. bind source element to floating div
                const source = e.detail.target;
                this.options.attachDropdown(source, wrapperNode);
                
                // 6. set dropdown visible
                if ( wrapperNode.style.display == 'block' ) {
                    wrapperNode.style.display = 'none';
                    // recalculate selector label
                    selector.updateLabel();
                } else {
                    wrapperNode.style.display = 'block';
                }

                // TODO: do callback
            });
        }

        // TODO: this mode wont support multiples instances
        removeSelector(filterId) {
            const filterCtx = this.filters.get(filterId);
            if (filterCtx) {
                filterCtx.removeFromScreen();
                // TODO: delete floating element will kill context state, do we really need ?

                if ( this.options.afterRemoveSelector && this.options.afterRemoveSelector instanceof Function ) {
                    this.options.afterRemoveSelector(this, filterCtx);
                }
            }
        }

        addFilters(filters) {
            filters.forEach((filterCtx) => {
                this.addFilter(filterCtx);
            });

            if ( this.options.onFiltersAdded && this.options.onFiltersAdded instanceof Function ) {
                this.options.onFiltersAdded(this, filters);
            }
        }

        addFilter(filterCtx) {
            // set parent reference
            filterCtx.setBar(this);
            // add to filters map
            this.filters.set(filterCtx.getId(), filterCtx);
            
            const filterPicker = filterCtx.getPicker();

            if ( filterPicker ) {
                filterPicker.setContext(filterCtx);
                this.pickerBtn.addPicker(filterPicker);
            }

            const filterSelector = filterCtx.getSelector();
            filterSelector.setContext(filterCtx);

            if (filterSelector.options.immediateDisplay) {
                filterSelector.addToScreen();

                filterCtx.instances++;
                filterCtx.processMaxInstances();
            }

            if ( this.options.onFilterAdded && this.options.onFilterAdded instanceof Function ) {
                this.options.onFilterAdded(this, filterCtx);
            }
        }

        getAllRules() {
            // call all filter with instances > 0 method getRules ( bar -> context -> selector ) and return an array of arrays
            let rules = [];
            this.filters.forEach((filterCtx) => {
                if (filterCtx.instances > 0) {
                    rules.push(filterCtx.getRules());
                }
            });
            
            return rules;
        }
    },

    // --------------------------------------------------------------------------------------------------------------------
    Context: class {
        constructor(opts = {}) {
            this.options = {
                picker: null,
                selector: null,
                afterRemoveFromBar: (bar, filterCtx) => {},
                maxInstances: 1,
                ...opts
            };

            if (!opts.id) {
                opts.id = 'filter-' + Math.random().toString(36).substring(7);
            }

            this.parent = null;
            this.instances = 0;
            this.allowMoreInstances = true;
        }

        getId() { return this.options.id; }
        getLabel() { return this.options.picker.label; }
        getFaIcon() { return this.options.picker.faIcon; }
        getPicker() { return this.options.picker; }
        getSelector() { return this.options.selector; }

        reachedInstancesLimit() {
            return this.instances >= this.options.maxInstances;
        }

        immediateUpdateLabel() {
            // FIXME: do it only on current selector instance
            const selector = this.getSelector();
            selector.updateLabel();
        }

        setBar(parent) {
            if (!(parent instanceof HpvFilterBar.Bar)) {
                throw new Error('Parent must be an instance of HpvFilterBar.Bar');
            }
            this.parent = parent;
        }

        processMaxInstances() {
            if ( this.reachedInstancesLimit() ) {
                this.allowMoreInstances = false;
                this.parent.pickerBtn.disableMenuEntry(this.options.id);
            } else {
                this.allowMoreInstances = true;
                this.parent.pickerBtn.enableMenuEntry(this.options.id);
            }
        }

        // FIXME: context is not removed, selectors are
        removeFromScreen() {
            console.log(`Removing filter ${this.options.id} from screen`);
            const filterSelectorBtn = document.getElementById(this.options.id + '-selector-btn-0');
            filterSelectorBtn.remove();

            this.instances--;

            this.processMaxInstances();
            this.doCallbackAfterRemoveFromBar();
        }

        doCallbackAfterRemoveFromBar() {
            if (this.options.afterRemoveFromBar) {
                this.options.afterRemoveFromBar(this.parent, this);
            }
        }

        getRules() {
            const selector = this.getSelector();
            if ( selector ) {
                return selector.getRules(this);
            }

            return {};
        }
    },

    // --------------------------------------------------------------------------------------------------------------------
    PickerBtn: class {
        constructor(parent) {
            this.parent = parent;
            this.options = parent.options;

            if ( !this.options.hasOwnProperty('createPickerEl') ) {
                this.options.createPickerEl = (opts) => {
                    const pickerBtn = document.createElement('div');
                    pickerBtn.innerHTML = `<span title="${opts.pickerBtnTitle}"><i class="fas fa-filter"></i></span>`;
                    
                    return pickerBtn;
                };
            }

            this.init();
        }

        init() {
            this.setupPickerBtn();
            this.setupFloatingContent();
        }

        setupPickerBtn() {
            const { pickerBtnTitle } = this.options;
            
            // allow user to customize picker button via opts
            const pickerTrigger = this.options.createPickerEl(this.options);
            // enforce control properties
            pickerTrigger.classList.add(HpvFilterBar.CssClassName.PICKER_BTN, HpvFilterBar.CssClassName.ICON_BTN);
            pickerTrigger.addEventListener('click', this.toggleFloatingContentVisibility.bind(this));

            this.parent.container.appendChild(pickerTrigger);
        }

        disableMenuEntry(id) {
            const menuEntry = document.getElementById(id + '-menu-entry');
            if (menuEntry) menuEntry.classList.add(HpvFilterBar.CssClassName.IS_READONLY);
        }

        enableMenuEntry(id) {
            const menuEntry = document.getElementById(id + '-menu-entry');
            if (menuEntry) menuEntry.classList.remove(HpvFilterBar.CssClassName.IS_READONLY);
        }

        setupFloatingContent() {
            const { pickerContentTitle, attachDropdown: attachFn } = this.options;

            if (typeof attachFn === 'function') {
                // create a new div on document root
                const newNode = document.createElement('div');
                newNode.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT, HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT);
                // add html
                newNode.innerHTML = `
                        <div class="${HpvFilterBar.CssClassName.FLOATING_CONTENT_HEADER}">
                            <strong>${pickerContentTitle ? pickerContentTitle : 'Filters'}</strong>
                        </div>
                        <div class="${HpvFilterBar.CssClassName.FLOATING_CONTENT_BODY}">
                        </div>`;

                // add to dom
                this.parent.container.appendChild(newNode);

                // get source element ( picker-filter-btn )
                const source = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_BTN);

                // call the attach function to attach the dropdown to the new node, so we can be framework agnostic
                attachFn(source, newNode);
            }
        }

        addPicker(filterPicker) {
            // add to dropdown .filter-bar-main-dropdown-content
            const ddContent = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT);
            const listBody = ddContent.querySelector('.' + HpvFilterBar.CssClassName.FLOATING_CONTENT_BODY);
            
            if (this.options.immediateDisplay) {
                this.addToScreen();
            }
            listBody.appendChild(filterPicker.createMenuEntry());
        }

        toggleFloatingContentVisibility() {
            const ddContent = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT);
            ddContent.style.display = ddContent.style.display == 'block' ? 'none' : 'block';

            if (this.options.afterToggleDropdown) {
                const source = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_BTN);
                this.options.afterToggleDropdown(source, ddContent);
            }
        }
    },

    // --------------------------------------------------------------------------------------------------------------------
    ItemPicker: class {
        constructor(opts = {}) {
            this.options = {
                label: 'Filter 1',
                faIcon: 'fas fa-globe',
                createEl: (filterCtx, pickerOpts) => {
                    const pickerItem = document.createElement('a');
                    pickerItem.href = '#';
                    pickerItem.innerHTML = `<i class="${pickerOpts.faIcon} icon"></i> <span class="menu-text">${pickerOpts.label}</span>`;

                    return pickerItem;
                },
                ...opts
            };
        }

        // reference to filterCtx
        setContext(filterCtx) {
            if (!(filterCtx instanceof HpvFilterBar.Context)) {
                throw new Error('Parent must be an instance of HpvFilterBar.Context');
            }
            this.filterCtx = filterCtx;
        }

        createMenuEntry() {
            const { faIcon, label, createEl } = this.options;
            const contextId = this.filterCtx.getId();

            // call constructor function to create element
            const pickerItem = createEl(this.filterCtx, this.options);
            // enforce control properties
            pickerItem.id = contextId + '-menu-entry';
            pickerItem.href = '#';
            pickerItem.classList.add(HpvFilterBar.CssClassName.PICKER_ITEM);

            pickerItem.addEventListener('click', (e) => {
                e.preventDefault();
                pickerItem.dispatchEvent(new CustomEvent('pickerBtnItemSelection', {
                    detail: { filter: this.filterCtx },
                    bubbles: true,
                    cancelable: true
                }));
            });
            return pickerItem;
        }
    },

    // --------------------------------------------------------------------------------------------------------------------
    Selector: class {
        constructor(opts = {}) {
            this.options = {
                label: 'Selected',
                defaultText: 'All',
                floatingContentTitle: 'Filters',
                immediateDisplay: false,
                disabledSelector: false,
                removable: true,
                onShowDropdown: () => {},
                onHideDropdown: () => {},
                beforeAddToScreen: (filterCtx, domDict, dom) => {},
                afterAddToScreen: (filterCtx, domDict, dom) => {},
                constructSelectorFloatingContent: (filterCtx) => {},
                getRules: (filterCtx, dom) => { return [] },
                constructSelector: null,
                constructSelectorContent: null,
                constructSelectorFloatingContent: null,
                ...opts
            };
            
            this.dom = null;
            this.domDict = {};
        }

        doCallbackAfterAddToScreen(filterCtx) {
            if ( this.options.afterAddToScreen && this.options.afterAddToScreen instanceof Function ) {
                this.options.afterAddToScreen(filterCtx, this.domDict, this.dom);
            }
        }

        doCallbackBeforeAddToScreen(filterCtx) {
            if ( this.options.beforeAddToScreen && this.options.beforeAddToScreen instanceof Function ) {
                this.options.beforeAddToScreen(filterCtx, this.domDict, this.dom);
            }
        }

        constructSelectorFloatingContent() {
            if (!this.dom && this.options.constructSelectorFloatingContent) {
                this.dom = this.options.constructSelectorFloatingContent(this.filterCtx, this.domDict);
            }
            return this.dom;
        }

        getRules(filterCtx) {
            if ( this.options.getRules ) {
                return this.options.getRules(filterCtx, this.domDict, this.dom);
            }

            return [];
        }

        // reference to filterCtx
        setContext(filterCtx) {
            if (!(filterCtx instanceof HpvFilterBar.Context)) {
                throw new Error('Parent must be an instance of HpvFilterBar.Context');
            }
            this.filterCtx = filterCtx;
        }

        updateLabel() {
            const filterSelectorBtn = document.getElementById(this.filterCtx.getId() + '-selector-btn-0');
            const filterSelectorText = filterSelectorBtn.querySelector('.' + HpvFilterBar.CssClassName.SELECTOR_BTN_TEXT);

            // custom selector may not have text
            if ( !filterSelectorText) {
                console.error('Selector text not found');
                return;
            }

            if ( this.options.constructSelectorContent && this.options.constructSelectorContent instanceof Function ) {
                const content = this.options.constructSelectorContent(this.filterCtx, this.domDict, this.dom);
                // if content is element
                if (content instanceof HTMLElement) {
                    // remove any childs 
                    filterSelectorText.innerHTML = '';
                    filterSelectorText.appendChild(content);
                } else {
                    console.error('Content must be an instance of HTMLElement');
                }
            } else {
                filterSelectorText.innerHTML = this.options.label;
            }
        }

        // fire the action to add filter to filterBar
        addToScreen() {
            this.doCallbackBeforeAddToScreen(this.filterCtx);

            const contextId = this.filterCtx.getId();
            // Add selector to filterBar, so user can see it and interact with it
            console.log(`Adding selector ${contextId} to screen`);

            let filterSelectorBtn = null;

            if ( this.options.constructSelector && this.options.constructSelector instanceof Function ) {
                filterSelectorBtn = this.options.constructSelector(this.filterCtx, this.domDict);
                filterSelectorBtn.id = contextId + '-selector-btn-' + this.filterCtx.instances;
            } else { 
                filterSelectorBtn = document.createElement('div');
                filterSelectorBtn.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN);
                filterSelectorBtn.id = contextId + '-selector-btn-' + this.filterCtx.instances;

                const filterSelectorText = document.createElement('span');
                filterSelectorText.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN_TEXT);

                if ( this.options.constructSelectorContent && this.options.constructSelectorContent instanceof Function ) {
                    const content = this.options.constructSelectorContent(this.filterCtx, this.domDict, this.dom);
                    // if content is element
                    if (content instanceof HTMLElement) {
                        // remove any childs 
                        filterSelectorText.appendChild(content);
                    } else {
                        console.error('Content must be an instance of HTMLElement');
                    }
                } else {
                    filterSelectorText.innerHTML = this.options.label;
                }

                const filterSelectorArrowContainer = document.createElement('div');
                filterSelectorArrowContainer.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN_ARROW_CONTAINER);

                const filterSelectorArrow = document.createElement('span');
                filterSelectorArrow.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN_ARROW);
                filterSelectorBtn.appendChild(filterSelectorText);

                if (!this.options.disabledSelector) {
                    filterSelectorArrowContainer.appendChild(filterSelectorArrow);
                    filterSelectorBtn.appendChild(filterSelectorArrowContainer);
                } else {
                    filterSelectorBtn.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN_DISABLED);
                }
            }

            // get position of picker-btn
            const pickerBtn = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_BTN);
            // add filterSelectorBtn before pickerBtn
            pickerBtn.parentNode.insertBefore(filterSelectorBtn, pickerBtn);

            if (!this.options.disabledSelector) {
                // add click listener to filterSelectorBtn
                filterSelectorBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    filterSelectorBtn.dispatchEvent(new CustomEvent('filterBtnItemSelection', {
                        detail: { filter: this.filterCtx, target: filterSelectorBtn },
                        bubbles: true,
                        cancelable: true
                    }));
                });
            }

            this.doCallbackAfterAddToScreen(this.filterCtx);
        } // addToScreen
    } // Selector
};