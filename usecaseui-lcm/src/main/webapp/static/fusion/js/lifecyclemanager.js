/*
 * Copyright 2016-2017 ZTE Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var templateParameters = {
    changed : true,
    // the create params used for ui
    paramJsonObj : {}
};

var lcmHandler = function() {
    this._addOwnEvents();
};

lcmHandler.prototype = {
    _addOwnEvents : function() {
        $('#createService').click(function() {
          console.log("create service...");
          $('#createServiceDialog').modal();
        });
        $('#startToCreateService').click(this.okAction);
    },
    okAction : function() {
        if (!checkInputs('create', templateParameters.paramJsonObj)) {
            return;
        }
        var sengMsgObj = collectCreateParamfromUI('', 'create', templateParameters.paramJsonObj);
        var gatewayService = '/openoapi/servicegateway/v1/services';
        $.when(createServiceInstance(sengMsgObj))
        .then(function(response) {
            if (response.status === 'finished') {
                $.when(queryService()).then(function(serviceInstance){
                    $('#sai').bootstrapTable("append", serviceInstance);
                });
                $('#vmAppDialog').removeClass('in').css('display','none');
            } else {
                showErrorMessage('Create service failed',response);
            }
        });
    }
};

function hideBasic() {
  $("#basicInfoTab").hide();
  initParameterTab();
  $("#templateParameterTab").show();
}

function showBasic() {
  $("#basicInfoTab").show();
  $("#templateParameterTab").hide();
}

function serviceTemplateChanged() {
  templateParameters.changed = true;
}

/**
 * init parameter tab
 * @returns
 */
function initParameterTab() {
    // Service template was not changed. Do not re-initiate the parameter tab.
    if (!templateParameters.changed) {
        return;
    }
    var templateId = $("#svcTempl").val();
    if ('select' === templateId) {
        document.getElementById("templateParameterTab").innerHTML = '';
        return;
    }
    $.when(fetchCreateParameters(templateId))
    .then(function(createParam) {
        // set the create param object
        templateParameters.paramJsonObj = createParam.parameters;
        // convert the create param to UI.
        var components = convertCreateParamsToUI('create', createParam.parameters);
        document.getElementById("templateParameterTab").innerHTML = components;
        templateParameters.changed = false;
    });
}

/**
 * generate the template to create parameters object
 *
 * @param templateId
 *            the template id
 * @returns
 */
function fetchCreateParameters(templateId) {
    //return $.getJSON("./conf/queryCreateParams.json");
    var uri = '/openoapi/servicegateway/v1/createparameters/' + templateId;
    return $.ajax({
        type : "GET",
        url : uri
    });
}

/**
 * convert the template params obj to html UI string
 *
 * @param identify the object identify, it should be '' when called
 * @return the html component string
 */
function convertCreateParamsToUI(identify, createParam) {
    var components = '';
    // convert host to UI
    if (undefined !=  createParam.domainHost && 'enum' === createParam.domainHost.type) {
        components = components
                + generateParamComponent(createParam.nodeType, identify,
                        createParam.domainHost, false);
    }
    // convert own param to UI
    createParam.additionalParamForNs
            .forEach(function(param) {
                components = components
                        + generateParamComponent(createParam.nodeType,
                                identify, param, false);
            });
    // convert segments to UI
    createParam.segments.forEach(function(segment) {
        // each segment in a field set.
        components = components + '<fieldset style="margin-left:25px;"><legend>'
                + segment.nodeTemplateName + '</legend>';
        // the identify for segment
        var segmentIdentify = '' == identify ? segment.nodeTemplateName
                : identify + '_' + segment.nodeTemplateName;
        // convert segment to UI
        components = components
                + convertCreateParamsToUI(segmentIdentify, segment);
        components = components + '</fieldset>';
    });
    return components;
}


/**
 * for each required parameter it could not be empty
 * @param identify the identify of a segment
 * @param createParam the create param object
 * @returns the check result
 */
