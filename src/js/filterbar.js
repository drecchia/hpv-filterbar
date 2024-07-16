const HpvFilterBar = {
    // --------------------------------------------------------------------------------------------------------------------
    CssClassName: {
        ROOT: 'hpv-filter-bar',
        FLOATING_CONTENT: 'floating-content',
        IS_READONLY: 'is-readonly',
        PICKER_BTN: 'picker-btn',
        PICKER_FLOATING_CONTENT: 'picker-floating-content',
        SELECTOR_BTN: 'selector-btn',
        SELECTOR_BTN_DISABLED: 'selector-btn-disabled',
        SELECTOR_BTN_TEXT: 'selector-btn-text',
        SELECTOR_BTN_ARROW_CONTAINER: 'selector-btn-arrow-container',
        SELECTOR_BTN_ARROW: 'selector-btn-arrow',
        SELECTOR_CONTENT_HEADER: 'filter-content-header',
        SELECTOR_CONTENT_BODY: 'filter-content-body',
        SELECTOR_CONTENT_ITEM: 'filter-content-item',
    },

    // --------------------------------------------------------------------------------------------------------------------
    Bar: class {
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
            this.container.classList.add(HpvFilterBar.CssClassName.ROOT);
            // create pickerBtn
            this.pickerBtn = new HpvFilterBar.PickerBtn(this);
            // bubble events
            this.setupEventListeners();
        }

        setupEventListeners() {
            // listen for filter item click ( user is adding a filter to filter bar )
            this.container.addEventListener('pickerBtnItemSelection', (e) => {
                e.stopImmediatePropagation();

                const filterCtx = e.detail.filter;
                const selector = filterCtx.getSelector();

                if (filterCtx.reachedInstancesLimit()) {
                    console.log('Max instances reached for filter ' + filterCtx.getId());
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

                // 1. create floating div
                const newNode = document.createElement('div');
                newNode.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT);
                // 2. bind source element to floating div
                const source = e.detail.target;
                this.options.attachDropdown(source, newNode);
                // 3. call filterCtx.getSelector().createDom() to get the dom element
                const el = filterCtx.getSelector().createDom();
                if (!el) return;
                console.log(el);
                // 4. add to floating div
                newNode.appendChild(el);
                // 5. add to dom
                this.container.appendChild(newNode);
                // 6. set dropdown visible
                newNode.style.display = 'block';
                // 7. do callback
            });
        }

        removeFilter(filterId) {
            const filter = this.filters.get(filterId);
            if (filter) {
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

            if (filterSelector.options.immediateDisplay) {
                filterSelector.addToScreen();

                filter.instances++;
                filter.processMaxInstances();
            }
        }

        getMergedRules() {
            // call all filter with instances > 0 method getRules
            return Array.from(this.filters.values())
                .filter(f => f.instances > 0)
                .map(f => f.getRules())
                .reduce((acc, val) => acc.concat(val), []);
        }
    },

    // --------------------------------------------------------------------------------------------------------------------
    Context: class {
        constructor(opts = {}) {
            this.options = {
                picker: new HpvFilterBar.ItemPicker(),
                selector: new HpvFilterBar.Selector(),
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

        removeFromScreen() {
            console.log(`Removing filter ${this.options.id} from screen`);
            const filterSelectorBtn = document.getElementById(this.options.id + '-selector-btn');
            filterSelectorBtn.remove();

            this.instances--;

            if (this.options.onRemoveFromBar) {
                this.options.onRemoveFromBar(this.parent, this);
            }
            this.processMaxInstances();
        }

        getRules() {
            const selector = this.getSelector();
            if ( selector ) {
                return selector.getRules(this, selector.dom);
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
            pickerTrigger.classList.add(HpvFilterBar.CssClassName.PICKER_BTN);
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
            const attachFn = this.options.attachDropdown;
            if (typeof attachFn === 'function') {
                // create a new div on document root
                const newNode = document.createElement('div');
                newNode.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT, HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT);
                // add html
                newNode.innerHTML = `
                    <div class="${HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT}">
                        <div class="${HpvFilterBar.CssClassName.SELECTOR_CONTENT_HEADER}">
                            <strong>Filtros</strong>
                        </div>
                        <div class="${HpvFilterBar.CssClassName.SELECTOR_CONTENT_BODY}">
                        </div>
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
            const listBody = ddContent.querySelector('.' + HpvFilterBar.CssClassName.SELECTOR_CONTENT_BODY);
            
            if (this.options.immediateDisplay) {
                this.addToScreen();
            }
            listBody.appendChild(filterPicker.createMenuEntry());
        }

        toggleFloatingContentVisibility() {
            const ddContent = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT);
            ddContent.style.display = ddContent.style.display == 'block' ? 'none' : 'block';

            if (this.options.onToggleDropdown) {
                const source = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_BTN);
                this.options.onToggleDropdown(source, ddContent);
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
            pickerItem.classList.add(HpvFilterBar.CssClassName.SELECTOR_CONTENT_ITEM);

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
                immediateDisplay: false,
                disabledSelector: false,
                onShowDropdown: () => {},
                onHideDropdown: () => {},
                createDom: (filterCtx) => {},
                getRules: (filterCtx, dom) => { return [] },
                ...opts
            };
            
            this.dom = null;
        }

        createDom() {
            if (!this.dom && this.options.createDom) {
                this.dom = this.options.createDom(this);
            }
            return this.dom;
        }
        
        getRules(filterCtx, dom) {
            if ( this.options.getRules ) {
                return this.options.getRules(filterCtx, this.dom);
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

        // fire the action to add filter to filterBar
        addToScreen() {
            const contextId = this.filterCtx.getId();
            // Add selector to filterBar, so user can see it and interact with it
            console.log(`Adding selector ${contextId} to screen`);

            const filterSelectorBtn = document.createElement('div');
            filterSelectorBtn.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN);
            filterSelectorBtn.id = contextId + '-selector-btn-' + this.filterCtx.instances;

            const filterSelectorText = document.createElement('span');
            filterSelectorText.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN_TEXT);

            if ( this.options.constructHtmlLabel && this.options.constructHtmlLabel instanceof Function ) {
                filterSelectorText.innerHTML = this.options.constructHtmlLabel(this.filterCtx);
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
        }
    }
};