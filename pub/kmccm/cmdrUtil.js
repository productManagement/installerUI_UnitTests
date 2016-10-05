
function sendExpr(expr, cb, accept, host, pname){
  var h = '';
  if(host)
    h = host;
  var headers = {          
    Accept: accept||"application/json; charset=utf-8",         
    "Content-Type": "text/plain; charset=utf-8"
  };
  // if(host)
  //   headers['Cookie'] = CookieCloud
  var data = 'ver:"2.0"\n'+
    'expr\n'+
    '"'+expr.replace(/"/g,'\\\"')+'"';
    console.log(h+'/api/'+(pname?pname:'kmcCommanderBxProject')+'/evalAll')
  $.ajax({
    type: 'POST',
    url: h+'/api/'+(pname?pname:'kmcCommanderBxProject')+'/evalAll',
    headers: headers,
    data: data,
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

function parseZinc(zinc){
      var ret = {};
      ret.cols = [];
      ret.rows = [];
  if(zinc){
      var rows = zinc.split('\n');
      var meta = rows[0];
      var headers = rows[1].split(',');

      function parseTerm(term, name){
        if(term[0] == '"')
          return term.substring(1,term.length-1);
        if(term[0] == '@')
          return term;
        if(term[0] == '`')
          return term;
        if(term == 'M')
          return '✓';
        if(term[term.length-1] == 'Z' || (name && name == 'mod'))
          return term;
        return parseInt(term);
      }

      ret.meta = {
        ver: meta.split(':')[1].substring(1,4)
      }
      ret.cols = [];
      for(var k = 0; k < headers.length; k++){
        var obj = {};
        obj.name = headers[k];
        ret.cols.push(obj);
      }
      ret.rows = [];
      for(var i = 2; i < rows.length; i++){
        if(!rows[i]) continue;
        var str = rows[i];
        var inQuotes = false;
        var inCoords = false;
        var escaped = 0;
        var termStart = 0;
        var termEnd = 0;
        var data = {};
        var termNum = 0;
        var term;
        for(var j = 0; j < str.length; j++){
          if(str[j] == '\\'){
            escaped++;
            continue;
          }
          // if not escaped, track if we're in quotes
          if((escaped % 2) == 0){
            escaped = 0;
            if(str[j] == '"'){
              inQuotes = !inQuotes;
              continue;
            }
          }
        // if not escaped, track if we're in geoCoord
          if((escaped % 2) == 0){
            escaped = 0;
            if(str[j] == 'C' && str[j+1] == '('){
              inCoords = true;
              continue;
            }
            if(str[j] == ')'){
              inCoords = false;
              continue;
            }
          }
          // commas delimit if we're not in quotes or coordinates
          if(str[j] == ',' && !inQuotes && !inCoords){
            if (ret.cols[termNum]){
                termEnd = j-1;
                term = str.substring(termStart, termEnd+1);
                data[ret.cols[termNum].name] = parseTerm(term);
                termNum++;
                termStart = j+1;
            }
          }
          escaped = 0;
        }
        term = str.substring(termStart);
        if (ret.cols[termNum]){
            data[ret.cols[termNum].name] = parseTerm(term, ret.cols[termNum].name);
            termNum++;
            ret.rows.push(data);
        }
      }
      return ret;
    }else{
      return ret
    }
}
