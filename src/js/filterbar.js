const HpvFilterBar = {
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

    Context: class {
        constructor(opts = {}) {
            this.options = {
                picker: new HpvFilterBar.Picker(),
                selector: new HpvFilterBar.Selector(),
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

        setBar(parent) {
            if (!(parent instanceof HpvFilterBar.Bar)) {
                throw new Error('Parent must be an instance of HpvFilterBar.Bar');
            }
            this.parent = parent;
        }

        processMaxInstances() {
            if (this.options.uniqueInstance) {
                if (this.instances == 1) {
                    this.allowMoreInstances = false;
                    this.parent.pickerBtn.disableMenuEntry(this.options.id);
                } else {
                    this.allowMoreInstances = true;
                    this.parent.pickerBtn.enableMenuEntry(this.options.id);
                }
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

        getRules() { return {}; }
    },

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
            this.container.classList.add(HpvFilterBar.CssClassName.ROOT);
            this.pickerBtn = new HpvFilterBar.PickerBtn(this);
            this.setupEventListeners();
        }

        setupEventListeners() {
            this.container.addEventListener('pickerBtnItemSelection', (e) => {
                e.stopImmediatePropagation();
                const filterCtx = e.detail.filter;
                const selector = filterCtx.getSelector();
                if (selector.reachedInstancesLimit()) {
                    console.log('Max instances reached for filter ' + filterCtx.getId());
                    return;
                }
                selector.addToScreen();
                this.pickerBtn.toggleFloatingContentVisibility();
                if (selector.reachedInstancesLimit()) {
                    this.pickerBtn.disableMenuEntry(filterCtx.getId());
                }
            });

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
            if (filter) {
                filter.removeFromScreen();
                this.filters.delete(filterId);
            }
        }

        addFilter(filter) {
            filter.setBar(this);
            this.filters.set(filter.getId(), filter);
            const filterPicker = filter.getPicker();
            filterPicker.setContext(filter);
            this.pickerBtn.addPicker(filterPicker);
            const filterSelector = filter.getSelector();
            filterSelector.setContext(filter);
            if (filterSelector.options.immediateDisplay) {
                filterSelector.addToScreen();
            }
        }

        getMergedRules() {
            return Array.from(this.filters.values()).reduce((acc, filter) => ({...acc, ...filter.getRules()}), {});
        }
    },

    PickerBtn: class {
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
            pickerBtn.classList.add(HpvFilterBar.CssClassName.PICKER_BTN);
            pickerBtn.innerHTML = `<span title="${pickerBtnTitle}"><i class="fas fa-filter"></i></span>`;
            pickerBtn.addEventListener('click', this.toggleFloatingContentVisibility.bind(this));
            this.parent.container.appendChild(pickerBtn);
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
                const newNode = document.createElement('div');
                newNode.classList.add(HpvFilterBar.CssClassName.FLOATING_CONTENT, HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT);
                newNode.innerHTML = `
                    <div class="${HpvFilterBar.CssClassName.PICKER_FLOATING_CONTENT}">
                        <div class="${HpvFilterBar.CssClassName.SELECTOR_CONTENT_HEADER}">
                            <strong>Filtros</strong>
                        </div>
                        <div class="${HpvFilterBar.CssClassName.SELECTOR_CONTENT_BODY}">
                        </div>
                    </div>`;
                this.parent.container.appendChild(newNode);
                const source = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_BTN);
                attachFn(source, newNode);
            }
        }

        addPicker(filterPicker) {
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

    Picker: class {
        constructor(opts = {}) {
            this.options = {
                label: 'Filter 1',
                faIcon: 'fas fa-globe',
                ...opts
            };
        }

        setContext(filterCtx) {
            if (!(filterCtx instanceof HpvFilterBar.Context)) {
                throw new Error('Parent must be an instance of HpvFilterBar.Context');
            }
            this.filterCtx = filterCtx;
        }

        createMenuEntry() {
            const { faIcon, label } = this.options;
            const contextId = this.filterCtx.getId();
            const pickerItem = document.createElement('a');
            pickerItem.id = contextId + '-menu-entry';
            pickerItem.href = '#';
            pickerItem.classList.add(HpvFilterBar.CssClassName.SELECTOR_CONTENT_ITEM);
            pickerItem.innerHTML = `<i class="${faIcon}"></i> <span class="menu-text">${label}</span>`;
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

    Selector: class {
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
            };
            this.instances = 0;
            this.dom = null;
        }

        createDom() {
            if (!this.dom && this.options.createDom) {
                this.dom = this.options.createDom(this);
            }
            return this.dom;
        }

        reachedInstancesLimit() {
            return this.instances >= this.options.maxInstances;
        }

        setContext(filterCtx) {
            if (!(filterCtx instanceof HpvFilterBar.Context)) {
                throw new Error('Parent must be an instance of HpvFilterBar.Context');
            }
            this.filterCtx = filterCtx;
        }

        addToScreen() {
            this.instances++;
            const contextId = this.filterCtx.getId();
            console.log(`Adding selector ${contextId} to screen`);
            const filterSelectorBtn = document.createElement('div');
            filterSelectorBtn.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN);
            filterSelectorBtn.id = contextId + '-selector-btn-' + this.instances;
            const filterSelectorText = document.createElement('span');
            filterSelectorText.classList.add(HpvFilterBar.CssClassName.SELECTOR_BTN_TEXT);
            filterSelectorText.innerText = this.options.label;
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
            const pickerBtn = document.querySelector('.' + HpvFilterBar.CssClassName.PICKER_BTN);
            pickerBtn.parentNode.insertBefore(filterSelectorBtn, pickerBtn);
            if (!this.options.disabledSelector) {
                filterSelectorBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    filterSelectorBtn.dispatchEvent(new CustomEvent('filterBtnItemSelection', {
                        detail: { filter: this.filterCtx },
                        bubbles: true,
                        cancelable: true
                    }));
                });
            }
        }
    }
};