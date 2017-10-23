import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Util } from '../../util/util';
import { Injector } from '@angular/core';
import { OntimizeService } from '../../services';


export class OTableDao {

  public isLoadingResults:boolean = false;

  /** Stream that emits whenever the data has been modified. */
  dataChange = new BehaviorSubject<any[]>([]);
  get data(): any[] { return this.dataChange.value; }
  dataService:any;

  constructor(private injector: Injector,private service:string,private entity:string, private method: any, private queryArgs: Array<any>) {
    this.configureService();
   }

   /**
  * Method what its configure  call service
  */
  configureService() {
    
    this.dataService = this.injector.get(OntimizeService);

    if (Util.isDataService(this.service)) {
      let serviceCfg = this.dataService.getDefaultServiceConfiguration(this.service);
      if (this.entity) {
        serviceCfg['entity'] = this.entity;
      }
      this.dataService.configureService(serviceCfg);
    }
  }

  /**
   * Call the service query and emit data has ben modified
   */
  getQuery() {

    this.isLoadingResults = false;
    let dataArray: any[];
    this.dataService[this.method].apply(this.dataService, this.queryArgs)
      .subscribe(
      res => {
        let data = undefined;
        if (Util.isArray(res)) {
          data = res;
        } else if ((res.code === 0) && Util.isArray(res.data)) {
          data = (res.data !== undefined) ? res.data : [];

        }

        this.dataChange.next(data);
        this.isLoadingResults = true;
        return Observable.of(dataArray);
      },
      err => {
        dataArray = [];
        this.dataChange.next(dataArray);
        this.isLoadingResults = true;
      }
      );

  }
  /**
   * set data array and emit data has ben modified
   * @param data 
   */
  setDataArray(data:Array<any>){
    this.dataChange.next(data);
    this.isLoadingResults = true;
    return Observable.of(data);

  }
}
