/*
    Copyright (C) 2018 CMCC, Inc. and others. All rights reserved.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

            http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
import { Component, OnInit, HostBinding } from '@angular/core';
import { MyhttpService } from '../../myhttp.service';
import { slideToRight } from '../../animates';
import { NzModalService } from 'ng-zorro-antd';

@Component({
  selector: 'app-services-list',
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.less'],
  animations: [ slideToRight ]
})
export class ServicesListComponent implements OnInit {
  @HostBinding('@routerAnimate') routerAnimateState;
  constructor(private myhttp: MyhttpService, private modalService: NzModalService) { }

 
  ngOnInit() {
    this.getallCustomers();
    this.inputNamests();
  }
  // customer servicetype
  customerList = [];
  customerSelected = {name:null,id:null};
  serviceTypeList = [];
  serviceTypeSelected = {name:null};

  // 
  getallCustomers(){
    this.myhttp.getAllCustomers()
      .subscribe((data)=>{
        this.customerList = data.map((item)=>{return {name:item["subscriber-name"],id:item["global-customer-id"]}});
        if(this.customerList.length==0){
          console.log("customerList.length == 0",this.customerList);
          return false;
        }
        this.customerSelected = this.customerList[0];
        this.choseCustomer(this.customerSelected);
        // console.log(this.customers)
      })
  }

  choseCustomer(item){
    this.customerSelected = item;
    this.myhttp.getServiceTypes(this.customerSelected)
      .subscribe((data)=>{
        this.serviceTypeList = data.map((item)=>{return {name:item["service-type"]}});
        if(this.serviceTypeList.length==0){
          console.log("serviceTypeList.length == 0",this.serviceTypeList);
          return false;
        }
        this.serviceTypeSelected = this.serviceTypeList[0];
        this.choseServiceType(this.serviceTypeSelected);
        // console.log(this.listServiceTypes);
      })
  }
  choseServiceType(item){
    this.serviceTypeSelected = item;
    this.getTableData();
  }


  // Create modal box 2 (dialog box) create -------------------------------
  isVisible = false;
  createModal(): void {
    this.isVisible = true;
    this.getAlltemplates();
  }
  // 
  templateTypeSelected = "SOTN";
  choseTemplateType(){
    this.getAlltemplates();
  }
  // 
  templates = [];
    template1={name:null};
    template2={name:null};
    template3={name:null};
    template4={name:null};

  getAlltemplates(){  //
    this.myhttp.getAllServiceTemplates(this.templateTypeSelected)
      .subscribe((data)=>{
        // console.log(data)
        this.templates = data;
        if(this.templateTypeSelected=="Network Service"){
          this.templates = data.filter((d)=>{
            return typeof d.packageInfo.csarName== "string";
          }).map((item)=>{
              let cName = item.packageInfo.csarName.split("/").reverse()[0];
              return {name:cName,id:item.csarId,packageInfo:item.packageInfo}
          });
        }
        console.log(this.templates);
        this.template1 = this.templates[0];
        this.template2 = this.templates[1];
        this.template3 = this.templates[2];
        this.template4 = this.templates[0];
        
      },(err)=>{

      })
  }


  // 
  createshow = false;
  createshow2 = false;
  createData:Object={};
  handleOk(): void {
    // console.log('Button ok clicked!');
    this.isVisible = false;

    if(this.templateTypeSelected=="SOTN"||this.templateTypeSelected=="CCVPN"){
      let data1 = {commonParams:{customer:this.customerSelected, serviceType:this.serviceTypeSelected, templateType:"SOTN"},templates:{template1:this.template1,template2:this.template2}};
      let data2 = {commonParams:{customer:this.customerSelected, serviceType:this.serviceTypeSelected, templateType:"CCVPN"},templates:{template1:this.template1,template2:this.template2,template3:this.template3}};
      this.createData = this.templateTypeSelected == "SOTN" ? data1 : data2;
      this.createshow = true;
    }else if(this.templateTypeSelected=="E2E Service"||this.templateTypeSelected=="Network Service"){
      this.createData = {commonParams:{customer:this.customerSelected, serviceType:this.serviceTypeSelected, templateType:this.templateTypeSelected},template:this.template4};
      this.createshow2 = true;
    }
    
  }
  handleCancel(): void {
    // console.log('Button cancel clicked!');
    this.isVisible = false;
  }


  //tableData
  tableData = [];
  pageIndex = 1;
  pageSize = 10;
  total = 100;
  loading = false;

  getTableData(){
    // params: customer serviceType pageIndex，pageSize，sortName
    let paramsObj = {
      customerId:this.customerSelected.id,
      serviceType:this.serviceTypeSelected.name,
      currentPage:this.pageIndex,
      pageSize:this.pageSize
    }
    this.myhttp.getServicesTableData(paramsObj)
      .subscribe((data)=>{
        console.log(data);
        this.total = data.body.total;
        this.tableData = data.body.tableList.map((item)=>{
          if(typeof item == "string"){
            item = JSON.parse(item);
          }
          if(typeof item["childServiceInstances"] == "string"){
            item["childServiceInstances"] = JSON.parse(item["childServiceInstances"]);
          }
          item["childServiceInstances"] = item["childServiceInstances"].map((child)=>{
            if(typeof child == "string"){
              return JSON.parse(child);
            }else{
              return child;
            }
          })
          if(item["serviceDomain"]=="Network Service" && item["vnfInfo"]){
            item["childServiceInstances"] = item["vnfInfo"].map((vnf)=>{
              vnf["serviceDomain"] = "vnf";
              return vnf;
            });
          }
          //when processing，continue
          if(item["serviceStatus"]=="finished"){
            item["status"] = "Active";
          }else if(item["serviceStatus"]=="processing"){
            item["status"] = "processing";
            if(item["serviceDomain"]=="Network Service"){
              let updata = (prodata)=>{
                item["rate"] = prodata.progress;
                // >100 err
                if(item["rate"] > 100){
                  item["status"]=prodata.status;
                }
              }
              let id = item["nsInstanceId"] || item["service-instance-id"];
              this.queryNsProgress(item["jobId"],id,updata).then(()=>{
                item["rate"] = 100;
                item["status"] = "completed";
              })
            }else{
              let updata = (prodata)=>{
                item["rate"] = prodata.progress;
                if(item["rate"] > 100){
                  item["status"]=prodata.status;
                }
              }
              let obj = {
                serviceId:item["service-instance-id"],
                operationId:item["operationId"]
              }
              this.queryProgress(obj,updata).then(()=>{
                item["rate"] = 100;
                item["status"] = "completed";
              })
            }
          }
          return item;
        })  
      },(err)=>{
        console.log(err);
      })
  }

  searchData(reset:boolean = false){
    // console.log(reset)
    this.getTableData();
  }

  thisService = {};  //The current service of the operation
  e2e_nsData:Object[];
  scaleModelVisible = false;
  scaleService(service){
    this.thisService = service;
    this.scaleModelVisible = true;
    let paramsObj = {
      customerId:this.customerSelected.id,
      serviceType:this.serviceTypeSelected.name,
      serviceId:service["service-instance-id"]
    }
    this.myhttp.getE2e_nsData(paramsObj)
      .subscribe((data)=>{
        this.e2e_nsData = data;
      })
  }
  scaleOk(){
    this.scaleModelVisible = false;
    let requestBody = {
      "service": {
        "serviceInstanceName": this.thisService["service-instance-name"],
        "serviceType": this.serviceTypeSelected.name,
        "globalSubscriberId": this.customerSelected.id,
        "resources": this.e2e_nsData.map((item)=>{
          return {
            "resourceInstanceId": item["netWorkServiceId"],
            "scaleType": item["scaleType"],
            "scaleNsData": {
              "scaleNsByStepsData": {
                "aspectId": item["aspectId"],
                "numberOfSteps": item["numberOfSteps"],
                "scalingDirection": item["scalingDirection"]
              }
            }
          }
        })
      }
    }
    this.scaleE2eService(this.thisService,requestBody);
  }
  scaleCancel(){
    this.scaleModelVisible = false;
  }
  
  updataService(){
    console.log("updataService!");
  }

  //heal
  healModelVisible = false;
  healActions = [];
  nsAdditional = [];
  nsParams = {
    degreeHealing:"HEAL_RESTORE",
    actionsHealing: [

    ],
    healScript: "",
    additionalParamsforNs: ""
  }
  vnfVms = [];
  vmSelected = {};
  vnfParams = {
    vnfInstanceId: "",
    cause: "",
    additionalParams: {
      action: "",
      actionvminfo: {
        vmid: "",
        vduid: "",
        vmname: ""
      }
    }
  }
  addActionsHealing(){
    this.healActions.push({value:""})
  }
  minusActionsHealing(index){
    this.healActions.splice(index,1);
  }
  addNsAdditional(){
    this.nsAdditional.push({key:"",value:""})
  }
  minusNsAdditional(index){
    this.nsAdditional.splice(index,1);
  }
  healService(service){
    // console.log(service);
    this.thisService = service;
    this.healModelVisible = true;
    if(service.serviceDomain == "vnf"){
      this.vnfParams.vnfInstanceId = service.vnfInstanceId;
      this.myhttp.getVnfInfo(service.vnfInstanceId)
        .subscribe((data)=>{
          // console.log(data);
          this.vnfVms = data.vnfVms;
          this.vmSelected = this.vnfVms[0];
        })
    }
  }
  healOk(){
    this.healModelVisible = false;
    // nsParams
    this.nsParams.actionsHealing = this.healActions.map((item)=>{return item.value});
    let additional = {};
    this.nsAdditional.forEach((item)=>{
      additional[item.key] = item.value;
    });
    this.nsParams.additionalParamsforNs = JSON.stringify(additional); 
    // vnfParams
    this.vnfParams.additionalParams.actionvminfo.vmid = this.vmSelected["vmId"];
    this.vnfParams.additionalParams.actionvminfo.vmname = this.vmSelected["vmName"];

    let requestBody = this.thisService["serviceDomain"] == "Network Service" ? {healNsData:this.nsParams} : {healVnfData:this.vnfParams};
    console.log(requestBody);
    this.healNsVnfService(this.thisService,requestBody);
  }
  healCancel(){
    this.healModelVisible = false;
  }

  // show detail
  detailshow = false;
  detailData:Object;
  serviceDetail(service){
    service["siteSer"]=[];
    service["sdwanSer"]=[];
    service["customer"]=this.customerSelected;
    service["serviceType"] = this.serviceTypeSelected;

    service.childServiceInstances.forEach((item)=>{
      if(item.serviceDomain=="SITE"){
        service.siteSer.push(item);
      }else if(item.serviceDomain=="SDWAN"){
        service.sdwanSer.push(item);
      }
    })
    this.detailshow = true;
    this.detailData = service;
    console.log(service);
  }

  deleteModelVisible = false;
  terminationType = "graceful";
  gracefulTerminationTimeout = 120;
  // delete Model show
  deleteModel(service){
    this.thisService = service;
    this.deleteModelVisible = true;
  }
  deleteOk(){
    this.deleteModelVisible = false;
    if(this.thisService["serviceDomain"] == "Network Service"){
      this.deleteNsService(this.thisService);
    }else{
      this.deleteService(this.thisService);
    }
  }

  deleteCancel(){
    this.deleteModelVisible = false;
  }

  //ccvpn sotn createservice
  parentServiceInstanceId="";
  closeCreate(obj){
    if(!obj){
      this.createshow = false; //close
      return false;
    }
    this.createshow = false; 
    console.log(obj);
    let newData; //Newly created service data for the main table
    let stageNum = 0; //Different stages of progress, used to add up subsequent service progress;

    let   createParams = "?customerId="+this.customerSelected.id + 
                        "&serviceType="+this.serviceTypeSelected.name + 
                        "&serviceDomain="+this.templateTypeSelected +
                        "&parentServiceInstanceId=";
    this.createService(obj.vpnbody,createParams).then((data)=>{
      console.log(data)
      this.parentServiceInstanceId = data["serviceId"]; //------------updata parentServiceInstanceId
      newData = {  //
        'service-instance-id':data["serviceId"],
        'service-instance-name':obj.vpnbody.service.name,
        serviceDomain:this.templateTypeSelected,
        childServiceInstances:[],
        status:"Creating",
        rate:0,
      }
      this.tableData = [newData,...this.tableData];
      let updata = (prodata)=>{
        newData.rate = Math.floor(prodata.progress/3);
        if(newData["rate"] > 100){
          newData["status"]=prodata.status;
        }   
      }
      let queryParams = {serviceId:data["serviceId"],operationId:data["operationId"]};
      return this.queryProgress(queryParams,updata);
    }).then((data)=>{
      console.log(data);
      stageNum = newData.rate; //Phase progress value update;
      let allprogress = {};  //
      let querypros = [];  //All the query
      // Additional parameters
      let   createParams = "?customerId="+this.customerSelected.id + 
                          "&serviceType="+this.serviceTypeSelected.name + 
                          "&serviceDomain="+"SDWAN" +
                          "&parentServiceInstanceId="+this.parentServiceInstanceId;

      let createPros = obj.groupbody.map((group)=>{  //
        return this.createService(group,createParams).then((data)=>{
          console.log(data);
          let updata = (prodata)=>{
            allprogress[prodata.operationId] = prodata.progress;
            let average = ((arr)=>{return eval(arr.join("+"))/arr.length})(Object.values(allprogress)) 
            newData.rate = Math.floor(average/3) + stageNum;
            if(newData["rate"] > 100){
              newData["status"]=prodata.status;
            }  
          }
          let queryParams = {serviceId:data["serviceId"],operationId:data["operationId"]};
          querypros.push(this.queryProgress(queryParams,updata))
        })
      })

      return new Promise((res)=>{
        Promise.all(createPros).then(()=>{  //All queries in querypros are added only once created
          Promise.all(querypros).then((data)=>{
            console.log(data);
            res("site--begin");
          })
        }) 
      })
    }).then((data)=>{
      console.log(data);
      stageNum = newData.rate; //Phase progress value update;
      let allprogress = {};
      let querypros = [];  //All the query
      // Additional parameters
      let createParams = "?customerId="+this.customerSelected.id + 
                        "&serviceType="+this.serviceTypeSelected.name + 
                        "&serviceDomain="+"SITE" +
                        "&parentServiceInstanceId="+this.parentServiceInstanceId;
      let createPros = obj.sitebody.map((group)=>{  
        return this.createService(group,createParams).then((data)=>{
          console.log(data);
          let updata = (prodata)=>{
            allprogress[prodata.operationId] = prodata.progress;
            let average =((arr)=>{return eval(arr.join("+"))/arr.length})(Object.values(allprogress)) 
            newData.rate = Math.floor(average/3) + stageNum;
            if(newData["rate"] > 100){
              newData["status"]=prodata.status;
            }  
          }
          let queryParams = {serviceId:data["serviceId"],operationId:data["operationId"]};
          querypros.push(this.queryProgress(queryParams,updata))
        })
      })
      console.log(createPros);
      Promise.all(createPros).then(()=>{  //
        Promise.all(querypros).then((data)=>{
          console.log(data);
          newData.rate = 100;
          newData.status = "completed";
          // let hasUndone = this.tableData.some((item)=>{
          //   return item.rate < 100;
          // })
          // if(!hasUndone){
          //   setTimeout(()=>{
          //     this.getTableData();
          //   },1000)
          // }
        })
      }) 
    })

  }

  e2eCloseCreate(obj){
    if(!obj){
      this.createshow2 = false; //
      return false;
    }
    this.createshow2 = false; //
    console.log(obj);
    let newData; //
    let   createParams = "?customerId="+this.customerSelected.id + 
                        "&serviceType="+this.serviceTypeSelected.name + 
                        "&serviceDomain="+this.templateTypeSelected +
                        "&parentServiceInstanceId=";
    this.createService(obj,createParams).then((data)=>{
      console.log(data);
      newData = {  //
        'service-instance-id':data["serviceId"],
        'service-instance-name':obj.name,
        serviceDomain:this.templateTypeSelected,
        childServiceInstances:[],
        status:"Creating",
        rate:0,
      }

      this.tableData = [newData,...this.tableData];
      let updata = (prodata)=>{
        newData.rate = prodata.progress;
        if(newData["rate"] > 100){
          newData["status"]=prodata.status;
        }  
      }
      let queryParams = {serviceId:data["serviceId"],operationId:data["operationId"]};
      return this.queryProgress(queryParams,updata);
    }).then((data)=>{
      console.log(data);
      newData.rate = 100;
      newData.status = "completed";
      // let hasUndone = this.tableData.some((item)=>{
      //   return item.rate < 100;
      // })
      // if(!hasUndone){
      //   setTimeout(()=>{
      //     this.getTableData();
      //   },1000)
      // }
    })

  }

  nsCloseCreate(obj){
    if(!obj){
      this.createshow2 = false; //
      return false;
    }
    this.createshow2 = false; //
    console.log(obj);
    let newData; //
    // step1
    this.myhttp.nsCreateInstance(obj.step1)
    .subscribe((data)=>{
      // console.log(data);
      if(data.status == "FAILED"){
        console.log("create ns service failed :" + JSON.stringify(data));
        return false;
      }
      newData = {  //
        'service-instance-id':data.nsInstanceId,
        'service-instance-name':obj.step1.nsName,
        serviceDomain:this.templateTypeSelected,
        childServiceInstances:[],
        status:"Creating",
        rate:0,
      }
      this.tableData = [newData,...this.tableData];
      let createParams = "?ns_instance_id=" + data.nsInstanceId + 
                        "&customerId="+this.customerSelected.id + 
                        "&serviceType="+this.serviceTypeSelected.name + 
                        "&serviceDomain="+ this.templateTypeSelected +
                        "&parentServiceInstanceId=";
      // step2
      this.createNsService(createParams,obj.step2).then((jobid)=>{

        let updata = (prodata)=>{
          newData.rate = prodata.progress;
          if(newData["rate"] > 100){
            newData["status"]=prodata.status;
          }  
        }

        return this.queryNsProgress(jobid,newData["service-instance-id"],updata);
      }).then((data)=>{
        console.log(data);
        newData.rate = 100;
        newData.status = "completed";
        // let hasUndone = this.tableData.some((item)=>{
        //   return item.rate < 100;
        // })
        // if(!hasUndone){
        //   setTimeout(()=>{
        //     this.getTableData();
        //   },1000)
        // }
      })
    })
  }

  createService(requestBody,createParams){
    let mypromise = new Promise((res,rej)=>{
      this.myhttp.createInstance(requestBody,createParams)
        .subscribe((data)=>{
          if(data.status == "FAILED"){
            console.log("create e2e service failed :" + JSON.stringify(data));
            return false;
          }
          res(data.service);
        })
    })
    return mypromise;
  }
  createNsService(id,obj){
    let mypromise = new Promise((res,rej)=>{
      this.myhttp.nsCreateInstance2(id,obj)
        .subscribe((data)=>{
          if(data.status == "FAILED"){
            console.log("instantiate ns service failed :" + JSON.stringify(data));
            return false;
          }
          res(data.jobId);
        })
    })
    return mypromise;
  }

  scaleE2eService(service,requestBody){
    let id = service["service-instance-id"];
    service.rate = 0;
    service.status = "Scaling";
    this.myhttp.scaleE2eService(id,requestBody)
      .subscribe((data)=>{
        if(data.status == "FAILED"){
          console.log("scale E2e service failed :" + JSON.stringify(data));
          return false;
        }
        let obj = {
          serviceId:id,
          operationId:data.operationId
        }
        let updata = (prodata)=>{
          service.rate = prodata.progress;
          if(service["rate"] > 100){
            service["status"]=prodata.status;
          }  
        }
        this.queryProgress(obj,updata).then(()=>{
          service.rate = 100;
          service.status = "completed";
        })
      })
  }

  healNsVnfService(service,requestBody){
    console.log(service);
    service.rate = 0;
    service.status = "Healing";
    let id = service.nsInstanceId || service["service-instance-id"];
    this.myhttp.healNsService(id,requestBody)
      .subscribe((data)=>{
        if(data.status == "FAILED"){
          console.log("heal nsvnf service failed :" + JSON.stringify(data));
          return false;
        }
        let jobid = data.jobId;
        let updata = (prodata)=>{
          service.rate = prodata.progress;
          if(service["rate"] > 100){
            service["status"]=prodata.status;
          }  
        }
        this.queryNsProgress(jobid,id,updata).then((data1)=>{
          console.log(data1);
          service.rate = 100;
          service.status = "completed";
        });
      })
  }

  deleteService(service){
    let allprogress = {};  //
    let querypros = [];  //
    service.rate = 0;
    service.status = "Deleting";

    service["childServiceInstances"].push({"service-instance-id":service["service-instance-id"]});
    let deletePros = service["childServiceInstances"].map((item)=>{
      let params = {
        globalSubscriberId:this.customerSelected.id,
        serviceType:this.serviceTypeSelected,
        serviceInstanceId:item["service-instance-id"]
      }
      return new Promise((res,rej)=>{
        this.myhttp.deleteInstance(params)
        .subscribe((data)=>{
          if(data.status == "FAILED"){
            console.log("delete service failed :" + JSON.stringify(data));
            return false;
          }
          let obj = {serviceId:params.serviceInstanceId,operationId:data.operationId}
          let updata = (prodata)=>{
            allprogress[prodata.operationId] = prodata.progress;
            let average = ((arr)=>{return eval(arr.join("+"))/arr.length})(Object.values(allprogress));
            service["rate"]=average;
            if(service["rate"] > 100){
              service["status"]=prodata.status;
            }  
          }
          querypros.push(this.queryProgress(obj,updata));
          res();
        })
      })  
    })
    // console.log(deletePros)
    Promise.all(deletePros).then(()=>{
      Promise.all(querypros).then((data)=>{
        console.log(data);
        service.rate = 100;
        service.status = "completed";
        // let hasUndone = this.tableData.some((item)=>{
        //   return item.rate < 100;
        // })
        // if(!hasUndone){
        //   setTimeout(()=>{
        //     this.getTableData();
        //   },1000)
        // }
      })
    })
  }
  deleteNsService(service){
    service.rate = 0;
    service.status = "Deleting";
    let id = service.nsInstanceId || service["service-instance-id"];
    let requestBody = {
      terminationType : this.terminationType,
      gracefulTerminationTimeout : this.gracefulTerminationTimeout
    }
    this.stopNsService(id,requestBody).then((jobid)=>{
      let updata = (prodata)=>{
        service.rate = prodata.progress;
        if(service["rate"] > 100){
          service["status"]=prodata.status;
        }  
      }
      return this.queryNsProgress(jobid,id,updata);
    }).then(()=>{
      this.myhttp.nsDeleteInstance(id)
        .subscribe((data)=>{
          // console.log(data);
          service.rate = 100;
          service.status = "completed";
          if(data.status == "FAILED"){
            console.log("delete ns service failed :" + JSON.stringify(data));
            service.status = "failed";
            return false;
          }
          // let hasUndone = this.tableData.some((item)=>{
          //   return item.rate < 100;
          // })
          // if(!hasUndone){
          //   setTimeout(()=>{
          //     this.getTableData();
          //   },1000)
          // }
        })
    })
  }

  stopNsService(id,obj){
    let mypromise = new Promise((res,rej)=>{
      this.myhttp.stopNsService(id,obj)
        .subscribe((data)=>{
          if(data.status == "FAILED"){
            console.log("stop ns service failed :" + JSON.stringify(data));
            return false;
          }
          res(data.jobId);
        })
    })
    return mypromise;
  }
  queryProgress(obj,callback){
    let mypromise = new Promise((res,rej)=>{
      // let data = {
      //   operationStatus:{
      //     "operationId": "XXXXXX",
      //     "operation": "create|delete|update|scale",
      //     "result": "finished|error|processing",
      //     "reason": "",
      //     "userId": "",
      //     "operationContent": "Be creating pop.",
      //     "progress": 0,
      //     "operateAt": "",
      //     "finishedAt": "" 
      //   }
      // }
      let errorNums = 180;
      let requery = ()=>{
        this.myhttp.getProgress(obj)
          .subscribe((data)=>{
            if(data.status == "FAILED"){
              callback({progress:255,status:"failed"});
              return false;
            }
            if(data.operationStatus == null || data.operationStatus.progress==undefined){
              // console.log(data);
              errorNums--;
              if(errorNums==0){
                 callback({progress:255,status:"time over"});
                 return false;
              }
              setTimeout(()=>{
                requery();
              },10000)
              return false;
            }
            if(data.operationStatus.progress > 100){
              callback({progress:255,status:"time over"});
              return false;
            }
            if(data.operationStatus.progress < 100){
              callback(data.operationStatus);
              setTimeout(()=>{
                requery();
              },5000)
            }else {
              res(data.operationStatus);
            }     
          })
        // setTimeout(()=>{
        //   console.log(data.operationStatus.progress)
        //   data.operationStatus.progress++;        
        //   if(data.operationStatus.progress<100){
        //     callback(data.operationStatus);
        //     requery()
        //   }else{
        //     callback(data.operationStatus);
        //     res(data.operationStatus)
        //   }
        // },100)
      }
      requery();
    })
    return mypromise;
  }
  queryNsProgress(jobid,id,callback){
    let mypromise = new Promise((res,rej)=>{
      // let data = {
      //   "jobId": "string",
      //   "responseDescriptor": {
      //     "status": "string",
      //     "progress": 0,
      //     "statusDescription": "string",
      //     "errorCode": "string",
      //     "responseId": "string",
      //     "responseHistoryList": [
      //       {
      //         "status": "string",
      //         "progress": "string",
      //         "statusDescription": "string",
      //         "errorCode": "string",
      //         "responseId": "string"
      //       }
      //     ]
      //   }
      // }
      let errorNums = 180;
      let requery = ()=>{
        this.myhttp.getNsProgress(jobid,id)
          .subscribe((data)=>{
            if(data.status == "FAILED"){
              callback({progress:255,status:"failed"});
              return false;
            }
            if(data.responseDescriptor == null || data.responseDescriptor.progress==undefined){
              // console.log(data);
              errorNums--;
              if(errorNums==0){
                callback({progress:255,status:"time over"});
                return false;
              }
              setTimeout(()=>{
                requery();
              },10000)
              return false;
            }
            if(data.responseDescriptor.progress > 100){
              callback({progress:255,status:"time over"});
              return false;
            }
            if(data.responseDescriptor.progress < 100){
              callback(data.responseDescriptor);
              setTimeout(()=>{
                requery();
              },5000)
            }else {
              res(data);
            }     
          })
        // setTimeout(()=>{
        //   console.log(data.responseDescriptor.progress)
        //   data.responseDescriptor.progress++;        
        //   if(data.responseDescriptor.progress<100){
        //     callback(data.responseDescriptor);
        //     requery()
        //   }else{
        //     callback(data);
        //     res(data)
        //   }
        // },100)
      }
      requery();
    })
    return mypromise;
  }


  //  --> 
  namesTranslate:Object;
  inputNamests(){
    this.myhttp.inputNamesTransform()
      .subscribe((data)=>{
        this.namesTranslate = data;
      })
  }

}
