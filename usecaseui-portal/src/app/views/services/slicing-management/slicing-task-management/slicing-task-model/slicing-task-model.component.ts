import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SlicingTaskServices } from '../../../../../core/services/slicingTaskServices';

@Component({
  selector: 'app-slicing-task-model',
  templateUrl: './slicing-task-model.component.html',
  styleUrls: ['./slicing-task-model.component.less']
})
export class SlicingTaskModelComponent implements OnInit {
  @Input() showDetail: boolean;
  @Input() moduleTitle: string;
  @Input() taskId: string;
  @Output() cancel = new EventEmitter<boolean>();

  constructor(private http: SlicingTaskServices) { }

  // 配置审核详情
  checkDetail: any[] = [{}];
  //业务需求信息
  businessRequirement: any[] = [];
  //匹配NST信息 
  NSTinfo: object[] = [{}];
  // 共享切片实例
  selectedServiceId: string;
  selectedServiceName: string;
  slicingInstances: any;
  loading: boolean = false;
  // 子网实例
  slicingSubnet: any[] =  [
    {
      title: '无线域',
      context: 'an',
      slicingId: '',
      slicingName: '',
      total: 0,
      currentPage: '1',
      pageSize: '10',
      isLoading: false,
      flag: false,
      instances: []
    },
    {
      title: '传输域',
      context: 'tn',
      slicingId: '',
      slicingName: '',
      total: 0,
      currentPage: '1',
      pageSize: '10',
      isLoading: false,
      flag: false,
      instances: []
    },
    {
      title: '核心域',
      context: 'cn',
      slicingId: '',
      slicingName: '',
      total: 0,
      currentPage: '1',
      pageSize: '10',
      isLoading: false,
      flag: false,
      instances: []
    }
  ]
  isDisabled: boolean = true;
  // 子网参数
  isShowParams: boolean;
  paramsTitle: string;
  params: any;
  
  

  ngOnInit() { }
  
  ngOnChanges() {
    if (this.showDetail) {
      this.getautidInfo();
    } else {
      this.isDisabled = true;
    }
  }

  getautidInfo(): void {
    this.http.getAuditInfo(this.taskId).subscribe( res => {
      const { result_header: { result_code } } = res;
      if (+result_code === 200) {
        const { 
          task_id, 
          task_name, 
          create_time, 
          processing_status, 
          business_demand_info, 
          nst_info, nsi_nssi_info, 
          business_demand_info: { service_snssai } 
        } = res.result_body;
        const { 
          suggest_nsi_id, 
          suggest_nsi_name, 
          an_suggest_nssi_id, 
          an_suggest_nssi_name, 
          tn_suggest_nssi_id, 
          tn_suggest_nssi_name, 
          cn_suggest_nssi_id, 
          cn_suggest_nssi_name,
          an_latency,
          an_5qi,
          an_coverage_area_ta_list, 
          tn_latency,
          tn_bandwidth,
          cn_service_snssai,
          cn_resource_sharing_level,
          cn_ue_mobility_level,
          cn_latency,
          cn_max_number_of_ues,
          cn_activity_factor,
          cn_exp_data_rate_dl,
          cn_exp_data_rate_ul,
          cn_area_traffic_cap_dl,
          cn_area_traffic_cap_ul
        } = nsi_nssi_info;
        // 处理配置审核详情数据
        this.checkDetail = [{ task_id, task_name, create_time, processing_status, service_snssai }];
        // 业务需求信息数据
        this.businessRequirement = [business_demand_info];
        // 匹配NST信息
        this.NSTinfo = [nst_info];
        // 共享切片实例
        this.selectedServiceId = suggest_nsi_id;
        this.selectedServiceName = suggest_nsi_name;
        this.slicingInstances = {
          currentPage: '1',
          pageSize: '10',
          isLoading: false,
          total: 0,
          flag: false,
          list: [{
            service_instance_id: this.selectedServiceId,
            service_instance_name: this.selectedServiceName
          }]
        }
        // 子网实例
        let subnetData = { an_suggest_nssi_id, an_suggest_nssi_name, tn_suggest_nssi_id, tn_suggest_nssi_name, cn_suggest_nssi_id, cn_suggest_nssi_name};
        this.subnetDataFormatting(subnetData, 0);
        this.slicingSubnet[0].params = { an_latency, an_5qi, an_coverage_area_ta_list } 
        this.slicingSubnet[1].params = { tn_latency, tn_bandwidth };
        this.slicingSubnet[2].params = { 
          cn_service_snssai,
          cn_resource_sharing_level,
          cn_ue_mobility_level,
          cn_latency,
          cn_max_number_of_ues,
          cn_activity_factor,
          cn_exp_data_rate_dl,
          cn_exp_data_rate_ul,
          cn_area_traffic_cap_dl,
          cn_area_traffic_cap_ul 
        };
      }
    })
  }

