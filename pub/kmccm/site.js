
$.support.cors = true;

var newLicense;
var newLicenseCaps;
var tempLicense;
function  updateCapCount(cb){
  var projectUsage=0;
  var licUsage = {};
  console.log('UPDATECAPCOUNT')
    sendExpr('kmcTagAllForProjectLicense(false,true)', function(err,data){
      data = parseZinc(data);
      console.log('cc', data);
      if(data.rows.length){
        for(var i in data.rows){
            for(var key in data.rows[i])
               licUsage[key] = data.rows[i][key];
        }
      }
      tempLicense=(licUsage["licenseStatus"]=='temp')
         if (tempLicense) 
            { 
             projectUsage=licUsage["tempUsed"];
             $('#navbar-subtitle-caps').addClass('caps-tempLicense');         
            } 
        else{ 
             projectUsage=licUsage["licenseUsed"];
             $('#navbar-subtitle-caps').removeClass('caps-tempLicense');
            };
      var licenseTotal
      if (newLicenseCaps) {licenseTotal=newLicenseCaps }else{licenseTotal=licUsage["licenseLimit"]}
      $('#navbar-subtitle-caps').text('CAPS used: ' +projectUsage+ ' of '+licenseTotal);
      if (licUsage["licenseStatus"]=='caps Exceeded') { $('#navbar-subtitle-caps').addClass('caps-metrics-err')} else { $('#navbar-subtitle-caps').removeClass('caps-metrics-err')};
      if (licUsage["licenseStatus"]=='ok'){ $('#navbar-subtitle-caps').addClass('caps-metrics')};
      if(cb){
        cb(err, licUsage);
      }
    }, 'text/plain')
}

function syncType(type, host, cb){
  sendExpr('readAll('+type+')', function(err, data){
    if(err) return cb(err);
    var odata = data;
    var rows = data.split('\n');
    rows.shift();
    for(var i = 0; i < rows.length; i++){
      if(!rows[i].trim().length){
        rows.splice(i, 1);
        i--;
      }
    }

    // delete existing records if existing
    var ids = [];
    for(var j = 1; j < rows.length; j++){
      ids.push(rows[j].split(' ')[0]);
    }
    sendExpr('readByIds(['+ids.join(',')+'],false)', function(err, objs){
      if(err) return cb(err);
      var objrows = objs.split('\n');
      var delobjs = [];
      for(var k = 2; k < objrows.length; k++){
        var objrow = objrows[k].split(',');
        if(objrow[0].length)
          delobjs.push([
            objrow[0].split(' ')[0],
            objrow[objrow.length-1]
          ]);
      }
      var rdata = 'ver:"2.0" commit:"remove"\nid,mod\n';
      for(var l in delobjs){
        rdata += delobjs[l].join(',')+'\n';
      }
      $.ajax({
        type: 'POST',
        url: host+'/api/'+CloudProjectName+'/commit',
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8",
          "Cookie": CookieCloud
        },
        xhrFields: {
             withCredentials: true
        },
        data: rdata,
        success: function(data){
          // add the commit header
          rows.unshift('ver:"2.0" commit:"add"');
          var data = rows.join('\n');
          $.ajax({
            type: 'POST',
            url: host+'/api/'+CloudProjectName+'/commit',
            headers: {          
              Accept: 'text/plain',         
              "Content-Type": "text/plain; charset=utf-8",
              "Cookie": CookieCloud
            },
            xhrFields: {
                 withCredentials: true
            },
            data: data,
            success: function(data){
              cb(null, data, odata);
            }
          });
        }
      });
    }, 'text/plain', host, CloudProjectName);
  }, 'text/plain');
}

