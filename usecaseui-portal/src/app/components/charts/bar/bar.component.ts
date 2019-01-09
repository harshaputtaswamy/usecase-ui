import { Component, OnInit, Input } from '@angular/core';
import { SimpleChanges } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.less']
})
export class BarComponent implements OnInit {

  // ͼ������
  @Input() chartData;
  // ��ʼ������
  @Input() initData;

  constructor() { }

  ngOnInit() {
    this.initOpts = {
      renderer: 'canvas',
      height: 40,
      width: 160,

    };
    this.barOption = {
      xAxis: this.initData.option.xAxis,
      yAxis: {
        type: 'category',
        show: false,
        axisTick: {
          show: false
        }
      },
      series: this.initData.option.series
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // ����ʵ����ʱ����ִ�У��൱�ڵ�һ�β�ִ�����淽��
    if (this.chartIntance) {
      this.chartDataChange()
    }
  }
  // ��ʼ��ͼ�θ߶�
  initOpts: any;
  // ����ͼ����
  barOption: any;
  // ʵ������
  chartIntance: any;
  // ���ݱ仯
  updateOption: any;
  chartDataChange() {
    this.updateOption = this.chartData;
  }
  chartInit(chart) {
    this.chartIntance = chart;
  }

}
