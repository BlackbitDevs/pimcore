/**
 * Pimcore
 *
 * This source file is available under two different licenses:
 * - GNU General Public License version 3 (GPLv3)
 * - Pimcore Enterprise License (PEL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 * @copyright  Copyright (c) Pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GPLv3 and PEL
 */

pimcore.registerNS("pimcore.object.tags.abstractRelations");
pimcore.object.tags.abstractRelations = Class.create(pimcore.object.tags.abstract, {

    getFilterEditToolbarItems: function () {
        return [
            {
                xtype: 'textfield',
                hidden: true,
                cls: 'relations_grid_filter_input',
                width: '250px',
                listeners:
                    {
                        keyup: {
                            fn: this.filterStore.bind(this),
                            element: "el"
                        },
                        blur: function (filterField) {
                            /* do not hide filter if filter is active */
                            if (filterField.getValue().length === 0) {
                                this.hideFilterInput(filterField);
                            }
                        }.bind(this)
                    }
            },
            {
                xtype: "button",
                iconCls: "pimcore_icon_filter",
                cls: "relations_grid_filter_btn",
                handler: this.showFilterInput.bind(this)
            }
        ];
    },

    showFilterInput: function (filterBtn) {
        var filterInput = filterBtn.previousSibling("field[cls~=relations_grid_filter_input]");
        filterInput.show();
        filterInput.focus();
        filterBtn.hide();
    },

    hideFilterInput: function (filterInput) {
        var filterBtn = filterInput.nextSibling("button[cls~=relations_grid_filter_btn]");
        filterBtn.show();
        filterInput.hide();
    },

    filterStore: function (e) {
        var visibleFieldDefinitions = this.fieldConfig.visibleFieldDefinitions || {};
        var visibleFields = Ext.Object.getKeys(visibleFieldDefinitions);
        var metaDataFields = this.fieldConfig.columnKeys || [];
        var searchColumns = Ext.Array.merge(visibleFields, metaDataFields);

        /* always search in path (relations), fullpath (object relations) and id */
        searchColumns.push("path");
        searchColumns.push("fullpath");
        searchColumns.push("id");

        searchColumns = Ext.Array.unique(searchColumns);

        var q = Ext.get(e.target).getValue().toLowerCase();
        var searchFilter = new Ext.util.Filter({
            filterFn: function (item) {
                for (var column in item.data) {
                    var value = item.data[column];
                    /* skip none-search columns and null values */
                    if (searchColumns.indexOf(column) < 0 || !value) {
                        continue;
                    }
                    /* links */
                    if (!!visibleFieldDefinitions[column] && visibleFieldDefinitions[column].fieldtype === "link") {
                        value = [value.text, value.title, value.path].join(" ");
                    }
                    /* numbers, texts */
                    value = String(value).toLowerCase();
                    if (value.indexOf(q) >= 0) {
                        return true;
                    }
                }
                return false;
            }
        });
        this.store.clearFilter();
        this.store.filter(searchFilter);
    },

    /*
    getGridColumnFilter: function (field) {
        if(typeof Ext.grid.filters.filter.QuantityValue === 'undefined') {
            Ext.define('Ext.grid.filters.filter.QuantityValue', {
                extend: 'Ext.grid.filters.filter.Number',
                alias: 'grid.filter.quantityValue',
                type: 'quantityValue',
                constructor: function(config) {
                    var me = this;
                    me.callParent([
                        config
                    ]);

                    this.store = config.store;
                },
                createMenu: function () {
                    var me = this;
                    me.callParent();

                    var cfg = {
                        xtype: 'combo',
                        name: 'unit',
                        labelClsExtra: Ext.baseCSSPrefix + 'grid-filters-icon pimcore_nav_icon_quantityValue',
                        queryMode: 'local',
                        editable: false,
                        forceSelection: true,
                        hideEmptyLabel: false,
                        store: this.store,
                        valueField: 'id',
                        displayField: 'abbreviation',
                        margin: 0,
                        listeners: {
                            change: function (field) {
                                var me = this;

                                me.onValueChange(field, {
                                    RETURN: 1, getKey: function () {
                                        return null;
                                    }
                                });
                            }.bind(this)
                        }
                    };
                    if (me.getItemDefaults()) {
                        cfg = Ext.merge({}, me.getItemDefaults(), cfg);
                    }

                    me.menu.insert(0, '-');
                    me.fields.unit = me.menu.insert(0, cfg);
                },
                setValue: function (value) {
                    var me = this;
                    var unitId = me.fields.unit.getValue();

                    if (unitId) {
                        for (var i in value) {
                            value[i] = [[value[i], unitId]];
                        }
                    }

                    me.callParent([value]);
                },
                showMenu: function (menuItem) {
                    this.callParent([menuItem]);

                    for (var i in this.filter) {
                        if (this.filter[i].getValue() !== null) {
                            this.fields[i].setValue(this.filter[i].getValue()[0][0]);
                        }
                    }
                }
            });
        }

        var store = new Ext.data.JsonStore({
            autoDestroy: true,
            root: 'data',
            fields: ['id', 'abbreviation']
        });
        pimcore.helpers.quantityValue.initUnitStore(function(data) {
            store.loadData(data.data);
        }, field.layout.validUnits);

        return {
            type: 'quantityValue',
            dataIndex: field.key,
            store: store
        };
    },*/

    getGridColumnFilter: function(field) {
        if(typeof Ext.grid.filters.filter.Relation === 'undefined') {
            Ext.define('Ext.grid.filters.filter.Relation', {
                extend: 'Ext.grid.filters.filter.List',
                alias: 'grid.filter.relation',
                type: 'relation',
                createMenu: function() {
                    var me = this,
                        config;
                    me.callParent();
                    config = Ext.apply({}, me.getItemDefaults());
                    if (config.iconCls && !('labelClsExtra' in config)) {
                        config.labelClsExtra = Ext.baseCSSPrefix + 'grid-filters-icon ' + config.iconCls;
                    }
                    delete config.iconCls;
                    config.emptyText = config.emptyText || me.emptyText;
                    me.inputItem = me.menu.insert(0, config);
                    me.inputItem.on({
                        scope: me,
                        keyup: me.onSearchChange,
                        el: {
                            click: function(e) {
                                e.stopPropagation();
                            }
                        }
                    });
                },
                onSearchChange: function(field, e) {
                    var value = me.getValue(field);

                    Ext.Ajax.request({
                        url: "/admin/object/relation-options",
                        method: 'get',
                        params: {search: value},
                        success: function (response) {
                            response = Ext.decode(response.responseText);

                            var me = this,
                                menu = me.menu,
                                len = response.length,
                                listeners, itemDefaults, record, gid, idValue, idField, labelValue, labelField, i, item, processed;
                            // B/c we're listening to datachanged event, we need to make sure there's a menu.
                            if (len && menu) {
                                listeners = {
                                    checkchange: function(field, checked) {
                                        var value = field.getValue();
                                        me.filter.setValue(value);
                                    },
                                    scope: me
                                };
                                menu.suspendLayouts();
                                menu.removeAll(true);
                                gid = me.single ? Ext.id() : null;
                                processed = [];
                                for (i = 0; i < len; i++) {
                                    record = response[i];
                                    idValue = record.id;
                                    labelValue = record.label;

                                    processed.push(labelValue);
                                    // Note that the menu items will be set checked in filter#activate() if the value of the menu
                                    // item is in the cfg.value array.
                                    item = menu.add(Ext.apply({
                                        text: labelValue,
                                        group: gid,
                                        value: idValue,
                                        listeners: listeners
                                    }));
                                }
                                menu.resumeLayouts(true);
                            }
                        }.bind(this)
                    });
                }
            });
        }

        return {
            type: 'relation',
            dataIndex: field.key
        };
    },

    batchPrepare: function(columnDataIndex, grid, onlySelected, append, remove){
        var columnIndex = columnDataIndex.fullColumnIndex;
        var editor = grid.getColumns()[columnIndex].getEditor();
        var metaIndex = this.fieldConfig.columnKeys.indexOf(columnDataIndex.dataIndex);
        var columnConfig = this.fieldConfig.columns[metaIndex];

        if (columnConfig.type == 'multiselect') { //create edit layout for multiselect field
            var selectData = [];
            if (columnConfig.value) {
                var selectDataRaw = columnConfig.value.split(";");
                for (var j = 0; j < selectDataRaw.length; j++) {
                    selectData.push([selectDataRaw[j], ts(selectDataRaw[j])]);
                }
            }

            var store = new Ext.data.ArrayStore({
                fields: [
                    'id',
                    'label'
                ],
                data: selectData
            });

            var options = {
                triggerAction: "all",
                editable: false,
                store: store,
                componentCls: "object_field",
                height: '100%',
                valueField: 'id',
                displayField: 'label'
            };

            editor = Ext.create('Ext.ux.form.MultiSelect', options);
        } else if (columnConfig.type == 'bool') { //create edit layout for bool meta field
            editor = new Ext.form.Checkbox();
        }

        var editorLabel = Ext.create('Ext.form.Label', {
            text: grid.getColumns()[columnIndex].text + ':',
            style: {
                float: 'left',
                margin: '0 20px 0 0'
            }
        });

        var formPanel = Ext.create('Ext.form.Panel', {
            xtype: "form",
            border: false,
            items: [editorLabel, editor],
            bodyStyle: "padding: 10px;",
            buttons: [
                {
                    text: t("edit"),
                    handler: function() {
                        if(formPanel.isValid()) {
                            this.batchProcess(columnDataIndex.dataIndex, editor, grid, onlySelected);
                        }
                    }.bind(this)
                }
            ]
        });
        var batchTitle = onlySelected ? "batch_edit_field_selected" : "batch_edit_field";
        var title = t(batchTitle) + " " + grid.getColumns()[columnIndex].text;
        this.batchWin = new Ext.Window({
            autoScroll: true,
            modal: false,
            title: title,
            items: [formPanel],
            bodyStyle: "background: #fff;",
            width: 500,
            maxHeight: 400
        });
        this.batchWin.show();
        this.batchWin.updateLayout();

    },

    batchProcess: function (dataIndex, editor, grid, onlySelected) {

        var newValue = editor.getValue();
        var valueType = "primitive";

        if (onlySelected) {
            var selectedRows = grid.getSelectionModel().getSelection();
            for (var i=0; i<selectedRows.length; i++) {
                selectedRows[i].set(dataIndex, newValue);
            }
        } else {
            var items = grid.store.data.items;
            for (var i = 0; i < items.length; i++)
            {
                var record = grid.store.getAt(i);
                record.set(dataIndex, newValue);
            }
        }

        this.batchWin.close();
    }

});