function checkInputs(identify, createParam) {
    //check domain host
    if (undefined !=  createParam.domainHost && 'enum' === createParam.domainHost.type) {
        var value = collectParamValue(identify, createParam.domainHost);
        if ('select' == value) {
            var name = getParamLabel(createParam.nodeType, createParam.domainHost);
            alert( name + ' is required.')
            return false;
        }
    }
    // check parameters
    for(var i= 0; i < createParam.additionalParamForNs.length; i++){
        var param = createParam.additionalParamForNs[i];
        var value = collectParamValue(identify, param);
        if(param.required && ('' === value || ('enum' == param.type && 'select' == value))){
            // the param resource key is nodeType.paramName
            var name = getParamLabel(createParam.nodeType, param);
            alert(name + ' is required.')
            return false;
        }
    }
    // get segments param value from UI
    var segmentcheckResult = true;
    for(var i= 0; i < createParam.segments.length; i++){
        var segment = createParam.segments[i];
        // the identify for segment
        var segmentIdentify = '' == identify ? segment.nodeTemplateName
                : identify + '_' + segment.nodeTemplateName;
        segmentcheckResult = checkInputs(segmentIdentify, segment);
        if (!segmentcheckResult) {
            break;
        }
    }
    return segmentcheckResult;
}


/**
 * convert the template params obj to html UI string
 *
 * @param identify the object identify, it should be different every time
 * @return the html component string
 */
function collectCreateParamfromUI(parentHost,identify, createParam) {
    // the create params used for create msg
    var paramSentObj = {
            domainHost:'',
            nodeTemplateName:'',
            nodeType:'',
            segments:[],
            additionalParamForNs:{}
    };
    // get the domain value
    if (undefined !=  createParam.domainHost && 'enum' === createParam.domainHost.type) {
        var domain = collectParamValue(identify, createParam.domainHost);
        paramSentObj.domainHost = collectParamValue(identify, createParam.domainHost)
    }
    //if parent domainHost is not '' and local domain host is'', it should be setted as parent
    if('' != parentHost && '' == paramSentObj.domainHost){
        paramSentObj.domainHost = parentHost;
    }
    paramSentObj.nodeTemplateName = createParam.nodeTemplateName;
    paramSentObj.nodeType = createParam.nodeType;

    // get own param value from UI
    createParam.additionalParamForNs.forEach(function(param) {
        paramSentObj.additionalParamForNs[param.name] = collectParamValue(identify, param);
    });
    // get segments param value from UI
    createParam.segments.forEach(function(segment) {
        // the identify for segment
        var segmentIdentify = '' == identify ? segment.nodeTemplateName
                : identify + '_' + segment.nodeTemplateName;
        var segmentObj = collectCreateParamfromUI(paramSentObj.domainHost, segmentIdentify, segment);
        paramSentObj.segments.push(segmentObj);
    });
    return paramSentObj;
}

/**
 * get a param value
 * @param identify the identify of a segment
 * @param param the param object
 * @returns the value of the param
 */
function collectParamValue(identify, param) {
    var value = $('#' + getParamId(identify, param)).val();
    return value;
}

/**
 * get the param id in ui
 * @param identify
 * @param param
 * @returns
 */
function getParamId(identify, param) {
    return '' ===identify ? param.name : identify + '_' + param.name;
}

/**
 * get the resource string of a param.
 * @param nodeType node type
 * @param param param object
 * @returns resource string
 */
function getParamLabel(nodeType, param) {
    var name = $.i18n.prop(nodeType + '.' + param.name);
    if (name.length === 0 || name.slice(0, 1) === '[') {
        name = param.name;
    }
    return name;
}
/**
 * convert combox component
 *
 * @param inputPara
 * @param items
 * @param stringReadOnly
 * @returns
 */
function generateParamComponent(nodeType, identify, param, strReadOnly) {
    // the param resource key is nodeType.paramName
    var name = getParamLabel(nodeType, param);
    var id = getParamId(identify,param);
    var component = '';
    if (param.type === 'string') {
        component = '<div class="mT15 form-group" style="margin-left:0px;">'
                + '<label class="col-sm-5 control-label">'
                + '<span>' + name + '</span>' + generateRequiredLabel(param)
                + '</label>'
                + '<div class="col-sm-5"><input type="text" id="' + id
                + '" name="parameter description" class="form-control" placeholder="'
                + name + '" value="' + param.defaultValue;
        if(strReadOnly){
            component = component + '" readonly="' + strReadOnly + '"/>'+ '</div></div>';
        }else{
            component = component + '"/>'+ '</div></div>';
        }

    } else if (param.type === 'enum') {
        component = '<div class="form-group" style="margin-left:0px;margin-bottom:5px;">'
                + '<label class="col-sm-5 control-label">'
                + '<span>' + name + '</span>'
                + '<span class="required">*</span>'
                + '</label>'
                + '<div class="col-sm-5">'
                + '<select class="form-control" style ="padding-top: 0px;padding-bottom: 0px;"'
                + ' id="' + id + '" name="' + param.name + '" value="' + param.defaultValue
                + '">'
                + this.transformToOptions(param.range)
                + '</select></div></div>';
    }
    return component;
}