  openSlicingInstance ( bool: boolean): void {
    const { total, currentPage, pageSize} = this.slicingInstances;
    if (bool && !total) {
      this.slicingInstances.list = [];
      this.getSlicingInstances(currentPage, pageSize)
    }
  }

  getNextPageData ():void {
    const { total, currentPage, pageSize} = this.slicingInstances;
    if (total - (+currentPage * +pageSize) > 0 ) {
      if (this.slicingInstances.flag) return;
      this.slicingInstances.isLoading = true;
      this.slicingInstances.flag = true
      setTimeout( () => {
        this.getSlicingInstances(currentPage, pageSize)
      }, 2000)
      this.slicingInstances.currentPage ++ ;
    }
  }

  getSlicingInstances(pageNo: string, pageSize: string): void {
    this.http.getSlicingInstance(pageNo, pageSize).subscribe ( res => {
      const { result_header: { result_code }, result_body } = res;
      if (+result_code === 200) {
        const { nsi_service_instances, record_number } = result_body;
        this.slicingInstances.total = record_number;
        this.slicingInstances.list.push(...nsi_service_instances);
        this.slicingInstances.isLoading = false;
        this.slicingInstances.flag = false;
      }
    })
  }


  slicingInstanceChange ():void {
    this.isDisabled = true;
    // 获取切片子网实例数据
    this.http.getSlicingSubnetInstance(this.selectedServiceId).subscribe( res => {
      const { result_header: { result_code }, result_body, record_number} = res;
      if (+result_code === 200) {
        this.subnetDataFormatting(result_body, record_number)
      }
    }) 
    this.slicingInstances.list.forEach (item => {
      if (item.service_instance_id === this.selectedServiceId) {
        this.selectedServiceName = item.service_instance_name;
      }
    })
  }

  subnetDataFormatting ( subnetData: any, total: number): void{
    const { an_suggest_nssi_id, an_suggest_nssi_name, tn_suggest_nssi_id, tn_suggest_nssi_name, cn_suggest_nssi_id, cn_suggest_nssi_name } = subnetData;
    this.slicingSubnet[0].slicingId = an_suggest_nssi_id;
    this.slicingSubnet[0].slicingName = an_suggest_nssi_name;
    this.slicingSubnet[0].total = total;
    this.slicingSubnet[0].currentPage = '1'; 
    this.slicingSubnet[0].instances = [{
      service_instance_id: an_suggest_nssi_id,
      service_instance_name: an_suggest_nssi_name
    }];

    this.slicingSubnet[1].slicingId = tn_suggest_nssi_id;
    this.slicingSubnet[1].slicingName = tn_suggest_nssi_name;
    this.slicingSubnet[1].total = total;
    this.slicingSubnet[1].currentPage = '1'; 
    this.slicingSubnet[1].instances =  [{
      service_instance_id: tn_suggest_nssi_id,
      service_instance_name: tn_suggest_nssi_name
    }];

    this.slicingSubnet[2].slicingId = cn_suggest_nssi_id;
    this.slicingSubnet[2].slicingName = cn_suggest_nssi_name;
    this.slicingSubnet[2].total = total;
    this.slicingSubnet[2].currentPage = '1'; 
    this.slicingSubnet[2].instances = [{
      service_instance_id: cn_suggest_nssi_id,
      service_instance_name: cn_suggest_nssi_name
    }];
  }