//ver:"2.0" commit:"add"
//dis,testing
//"TestRec",M
function createItem(item,cb,accept){
  var data = 'ver:"2.0" commit:"add"\n';
  var values = '';
  for(var i in item){
    data += i+',';
    if(typeof(item[i]) == 'string'){
      if(item[i] == '✓'){
        values += 'M,';
      }else if(item[i][0] == '@'){
        values += item[i]+',';
      }else if(item[i][0] == '`'){
        values += item[i]+',';
      }else if(item[i][0] == '|'){
        values += item[i].substring(1, item[i].length-1)+',';
      }else{
        values += '"'+item[i]+'",';
      }
    }else{
      if(item[i] == null)
        values += 'N,';
      else if(typeof item[i] === 'object')
        values += '"'+JSON.stringify(item[i]).replace(/"/g,'\\"')+'",';
      else
        values += item[i]+',';
    }
  }
  data = data.substring(0,data.length-1);
  values = values.substring(0,values.length-1);
  data = data + '\n' + values;

  $.ajax({
    type: 'POST',
    url: '/api/kmcCommanderBxProject'+'/commit',
    headers: {          
      Accept: accept||"application/json; charset=utf-8",         
      "Content-Type": "text/plain; charset=utf-8"
    },
    data: data,
    success: function(data){
      cb(null, data);
    }
  });
}

function removeItem(item, cb, accept){
  var data = 'ver:"2.0" commit:"remove"\n';
  data += 'id,mod';
  var dis = '';
  var id = '';
  if(item.id.split(' ').length > 1){
    dis = item.dis;
    id = item.id.substring(0,item.id.indexOf(' '));
  }else{
    id = item.id;
  }
  data += '\n'+id+','+item.mod;
  $.ajax({
    type: 'POST',
    url: '/api/kmcCommanderBxProject'+'/commit',
    headers: {          
      Accept: accept||"application/json; charset=utf-8",         
      "Content-Type": "text/plain; charset=utf-8"
    },
    data: data,
    success: function(data){
      cb(null, data);
    }
  });
}

function modItem(item, mod, cb, accept){
  // mods an item with the given mod
  var data = 'ver:"2.0" commit:"update"\n';
  data += 'id,mod';
  var dis = '';
  var id = '';
  if(item.id.split(' ').length > 1){
    dis = item.dis;
    id = item.id.substring(0,item.id.indexOf(' '));
    id += ' "' + dis + '"';
  }else{
    id = item.id;
  }
  var d = new Date();
  var values = id+','+item.mod;
  for(var n in mod){
    data += ','+n;
    if(typeof(mod[n]) == 'string'){
      if(mod[n][0] == '@')
        values += ','+mod[n];
      else
        values += ',"'+mod[n]+'"';
    }else{
      values += ','+mod[n];
    }
  }
  data += '\n'+values;
  $.ajax({
    type: 'POST',
    url: '/api/kmcCommanderBxProject'+'/commit',
    headers: {          
      Accept: accept||"application/json; charset=utf-8",         
      "Content-Type": "text/plain; charset=utf-8"
    },
    data: data,
    success: function(data){
      cb(null, data);
    }
  });
}

function scrollToTop(offs){
  var off = offs?offs:0;
  $('html, body').animate({
    scrollTop: $("#tab-all").offset().top+off
  }, 600);
}

function scrollToElement(elem, offs){
  var off = offs?offs:0;
  $('html, body').animate({
    scrollTop: $(elem).offset().top-20+off
  }, 600);
}

$('#btn-serviceStataus').text("Restart Service");
$('#btn-serviceStataus').click(function(){
    restartService();
});
$('#btn-serviceLogout').click(function(){
    $('#loginModal').modal('show');
});

function restartService(msg){
    $.ajax({
      type: 'GET',
      url: location.protocol+'//'+location.hostname+':8081/run?script=/apps/kmc-commander-bx.sideload/current/etc/init.d/finstack%20restart',
      headers: {
        Accept: 'text/plain',
        "Content-Type": "text/plain; charset=utf-8"
      },
    success: function(data){
      fetchServiceStatus(5,60, msg);
      var status=data.stdout.split('\n')
      var statusText;
       for(var i in status){
        if(status[i].indexOf('Finstack is')>=0){
           statusText = status[i].substring(status[i].indexOf('=')+1);
            msg.text(statusText);
           break;
          }
        }
    }
    }).fail(function(textStatus){
          console.log(textStatus);
  });
}

var fetchServiceStatusTimeout;
var fetchServiceStatus = function (updateIntervalSeconds, nSecondsLeft, msg) {
       getServiceIsRunning();
      fetchServiceStatusTimeout=setTimeout(function () {
       if (nSecondsLeft <= 0) {
            clearTimeout(fetchServiceStatusTimeout);
            msg.text('Timed out waiting for service status.');
            location.reload();
         }else{
           if (serviceStatus=='ready'||serviceStatus=='authenticated'){
            var resultMessage='Service is '+serviceStatus+'.';
            var licenseTypeMessage=' Full license is active.';
            //Check the old state of the tempLicense flag
            if (!tempLicense) {licenseTypeMessage=' Temp license is active.'};
            msg.text(resultMessage+licenseTypeMessage);
            if (serviceStatus=='ready') {$('#loginModal').modal('show')};
            clearTimeout(fetchServiceStatusTimeout);
          }else{
            if (serviceIsRunning){
             msg.text('Service is Running.');
             testForServiceReady();
           }
            if (serviceIsRunning) {
              msg.text('Checking service ready '+nSecondsLeft+' sec.');
            }else{
              msg.text('Checking service running '+nSecondsLeft+' sec.');
            }
            fetchServiceStatus(updateIntervalSeconds, nSecondsLeft-updateIntervalSeconds,msg);
          }
        }
  }, updateIntervalSeconds*1000);
};

var serviceIsRunning=false;
function getServiceIsRunning(){
      serviceIsRunning=false
      serviceStatus='';
      getServiceRunStatus(function(data){
       serviceIsRunning= (data.toUpperCase().includes('RUNNING'));
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

var serviceStatus='';
function testForServiceReady(){
  serviceStatus='';
  sendExpr('read(kmcInstallProject)', function(err, data){
    if(err&&err.status==404) {
         $('#modal-alert-text').text('Project not found.');
         $('#modal-alert').modal('show');
    }else if (err&&err.status==502) {
          //Bad Gateway
            serviceStatus='loading'
            console.log(err.statusText);
      }else{
          if (data.substring){
            //
            if(data.substring(0,3)=='<ht'||data.substring(0,3)=='<!D'){
              serviceStatus='ready'
              console.log("Service Ready for login.");
             }
          }else{
            //test for zinc format
            if (data.meta.ver){
              serviceStatus='authenticated'
               console.log("User authenticated.");
            }
          }
      }
  });
}
  // -------- Networks Functions
var Networks = [];
function addNewOrEditNetwork(netNameTextBoxRef){
  //Check for existing Network to know if this is an Edit or Add new
    if (Networks.length){
     for (id in Networks){
        if (Networks[id]!=null){
          if ($(netNameTextBoxRef)[0].value==Networks[id].dis){
              $('#networks-add-network').text('Edit Network');
              return;
            }else{
              $('#networks-add-network').text('Add Network');
             }
        }
     }
  }
}

$('#network-dis').keyup(function(){
    addNewOrEditNetwork(this);
});

$('#network-router').keyup(function(){
    validateIp(this.value);
});

  var networksCid = 0;


function fetchNetworks(){
  Networks = [];
  $('#current-networks').html('');
  sendExpr('readAll(kmcInstallNetwork).sort(\"dis\")', function(err,data){
    data = parseZinc(data);
    if(data.rows.length){
      for(var i in data.rows){
        (function(){
          var network = {};
          for(var key in data.rows[i])
            network[key] = data.rows[i][key];
          networksCid++;
          Networks[networksCid] = network;
          var id = networksCid;
          var netView = '';
          netView += '<a href="#" id="network-'+id+'-group-item" class="list-group-item"><div class="list-group-item-text">';
          netView += '<div><b>Name: </b>'+network.dis+'</div>';
          netView += '<div><b>Type: </b>'+network.type+'</div>';
          if (network.router!=""){
            netView += '<div><b>Router/Subnet: </b>'+network.router+'</div>';
            netView += '<div><b>UDP Port: </b>'+network.udp+'</div>';
            var deviceNetwork;
            if (isNaN(network.dNet)||network.dNet==65535) {deviceNetwork="All"}
              else{deviceNetwork=network.dNet};
            netView += '<div><b>BACnet Network: </b>'+deviceNetwork+'</div>';
          }else{
            netView += '<div><b>Port: </b>'+network.portId+'</div>';
            netView += '<div><b>Baud: </b>'+network.baud+'</div>';  
          }
          netView += '<div><b>Instance Min: </b>'+network.imin+'</div>';
          netView += '<div><b>Instance Max: </b>'+network.imax+'</div>';
          netView += '<div class="btn btn-link link-div" id="network-'+id+'-delete">Delete</div>';
          netView += '</div></a>';
          $('#current-networks').append(netView);
          $('#network-'+id+'-group-item').click(function(n){
            n.preventDefault();
            $('#network-dis').val(network.dis);
            $('#network-router').val(network.router);
            $('#network-udp').val(network.udp);
            $('#network-dNet').val(network.dNet);
            $('#network-imin').val(network.imin);
            $('#network-imax').val(network.imax);
            setToggleSwitch(network.type)
            scrollToElement('#add-network-panel');
            $('#networks-add-network').text('Edit Network');
          });
          $('#network-'+id+'-delete').click(function(n){
            n.preventDefault();
            $(this).parents('.list-group-item').remove();
            removeItem(Networks[id], function(data){

            }, 'text/plain');
            Networks[id]=null;
          });
        })();
      }
    }
  }, 'text/plain');
}

function validateIp(addy) {
  var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;  
  if(addy.match(ipformat)) {
    $('#network-router').removeClass('check-value-border');
    return (true)
  }
  else{
    $('#network-router').addClass('check-value-border');
    return (false)
  }
}
 
function validateNetworkName(name){
   if (Networks.length){
       for ( id in Networks){
          if (Networks[id]!=null){
              if (name==Networks[id].dis){
              $('#network-'+id+'-delete').parents('.list-group-item').remove();
              removeItem(Networks[id], function(data){
            }, 'text/plain');
            Networks[id]=null;
            return (true);
            }
            else{
             $('#network-dis').removeClass('check-value-border');
            }
          }
       }
    }
    return (true);
}
  
var siteG = {};
var Cookie;
var CookieCloud;
var Connected = false;
var CloudProjectName = 'kmcCommanderBxProject';

// -------- Discover 
var DiscoverTable = new $('#discover-table').DataTable({
  columnDefs: [
    {orderable: false, targets: 0},
    {targets: 7, visible: false, searchable: false}
  ],
  order: [[1, 'desc']],
});

function checkedNetworks(){
  var checked = {};
  $('.discover-networks').find('input').each(function(n){
    if($(this).prop('checked')){
      checked[$(this).val()] = true;
    }
  });
  return checked;
}

  var Devices = {};

  function buildDeviceList(selectedDeviceList,profiledDevicesList){
    for(var i = 0; i < Object.keys(Devices).length; i++){
      var p = $(DiscoverTable.row(i).nodes());
      if(p.find('input[type="checkbox"]').get()[0].checked){
        var id = DiscoverTable.row(i).data()[7];
        selectedDeviceList.push(Devices[id]);
        var n = {};
        n.modelName = Devices[id].modelName;
        //if(Devices[id].vendorName)
        //  n.vendorName = Devices[id].vendorName;
        if(Devices[id].appTypeId)
          n.appTypeId = Devices[id].appTypeId;
        profiledDevicesList.push(n);
      }
    }
  }

    
$(document).ready(function(){

  var DownloadedProfiles;

  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
    options.crossDomain ={
      crossDomain: true
    };
    options.xhrFields = {
      withCredentials: true
    };
  });

  $('#db-img').click(function(){
    $('#cloudModal').modal('show');
  });

  // ------------ Login

  //dpb 2016-05-10: use finSyncProc pw, not su, here and below
  var CloudPassword = 'finSync123';
  $('#cloud-modal-connect').click(function(){
    var host = $('#cloud-host-input').val();
    // login to cloud server
    $.ajax({
      type: 'GET',
      url: host+'/auth/'+CloudProjectName+'/api?'+'finSyncProc',
      headers: {          
        Accept: 'text/plain',         
        "Content-Type": "text/plain; charset=utf-8"
      },
      success: function(data){
        var rows = data.split('\n');
        var userSalt = rows[1].split(':')[1];
        var nonce = rows[3].split(':')[1];
        var shaObj = new jsSHA('SHA-1', "TEXT");
        shaObj.setHMACKey(CloudPassword, "TEXT");
        shaObj.update('finSyncProc'+':'+userSalt);
        var hmac = shaObj.getHMAC("B64");
        var shaObj2 = new jsSHA('SHA-1', 'TEXT');
        shaObj2.update(hmac+':'+nonce);
        var hash = shaObj2.getHash('B64');
        var data = 'nonce:'+nonce+'\n'+'digest:'+hash;
        $.ajax({
          type: 'POST',
          url: host+'/auth/'+CloudProjectName+'/api?'+'finSyncProc',
          headers: {          
            Accept: 'text/plain',         
            "Content-Type": "text/plain; charset=utf-8"
          },
          data: data
        }).fail(function(){
          $('#cloud-host-basicStatus').text('Invalid username or password for cloud server');
        }).done(function(data, statusText, xhr){
          CookieCloud = data.substring(data.indexOf(':')+1);
          Connected = true;
          $('#cloudModal').modal('hide');
        });
      }
    });
  });

  $('#cloud-modal-login').click(function(){
    // get the userSalt and nonce from /auth/CloudProjectName/api?username
    $('#cloud-host-basicStatus').text('');
    $.ajax({
      type: 'GET',
      url: '/auth/kmcCommanderBxProject'+'/api?'+$('#cloud-host-username').val(),
      headers: {          
        Accept: 'text/plain',         
        "Content-Type": "text/plain; charset=utf-8"
      },
      success: function(data){
        var rows = data.split('\n');
        var userSalt = rows[1].split(':')[1];
        var nonce = rows[3].split(':')[1];
        var shaObj = new jsSHA('SHA-1', "TEXT");
        shaObj.setHMACKey($('#cloud-host-password').val(), "TEXT");
        shaObj.update($('#cloud-host-username').val()+':'+userSalt);
        var hmac = shaObj.getHMAC("B64");
        var shaObj2 = new jsSHA('SHA-1', 'TEXT');
        shaObj2.update(hmac+':'+nonce);
        var hash = shaObj2.getHash('B64');
        var data = 'nonce:'+nonce+'\n'+'digest:'+hash;
        $.ajax({
          type: 'POST',
          url: '/auth/kmcCommanderBxProject'+'/api?'+$('#cloud-host-username').val(),
          headers: {          
            Accept: 'text/plain',         
            "Content-Type": "text/plain; charset=utf-8"
          },
          data: data
        }).fail(function(){
          $('#cloud-host-basicStatus').text('Invalid username or password');
        }).done(function(data, statusText, xhr){
          Cookie = data.substring(data.indexOf(':')+1);
          if (serviceStatus=='') {location.reload();}
           $('#loginModal').modal('hide');
           updateCapCount();
        });
      }
    });
  });

  // ------------ Users

  $('#btn-users-next').click(function(n){
    $('#tab-all a[href="#tab-build"]').tab('show');
    scrollToTop();
  });

  function generateUserSalt(){
    // generate random 32-byte base64 string
    //c7t5US6aJHcJN3SDpd3D1gss5Z4HhYFpj4iBe30kJoE=
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";
    var string_length = 32;
    var randomstring = '';
    for (var i=0; i<string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum,rnum+1);
    }
    // convert to b64
    return btoa(randomstring);
  }
  function generateUserHMAC(username, usersalt, password){
    // generate a base64 hmac for this password
    var shaObj = new jsSHA('SHA-1', "TEXT");
    shaObj.setHMACKey(password, "TEXT");
    shaObj.update(username+':'+usersalt);
    var hmac = shaObj.getHMAC("B64");
    return hmac;
  }

  var users = [];
  var usersCid = 0;
  $('#userFetch-Sync').click(function(){
    if(!currentSite)
      return $('#cloud-userfetch-status').text('Must have selected a site'); 
    $.ajax({
      type: 'GET',
      url: 'http://projects.kmccontrols.com/projects/'+currentSite.project+'/users',
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        for(var u in data){
          (function(){
          var user = data[u];
          user.dis = user.firstName + ' ' + user.lastName + ' ' + user.email;
          user.actionAccessFilter = "hvac_finCat <= 6";
          user.username = user.email;
          //user.tz
          //user.role
          user.user = '✓';
          user.topology = user.topology||[];
          user.userSalt = generateUserSalt();
          user.userHMAC = generateUserHMAC(user.username, user.userSalt, user.pw||'bacon');
          if(user.pw)
            delete user.pw;
          users.push(user);
          var userView = '';
          userView += '<a href="#" id="user-'+usersCid+'-group-item" class="list-group-item"><div class="list-group-item-text">';
          userView += '<div><b>First Name: </b>'+user.firstName+'</div>';
          userView += '<div><b>Last Name: </b>'+user.lastName+'</div>';
          userView += '<div><b>Username: </b>'+user.username+'</div>';
          //userView += '<div><b>Role: </b>'+$('#users-role option:selected').text()+'</div>';
          userView += '<div><b>Email: </b>'+user.email+'</div>';
          userView += '<div><b>Phone </b>'+user.phone+'</div>';
          //userView += '<div><b>Timezone: </b>'+$('#users-tz option:selected').text()+'</div>';
          userView += '<div class="btn btn-link link-div" id="user-'+usersCid+'-delete">Delete</div>';
          userView += '</div></a>';
          $('#users-to-add').append(userView);
          $('#user-'+usersCid+'-group-item').click(function(n){
            n.preventDefault();
            loadUserTopology(user);
            //scrollToTop(120);
          });
          $('#user-'+usersCid+'-delete').click(function(n){
            n.preventDefault();
            $(this).parents('.list-group-item').remove();
            for(var i in users){
              if(user.dis == users[i].dis){
                users.splice(i,1);
                return;
              }
            }
          });
          usersCid++;
          })();
        }
        //$("html, body").animate({ scrollTop: $(document).height() }, "slow");
        return $('#cloud-userfetch-status').text('Successfully synced users');
      }
    }).fail(function(){
      return $('#cloud-userfetch-status').text('Could not sync users');
    });
  });
  var currentPermissionsUser;
  function loadUserTopology(user){
    if(!Project) return;
    currentPermissionsUser = user;
    $('#user-topology-permissions').jstree('destroy');
    $('#user-topology-permissions').jstree({
      "core" : {
        "animation" : 0,
        "check_callback" : false,
        "themes" : {},
        'data' : JSON.parse(JSON.stringify(!user.topology.length?Project.topology:user.topology))
      },
      "types" : {
        "#": {
          "max_depth": 4,
          //"valid_children": [structure[0]]
          "valid_children": ['site', 'building', 'floor', 'box']
        },
        "site" : {
          "icon" : "glyphicon glyphicon-globe",
          //"valid_children" : immediates['site']
          "valid_children": ['building', 'floor', 'box']
        },
        "building" : {
          "icon" : "glyphicon glyphicon-home",
          //"valid_children" : immediates['building']
          "valid_children": ['floor', 'box']
        },
        "floor" : {
          "icon" : "glyphicon glyphicon-align-justify",
          //"valid_children" : immediates['floor']
          "valid_children": ['box']
        },
        "box" : {
          "icon" : "glyphicon glyphicon-hdd",
          "valid_children" : []
        }
      },
      "checkbox": {
        "three_state": false
      },
      "plugins" : [
        "dnd", "search",
        "types", "wholerow",
        "checkbox","unique"
      ]
    });
    $('#user-topology-permissions').jstree(true).deselect_all();
    $('#user-topology-permissions').on('changed.jstree', function (e, data) {
      currentPermissionsUser.topology = $('#user-topology-permissions').jstree(true).get_json('#', {'no_state':false});
    });
  }
  $('#users-add-user').click(function(n){
    var user = {};
    if($('#users-password').val() != $('#users-rtpassword').val()){
      alert('Passwords must match');
      return;
    }
    if($('#users-password').val().length == 0){
      alert('Must enter a password');
      return;
    }
    user.firstName = $('#users-firstName').val();
    user.lastName = $('#users-lastName').val();
    user.username = $('#users-username').val();
    user.dis = user.firstName + ' ' + user.lastName;
    user.actionAccessFilter = "hvac_finCat <= 6";
    //user.password = $('#users-password').val();
    user.email = $('#users-email').val();
    user.phone = $('#users-phone').val();
    user.tz = $('#users-tz').val();
    user.role = $('#users-role').val();
    user.user = '✓';
    user.topology = [];
    //$2a$10$BWKP34pDIB7i8fuHofu/BuZP2dDKsquww7GdBklwjPWPfQf42lquO
    user.userSalt = generateUserSalt();
    user.userHMAC = generateUserHMAC(user.username, user.userSalt, $('#users-password').val());
    users.push(user);
    var userView = '';
    userView += '<a href="#" id="user-'+usersCid+'-group-item" class="list-group-item"><div class="list-group-item-text">';
    userView += '<div><b>First Name: </b>'+user.firstName+'</div>';
    userView += '<div><b>Last Name: </b>'+user.lastName+'</div>';
    userView += '<div><b>Username: </b>'+user.username+'</div>';
    userView += '<div><b>Role: </b>'+$('#users-role option:selected').text()+'</div>';
    userView += '<div><b>Email: </b>'+user.email+'</div>';
    userView += '<div><b>Phone </b>'+user.phone+'</div>';
    userView += '<div><b>Timezone: </b>'+$('#users-tz option:selected').text()+'</div>';
    userView += '<div class="btn btn-link link-div" id="user-'+usersCid+'-delete">Delete</div>';
    userView += '</div></a>';
    $('#users-to-add').append(userView);
    $('#user-'+usersCid+'-group-item').click(function(n){
      n.preventDefault();
      loadUserTopology(user);
      //scrollToTop(120);
    });
    $('#user-'+usersCid+'-delete').click(function(n){
      n.preventDefault();
      $(this).parents('.list-group-item').remove();
      for(var i in users){
        if(user.dis == users[i].dis){
          users.splice(i,1);
          return;
        }
      }
    });
    usersCid++;
    $('#users-firstName').val('');
    $('#users-lastName').val('');
    $('#users-username').val('');
    $('#users-password').val('');
    $('#users-rtpassword').val('');
    $('#users-email').val('');
    $('#users-phone').val('');
    $('#users-tz').val('America/New_York');
    $('#users-role').val('owner');
  });

  $('#users-submit').click(function(n){
    if(users.length){
      $('#users-basicStatus').text('Sending updates...');
      for(var i in users){
        (function(){
          var user = users[i];
          console.log(user)
          if(user.role != 'Admin'){
            user['finAppAccess']="navTree,historianPopup,alarms,finGraphics,historian,notes,points,kmcCards,schedules";
            user['appAccess']="help,finstack,alarm,his,note,schedule";
          }
          createItem(user, function(err,data){
            var id = parseZinc(data).rows[0].id;
            sendExpr('passwordSet('+id+', \"'+user.userHMAC+'\")', function(err,data){

            }, 'text/plain');
            $('#users-basicStatus').text('Updates successful');
          }, 'text/plain');
        })();
      }
    }

    //$('#tab-all a[href="#tab-networks"]').tab('show');
    //scrollToTop();
  });

  // -------- Device

  $('#btn-show-device').click(function(){
    $('#device-iframe').toggle();
  });
  $('#device-iframe').attr('src', 'https://'+window.location.hostname+'/');

  $('#btn-device-next').click(function(n){
    $('#tab-all a[href="#tab-networks"]').tab('show');
    scrollToTop();
  });

  var BOX_TYPE = 'boxTypeCloud';
  $('input[name=boxType]:radio').change(function(){
    BOX_TYPE = $('input[name=boxType]:checked').val();
    if(BOX_TYPE == 'boxTypeCloud'){
      $('#sites-fetch-btn').show();
      $('#sites-local-form').hide();
    }else{
      $('#sites-fetch-btn').hide();
      $('#sites-form').hide();
      $('#sites-local-form').show();
    }
  });

  $('#tab-all a[href="#tab-sites"]').on('hide.bs.tab', function(e){
    // if local, prompt for profiles
    if(BOX_TYPE == 'boxTypeLocal')
      $('#loadProfilesModal').modal('show');
  });

  $('#loadProfilesModal').on('hidden.bs.modal', function(e){
    if(confirm('Are you finished loading profiles?')){
      
    }else{
      $('#loadProfilesModal').modal('show');
    }
  });

  // -------- Networks



  var networkTypeIp=true;
  var networkType="BACnet/IP";
  $('#network-type').click(function() {
    $(this).toggleClass('On').toggleClass('Off');
    if($(this).hasClass('On')){
      networkTypeIp=true;
      networkType="BACnet/IP"
      $(this).find('.Toggle').attr('data-toggletext', 'BACnet/IP');
      $('#network-bn-ip').show();
      $('#network-bn-mstp').hide();
    }else{
      networkTypeIp=false;
      networkType="BACnet-MS/TP"
      $(this).find('.Toggle').attr('data-toggletext', 'MS/TP');
      $('#network-bn-mstp').show();
      $('#network-bn-ip').hide();
    }
  });

  function setToggleSwitch(networkType){
    if (networkType=="BACnet/IP"){
      if (networkTypeIp!=true){
         $('#network-type').toggleClass('Off');
         networkTypeIp=true;
      }
      $('#network-type').find('.Toggle').attr('data-toggletext', 'BACnet/IP');
      $('#network-bn-ip').show();
      $('#network-bn-mstp').hide();
    }else{
      if (networkTypeIp==true){
         $('#network-type').toggleClass('Off');
         networkTypeIp=false;
      }
      $('#network-type').find('.Toggle').attr('data-toggletext', 'MS/TP');
      $('#network-bn-mstp').show();
      $('#network-bn-ip').hide();
    }
   }

  $('#networks-add-network').click(function(){
    $('#networks-add-network').text('Add Network');
    $('#network-dis').removeClass('check-value-border');
    $('#network-router').removeClass('check-value-border');
    networksCid++;
    var network = {};
    network.router = $('#network-router').val();
    network.dis = $('#network-dis').val();
    if (network.dis=="") network.dis=$('#network-dis').attr("placeholder"); 
    var goodIp;
    if (networkTypeIp) { goodIp=validateIp($('#network-router').val())} else {goodIp=(true)};
    if (goodIp){
        if  (validateNetworkName(network.dis) ){
          if (networkTypeIp){
            network.udp = parseInt($('#network-udp').val());
            network.dNet = parseInt($('#network-dNet').val())
            if (isNaN(network.dNet)){network.dNet=65535};
          }
          else{
            network.port = $("input[name=portNumber]:checked").val();
            network.portId = $("input[name=portNumber]:checked").attr("id");
            network.baud = parseInt($('#network-baud').val());
          }
        network.imin = parseInt($('#network-imin').val());
        network.imax = parseInt($('#network-imax').val());
        network.type = networkType;
        createNetwork(network, function(data){
          network.id = data.rows[0].id;
          network.mod = data.rows[0].mod;
        });
        Networks[networksCid] = network;
        //Clear Entry fields
        $('#network-dis').val('');
        $('#network-router').val('');
        $('#network-udp').val('47808');
        $('#network-dNet').val('');
        $('#network-imin').val('0');
        $('#network-imax').val('4194303');
        (function(){
          var id = networksCid;
          var netView = '';
          netView += '<a href="#" id="network-'+id+'-group-item" class="list-group-item"><div class="list-group-item-text">';
          netView += '<div><b>Name: </b>'+network.dis+'</div>';
          netView += '<div><b>Type: </b>'+network.type+'</div>';
          if (networkTypeIp){
          netView += '<div><b>Router/Subnet: </b>'+network.router+'</div>';
          netView += '<div><b>UDP Port: </b>'+network.udp+'</div>';
          var deviceNetwork;
          if (network.dNet==65535){deviceNetwork="All"}else{deviceNetwork=network.dNet};
          netView += '<div><b>BACnet Network: </b>'+deviceNetwork+'</div>';
          }
          else{
          netView += '<div><b>Port: </b>'+network.portId+'</div>';
          netView += '<div><b>Baud: </b>'+network.baud+'</div>';
          //netView += '<div><b>Mac: </b>'+network.mac+'</div>';
          };
          netView += '<div><b>Instance Min: </b>'+network.imin+'</div>';
          netView += '<div><b>Instance Max: </b>'+network.imax+'</div>';
          netView += '<div class="btn btn-link link-div" id="network-'+id+'-delete">Delete</div>';
          netView += '</div></a>';
          $('#current-networks').append(netView);
          $('#network-'+id+'-group-item').click(function(n){
            n.preventDefault();
            $('#network-dis').val(network.dis);
            $('#network-router').val(network.router);
            $('#network-udp').val(network.udp);
            $('#network-dNet').val(network.dNet);
            $('#network-imin').val(network.imin);
            $('#network-imax').val(network.imax);
            setToggleSwitch(network.type)
            scrollToElement('#add-network-panel');
            $('#networks-add-network').text('Edit Network');
          });
          $('#network-'+id+'-delete').click(function(n){
            n.preventDefault();
            $(this).parents('.list-group-item').remove();
            removeItem(Networks[id], function(data){

            }, 'text/plain');
            Networks[id]=null;
          });
        })();
      }
   }
  });
  $('#networks-submit').click(function(n){
    $('#tab-all a[href="#tab-discover"]').tab('show');
    scrollToTop();
  });

  function createNetwork(network, cb){
    var item = {
      kmcInstallNetwork:'✓'
    };
    for(var key in network)
      item[key] = network[key];
    createItem(item, function(err,data){
      if(cb) cb(parseZinc(data));
    }, 'text/plain');
  }

  // ---- Device List

  function discoverNetworkOrQuit(err, next){
    // discovers the next network or quits if we've at the end
    if(next > networksCid){
      //$('#discover-spinner').hide();
      $('#discover-progress').hide();
      //$('#discover-progress .progress-bar').css('width', '1%');
      $('#discover-btn').removeClass('disabled');
      $('#Load-discover-File-btn').removeClass('disabled');
      $('#discover-basicStatus').text('');
      return;
    }
    if(!Networks[next] || !checkedNetworks()[Networks[next].dis]){
      discoverNetworkOrQuit(null, next+1);
    }else{
      sendExpr('ioDelete(`io/kmcDiscovery.zinc`)', function(err, data){}, 'text/plain');
      $('#discover-basicStatus').text('Discovering network '+Networks[next].dis+ '. Job started.');
    var broadcastAddress;
    if (Networks[next].type=="BACnet/IP"){broadcastAddress='`bacnet://'+Networks[next].router+':'+Networks[next].udp+'`'}
       else {broadcastAddress='`bacnetMstp://'+Networks[next].port+'?baud='+Networks[next].baud+'`'};
      sendExpr('jobRun(kmcDiscover('+broadcastAddress+','+Networks[next].imin+','+Networks[next].imax+',15))', function(err, data){
        if (data) { fetchJobStatus(data.rows[0].val,5,120) }
        if (err){ discoverError(err)}
      });
    }

    function getDiscoveryFile(){
      sendExpr('ioReadZinc(`io/kmcDiscovery.zinc`)', function(err, data){
        fillDiscoverTable(data,next);
        //Save a copy of the discovery file for manual reload
        sendExpr('ioCopy(`io/kmcDiscovery.zinc`, `io/'+Networks[next].dis+'.zinc`,{overwrite:true})', function(err, data){}, 'text/plain');
        discoverNetworkOrQuit(null, next+1);
      }, 'text/plain');
    }

    var fetchJobStatusTimeout;
    var fetchJobStatus = function (handle, updateIntervalSeconds, nSecondsLeft) {
         fetchJobStatusTimeout=setTimeout(function () {
          if (nSecondsLeft <= 0) {
           $('#discover-basicStatus').text('Discovering network '+Networks[next].dis+ '. Job timeout.');
            sendExpr('jobCancel(\"'+handle+'\"))', function(err, data){
               clearTimeout(fetchJobStatusTimeout);
               getDiscoveryFile();
            });
          }
           sendExpr('jobStatus(\"'+handle+'\")[0].get("jobStatus")', function(err,data){
              if (err){ 
                clearTimeout(fetchJobStatusTimeout);
                discoverError(err);
              }else{
              var jobStatus=parseZinc(data).rows[0].val;
              $('#discover-basicStatus').text('Discovering network '+Networks[next].dis+ '. Job '+jobStatus+'.');
              if(jobStatus=='doneOk'){
               clearTimeout(fetchJobStatusTimeout);
               getDiscoveryFile();
              }
             }
           }, 'text/plain');
           fetchJobStatus(handle, updateIntervalSeconds, nSecondsLeft-updateIntervalSeconds);
     }, updateIntervalSeconds*1000);
    };
  }

  $('#tab-all a[href="#tab-discover"]').on('show.bs.tab', function(e){
    // update available network checkboxes
    $('#discover-networks').html('');
    var html = '';
    for(var i = 0; i <= networksCid; i++){
      if(Networks[i]){
        html += '<label class="checkbox-inline">'+
          '<input type="checkbox" value="'+Networks[i].dis+'" checked>'+
          Networks[i].dis+'</label>';
      }
    }
    $('#discover-networks').html(html);0
  });
  function LoadNetworkFileOrQuit(err, next){
    // Loads the next file or quits if we've at the end
    if(next > networksCid){
      $('#Load-discover-File-btn').removeClass('disabled');
      $('#discover-basicStatus').text('Loaded network from file.');    
      return;
    }
    if(!Networks[next] || !checkedNetworks()[Networks[next].dis]){
      LoadNetworkFileOrQuit(null, next+1);
    }else{
      $('#discover-basicStatus').text('Loading network '+Networks[next].dis+' from file...');
        sendExpr('ioReadZinc(`io/'+Networks[next].dis+'.zinc`)', function(err, data){
          fillDiscoverTable(data,next);
          LoadNetworkFileOrQuit(null, next+1);
        }, 'text/plain');
    }
  }

  function fillDiscoverTable(data, next){
        data = parseZinc(data);
        for(var i in data.rows){
          var n = data.rows[i];
          if(!n.device) continue;
          Devices[n.id] = n;
          n.networkMeta = Networks[next];
          if (isNaN(Networks[next].dNet)||Networks[next].dNet==65535||Networks[next].dNet==n.dNet) {
            if (!n.location&&n.location!='' ){n.location='N/A'};
            DiscoverTable.row.add(['<input type="checkbox" checked="checked">', n.objectName, n.deviceId, n.networkMeta.dis, n.modelName, n.description, n.location, n.id]).draw();
          }
        }
  }
  function discoverError(err){
    $('#discover-basicStatus').text('Discover failed '+err.statusText);
    clearInterval(discoverInterval);
    $('#discover-progress').hide();
    $('#discover-btn').removeClass('disabled');
    $('#Load-discover-File-btn').removeClass('disabled');
  }

  var discoverTimer = 63;
  var discoverInterval;
  $('#discover-btn').click(function(){
    //$('#discover-spinner').show();
    $('#discover-progress .progress-bar').css('width', '0%');
    discoverTimer = 63;
    $('#discover-progress').show();
    clearInterval(discoverInterval);
    discoverInterval = setInterval(function(){
      discoverTimer--;
      if(discoverTimer < 0)
        discoverTimer = 0;
      $('#discover-progress .progress-bar').css('width', (63-discoverTimer)/63*100+'%');
    }, 1000);
    $('#discover-btn').addClass('disabled');
    $('#Load-discover-File-btn').addClass('disabled');
    // scroll through networks and discover on each one
    DiscoverTable.clear().draw();
    Devices = {};
    discoverNetworkOrQuit(null, 0);
  });
    $('#Load-discover-File-btn').click(function(){
      $('#Load-discover-File-btn').addClass('disabled');
      // scroll through networks and load each Discover file
      DiscoverTable.clear().draw();
      Devices = {};
      LoadNetworkFileOrQuit(null, 0);
  });
  $('#discover-table-include-all').change(function(n){
    n.preventDefault();
    $(':checkbox', DiscoverTable.rows().nodes()).prop('checked',this.checked);
  });
  $('#discover-submit').click(function(n){
    $('#tab-all a[href="#tab-profiles"]').tab('show');
    scrollToTop();
  });

  // ---- Profiles

  var CustomProfileTable = $('#customProfile-table').DataTable({
    'paging': false,
    'searching': false,
    'info': false,
    columnDefs: [
      {targets: 6, visible: false, searchable: false},
      {targets: 7, visible: false, searchable: false}
    ],
    order: [[0, 'desc']]
  });

  var topSite;
  var topFloor;
  var siteTag = 'site';
  function createTopology(site, cb){
    // Create KMC / Floor 1 if they don't exist
    // IMPORTANT: need to support a,b,c AND dRef before we can support 3 layers here
    if (tempLicense) {
        siteTag="siteTemp";
        sendExpr('kmcTagAllForProjectLicense(true)', function(err,data){}, 'text/plain');
    }else{sendExpr('kmcTagAllForProjectLicense(false)', function(err,data){}, 'text/plain');
    }
    sendExpr('readAll(\"'+siteTag+'\").find(c => c->dis==\"'+site.site.name+'\")', function(err,data){
      if(!data.rows.length || !data.rows[0].id){
        var data = {dis:site.site.name,geoCountry:'US',geoState:'AL',tz:'New_York'};
        data[siteTag] = '✓';
        createItem(data, function(err,data){
          data = parseZinc(data);
          topSite = data.rows[0];
          createFloor(data.rows[0]);
        }, 'text/plain');
      }else{
        data.rows[0].id = '@'+data.rows[0].id.split(' ')[0].substring(2);
        topSite = data.rows[0];
        if(site.floor)
          createFloor(data.rows[0]);
        else
          cb();
      }
    });

    function createFloor(siteRef){
      sendExpr('readAll(floor).find(c => c->dis==\"'+site.floor.name+'\" and c->'+siteTag+'Ref=='+siteRef.id+')', function(err,data){
        if(!data.rows.length || !data.rows[0].id){
          var data = {floor:'✓',children:'✓',dis:site.floor.name};
          data[siteTag+"Ref"]= siteRef.id;      
          createItem(data, function(err,data){
            data = parseZinc(data);
            topFloor = data.rows[0];
            cb();
          }, 'text/plain');
        }else{ 
          data.rows[0].id = '@'+data.rows[0].id.split(' ')[0].substring(2);
          topFloor = data.rows[0];
          cb();
        }
      });
    }
  }

  var ProfilesTable = $('#profiles-table').DataTable({
    columnDefs: [
      {targets: 7, visible: false, searchable: false}
    ],
    order: [[0, 'desc']]
  });

  $('#tab-all a[href="#tab-profiles"]').on('show.bs.tab', function(e){
    $.ajax({
      type: 'GET',
      url: 'http://profiles.kmccontrols.com/',
      success: function(data){
        $('#profiles-basicStatus').text('Connected to profile knowledge base');
        $('#profiles-fetch-btn').removeClass('disabled');
      }
    }).fail(function(){
      $('#profiles-basicStatus').text('Cannot reach knowledge base');
      $('#profiles-fetch-btn').addClass('disabled');
    });
  });

  var CustomProfileDevice = null;
  var devices = [];
  var Profiles;
  $('#profiles-fetch-btn').click(function(){
    $('#profiles-spinner').show();
    $('#profiles-fetch-btn').addClass('disabled');
    var search = [];
    devices = [];
    ProfilesTable.clear().draw();
    buildDeviceList(devices,search);

    var handler = function(data){
      $('#profiles-spinner').hide();
      $('#profiles-fetch-btn').removeClass('disabled');
      $('#profiles-cloudStatus').text('');
      Profiles = data;
      for(var i in data){
        var profiles = '';
        profiles += '<select class="form-control">';
        for(var j = 0; j < data[i].length; j++){
          if(data[i][j].profileName)
            profiles += '<option value="'+data[i][j].objectId+'">'+data[i][j].profileName+'</option>';
          else
            profiles += '<option value="'+data[i][j].objectId+'">'+data[i][j].modelName+':'+data[i][j].appTypeId+'</option>';
        }
        profiles += '</select>';
        if(data[i].length == 0){
          profiles = '';
        }

        // allow user to create custom profile instead
        profiles += '<div class="btn btn-sm btn-default" style="display:block;max-width:100px;margin-top:6px;" id="btn-customprofile-'+devices[i].id.substring(1)+'">Create Profile</div>';
        
        var n = devices[i];
        ProfilesTable.row.add([n.objectName, n.deviceId, n.networkMeta.dis, n.modelName, n.description, n.location, profiles, n.id]).draw();
        if(true){
          (function(){
            var d = devices[i];
            $('#btn-customprofile-'+devices[i].id.substring(1)).off('click').click(function(){
              // load custom profile modal
              CustomProfileDevice = d;
              CustomProfilePoints = [];
              $('#customProfile-deviceSpinner').hide();
              $('#customProfile-deviceHeading').text('Device');
              if(d.modelName)
                $('#customProfile-deviceHeading').text('Device ('+d.modelName+')');
              CustomProfileTable.clear().draw();
              $('#customProfile-deviceStatus').text('');
              $('#customProfile-loginStatus').text('');
              $('#customProfile-saveStatus').text('');
              $('#customProfileModal').modal('show');
              $('#customProfile-tags').html('');
              $('#customProfile-cards').html('');
            });
          })();
        }
      }
    }

    if(DownloadedProfiles){
      console.log(DownloadedProfiles)
      console.log(search)
      var MatchedProfiles = [];
      for(var i in search){
        var q = search[i];
        var r = [];
        for(var p in DownloadedProfiles){
          var profile = DownloadedProfiles[p];
          var match = true;
          if(profile.modelName != q.modelName){
            match = false;
          }
          if(q.vendorName){
            if(profile.vendorName.indexOf(q.vendorName)!=0){
              match = false;
            }
          }
          if(q.appTypeId){
            if(profile.appTypeId != q.appTypeId){
              match = false;
            }
          }
          if(match)
            r.push(profile);
        }
        MatchedProfiles.push(r);
      }
      handler(MatchedProfiles);
    }else{
      $.ajax({
        type: 'POST',
        url: 'http://profiles.kmccontrols.com/search',
        headers: {          
          Accept: "application/json; charset=utf-8"
        },
        contentType: 'application/json',
        data: JSON.stringify(search),
        success: function(data){
          handler(data);
        }
      }).fail(function(){
        $('#profiles-spinner').hide();
        $('#profiles-fetch-btn').removeClass('disabled');
        $('#profiles-cloudStatus').text('Must be logged into cloud');
      });
    }
  });

  function hideAllModals(){
    var ids = ['#loginModal', '#customProfileModal', '#cloudModal', '#loadProfilesModal', '#loginCloudModal'];
    for(var i in ids){
      $(ids[i]).modal('hide');
    }
  }

  var CustomProfilePoints = [];
  var CustomPointRules = [];

  $('#customProfile-fetchDevice').click(function(){
    /* 
    fetch the device points and populate. first do
    bacnetLearn(@1debf61c-08db1ed2, null), which gets 
    dis,learn
    "ANALOG INPUT",`ANALOG_INPUT` ... then
    bacnetLearn(@1debf61c-08db1ed2, \`ANALOG_INPUT\`) ... which gets
    bacnetCur,dis,is,kind,point,unit
    "AI4","AI_04","ANALOG_INPUT","Number",M,"" ...
    */
    var learnTypes = ['`ANALOG_INPUT`','`ANALOG_OUTPUT`','`ANALOG_VALUE`','`BINARY_INPUT`','`BINARY_OUTPUT`','`BINARY_VALUE`','`MULTI_STATE_VALUE`'];
    CustomProfilePoints = [];
    CustomProfileTable.clear().draw()
    $('#customProfile-deviceSpinner').show();
    $('#customProfile-deviceStatus').text('Connecting...');
    var connector = {
      bacnetConn: '✓',
      dis: 'connector-'+CustomProfileDevice.id.substring(1),
      finDiscoveryEnabled: '✓',
      uri: '`bacnet://'+CustomProfileDevice.host+'/'+CustomProfileDevice.deviceId+'?dnet='+CustomProfileDevice.dNet+'&dadr='+CustomProfileDevice.dAdr+'&hops='+CustomProfileDevice.hopCount+'`'
    };
    createItem(connector, function(err,data){
      var connectorId = parseZinc(data).rows[0].id;
      var connectorMod = parseZinc(data).rows[0].mod;
      $('#customProfile-deviceStatus').text('Fetching point types...');
      sendExpr('bacnetLearn('+connectorId+', null)', function(err,data){
        data = parseZinc(data);
        // load each point type
        $('#customProfile-deviceStatus').text('Fetching points...');
        var t = data.rows.length;
        function pointsLoaded(){
          removeItem({id:connectorId, mod:connectorMod}, function(err,data){

          }, 'text/plain');
          $('#customProfile-deviceStatus').text('');
          $('#customProfile-deviceSpinner').hide();
        }
        $.ajax({
          type: 'GET',
          url: 'http://profiles.kmccontrols.com/customPointRules',
          success: function(dd){
            CustomPointRules = dd;
            for(var i in data.rows){
              if(data.rows[i].learn && learnTypes.indexOf(data.rows[i].learn) >= 0){
                sendExpr('bacnetLearn('+connectorId+', '+data.rows[i].learn+')', function(err, data){
                  data = parseZinc(data);
                  if(data.rows.length && !err){
                    for(var j in data.rows){
                      CustomProfilePoints.push(data.rows[j]);
                      var prs = '<select style="height:40px;font-size:13px;" class="form-control"><option value="None">None</option>';
                      for(var k in CustomPointRules)
                        prs += '<option value="'+CustomPointRules[k].name+'">'+CustomPointRules[k].name+'</option>';
                      prs += '</select>';
                      CustomProfileTable.row.add([data.rows[j].bacnetCur||null, data.rows[j].dis||null, data.rows[j].is||null, data.rows[j].kind||null, data.rows[j].unit||null, null, data.rows[j].bacnetWrite||null, data.rows[j].bacnetWriteLevel?8:null, prs]);
                    }
                    CustomProfileTable.draw();
                  }
                  t--;
                  if(t == 0)
                    pointsLoaded();
                }, 'text/plain');
              }else{
                t--;
                if(t == 0)
                    pointsLoaded();
              }
            }
          }
        }).fail(function(){
        });
      }, 'text/plain');
    }, 'text/plain');
  });

  var CustomTagRules;
  $('#customProfile-addCard').click(function(){
    // fetch all cards and point rules
    if(!CustomProfilePoints || !CustomProfilePoints.length){
      $('#customProfile-cardStatus').text('Must fetch device points before adding cards');
      $('#customProfile-cardStatus').show();
      return;
    }
    $('#customProfile-cardStatus').hide();
    if(!CustomCardRules || !CustomCardRules.length || !CustomPointRules || !CustomPointRules.length){
      $.ajax({
        type: 'GET',
        url: 'http://profiles.kmccontrols.com/customCardRules',
        success: function(data){
          CustomCardRules = data;
          CustomCardRules.sort(SortByName);
          $.ajax({
            type: 'GET',
            url: 'http://profiles.kmccontrols.com/customPointRules',
            success: function(dd){
              CustomPointRules = dd;
              // fetched both. now continue
              addCard();
            }
          }).fail(function(){

          });
        }
      }).fail(function(){

      });
    }else{
      addCard();
    }
  });
  
  function SortByName(a, b){
   var aName = a.name.toLowerCase();
   var bName = b.name.toLowerCase();
   return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
  }
  function SortByLabel(a, b){
   var aName = a.label.toLowerCase();
   var bName = b.label.toLowerCase();
   return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
  }
  function addCard(){
    //console.log(CustomCardRules, CustomPointRules, CustomProfilePoints)
    var template = '<div class="customProfile-card">Add <select class="customProfile-cardName form-control inline-form-control">';
    for(var i in CustomCardRules){
      template += '<option value="'+CustomCardRules[i].objectId+'">'+CustomCardRules[i].name+'</option>';
    }
    template += '</select> card with points:';
    template += '<div class="customProfile-cardPoints"></div>';
    template += 'and custom label: '
    template += '<input type="text" style="width:300px;display:inline;" class="form-control customProfile-customCardLabel"><br/>'
    template += '<div class="customProfile-cardDelete btn btn-default btn-sm">Delete Card</div>';
    template += '</div>';
    $('#customProfile-cards').append(template);
    $('.customProfile-card:last-child').find('.customProfile-cardDelete').click(function(){
      $(this).parents('.customProfile-card').remove();
    });
    $('.customProfile-card:last-child').find('.customProfile-cardName').change(function(){
      getCardPoints($(this).parents('.customProfile-card'));
    });
    getCardPoints($('.customProfile-card:last-child'));
  }
  function getCardPoints(elem){
    var id = $(elem).find('.customProfile-cardName').val();
    var card;
    for(var i = 0; i < CustomCardRules.length; i++){
      if(CustomCardRules[i].objectId == id){
        card = CustomCardRules[i];
        break;
      }
    }
    if(!card) return;
    // take each kindofpoints used by this card
    // look it up in custompointrules (kind) but display the name
    // generate a list of all points to select from
    var template = '';
    for(var i = 0; i < card.kindofpoints.length; i++){
      var point;
      for(var j = 0; j < CustomPointRules.length; j++){
        if(CustomPointRules[j].kind == card.kindofpoints[i]){
          point = CustomPointRules[j];
          break;
        }
      }
      if(!point) continue;
      template += '<div class="customProfile-cardPoint">'+point.name+' <select class="customProfile-cardPointName form-control inline-form-control" data-point="'+point.objectId+'">';
      for(var j = 0; j < CustomProfilePoints.length; j++){
        template += '<option value="'+CustomProfilePoints[j].bacnetCur+'">'+CustomProfilePoints[j].bacnetCur+' ('+CustomProfilePoints[j].dis+')</option>';
      }
      template += '</select></div>';
    }
    $(elem).find('.customProfile-cardPoints').html(template);
    $(elem).find('.customProfile-cardPointName:first').change(function(){
      updateCustomLabel($(this).parents('.customProfile-card'));
    });
    updateCustomLabel(elem);
    function updateCustomLabel(elem){
      var cname = $(elem).find('.customProfile-cardName option:selected').text();
      var pname = $(elem).find('.customProfile-cardPointName:first option:selected').text();
      $(elem).find('.customProfile-customCardLabel').val(cname+' - '+pname);
    }
  }

  $('#customProfile-addTag').click(function(){
    $.ajax({
      type: 'GET',
      url: 'http://profiles.kmccontrols.com/customTagRules',
      success: function(data){
        CustomTagRules = data;
        addTag();
      }
    }).fail(function(){
    });

  });

  function addTag(){
    if(!CustomTagRules || !CustomTagRules.length)
      return;
    // Apply <name> tags to points matching <str> (case sensitive) on the <prop> property of <type>
    var properties = ['bacnetCur','dis','is','kind','unit'];
    var template = '<div class="customProfile-tag">Apply <select class="customProfile-tagName form-control inline-form-control">';
    for(var i in CustomTagRules){
      template += '<option value="'+CustomTagRules[i].name+'">'+CustomTagRules[i].name+'</option>';
    }
    template += '</select>';
    template += ' tags to points matching <input class="customProfile-tagSearchString form-control inline-form-control" value="'+CustomTagRules[0].searchString+'">';
    template += ' (<input type="checkbox" class="customProfile-tagCaseSensitive"'+(CustomTagRules[0].caseSensitive?' checked':'')+'> case sensitive)';
    template += ' on the <select class="customProfile-tagSearchProperty form-control inline-form-control">';
    for(var i in properties){
      template += '<option value="'+properties[i]+'">'+properties[i]+'</option>';
    }
    template += '</select>';
    template += ' property of the <span class="customProfile-tagSearchObject">'+CustomTagRules[0].searchObject+'</span>.';
    template += '<div class="customProfile-tagDelete btn btn-default btn-sm">Delete Search</div>'
    template += '</div>';

    $('#customProfile-tags').append(template);
    var elem = $('#customProfile-tags').children()[$('#customProfile-tags').children().length-1];
    elem = $(elem);
    elem.find('.customProfile-tagSearchProperty').val(CustomTagRules[0].searchProperty);
    elem.find('.customProfile-tagDelete').click(function(){
      $(this).parent().remove();
      changeTag(null);
    });
    elem.find('.customProfile-tagSearchString').keyup(function(){
      changeTag($(this).parent());
    });
    elem.find('.customProfile-tagCaseSensitive').change(function(){
      changeTag($(this).parent());
    });
    elem.find('.customProfile-tagSearchProperty').change(function(){
      changeTag($(this).parent());
    });
    elem.find('.customProfile-tagName').change(function(){
      // find new rule
      var rule;
      for(var i in CustomTagRules){
        if(CustomTagRules[i].name == $(this).val()){
          rule = CustomTagRules[i];
          break;
        }
      }
      if(!rule)
        return $(this).parent().remove();
      $(this).parent().find('.customProfile-tagSearchString').val(rule.searchString);
      $(this).parent().find('.customProfile-tagCaseSensitive').prop('checked', !!rule.caseSensitive);
      $(this).parent().find('.customProfile-tagSearchProperty').val(rule.searchProperty);
      $(this).parent().find('.customProfile-tagSearchObject').val(rule.searchObject);
      changeTag($(this).parent());
    });
    changeTag(elem);
  }

  function changeTag(elem){
    // recalculate tags on the device points
    if(!CustomProfileDevice)
      return;
    CustomProfileTable.clear();
    for(var i in CustomProfilePoints){
      var row = [CustomProfilePoints[i].bacnetCur||null, CustomProfilePoints[i].dis||null, CustomProfilePoints[i].is||null, CustomProfilePoints[i].kind||null, CustomProfilePoints[i].unit||null];
      var tags = '';
      for(var j=0; j < $('#customProfile-tags').children().length; j++){
        var e = $('#customProfile-tags').children()[j];
        e = $(e);
        // apply any rules
        var searchObject = e.find('.customProfile-tagSearchObject').text();
        var searchProperty = e.find('.customProfile-tagSearchProperty').val();
        var searchString = e.find('.customProfile-tagSearchString').val();
        var caseSensitive = e.find('.customProfile-tagCaseSensitive')[0].checked;
        var name = e.find('.customProfile-tagName').val();
        var rule;
        for(var k in CustomTagRules){
          if(CustomTagRules[k].name == name){
            rule = CustomTagRules[k];
            break;
          }
        }
        if(!rule) return;
        if(searchObject != 'point') continue;
        var searchRegex = searchString;
        searchRegex = searchRegex.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&")
        searchRegex = searchRegex.replace('.','\.');
        searchRegex = searchRegex.replace('?','.?');
        searchRegex = searchRegex.replace('*','.*');
        if(caseSensitive)
          searchRegex = new RegExp(searchRegex);
        else
          searchRegex = new RegExp(searchRegex, 'i');
        if(CustomProfilePoints[i][searchProperty] && CustomProfilePoints[i][searchProperty].match(searchRegex)){
          // matched
          tags += '<span class="customProfile-tagMarker label label-primary">'+name+'</span>';
        }
      }
      row.push(tags);
      if(CustomProfilePoints[i].bacnetWrite)
        row.push(CustomProfilePoints[i].bacnetWrite);
      else
        row.push(null);
      if(CustomProfilePoints[i].bacnetWriteLevel)
        row.push(8);
      else
        row.push(null);
      var prs = '<select style="height:20px;font-size:13px;" class="form-control"><option value="None">None</option>';
      for(var k in CustomPointRules)
        prs += '<option value="'+CustomPointRules[k].name+'">'+CustomPointRules[k].name+'</option>';
      prs += '</select>';
      row.push(prs);
      CustomProfileTable.row.add(row);
    }
    CustomProfileTable.draw();
  }

  $('#customProfile-login').click(function(){
    $.ajax({
      type: 'POST',
      url: 'http://profiles.kmccontrols.com/login',
      data: {
        email: $('#customProfile-username').val(),
        password: $('#customProfile-password').val()
      },
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        return $('#customProfile-loginStatus').text('Successfully logged in');
      }
    }).fail(function(){
      return $('#customProfile-loginStatus').text('Login failed');
    });
  });

  var ProjectServerProfile;
  $.ajax({
    type: 'GET',
    url: 'http://profiles.kmccontrols.com/isLoggedIn',
    xhrFields: {
      withCredentials: true
    },
    success: function(data){
      $.ajax({
        type: 'GET',
        url: 'http://projects.kmccontrols.com/isLoggedIn',
        xhrFields: {
          withCredentials: true
        },
        success: function(data){
          ProjectServerProfile = data;
          updateCapCount();
          $('#navbar-subtitle-si').text(ProjectServerProfile.company.name);
          return $('#cloud-loggedIn-status').text('Successfully logged in');
        }
      }).fail(function(){
        return $('#cloud-loggedIn-status').text('Not logged in');
      });
    }
  }).fail(function(){
    return $('#cloud-loggedIn-status').text('Not logged in');
  });

  $('#cloudLogin-login').click(function(){
    $('#cloudLoginModal').modal('show');
  });
  $('#cloudLoginModal-login').click(function(){
    $.ajax({
      type: 'POST',
      url: 'http://projects.kmccontrols.com/loginAJAX',
      data: {
        email: $('#cloudLoginModal [name="username"]').val(),
        password: $('#cloudLoginModal [name="password"]').val()
      },
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        ProjectServerProfile = data;
        $.ajax({
          type: 'POST',
          url: 'http://profiles.kmccontrols.com/login',
          data: {
            email: $('#cloudLoginModal [name="username"]').val(),
            password: $('#cloudLoginModal [name="password"]').val()
          },
          xhrFields: {
            withCredentials: true
          },
          success: function(data){
            $('#cloudLoginModal [id="basicStatus"]').text('Successfully logged in');
            $('#cloud-loggedIn-status').text('Successfully logged in');
            $('#navbar-subtitle-si').text(ProjectServerProfile.company.name);
            setTimeout(function(){
              $('#cloudLoginModal').modal('hide');
            }, 1000);
          }
        }).fail(function(){
          return $('#cloudLoginModal [id="basicStatus"]').text('Login failed');
        });
      }
    }).fail(function(){
      return $('#cloudLoginModal [id="basicStatus"]').text('Login failed');
    });
  });

  $('#customProfile-save').click(function(){
    //if(!CustomProfileDevice) return;
    if(!CustomProfilePoints || !CustomProfilePoints.length){
      //return $('#customProfile-saveStatus').text('You must load the device');
    }
    if(!$('#customProfile-tags').children().length){
      //return $('#customProfile-saveStatus').text('You must apply tags');
    }
    if(!$('#customProfile-name').val()){
      return $('#customProfile-saveStatus').text('You must give the profile a name');
    }
    var profile = {};
    profile.appTypeId = CustomProfileDevice.appTypeId||null;
    profile.modelName = CustomProfileDevice.modelName;
    profile.type = $('#customProfile-deviceType').val();
    profile.vendorId = CustomProfileDevice.vendorId||null;
    profile.vendorName = CustomProfileDevice.vendorName||null;
    profile.profileName = $('#customProfile-name').val();
    var points = [];
    CustomProfileTable.rows().every(function(){
      var d = this.data();
      var point = {
        bacnetCur: d[0]||'',
        is: d[2]||'',
        kind: d[3]||'',
        navName: d[1]||'',
        point: '✓',
        pointOfInterest: '✓',
        unit: d[4]||''
      };
      var precision = 0;
      if(point.unit == '°C')
        precision = 1;
      if(point.unit == 'inH₂O')
        precision = 2;
      point.precision = precision;
      if(d[5]){
        d[5] = d[5].split(/<|>/g);
        // iterate through all active tags and apply them
        for(var i in d[5]){
          var rule;
          for(var j in CustomTagRules){
            if(CustomTagRules[j].name == d[5][i]){
              rule = CustomTagRules[j];
              break;
            }
          }
          if(rule){
            for(var j in rule.tags){
              point[rule.tags[j].name] = '✓';
            }
          }
        }
      }
      if(d[6])
        point.bacnetWrite = d[6];
      if(d[7])
        point.bacnetWriteLevel = parseInt(d[7]);
      points.push(point);
    });
    profile.points = points;
    var mobileCards = [];
    var index = -1;
    $('#customProfile-cards .customProfile-card').each(function(){
      index++;
      var card;
      var id = $(this).find('.customProfile-cardName').val();
      var customLabel = $(this).find('.customProfile-customCardLabel').val();
      for(var i = 0; i < CustomCardRules.length; i++){
        if(CustomCardRules[i].objectId == id){
          card = CustomCardRules[i];
          break;
        }
      }
      if(!card) return;
      // create the card profile
      var cardO = {
        label: card.name,
        customLabel: customLabel
      }
      cardO[card.tag] = index;
      mobileCards.push(cardO);
      // create the points
      $(this).find('.customProfile-cardPointName').each(function(){
        var pointRuleId = $(this).attr('data-point');
        var pointRule;
        for(var i = 0; i < CustomPointRules.length; i++){
          if(CustomPointRules[i].objectId == pointRuleId){
            pointRule = CustomPointRules[i];
            break;
          }
        }
        if(!pointRule) return;
        var pointName = $(this).val();
        var point;
        for(var i = 0; i < profile.points.length; i++){
          if(profile.points[i].bacnetCur == pointName){
            point = profile.points[i];
            break;
          }
        }
        if(!point) return;
        point[pointRule.kind] = "✓";
        point[card.tag] = index;
        for(var i = 0; i < pointRule.tags.length; i++)
          point[pointRule.tags[i]] = "✓";
      });
    });
    console.log(profile)
    profile.mobileCards = mobileCards;
    $.ajax({
      type: 'POST',
      url: 'http://profiles.kmccontrols.com/uploadProfile',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({
        profile: profile
      }),
      success: function(data){
        $('#customProfile-saveStatus').text('Successfully saved profile');
        $('#customProfileModal').modal('hide');
        $('#profiles-fetch-btn').trigger('click');
      }
    }).fail(function(){
      return $('#customProfile-saveStatus').text('You must login first');
    });
  });

  $('#profiles-submit').click(function(n){
    $('#tab-all a[href="#tab-cards"]').tab('show');
    scrollToTop();
  });

  // -------- Cards

  $('#cards-submit').click(function(n){
    $('#tab-all a[href="#tab-topologies"]').tab('show');
    scrollToTop();
  });

  var CustomCardRules;

  $('#cards-load').click(function(){
    // load card rules from server and list them against each current device
    createDevices();
    $('#cards-panels').html('');
    console.log(cDeviceProfiles);
    $.ajax({
      type: 'GET',
      url: 'http://profiles.kmccontrols.com/customCardRules',
      success: function(data){
        CustomCardRules = data;

        for(var i in cDevices){
          var d = cDevices[i];
          // add the panel for this device
          var cp = $('#cards-panels');
          var c = '<div class="card-panel form-inline" id="cp-'+i+'">';
          c += '<span class="card-panel-name">'+d.navTreeObject.dis+'</span>';
          c += '<select class="form-control">';
          /*for(var k in CustomCardRules){ // go through each card and check if default
            for(var ll in cDeviceProfiles[i]){
              if(ll == CustomCardRules[k].tag)
                c += '<option value="'+CustomCardRules[k].name+'">'+CustomCardRules[k].name+'</option>';
            }
          }*/
          if(cDeviceProfiles[i].mobileCards){
            for(var k in cDeviceProfiles[i].mobileCards){
              var crd = cDeviceProfiles[i].mobileCards[k];
              var id;
              for(var j in crd){
                if(j != 'label' && j != 'customLabel'){
                  id = crd[j]; break;
                }
              }
              c += '<option value="'+id+'">'+(crd.customLabel||crd.label)+'</option>';
            }
          }
          c += '</select>';
          c += '<div class="btn btn-default" id="cardsAddBtn-'+d.deviceObject.objectId+'">Add Card</div>';
          c += '</div>';
          c += '<div class="cardsHolder" id="cardsHolder-'+d.deviceObject.objectId+'"></div>';
          cp.append(c);
          (function(){
            var dd = d;
            cp.find('#cardsAddBtn-'+d.deviceObject.objectId).click(function(){
              var id = $(this).attr('id');
              id = id.substring(id.indexOf('-')+1);
              var val = $(this).parent().find('select option:selected').text();
              var cid = $(this).parent().find('select').val();
              var e = '<div style="margin-bottom:8px;" class="cardsHolderCard" data-cid="'+cid+'" data-label="'+val+'"><b>Card:</b> '+val+' <br/><b>Location:</b> <input type="text" class="form-control" style="display:inline;max-width:200px;" value="'+(dd.navTreeObject.dis||'')+'"><br/><div class="btn btn-sm btn-default">Delete</div></div>';
              $(cp).find('#cardsHolder-'+id).append(e);
              $(cp).find('#cardsHolder-'+id+' .cardsHolderCard:last-child .btn').click(function(){
                $(this).parent().remove();
              });
            });
          })();
        }
      }
    }).fail(function(){
    });
  });

  // -------- Parent/Child Topologies
  // “Bldg 315.First Floor.AHU 2”

  var cDevices = [];
  var cDeviceProfiles = [];
  function createDevices(){
    cDevices = [];
    for(var i = 0; i < devices.length; i++){
      var p = $(ProfilesTable.row(i).nodes());
      var profileId = p.find('select').val();
      for(var j = 0; j < Profiles[i].length; j++){
        if(Profiles[i][j].objectId == profileId){
          devices[i].profile = Profiles[i][j];
          break;
        }
      }
      if(!devices[i].profile)
        continue;
      var cd = {};
      var uriDetails;
    var colonSeparator=':';
      if (devices[i].scheme=="bacnet") {
          uriDetails='?dnet='+devices[i].dNet+'&dadr='+devices[i].dAdr+'&hops='+devices[i].hopCount;
          devices[i].port='';
      colonSeparator='';
          }
      if (devices[i].scheme=="bacnetmstp") {uriDetails='?baud='+devices[i].baud}
      cd.points = devices[i].profile.points;
      for(var j = 0; j < cd.points.length; j++){
        var isCard = false;
        for(var k in cd.points[j]){
          if(k.indexOf('Card')>=0){
            isCard = true;
            break;
          }
        }
        // if it's a card, add his
        cd.points[j]['configPoint']="✓";
      }
      cd.profileId = devices[i].profile.objectId;
      //console.log(devices[i])
      cd.deviceObject = {
        modelName: devices[i].modelName,
        objectId: devices[i].objectId,
        vendorId: devices[i].profile.vendorId,
        vendorName: devices[i].profile.vendorName
      };
      if(!cd.deviceObject.vendorId)
        cd.deviceObject.vendorId = devices[i].vendorId;
      if(!cd.deviceObject.vendorName)
        cd.deviceObject.vendorName = devices[i].vendorName;
      cd.connector = {
        dis: 'BAC-'+devices[i].deviceId,
        bacnetDevice: 'BAC-'+devices[i].deviceId,
        path: '/'+devices[i].host,
        uri: devices[i].scheme+'://'+devices[i].host+colonSeparator+devices[i].port+'/'+devices[i].deviceId+uriDetails
      };
      cd.navTreeObject = {
        dis: devices[i].objectName
      };
    // dpb 2016-05-10: truncate dis
    cd.navTreeObject.dis = cd.navTreeObject.dis.substring(0,16);
      cDevices.push(cd);
      devices[i].profile.mobileCards.sort(SortByLabel);
      cDeviceProfiles.push(devices[i].profile);
    }
    console.log(cDevices);
  }

  function cleanRecurse(node){
    delete node['li_attr'];
    delete node['a_attr'];
    delete node['state'];
    delete node['data'];
    delete node['icon'];
    if(!node.children) return;
    for(var i = 0; i < node.children.length; i++)
      cleanRecurse(node.children[i]);
  }
  var topologyCounter = 0;
  var takenChildren = {};
  function createTopologyPanel(topology, fixed){
    // creates a parent/child relationship panel given a topology description
    // {
    //   "dis": "AHU",
    //   "parent": "ahu",
    //   "child": "vav",
    //   "parentRef": "ahuref",
    //   "newChildTag": ""
    // }
    topologyCounter++;
    topology.data = [];
    for(var i in devices){
      if(!fixed && devices[i].profile && devices[i].profile.type && devices[i].profile.type == topology.parent){
        var children = findChildren(devices[i].objectName, topology);
        for(var k in children){
          takenChildren[children[k].id] = true;
        }
        topology.data.push({
          text: devices[i].objectName+' ('+topology.parent+')',
          type: 'parent',
          children: children,
          id: devices[i].objectName
        });
      }else if(fixed && devices[i].profile && devices[i].profile.type && devices[i].profile.type == topology.child && !takenChildren[devices[i].objectName])
        topology.data.push({
          text: devices[i].objectName+' ('+topology.child+')',
          type: 'child',
          children: [],
          id: devices[i].objectName
        });
    }
    function findChildren(parentName, topology){
      var children = [];
      for(var j in devices){
        if(!devices[j].description || devices[j].description.split('.').length < 3)
          continue;
        var name = devices[j].description.split('.')[2];
        if(name == parentName){
          var child = {
            text: devices[j].objectName+' ('+topology.child+')',
            type: 'child',
            children: [],
            id: devices[j].objectName
          };
          children.push(child);
        }
      }
      return children;
    }
    var html = '<div class="panel panel-default'+(fixed?' fixed-panel':'')+'">';
    html += '<div class="panel-heading">'+topology.dis+'</div>';
    html += '<div class="panel-body">';
    html += '<div id="parentchild-'+topologyCounter+'"></div>';
    html += '</div></div></div>';
    if(!fixed)
      $('#topologies-panels').append(html);
    else
      $('#topologies-panels-fixed').append(html);
    $('#parentchild-'+topologyCounter).jstree({
      "core" : {
        "animation" : 0,
        "check_callback" : true,
        "themes" : {},
        'data' : topology.data
      },
      "types" : {
        "#": {
          "max_depth": 3,
          "valid_children": ['parent','child']
        },
        "parent" : {
          "icon": "glyphicon glyphicon-folder-close",
          "valid_children" : fixed?[]:(topology.parent==topology.child?['parent']:['child'])
        },
        "child" : {
          "icon": "glyphicon glyphicon-hdd",
          "valid_children" : []
        }
      },
      "plugins" : [
        "contextmenu", "dnd", "search",
        "state", "types", "wholerow"
      ]
    });
    
    $('#parentchild-'+topologyCounter).on('move_node.jstree', function (e, data) {
      //updateData();
    });
    $('#parentchild-'+topologyCounter).on('create_node.jstree', function (e, data) {
      //updateData();
    });
    $('#parentchild-'+topologyCounter).on('delete_node.jstree', function (e, data) {
      //updateData();
    });
  }
  $('#topologies-gendevices').click(function(){
    $('#topologies-panels').html('');
    $('#topologies-panels-fixed').html('');
    takenChildren = {};
    for(var i in topologies)
      createTopologyPanel(topologies[i]);
    var vavtop = {
       "dis": "VAVs",
       "child": "vav",
       "parentRef": "",
       "newChildTag": ""
    };
    createTopologyPanel(vavtop, true);
  });
  $('#topologies-submit').click(function(n){
    $('#tab-all a[href="#tab-topologies2"]').tab('show');
    scrollToTop();
  });


  function createTopologyPanel2(site){
    // takenChildren = {};
    // for(var i in topologies)
    //   createTopologyPanel(topologies[i]);
    // var vavtop = {
    //    "dis": "VAVs",
    //    "child": "vav",
    //    "parentRef": "",
    //    "newChildTag": ""
    // };
    // createTopologyPanel(vavtop, true);
    if(!site || !site.topology || !site.topology.length) return;
    var root = site.topology[0];
    for(var i in devices){
      if(devices[i].profile && devices[i].profile.type){
        root.children.push({
          text: devices[i].objectName,
          type: 'box',
          children: [],
          id: devices[i].objectName
        });
      }
    }
    $('#projectTopology').jstree('destroy');
    $('#projectTopology').jstree({
      "core" : {
        "animation" : 0,
        "check_callback" : true,
        "themes" : {},
        'data' : site.topology
      },
      "types" : {
        "#": {
          "max_depth": 4,
          //"valid_children": [structure[0]]
          "valid_children": ['site', 'building', 'floor', 'box']
        },
        "site" : {
          "icon" : "glyphicon glyphicon-globe",
          //"valid_children" : immediates['site']
          "valid_children": ['building', 'floor', 'box', 'zone']
        },
        "zone": {
          "icon": "glyphicon glyphicon-unchecked",
          "valid_children": ['floor', 'building', 'box']
        },
        "building" : {
          "icon" : "glyphicon glyphicon-home",
          //"valid_children" : immediates['building']
          "valid_children": ['floor', 'box', 'zone']
        },
        "floor" : {
          "icon" : "glyphicon glyphicon-align-justify",
          //"valid_children" : immediates['floor']
          "valid_children": ['box', 'zone']
        },
        "box" : {
          "icon" : "glyphicon glyphicon-hdd",
          "valid_children" : []
        }
      },
      "plugins" : [
        "contextmenu", "dnd", "search",
        "state", "types", "wholerow"
      ]
    });
    $('#projectTopology').jstree(true).deselect_all();
    $('#projectTopology').on('changed.jstree', function (e, data) {
      Project.topology = $('#projectTopology').jstree(true).get_json('#', {'no_state':true});
      $('#tab-topologies2 #addSite').hide();
      $('#tab-topologies2 #addBuilding').hide();
      $('#tab-topologies2 #addZone').hide();
      $('#tab-topologies2 #addFloor').hide();
      $('#tab-topologies2 #addBox').hide();
      $('#tab-topologies2 #rename').hide();
      $('#tab-topologies2 #delete').hide();
      $('#tab-topologies2 #addZone').hide();
      if(!data.selected.length){
        
      }else{
        var node = data.instance.get_node(data.selected[0]);
        $('#tab-topologies2 #rename').show();
        $('#tab-topologies2 #delete').show();
        $('#tab-topologies2 #addBox').show();
        if(node.type == 'box') return;
        if(node.type == 'site'){
          $('#tab-topologies2 #addBuilding').show();
          $('#tab-topologies2 #addFloor').show();
          $('#tab-topologies2 #addBox').show();
          $('#tab-topologies2 #addZone').show();
        }
        if(node.type == 'building'){
          $('#tab-topologies2 #addFloor').show();
          $('#tab-topologies2 #addBox').show();
          $('#tab-topologies2 #addZone').show();
        }
        if(node.type == 'zone'){
          $('#tab-topologies2 #addFloor').show();
          $('#tab-topologies2 #addBox').show();
          $('#tab-topologies2 #addBuilding').show();
        }
        if(node.type == 'floor'){
          $('#tab-topologies2 #addBox').show();
          $('#tab-topologies2 #addZone').show();
        }
      }
    });
  }
  $('#tab-topologies2 #addSite').click(function(){
    createNode('site');
  });
  $('#tab-topologies2 #addFloor').click(function(){
    createNode('floor');
  });
  $('#tab-topologies2 #addZone').click(function(){
    createNode('zone');
  });
  $('#tab-topologies2 #addBuilding').click(function(){
    createNode('building');
  });
  $('#tab-topologies2 #addBox').click(function(){
    createNode('box');
  });
  $('#tab-topologies2 #rename').click(function(){
    var ref = $('#projectTopology').jstree(true),
      sel = ref.get_selected();
    if(!sel.length) return false;
    sel = sel[0];
    ref.edit(sel);
  });
  $('#tab-topologies2 #delete').click(function(){
    var ref = $('#projectTopology').jstree(true),
      sel = ref.get_selected();
    if(!sel.length) return false;
    sel = sel[0];
    ref.delete_node(sel);
  });

  function createNode(type){
    var ref = $('#projectTopology').jstree(true),
      sel = ref.get_selected();
    if(!sel.length) return false;
    sel = sel[0];
    sel = ref.create_node(sel, {"type":type});
    if(sel){
      ref.edit(sel);
    }
  }
  var Project;
  $('#topologies2-gendevices').click(function(){
    //$('#projectTopology').html('');
    $('#topologies2-panels-fixed').html('');
    $.ajax({
      type: 'GET',
      url: 'http://projects.kmccontrols.com/projects/'+currentSite.project+'/json',
      headers: {          
        Accept: "application/json; charset=utf-8"
      },
      contentType: 'application/json',
      success: function(data){
        Project = data;
        createTopologyPanel2(data);
      }
    });
  });
  $('#topologies2-submit').click(function(n){
    $('#tab-all a[href="#tab-users"]').tab('show');
    scrollToTop();
  });

  // -------- Site

  $('#sites-submit').click(function(n){
    $('#tab-all a[href="#tab-device"]').tab('show');
    scrollToTop();
  });

  function boxesFromTopology(topology){
    var boxes = [];
    function recurse(node, anc){
      if(node.type == 'box'){
        node.ancestry = anc;
        boxes.push(node);
      }
      else if(node.children){
        for(var i in node.children){
          var a = [];
          for(var j in anc)
            a.push(anc[j]);
          a.push(node);
          recurse(node.children[i], a)
        }
      }
    }
    for(var j in topology)
      recurse(topology[j], []);
    return boxes;
  }
  function topologyFromBox(boxName, topology){
    var res;
    function recurse(node, site, building, floor){
      if(node.type == 'site')
        if(node.children)
          for(var i in node.children)
            recurse(node.children[i], node, building, floor);
      if(node.type == 'building')
        if(node.children)
          for(var i in node.children)
            recurse(node.children[i], site, node, floor);
      if(node.type == 'floor')
        if(node.children)
          for(var i in node.children)
            recurse(node.children[i], site, building, node);
      if(node.type == 'box')
        if(node.text == boxName)
          res = [site, building, floor, node].map(function(n){
            if(n)
              return {
                name: n.text,
                data: n.data
              }
            return null;
          });
    }
    for(var j in topology)
      recurse(topology[j], null, null, null);
    if(res[0])
      currentSite.site = res[0];
    if(res[1])
      currentSite.building = res[1];
    if(res[2])
      currentSite.floor = res[2];
    if(res[3])
      currentSite.box = res[3];
  }
  var currentSite = {};
  var currentTopology;
  $('#sites-site').change(function(){
    $('#sites-building').val('');
    $('#sites-floor').val('');
    topologyFromBox($(this).val(), currentTopology);
    console.log(currentSite);
  });
  $('#sites-building').change(function(){
    currentSite.building = {
      name: $('#sites-building').val()?$('#sites-building').val():null
    }
    console.log(currentSite);
  });
  $('#sites-floor').change(function(){
    currentSite.floor = {
      name: $('#sites-floor').val()?$('#sites-floor').val():null
    }
    console.log(currentSite);
  });
  function changeProject(project){
    $('#sites-form').show();
    $('#sites-building-group').hide();
    $('#sites-floor-group').hide();
    if(project.structure && project.structure.indexOf('buildings') >= 0)
      $('#sites-building-group').show();
    if(project.structure && project.structure.indexOf('floors') >= 0)
      $('#sites-floor-group').show();
    $('#sites-site').html('');
    var boxes = boxesFromTopology(project.topology);
    for(var i in boxes){
      var anc = '';
      if(boxes[i].ancestry && boxes[i].ancestry.length){
        for(var j in boxes[i].ancestry){
          if(!boxes[i].ancestry[j].text) continue;
          if(anc.length)
            anc += ', ';
          anc += boxes[i].ancestry[j].text;
        }
        anc = ' ('+anc+')';
      }
      $('#sites-site').append('<option value="'+boxes[i].text+'">'+boxes[i].text+(anc?anc:''));
    }
    currentTopology = project.topology;
    topologyFromBox($('#sites-site').val(), currentTopology);
  }
  var Sites = [];
  $('#sites-project').change(function(){
    var id = $('#sites-project').val();
    var site;
    for(var i in Sites){
      if(Sites[i].objectId == id)
        site = Sites[i];
    }
    if(site)
      changeProject(site);
  });
  $('#sites-fetch-btn').click(function(n){
    $('#fetch-sites-spinner').show();
    //$('#sites-fetch-btn').addClass('disabled');
    var sites = getSites(function(data){
      $('#fetch-sites-spinner').hide();
      $('#sites-fetch-btn').removeClass('disabled');
      Sites = data;
      var ht = '';
      for(var k in data){
        ht += '<option value="'+data[k].objectId+'">'+data[k].name+'</option>';
      }
      $('#sites-project').html(ht);

      if(data && data[0])
        changeProject(data[0]);
    });
  });
  //$('#cloud-host-input').val('http://10.200.2.22:80');
  $('#cloud-host-input').val('https://commander.kmccontrols.com');

  var profilesMeta;
  sendExpr('read(kmcInstallProfiles)', function(err, data){
    if(err) return;
    if(data.substring(0,3)=='<ht'||data.substring(0,3)=='<!D'){
      return $('#loginModal').modal('show');
    }
    data = parseZinc(data);
    if(!data.rows.length || !data.rows[0].kmcInstallProfiles) return;
    profilesMeta = JSON.parse(data.rows[0].object.replace(/\\\"/g, '"'));
    if(profilesMeta.date){
      var d = new Date(profilesMeta.date);
      // read the profiles
      sendExpr('ioReadStr(`io/profiles.json`)', function(err, data){
        if(err) return;
        data = parseZinc(data);
        if(!data.rows.length) return;
        data = JSON.parse(decodeURIComponent(data.rows[0].val));

        DownloadedProfiles = data;
        $('#sites-profileMeta').text('Profiles last downloaded '+d.toDateString()+' '+d.toTimeString());
      }, 'text/plain');
    }
  }, 'text/plain');

  function createProfiles(profileMeta, profiles, cb){
    var str = JSON.stringify(profiles);
    str = encodeURIComponent(str);
    sendExpr('ioWriteStr("'+str+'",`io/profiles.json`)', function(err,data){
      if(err){
        if(cb)
          cb(err);
        return;
      }
      sendExpr('readAll(kmcInstallProfiles)', function(err, data){
        if(err){
          if(cb)
            cb(err);
          return;
        }
        data = parseZinc(data);
        for(var i in data.rows){
          if(!data.rows[i].id) continue;
          removeItem({id:data.rows[i].id, mod:data.rows[i].mod}, function(err, data){
          }, 'text/plain');
        }
        var item = {
          kmcInstallProfiles:'✓'
        };
        item.object = profileMeta;
        createItem(item, function(err,data){
          DownloadedProfiles = profiles;
          if(cb) cb(null, parseZinc(data));
        }, 'text/plain');
      }, 'text/plain');
    });
  }
  $('#projects-downloadProfiles').click(function(){
    $('#projects-spinner').show();
    $('#projects-downloadProfiles').addClass('disabled');
    $('#sites-profileMeta').text('Downloading profiles...');
    $.ajax({
      type: 'POST',
      url: 'http://profiles.kmccontrols.com/allProfiles',
      headers: {          
        Accept: "application/json; charset=utf-8"
      },
      contentType: 'application/json',
      data: null,
      success: function(data){
        console.log(data)
        $('#sites-profileMeta').text('Writing to file...');
        createProfiles({date: new Date()}, data, function(err, data){
          $('#projects-spinner').hide();
          $('#projects-downloadProfiles').removeClass('disabled');
          if(err){
            $('#sites-profileMeta').text('Profiles could not be saved');  
            return;
          }
          $('#sites-profileMeta').text('Profiles saved');
        });
      }
    }).fail(function(){
      $('#projects-spinner').hide();
      $('#projects-downloadProfiles').removeClass('disabled');
      $('#sites-profileMeta').text('Could not download profiles');
    });
  });

  sendExpr('read(kmcInstallProject)', function(err, data){
    if(err&&err.status==404) {
         $('#modal-alert-text').text('Project not found');
         $('#modal-alert').modal('show');
      }
    if(err) return;
    if(data.substring(0,3)=='<ht'||data.substring(0,3)=='<!D'){
      return $('#loginModal').modal('show');
    }
    data = parseZinc(data);
    if(!data.rows.length || !data.rows[0].kmcInstallProject) return;
    currentSite = JSON.parse(data.rows[0].object.replace(/\\\"/g, '"'));
    $('#navbar-subtitle-project').text(currentSite.projectName);
    CloudProjectName = currentSite.projectName||'';
    CloudProjectName = CloudProjectName.toLowerCase();
    CloudProjectName = CloudProjectName.replace(' ', '');
    CloudProjectName = CloudProjectName.replace('-', '');
    fetchNetworks();
    $.ajax({
      type: 'GET',
      url: '/api/kmcCommanderBxProject',
      headers: {          
        Accept: 'text/plain',         
        "Content-Type": "text/plain; charset=utf-8"
      }
    }).done(function(data, statusText, xhr){
      if(data.substring(0,3) != 'ver'){
        // we're not logged in
        $('#loginModal').modal('show');
      }else{
        //$('#cloudModal').modal('show');
      }
    }).error(function(){
      $('#cloud-host-basicStatus').text('Note: Your project may need to be created');
      $('#loginModal').modal('show');
    });
    $('#loginModal').on('hidden.bs.modal', function(){
      if (serviceStatus=='') {location.reload();}
    });
    $('#cloudModal').on('hidden.bs.modal', function(){
      //if(!Connected)
      //  location.reload();
    });
    //$('#sites-fetch-btn').addClass('disabled');
    //$('#sites-save').addClass('disabled');
    var str = '';
    if(currentSite.site)
      str += currentSite.site.name;
    if(currentSite.building){
      if(str.length)
        str += ', ';
      str += currentSite.building.name;
    }
    if(currentSite.floor){
      if(str.length)
        str += ', ';
      str += currentSite.floor.name;
    }
    if(str.length)
      str += ', ';
    str += currentSite.box.name;
    str = 'Current BX Appliance: '+str;
    $('#sites-current').text(str);
  }, 'text/plain');

  function createProject(project, cb){
    var item = {
      kmcInstallProject:'✓'
    };
    item.object = project;
    createItem(item, function(err,data){
      if(cb) cb(parseZinc(data));
    }, 'text/plain');
  }

  $('#sites-save').click(function(){
    // save currentSite to J2
    // delete current 
    sendExpr('readAll(kmcInstallProject)', function(err, data){
      if(err)
        return $('#sites-basicStatus').text('Unsuccessful registration');
      data = parseZinc(data);
      for(var i in data.rows){
        if(!data.rows[i].id) continue;
        removeItem({id:data.rows[i].id, mod:data.rows[i].mod}, function(err, data){
        }, 'text/plain');
      }
      currentSite.project = $('#sites-project').val();
      currentSite.projectName = $('#sites-project option:selected').text();
      CloudProjectName = currentSite.projectName||'';
      CloudProjectName = CloudProjectName.toLowerCase();
      CloudProjectName = CloudProjectName.replace(' ', '');
      CloudProjectName = CloudProjectName.replace('-', '');
      fetchNetworks();
      $.ajax({
        type: 'GET',
        url: '/api/kmcCommanderBxProject',
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8"
        }
      }).done(function(data, statusText, xhr){
        if(data.substring(0,3) != 'ver'){
          // we're not logged in
          $('#loginModal').modal('show');
        }else{
          //$('#cloudModal').modal('show');
        }
      }).error(function(){
        $('#cloud-host-basicStatus').text('Note: Your project may need to be created');
        $('#loginModal').modal('show');
      });
      createProject(currentSite, function(data){
        // get the hostId and serviceTag
        sendExpr('kmcGetSysInfo("hostId")', function(err,data){
          if(err)
            return $('#sites-basicStatus').text('Could not fetch Appliance Host ID');
          var data = parseZinc(data);
          if(!data.rows.length)
            return $('#sites-basicStatus').text('Could not fetch Appliance Host ID');
          var hostId = data.rows[0].val;
          var serviceTag;
          $.ajax({
            type: 'GET',
            url: '/pub/kmccm/servicetag',
            headers: {          
              Accept: "*/*"
            },
          }).fail(function(jqXHR, textStatus, error){
            return $('#sites-basicStatus').text('Could not fetch Appliance Service Tag');
          }).done(function(data, statusText, xhr){
            if(!data || !data.trim())
              return $('#sites-basicStatus').text('Could not fetch Appliance Service Tag');
            serviceTag = data.trim();
            // now register the box with system cloud
            $.ajax({
              type: 'POST',
              url: 'http://projects.kmccontrols.com/projects/'+$('#sites-project').val()+'/registerBox',
              headers: {          
                Accept: "application/json; charset=utf-8"
              },
              data: JSON.stringify({
                project: currentSite,
                serviceTag: serviceTag,
                hostId: hostId
              }),
              contentType: 'application/json',
              dataType: 'json'
            }).fail(function(jqXHR, textStatus, error){
              $('#sites-basicStatus').text(jqXHR.responseJSON.errorMessage);
            }).done(function(data, statusText, xhr){
              $('#sites-basicStatus').text('Selection saved');
              $('#navbar-subtitle-project').text(currentSite.projectName);
            });
          });
        }, 'text/plain');
      });
    }, 'text/plain');
  });

  $('#build-next').click(function(n){
    $('#tab-all a[href="#tab-finalize"]').tab('show');
    scrollToTop();
  });

  $('#build-cloud').click(function(){
    $('#finalize-basicStatus').text('Syncing...');
    $('#finalize-spinner').show();
    var host = $('#cloud-host-input').val();
    // syncType('site', host, function(err, data){
    //   if(err){
    //     $('#finalize-basicStatus').text('Failed cloud sync');
    //     $('#finalize-spinner').hide();
    //     return;
    //   }
      // syncType('siteRef', host, function(err, data){
        //syncType('floor', host, function(err, data){
          //syncType('equip', host, function(err, data){
            //syncType('point', host, function(err, data){
              //syncType('bacnetConn', host, function(err, data){
                syncType('user', host, function(err, data, odata){
                  odata = parseZinc(odata);
                  data = parseZinc(data);
                  var pwds = {};
                  for(var i = 0; i < odata.rows.length; i++){
                    pwds[odata.rows[i].dis] = odata.rows[i].userHMAC;
                  }
                  for(var i = 0; i < data.rows.length; i++){
                    var id = data.rows[i].id;
                    var dis = id.substring(id.indexOf(' ')+2);
                    dis = dis.substring(0, dis.length-1);
                    console.log(dis);
                    sendExpr('passwordSet('+id.substring(0,id.indexOf(' '))+', \"'+pwds[dis]+'\")', function(err,data){

                    }, 'text/plain', host, CloudProjectName);
                  }
                  // create haystack connector
                  sendExpr('kmcGetSysInfo("hostId")', function(err,data){
                    var data = parseZinc(data);
                    var hostId = data.rows[0].val;
                    var conn = {};
                    // dpb 2016-05-10: change connector name
          // conn.dis = 'HayStack Conn';
                    conn.dis = 'finSync Slave';
                    conn.haystackSlot = '|F|';
                    conn.masterWriteLevel = 13;   // dpb 2016-05-10: uncomment
                    conn.tz = 'UTC';   // dpb 2016-05-10: uncomment
                    conn.equipFilter = '';
                    conn.moduleName = 'proj';   // dpb 2016-05-10: uncomment
                    conn.hostId = hostId;   // dpb 2016-05-10: uncomment
                    conn.haystackConn = '✓';
                    conn.uri = "`"+host+"/api/"+CloudProjectName+"`";
                    conn.productName = 'KMC Commander';   // dpb 2016-05-10: uncomment
                    conn.pointFilter = '';
                    conn.productVersion = '2.1.14';   // dpb 2016-05-10: uncomment
                    conn.moduleVersion = '2.1.14';   // dpb 2016-05-10: uncomment
                    conn.finSync = '✓';   // dpb 2016-05-10: uncomment
                    conn.hostModel = 'Linux amd64 3.13.0-85-generic';   // dpb 2016-05-10: uncomment
                    conn.masterPollFreq = '|15s|';   // dpb 2016-05-10: uncomment
                    conn.username = 'finSyncProc';
                    createItem(conn, function(err,data){
                      var data = parseZinc(data);
                      console.log(data)
                      var id = data.rows[0].id;
                      sendExpr('passwordSet('+id+', "finSync123")', function(err,data){
                        sendExpr('finSyncGenerateIdsPromptCommit('+id+')', function(err,data){
                          sendExpr('finHaystackLearn('+id+', null)', function(err,data){
                            // dpb 2016-05-11: commit sync pushing
                          sendExpr('finSyncPushTreeCommit("",true,"",'+id+')', function(err,data){   // john fix this
                              // create his sync job
                              //var conId = '@1eb3bbb2-dfa644c1';
                              var job = {};
                              job.dis = 'Sync Job';
                              job.finSyncJob = '✓';
                              job.jobSchedule = 'every 1hr';
                              job.job = 'readAll(his and point).finSyncHisPush(readById('+id+'), thisYear())';
                              createItem(job, function(err,data){
                                var data = parseZinc(data);
                                //console.log(data);
                              }, 'text/plain');
                            }, 'text/plain');
                          }, 'text/plain');
                        }, 'text/plain');
                      }, 'text/plain');
                    }, 'text/plain');
                  }, 'text/plain');
                  $('#finalize-basicStatus').text('Done');
                  $('#finalize-spinner').hide();
                });
              //});
            //});
          //});
        //});
      //});
    //});
  });
  $('#build-submit').click(function(n){
    // modify the profiles and feed to the creation script
    // profiles come with points, objectId.
    // need to add deviceObject, connector, navTreeObject
    $('#create-site-spinner').show();
    $('#build-submit').addClass('disabled');
    for(var cdi in cDevices){
      var cd = cDevices[cdi];
      if(currentSite.site)
        cd.navTreeObject.aRef = currentSite.site.name;
      cd.navTreeObject.tempLicense = tempLicense;
      if(currentSite.floor)
        cd.navTreeObject.bRef = currentSite.floor.name;
    }

    var cardsUsed = {};
    function createDeviceOrQuit(next, cardNumToDo, vDevice){
      if(next > cDevices.length || !cDevices[next]){
        return applyRefs();
      }
      var device = JSON.parse(JSON.stringify(cDevices[next]));
      $('#build-basicStatus').text('Creating device '+device.navTreeObject.dis + ' ('+(next+1)+' of '+cDevices.length+')');
      var str = '';
      var cardNum = -1;
      if(!cardNumToDo)
        cardsUsed = {}; // reset
      var cardIndex = -1;
      var loc;
      $('#cardsHolder-'+device.deviceObject.objectId+' .cardsHolderCard').each(function(){
        // add to deviceObject
        cardNum++;
        if(!cardNumToDo && cardNum != 0){
          // split task to create virtual device with next card
          createDeviceOrQuit(next, cardNum);
          return;
        }
        if(cardNumToDo && cardNum != cardNumToDo){
          // on virtual device, only create the card you've been assigned
          return;
        }
        // add this card
        var skippedOfType = 0;
        //console.log('cu', cardsUsed);
        if(cDeviceProfiles[next].mobileCards.length){
          for(var i=0; i < cDeviceProfiles[next].mobileCards.length; i++){
            if(cardIndex > -1) break;
            for(var j in cDeviceProfiles[next].mobileCards[i]){
              if((j!='label'&&j!='customLabel') && ((cDeviceProfiles[next].mobileCards[i]['customLabel']==$(this).attr('data-label'))||(cDeviceProfiles[next].mobileCards[i]['label'] == $(this).attr('data-label')))){
                console.log(cardNumToDo, j, 'begin', cardsUsed)
                if(!cardsUsed[j])
                  cardsUsed[j]=0;
                if(cardsUsed[j] > skippedOfType){
                  console.log(cardNumToDo, j, 'skipped', skippedOfType+1)
                  skippedOfType++;
                  continue;
                }
                cardIndex = cDeviceProfiles[next].mobileCards[i][j];
                device.deviceObject[j]="✓";
                cardsUsed[j]++;
                console.log(cardNumToDo, j, 'found', cardIndex, cardsUsed, cDeviceProfiles[next].mobileCards[i])
                loc = $(this).find('input').val()||'';
                break;
              }
            }
          }
        }
      });
      //console.log('cu2', cardsUsed, cardIndex);
      if(cardNumToDo && cardIndex == -1){
        console.log(cardNumToDo, 'fail')
        return;
      }
      var cp;
      var cpoints = [];
      if(cardIndex > -1){
        // find the points matching this index
        for(var i = 0; i < device.points.length; i++){
          var pt = device.points[i];
          for(var j in pt){
            if(j.indexOf('Card')>=0 && pt[j] == cardIndex){
              cpoints.push(pt);
            }
          }
        }
      }
      if(cpoints.length)
        cp = cpoints[0];
      //console.log(cardNumToDo, cpoints, cardIndex)
      if(cardNumToDo && cpoints.length){
        // dpb 2016-05-10: change appendage
    // device.navTreeObject.dis += '.'+cp.navName;
    device.navTreeObject.dis += ' '+cp.bacnetCur;
        device.points = cpoints;
      }
      device.deviceObject['location'] = loc||device.navTreeObject.dis||'';
      var d = {};
      d.deviceObject = device.deviceObject;
      d.connector = device.connector;
      d.navTreeObject = device.navTreeObject;
      d.navTreeObject['tempLicense']=(!!tempLicense);
      d.points = device.points;
      // all cpoints get his and delete configPoint
      if(cpoints.length && device.points.length){
        for(var kk in device.points){
          for(var ll in cpoints){
            if(device.points[kk] == cpoints[ll]){
              device.points[kk]['his']="✓";
              device.points[kk]['hisCollectInterval']='n:15 min';
              if(device.points[kk]['configPoint'])
                delete device.points[kk]['configPoint'];
            }
          }
        }
      }
      for(var kk in d.points){
        if(!d.points[kk]['configPoint']){
          if(tempLicense){
              d.points[kk]['pointTemp']='✓';
              delete d.points[kk]['point'];
          }else{
              d.points[kk]['point']='✓';
              delete d.points[kk]['pointTemp'];
          }
        }else{
          delete d.points[kk]['point'];
        }
      }
      d.profileId = device.profileId;
      str = JSON.stringify(d);
      console.log(cardNumToDo, JSON.parse(str))
      str = str.replace(/\\/g, '\\\\\\\\');
      //console.log(str)
      sendExpr('ioWriteStr("'+str.replace(/"/g, '\\\\"')+'",`io/'+device.navTreeObject.dis+'.json`)', function(err,data){
        sendExpr('kmcJsonToSiteBuilder("'+device.navTreeObject.dis+'")', function(err,data){
          
        }, 'text/plain');
      });
      if(!cardNumToDo){
        setTimeout(function(){
          createDeviceOrQuit(next+1);
        }, 15000);
        startCapsIndicatorUpdateTimer();
      }
    }

    $('#build-basicStatus').text('Creating Site...');
    if(!currentSite){
      $('#build-basicStatus').text('Must setup the project');
      return;
    }
    createTopology(currentSite, function(){
      createDeviceOrQuit(0);
    });
  });

  function getSites(cb){
    $.ajax({
      type: 'GET',
      url: 'http://projects.kmccontrols.com/projects',
      headers: {          
        Accept: "application/json; charset=utf-8"
      },
      contentType: 'application/json',
      success: function(data){
        cb(data);
      }
    });
  }

  $('#build-reset').click(function(){
    var restultMsg='';
    sendExpr('readAll(site or siteRef or bacnetConn or haystackConn or siteTemp or siteTempRef or user or finSyncJob).finHardDelete()', function(err,data){
      if(err)
        $('#build-basicStatus').text('Site Reset could not be completed');
      else{
        $('#build-basicStatus').text('Site database is reset to factory defaults.');
        restultMsg=restoreTempLicense()
        $('#build-basicStatus').text(restultMsg);
      }
    });
    
  });

  function applyRefs(){
    // iterate through topologies, for each item
    // lookup item's id by dis in the db
    // for each item's children
    // lookup the child's id by dis in the db
    // apply the relevant ref referencing the parent's db id

    $('#topologies-panels').find('.jstree').each(function(){
      applyRefsFromTree(this);
    });
    function applyRefsFromTree(that){
      var topType = $(that).parent().parent().find('.panel-heading').text();
      var topology;
      for(var j in topologies){
        if(topologies[j].dis == topType)
          topology = topologies[j];
      }
      var data = $(that).jstree(true).get_json('#', {'no_state':true,'no_data':true});
      for(var i in data){
        cleanRecurse(data[i]);
        applyRefParent(data[i], topology);
      }
    }
    function applyRefParent(parent, topology){
      var sid = parent.text;
      sid = sid.substring(0, sid.indexOf(' ('));
      sendExpr('readAll(equip).find(c => c->dis==\"'+sid+'\")', function(err,data){
        if(!data.rows.length || !data.rows[0].id){
        }else{
          var parentId = '@'+data.rows[0].id.split(' ')[0].substring(2);
          if(parent.children)
            for(var i in parent.children){
              applyRefChild(parent.children[i], topology, parentId);
            }
        }
      });
    }
    function applyRefChild(child, topology, parentId){
      var sid = child.text;
      sid = sid.substring(0, sid.indexOf(' ('));
      sendExpr('readAll(equip).find(c => c->dis==\"'+sid+'\")', function(err,data){
        if(!data.rows.length || !data.rows[0].id){
        }else{
          var childId = '@'+data.rows[0].id.split(' ')[0].substring(2);
          var childMod = data.rows[0].mod.substring(2);
          if(topology.parentRef){
            var mod = {};
            mod[topology.parentRef] = parentId;
            modItem({id:childId,mod:childMod},mod,function(err, data){
            }, 'text/plain');
          }
        }
      });
    }

    if(currentSite.site){
      setTimeout(function(){
        //sendExpr('kmcConfigPointUnloader("'+currentSite.site.name+'")', function(err,data){
        $('#build-basicStatus').text('Done');
        $('#create-site-spinner').hide();
        //$('#sites-submit').removeClass('disabled');
        $('#build-cloud').show();
        //});
      //}, 8000);
      }, 6000);
      setTimeout(function(){
        startCapsIndicatorUpdateTimer();
      }, 4000);
    }else{
      $('#build-basicStatus').text('Done');
      $('#create-site-spinner').hide();
      //$('#sites-submit').removeClass('disabled');
      $('#build-cloud').show();
    }
  }

  // BX LAN Tab∂
  $('#ipEnabled').click(function(){
    $('.ip-form').attr('disabled', true);
    $('.ip-form-control').attr('disabled', false);
    var static = $('#ipTypeStatic')[0].checked;
    if(static){
      $('.ip-form').attr('disabled', false);
    }
  });
  $('#ipDisabled').click(function(){
    $('.ip-form').attr('disabled', true);
    $('.ip-form-control').attr('disabled', true);
  });
  $('.ip-form').attr('disabled', false);
  $('#ipTypeStatic').click(function(){
    $('.ip-form').attr('disabled', false);
  });
  $('#ipTypeDynamic').click(function(){
    $('.ip-form').attr('disabled', true);
  });

  $('.ip-form-control1').attr('disabled', true);
  $('#ipEnabled1').click(function(){
    $('.ip-form1').attr('disabled', true);
    $('.ip-form-control1').attr('disabled', false);
    var static = $('#ipTypeStatic1')[0].checked;
    if(static){
      $('.ip-form1').attr('disabled', false);
    }
  });
  $('#ipDisabled1').click(function(){
    $('.ip-form1').attr('disabled', true);
    $('.ip-form-control1').attr('disabled', true);
  });
  $('.ip-form1').attr('disabled', true);
  $('#ipTypeStatic1').click(function(){
    $('.ip-form1').attr('disabled', false);
  });
  $('#ipTypeDynamic1').click(function(){
    $('.ip-form1').attr('disabled', true);
  });

  $.ajax({
    type: 'GET',
    url: location.protocol+'//'+location.hostname+':8081/run?script=ifconfig eth0',
    headers: {          
      Accept: 'text/plain',         
      "Content-Type": "text/plain; charset=utf-8"
    },
    success: function(data){
      console.log('eth0', data.stdout.split(/\s+/g))
      var ifconfig = data.stdout.split(/\s+/g);
      var ip = ifconfig[6].split(':')[1];
      var netmask = ifconfig[8].split(':')[1];
      if(ifconfig[6] == 'BROADCAST'){
        ip = null;
        netmask = null;
      }
      $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script=route',
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8"
        },
        success: function(data){
          console.log('eth0', data.stdout.split('\n'))
          var route = data.stdout.split('\n');
          var gateway;
          for(var i in route){
            var d = route[i].split(/\s+/g);
            if(!d.length) continue;
            var g = d[d.length-1];
            if(g == 'eth0')
              if(d[0] == 'default'){
                gateway = d[1];
                break;
              }
          }

          if(ifconfig[6] == 'BROADCAST')
            gateway = null;

          $.ajax({
            type: 'GET',
            url: location.protocol+'//'+location.hostname+':8081/run?script=cat /etc/resolv.conf',
            headers: {          
              Accept: 'text/plain',         
              "Content-Type": "text/plain; charset=utf-8"
            },
            success: function(data){
              console.log('eth0', data.stdout.split('\n'));
              var resolv = data.stdout.split('\n');
              var ns = [];
              for(var i in resolv){
                var d = resolv[i].split(/\s+/g);
                if(!d.length) continue;
                if(d[0] == 'nameserver')
                  ns.push(d[1]);
              }
              console.log('eth0', ip, netmask, gateway, ns)
              if(ip)
                $('#ip-ipv4address').val(ip);
              if(netmask)
                $('#ip-netmask').val(netmask);
              if(gateway)
                $('#ip-gateway').val(gateway);
              if(ns && ns.length)
                $('#ip-dns').val(ns.join(' '));
            }
          });
        }
      });
    }
  });

  $.ajax({
    type: 'GET',
    url: location.protocol+'//'+location.hostname+':8081/run?script=ifconfig eth1',
    headers: {          
      Accept: 'text/plain',         
      "Content-Type": "text/plain; charset=utf-8"
    },
    success: function(data){
      console.log('eth1', data.stdout.split(/\s+/g))
      var ifconfig = data.stdout.split(/\s+/g);
      var ip = ifconfig[6].split(':')[1];
      var netmask = ifconfig[8].split(':')[1];
      if(ifconfig[6] == 'BROADCAST'){
        ip = null;
        netmask = null;
      }
      $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script=route',
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8"
        },
        success: function(data){
          console.log('eth1', data.stdout.split('\n'))
          var route = data.stdout.split('\n');
          var gateway;
          for(var i in route){
            var d = route[i].split(/\s+/g);
            if(!d.length) continue;
            var g = d[d.length-1];
            if(g == 'eth1')
              if(d[0] == 'default'){
                gateway = d[1];
                break;
              }
          }

          if(ifconfig[6] == 'BROADCAST')
            gateway = null;

          $.ajax({
            type: 'GET',
            url: location.protocol+'//'+location.hostname+':8081/run?script=cat /etc/resolv.conf',
            headers: {          
              Accept: 'text/plain',         
              "Content-Type": "text/plain; charset=utf-8"
            },
            success: function(data){
              console.log('eth1', data.stdout.split('\n'));
              var resolv = data.stdout.split('\n');
              var ns = [];
              for(var i in resolv){
                var d = resolv[i].split(/\s+/g);
                if(!d.length) continue;
                if(d[0] == 'nameserver')
                  ns.push(d[1]);
              }
              console.log('eth1', ip, netmask, gateway, ns)
              if(ip)
                $('#ip-ipv4address1').val(ip);
              if(netmask)
                $('#ip-netmask1').val(netmask);
              if(gateway)
                $('#ip-gateway1').val(gateway);
              if(ns && ns.length)
                $('#ip-dns1').val(ns.join(' '));
            }
          });
        }
      });
    }
  });

