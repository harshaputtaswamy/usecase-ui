
interface homeData {
    services:{
        number:number,
        chartdata:Object[]
    },
    performance:{
        per_Vnf:number,
        per_VmPm:number
    },
    alarm:{
        chartdata:Object[]
    },
    Vm_performance:{
        names:string[]
    }
};

interface homeVmLineData {
    CPU:number[],
    Memory:number[]
}

interface servicesSelectData {
    customer:string[],
    serviceType:string[]
}

interface servicesTableData {
    total:number,
    tableList:string[]
}

interface onboardTableData {
    total:number,
    tableList:string[]
}
export {homeData, homeVmLineData, servicesSelectData, servicesTableData, onboardTableData}