/**
 * transfer the enum range to html body
 * @param items the map of the range
 * @returns the html string
 */
function transformToOptions(items) {
    var options = '<option value="select">--select--</option>';
    var i;
    for ( var key in items) {
        var option = '<option value="' + key + '">' + items[key] + '</option>';
        options = options + option;
    }
    return options;
}

/**
 * generate required identify to html string
 * @param parameter the parameter object
 * @returns the html string
 */
function generateRequiredLabel(parameter) {
    var requiredLabel = '';
    if (parameter.required === 'true') {
        requiredLabel = '<span class="required">*</span>';
    }
    return requiredLabel;
}

/**
 * create service
 * @param sengMsgObj the parameters
 * @returns
 */
function createServiceInstance(sengMsgObj) {
    var defer = $.Deferred();
    var parameter = {
        'service' : {
            'name' :  $('#svcName').val(),
            'description' : $('#svcDesc').val(),
            'serviceDefId' : '', //no need now, reserved
            'templateId' :  $("#svcTempl").val(),
            'parameters' : sengMsgObj
        }
    };
    var serviceGatewayUri = '/openoapi/servicegateway/v1/services';
    $.when($.ajax({
        type : "POST",
        url : serviceGatewayUri,
        contentType : "application/json",
        dataType : "json",
        data : JSON.stringify(parameter)
    }))
    .then(function(response) {
        return queryProgress('create service', response.service.serviceId,response.service.operationId);
    }).then(function(result){
        defer.resolve(result);
    });
    return defer;
}

/**
 *
 * @param rowId
 * @param row
 * @returns
 */
function deleteService(rowId, row) {
    var deleteHandle = function(result) {
        if (result) {
            var serviceId = row.serviceId;
            var remove = function() {
                $('#sai').bootstrapTable('remove', {
                    field : 'serviceId',
                    values : [ serviceId ]
                });
            };
            var failFun = function(responseDesc) {
                $.isLoading("hide");
                showErrorMessage("Delete service failed", responseDesc);
            }
            $.when(deleteServiceInstance(serviceId))
            .then(function(response) {
                if (response.status === 'finished') {
                    remove();
                } else {
                    showErrorMessage('Create service failed',response);
                }
            });
            ;
        }
    };
    bootbox.confirm("Do you confirm to delete service?", deleteHandle);
}

/**
 * sent delete instance msg
 * @param serviceId the service id
 * @returns
 */
function deleteServiceInstance(serviceId) {
    var defer = $.Deferred();
    var deleteUrl = '/openoapi/servicegateway/v1/services/' + serviceId;
    $.when($.ajax({
        type : "DELETE",
        url : deleteUrl,
        contentType : "application/json",
        dataType : "json",
        data : JSON.stringify(parameter)
    }))
    .then(function(response) {
        return queryProgress('delete service', serviceId,response.operationId);
    }).then(function(result){
        defer.resolve(result);
    });
    return defer;
}

/**
 * query progress of the operation
 * @param operation the operation string
 * @param serviceId the service id
 * @param operationId the operation id
 * @returns
 */
function queryProgress(operation, serviceId, operationId) {
    //show the progress dialog
    $( "#idProgressTitle" ).text(operation);
    $( "#progressContent" ).text('status:');
    $( "#progressbar" ).attr("style","width: 0%");
    $( "#progressDialog" ).modal({backdrop:'static', keyboard:false});
    //set a timer for query operation
    var defer = $.Deferred();
    var queryProgressUril = '/openoapi/servicegateway/v1/services/' + serviceId + '/operations/' + operationId;
    var timerDefer = $.Deferred();
    var timeout = 3600000;
    var fun = function() {
        if (timeout === 0) {
            timerDefer.resolve({
                status : 'error',
                reason : operation + ' timeout!',
            });
            return;
        }
        timeout = timeout - 1000;
        $.when($.ajax({
            type : "GET",
            url : gsoServiceUri
        }))
        .then(function(response) {
            //update progress
            $( "#progressbar" ).attr("style","width: " + response.operation.progress.toString() + "%");
            $( "#progressValue" ).text(response.operation.progress.toString() + '%');
            $( "#progressContent" ).text('status: ' + response.operation.operationContent);
            if (response.operation.result == 'finished' || response.operation.result == 'error') {
                timerDefer.resolve({
                    status : response.operation.result ,
                    reason : response.operation.reason
                });
            }
        });
    };
    var timerId = setInterval(fun, 1000);
    $.when(timerDefer)
    .then(function(responseDesc) {
        clearInterval(timerId);
        $('#progressDialog').modal('hide');
        defer.resolve({
            status : responseDesc.status,
            reason : responseDesc.reason,
            serviceId:serviceId
        });

    });
    return defer;
}