/*
auto eth0
iface eth0 inet static
  address 10.3.3.85
  netmask 255.255.0.0
  gateway 10.3.3.1
  dns-nameservers 10.1.1.8 10.1.1.6
*/
/*
auto eth1
iface eth1 inet dhcp
*/
  $('#btn-device-apply').click(function(){
    $('#device-basicStatus').text('');
    var static = $('#ipTypeStatic')[0].checked;
    var address = $('#ip-ipv4address').val();
    var netmask = $('#ip-netmask').val();
    var gateway = $('#ip-gateway').val();
    var dns = $('#ip-dns').val();
    var str;
    if(static){
      if(!address || !address.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/))
        return $('#device-basicStatus').text('Invalid IPv4 address');
      if(!netmask || !netmask.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/))
        return $('#device-basicStatus').text('Invalid Subnet mask');
      if(!gateway || !gateway.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/))
        return $('#device-basicStatus').text('Invalid Gateway');
      if(!dns || !dns.match(/^((?:[0-9]{1,3}\.){3}[0-9]{1,3}\s*)+$/))
        return $('#device-basicStatus').text('Invalid DNS');
      str = 'auto eth0\n';
      str += 'iface eth0 inet static\n';
      str += '\taddress '+address+'\n';
      str += '\tnetmask '+netmask+'\n';
      str += '\tgateway '+gateway+'\n';
      str += '\tdns-nameservers '+dns+'\n';
    }else{
      str = 'auto eth0\n';
      str += 'iface eth0 inet dhcp\n';
    }
    console.log(str)

    var static1 = $('#ipTypeStatic1')[0].checked;
    var address1 = $('#ip-ipv4address1').val();
    var netmask1 = $('#ip-netmask1').val();
    var gateway1 = $('#ip-gateway1').val();
    var dns1 = $('#ip-dns1').val();
    var str1;
    if(static1){
      if(!address1 || !address1.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/))
        return $('#device-basicStatus').text('Invalid IPv4 address');
      if(!netmask1 || !netmask1.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/))
        return $('#device-basicStatus').text('Invalid Subnet mask');
      if(!gateway1 || !gateway1.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/))
        return $('#device-basicStatus').text('Invalid Gateway');
      if(!dns1 || !dns1.match(/^((?:[0-9]{1,3}\.){3}[0-9]{1,3}\s*)+$/))
        return $('#device-basicStatus').text('Invalid DNS');
      str1 = 'auto eth1\n';
      str1 += 'iface eth1 inet static\n';
      str1 += '\taddress '+address1+'\n';
      str1 += '\tnetmask '+netmask1+'\n';
      str1 += '\tgateway '+gateway1+'\n';
      str1 += '\tdns-nameservers '+dns1+'\n';
    }else{
      str1 = 'auto eth1\n';
      str1 += 'iface eth1 inet dhcp\n';
    }
    console.log(str1)

    var num = 2;
    if(!$('#ipEnabled')[0].checked)
      num--;
    if(!$('#ipEnabled1')[0].checked)
      num--;
    if(num == 0)
      return;

    if($('#ipEnabled')[0].checked){
      $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script='+encodeURIComponent('echo "'+str+'" > /etc/network/interfaces.d/eth0'),
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8"
        },
        success: function(data){
          console.log(data);
          num--;
        }
      }).fail(function(){
        num -= 2;
      });
    }

    if($('#ipEnabled1')[0].checked){
      $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script='+encodeURIComponent('echo "'+str1+'" > /etc/network/interfaces.d/eth1'),
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8"
        },
        success: function(data){
          console.log(data);
          num--;
        }
      }).fail(function(){
        num -= 2;
      });
    }

    var t = setInterval(function(){
      if(num<0){
        // error
        clearInterval(t);
        return $('#device-basicStatus').text('Could not set network settings. Please try again');
      }else if(num==0){
        clearInterval(t);
        return $('#device-basicStatus').text('Settings changed successfully. Reboot device to apply');
      }
    }, 500);
  });

  $('#btn-device-reboot').click(function(){
    $('#btn-device-reboot').addClass('disabled');
    $('#btn-device-reboot').text('Rebooting...');
    var count = 90;
    setInterval(function(){
      count--;
      $('#btn-device-reboot').text('Rebooting... ('+count+' seconds)');
    }, 1000);
    setTimeout(function(){
      location.reload();
    }, 60000);
    $.ajax({
      type: 'GET',
      url: location.protocol+'//'+location.hostname+':8081/run?script=reboot',
      headers: {          
        Accept: 'text/plain',         
        "Content-Type": "text/plain; charset=utf-8"
      },
      success: function(data){
      }
    });
  });

  // Finalize Tab
  var wifiEnabled = false;
  $('.wifi-form').attr('disabled', !wifiEnabled);
  $('#wifiEnabledCheckbox').click(function(){
    wifiEnabled = !wifiEnabled;
    $('.wifi-form').attr('disabled', !wifiEnabled);
  });

  var sshEnabled = false;
  $('.ssh-form').attr('disabled', !sshEnabled);
  $('#sshEnabledCheckbox').click(function(){
    sshEnabled = !sshEnabled;
    $('.ssh-form').attr('disabled', !sshEnabled);
  });

  $('#finalize-apply').click(function(){
    var pausername = $('#project-username').val();
    var papassword = $('#project-password').val();
    if(!pausername || !papassword){
      return $('#finalize-basicStatus').text('Must provide a Local Project Account');
    }
  });


  $('#finalize-uploadLicense-cloud').click(function(){
    // make sure project is up to date
    var sites = getSites(function(data){
      $('#fetch-sites-spinner').hide();
      $('#sites-fetch-btn').removeClass('disabled');
      Sites = data;
      var ht = '';
      for(var k in data){
        ht += '<option value="'+data[k].objectId+'">'+data[k].name+'</option>';
      }
      $('#sites-project').html(ht);

      if(data && data[0]){
        changeProject(data[0]);
        continueFetchLicense();
      }else{
        $('#build-basicStatus').text('Could not fetch project');
      }
    });
    function continueFetchLicense(){
      console.log(currentSite)
      if(!currentSite || !currentSite.box.data || !currentSite.box.data.license)
        return $('#build-basicStatus').text('Could not fetch license');
      $.ajax({
        type: 'GET',
        url: 'http://projects.kmccontrols.com/getLicense?license='+currentSite.box.data.license,
        xhrFields: {
          withCredentials: true
        },
        success: function(data){
          if(!data)
            return $('#build-basicStatus').text('Could not fetch license');
          console.log(data);
          var d = data.split('\n');
          var caps;
          for(var i in d){
            if(d[i].indexOf('finstack.limit')>=0){
              caps = d[i].substring(d[i].indexOf('=')+1);
              break;
            }
          }
          if(!caps || !parseInt(caps))
            return $('#build-basicStatus').text('Could not read license');
          newLicense = data;
          newLicenseCaps = parseInt(caps);
          updateCapCount();
          $('#build-licenseCaps').text('License has '+caps+' caps');

          $('#finalize-uploadLicense-set').show();
        }
      }).fail(function(){
        return $('#build-basicStatus').text('Could not fetch license');
      });
    }
  });

  $('#finalize-uploadLicense-set').click(function(){
    var usedCaps = 5001;
    if(!newLicense || !newLicenseCaps)
      return $('#build-basicStatus').text('Invalid license');
    updateCapCount(function(err, licLimits){
      if(err)
        return $('#build-basicStatus').text('Could not get cap usage data');
      console.log(licLimits)
      usedCaps = licLimits['licenseUsed'];
      if(licLimits['tempUsed']>usedCaps)
        usedCaps = licLimits['tempUsed'];
      if(newLicenseCaps < usedCaps)
        return $('#build-basicStatus').text('New license does not have enough caps');
      // write the old license to backup location
      var oldName = 'license.old.'+licLimits['licenseStatus']+'.props';
      $.ajax({
        type: 'GET',
        url: location.protocol+'//'+location.hostname+':8081/run?script=cat ./opt/finstack/etc/proj/license.props',
        headers: {          
          Accept: 'text/plain',         
          "Content-Type": "text/plain; charset=utf-8"
        },
        success: function(data){
          console.log(data)
          $.ajax({
            type: 'GET',
            url: location.protocol+'//'+location.hostname+':8081/run?script='+encodeURIComponent('echo "'+data.stdout+'" > opt/finstack/etc/proj/'+oldName),
            headers: {          
              Accept: 'text/plain',         
              "Content-Type": "text/plain; charset=utf-8"
            },
            success: function(data){
              console.log(data)
              $.ajax({
                type: 'GET',
                url: location.protocol+'//'+location.hostname+':8081/run?script='+encodeURIComponent('echo "'+newLicense+'" > opt/finstack/etc/proj/license.props'),
                headers: {          
                  Accept: 'text/plain',         
                  "Content-Type": "text/plain; charset=utf-8"
                },
                success: function(data){
                  var statusMsg=$('#build-basicStatus')
                  statusMsg.text('Restarting service now...');
                   restartService(statusMsg);
                }
              }).fail(function(){
                return $('#build-basicStatus').text('Could not update license');
              });
            }
          }).fail(function(){
            return $('#build-basicStatus').text('Could not update license');
          });
        }
      }).fail(function(){
        return $('#build-basicStatus').text('Could not update license');
      });
    });
  });

  function restoreTempLicense(){
    var oldName = 'license.old.temp.props';
    var newName = 'license.new.props';
    //Read the installed Good License
    $.ajax({
      type: 'GET',
      url: location.protocol+'//'+location.hostname+':8081/run?script=cat ./opt/finstack/etc/proj/license.props',
      headers: {
        Accept: 'text/plain',
        "Content-Type": "text/plain; charset=utf-8"
      },
      success: function(data){
        //verify this is not a temp license
        if(!data)
        return $('#build-basicStatus').text('Could not open permanent license');
        var d = data.stdout.split('\n')
        var caps;
        for(var i in d){
          if(d[i].indexOf('finstack.limit')>=0){
           caps = d[i].substring(d[i].indexOf('=')+1);
           break;
        }
      }
      if(!caps || !parseInt(caps))
        return $('#build-basicStatus').text('Could not read license');
      if(caps<100)
        return $('#build-basicStatus').text('Permanent license not installed. Continuing to use temp license.');
      newLicense = data;
      newLicenseCaps = parseInt(caps);
      $('#build-licenseCaps').text('New license verified: '+caps+' caps');
        //Store a backup of the new license
        $.ajax({
          type: 'GET',
          url: location.protocol+'//'+location.hostname+':8081/run?script='+encodeURIComponent('echo "'+newLicense.stdout+'" > opt/finstack/etc/proj/'+newName),
          headers: {
            Accept: 'text/plain',
            "Content-Type": "text/plain; charset=utf-8"
          },
          //Verify stored temp license is good
          success: function(data){
            $.ajax({
              type: 'GET',
              url: location.protocol+'//'+location.hostname+':8081/run?script=cat ./opt/finstack/etc/proj/'+oldName,
              headers: {
              Accept: 'text/plain',
              "Content-Type": "text/plain; charset=utf-8"
              },
              success: function(tempLicData){
                //verify the expiration
                if(!tempLicData)
                  return $('#build-basicStatus').text('Could not open temp license');
                var d = tempLicData.stdout.split('\n');
                var expireDate;
                for(var i in d){
                  if(d[i].indexOf('expires')>=0){
                    expireDate = d[i].substring(d[i].indexOf('=')+1);
                    break;
                  }
                }
                if(!expireDate || isNaN(Date.parse(expireDate)))
                  return $('#build-basicStatus').text('Could not read temp license expiration. Continuing to use current license.');
                var dateNow=(new Date()).toISOString().slice(0,10);
                if(expireDate < dateNow)
                  return $('#build-basicStatus').text('Temp license has expired. Continuing to use current license.');
                //Restore the Temp License
                $.ajax({
                  type: 'GET',
                  url: location.protocol+'//'+location.hostname+':8081/run?script=cp ./opt/finstack/etc/proj/'+oldName+' ./opt/finstack/etc/proj/license.props',
                  headers: {
                    Accept: 'text/plain',
                    "Content-Type": "text/plain; charset=utf-8"
                  },
                  success: function(data){
                    var statusMsg=$('#build-basicStatus');
                    statusMsg.text('Restarting service now...');
                    restartService(statusMsg);
                  }
                }).fail(function(){
                  return $('#build-basicStatus').text('Could not make the temp license the active license'); //failed to copy the old temp license to active license.props
                });
              }
            }).fail(function(){
              return $('#build-basicStatus').text('Unable to use temp licnese. Continuing to use current license.');
            });
          }
        }).fail(function(){
          return $('#build-basicStatus').text('Could not store backup of the active (new) license');
        });
      }
    }).fail(function(){
      return $('#build-basicStatus').text('Could not read the active license');
    });
  }

  $('#build-updateSite').click(function(){
    updateCapCount(function(err, data){
      tempLicense = (data['licenseStatus']=='temp');
      startLicenseStatusUpdateTimer();
      $('#build-basicStatus').text('Updating...');
      setTimeout(function(){
        $('#build-basicStatus').text('');
        sendExpr('kmcConfigPointUnloader("'+currentSite.site.name+'")', function(err,data){
        });
      }, 5000);
    })
  })
  
  var startCapsIndicatorUpdateTimer = function () {
    doWaitForCapsUsageUpdate(35, 35);
  };
  var doWaitForCapsUsageUpdate = function (totalSeconds, nSecondsLeft) {
    setTimeout(function () {
      if (nSecondsLeft <= 0) {
           updateCapCount();
        return;
      }

      doWaitForCapsUsageUpdate(totalSeconds, nSecondsLeft-1);
    }, 100);
  };
  
  updateCapCount();

  var startLicenseStatusUpdateTimer = function () {
    doWaitLicenseStatusUpdate(5, 5);
  };
  var doWaitLicenseStatusUpdate = function (totalSeconds, nSecondsLeft) {
    setTimeout(function () {
      if (nSecondsLeft <= 0) {
        console.log(tempLicense)
        if (tempLicense) {
          sendExpr('kmcTagAllForProjectLicense(true)', function(err,data){}, 'text/plain');
        }else{sendExpr('kmcTagAllForProjectLicense(false)', function(err,data){}, 'text/plain');
        }
        startCapsIndicatorUpdateTimer();
        return;
      }

      doWaitLicenseStatusUpdate(totalSeconds, nSecondsLeft-1);
    }, 100);
  };
  //End $(document).ready
});
