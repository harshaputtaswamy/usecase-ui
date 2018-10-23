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
import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { MyhttpService } from '../myhttp.service';
import * as addDays from 'date-fns/add_days';
import { showHideAnimate, slideToRight } from '../animates';

@Component({
  selector: 'app-alarm',
  templateUrl: './alarm.component.html',
  styleUrls: ['./alarm.component.less'],
  animations: [
    showHideAnimate, slideToRight
  ]
})
export class AlarmComponent implements OnInit {
  @HostBinding('@routerAnimate') routerAnimateState; //路由动画
  public pageNumber:number=1;
  public pageSize:number=5;
  public name:string='';
  public Priority:string ='';
  public Status:string ='';
  public Report:string ='';
  list: any;


  constructor(
    private myhttp:MyhttpService) { }
  isVisibleMiddle = false;

  showModalMiddle(): void {
    this.isVisibleMiddle = true;
  }
  handleOkMiddle(): void {
    console.log('click ok');
    this.isVisibleMiddle = false;
  }
  handleCancelMiddle(): void {
    this.isVisibleMiddle = false;
  }
  ngOnInit() {
    this.getAlarmFormData();
  }

  // 筛选框（下拉框）
  sourceNameList = ['---auto---','shentao-test-1001','vnf_a_1','cccc','dddddDDDDDDD'];
  sourceNameSelected = this.sourceNameList[0];
  priorityList = ['---auto---','Critical','Major','Minor','Warning'];
  prioritySelected = this.priorityList[0];
  statusList = ['---auto---','active','Close'];
  statusSelected = this.statusList[0];
  choseSourceName(item){
    console.log(item,'item1');
    this.sourceNameSelected = item;
  }
  chosePriority(item){
    console.log(item);
    this.prioritySelected = item;
  }
  choseStatus(item){
    console.log(item);
    this.statusSelected = item;
  }

  // 日期筛选
  dateRange =  [ addDays(new Date(), -30), new Date() ];

  onChange(result: Date): void {
    console.log('onChange: ', result);
  }
  sort(e){

  }
  // 数量统计
  alarmList = {
    closed:37923,
    Action: 12342
  }

  //折线图縮略圖
  alarmChartData:Object;
  alarmChartInit:Object = {
    height:100,
    width:290,
    option:{
      tooltip : {
        show : false,
        trigger: 'axis',
      },
      legend: {
        show :false,
        bottom: '0px',
        data: ['All', 'Active', 'Closed']
      },
      series: [
        {
            name: 'All',
            type: 'line',
            smooth: true,//将图变得平缓
            showSymbol: false,
            areaStyle: {
              opacity: 0.8
            },
            //timeframe_one
            data: [40, 45, 38, 52, 64, 58, 69, 87, 76, 33, 64, 87, 45, 76, 88, 56, 33, 76, 45, 65],
            itemStyle: {
              color: "#526b75"
            },
            lineStyle: {
              width: 1,
              opacity: 0.5
            }
        },
        {
            name: 'Active',
            type: 'line',
            smooth: true,//将图变得平缓
            showSymbol: false,
            areaStyle: {
              opacity: 0.8
            },
            //timeframe_two
            data: [32, 43, 23, 45, 63, 24, 54, 22, 32, 42, 42, 22, 23, 43, 32, 34, 42, 33, 42, 12],
            itemStyle: {
              color: "#fb6e6e"
            },
            lineStyle: {
              width: 1,
              opacity: 0.5
            }
        },
        {
            name: 'Closed',
            type: 'line',
            smooth: true,//将图变得平缓
            showSymbol: false,
            areaStyle: {
              opacity: 0.8
            },
            //timeframe_two
            data: [12, 23, 13, 25, 33, 14, 34, 12, 12, 22, 12, 12, 13, 23, 12, 24, 22, 13, 22, 5],
            itemStyle: {
              color: "#3fa8eb"
            },
            lineStyle: {
              width: 1,
              opacity: 0.5
            }
        }
      ]
    }
  };
  getAlarmChartData(){
    let paramsObj = {
      alarmSourceName:this.sourceNameSelected
    }
    this.myhttp.getHomePerformanceChartData(paramsObj)
      .subscribe((data)=>{
        this.alarmChartData = {
          series:[
            {data:data.CPU},
            {data:data.CPU},
            {data:data.Memory}
          ]
        }
      },(err)=>{
        console.log(err);
      })
  }
  //折线图放大圖 
  alarmChartDataBig:Object;
  alarmChartInitBig:Object = {
    height:240,
    width:500,
    option:{
      tooltip : {
        show : true,
        trigger: 'axis',
      },
      legend: {
        show :true,
        bottom: '0px',
        data: ['All', 'Active', 'Closed']
      },
      series: [
        {
            name: 'All',
            type: 'line',
            smooth: true,//将图变得平缓
            showSymbol: false,
            areaStyle: {
              opacity: 0.8
            },
            //timeframe_one
            data: [40, 45, 38, 52, 64, 58, 69, 87, 76, 33, 64, 87, 45, 76, 88, 56, 33, 76, 45, 65],
            itemStyle: {
              color: "#526b75"
            },
            lineStyle: {
              width: 1,
              opacity: 0.5
            }
        },
        {
            name: 'Active',
            type: 'line',
            smooth: true,//将图变得平缓
            showSymbol: false,
            areaStyle: {
              opacity: 0.8
            },
            //timeframe_two
            data: [32, 43, 23, 45, 63, 24, 54, 22, 32, 42, 42, 22, 23, 43, 32, 34, 42, 33, 42, 12],
            itemStyle: {
              color: "#fb6e6e"
            },
            lineStyle: {
              width: 1,
              opacity: 0.5
            }
        },
        {
            name: 'Closed',
            type: 'line',
            smooth: true,//将图变得平缓
            showSymbol: false,
            areaStyle: {
              opacity: 0.8
            },
            //timeframe_two
            data: [12, 23, 13, 25, 33, 14, 34, 12, 12, 22, 12, 12, 13, 23, 12, 24, 22, 13, 22, 5],
            itemStyle: {
              color: "#3fa8eb"
            },
            lineStyle: {
              width: 1,
              opacity: 0.5
            }
        }
      ]
    }
  };
  //详情页标题显示
  detailshow = false;
  // 显示隐藏动画
  state = "show";
  state2 = "hide";
  detailShow() {
    this.state = 'hide';
    this.state2 = 'show';
    this.detailshow = true;
  }
  detailHide() {
    this.state = 'show';
    this.state2 = 'hide';
    this.detailshow = false;
  }
  getSelects:Object = {
    countAll:0,
    countClose:0,
    countActive:0,
    eventNameList:[],
    sourceIdList:[],
    reportingEntityNameList:[],
    sourceNameList:[],
};
  getAlarmFormData(){
    this.myhttp.getAlarmFormData(this.pageNumber,this.pageSize,this.name,this.Priority,this.Status,this.Report).subscribe((data)=>{
        this.list = data.list;
      console.log(data,'data');
    })
  }
}