$.support.cors = true;
 var statusMsg=$('#service-start')
$('#service-start').text('Loading...');

$('#sitehtml').click(function(){
      serviceRedirect();
  });

$(document).ready(function(){
  $('#service-start').text('Starting service now...');
    startService(statusMsg);
});

function serviceRedirect(){
    window.location.href=location.protocol+'//'+location.hostname+':8085/pub/kmccm/site.html';
}

function startService(msg){
    $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script=/apps/kmc-commander-bx.sideload/current/etc/init.d/finstack%20start',
        headers: {
          Accept: 'text/plain',
          "Content-Type": "text/plain; charset=utf-8"
    },
    success: function(data){
      fetchServiceStatus(50,40, msg);
      var status=data.stdout.split('\n')
      var statusText;
       for(var i in status){
        if(status[i].indexOf('Finstack is')>=0){
           statusText = status[i].substring(status[i].indexOf('=')+1);
            $('#service-start').text(statusText);
           break;
          }
        }
    }
    }).fail(function(textStatus){
  });
}

var fetchServiceStatusTimeout;
var fetchServiceStatus = function (updateIntervalMilliseconds, nSecondsLeft, msg) {
       getServiceIsRunning();
      fetchServiceStatusTimeout=setTimeout(function () {
       if (nSecondsLeft <= 0) {
            clearTimeout(fetchServiceStatusTimeout);
            $('#service-start').text('Timed out waiting for service status.');
            location.reload();
         }else{
           if (serviceStatus=='ready'||serviceStatus=='authenticated'){
            var resultMessage='Service is '+serviceStatus+'.';
            var licenseTypeMessage='';//' Full license is active.';
            $('#service-start').text(resultMessage+licenseTypeMessage);
            clearTimeout(fetchServiceStatusTimeout);
            var installerUiUrl=location.protocol+'//'+location.hostname+'/pub/kmccm/site.html';
            window.location.assign(installerUiUrl)
          }else{
            if (serviceIsRunning) {
              $('#service-start').text('Checking service ready '+nSecondsLeft+' sec.');
                checkReady();
            }else{
              $('#service-start').text('Checking service running '+nSecondsLeft+' sec.');
            }
            if(updateIntervalMilliseconds<1000){updateIntervalMilliseconds=1000};
            fetchServiceStatus(updateIntervalMilliseconds, nSecondsLeft-(updateIntervalMilliseconds/1000),$('#service-start'));
          }
        }
  }, updateIntervalMilliseconds);
};

var serviceIsRunning=false;
function getServiceIsRunning(){
      serviceIsRunning=false
      serviceStatus='';
      getServiceRunStatus(function(data){
       if (data){
         data = data.toUpperCase();
         serviceIsRunning= (data.indexOf('RUNNING')!==-1);
         //console.log("serviceIsRunning="+serviceIsRunning);
       }
   });
}

function getServiceRunStatus(cb){
    $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script=/apps/kmc-commander-bx.sideload/current/etc/init.d/finstack%20status',
        headers: {
          Accept: 'text/plain',
          "Content-Type": "text/plain; charset=utf-8"
    },
    success: function(data){
       var status=data.stdout.split('\n')
       var statusText;
       for(var i in status){
        if(status[i].indexOf('Finstack is')>=0){
           statusText = status[i].substring(status[i].indexOf('=')+1);
           cb(statusText);
           break;
          }
        }
       }
    });
}

function checkReady(){
  testForServiceReady(function(err, data){
 if(err&&err.status==404) {
          serviceStatus='Project not found.'
          //console.log('Project not found.');
    }else if (err&&err.status==502) {
          //Bad Gateway
            serviceStatus='loading'
            //console.log(err.statusText);
      }else{
          if (data){
            if (data.substring){
              //
              if(data.substring(0,3)=='<ht'||data.substring(0,3)=='<!D'){
                serviceStatus='ready'
                //console.log("Service Ready for login.");
               }
            }else{
              //test for zinc format
              if (data.meta.ver){
                serviceStatus='authenticated'
                 //console.log("User authenticated.");
              }
            }
          }
      }
});
}

var serviceStatus='';
function testForServiceReady(cb){
  var h = location.protocol+'//'+location.hostname;
  var headers = {
    Accept: "application/json; charset=utf-8",
    "Content-Type": "text/plain; charset=utf-8"
  };
  //console.log(h+'/api/kmcCommanderBxProject/about');
  $.ajax({
    type: 'GET',
    url: h+'/api/kmcCommanderBxProject/about',
    headers: headers,
    xhrFields: {
      withCredentials: true
    },
    error: function(err){
      cb(err);
    },
    success: function(data){
      cb(null, data);
    }
  });
}