  resetSlicingInstance (): void {
    this.selectedServiceId = '';
    this.selectedServiceName = '';
    this.slicingSubnet.map( item => {
      item.slicingId = '';
      item.slicingName = '';
    })
    this.isDisabled = false;
  }
  
  openSubnetInstances (bool: boolean, instance: any): void {
    if(bool && !instance.total) {
      instance.instances = []
      this.getSubnetInstances(instance)
    }
  }

  getNextPageSubnet (instance: any): void{
    const { total, currentPage, pageSize} = instance;
    if(total - (+currentPage * +pageSize) > 0 ){
      if (instance.flag) return;
      instance.isLoading = true;
      instance.flag = true;
      setTimeout( () => {
        this.getSubnetInstances(instance);
      }, 2000)
      instance.currentPage ++;
    }
  }

  getSubnetInstances (instance: any): void {
    const { context, currentPage, pageSize } = instance;
    this.http.getSubnetInContext(context, currentPage, pageSize).subscribe( res => {
      const { result_header: { result_code }, result_body } = res;
      if (+result_code === 200) {
        const { nssi_service_instances, record_number } = result_body;
        this.slicingSubnet.map (item => {
          if (item.context === context) {
            item.total = record_number;
            item.instances.push(...nssi_service_instances);
            item.isLoading = false;
            item.flag = false;
          }
        })
      }
    })
  }

  slicingSubnetChange (instance: any): void {
    instance.instances.forEach( item => {
      if (instance.slicingId === item.service_instance_id) {
        instance.slicingName = item.service_instance_name; 
      }
    })
  }

  restSubnetInstance (instance: any): void {
    instance.slicingId = '';
    instance.slicingName = '';
  }

  showParamsModel (item: any): void {
    this.isShowParams = true;
    this.paramsTitle = item.title;
    this.params = item.params
  }

  changeParams (params: any): void {
    const index = this.paramsTitle === '无线域' ? 0 : (this.paramsTitle === '传输域' ? 1 : 2);
    this.slicingSubnet[index].params = params
  }

  handleCancel() {
    this.showDetail = false;
    this.cancel.emit(this.showDetail);
  }
  handleOk() {
    const { selectedServiceId, selectedServiceName, slicingSubnet, checkDetail, businessRequirement, NSTinfo } = this;
    const nsi_nssi_info: object = {
      suggest_nsi_id:  selectedServiceId,
      suggest_nsi_name: selectedServiceName,
      an_suggest_nssi_id: slicingSubnet[0].slicingId,
      an_suggest_nssi_name: slicingSubnet[0].slicingName,
      ...slicingSubnet[0].params,
      tn_suggest_nssi_id: slicingSubnet[1].slicingId,
      tn_suggest_nssi_name: slicingSubnet[1].slicingName,
      ...slicingSubnet[1].params,
      cn_suggest_nssi_id: slicingSubnet[2].slicingId,
      cn_suggest_nssi_name: slicingSubnet[2].slicingName,
      ...slicingSubnet[2].params,
    }
    let reqBody = {...checkDetail[0], business_demand_info: businessRequirement[0], nst_info: NSTinfo[0], nsi_nssi_info};
    delete reqBody.service_snssai;
    this.http.submitSlicing(reqBody).subscribe (res => {
      const { result_header: { result_code } } = res;
      if (+result_code === 200) {
        console.log('成功提交')
        this.handleCancel();
      }
    })
  }
}
