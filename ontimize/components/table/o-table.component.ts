import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChange,
  Inject,
  Injector,
  ElementRef,
  forwardRef,
  Optional,
  NgModule,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';

import { InputConverter } from '../../decorators';

import { CommonModule } from '@angular/common';
import { dataServiceFactory } from '../../services/data-service.provider';
import { OntimizeService } from '../../services';
import { OFormComponent } from '../form/o-form.component';
import { OSharedModule } from '../../shared';
import { OServiceComponent } from '../o-service-component.class';
import { CdkTableModule } from "@angular/cdk/table";
import { Observable } from 'rxjs/Observable';
import { MdSort, MdSortModule, MdTabGroup, MdTab } from '@angular/material';

import { OTableDataSource } from './o-table.datasource';
import { OTableDao } from './o-table.dao';
import { OTableColumnComponent } from './column/o-table-column.component';
import { Util } from '../../util/util';
import { OFormValue } from '../form/OFormValue';

export const DEFAULT_INPUTS_O_TABLE = [
  ...OServiceComponent.DEFAULT_INPUTS_O_SERVICE_COMPONENT,

  // insert-method [string]: name of the service method to perform inserts. Default: insert.
  'insertMethod: insert-method',

  // update-method [string]: name of the service method to perform updates. Default: update.
  'updateMethod: update-method',

  // visible-columns [string]: visible columns, separated by ';'. Default: no value.
  'visibleColumns: visible-columns',

  // editable-columns [string]: columns that can be edited directly over the table, separated by ';'. Default: no value.
  'editableColumns: editable-columns',

  // edit-on-focus [no|yes]: edit cell of an editable column when gaining the focus. Default: yes.
  'editOnFocus: edit-on-focus',

  // sort-columns [string]: initial sorting, with the format column:[ASC|DESC], separated by ';'. Default: no value.
  'sortColumns: sort-columns',

  // quick-filter [no|yes]: show quick filter. Default: yes.
  'quickFilter: quick-filter',

  // delete-button [no|yes]: show delete button. Default: yes.
  'deleteButton: delete-button',

  // refresh-button [no|yes]: show refresh button. Default: yes.
  'refreshButton: refresh-button',

  // columns-visibility-button [no|yes]: show columns visibility button. Default: yes.
  'columnsVisibilityButton: columns-visibility-button',

  // columns-resize-button [no|yes]: show columns resize button. Default: yes.
  'columnsResizeButton: columns-resize-button',

  // columns-group-button [no|yes]: show columns group button. Default: yes.
  'columnsGroupButton: columns-group-button',

  // export-button [no|yes]: show export button. Default: yes.
  'exportButton: export-button',

  // insert-table [no|yes]: fix a row at the bottom that allows to insert new records. Default: no.
  'insertTable: insert-table',

  // edition-mode [inline || empty]: edition mode opened. Default none
  'editionMode: edition-mode',

  // show-table-buttons-text [string][yes|no|true|false]: show text of header buttons
  'showTableButtonsText: show-table-buttons-text',

  // select-all-checkbox [string][yes|no|true|false]:
  'selectAllCheckbox: select-all-checkbox',

  // pagination mode [string][yes|no|true|false]
  'singlePageMode : single-page-mode',

  // pagination-controls [string][yes|no|true|false]
  'paginationControls : pagination-controls',

  //filter [string][yes|no|true|false]
  'filterCaseSensitive: filter-case-sensitive'
];

export const DEFAULT_OUTPUTS_O_TABLE = [
  'onClick',
  'onRowSelected',
  'onRowDeselected',
  'onRowDeleted',
  'onDoubleClick',
  'onTableDataLoaded',
  'onPaginatedTableDataLoaded'
];


export class OColumn {
  attr: string;
  name: string;
  title: string;
  type: string;
  className: string;
  orderable: boolean;
  searchable: boolean;
  visible: boolean
  constructor() { }
}

export class OTableOptions {
  columns: Array<OColumn> = [];
  visibleColumns: Array<any> = [];
  filter: boolean;
  filterCaseSentive: boolean;
  constructor() { }
}


@Component({
  selector: 'o-table',
  templateUrl: './o-table.component.html',
  styleUrls: ['./o-table.component.scss'],
  providers: [
    { provide: OntimizeService, useFactory: dataServiceFactory, deps: [Injector] }
  ],
  inputs: DEFAULT_INPUTS_O_TABLE,
  outputs: DEFAULT_OUTPUTS_O_TABLE,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.o-table]': 'true',
  }
})


