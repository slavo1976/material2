import {DataSource} from '@angular/cdk/collections';
import {Component, ViewChild} from '@angular/core';
import {async, ComponentFixture, fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BehaviorSubject, Observable} from 'rxjs';
import {MatPaginator, MatPaginatorModule} from '../paginator/index';
import {MatSort, MatSortHeader, MatSortModule} from '../sort/index';
import {MatTableModule} from './index';
import {MatTable} from './table';
import {MatTableDataSource} from './table-data-source';


describe('MatTable', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatTableModule, MatPaginatorModule, MatSortModule, NoopAnimationsModule],
      declarations: [
        MatTableApp,
        MatTableWithWhenRowApp,
        ArrayDataSourceMatTableApp,
        NativeHtmlTableApp,
        MatTableWithSortApp,
        MatTableWithPaginatorApp,
      ],
    }).compileComponents();
  }));

  describe('with basic data source', () => {
    it('should be able to create a table with the right content and without when row', () => {
      let fixture = TestBed.createComponent(MatTableApp);
      fixture.detectChanges();

      const tableElement = fixture.nativeElement.querySelector('.mat-table')!;
      const data = fixture.componentInstance.dataSource!.data;
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        [data[0].a, data[0].b, data[0].c],
        [data[1].a, data[1].b, data[1].c],
        [data[2].a, data[2].b, data[2].c],
        ['fourth_row'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('should create a table with special when row', () => {
      let fixture = TestBed.createComponent(MatTableWithWhenRowApp);
      fixture.detectChanges();

      const tableElement = fixture.nativeElement.querySelector('.mat-table');
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1'],
        ['a_2'],
        ['a_3'],
        ['fourth_row'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });
  });

  it('should be able to render a table correctly with native elements', () => {
    let fixture = TestBed.createComponent(NativeHtmlTableApp);
    fixture.detectChanges();

    const tableElement = fixture.nativeElement.querySelector('table');
    const data = fixture.componentInstance.dataSource!.data;
    expectTableToMatchContent(tableElement, [
      ['Column A', 'Column B', 'Column C'],
      [data[0].a, data[0].b, data[0].c],
      [data[1].a, data[1].b, data[1].c],
      [data[2].a, data[2].b, data[2].c],
      [data[3].a, data[3].b, data[3].c],
    ]);
  });

  it('should render with MatTableDataSource and sort', () => {
    let fixture = TestBed.createComponent(MatTableWithSortApp);
    fixture.detectChanges();

    const tableElement = fixture.nativeElement.querySelector('.mat-table')!;
    const data = fixture.componentInstance.dataSource!.data;
    expectTableToMatchContent(tableElement, [
      ['Column A', 'Column B', 'Column C'],
      [data[0].a, data[0].b, data[0].c],
      [data[1].a, data[1].b, data[1].c],
      [data[2].a, data[2].b, data[2].c],
    ]);
  });

  it('should render with MatTableDataSource and pagination', () => {
    let fixture = TestBed.createComponent(MatTableWithPaginatorApp);
    fixture.detectChanges();

    const tableElement = fixture.nativeElement.querySelector('.mat-table')!;
    const data = fixture.componentInstance.dataSource!.data;
    expectTableToMatchContent(tableElement, [
      ['Column A', 'Column B', 'Column C'],
      [data[0].a, data[0].b, data[0].c],
      [data[1].a, data[1].b, data[1].c],
      [data[2].a, data[2].b, data[2].c],
    ]);
  });

  describe('with MatTableDataSource and sort/pagination/filter', () => {
    let tableElement: HTMLElement;
    let fixture: ComponentFixture<ArrayDataSourceMatTableApp>;
    let dataSource: MatTableDataSource<TestData>;
    let component: ArrayDataSourceMatTableApp;

    beforeEach(() => {
      fixture = TestBed.createComponent(ArrayDataSourceMatTableApp);
      fixture.detectChanges();

      tableElement = fixture.nativeElement.querySelector('.mat-table');
      component = fixture.componentInstance;
      dataSource = fixture.componentInstance.dataSource;
    });

    it('should create table and display data source contents', () => {
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('changing data should update the table contents', () => {
      // Add data
      component.underlyingDataSource.addData();
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['a_4', 'b_4', 'c_4'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Remove data
      const modifiedData = dataSource.data.slice();
      modifiedData.shift();
      dataSource.data = modifiedData;
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['a_4', 'b_4', 'c_4'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('should be able to filter the table contents', fakeAsync(() => {
      // Change filter to a_1, should match one row
      dataSource.filter = 'a_1';
      fixture.detectChanges();
      expect(dataSource.filteredData.length).toBe(1);
      expect(dataSource.filteredData[0]).toBe(dataSource.data[0]);
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      flushMicrotasks();  // Resolve promise that updates paginator's length
      expect(dataSource.paginator!.length).toBe(1);

      // Change filter to '  A_2  ', should match one row (ignores case and whitespace)
      dataSource.filter = '  A_2  ';
      fixture.detectChanges();
      expect(dataSource.filteredData.length).toBe(1);
      expect(dataSource.filteredData[0]).toBe(dataSource.data[1]);
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_2', 'b_2', 'c_2'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Change filter to empty string, should match all rows
      dataSource.filter = '';
      fixture.detectChanges();
      expect(dataSource.filteredData.length).toBe(3);
      expect(dataSource.filteredData[0]).toBe(dataSource.data[0]);
      expect(dataSource.filteredData[1]).toBe(dataSource.data[1]);
      expect(dataSource.filteredData[2]).toBe(dataSource.data[2]);
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Change filter function and filter, should match to rows with zebra.
      dataSource.filterPredicate = (data, filter) => {
        let dataStr;
        switch (data.a) {
          case 'a_1': dataStr = 'elephant'; break;
          case 'a_2': dataStr = 'zebra'; break;
          case 'a_3': dataStr = 'monkey'; break;
          default: dataStr = '';
        }

        return dataStr.indexOf(filter) != -1;
      };
      dataSource.filter = 'zebra';
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_2', 'b_2', 'c_2'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    }));

    it('should be able to sort the table contents', () => {
      // Activate column A sort
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Activate column A sort again (reverse direction)
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_3', 'b_3', 'c_3'],
        ['a_2', 'b_2', 'c_2'],
        ['a_1', 'b_1', 'c_1'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Change sort function to customize how it sorts - first column 1, then 3, then 2
      dataSource.sortingDataAccessor = data => {
        switch (data.a) {
          case 'a_1': return 'elephant';
          case 'a_2': return 'zebra';
          case 'a_3': return 'monkey';
          default: return '';
        }
      };
      component.sort.direction = '';
      component.sort.sort(component.sortHeader);
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['a_3', 'b_3', 'c_3'],
        ['a_2', 'b_2', 'c_2'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('should by default correctly sort an empty string', () => {
      // Activate column A sort
      dataSource.data[0].a = ' ';
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();

      // Expect that empty string row comes before the other values
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Expect that empty string row comes before the other values
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_3', 'b_3', 'c_3'],
        ['a_2', 'b_2', 'c_2'],
        ['', 'b_1', 'c_1'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('should by default correctly sort undefined values', () => {
      // Activate column A sort
      dataSource.data[0].a = undefined;

      // Expect that undefined row comes before the other values
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);


      // Expect that undefined row comes after the other values
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_3', 'b_3', 'c_3'],
        ['a_2', 'b_2', 'c_2'],
        ['', 'b_1', 'c_1'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('should sort zero correctly', () => {
      // Activate column A sort
      dataSource.data[0].a = 1;
      dataSource.data[1].a = 0;
      dataSource.data[2].a = -1;

      // Expect that zero comes after the negative numbers and before the positive ones.
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['-1', 'b_3', 'c_3'],
        ['0', 'b_2', 'c_2'],
        ['1', 'b_1', 'c_1'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);


      // Expect that zero comes after the negative numbers and before
      // the positive ones when switching the sorting direction.
      component.sort.sort(component.sortHeader);
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['1', 'b_1', 'c_1'],
        ['0', 'b_2', 'c_2'],
        ['-1', 'b_3', 'c_3'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    });

    it('should be able to page the table contents', fakeAsync(() => {
      // Add 100 rows, should only display first 5 since page length is 5
      for (let i = 0; i < 100; i++) {
        component.underlyingDataSource.addData();
      }
      fixture.detectChanges();
      flushMicrotasks();  // Resolve promise that updates paginator's length
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_1', 'b_1', 'c_1'],
        ['a_2', 'b_2', 'c_2'],
        ['a_3', 'b_3', 'c_3'],
        ['a_4', 'b_4', 'c_4'],
        ['a_5', 'b_5', 'c_5'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);

      // Navigate to the next page
      component.paginator.nextPage();
      fixture.detectChanges();
      expectTableToMatchContent(tableElement, [
        ['Column A', 'Column B', 'Column C'],
        ['a_6', 'b_6', 'c_6'],
        ['a_7', 'b_7', 'c_7'],
        ['a_8', 'b_8', 'c_8'],
        ['a_9', 'b_9', 'c_9'],
        ['a_10', 'b_10', 'c_10'],
        ['Footer A', 'Footer B', 'Footer C'],
      ]);
    }));
  });
});

interface TestData {
  a: string|number|undefined;
  b: string|number|undefined;
  c: string|number|undefined;
}

class FakeDataSource extends DataSource<TestData> {
  _dataChange = new BehaviorSubject<TestData[]>([]);
  set data(data: TestData[]) { this._dataChange.next(data); }
  get data() { return this._dataChange.getValue(); }

  constructor() {
    super();
    for (let i = 0; i < 4; i++) { this.addData(); }
  }

  connect(): Observable<TestData[]> {
    return this._dataChange;
  }

  disconnect() {}

  addData() {
    const nextIndex = this.data.length + 1;

    let copiedData = this.data.slice();
    copiedData.push({
      a: `a_${nextIndex}`,
      b: `b_${nextIndex}`,
      c: `c_${nextIndex}`
    });

    this.data = copiedData;
  }
}

@Component({
  template: `
    <mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="column_a">
        <mat-header-cell *matHeaderCellDef> Column A</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.a}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer A</mat-footer-cell>
      </ng-container>

      <ng-container matColumnDef="column_b">
        <mat-header-cell *matHeaderCellDef> Column B</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.b}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer B</mat-footer-cell>
      </ng-container>

      <ng-container matColumnDef="column_c">
        <mat-header-cell *matHeaderCellDef> Column C</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.c}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer C</mat-footer-cell>
      </ng-container>

      <ng-container matColumnDef="special_column">
        <mat-cell *matCellDef="let row"> fourth_row </mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="columnsToRender"></mat-header-row>
      <mat-row *matRowDef="let row; columns: columnsToRender"></mat-row>
      <mat-row *matRowDef="let row; columns: ['special_column']; when: isFourthRow"></mat-row>
      <mat-footer-row *matFooterRowDef="columnsToRender"></mat-footer-row>
    </mat-table>
  `
})
class MatTableApp {
  dataSource: FakeDataSource | null = new FakeDataSource();
  columnsToRender = ['column_a', 'column_b', 'column_c'];
  isFourthRow = (i: number, _rowData: TestData) => i == 3;

  @ViewChild(MatTable) table: MatTable<TestData>;
}

@Component({
  template: `
    <table mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="column_a">
        <th mat-header-cell *matHeaderCellDef> Column A</th>
        <td mat-cell *matCellDef="let row"> {{row.a}}</td>
      </ng-container>

      <ng-container matColumnDef="column_b">
        <th mat-header-cell *matHeaderCellDef> Column B</th>
        <td mat-cell *matCellDef="let row"> {{row.b}}</td>
      </ng-container>

      <ng-container matColumnDef="column_c">
        <th mat-header-cell *matHeaderCellDef> Column C</th>
        <td mat-cell *matCellDef="let row"> {{row.c}}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columnsToRender"></tr>
      <tr mat-row *matRowDef="let row; columns: columnsToRender"></tr>
    </table>
  `
})
class NativeHtmlTableApp {
  dataSource: FakeDataSource | null = new FakeDataSource();
  columnsToRender = ['column_a', 'column_b', 'column_c'];

  @ViewChild(MatTable) table: MatTable<TestData>;
}


@Component({
  template: `
    <mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="column_a">
        <mat-header-cell *matHeaderCellDef> Column A</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.a}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer A</mat-footer-cell>
      </ng-container>

      <ng-container matColumnDef="special_column">
        <mat-cell *matCellDef="let row"> fourth_row </mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="['column_a']"></mat-header-row>
      <mat-row *matRowDef="let row; columns: ['column_a']"></mat-row>
      <mat-row *matRowDef="let row; columns: ['special_column']; when: isFourthRow"></mat-row>
      <mat-footer-row *matFooterRowDef="['column_a']"></mat-footer-row>
    </mat-table>
  `
})
class MatTableWithWhenRowApp {
  dataSource: FakeDataSource | null = new FakeDataSource();
  isFourthRow = (i: number, _rowData: TestData) => i == 3;

  @ViewChild(MatTable) table: MatTable<TestData>;
}


@Component({
  template: `
    <mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="column_a">
        <mat-header-cell *matHeaderCellDef mat-sort-header="a"> Column A</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.a}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer A</mat-footer-cell>
      </ng-container>

      <ng-container matColumnDef="column_b">
        <mat-header-cell *matHeaderCellDef> Column B</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.b}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer B</mat-footer-cell>
      </ng-container>

      <ng-container matColumnDef="column_c">
        <mat-header-cell *matHeaderCellDef> Column C</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.c}}</mat-cell>
        <mat-footer-cell *matFooterCellDef> Footer C</mat-footer-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="columnsToRender"></mat-header-row>
      <mat-row *matRowDef="let row; columns: columnsToRender"></mat-row>
      <mat-footer-row *matFooterRowDef="columnsToRender"></mat-footer-row>
    </mat-table>

    <mat-paginator [pageSize]="5"></mat-paginator>
  `
})
class ArrayDataSourceMatTableApp {
  underlyingDataSource = new FakeDataSource();
  dataSource = new MatTableDataSource<TestData>();
  columnsToRender = ['column_a', 'column_b', 'column_c'];

  @ViewChild(MatTable) table: MatTable<TestData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatSortHeader) sortHeader: MatSortHeader;

  constructor() {
    this.underlyingDataSource.data = [];

    // Add three rows of data
    this.underlyingDataSource.addData();
    this.underlyingDataSource.addData();
    this.underlyingDataSource.addData();

    this.underlyingDataSource.connect().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.dataSource!.sort = this.sort;
    this.dataSource!.paginator = this.paginator;
  }
}


@Component({
  template: `
    <mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="column_a">
        <mat-header-cell *matHeaderCellDef mat-sort-header="a"> Column A</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.a}}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="column_b">
        <mat-header-cell *matHeaderCellDef> Column B</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.b}}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="column_c">
        <mat-header-cell *matHeaderCellDef> Column C</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.c}}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="columnsToRender"></mat-header-row>
      <mat-row *matRowDef="let row; columns: columnsToRender"></mat-row>
    </mat-table>
  `
})
class MatTableWithSortApp {
  underlyingDataSource = new FakeDataSource();
  dataSource = new MatTableDataSource<TestData>();
  columnsToRender = ['column_a', 'column_b', 'column_c'];

  @ViewChild(MatTable) table: MatTable<TestData>;
  @ViewChild(MatSort) sort: MatSort;

  constructor() {
    this.underlyingDataSource.data = [];

    // Add three rows of data
    this.underlyingDataSource.addData();
    this.underlyingDataSource.addData();
    this.underlyingDataSource.addData();

    this.underlyingDataSource.connect().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.dataSource!.sort = this.sort;
  }
}

@Component({
  template: `
    <mat-table [dataSource]="dataSource">
      <ng-container matColumnDef="column_a">
        <mat-header-cell *matHeaderCellDef> Column A</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.a}}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="column_b">
        <mat-header-cell *matHeaderCellDef> Column B</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.b}}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="column_c">
        <mat-header-cell *matHeaderCellDef> Column C</mat-header-cell>
        <mat-cell *matCellDef="let row"> {{row.c}}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="columnsToRender"></mat-header-row>
      <mat-row *matRowDef="let row; columns: columnsToRender"></mat-row>
    </mat-table>

    <mat-paginator [pageSize]="5"></mat-paginator>
  `
})
class MatTableWithPaginatorApp {
  underlyingDataSource = new FakeDataSource();
  dataSource = new MatTableDataSource<TestData>();
  columnsToRender = ['column_a', 'column_b', 'column_c'];

  @ViewChild(MatTable) table: MatTable<TestData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor() {
    this.underlyingDataSource.data = [];

    // Add three rows of data
    this.underlyingDataSource.addData();
    this.underlyingDataSource.addData();
    this.underlyingDataSource.addData();

    this.underlyingDataSource.connect().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.dataSource!.paginator = this.paginator;
  }
}

function getElements(element: Element, query: string): Element[] {
  return [].slice.call(element.querySelectorAll(query));
}

function getHeaderRow(tableElement: Element): Element {
  return tableElement.querySelector('.mat-header-row')!;
}

function getFooterRow(tableElement: Element): Element {
  return tableElement.querySelector('.mat-footer-row')!;
}

function getRows(tableElement: Element): Element[] {
  return getElements(tableElement, '.mat-row');
}
function getCells(row: Element): Element[] {
  return row ? getElements(row, '.mat-cell') : [];
}

function getHeaderCells(tableElement: Element): Element[] {
  return getElements(getHeaderRow(tableElement), '.mat-header-cell');
}

function getFooterCells(tableElement: Element): Element[] {
  return getElements(getFooterRow(tableElement), '.mat-footer-cell');
}

function getActualTableContent(tableElement: Element): string[][] {
  let actualTableContent: Element[][] = [];
  if (getHeaderRow(tableElement)) {
    actualTableContent.push(getHeaderCells(tableElement));
  }

  // Check data row cells
  const rows = getRows(tableElement).map(row => getCells(row));
  actualTableContent = actualTableContent.concat(rows);

  if (getFooterRow(tableElement)) {
    actualTableContent.push(getFooterCells(tableElement));
  }

  // Convert the nodes into their text content;
  return actualTableContent.map(row => row.map(cell => cell.textContent!.trim()));
}

function expectTableToMatchContent(tableElement: Element, expected: any[]) {
  const missedExpectations: string[] = [];
  function checkCellContent(actualCell: string, expectedCell: string) {
    if (actualCell !== expectedCell) {
      missedExpectations.push(`Expected cell contents to be ${actualCell} but was ${expectedCell}`);
    }
  }

  const actual = getActualTableContent(tableElement);

  if (actual.length !== expected.length) {
    missedExpectations.push(`Expected ${expected.length} total rows but got ${actual.length}`);
    fail(missedExpectations.join('\n'));
  }
  actual.forEach((row, rowIndex) => {
    row.forEach((actualCell, cellIndex) => {
      const expectedCell = expected[rowIndex] ? expected[rowIndex][cellIndex] : null;
      checkCellContent(actualCell, expectedCell);
    });
  });

  if (missedExpectations.length) {
    fail(missedExpectations.join('\n'));
  }
}