/**
 * convert the input parameters to ui
 * @param identify the identify of a segment
 * @param createParam the create param object
 * @returns the check result
 */
function convertInputsToUI(parentHost, identify, serviceParam) {
    var components = '';
    // convert host to UI
    if (undefined !=  serviceParam.domainHost && '' != serviceParam.domainHost && parentHost != serviceParam.domainHost) {
        var param ={
            name:'domainHost',
            type:'string',
            defaultValue:getShowVal('domainHost', serviceParam.domainHost),
            required:false
        }
        components = components + generateParamComponent(serviceParam.nodeType, identify,
                param, true);
    }
    // convert own param to UI
    for(var key in serviceParam.additionalParamForNs ){
        var param ={
                name: key,
                type:'string',
                defaultValue:getShowVal(key, serviceParam.additionalParamForNs[key]),
                required:false
            }
        components = components + generateParamComponent(serviceParam.nodeType,
                        identify, param, true);
    }
    // convert segments to UI
    serviceParam.segments.forEach(function(segment) {
        // each segment in a field set.
        components = components + '<div class="mT15 form-group"><fieldset style="margin-left:25px;"><legend>'
                + segment.nodeTemplateName + '</legend>';
        // the identify for segment
        var segmentIdentify = '' == identify ? segment.nodeTemplateName
                : identify + '_' + segment.nodeTemplateName;
        // convert segment to UI
        components = components
                + convertInputsToUI(serviceParam.domainHost, segmentIdentify, segment);
        components = components + '</fieldset></div>';
    });
    return components;
}

function getShowVal(paramName, paramValue){
    if(paramName == 'domainHost'){
        return getHostNameByVal(paramValue);
    }
    else if(paramName == 'location'){
        return getVimNameById(paramValue);
    }
    else if(paramName == 'sdncontroller'){
        return getSdnControllerNameById(paramValue);
    }
    else{
        return paramValue;
    }
}

function getHostNameByVal(hostDomain){
     var requestUrl ="/openoapi/servicegateway/v1/domains";
      var returnObj = '';
      $.ajax({
              type : "GET",
              async: false,
              url : requestUrl,
              contentType : "application/json",
              success : function(jsonobj) {
                jsonobj.forEach(function(host){
                    if(host.host == hostDomain){
                          returnObj = host.name;
                    }
                });
              },
              error : function(xhr, ajaxOptions, thrownError) {
                  alert("Error on getting link data : " + xhr.responseText);
              }
          });
      return returnObj;
}

//get the vim name by id.
function getVimNameById(vimId){
  var requestUrl ="/openoapi/extsys/v1/vims/" + vimId;
  var returnObj;
  $
      .ajax({
          type : "GET",
          async: false,
          url : requestUrl,
          contentType : "application/json",
          success : function(jsonobj) {
              // TODO return according to the json data received.
              returnObj = jsonobj;
          },
          error : function(xhr, ajaxOptions, thrownError) {
              alert("Error on getting link data : " + xhr.responseText);
          }
      });
  return returnObj;
}

//get the sdn controller name by id.
function getSdnControllerNameById(sdnControllerId){
  var requestUrl ="/openoapi/extsys/v1/sdncontrollers/" + sdnControllerId;
  var returnObj;
  $
      .ajax({
          type : "GET",
          async: false,
          url : requestUrl,
          contentType : "application/json",
          success : function(jsonobj) {
              // TODO return according to the json data received.
              returnObj = jsonobj;
          },
          error : function(xhr, ajaxOptions, thrownError) {
              alert("Error on getting link data : " + xhr.responseText);
          }
      });
  return returnObj;
}



/**
 * show error dialog
 * @param title the title
 * @param result the result
 * @returns
 */
function showErrorMessage(title, result) {
    //show the error dialog
    $( "#errorDialogTitle" ).text(title);
    $( "#errorDialogReason" ).text(result.reason);
    $( "#errorDialog" ).modal({backdrop:'static', keyboard:false});
}

/**
 * generate the template to create parameters object
 *
 * @param templateId the template id
 * @returns
 */
function queryService(serviceId) {
    var uri = '/openoapi/servicegateway/v1/services/' + serviceId;
    return $.ajax({
        type : "GET",
        url : uri
    });
}
