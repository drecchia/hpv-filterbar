# HPV-CHECKLIST
######  _Hyper Parametrizable Vanilla Checklist_

---

Design to offer flexibility across all environments with no dependecies. Hpv-Checklist is a _First Class_ solution for webapps checkbox lists. Unlike other options, it is not tied to a select or floating UI. It is very small (~8Kb) and customizable through a wide range of options.


[Online Demo](https://jsfiddle.net/yje571g9/2/)

Need extra help? Have a look at [the examples](https://github.com/drecchia/hpv-checklist/tree/master/examples) folder. Fill an [issue](https://github.com/drecchia/hpv-checklist/issues) if necessary.<br />

---

### Features

- [x] 100% VanillaJS
- [x] Items from js model.
- [x] No external dependencies
- [x] Flexbox based
- [x] Not attached to any css framework
- [x] No forced style
- [x] Remote Search Interface for custom implementation.
- [x] Vast callback interfaces
- [x] Custom item renderer support
- [x] Multi state checkbox (tri-state or more)
- [x] Optgroup with collapse support
- [x] Search by items or optgroups
- [x] Single selection or Multi selections supported. ( All/Optgroup shortcuts )
- [x] Any translation support via constructor options.

---

![Animation](imgs/animated.gif?raw=true "Full Animation")<br>
![Full](imgs/Screenshot_1.png?raw=true "Full Rendered")<br>
![Search](imgs/Screenshot_2.png?raw=true "Searching")<br>
![Search by OptGroup](imgs/Screenshot_3.png?raw=true "Search by optgroup")<br>
![Status Text](imgs/Screenshot_4.png?raw=true "Status Text")<br>

--- 

## Quick start

### Install

This package can be installed with:

- [npm](https://www.npmjs.com/package/hpv-checklist): `npm install --save hpv-checklist`

Or download the [latest release](https://github.com/drecchia/hpv-checklist/dist).

### CDN

- [jsdeliver](https://www.jsdelivr.com/package/npm/hpv-checklist)


### Including Hpvm Menu

#### Script and Css tag
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hpv-checklist@1.0.0/dist/css/all.css">

<script src="https://cdn.jsdelivr.net/npm/hpv-checklist@1.0.0/dist/js/all.min.js"></script>
```

## Usage

Be sure to call the Hpv once your menu element is available in the DOM.


#### HTML menu structure with all components

```html
<div id="myFirstCheckList" />
```

#### Vanilla JS

```js
document.addEventListener('DOMContentLoaded', function() {

	const checklist1 = new HpvCheckList('checklist1', {
		searchPlaceholder: "Buscar por...",
		selectAllMainText: "Selec. Todos Visíveis",
		selectAllGroupText: "Selec. Grupo",
		clearSearchTooltip: "Limpar a Busca",
		emptyText: "Nenhum item disponível",
		disabledText: "Este item está desabilitado",
		defaultOptGroupText: "Padrão",
		selectMode: 'multiple', // 'single' or 'multiple'
		states: [0, 1, 2, 3, 4],
		onSelect: (checkList, id, changedItem) => console.log('Selected:', id, changedItem),
		onDeselect: (checkList, id, changedItem) => console.log('Deselected:', id, changedItem),
		onSelectGroup: (checkList, groupName, group, changedItems) => console.log('Selected group:', groupName, changedItems),
		onDeselectGroup: (checkList, groupName, group, changedItems) => console.log('Deselected group:', groupName, changedItems),
		onCollapseGroup: (checkList, groupName, group, changedItems) => console.log('Collapsed group:', groupName, group, changedItems),
		onExpandGroup: (checkList, groupName, group, changedItems) => console.log('Expanded group:', groupName, group, changedItems),
		onSelectAll: (checkList, changedItems) => console.log('Selected all:', changedItems),
		onDeselectAll: (checkList, changedItems) => console.log('Deselected all:', changedItems),

		onLocalSearchResult: (searchTerm) => console.log('Search completed for term:', searchTerm),
		onSearchInputDelay: (searchTerm) => console.log('Delayed search for:', searchTerm),
		onClearSearch: () => console.log('Search cleared'),

		fieldMap: {
			keyField: 'id',
			labelField: 'label',
			valueField: 'value',
			optgroupField: 'optgroup',
			disabledField: 'disabled',
		},
	});

	const items = [
		{ id: 1, label: 'Apple', optgroup: 'Fruits', value: 1 },
		{ id: 2, label: 'Banana', optgroup: 'Fruits', disabled: true },
		{ id: 3, label: 'Cherry', optgroup: 'Fruits', value: 2 },
		{ id: 10, label: 'Carrot', optgroup: 'Vegetables', value: 3 },
		{ id: 11, label: 'Broccoli', optgroup: 'Vegetables' },
		{ id: 12, label: 'Spinach', optgroup: 'Vegetables' },
		{ id: 20, label: 'Gol Gti 1.0', optgroup: 'Cars' },
		{ id: 21, label: 'Fiat Palio V8', optgroup: 'Cars' },
		{ id: 22, label: 'Camaro Bubblebee', optgroup: 'Cars' },
	];

});
```

## Methods

The HpvChecklist API offers a couple of methods to control component.

#### HpvChecklist.addItem(entry)

Register a new item entry.

```js
checklist1.addItem({ 'id': 4, 'label': 'Abacaxi', value: 0 });
```

#### HpvChecklist.addItems(array)

Register multiples items at once.

```js
checklist1.addItems([
	{ id: 1, label: 'Apple', optgroup: 'Fruits', value: 1 },
    { id: 2, label: 'Banana', optgroup: 'Fruits', disabled: true },
]);
```

#### HpvChecklist.removeAllItems()

Remove all items present on this instance.

```js
checklist1.removeAllItems();
```

#### HpvChecklist.removeItem(id)

Remove an item from checklist by its ID, while displaying an beautiful transition effect.

```js
checklist1.removeItem('1');
```

#### HpvChecklist.search.clearSearch()

Clear input field value and fire filter callback.

```js
checklist1.search.clearSearch()
```

#### HpvChecklist.search.close()

Close sidebar if openned.

```js
HpvChecklist.sidebar.close();
```

#### HpvChecklist.search.performLocalSearch(word)

Perform an list filter matching desired word and fire callback.

```js
checklist1.search.performLocalSearch('morango');
```

#### HpvChecklist.ui.showEmptyStatus()

Display an user message informing that there is no items loaded in this instance.

```js
checklist1.ui.showEmptyStatus();
```

#### HpvChecklist.ui.showCustomStatus( message )

Display an custom message to user.

```js
checklist1.ui.showCustomStatus('This is a test');
```

#### HpvChecklist.items.getSelectedItems()

Return an internal model of current selected items, not original objects.

```js
checklist1.items.getSelectedItems()
```

#### HpvChecklist.items.getVisibleItems()

Return an internal model of current visible items on list.

```js
checklist1.items.getVisibleItems()
```

### RoadMap

- [ ] Virtual Scroll
- [ ] Custom Item Renderer
- [ ] Limit Max Selected Items

### Learn more ( In Progress )

-   [Tutorial]
-   [Options]
-   [Add-ons]
-   [API]

### Licence

The hpv-checklist code is licensed under the [Apache-2.0 licence](https://raw.githubusercontent.com/drecchia/hpv-checklist/master/LICENSE).<br />


### Similar projects:

- [Tail.select.js](https://github.com/wolffe/tail.select.js)
- [Select2](https://select2.org/)