export class OTableComponent extends OServiceComponent implements OnInit, OnDestroy, OnChanges {
  constructor(
    injector: Injector,
    elRef: ElementRef,
    @Optional() @Inject(forwardRef(() => OFormComponent)) form: OFormComponent
  ) {
    super(injector, elRef, form);
    try {
      this.mdTabGroupContainer = this.injector.get(MdTabGroup);
      this.mdTabContainer = this.injector.get(MdTab);
    } catch (error) {
      // Do nothing due to not always is contained on tab.
    }
  }

  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MdSort) sort: MdSort;

  public static TYPE_SEPARATOR = ':';
  public static VALUES_SEPARATOR = '=';
  public static TYPE_ASC_NAME = 'asc';
  public static TYPE_DESC_NAME = 'desc';
  public static COLUMNS_ALIAS_SEPARATOR = ':';

  protected _oTableOptions: OTableOptions;

  get oTableOptions(): OTableOptions {
    return this._oTableOptions;
  }
  set oTableOptions(value: OTableOptions) {
    this._oTableOptions = value;
  }


  @InputConverter()
  quickFilter: boolean = true;
  @InputConverter()
  selectAllCheckbox: boolean = true;
  @InputConverter()
  exportButton: boolean = true;
  @InputConverter()
  columnsResizeButton: boolean = true;
  @InputConverter()
  columnsGroupButton: boolean = true;
  @InputConverter()
  pageable: boolean = true;
  @InputConverter()
  showExportOptions: boolean = true;
  @InputConverter()
  columnsVisibilityButton: boolean = true;
  @InputConverter()
  filterCaseSentive: boolean = false;

  public daoTable: OTableDao | null;
  public dataSource: OTableDataSource | null;
  protected visibleColumns: string;
  protected sortColumns: string;
  protected dataParentKeys: Array<Object>;

  protected mdTabGroupContainer: MdTabGroup;
  protected mdTabContainer: MdTab;

  protected pendingQuery: boolean = true;
  protected pendingQueryFilter = undefined;

  ngOnInit() {
    this.initialize();
  }

  /**
   * Method what initialize vars and configuration 
   */
  initialize(): any {

    super.initialize();

   
    this.initializeParams();

  }


  /**
   * Store all columns and properties in var columnsArray
   * @param column 
   */
  public registerColumn(column: any) {
    let colDef: OColumn = new OColumn();
    colDef.type = 'string',
      colDef.className = 'o-table-column ' + (column.class || '') + ' ';
    colDef.orderable = true;
    colDef.searchable = true;

    if (typeof (column.attr) === 'undefined') {
      // column without 'attr' should contain only renderers that do not depend on cell data, but row data (e.g. actions)
      colDef.className += ' o-table-column-action ';
      colDef.name = column;
      colDef.attr = column;
      colDef.title = column;

    } else {
      // columns with 'attr' are linked to service data
      colDef.name = column.attr;
      colDef.title = column.title;
      if (typeof column.orderable !== "undefined")
        colDef.orderable = column.orderable;

      if (typeof column.searchable !== "undefined")
        colDef.searchable = column.searchable;

      colDef.type = column.type
    }
    colDef.visible = (this.visibleColumns.indexOf(colDef.attr) !== -1);

    //find column definition by name
    if (typeof (column.attr) !== 'undefined') {

      var alreadyExisting = this._oTableOptions.columns.filter(function (existingColumn) {
        return existingColumn.name === column.attr;
      });
      if (alreadyExisting.length === 1) {
        var replacingIndex = this._oTableOptions.columns.indexOf(alreadyExisting[0]);
        this._oTableOptions.columns[replacingIndex] = colDef;
      } else if (alreadyExisting.length === 0) {
        this._oTableOptions.columns.push(colDef);
      }
    } else {
      this._oTableOptions.columns.push(colDef);
    }
    //return colDef;
  }


  initializeEventFilter() {
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }
  /**
   * get/set parametres to component
   */
  initializeParams() {

    this.dataParentKeys = [];
    if (this.parentKeys) {
      let keys = Util.parseArray(this.parentKeys);
      for (let i = 0; i < keys.length; ++i) {
        let key = keys[i];
        let keyDef = key.split(OTableComponent.COLUMNS_ALIAS_SEPARATOR);
        if (keyDef.length === 1) {
          this.dataParentKeys.push({
            'alias': keyDef[0],
            'name': keyDef[0]
          });
        } else if (keyDef.length === 2) {
          this.dataParentKeys.push({
            'alias': keyDef[0],
            'name': keyDef[1]
          });
        }
      }
    }
    this._oTableOptions = new OTableOptions();
    //if not declare visible-columns then visible-columns is all columns
    if (this.visibleColumns)
      this.visibleColumns.split(";").map(x => this._oTableOptions.visibleColumns.push(x));
    else {
      this.visibleColumns = this.columns;
      this.columns.split(";").map(x => this._oTableOptions.visibleColumns.push(x));
    }
    this._oTableOptions.filter = this.quickFilter;
    this._oTableOptions.filterCaseSentive = this.filterCaseSentive;

    if (this.columns)
      this.columns.split(";").map(x => this.registerColumn(x));

    //parse input sort-columns
    let sortColumnsArray = [];
    if (this.sortColumns) {
      let cols = Util.parseArray(this.sortColumns);
      for (let i = 0; i < cols.length; ++i) {
        let col = cols[i];
        let colDef = col.split(OTableComponent.TYPE_SEPARATOR);
        if (colDef.length > 0) {
          let colName = colDef[0];
          for (let colIndex = 0; colIndex < this._oTableOptions.columns.length; ++colIndex) {
            if (colName === this._oTableOptions.columns[colIndex].name) {
              let sortDirection = OTableComponent.TYPE_ASC_NAME;
              if (colDef.length > 1) {
                sortDirection = colDef[1].toLowerCase();
                switch (sortDirection) {
                  case OTableComponent.TYPE_DESC_NAME:
                    sortDirection = OTableComponent.TYPE_DESC_NAME;
                    break;
                }
              }
              sortColumnsArray.push([colName, sortDirection]);
            }
          }
        }
      }

      //set values of sort-columns to mdsort
      if ((typeof (this._oTableOptions.columns) !== 'undefined') && (sortColumnsArray.length > 0)) {
        let temp = sortColumnsArray[0];
        this.sort.active = temp[0];
        this.sort.direction = temp[1].toLowerCase();
      }
    }

    if (this.mdTabGroupContainer && this.mdTabContainer) {
      /*
      * When table is contained into tab component, it is necessary to init
      * table component when attached to DOM.
      */
      var self = this;
      this.mdTabGroupContainer.selectChange.subscribe((evt) => {
        var interval = setInterval(function () { timerCallback(evt.tab); }, 100);
        function timerCallback(tab: MdTab) {
          if (tab && tab.content.isAttached) {
            clearInterval(interval);
            if (tab === self.mdTabContainer) {
              if (self.pendingQuery) {
                self.queryData(self.pendingQueryFilter);
              }
            }
          }
        }

      });
    }

    let queryArguments = this.getQueryArguments({});
    let queryMethodName = this.pageable ? this.paginatedQueryMethod : this.queryMethod;
    this.daoTable = new OTableDao(this.injector, this.service, this.entity, queryMethodName);
    this.dataSource = new OTableDataSource(this.daoTable, this._oTableOptions, this.sort);
    this.dataSource.resultsLength = 0;

    if (this.staticData) {
      this.daoTable.setDataArray(this.staticData);
    } else if (this.queryOnInit) {
      this.queryData(queryArguments);
    }

   
  }

  ngOnDestroy() {
    // TODO
  }

  ngAfterViewInit() {
    if (this.quickFilter)
      this.initializeEventFilter();
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }) {
    // TODO
  }



  queryData(parentItem: any = undefined, ovrrArgs?: any) {
    //if exit tab and not is active then waiting call queryData
    if(this.mdTabContainer && !this.mdTabContainer.isActive){
       this.pendingQuery = true;
       this.pendingQueryFilter = parentItem;
       return ;
    }

    console.log("queryData ",parentItem,ovrrArgs);
    if(this.pendingQuery){
      let filter = {};
      if ((this.dataParentKeys.length > 0) && (typeof (parentItem) !== 'undefined')) {
        for (let k = 0; k < this.dataParentKeys.length; ++k) {
          let parentKey = this.dataParentKeys[k];
          if (parentItem.hasOwnProperty(parentKey['alias'])) {
            let currentData = parentItem[parentKey['alias']];
            if (currentData instanceof OFormValue) {
              currentData = currentData.value;
            }
            filter[parentKey['name']] = currentData;
          }
        }
      }

      let queryArguments = this.getQueryArguments(filter, ovrrArgs);
      this.daoTable.getQuery(queryArguments);
      this.pendingQuery = false;
    }
  }
}

@NgModule({
  declarations: [
    OTableComponent,
    OTableColumnComponent,

  ],
  imports: [
    CommonModule,
    OSharedModule,
    CdkTableModule,
    MdSortModule

  ],
  exports: [
    OTableComponent,
    OTableColumnComponent,
  ]
})
export class OTableModule {
}
